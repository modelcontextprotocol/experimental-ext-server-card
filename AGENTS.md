# AGENTS.md — MCP Server Cards (Experimental Extension)

Operating manual for AI coding agents working in this repository.

**Read [`README.md`](./README.md) first.** It is the source of truth for everything mechanical — what a Server Card is, the repo layout, the schema build/validate workflow (`npm run generate` / `check` / `validate` / `format`), the rule that `schema.ts` is authoritative and `schema.json` is generated (never hand-edited, regenerated in the same commit, enforced by CI), the `$schema` URL convention, and the graduation plan. This file does **not** repeat any of that; it only adds the contribution conduct the README doesn't cover.

## Contribution principles

Ordered most-important first.

### 1. Open PRs for human review — do not self-merge agent-generated changes

Agent-driven changes should be opened as a pull request for a human maintainer to review and merge. Even when the account running the agent has merge permissions, **do not merge your own AI-generated PRs** (and do not enable auto-merge). The decision to merge belongs to a human.

### 2. Stay small, scoped, and conservative

This is an active, spec-tracked, community project. Make one coherent change per PR; don't bundle unrelated refactors or repo-wide reformatting into a feature/fix. Write clear PR descriptions that link the relevant SEP/issue and explain how you verified the change. Match existing conventions and defer to maintainers on direction. For anything larger than a self-contained change, prefer opening an issue or a draft PR for discussion over a large unilateral edit.

### 3. Respect the experimental, spec-tracked nature

Schema decisions here feed SEP-2127 and, eventually, the core MCP spec. Don't make changes that pre-empt or contradict unresolved spec discussion, and keep the README's "Graduation plan" migration path intact. "Experimental" means provisional, not low-stakes.

### 4. Treat the schema as a public contract

`schema.json` is consumed by external tools and published documents. If a change is breaking for consumers (removing/renaming fields, tightening required-ness), call it out explicitly in the PR description rather than shipping it silently.

## What NOT to do

- Do **not** merge your own AI-generated PR, even with permission (Principle 1).
- Do **not** bundle unrelated changes, reformat the whole repo, or do sweeping renames in a feature/fix PR.
- Do **not** make schema changes that pre-empt unresolved SEP-2127 / core-spec discussion.
