# Swiper Parallax Configuration

Critical notes from Romulo Cafe analysis (2026-06-18) for Swiper 11 parallax:

## Requirements
1. `parallax: true` in Swiper config (REQUIRED — without this, data-swiper-parallax is ignored)
2. `data-swiper-parallax="40%"` on inner background div (POSITIVE value)
3. Slide must have `overflow: hidden`
4. Bg div must be `position: absolute; inset: 0; background-size: cover; background-position: center`
5. Slide needs a `::before` gradient overlay at `z-index: 1`, content at `z-index: 2`, bg at `z-index: 0`

## Common Mistakes
- NEGATIVE value (`-40%`) — shifts image but doesn't create parallax. Value must be POSITIVE.
- Missing `parallax: true` in Swiper config
- Using custom `setTranslate` handler instead of Swiper's built-in parallax module
- Bg div inset mismatched — must be exactly `inset: 0`, not `-10%` like scroll parallax overscan

## Reference
Romulo Cafe: https://romulocafe.com — analyzed via Playwright browser inspection
