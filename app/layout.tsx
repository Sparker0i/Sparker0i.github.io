import type { Metadata } from 'next'
import { IBM_Plex_Mono, DM_Sans, Lora, Bricolage_Grotesque } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/Nav'
import { SearchDialog } from '@/components/SearchDialog'
import { getAllPosts } from '@/lib/posts'

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-nav',
  display: 'swap'
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-display',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

const lora = Lora({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sparker0i.me'),
  title: {
    default: 'Aaditya Menon — Senior Engineer & Technical Lead',
    template: '%s — Aaditya Menon',
  },
  description:
    'Senior Engineer and Technical Lead with 7 years of experience designing distributed systems and platform infrastructure at scale.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Aaditya Menon',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const posts = getAllPosts()

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${ibmPlexMono.variable} ${lora.variable} ${bricolageGrotesque.variable}`}
    >
      <body>
        <Nav />
        <SearchDialog posts={posts} />
        <main>{children}</main>
      </body>
    </html>
  )
}
