import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeShiki, { type RehypeShikiOptions } from '@shikijs/rehype'
import { transformerNotationHighlight } from '@shikijs/transformers'

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

export interface Post {
  slug: string
  title: string
  date: string
  lastmod?: string
  tags: string[]
  excerpt: string
  readingTime: number
  wordCount: number
  draft: boolean
  image?: string
}

export interface TocItem {
  id: string
  text: string
  level: 2 | 3
}

export interface PostWithContent extends Post {
  htmlContent: string
  toc: TocItem[]
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Remark plugin: extracts h2/h3 headings into the provided array.
 */
function makeRemarkExtractHeadings(headings: TocItem[]) {
  return function remarkExtractHeadings() {
    return (tree: {
      type: string
      depth?: number
      children?: unknown[]
      [key: string]: unknown
    }) => {
      function walk(node: {
        type: string
        depth?: number
        children?: unknown[]
        [key: string]: unknown
      }) {
        if (node.type === 'heading' && (node.depth === 2 || node.depth === 3)) {
          const children = (node.children ?? []) as Array<{ type: string; value?: string }>
          const text = children
            .filter((c) => c.type === 'text' || c.type === 'inlineCode')
            .map((c) => c.value ?? '')
            .join('')
          headings.push({ id: slugify(text), text, level: node.depth as 2 | 3 })
        }
        if (Array.isArray(node.children)) {
          node.children.forEach((child) => walk(child as Parameters<typeof walk>[0]))
        }
      }
      walk(tree as Parameters<typeof walk>[0])
    }
  }
}

/**
 * Rehype plugin: adds `id` attributes to h2/h3 elements for anchor linking.
 */
function rehypeAddHeadingIds() {
  type HastNode = {
    type: string
    tagName?: string
    properties?: Record<string, unknown>
    value?: string
    children?: HastNode[]
  }

  function extractText(nodes: HastNode[]): string {
    return nodes
      .map((n) => {
        if (n.type === 'text') return n.value ?? ''
        if (n.type === 'element' && n.children) return extractText(n.children)
        return ''
      })
      .join('')
  }

  return (tree: HastNode) => {
    function walk(node: HastNode) {
      if (
        node.type === 'element' &&
        (node.tagName === 'h2' || node.tagName === 'h3')
      ) {
        node.properties = node.properties ?? {}
        node.properties.id = slugify(extractText(node.children ?? []))
      }
      node.children?.forEach(walk)
    }
    walk(tree)
  }
}

function calculateReadingTime(content: string): number {
  const wordCount = content.split(/\s+/).filter(Boolean).length
  return Math.ceil(wordCount / 200)
}

function countWords(content: string): number {
  return content.split(/\s+/).filter(Boolean).length
}

/**
 * Remark plugin: attaches data-lang and data-filename to code nodes
 * so they survive as attributes on <code> elements in the HTML output.
 */
function remarkCodeMeta() {
  return (tree: {
    type: string
    children?: unknown[]
    [key: string]: unknown
  }) => {
    function walk(node: {
      type: string
      lang?: string
      meta?: string
      data?: { hProperties?: Record<string, string> }
      children?: unknown[]
      [key: string]: unknown
    }) {
      if (node.type === 'code') {
        node.data = node.data ?? {}
        node.data.hProperties = node.data.hProperties ?? {}

        if (node.lang) {
          node.data.hProperties['data-lang'] = node.lang
        }
        if (node.meta) {
          const m = node.meta.match(/filename="?([^"\s]+)"?/)
          if (m) {
            node.data.hProperties['data-filename'] = m[1]
          }
        }
      }
      if (Array.isArray(node.children)) {
        node.children.forEach((child) =>
          walk(
            child as Parameters<typeof walk>[0]
          )
        )
      }
    }
    walk(tree as Parameters<typeof walk>[0])
  }
}

/**
 * Remark plugin: converts Hugo Instagram shortcodes {{< instagram ID >}}
 * to a special data attribute marker that PostContent can hydrate.
 */
function remarkInstagramShortcode() {
  return (tree: { type: string; children?: unknown[] }) => {
    const visit = (node: {
      type: string
      value?: string
      children?: unknown[]
      [key: string]: unknown
    }) => {
      if (node.type === 'paragraph' && node.children) {
        const children = node.children as Array<{
          type: string
          value?: string
          [key: string]: unknown
        }>

        for (let i = 0; i < children.length; i++) {
          const child = children[i]
          if (child.type === 'text' && child.value) {
            const match = child.value.match(/{{<\s*instagram\s+(\w+)\s*>}}/)
            if (match) {
              const postId = match[1]
              // Replace with html node that will be preserved
              const newNode: typeof child = {
                type: 'html',
                value: `<div data-instagram-embed="${postId}"></div>`,
              }
              children[i] = newNode
            }
          }
        }
      }

      if (Array.isArray(node.children)) {
        node.children.forEach((child) => visit(child as Parameters<typeof visit>[0]))
      }
    }

    visit(tree as Parameters<typeof visit>[0])
  }
}

export async function getPostBySlug(slug: string): Promise<PostWithContent | null> {
  const filePath = path.join(BLOG_DIR, `${slug}.md`)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)

  // Hide draft posts in production
  if (data.draft && process.env.NODE_ENV === 'production') return null

  const toc: TocItem[] = []

  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkCodeMeta)
    .use(remarkInstagramShortcode)
    .use(makeRemarkExtractHeadings(toc))
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeAddHeadingIds)
    .use(rehypeShiki, {
      theme: 'github-dark-dimmed',
      transformers: [
        transformerNotationHighlight(),
        {
          pre(node) {
            node.properties['data-language'] = this.options.lang
          },
        },
      ],
    } satisfies RehypeShikiOptions)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(content)

  return {
    slug,
    title: data.title ?? '',
    date: data.date ?? '',
    lastmod: data.lastmod ?? undefined,
    tags: data.tags ?? [],
    excerpt: data.excerpt ?? '',
    readingTime: calculateReadingTime(content),
    wordCount: countWords(content),
    draft: data.draft ?? false,
    image: data.image ?? undefined,
    htmlContent: String(result),
    toc,
  }
}

export function getAdjacentPosts(slug: string): { prev: Post | null; next: Post | null } {
  const posts = getAllPosts()
  const index = posts.findIndex((p) => p.slug === slug)
  if (index === -1) return { prev: null, next: null }
  // posts are sorted newest-first; "older" is higher index, "newer" is lower index
  return {
    prev: posts[index + 1] ?? null,  // older post
    next: posts[index - 1] ?? null,  // newer post
  }
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(BLOG_DIR)) return []

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'))
  const isProd = process.env.NODE_ENV === 'production'

  const posts = files.map((filename) => {
    const slug = filename.replace(/\.md$/, '')
    const filePath = path.join(BLOG_DIR, filename)
    const raw = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(raw)

    return {
      slug,
      title: data.title ?? '',
      date: data.date ?? '',
      lastmod: data.lastmod ?? undefined,
      tags: data.tags ?? [],
      excerpt: data.excerpt ?? '',
      readingTime: calculateReadingTime(content),
      wordCount: countWords(content),
      draft: data.draft ?? false,
      image: data.image ?? undefined,
    } satisfies Post
  })

  return posts
    .filter((p) => !isProd || !p.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}
