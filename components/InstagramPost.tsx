'use client'

import { useEffect, useRef, useState } from 'react'

interface InstagramPostProps {
  postId: string
}

export function InstagramPost({ postId }: InstagramPostProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const loadInstagram = async () => {
      try {
        setIsLoading(true)

        // Small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100))

        // Load Instagram embed script if not already loaded
        if (!(window as any).instgrm) {
          const script = document.createElement('script')
          script.src = 'https://www.instagram.com/embed.js'
          script.async = true
          script.onload = () => {
            setTimeout(() => {
              if ((window as any).instgrm) {
                (window as any).instgrm.Embed.process(containerRef.current)
              }
            }, 200)
          }
          document.body.appendChild(script)
        } else {
          // Instagram script already loaded, process with delay
          setTimeout(() => {
            if ((window as any).instgrm) {
              (window as any).instgrm.Embed.process(containerRef.current)
            }
          }, 200)
        }

        setIsLoading(false)
      } catch {
        setHasError(true)
        setIsLoading(false)
      }
    }

    loadInstagram()
  }, [postId])

  if (hasError) {
    return (
      <div className="my-8 p-4 border border-red-200 bg-red-50 rounded-lg text-red-700">
        <p>Failed to load Instagram post</p>
        <a
          href={`https://instagram.com/p/${postId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-red-900 underline"
        >
          View on Instagram
        </a>
      </div>
    )
  }

  return (
    <div style={{ margin: '2rem 0', display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div 
        ref={containerRef}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <blockquote
          className="instagram-media"
          data-instgrm-permalink={`https://www.instagram.com/p/${postId}/?utm_source=ig_embed`}
          data-instgrm-version="14"
          style={{ 
            margin: '0 auto',
            minHeight: '500px',
            width: '100%'
          }}
        />
      </div>
      {isLoading && (
        <div className="text-center text-text-muted">
          <p>Loading Instagram post...</p>
        </div>
      )}
    </div>
  )
}
