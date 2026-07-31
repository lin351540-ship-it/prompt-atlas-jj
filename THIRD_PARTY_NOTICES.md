# Third-party notices

## React Bits

Selected interaction patterns in this website (pointer-following spotlight,
staggered content reveal, and masonry motion language) are adapted from the
React Bits project:

- Project: https://github.com/DavidHDev/react-bits
- Copyright (c) 2026 David Haz
- License: MIT + Commons Clause License Condition v1.0

The full license text in effect for the referenced project is reproduced below.

> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, and distribute the Software as part of
> an application, website, or product, subject to inclusion of the copyright
> notice and permission notice in copies or substantial portions.
>
> Commons Clause restriction: the components may not be sold, sublicensed, or
> redistributed themselves, whether alone, in a bundle, or as a ported version.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.

Canonical license text:
https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md

## Motion

Prompt Atlas progressively loads Motion's `mini` entry from a pinned ESM CDN
endpoint to orchestrate one-time section reveals. The runtime never replaces
native page scrolling, and the local layout remains fully usable if the CDN is
unavailable.

- Project: https://github.com/motiondivision/motion
- Runtime version: 12.43.0
- Primary CDN: https://esm.sh/motion@12.43.0/mini?bundle
- Fallback CDN: https://cdn.jsdelivr.net/npm/motion@12.43.0/mini/+esm
- License: MIT

## Vanilla Tilt

Prompt Atlas progressively loads Vanilla Tilt from a pinned jsDelivr ESM
endpoint for restrained pointer-driven depth and glare on the creator hero,
prompt cards, source cards, and the rights panel. Tilt is activated only near
the viewport and is disabled for coarse pointers and reduced-motion users.

- Project: https://github.com/micku7zu/vanilla-tilt.js
- Runtime version: 1.8.1
- Primary CDN: https://cdn.jsdelivr.net/npm/vanilla-tilt@1.8.1/+esm
- Fallback CDN: https://esm.sh/vanilla-tilt@1.8.1
- License: MIT

## JCodesMore AI Website Cloner Template

The Geist / Geist Mono typography setup and parts of the layout rhythm were
informed by the public template below. No generated clone output is bundled.

- Project: https://github.com/JCodesMore/ai-website-cloner-template
- License: MIT
- Copyright: the project contributors

Canonical license text:
https://github.com/JCodesMore/ai-website-cloner-template/blob/main/LICENSE

## Geist typeface

The website self-hosts the variable Geist Sans and Geist Mono webfonts from
Vercel's official `geist` package so static exports do not depend on local file
URLs.

- Project: https://github.com/vercel/geist-font
- License: SIL Open Font License 1.1

## YouMind GPT Image 2 Prompts Search

The large public prompt catalog is synchronized from YouMind OpenLab's
official GitHub repository. The source manifest currently declares 14,106
prompts; the published category files contain 14,074 unique IDs after
deduplication. Prompt text is stored in local static shards. Preview images
remain source-hosted and retain their original URLs.

- Project: https://github.com/YouMind-OpenLab/gpt-image-2-prompts-search
- Upstream attribution: 提示词由 [YouMind.com](https://youmind.com) 通过公开社区搜集 ❤️
- Rights note: the repository README and package metadata identify MIT, but a
  root LICENSE file was not present when this snapshot was reviewed. This site
  therefore preserves attribution and does not claim ownership of community
  prompt text or preview images.

## YouMind Awesome GPT Image 2

The smaller curated set supplies richer author, original-post and multi-image
metadata for 126 entries. It is deduplicated against the large public catalog.

- Project: https://github.com/YouMind-OpenLab/awesome-gpt-image-2
- License: CC BY 4.0

## YouMind Awesome Nano Banana Pro Prompts

The site synchronizes 129 complete public records with 231 generated preview
images from the repository snapshot. Each card preserves the original author,
source URL and license link. The upstream index currently declares 15,027
records; this site counts only the complete records that can be independently
verified in the public GitHub README.

- Project: https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts
- License: CC BY 4.0
- Local modifications: classification, search tags and source explanation only

## EvoLink GPT Image 2 CC0 collection

The site synchronizes complete prompt-image pairs from EvoLink's public GPT
Image 2 case files. Records without a complete fenced prompt, an effect image,
an original X post, or an author handle are excluded. Each accepted card keeps
the upstream title, full prompt, effect-image URL, original author and original
post.

- Project: https://github.com/Evolink-AI/awesome-gpt-image-2-API-and-Prompts
- License: CC0 1.0 Universal
- License text: https://github.com/Evolink-AI/awesome-gpt-image-2-API-and-Prompts/blob/main/LICENSE
- Local modifications: Chinese category mapping, search tags, ratio inference
  and source explanation only

## Public X ALT prompt snapshot

Prompt Atlas also includes a dated snapshot of public X posts where the author
explicitly shares a prompt and publishes a complete prompt-like ALT text
alongside generated images. Discovery uses public X search and the public tweet
syndication response only. It does not bypass login, inspect private posts,
recover deleted posts, or scrape restricted pages.

- Source: each card links to its exact public X post and author
- Inclusion rule: public image post, explicit prompt-sharing language, and a
  complete ALT prompt of at least 90 characters
- Image handling: accepted public images are converted to WebP and cached
  locally so the card remains directly visible; author and source attribution
  remain attached to every record
- Rights note: public availability is not presented as a Creative Commons
  license. Cards say “author-public X post; attribution required” and direct
  users to the author's original terms before reuse.

## DiffusionDB CC0 3D collection

The site includes a safety-filtered subset of 383 original prompt-image pairs
from DiffusionDB. Prompt text is kept verbatim. The corresponding generated
images are fetched by exact filename from the public dataset ZIP partitions,
converted lossily to WebP for delivery performance, and self-hosted so gallery
cards do not depend on expiring signed URLs.

- Dataset: https://huggingface.co/datasets/poloclub/diffusiondb
- Project: https://github.com/poloclub/diffusiondb
- Dataset and generated-image license: CC0 1.0 Universal
- License deed: https://creativecommons.org/publicdomain/zero/1.0/
- Local curation: entries with elevated NSFW scores, people, named franchises,
  brands, violent subjects, artist-name imitation, and near-duplicate prompts
  are excluded.

No PromptWall prompt text or generated image is bundled. PromptWall was used
only to understand the requested 3D browsing category; this collection is an
independent, openly licensed replacement displayed directly inside Prompt
Atlas.
