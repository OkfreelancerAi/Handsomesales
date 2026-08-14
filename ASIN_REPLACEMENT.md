# ASIN Replacement — quick script and manual steps

This file explains how to replace the placeholder `JOUW_ECHTE_ASIN_HIER` values in `index.html` with real ASINs (or full Associates links).

Manual steps (recommended):
1. Go to your repo on GitHub and open `index.html`.
2. Click the pencil icon (Edit file).
3. Find `JOUW_ECHTE_ASIN_HIER` occurrences (3 times).
4. Replace them with these ASINs (as provided):
   - Massage Oil Discovery: `B01N7KZQXS`
   - Aromatherapy Finds: `B01LZ7QKZT`
   - Self-Care Gift Ideas: `B07XJZV2K3`
5. Make sure each link ends with `?tag=handsomesales-20`.
6. Commit the change with message: `Add real Amazon ASINs for top massage oil products`.

Automated (local) replacement using sed (Linux/macOS Git bash):

- Backup file first:
  ```bash
  cp index.html index.html.bak
  ```
- Replace sequentially (run three commands):
  ```bash
  sed -i '' '0,/JOUW_ECHTE_ASIN_HIER/s//B01N7KZQXS/' index.html
  sed -i '' '0,/JOUW_ECHTE_ASIN_HIER/s//B01LZ7QKZT/' index.html
  sed -i '' '0,/JOUW_ECHTE_ASIN_HIER/s//B07XJZV2K3/' index.html
  ```

- Commit and push:
  ```bash
  git add index.html
  git commit -m "Add real Amazon ASINs for top massage oil products"
  git push origin main
  ```

If you'd like I can apply these replacements and commit them for you — confirm and I'll update `index.html` directly.
