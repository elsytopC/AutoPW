---
name: context-optimization
description: >-
  Use in long agent sessions or when token cost matters. Reduces context bloat by
  masking verbose tool output, avoiding redundant reads, compacting session state,
  and scoping exploration — without sacrificing task quality in qa-framework.
---

# Context Optimization (qa-framework)

Long conversations re-send full history on every turn. Apply these tactics proactively in sessions with many tool calls, large diffs, or repeated exploration.

**Principle:** preserve signal, drop noise. Never sacrifice error details during active debugging (see `systematic-debugging` skill).

---

## When to Activate

- Session has 10+ tool calls or multiple failed fix attempts
- Same files read or searched more than once
- Large terminal output, test reports, or stack traces already in context
- User asks to reduce tokens / optimize context / continue in a lean way
- Task scope shifted — old exploration is irrelevant

---

## Priority Order (apply top → bottom)

### 1. Avoid redundant work (highest impact, zero quality risk)

Before reading or searching again, check if the answer is already in the conversation:

- Do not re-read entire files when a prior read or grep result covers the need
- Prefer **targeted** `grep` / partial `read` (offset + limit) over full-file reads
- Do not re-run the same shell command unless output may have changed
- Reuse conclusions from `.cursor/rules/` and existing skills instead of re-deriving standards

**Project shortcuts** — do not re-explore unless the task requires it:

| Need | Go directly to |
|---|---|
| API HTTP layer | `api/core/baseApi.ts`, `api/services/` |
| Test fixtures | `tests/fixtures/api.fixture.ts`, `auth.fixture.ts` |
| Test data | `factories/user.factory.ts` |
| Auth / env | `utils/auth/`, `.env` vars in README |
| Playwright config | `playwright.config.ts` |
| Standards | `.cursor/rules/*.mdc` |

### 2. Observation masking (verbose tool output)

After extracting what matters from a tool result, treat the raw output as disposable:

- **Keep in active context:** current error message, failing test name, status code, key line numbers, user constraints, pending decisions
- **Replace mentally with a one-line reference:** e.g. `[users.spec.ts:39 — ApiError 404 on getUser(999999)]`
- **Do not re-quote** full Playwright HTML reports, 100+ line diffs, or entire `package-lock.json` sections
- **Exception:** while debugging (last 3 turns), keep full error/stack — do not mask active failure details

### 3. Compaction (long sessions, >~70% context feel)

When the thread is long and prior turns are mostly settled:

Summarize **only** into a compact block before continuing:

```markdown
## Session state
- Goal: …
- Root cause (if known): …
- Files touched: …
- Decisions / user constraints: …
- Next step: …
- Ruled out: …
```

Then proceed from the summary — do not re-summarize files already captured unless they changed.

Offer the user a **new chat** if the task pivoted completely; carry only the summary forward.

### 4. Scoped exploration (partitioning lite)

For broad tasks, narrow scope before loading context:

- One concern per investigation pass (auth vs fixture vs single spec)
- Use explore subagents for wide codebase search; consume their **summary**, not raw dumps
- Stop exploration once you can name the exact file and line to change

---

## Response Discipline

- Cite code with `startLine:endLine:path` — do not paste whole files in replies
- Prefer short bullet conclusions over repeating tool output
- One hypothesis / one fix batch — avoids re-explaining prior attempts
- Do not restate the full project README unless the user asks

---

## Budget Triggers

| Signal | Action |
|---|---|
| Same file read 2+ times | Use prior excerpt or read only changed lines |
| Test output > 30 lines | Extract: test name, assertion, status, 1–3 relevant stack frames |
| User says "продолжай" / "continue" | Start with 3–5 line state recap, not full history replay |
| Debugging active | **No masking** of errors — defer compaction |
| 3+ unrelated topics in one chat | Suggest new chat with compact handoff |

---

## qa-framework Specific

- Run targeted tests: `npx playwright test <file> -g "<name>" --workers=1` — not full suite unless needed
- API-only: `--project=api` skips UI auth setup
- Do not load `playwright-report/` or traces into context — read the single failing assertion
- Env secrets (`.env`) — reference variable **names**, never repeat values in summaries

---

## Red Flags

- Pasting entire files "for context"
- Re-running `npm test` / full lint after every micro-change
- Quoting full git diff when 5 lines suffice
- Re-explaining Playwright POM / Faker / factory rules (already in `.cursor/rules/`)
- Compacting away user approval requirements or open questions

---

## Integration

- **systematic-debugging:** investigation first; mask only *resolved* observations
- **agent-behavior rule:** approval gates stay in compact state — never drop
- **User action:** for very long threads, starting a new chat with a pasted "Session state" block is often cheaper than continuing

**Source:** adapted from [Agent Skills for Context Engineering](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering) (`context-optimization`).
