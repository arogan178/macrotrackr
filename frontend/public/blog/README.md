# Blog hero images

Self-hosted so they are discoverable in the pre-rendered HTML. Fetching them
from a third-party CDN meant the browser could not start the request until
React had hydrated and rendered the `<img>`, which on a throttled phone put the
largest paint past six seconds.

Filenames keep the upstream photo ID so each file traces back to its source.

Sourced from [Unsplash](https://unsplash.com) under the
[Unsplash License](https://unsplash.com/license), which permits free use
including commercially and without attribution. Attribution is kept here
anyway, as a record of where they came from.

Converted to WebP at 1200px wide with `magick <file> -resize '1200x>' -quality
78 -define webp:method=6`. Replace one by dropping in the new file and pointing
the post's `image` field at it in `src/data/blog-posts.json`.
