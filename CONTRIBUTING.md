# Contributing

Thank you for improving the QA framework. This doc covers the minimum workflow
for human contributors and agents.

> **Start here:** [docs/INDEX.md](docs/INDEX.md) · [Cookbooks](docs/cookbooks/README.md)

---

## Prerequisites

- Node.js 22
- `npm ci` (not `npm install`) for reproducible installs
- `npm run test:setup` after clone (Chromium for UI/a11y/visual)

---

## Branch naming

| Context | Convention | Example |
|---|---|---|
| Cursor Cloud Agent | `cursor/<description>-85fc` | `cursor/fix-flaky-conduit-85fc` |
| Human / other | descriptive kebab-case | `feat/conduit-comments-ui` |

One logical change per branch. Keep PRs focused.

---

## Code conventions

Enforced by Cursor rules (`.cursor/rules/`) and CI:

- **Page Objects** — locators only in `tests/pages/`
- **Factories** — Faker data via `factories/`, never inline in `.spec.ts`
- **Fixtures** — import `test`/`expect` from `@fixtures/*`, not raw `@playwright/test`
- **Tags** — every test: `@smoke` or `@regression` + layer tag ([tags.md](docs/tags.md))
- **Steps** — wrap key actions in `test.step('English description', …)`

Adding a test? Use the [cookbooks](docs/cookbooks/README.md).

---

## Quality gates

| Gate | When | Command |
|---|---|---|
| Pre-commit (Husky) | every commit | ESLint --fix + Prettier on staged `*.ts`/`*.js` |
| Pre-push (Husky) | every push | `tsc --noEmit` |
| CI lint | push/PR to `main` | `npm run lint` |

---

## Before opening a PR

Run the PR-like smoke path (no backend required):

```bash
npm ci
npm run test:setup
npm run test:smoke          # contract + a11y + ui-chromium @smoke
npm run lint
npx tsc --noEmit
```

If you changed Conduit tests:

```bash
npm run test:conduit:demo:smoke   # public demo (may flake)
# or
npm run test:conduit:smoke          # Docker stack (needs Docker)
```

If you changed Users API or contract layer:

```bash
npm run test:contract               # always — no network
npm run test:smoke:api              # live API — needs .env + API_BASE_URL
```

If you changed visual baselines:

```bash
npm run test:visual                 # local OS baseline only
# For CI (Linux): trigger "Update Visual Baselines" workflow — see docs/visual-regression.md
```

---

## PR checklist

- [ ] Tests pass for the layers you touched
- [ ] `npm run lint` and `npx tsc --noEmit` clean
- [ ] New tests have tags + `qase(id, 'title')` when Qase cases exist
- [ ] No secrets in commits (`.env`, tokens, credentials)
- [ ] Docs updated if you add a layer, tag, or npm script

---

## CI expectations

| Job | Runs when | Notes |
|---|---|---|
| `ui-ci` | every PR | `@smoke` on PR; lint + contract + ui-chromium + a11y |
| `api-ci` | every PR | skips if API secrets missing |
| `conduit-ci` | every PR | Docker stack + Conduit API/UI |
| `visual-ci` | every PR | runs when `*-linux.png` baselines exist |

A green PR does not require local `npm test` (full regression) to pass — that
command runs all projects including ones needing `.env`, Docker, or OS-specific
baselines.

---

## Getting help

- [Architecture](docs/architecture.md) — how layers connect
- [Conduit map](docs/conduit-map.md) — RealWorld file layout
- [Qase integration](docs/qase.md) — optional TestOps reporting
- [Visual regression](docs/visual-regression.md) — screenshot baselines
- [Troubleshooting](README.md#troubleshooting) — common errors
