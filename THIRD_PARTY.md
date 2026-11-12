# Third-Party Services & Dependencies

All external services Contrabxnd relies on. Keep this updated as new integrations are added.

---

## Authentication & Database

| Service | Purpose | Env Vars | Tier | Cost |
|---|---|---|---|---|
| **Supabase** | Auth, user progress tracking, bookmarks, highlights | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Free | $0 |

## Data & Intelligence

| Service | Purpose | Env Vars | Tier | Cost |
|---|---|---|---|---|
| **FRED API** | Federal Reserve economic data (net liquidity, SLR) | `FRED_API_KEY` | Free | $0 |
| **Coinbase Exchange API** | BTC/USD OHLC candles for Lightweight Charts | None | Public | $0 |
| **CryptoPanic** | Crypto news aggregation for terminal feed | `CRYPTOPANIC_API_KEY` | Free | $0 |
| **X/Twitter API** | Social sentiment, tweet embeds | `X_BEARER_TOKEN` | Basic | $100/mo |
| **Barchart** | FedWatch / futures data (pending approval) | `BARCHART_API_KEY` | TBD | TBD |

## Merchant Map

The merchant directory uses BTCMap data and Leaflet with standard OpenStreetMap raster tiles (no map key required). Tiles load directly in the browser with visible attribution and normal browser caching. Do not add tile prefetching or offline downloads. OpenStreetMap is best-effort, not an SLA-backed commercial service; follow its [tile usage policy](https://operations.osmfoundation.org/policies/tiles/). For higher traffic, configure a dedicated raster provider with `NEXT_PUBLIC_MAP_TILE_URL` and `NEXT_PUBLIC_MAP_TILE_ATTRIBUTION`, then rebuild. Both settings are public browser configuration. The map applies a muted light/dark treatment to the raster layer.

## AI

| Service | Purpose | Env Vars | Tier | Cost |
|---|---|---|---|---|
| **Anthropic (Claude)** | AI analyst chat, content generation | `ANTHROPIC_API_KEY` | API | Usage-based |

## Audio / Voice

| Service | Purpose | Env Vars | Tier | Cost |
|---|---|---|---|---|
| **ElevenLabs** | Podcast-quality TTS for lessons & writings | `ELEVENLABS_API_KEY` | Creator ($22/mo) | ~$44 one-time (2 months to generate all audio, then cancel) |

Audio files are pre-generated as static MP3s in `public/audio/`. The API key is only needed during generation (via `scripts/generate-audio.mjs`), not at runtime.

No MP3s are currently checked in. The player stays hidden until audio metadata confirms an available asset; missing files do not display loading controls.

## Email & Notifications

| Service | Purpose | Env Vars | Tier | Cost |
|---|---|---|---|---|
| **Resend** | Transactional email (not yet configured) | `RESEND_API_KEY` | - | - |
| **Web Push (VAPID)** | Browser push notifications (not yet configured) | `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | - | - |

## Infrastructure

| Service | Purpose | Notes | Cost |
|---|---|---|---|
| **Vercel** | Hosting, serverless functions, edge runtime | Deploys from `main` branch | Free / Pro |
| **GitHub** | Source control, CI | `haydenrandolph/contrabxnd` | Free |

## Fonts (Self-Hosted)

| Font | Source | Usage |
|---|---|---|
| **Jost** | Google Fonts via `next/font/google` | Variable weight: light display headings (200/300/400), body text, stronger tool/UI weights (500/600/700) |
| **Space Mono** | Google Fonts via `next/font/google` | Labels, code, charts and numeric data (400/700) |

Next.js downloads these fonts at build time and serves them as local static assets. Page typography makes no browser requests to Google Fonts. The shared `--cb-font-sans`, `--cb-font-display`, and `--cb-font-mono` tokens are the font API; no font API key is required. Standalone share-card SVG generation is separate from page typography.

Social preview PNGs embed static Jost SemiBold and Space Mono Regular TTF files from Google Fonts in `assets/fonts/`, under the included SIL Open Font License. These assets are bundled locally, so crawlers do not depend on an external font service. Open Graph and Twitter use the same renderer.

---

## Adding a New Service

1. Add env vars to `.env.local` (never commit secrets)
2. Add to Vercel environment variables for production
3. Update this file
4. Ensure the pre-commit hook pattern list covers the new key format
