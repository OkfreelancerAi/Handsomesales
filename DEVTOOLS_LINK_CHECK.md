# DevTools Link Verification — HANDSOMESALES

Quick guide to verify outbound Amazon affiliate links preserve your `handsomesales-20` tag.

1. Open your live site in an Incognito/Private window (so you are not logged into Amazon).
2. Open DevTools (right-click → Inspect) and switch to the Network tab.
3. Make sure **Preserve log** is checked (optional but useful for redirects).
4. Click the product "View on Amazon" link.
5. Look at the first network request that fired after the click (usually a navigation or a redirect).
   - If the link is direct (full associates URL) you should see `tag=handsomesales-20` in the Request URL.
   - If Amazon redirects, click the first redirect entry and inspect the **Location** response header — the tag may appear there.
6. If you see the `tag=` parameter in the initial request or in the first redirect Location header, the outbound click should be credited to your Associates tag.
7. If you don't see the tag:
   - Re-generate the link from SiteStripe and paste the full associates URL (instead of just the /dp/ASIN form).
   - Test again.

Notes
- Amazon sometimes rewrites or localizes links; the reliable check is that the initial outbound request or the immediate redirect includes your tag.
- Associate reports can be delayed; confirm clicks in Associates Central after 24–48 hours.

Example (Chrome DevTools):
- Network → click the first item → Headers → Request URL or Response Headers → Location

