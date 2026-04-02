'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Fuse from 'fuse.js'
import type { Post } from '@/lib/posts'

interface SearchDialogProps {
  posts: Post[]
}

export function SearchDialog({ posts }: SearchDialogProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()

  const fuse = useMemo(
    () =>
      new Fuse(posts, {
        keys: [
          { name: 'title', weight: 3 },
          { name: 'tags', weight: 2 },
          { name: 'excerpt', weight: 1 },
        ],
        threshold: 0.4,
        includeScore: true,
      }),
    [posts],
  )

  const results = useMemo(() => {
    if (!query.trim()) return posts.slice(0, 8).map((p) => ({ item: p }))
    return fuse.search(query).slice(0, 8)
  }, [query, fuse, posts])

  const openDialog = useCallback(() => {
    setOpen(true)
    setQuery('')
    setSelectedIndex(0)
  }, [])

  const closeDialog = useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  const navigate = useCallback(
    (slug: string) => {
      closeDialog()
      router.push(`/blog/${slug}`)
    },
    [closeDialog, router],
  )

  // ⌘K / Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        open ? closeDialog() : openDialog()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, openDialog, closeDialog])

  // Nav button dispatches this event
  useEffect(() => {
    const handler = () => openDialog()
    window.addEventListener('open-search', handler)
    return () => window.removeEventListener('open-search', handler)
  }, [openDialog])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 10)
      return () => clearTimeout(t)
    }
  }, [open])

  // Scroll selected item into view
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeDialog()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      navigate(results[selectedIndex].item.slug)
    }
  }

  if (!open) return null

  return (
    <div className="search-overlay" onClick={closeDialog} role="dialog" aria-modal aria-label="Search posts">
      <div className="search-dialog" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        {/* Input row */}
        <div className="search-input-wrap">
          <svg className="search-icon" viewBox="0 0 20 20" fill="none" aria-hidden>
            <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="m13 13 3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            className="search-input"
            type="text"
            placeholder="Search posts…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            aria-label="Search query"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="search-esc-hint">esc</kbd>
        </div>

        {/* Results */}
        <ul className="search-results" role="listbox" aria-label="Search results">
          {results.length === 0 && query.trim() && (
            <li className="search-no-results">No results for &ldquo;{query}&rdquo;</li>
          )}
          {results.map(({ item: post }, i) => {
            const active = i === selectedIndex
            return (
              <li key={post.slug} role="option" aria-selected={active}>
                <button
                  ref={active ? selectedRef : undefined}
                  className={`search-result-item${active ? ' search-result-item--active' : ''}`}
                  onClick={() => navigate(post.slug)}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <span className="search-result-title">{post.title}</span>
                  <span className="search-result-excerpt">{post.excerpt}</span>
                  {post.tags.length > 0 && (
                    <span className="search-result-meta">
                      {post.tags.map((t) => (
                        <span key={t} className="tag tag-muted">
                          {t}
                        </span>
                      ))}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>

        {/* Footer hints */}
        <div className="search-footer" aria-hidden>
          <span>
            <kbd>↑↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> open
          </span>
          <span>
            <kbd>esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  )
}
