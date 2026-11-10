# Error Pages screenshot capture

Takes clean (presentation-mode) screenshots of every state in `ErrorPages_Wireframe.html`, using the Google Chrome already installed on your Mac. Adapted from the app-screens-to-figma skill.

## Run it

```bash
cd ~/Documents/Claude/Projects/SSE/Wireframes/tools/figma-capture
npm install        # first time only
npm run capture
```

No server needed; the script serves the Wireframes folder itself.

## Output

- Folder: `figma-shots/` (gitignored; regenerate any time instead of trusting old PNGs)
- 40 files: 4 pages × 5 markets × 2 viewports
- Names: `NN-<page>-<market>-<viewport>.png`, for example `01-404-ong-desktop.png`
  - Pages: `404`, `500full` (full chrome), `500fb` (static fallback), `maint` (Maintenance)
  - Viewports: desktop 1280 px wide, mobile 375 px wide, both captured at 2x
- Clean view: no control panel, no annotations, no wireframe canvas framing. Full-page height.

## If something fails

- `No Chrome-family browser found`: run with `CHROME="/path/to/chrome" npm run capture`
- `state did not apply`: the wireframe's deep links (`?page=&market=&vp=`) or its `setPage` / `setMarket` functions changed; update `PAGES` / `MARKETS` in `capture.js` to match
- To reuse for another wireframe: change `FILE`, `PAGES`, `MARKETS` and the deep-link URL in `capture.js`

Figma board: not built (PNGs only, per Allyson 2026-11-10).
