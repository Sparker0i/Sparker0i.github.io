import path from 'path'
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
  webpack(config, { dev }) {
    if (dev) {
      config.module.rules.push({
        test: /lib[/\\]posts\.ts$/,
        use: [{ loader: path.resolve('./lib/content-loader.js') }],
        enforce: 'pre',
      })
    }
    return config
  },
}

export default nextConfig
