const fs = require('fs')
const path = require('path')

/**
 * Webpack loader applied to lib/posts.ts in dev mode.
 *
 * Adds every .md file in content/blog as an explicit webpack file dependency
 * and injects a hash comment derived from their mtimes. When any markdown file
 * is saved (or a new one is added), the hash changes → webpack sees a different
 * module output → HMR fires → browser auto-refreshes.
 */
module.exports = function contentLoader(source) {
  const contentDir = path.join(__dirname, '..', 'content', 'blog')

  let hash = 0
  if (fs.existsSync(contentDir)) {
    // Watch for new / deleted files in the directory
    this.addContextDependency(contentDir)

    for (const file of fs.readdirSync(contentDir)) {
      if (!file.endsWith('.md')) continue
      const filePath = path.join(contentDir, file)
      // Watch each existing file for modifications
      this.addDependency(filePath)
      // Mix mtime into hash so saving a file changes the injected comment
      hash ^= Math.floor(fs.statSync(filePath).mtimeMs)
    }
  }

  return `// __content_hash__: ${hash >>> 0}\n${source}`
}
