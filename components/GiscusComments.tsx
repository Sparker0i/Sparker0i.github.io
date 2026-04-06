'use client'

import Giscus from '@giscus/react'

export function GiscusComments() {
  return (
    <div className="mt-12 pt-8 border-t border-border">
      <Giscus
        repo="Sparker0i/Sparker0i.github.io"
        repoId={process.env.NEXT_PUBLIC_GISCUS_REPO_ID!}
        category="General"
        categoryId={process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID!}
        mapping="pathname"
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme="dark_dimmed"
        lang="en"
        loading="lazy"
      />
    </div>
  )
}
