'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface PostContentProps {
  html: string
}

export function PostContent({ html }: PostContentProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null)
  const [visible, setVisible] = useState(false)

  const openLightbox = useCallback((src: string, alt: string) => {
    setLightbox({ src, alt })
    // next frame so the element is mounted before the transition starts
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
  }, [])

  const closeLightbox = useCallback(() => {
    setVisible(false)
    setTimeout(() => setLightbox(null), 250)
  }, [])

  useEffect(() => {
    const container = ref.current
    if (!container) return

    // Find all shiki-highlighted pre blocks and wrap them with a header
    const pres = container.querySelectorAll<HTMLPreElement>('pre.shiki')

    pres.forEach((pre) => {
      if (pre.parentElement?.classList.contains('code-area')) return

      const code = pre.querySelector('code')
      const lang = pre.getAttribute('data-language') ?? ''

      const copyBtn = document.createElement('button')
      copyBtn.className = 'code-copy-btn'
      copyBtn.textContent = 'copy'
      copyBtn.setAttribute('aria-label', 'Copy code to clipboard')
      copyBtn.addEventListener('click', () => {
        const text = code?.textContent ?? ''
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.textContent = 'copied!'
          copyBtn.classList.add('copied')
          setTimeout(() => {
            copyBtn.textContent = 'copy'
            copyBtn.classList.remove('copied')
          }, 2000)
        })
      })

      const header = document.createElement('div')
      header.className = 'code-block-header'

      const langEl = document.createElement('span')
      langEl.className = 'code-lang'
      langEl.textContent = lang
      header.appendChild(langEl)
      header.appendChild(copyBtn)

      const codeArea = document.createElement('div')
      codeArea.className = 'code-area'

      pre.parentNode?.insertBefore(codeArea, pre)
      codeArea.appendChild(header)
      codeArea.appendChild(pre)
    })

    // Event delegation — one listener on the container survives re-renders
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'IMG') {
        const img = target as HTMLImageElement
        openLightbox(img.src, img.alt)
      }
    }
    container.addEventListener('click', handleClick)

    return () => container.removeEventListener('click', handleClick)
  }, [html, openLightbox])

  // Close on Escape
  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeLightbox() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, closeLightbox])

  return (
    <>
      <div
        ref={ref}
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {lightbox && (
        <div
          className={[
            'fixed inset-0 z-50 flex items-center justify-center',
            'bg-black/80 backdrop-blur-sm',
            'transition-opacity duration-250',
            visible ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            className={[
              'absolute top-4 right-4 flex items-center justify-center',
              'w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/25',
              'transition-all duration-250',
              visible ? 'opacity-100 scale-100' : 'opacity-0 scale-75',
            ].join(' ')}
            onClick={closeLightbox}
            aria-label="Close image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.src}
            alt={lightbox.alt}
            className={[
              'max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl',
              'transition-all duration-250',
              visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90',
            ].join(' ')}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
