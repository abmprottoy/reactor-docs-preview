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

## Self Deployment

This repository does not include an automatic GitHub Actions deployment. That avoids spending GitHub runner minutes on dependency installs and scheduled rebuilds.

To build a static copy yourself:

```powershell
npm run build
```

The static site is written to:

```txt
dist/
```

You can upload that folder to any static host, including GitHub Pages, Cloudflare Pages, Netlify, Vercel, or a plain web server.

For a subpath deployment such as GitHub Pages project sites, set `GITHUB_PAGES=true` during build so Vite emits `/reactor-docs-preview/` asset paths:

```powershell
$env:GITHUB_PAGES = "true"
npm run build
Remove-Item Env:\GITHUB_PAGES
```

For single-page app routing on static hosts, copy `dist/index.html` to `dist/404.html` before uploading:

```powershell
Copy-Item dist/index.html dist/404.html
```

## Keeping Docs Fresh

Docs are refreshed whenever `npm run sync:docs` runs. The normal build command runs it first, so redeploying after `npm run build` pulls the latest Markdown from `microsoft/microsoft-ui-reactor/docs/guide`.

If you want automation later, run the build from your own scheduler, server, or deployment platform instead of this repo's GitHub Actions.

## Attribution

Documentation content is sourced from the [microsoft/microsoft-ui-reactor](https://github.com/microsoft/microsoft-ui-reactor) repository. This repo provides an alternate presentation shell for experimentation and feedback.
