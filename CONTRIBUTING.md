# 🐭 HANDSOMESALES — Contributing Guide

Welcome to HANDSOMESALES — The Smart Salesman of the Internet.

## Quick Start

1. Fork the repo
2. Clone locally: `git clone https://github.com/OkfreelancerAi/Handsomesales.git`
3. Create branch: `git checkout -b feature/your-feature`
4. Make changes
5. Test locally (open `index.html` in browser)
6. Commit: `git commit -m "Describe your change"`
7. Push: `git push origin feature/your-feature`
8. Open Pull Request

## Affiliate Link Rules

**MUST:**
- Generate all Amazon links via SiteStripe or Associates Central
- Include `?tag=handsomesales-20` in every outbound Amazon link
- Use `rel="noopener sponsored"` on all affiliate links
- Include affiliate disclosure on pages with affiliate links
- Verify links work in incognito window before merging

**MUST NOT:**
- Use fake prices, reviews, ratings, or availability
- Make unsupported medical or therapeutic claims
- Imply Amazon endorsement
- Use other people's affiliate tags
- Create fake scarcity or urgency

## Code Standards

- Single `index.html` for landing page
- Inline CSS (no external stylesheets for MVP)
- Vanilla JavaScript only (no frameworks for MVP)
- Mobile-first responsive design
- Accessibility: keyboard navigation, aria-labels where needed

## Testing Checklist

Before any PR merge:

- [ ] Desktop layout works
- [ ] Mobile layout works (test iPhone + Android viewport)
- [ ] All Amazon links include `tag=handsomesales-20`
- [ ] Affiliate disclosure visible
- [ ] Sage avatar works (open, minimize, keyboard)
- [ ] No console errors
- [ ] No broken links
- [ ] Page loads in < 3 seconds

## Deployment

- Push to `main` branch → auto-deploys to Vercel
- Vercel URL: `https://<your-deployment>.vercel.app`
- Custom domain: configure in Vercel dashboard

## Analytics

- Web Analytics: enable via Vercel or your analytics provider
- Speed Insights: enabled in Vercel
- Amazon Associates: check clicks in Associates Central after 24-48h

## Questions?

Open an issue or ask in the team chat.

---

**DISCOVER → HELP → TRUST → EXPLORE → CONVERT → LEARN → IMPROVE**

AIM FOR THE STARS. SHOOT FOR THE MOON. 🐭⭐
