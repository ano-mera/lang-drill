# LangDrill

[![CI](https://github.com/ano-mera/lang-drill/actions/workflows/ci.yml/badge.svg)](https://github.com/ano-mera/lang-drill/actions/workflows/ci.yml)

**A production-ready SaaS for TOEIC exam training** — with user authentication, subscription billing, and usage-based feature gating.

Built with Next.js 15, Supabase, Stripe, and GPT-4o. Deployed on Vercel.

**[Live Demo](https://lang-drill.vercel.app/)**

---

## Screenshots

<table>
  <tr>
    <td align="center"><strong>Splash Screen</strong></td>
    <td align="center"><strong>Part 1 - Photo Description</strong></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/01-splash.png" width="400" /></td>
    <td><img src="docs/screenshots/02-part1.png" width="400" /></td>
  </tr>
  <tr>
    <td align="center"><strong>Settings</strong></td>
    <td align="center"><strong>Statistics</strong></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/03-settings.png" width="400" /></td>
    <td><img src="docs/screenshots/05-stats.png" width="400" /></td>
  </tr>
  <tr>
    <td align="center" colspan="2"><strong>Mobile View</strong></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/06-mobile-splash.png" width="200" /></td>
    <td align="center"><img src="docs/screenshots/07-mobile-main.png" width="200" /></td>
  </tr>
</table>

## Subscription & Auth Flow

```
Guest (no account)          Logged-in (Free)            Pro subscriber
─────────────────           ────────────────            ──────────────
20 questions/day            50 questions/day            Unlimited
localStorage tracking       Server-side DB tracking     No limits
        │                           │                        ▲
        └── Sign up ───────────────►│                        │
                                    └── Stripe Checkout ────►│
                                                             │
                                    Stripe Webhook ──► Supabase DB update
                                    (checkout.completed,     │
                                     invoice.paid,           │
                                     subscription.deleted,   │
                                     subscription.updated)   │
                                                             │
                                    Cancel ──► Pro until period ends ──► Free
```

**Key implementation details:**
- **Webhook-driven state** — Subscription status is updated exclusively via Stripe webhooks, not client-side polling
- **Server-side usage enforcement** — Logged-in user limits tracked in Supabase PostgreSQL (not bypassable via DevTools)
- **Row Level Security (RLS)** — Users can only read/write their own profile and usage data
- **Webhook signature verification** — All incoming Stripe events verified with `constructEvent()` before processing
- **Cancel-at-period-end** — Pro access maintained until the billing period ends; UI shows exact expiration date

## Features

- **Full TOEIC Coverage** — All 7 parts, from photo descriptions to multi-passage reading
- **1,400+ AI Questions** — Generated with GPT-4o, 3 difficulty levels, Japanese translations included
- **Auth & Billing** — Email/password auth (Supabase) + Stripe Checkout / Customer Portal
- **Tiered Usage Gating** — Guest → Free → Pro, with server-side enforcement
- **Audio Playback** — ElevenLabs TTS with adjustable speed/volume, browser TTS fallback
- **Bilingual UI** — Full English / Japanese toggle (~160 translation keys)
- **PWA** — Installable, works offline
- **Mobile-first** — Responsive design optimized for phones and tablets

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 4 |
| Auth | Supabase (Email/Password, RLS, session middleware) |
| Payments | Stripe (Checkout, Webhooks, Customer Portal) |
| AI | OpenAI GPT-4o (translations, question generation) |
| Audio | ElevenLabs TTS, Web Speech API |
| Storage | Cloudflare R2 (audio CDN), Supabase PostgreSQL (users/usage), localStorage (settings) |
| CI/CD | GitHub Actions (lint + typecheck), Vercel (deploy) |
| Testing | Vitest (unit), Playwright (E2E) |

## Architecture

```
src/
  app/
    api/stripe/    # Checkout Session, Webhook, Customer Portal endpoints
    api/usage/     # GET (remaining) / POST (increment) usage tracking
    auth/          # OAuth callback handler
  components/      # Part0-7, Auth, Paywall, Settings, Stats
  contexts/        # AuthContext (user/profile/subscription state)
  hooks/           # useUsage (tiered limit logic)
  lib/
    supabase/      # Browser, Server, Admin (service role) clients
    stripe.ts      # Server-side Stripe instance
    stripe-client.ts # Client-side Stripe.js loader
  data/            # JSON question databases (~10MB)
  utils/           # Game settings, stats tracking

generator/         # GPT-4o content generation pipeline
```

### Key Design Decisions

- **Webhook-only subscription sync** — No client-side subscription checks; DB is the single source of truth, updated only by verified webhooks
- **Dual usage tracking** — Guests use localStorage (convenience); logged-in users use server-side DB (security)
- **Questions as static JSON** — Loaded into memory for instant navigation; only user data lives in the database
- **Lightweight i18n** — Custom translation system via React Context instead of heavy i18n libraries
- **Cloudflare R2 for audio** — CDN delivery instead of bundling large audio files with the app

## Question Database

| Part | Type | Questions | Audio |
|------|------|-----------|-------|
| Part 0 | Listening Foundation | 132 sentences | ElevenLabs TTS |
| Part 1 | Photo Description | 137 questions | AI-generated images + audio |
| Part 2 | Question-Response | 109 questions | Multi-voice audio |
| Part 3 | Conversations | 159 questions | Multi-speaker dialogues |
| Part 4 | Talks | 182 questions | Long-form audio |
| Part 5 | Incomplete Sentences | 148 questions | - |
| Part 6 | Text Completion | 21 questions | - |
| Part 7 | Reading Comprehension | 181 passages (543 questions) | - |

## Getting Started

```bash
cp .env.example .env.local   # Fill in Supabase + Stripe keys
npm install
npm run dev                  # Starts on http://localhost:3001
```

### Environment Variables

See `.env.example` for the full list. Required services:

| Variable | Service |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key (server-only) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRO_PRICE_ID` | Stripe Pro plan price ID |
| `NEXT_PUBLIC_APP_URL` | App URL for Stripe redirects |

### Scripts

```bash
npm run dev          # Development server (port 3001)
npm run build        # Production build
npm run lint         # ESLint check
npm start            # Production server
```

### Question Generation

Requires `OPENAI_API_KEY` environment variable.

```bash
cd generator/scripts/generate
node generate-passages-unified.js --difficulty=hard --count=5
```

## License

Private project.
