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

## AI

| Service | Purpose | Env Vars | Tier | Cost |
|---|---|---|---|---|
| **Anthropic (Claude)** | AI analyst chat, content generation | `ANTHROPIC_API_KEY` | API | Usage-based |

## Audio / Voice

| Service | Purpose | Env Vars | Tier | Cost |
|---|---|---|---|---|
| **ElevenLabs** | Podcast-quality TTS for lessons & writings | `ELEVENLABS_API_KEY` | Creator ($22/mo) | ~$44 one-time (2 months to generate all audio, then cancel) |

Audio files are pre-generated as static MP3s in `public/audio/`. The API key is only needed during generation (via `scripts/generate-audio.mjs`), not at runtime.

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

## Fonts (CDN)

| Font | Source | Usage |
|---|---|---|
| **Space Mono** | Google Fonts | UI, monospace elements |
| **Cormorant Garamond** | Google Fonts | Display headings, body text in lessons/writings |

---

## Adding a New Service

1. Add env vars to `.env.local` (never commit secrets)
2. Add to Vercel environment variables for production
3. Update this file
4. Ensure the pre-commit hook pattern list covers the new key format
