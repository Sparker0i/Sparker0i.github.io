'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/blog', label: 'blog' },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-nav text-base font-bold tracking-tight text-text-bright hover:text-accent transition-colors duration-150"
        >
          Sparker0i
        </Link>

        <ul className="flex items-center gap-6">
          {links.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`font-mono text-sm tracking-wide transition-colors duration-150 ${
                    isActive
                      ? 'text-accent'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}
