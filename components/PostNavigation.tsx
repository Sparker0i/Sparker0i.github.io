import Link from 'next/link'
import type { Post } from '@/lib/posts'

interface Props {
  prev: Post | null
  next: Post | null
}

export function PostNavigation({ prev, next }: Props) {
  if (!prev && !next) return null

  return (
    <nav className="mt-16 grid grid-cols-2 gap-4 border-t border-border pt-8 font-mono text-sm">
      {prev ? (
        <Link
          href={`/blog/${prev.slug}`}
          className="group flex flex-col gap-1 rounded-lg border border-border p-4 transition-colors hover:border-accent hover:bg-surface"
        >
          <span className="text-xs text-text-muted">← Previous</span>
          <span className="line-clamp-2 text-text-base group-hover:text-accent">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          href={`/blog/${next.slug}`}
          className="group flex flex-col gap-1 rounded-lg border border-border p-4 text-right transition-colors hover:border-accent hover:bg-surface"
        >
          <span className="text-xs text-text-muted">Next →</span>
          <span className="line-clamp-2 text-text-base group-hover:text-accent">
            {next.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  )
}
