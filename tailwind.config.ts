import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0d0f0e',
        surface: '#141714',
        'surface-elevated': '#1a1e1a',
        border: '#252b25',
        accent: '#4ade80',
        'accent-secondary': '#a3e635',
        amber: '#f59e0b',
        text: '#d4d8d0',
        'text-muted': '#6b7568',
        'text-bright': '#eef0eb',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'monospace'],
        body: ['var(--font-body)', 'Georgia', 'serif'],
        nav: ['var(--font-nav)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
      },
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': '#d4d8d0',
            '--tw-prose-headings': '#eef0eb',
            '--tw-prose-lead': '#d4d8d0',
            '--tw-prose-links': '#4ade80',
            '--tw-prose-bold': '#eef0eb',
            '--tw-prose-counters': '#6b7568',
            '--tw-prose-bullets': '#6b7568',
            '--tw-prose-hr': '#252b25',
            '--tw-prose-quotes': '#d4d8d0',
            '--tw-prose-quote-borders': '#4ade80',
            '--tw-prose-captions': '#6b7568',
            '--tw-prose-code': '#a3e635',
            '--tw-prose-pre-code': '#d4d8d0',
            '--tw-prose-pre-bg': '#1a1e1a',
            '--tw-prose-th-borders': '#252b25',
            '--tw-prose-td-borders': '#252b25',
            maxWidth: 'none',
            a: {
              textDecoration: 'none',
              borderBottom: '1px solid rgba(74,222,128,0.4)',
              '&:hover': { borderBottomColor: '#4ade80' },
            },
            h2: { fontFamily: 'var(--font-display)' },
            h4: { fontFamily: 'var(--font-display)' },
            // h3 is styled as mono/uppercase/amber in globals.css
            code: {
              fontFamily: 'var(--font-mono)',
              fontSize: '0.875em',
              backgroundColor: 'rgba(163,230,53,0.08)',
              padding: '2px 5px',
              borderRadius: '3px',
              '&::before': { content: 'none' },
              '&::after': { content: 'none' },
            },
            pre: {
              backgroundColor: '#1a1e1a',
              border: 'none',
              borderRadius: '0',
              padding: '0',
              margin: '0',
            },
            'pre code': {
              backgroundColor: 'transparent',
              padding: '0',
            },
            blockquote: {
              borderLeftColor: '#4ade80',
              borderLeftWidth: '2px',
              fontStyle: 'italic',
              color: '#d4d8d0',
            },
            table: {
              width: '100%',
            },
            th: {
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8em',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#6b7568',
              backgroundColor: '#141714',
            },
          },
        },
      },
    },
  },
  plugins: [typography],
}

export default config
