import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllPosts, getAdjacentPosts, getPostBySlug } from '@/lib/posts'
import { PostContent } from '@/components/PostContent'
import { PostNavigation } from '@/components/PostNavigation'
import { ReadingProgress } from '@/components/ReadingProgress'
import { BackLink } from '@/components/BackLink'
import { TableOfContents } from '@/components/TableOfContents'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return {}

  const images = post.image
    ? [{ url: post.image, width: 1200, height: 630, alt: post.title }]
    : []

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
      tags: post.tags,
      ...(images.length > 0 && { images }),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      ...(images.length > 0 && { images: [images[0].url] }),
    },
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) notFound()

  const { prev, next } = getAdjacentPosts(slug)

  return (
    <>
      <ReadingProgress />

      {/* ─── Post header ───────────────────────────── */}
      <div className="page-header-bg border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
          <BackLink />

          <div className="mt-6 flex flex-wrap gap-2">
            {post.draft && <span className="tag tag-amber">draft</span>}
            {post.tags.map((tag) => (
              <Link key={tag} href={`/blog/tag/${tag}`} className="tag tag-green">
                {tag}
              </Link>
            ))}
          </div>

          <h1 className="mt-4 font-display text-3xl font-black leading-tight text-text-bright md:text-4xl lg:text-5xl">
            {post.title}
          </h1>

          <div className="mt-5 flex items-center gap-4 font-mono text-xs text-text-muted">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span>·</span>
            <span>{post.readingTime} min read</span>
          </div>
        </div>
      </div>

      {/* ─── Hero image ────────────────────────────── */}
      {post.image && (
        <div className="mx-auto max-w-3xl px-6 pt-10">
          <div className="relative aspect-[1200/630] w-full overflow-hidden rounded-lg border border-border">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      )}

      {/* ─── Post body ─────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-6 py-14">
        {post.toc.length > 2 ? (
          <div className="lg:flex lg:gap-14 lg:items-start">
            <div className="min-w-0 flex-1">
              <TableOfContents toc={post.toc} variant="mobile" />
              <PostContent html={post.htmlContent} />
              <div className="mt-16 border-t border-border pt-8">
                <BackLink />
              </div>
              <PostNavigation prev={prev} next={next} />
            </div>
            <TableOfContents toc={post.toc} variant="desktop" />
          </div>
        ) : (
          <>
            <PostContent html={post.htmlContent} />
            <div className="mt-16 border-t border-border pt-8">
              <BackLink />
            </div>
            <PostNavigation prev={prev} next={next} />
          </>
        )}
      </div>
    </>
  )
}
