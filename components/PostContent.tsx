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

      // Code area: relative container so copy btn can be positioned inside it
      const codeArea = document.createElement('div')
      codeArea.className = 'code-area'

      // Inject into DOM
      pre.parentNode?.insertBefore(wrapper, pre)
      codeArea.appendChild(pre)
      codeArea.appendChild(copyBtn)
      wrapper.appendChild(codeArea)
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
