'use client'

import { useEffect, useState } from 'react'
import type { TocItem } from '@/lib/posts'

interface Props {
  toc: TocItem[]
  variant: 'mobile' | 'desktop'
}

export function TableOfContents({ toc, variant }: Props) {
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + 120
      let current = toc[0]?.id ?? ''
      for (const item of toc) {
        const el = document.getElementById(item.id)
        if (el && el.offsetTop <= scrollY) current = item.id
      }
      setActiveId(current)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [toc])

  const navContent = (
    <ul className="space-y-1.5">
      {toc.map((item) => (
        <li key={item.id} className={item.level === 3 ? 'pl-3' : ''}>
          <a
            href={`#${item.id}`}
            className={`block text-xs leading-snug transition-colors duration-150 font-mono ${
              activeId === item.id
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {item.text}
          </a>
        </li>
      ))}
    </ul>
  )

  if (variant === 'mobile') {
    return (
      <details className="lg:hidden mb-8 border border-[var(--color-border)] rounded-md overflow-hidden">
        <summary className="px-4 py-2.5 cursor-pointer select-none font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)] bg-[var(--color-surface)] list-none flex items-center justify-between">
          <span>On this page</span>
          <span className="opacity-50">▾</span>
        </summary>
        <nav className="px-4 py-3 bg-[var(--color-surface)] border-t border-[var(--color-border)]">
          {navContent}
        </nav>
      </details>
    )
  }

  return (
    <aside className="hidden lg:block w-[200px] flex-shrink-0">
      <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
          On this page
        </p>
        <nav>{navContent}</nav>
      </div>
    </aside>
  )
}
