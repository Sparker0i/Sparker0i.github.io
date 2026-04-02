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
      if (pre.parentElement?.classList.contains('code-area')) return

      const code = pre.querySelector('code')
      const lang = pre.getAttribute('data-language') ?? ''

      // Copy button
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

      const langEl = document.createElement('span')
      langEl.className = 'code-lang'
      langEl.textContent = lang
      header.appendChild(langEl)
      header.appendChild(copyBtn)

      // Wrapper
      const codeArea = document.createElement('div')
      codeArea.className = 'code-area'

      pre.parentNode?.insertBefore(codeArea, pre)
      codeArea.appendChild(header)
      codeArea.appendChild(pre)
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
