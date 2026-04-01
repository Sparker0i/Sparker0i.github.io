'use client'

import { useRouter } from 'next/navigation'

export function BackLink() {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    // history.length > 1 means the user navigated here from somewhere else
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/blog')
    }
  }

  return (
    <a
      href="/blog"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 font-mono text-xs text-text-muted hover:text-accent transition-colors duration-150"
    >
      <span aria-hidden>←</span>
      back to blog
    </a>
  )
}
