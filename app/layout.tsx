import type { Metadata } from 'next'
import { IBM_Plex_Mono, Playfair_Display, Source_Serif_4, Bricolage_Grotesque } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/Nav'

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-nav',
  display: 'swap'
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-display',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

const sourceSerif4 = Source_Serif_4({
  subsets: ['latin'],
  weight: ['300', '400'],
  style: ['normal', 'italic'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
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
  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${ibmPlexMono.variable} ${sourceSerif4.variable} ${bricolageGrotesque.variable}`}
    >
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  )
}
