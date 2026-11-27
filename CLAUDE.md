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
| `npm run dev` | Dev server on `localhost:3000`, against the API at `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`). `NEXT_PUBLIC_API_MODE=mock npm run dev` answers from the contract's examples with MSW | -- |
| `npm run lint` | ESLint (flat config, Next.js rules), fails on any warning | `lint` |
| `npm run typecheck` | `next typegen` then `tsc --noEmit` | `typecheck` |
| `npm test` | Vitest once, jsdom, Testing Library; every run has mock mode on (MSW server with the generated handlers, a request with no handler fails) | `test` |
| `npm run build` | Static export to `out/`. Fails when `NEXT_PUBLIC_API_MODE=mock` is set: a production build never has mock mode, MSW, or `mockServiceWorker.js` | `build` |
| `npm run generate:contracts` | Rewrites `src/api/generated/` (Orval: client, TanStack Query hooks, MSW handlers) and `src/messages/{en,vi}.json` (next-intl) from the pinned contracts version | -- |
| `npm run check:contracts` | Regenerates both into a temporary folder and fails when they differ from the committed files; offline once `npm ci` has run | `check-contracts` |
| `npm run check:eol` | Fails when `git status --porcelain` shows any file, or `git ls-files --eol` shows a text file with a CRLF or mixed ending in the index or the working tree | `line-endings (windows-latest)`, `line-endings (macos-latest)` |

The pinned contracts version is the npm git dependency
`tripmate-contracts` in `package.json` (a tag, for example
`contracts-v0.2.0`); `package-lock.json` records its commit. To move the
pin: change the tag with `npm install --save-dev --save-exact`, keep the
`git+https://` form in both files (npm rewrites it to `github:` and
`git+ssh://`; the `https` form keeps the lock's URL stable and readable and
needs no SSH, though npm 11 also fetches this public repository over https
from a `git+ssh` entry), run `npm run generate:contracts`, and commit the lock file
and the generated files together. Never edit `src/api/generated/` or
`src/messages/` by hand.

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

## CI

`.github/workflows/ci.yml` runs on every pull request and every push to
`main`. The checks required on `main` are `lint`, `typecheck`, `test`,
`build`, `check-contracts`, `line-endings (windows-latest)` and
`line-endings (macos-latest)`.

## Flow checks

`.github/workflows/flow.yml` runs the checks of development-flow.md,
section 2.3 (EPIC-11 spec, section 2.12), by calling the backend's reusable
`flow-checks.yml`; `.github/workflows/risk-gate.yml` (`pull_request_target`)
calls the backend's `risk-gate-check.yml`. Both and `flowchecks-ref` are
pinned to one full commit SHA of `tripmate-backend` (`c20f515`, which has
F15 and F16); moving the pin is a normal pull request. The checks required
on `main`, with the CI checks above, are `flow / failing-first`,
`flow / test-lock` and `gate / risk-gate`. `flow / mutation` is skipped here
(no rule files) and `flow / risk-gate` is always skipped; never require them.

- `failing-first`: each test file a test commit adds (trailer
  `Agent: test`) is run on its own at that commit with
  `npx vitest run <file>` (after `npm ci` in that commit's worktree) and
  must fail there. A run with "No test found in suite" or "No test suite
  found in file" is an error of the run.
- `test-lock`: a commit without the trailer must not change, skip, or delete
  a test of a test commit, or a file under `tests/` that one added. A test
  commit changes files under `tests/` only.
- `risk-gate`: a High path changed and the pull request has no
  `human-approved` label. Only the product owner adds it; Claude Code never
  does. A push removes it.
- There is no requirement-to-test report here: EPIC-11 has no P0
  requirement ID, so there is no `tests/requirement-ids.txt`.
- The path list is `.github/risk-paths.toml`. High: `.github/**`,
  `scripts/**`, every `CLAUDE.md`, `.claude/**`, `package.json`,
  `package-lock.json`, the config files (`next.config.ts`,
  `vitest.config.mts`, `eslint.config.mjs`, `tsconfig.json`,
  `orval.config.mjs`, `.npmrc`, `.nvmrc`, `.gitattributes`) and
  `src/mocks/**` (the handlers and the setup file decide what every screen
  test and the dev server answer).
  Low: `src/**` (so also `src/api/generated/**` and `src/messages/**`, which
  the `check-contracts` job guards and a pin change reaches only through
  High files), `tests/**`, `tasks/**`, `README.md`, `.gitignore`. A path no
  rule names is High.

### Vitest tests

- The test agent writes `tests/<area>/<thing>.test.ts` or `.test.tsx` with
  the case ID in the test name (`WF2-3 ...`), one case per file so that
  failing first judges each case on its own. The flow checks read
  `tests/**/*.test.ts*`.
- Helpers go under `tests/support/`. They match no test pattern and are
  support files of the test commit: only a commit with the trailer
  `Agent: test` may change them.
- A test loads a module the card adds with the run-time `load()` helper, so
  a missing module fails the named test and not the whole file.
- Mock mode is on in every run through `src/mocks/vitest.setup.ts`
  (`setupFiles`); a test that needs `fetch` stubbed uses `vi.stubGlobal`.
- Further unit tests of the code agent are new files or new tests; the code
  agent never changes, skips (`it.skip`, `.todo`) or deletes a test of the
  test agent.

## Folder layout

```text
tripmate-web/
├── .claude/agents/        the four agent roles
│   ├── test-agent.md
│   ├── code-agent.md
│   ├── test-check-agent.md
│   └── diff-review-agent.md
├── .github/workflows/     ci.yml, flow.yml, risk-gate.yml; risk-paths.toml
├── scripts/               Node scripts shared by CI and every machine
│                          (check-contracts, generate-contracts, check-line-endings)
├── src/app/               Next.js App Router pages and layouts, providers.tsx
├── src/api/               client.ts (apiFetch, headers), mode.ts, generated/ (Orval)
├── src/mocks/             MSW: handlers, browser worker, Vitest setup file
├── src/messages/          en.json, vi.json (generated, next-intl)
├── src/i18n/              typed messages
├── tasks/                 <epic>.md task files (planning pull requests
│                          only) and <epic>-notes/<card>.md notes files
├── tests/                 Vitest tests, mirroring src/ (tests/app/...)
├── next.config.ts         output: 'export'; refuses a mock production build
├── orval.config.mjs       Orval generation from the pinned contract
├── eslint.config.mjs
├── vitest.config.mts
└── tsconfig.json          strict: true
```

## Conventions

- Static export only (ADR-0007): no server components that fetch at
  request time, no API routes (`route.ts`), no server actions, no
  middleware, no `headers()`/`cookies()`. Screens fetch from the browser.
- Every request goes through `apiFetch` (`src/api/client.ts`), which adds
  `X-Device-Id` and, for a `POST` sent with an action, `Idempotency-Key`.
  One user action is one `newAction()`; send the same action again to retry
  it, call `newAction()` again for a new action. Sign-in and refresh take no
  action, so no key.
- Texts come from `next-intl` messages (`useTranslations`); a key the pinned
  contracts version does not have is a type error and throws at render,
  never shows as text.
- MSW is loaded only behind `process.env.NODE_ENV === "development"` (or in
  Vitest); never import `src/mocks/` from application code.
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
