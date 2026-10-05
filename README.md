# Handsomesales

**AI-powered affiliate discovery platform**

Intelligent shopping assistant · trend discovery · transparent Amazon Associates tracking.

Live: [handsomesales.vercel.app](https://handsomesales.vercel.app)

---

## What it does

Handsomesales helps visitors find products they actually want — then routes them through clean, validated Amazon Associates links.

- AI shopping assistant for product discovery
- Trend-based product recommendations
- Automated affiliate-link validation
- Transparent tracking (tag: `handsomesales-20`)
- Lightweight static frontend, one-click Vercel deploy

---

## Quick Start

```bash
git clone https://github.com/OkfreelancerAi/Handsomesales.git
cd Handsomesales
# open index.html or deploy to Vercel
```

### Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `OkfreelancerAi/Handsomesales`
3. Deploy (no env vars required for the static site)

---

## Affiliate link hygiene

Validate links before shipping:

```bash
npm run validate
```

This runs `scripts/validate_affiliates.js` and checks that associate tags and ASINs are correctly formed.

To replace placeholder ASINs, see [ASIN_REPLACEMENT.md](./ASIN_REPLACEMENT.md).

---

## Project structure

```
index.html              # Main product experience
scripts/                # Affiliate validation utilities
ASIN_REPLACEMENT.md     # How to swap real product ASINs
DEPLOYMENT_CHECKLIST.md # Pre-launch checks
CONTRIBUTING.md         # Contribution notes
```

---

## Stack

- Static HTML + lightweight JS
- Amazon Associates (`handsomesales-20`)
- Vercel for hosting
- Node ≥ 20 for validation scripts

---

## License

Private / all rights reserved unless otherwise stated.
