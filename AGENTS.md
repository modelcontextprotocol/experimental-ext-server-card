# AGENTS.md — MCP Server Cards (Experimental Extension)

Operating manual for AI coding agents working in this repository. For full domain context (what a Server Card is, the Server superset, the graduation plan, and references), read [`README.md`](./README.md) first — this file does not repeat it.

## What this repo is, in one line

The TypeScript source-of-truth (`schema.ts`) and generated JSON Schema 2020-12 (`schema.json`) for **MCP Server Cards**, an **experimental** extension tracking [SEP-2127](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127). It is a temporary incubator: when the SEP is accepted, the schema migrates into the main `modelcontextprotocol/modelcontextprotocol` repo and this repo is archived (see the README's "Graduation plan").

## Layout

See [`README.md` → Layout](./README.md#layout). The essentials: `schema.ts` is the only place to make schema changes; `schema.json` is **generated** and checked in; `scripts/` holds the generator and the example validator; `examples/` holds valid/invalid `ServerCard` and `Server` documents that double as the test suite.

## Working in this repo

Follow the README's "Working on the schema" section. The non-negotiables:

- **`schema.ts` is the source of truth. Never hand-edit `schema.json`** — regenerate it with `npm run generate` and commit the result **in the same commit** as the `schema.ts` change. CI runs `npm run check` and fails on drift.
- **Cover behavior changes with examples.** Add/update documents under `examples/ServerCard/{valid,invalid}` (and `examples/Server/...` where relevant) so `npm run validate` exercises the change.
- **Match conventions.** The `$schema` field on documents follows the versioned `https://static.modelcontextprotocol.io/schemas/v1/<name>.schema.json` pattern (README → "Schema URL conventions"). Run `npm run format` before committing.
- Before pushing, run `npm run check` and `npm run validate` locally to reproduce CI.

## Core principles

Ordered most-important first.

### 1. Open PRs for human review — do not self-merge agent-generated changes

Agent-driven work here opens a pull request and hands it back to a human maintainer to review and merge. Even when the account running the agent has merge permissions, **do not merge your own AI-generated PRs** (and do not enable auto-merge). The decision to merge belongs to a human.

### 2. Stay small, scoped, and conservative

This is an active, spec-tracked, community project. Make one coherent change per PR; don't bundle unrelated refactors or repo-wide reformatting into a feature/fix. Write clear PR descriptions that link the relevant SEP/issue and explain how you verified the change. Match existing style and layout, and defer to maintainers on direction. For anything larger than a self-contained change, prefer opening an issue or a draft PR for discussion over a large unilateral edit.

### 3. Respect the experimental, spec-tracked nature

Schema decisions here feed SEP-2127 and, eventually, the core MCP spec. Don't make changes that pre-empt or contradict unresolved spec discussion. "Experimental" means provisional, not low-stakes — keep the migration path in the README's "Graduation plan" intact (e.g., keep `schema.ts` structured so it can be lifted into the main spec).

### 4. Treat the schema as a public contract

`schema.json` is consumed by external tools and published documents. If a change is breaking for consumers (removing/renaming fields, tightening required-ness), call it out explicitly in the PR description rather than shipping it silently.

## What NOT to do

- Do **not** merge your own AI-generated PR, even with permission (Principle 1).
- Do **not** hand-edit `schema.json` — regenerate it from `schema.ts`.
- Do **not** bundle unrelated changes, reformat the whole repo, or do sweeping renames in a feature/fix PR.
- Do **not** make schema changes that pre-empt unresolved SEP-2127 / core-spec discussion.

## FAQ

- **Q: CI fails on a `schema.json` mismatch — what happened?**
  A: `schema.ts` changed without regenerating. Run `npm run generate` and commit the updated `schema.json` in the same commit. `npm run check` reproduces the CI assertion locally.

- **Q: It's just an experimental repo — can I restructure boldly?**
  A: No. It tracks an active SEP and feeds the core spec. Stay small and scoped (Principle 2); raise larger ideas via an issue or draft PR first.
