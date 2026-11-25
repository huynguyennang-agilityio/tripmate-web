# tripmate-web -- EPIC-11 Tasks: Platform Foundation

**Document type:** Task file\
**Epic:** EPIC-11, first part, Phase 1\
**Repository:** `tripmate-web`\
**Machine:** Windows\
**Spec:** [EPIC-11 spec](https://github.com/huynguyennang-agilityio/tripmate-docs/blob/main/docs/specs/epic-11/spec.md)\
**Status:** Proposed\
**Version:** 1.0

The tasks of EPIC-11 in this repository, in the order they start. Each task holds everything its Trello card will say ([development-flow.md](https://github.com/huynguyennang-agilityio/tripmate-docs/blob/main/docs/development-flow.md), section 1). The behaviour, the design, the order of the cards across repositories, and the checkpoints are in the spec, section 6.

Test case levels are the letters of [test-strategy.md](https://github.com/huynguyennang-agilityio/tripmate-docs/blob/main/docs/test-strategy.md), section 2. A case of level M has no automated test; it is shown once by hand and listed under Manual checks.

| Task | Title | Size | Risk | Depends on | Wave |
|------|-------|------|------|------------|------|
| [WF1](#wf1) | Web skeleton and CI | S | High | -- | 1 |
| [WF2](#wf2) | Web API client and mock mode | M | High | WF1, CT2 | 3 |
| [WF3](#wf3) | Web smoke set and production site | S | High | WF2, F11 | 5 |

## WF1

**WF1 Web skeleton and CI**

**Facts**

| Fact | Value |
|------|-------|
| Epic | EPIC-11 |
| Repository | `tripmate-web` |
| Machine | Windows, wave 1 |
| Size | S |
| Risk | High: it adds CI, `CLAUDE.md`, and the agent roles |
| Depends on | -- |
| Requirements | -- |
| Spec sections | 2.9, 2.11, 4.3 |

**Scope**

- Next.js App Router with static export, TypeScript strict, ESLint, Vitest with Testing Library.
- Lint, types, tests, and the static build on every pull request, required on `main`.
- `CLAUDE.md`, `.gitattributes`, and the four agent roles (4.3).

**Leaves out**

- The generated client, messages, mock mode, and the flow checks: WF2.

**Done when**

Next.js static export, TypeScript strict, ESLint, Vitest with Testing Library; the checks of 2.9 that need no contract, required on `main`; `CLAUDE.md`, `.gitattributes`, and the four agent roles (4.3)

**Test cases**

| Case | Kind | Given | Expected | Level |
|------|------|-------|----------|-------|
| WF1-1 | Main | The project with no problem | Lint, types, tests, and the static build pass, and each is required on `main` | M |
| WF1-2 | Error | A lint error, a type error, or a failing test | The matching check fails | M |
| WF1-3 | Edge | The repository checked out on Windows and on macOS | No file shows as changed | M |

**Manual checks**

- [ ] WF1-1: The project with no problem → Lint, types, tests, and the static build pass, and each is required on `main`
- [ ] WF1-2: A lint error, a type error, or a failing test → The matching check fails
- [ ] WF1-3: The repository checked out on Windows and on macOS → No file shows as changed

## WF2

**WF2 Web API client and mock mode**

**Facts**

| Fact | Value |
|------|-------|
| Epic | EPIC-11 |
| Repository | `tripmate-web` |
| Machine | Windows, wave 3 |
| Size | M |
| Risk | High: it adds the generated client and the flow checks |
| Depends on | WF1, CT2 |
| Requirements | Cross-client API contract tests |
| Spec sections | 2.11, 2.9, 2.12 |

**Scope**

- `next-intl` messages generated from the pinned contracts version; a key the pinned version does not have fails the build.
- The client and TanStack Query hooks generated with Orval, and MSW handlers from the pinned draft; mock mode on with `NEXT_PUBLIC_API_MODE=mock` and in screen tests, and never in a production build.
- `X-Device-Id` on every request, kept across reloads; `Idempotency-Key` on creates, the same for retries of one action and new for a new action.
- One test screen reads `GET /v1/health` in both modes.
- The checks that the generated client and messages match the pinned version, and the flow checks of 2.12, required on `main`.

**Leaves out**

- Feature screens: EPIC-01 and later.
- The smoke set and production site: WF3.

**Done when**

`next-intl` messages generated from the pinned contracts version; the generated client and hooks, MSW handlers from the pinned draft, the headers of 2.11; one test screen reads `GET /v1/health` in both modes; the remaining checks of 2.9 and the flow checks of 2.12 required on `main`

**Test cases**

| Case | Kind | Given | Expected | Level |
|------|------|-------|----------|-------|
| WF2-1 | Main | Mock mode on | The test screen shows the example of `GET /v1/health` from the pinned contract | S |
| WF2-2 | Main | Mock mode off, the local stack up | The test screen shows the real answer | M |
| WF2-3 | Main | Any request | It carries `X-Device-Id`, the same value after a reload | U |
| WF2-4 | Main | A create request that is retried | Both attempts carry the same `Idempotency-Key` | U |
| WF2-5 | Edge | The same action done a second time by the user | A new key | U |
| WF2-6 | Error | The generated client does not match the pinned contracts version | The check fails | C |
| WF2-7 | Edge | A production build with no mock setting | Mock mode is off, and the mock handlers are not in the bundle | U |
| WF2-8 | Main | A screen test of one message key | The key shows its text in Vietnamese and in English | S |
| WF2-9 | Error | The generated messages do not match the pinned contracts version | The check fails | C |
| WF2-10 | Edge | A key the pinned contracts version does not have | The build fails; no key is shown as raw text | S |

**Manual checks**

- [ ] WF2-2: Mock mode off, the local stack up → The test screen shows the real answer
- [ ] Checkpoint: Together with CT2 and the other client: a stub route becomes a draft tag, and the test screen on Web and on Mobile shows its example in mock mode. EPIC-01 can start with B0.

## WF3

**WF3 Web smoke set and production site**

**Facts**

| Fact | Value |
|------|-------|
| Epic | EPIC-11 |
| Repository | `tripmate-web` |
| Machine | Windows, wave 5 |
| Size | S |
| Risk | High: it adds a CI job and the production site on Render |
| Depends on | WF2, F11 |
| Requirements | -- |
| Spec sections | 2.8, 2.9, 2.11 |

**Scope**

- Playwright runs the smoke set in CI against the stack of 2.8, with the backend image of the pinned release.
- The production static site on Render serves the join page for every `/join/*` path.

**Leaves out**

- The real join page: its EPIC-02 card; here it is a placeholder.

**Done when**

Playwright runs in CI against the stack of 2.8; the production static site on Render serves the join page for every `/join/*` path

**Test cases**

| Case | Kind | Given | Expected | Level |
|------|------|-------|----------|-------|
| WF3-1 | Main | The stack of 2.8 in CI | The smoke set opens the test screen and passes | E |
| WF3-2 | Error | The backend of the stack is down | The smoke set fails; it does not pass on an empty page | E |
| WF3-3 | Main | The production site, at `/join/ABC123` | The join page is served | M |

**Manual checks**

- [ ] WF3-3: The production site, at `/join/ABC123` → The join page is served

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-11-25 | First version: the 3 tasks of EPIC-11 in this repository, moved from the EPIC-11 spec, sections 6 and 7, with scope, what each leaves out, the reason for its risk level, and its manual checks. The skeleton tasks write four agent roles, as development-flow.md now says. |
