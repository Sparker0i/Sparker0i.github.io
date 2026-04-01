import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts } from '@/lib/posts'

interface Props {
  params: Promise<{ tag: string }>
}

export async function generateStaticParams() {
  const posts = getAllPosts()
  const tags = Array.from(new Set(posts.flatMap((p) => p.tags)))
  return tags.map((tag) => ({ tag }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params
  return {
    title: `Posts tagged "${tag}"`,
    description: `Blog posts tagged with ${tag}.`,
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params
  const posts = getAllPosts().filter((p) => p.tags.includes(tag))

  return (
    <>
      {/* ─── Page header ───────────────────────────── */}
      <div className="page-header-bg border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-24">
          <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
            writing
          </p>
          <h1 className="mt-3 font-display text-4xl font-black text-text-bright md:text-5xl">
            <span className="tag tag-green text-2xl md:text-3xl align-middle mr-3">{tag}</span>
          </h1>
          <p className="mt-3 font-body text-base text-text-muted">
            {posts.length} post{posts.length !== 1 ? 's' : ''} tagged with &ldquo;{tag}&rdquo;
          </p>
          <Link
            href="/blog"
            className="mt-4 inline-flex items-center gap-1 font-mono text-xs text-text-muted hover:text-accent transition-colors duration-150"
          >
            ← all posts
          </Link>
        </div>
      </div>

      {/* ─── Post listing ──────────────────────────── */}
      <div className="mx-auto max-w-4xl px-6 py-12">
        {posts.length === 0 ? (
          <p className="font-mono text-sm text-text-muted">No posts with this tag.</p>
        ) : (
          <ul className="space-y-0">
            {posts.map((post) => (
              <li key={post.slug} className="border-b border-border last:border-b-0 py-8">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  {post.draft && (
                    <span className="tag tag-amber">draft</span>
                  )}
                  {post.tags.map((t) => (
                    <Link
                      key={t}
                      href={`/blog/tag/${t}`}
                      className={`tag tag-green${t === tag ? ' ring-1 ring-accent/50' : ''}`}
                    >
                      {t}
                    </Link>
                  ))}
                </div>

                <Link
                  href={`/blog/${post.slug}`}
                  className="group block"
                >
                  <h2 className="font-display text-xl font-bold text-text-bright group-hover:text-accent transition-colors duration-150 md:text-2xl">
                    {post.title}
                  </h2>

                  <p className="mt-2 font-body text-sm leading-relaxed text-text-muted">
                    {post.excerpt}
                  </p>

                  <div className="mt-4 flex items-center gap-4 font-mono text-xs text-text-muted">
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                    <span>·</span>
                    <span>{post.readingTime} min read</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
