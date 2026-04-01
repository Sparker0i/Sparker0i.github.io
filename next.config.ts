import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  // If deploying to a GitHub Pages subpath (e.g. username.github.io/portfolio),
  // uncomment and set basePath:
  // basePath: '/portfolio',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

export default nextConfig
