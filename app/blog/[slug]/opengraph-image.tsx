import { ImageResponse } from 'next/og'
import { getAllPosts, getPostBySlug } from '@/lib/posts'

export const dynamic = 'force-static'
export const alt = 'Blog post preview'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  const title = post?.title ?? 'Blog Post'
  const excerpt = post?.excerpt ?? ''
  const tags = post?.tags ?? []
  const date = post?.date
    ? new Date(post.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0d1117 0%, #161b22 60%, #0d1117 100%)',
          padding: '60px 72px',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #3fb950 0%, #58a6ff 50%, #bc8cff 100%)',
          }}
        />

        {/* Author / site */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3fb950, #58a6ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              color: '#0d1117',
              fontWeight: 700,
            }}
          >
            A
          </div>
          <span style={{ color: '#8b949e', fontSize: '16px', letterSpacing: '0.02em' }}>
            Aaditya Menon
          </span>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                style={{
                  background: 'rgba(63, 185, 80, 0.15)',
                  border: '1px solid rgba(63, 185, 80, 0.4)',
                  color: '#3fb950',
                  fontSize: '13px',
                  padding: '4px 12px',
                  borderRadius: '100px',
                  letterSpacing: '0.02em',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              color: '#e6edf3',
              fontSize: title.length > 60 ? '40px' : '52px',
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              marginBottom: '20px',
            }}
          >
            {title}
          </div>

          {excerpt && (
            <div
              style={{
                color: '#8b949e',
                fontSize: '18px',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {excerpt}
            </div>
          )}
        </div>

        {/* Bottom row: date */}
        {date && (
          <div
            style={{
              marginTop: '32px',
              color: '#6e7681',
              fontSize: '14px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {date}
          </div>
        )}

        {/* Bottom-right decoration */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '72px',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(88, 166, 255, 0.08) 0%, transparent 70%)',
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
