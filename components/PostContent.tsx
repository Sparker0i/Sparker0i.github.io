'use client'

import { useEffect, useRef } from 'react'

interface PostContentProps {
  html: string
}

export function PostContent({ html }: PostContentProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return

    // Find all shiki-highlighted pre blocks and wrap them with a header
    const pres = container.querySelectorAll<HTMLPreElement>('pre.shiki')

    pres.forEach((pre) => {
      // Avoid double-wrapping on HMR / StrictMode re-runs
      if (pre.parentElement?.classList.contains('code-block-wrapper')) return

      const code = pre.querySelector('code')
      const lang = code?.getAttribute('data-lang') ?? ''
      const filename = code?.getAttribute('data-filename') ?? ''

      // Wrapper
      const wrapper = document.createElement('div')
      wrapper.className = 'code-block-wrapper'

      // Copy button (built first so we can wire it regardless of group)
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

      // Header bar
      const header = document.createElement('div')
      header.className = 'code-block-header'

      // Left group: macOS dots + lang label
      const leftGroup = document.createElement('div')
      leftGroup.className = 'code-header-left'

      const dots = document.createElement('div')
      dots.className = 'mac-dots'
      ;['red', 'yellow', 'green'].forEach((colour) => {
        const dot = document.createElement('span')
        dot.className = `mac-dot mac-dot-${colour}`
        dots.appendChild(dot)
      })
      leftGroup.appendChild(dots)

      if (lang) {
        const langEl = document.createElement('span')
        langEl.className = 'code-lang'
        langEl.textContent = lang
        leftGroup.appendChild(langEl)
      }

      // Right group: filename (amber) + copy button
      const rightGroup = document.createElement('div')
      rightGroup.className = 'code-header-right'

      if (filename) {
        const fn = document.createElement('span')
        fn.className = 'code-filename'
        fn.textContent = filename
        rightGroup.appendChild(fn)
      }

      rightGroup.appendChild(copyBtn)

      header.appendChild(leftGroup)
      header.appendChild(rightGroup)

      // Inject into DOM
      pre.parentNode?.insertBefore(wrapper, pre)
      wrapper.appendChild(header)
      wrapper.appendChild(pre)
    })
  }, [html])

  return (
    <div
      ref={ref}
      className="prose max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
