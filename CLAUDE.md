# tripmate-web -- Rules for Contributors and AI Agents

The TripMate Web client: Next.js App Router, TypeScript strict, built
as a static export (HTML, JS and CSS only, no server). The Desktop
client (`tripmate-desktop`) wraps this same build.

## Read first

Product documents live in `../tripmate-docs/` and are never copied
here. Read them in place:

- `../tripmate-docs/CLAUDE.md`, section "Working on several machines":
  the shared rules every session follows (language, secrets, cards,
  who pushes).
- `../tripmate-docs/GLOSSARY.md`: domain terms. Use them in code names,
  UI text and commits.
- `../tripmate-docs/prd.md`: what the MVP must do.
- `../tripmate-docs/docs/architecture.md` (section 11: repositories),
  `docs/api-design.md`, `docs/security.md`, `docs/test-strategy.md`.
- `../tripmate-docs/docs/development-flow.md`: task files, cards, risk
  levels, the four agents (section 2.3), what is written where
  (section 2.4), Definition of Done.
- The task of the card being built, in this repository:
  `tasks/<epic>.md` (for example `tasks/EPIC-11.md`). It holds the
  card's scope, risk level, test cases and manual checks.
- The spec of the epic being built, for the behaviour and the design:
  `../tripmate-docs/docs/specs/<epic>/spec.md` (the Web platform is
  EPIC-11, sections 2.9, 2.11, 2.12 and 4.3).
- `../tripmate-docs/docs/adr/0007-web-client-is-a-static-build.md`.

When a document does not decide something, stop and ask the product
owner; do not guess.

## Language

- Talk with the product owner in Vietnamese.
- Write code, comments, commits, pull requests and documents in English.

## How a card is built

Each card runs four agents, each in a new session with no memory of
the others; only files and the comments on the pull request pass
between them. The roles are in `.claude/agents/`.

Each agent's model is set in its role file: `code-agent` runs on Sonnet;
`test-agent`, `test-check-agent`, and `diff-review-agent` run on Opus
(development-flow.md, section 2.3). Do not override it when starting an
agent.

1. Test agent (`test-agent.md`): one test per case of the task, a test
   commit with the trailer `Agent: test`, each new test shown failing.
2. Code agent (`code-agent.md`): code until every test passes, the
   local checks, the decisions.
3. Test-check agent (`test-check-agent.md`), locally: the tests against
   the task, the code against the tests. Its report goes in the pull
   request description; a test problem goes to a new test agent
   session, a code problem to the code agent.
4. Pull request, opened by the code agent when the report is clean and
   the product owner says so. CI runs.
5. Diff review, round 1 (`diff-review-agent.md`): findings on the pull
   request at file and line, and a summary comment with the impact and
   the risk level.
6. The code agent fixes each round 1 finding, or replies with the
   reason it does not apply, and pushes.
7. Diff review, round 2, in a new session: the diff since round 1 and
   the replies; nothing is fixed. A defect asks the product owner to
   review; every other finding is a note.
8. Notes: `tasks/<epic>-notes/<card>.md` (for example
   `tasks/EPIC-11-notes/WF2.md`), one file per card, written by the
   round 2 agent, committed by the code agent in the card's pull
   request, and settled when the epic closes.

A card never changes its task file `tasks/<epic>.md`; a correction goes
through a planning pull request and the product owner's approval.

## Setup

- Node.js 24 LTS (`.nvmrc` is `24`; `package.json` `engines` is
  `>=24 <25`, enforced by `engine-strict` in `.npmrc`).
- npm with the committed `package-lock.json`. Install with `npm ci`;
  use `npm install <pkg>` only when a card adds a dependency (that makes
  the card High risk).
- No global tools are needed.

## Commands

| Command | What it does | CI check |
|---------|--------------|----------|
| `npm ci` | Install exactly the locked dependencies | -- |
| `npm run dev` | Dev server on `localhost:3000` | -- |
| `npm run lint` | ESLint (flat config, Next.js rules), fails on any warning | `lint` |
| `npm run typecheck` | `next typegen` then `tsc --noEmit` | `typecheck` |
| `npm test` | Vitest once, jsdom, Testing Library | `test` |
| `npm run build` | Static export to `out/` | `build` |
| `npm run check:eol` | Fails when `git status --porcelain` shows any file, or `git ls-files --eol` shows a text file with a CRLF or mixed ending in the index or the working tree | `line-endings (windows-latest)`, `line-endings (macos-latest)` |

Each check owns one kind of problem: `next build` skips type checking
(`typescript.ignoreBuildErrors`) and does not lint, so a type error
fails only `typecheck` and a lint error fails only `lint`. Run all of
them before opening a pull request.

A Claude Code hook runs them for you. Before Claude runs `git push` or
`gh pr create` in this repository, the `PreToolUse` hook in
`.claude/settings.json` runs `check:eol`, `lint`, `typecheck`, `test`
and `build` (`.claude/hooks/check-before-push.mjs`), and blocks the
command when one fails, with the failing output. Fix the problem,
commit, and run the command again; never work around the hook.
Deleting a remote branch is not checked. CI stays the gate on `main`:
the hook only catches problems before the push.

## Folder layout

```text
tripmate-web/
├── .claude/agents/        the four agent roles
│   ├── test-agent.md
│   ├── code-agent.md
│   ├── test-check-agent.md
│   └── diff-review-agent.md
├── .github/workflows/     ci.yml
├── scripts/               Node scripts shared by CI and every machine
├── src/app/               Next.js App Router pages and layouts
├── tasks/                 <epic>.md task files (planning pull requests
│                          only) and <epic>-notes/<card>.md notes files
├── tests/                 Vitest tests, mirroring src/ (tests/app/...)
├── next.config.ts         output: 'export'
├── eslint.config.mjs
├── vitest.config.mts
└── tsconfig.json          strict: true
```

## Conventions

- Static export only (ADR-0007): no server components that fetch at
  request time, no API routes (`route.ts`), no server actions, no
  middleware, no `headers()`/`cookies()`. Screens fetch from the browser.
- No secret ever lives in this client; the repository is public. Never
  commit a `.env` file, a token, a key or a password.
- TypeScript `strict`; no `any` unless a comment says why.
- Tests live in `tests/`, named `<thing>.test.ts(x)`. Test names carry
  the requirement or case ID when they prove one (for example
  `WF2-3 ...`).
- Shared scripts are Node (`.mjs`), never PowerShell or bash, so they
  run the same on Windows and macOS.
- Branches, commits and pull requests follow
  `../tripmate-docs/docs/development-flow.md`, section 2.5: every commit
  message starts with the card ID.
- Push only when the product owner says so.

## Windows and macOS

The work runs on Windows (this repository's machine) and on macOS.

- `.gitattributes` stores and checks out every text file with LF on
  every OS, whatever `core.autocrlf` is; image and font files are
  binary. Editors must keep LF.
- After any change, `git status --porcelain` must show only the files
  you meant to change; `npm run check:eol` checks a clean tree.
- Use `path`/`node:` APIs in scripts, never hard-coded `/` or `\`
  separators or shell-specific commands.
