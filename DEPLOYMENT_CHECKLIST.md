# Deployment checklist — HANDSOMESALES

Follow these before pressing Deploy:

- [ ] index.html exists in repository root and includes affiliate disclosure
- [ ] All placeholders replaced with valid ASINs or full Associates URLs
- [ ] All outbound affiliate links include `?tag=handsomesales-20`
- [ ] All outbound links include `rel="noopener sponsored"`
- [ ] Short disclosure visible near product cards
- [ ] Long disclosure in footer or on a /disclosure.html page
- [ ] Mobile and desktop layouts tested
- [ ] Accessibility quick check: keyboard navigation, aria-labels for interactive elements
- [ ] DevTools link-check completed (see DEVTOOLS_LINK_CHECK.md)
- [ ] Vercel project created and linked to this repo
- [ ] Environment variables (none required for static HTML)
- [ ] Run a smoke test after deploy: page load, Sage open, product links open

Deploy steps
1. Go to https://vercel.com/new
2. Continue with GitHub → select OkfreelancerAi/Handsomesales
3. Framework: Other / Static
4. Root: / (repository root)
5. Deploy

Post-deploy
- [ ] Open the Vercel URL in incognito and perform the DevTools link check
- [ ] After 24–48h check Associates Central for clicks

