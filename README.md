# tripmate-web

TripMate Web client: Next.js (App Router, TypeScript strict) built as a
static export, so one build serves browsers and the Desktop client.

## Quick start

Needs Node.js 24 (see `.nvmrc`) and npm.

```sh
npm ci
npm run dev        # http://localhost:3000
```

Checks, the same as CI:

```sh
npm run lint
npm run typecheck
npm test
npm run build      # static export to out/
npm run check:eol
```

Product documents are in the sibling repository `tripmate-docs`.
Conventions and rules for contributors and AI agents are in
[CLAUDE.md](CLAUDE.md).
