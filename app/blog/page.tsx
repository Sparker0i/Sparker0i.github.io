import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts } from '@/lib/posts'
import DateDisplay from '@/components/DateDisplay'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Technical writing on distributed systems, platform engineering, and Go.',
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <>
      {/* ─── Page header ───────────────────────────── */}
      <div className="page-header-bg border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-24">
          <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
            writing
          </p>
          <h1 className="mt-3 font-display text-4xl font-black text-text-bright md:text-5xl">
            Blog
          </h1>
          <p className="mt-3 font-body text-base text-text-muted">
            Notes on distributed systems, platform engineering, and Go.
          </p>
        </div>
      </div>

      {/* ─── Post listing ──────────────────────────── */}
      <div className="mx-auto max-w-4xl px-6 py-12">
        {posts.length === 0 ? (
          <p className="font-mono text-sm text-text-muted">No posts yet.</p>
        ) : (
          <ul className="space-y-0">
            {posts.map((post) => (
              <li key={post.slug} className="border-b border-border last:border-b-0 py-8">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  {post.draft && (
                    <span className="tag tag-amber">draft</span>
                  )}
                  {post.tags.map((tag) => (
                    <Link key={tag} href={`/blog/tag/${tag}`} className="tag tag-green">
                      {tag}
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
                    <DateDisplay dateStr={post.date} />
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
