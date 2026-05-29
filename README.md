# Reactor Docs Preview

Unofficial Fluent-style documentation shell for [Microsoft.UI.Reactor](https://github.com/microsoft/microsoft-ui-reactor).

This project is a design prototype. It is not affiliated with, endorsed by, or maintained by Microsoft. Microsoft, Fluent, Windows, WinUI, and related product names may be trademarks of Microsoft Corporation.

## What It Does

- Syncs documentation content from `microsoft/microsoft-ui-reactor/docs/guide`.
- Renders the docs in a Fluent-inspired React shell.
- Adds full-text search, generated navigation, page table of contents, highlighted code blocks, and copy buttons.
- Keeps the prototype content close to upstream by regenerating `src/content/generated/manifest.ts` during builds.

## Local Development

```powershell
npm install
npm run dev
```

Then open:

```txt
http://127.0.0.1:5173/
```

## Useful Scripts

```powershell
npm run sync:docs
npm run build
npm run preview
```

`npm run build` runs the docs sync first, then TypeScript and Vite.

## GitHub Pages

The site is configured to deploy with GitHub Actions.

1. Push to `main`.
2. In the GitHub repo, open **Settings > Pages**.
3. Set **Source** to **GitHub Actions**.
4. The workflow publishes `dist` to GitHub Pages.

Published URL:

```txt
https://abmprottoy.github.io/reactor-docs-preview/
```

The workflow builds with the `/reactor-docs-preview/` base path and adds a `404.html` fallback so refreshed docs routes continue to load as a single-page app.

## Attribution

Documentation content is sourced from the [microsoft/microsoft-ui-reactor](https://github.com/microsoft/microsoft-ui-reactor) repository. This repo provides an alternate presentation shell for experimentation and feedback.
