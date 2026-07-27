# Server Cards: Core Maintainer Roadmap

This document is a high-level outline of the tracks this project expects to take
up next, framed for the Core Maintainer roadmap discussion. Each track gets a
short brief: the goal (what problem it solves), the core idea of the solution,
key requirements, and the open questions we still need to answer. As tracks
mature, each brief should graduate into a full problem statement, SEP update, or
implementation PR.

Tracks are listed in rough priority order.

Related context:

- [SEP-2127: MCP Server Cards](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127)
  — the spec this repo tracks.
- [SEP-2133: Extensions framework](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2133)
  — the track Server Cards graduate through.
- [Graduation plan](../README.md#graduation-plan) — the mechanical migration
  path from this experimental repo into the core spec.

---

## 1. Graduation: Server Card as an Official MCP Extension

**Goal:** Move Server Cards from an experimental prototype to an accepted,
official MCP extension. This is close but has not happened yet: SEP-2127 is
still under review, and the Extensions Track sets concrete gates that must be
cleared before it can advance toward Final. This track is about closing those
gates deliberately rather than letting the SEP stall.

**Core Idea:** Treat graduation as a checklist, not a single vote. SEP-2133
requires that an extension "MUST have at least one reference implementation in
an official SDK prior to review to ensure the extension is practical and
implementable." So the critical path is: land the SDK reference implementation,
land client/server best-practices guidance, keep the schema (the public
contract) frozen in a shape everyone agrees on, and confirm the live wire
formats match the spec — then advance SEP-2127. The
[graduation plan](../README.md#graduation-plan) already describes the mechanical
lift-and-shift into `schema/draft/schema.ts` once the SEP is accepted; this
track is about earning that acceptance.

**Key Requirements:**

- **SDK reference implementation merged** ([#16](https://github.com/modelcontextprotocol/experimental-ext-server-card/issues/16)).
  The Extensions Track gate. [python-sdk#2951](https://github.com/modelcontextprotocol/python-sdk/pull/2951)
  is the furthest-along artifact; it must be reviewed, agreed, and merged, and
  reflect the shape we have settled on. Decide whether Python alone satisfies the
  "at least one official SDK" bar or whether we want Go/TypeScript before
  advancing.
- **Client (and server) best practices** ([#40](https://github.com/modelcontextprotocol/experimental-ext-server-card/issues/40)).
  Land [PR #36](https://github.com/modelcontextprotocol/experimental-ext-server-card/pull/36)
  so implementors have authoritative guidance rather than reverse-engineering it
  from examples.
- **Reference-implementation showcase** ([#34](https://github.com/modelcontextprotocol/experimental-ext-server-card/issues/34)).
  The GitHub MCP Server card + AI Catalog wiring gives the WG a live end-to-end
  shape (routes, media types, ETag/`304` behavior) to sanity-check against the
  spec before locking it.
- **Schema/spec/reference-impl agreement.** The reference impl and this repo's
  `schema.ts` (the source of truth) must not disagree on the well-known path,
  `$schema` URL, media type, and the card-only (no `packages`, no primitives)
  shape. Two hand-maintained shapes will drift.
- **Breaking-change discipline.** `schema.json` is a public contract consumed by
  external tools; any remaining shape change before freeze must be called out
  explicitly, not shipped silently.

**Open Questions:**

- Is one official SDK (Python) enough to open review, or do we want a second
  (Go/TypeScript) implementation first?
- Are the SDK's models generated from / checked against this repo's schema, or
  independently authored? How do we prevent drift after graduation?
- Is the `$schema` v1 URL real, agreed, and matched by everything that publishes
  it (repo, SDK default, SEP registration)?
- What is the minimum shape we freeze for the initial SEP, so we can formalize
  the extension now and expand later (see the auth backlog item) without
  re-opening graduation?
- Which decisions here are reversible after graduation, and which are one-way
  doors we must settle before Final?

---

## 2. Primitives for Offline Discovery

**Goal:** Let a Server Card optionally describe _what a server does_ — its tools,
resources, and prompts — for consumers that will never open a live MCP
connection. Today the card is deliberately primitive-free
([PR #19](https://github.com/modelcontextprotocol/experimental-ext-server-card/pull/19)),
which is correct for connection-oriented clients but leaves registries,
developer portals, and agent orchestrators planning tool routing with a card
that lists URLs and no operations.

**Core Idea:** Add _optional_ `tools` / `resources` / `prompts` arrays using the
existing MCP primitive types, explicitly scoped to static discovery, not
execution. Dynamic servers simply omit them; clients still use `tools/list` at
runtime as the source of truth. The OpenAPI parallel is the intended mental
model: static, documentation-grade description of what a server supports, used
for discovery and planning rather than as the runtime contract. This is tracked
as a post-graduation / `v2` enhancement
([#30](https://github.com/modelcontextprotocol/experimental-ext-server-card/issues/30)),
so it should not block or reshape the graduation freeze in Track 1.

**Key Requirements:**

- Primitive listings are strictly optional and clearly marked as
  discovery-only, non-authoritative metadata — runtime listing remains the
  source of truth.
- Reuse the existing MCP `Tool` / `Resource` / `Prompt` types rather than
  inventing card-specific shapes, so a static definition and its runtime
  counterpart are the same shape.
- A defined stance on staleness: what a consumer should assume when the static
  list and the live `tools/list` diverge.
- Coherence with the card's "remote connectivity only" framing and with the MCP
  Registry `server.json` — decide what belongs on the card vs. the registry.
- Backwards compatibility: adding optional arrays must not break existing
  card consumers or the frozen v1 shape.

**Open Questions:**

- Does adding primitives contradict the card's remote-only positioning, or is
  "optional static discovery hints" a clean, separable layer on top of it?
- Where does this live relative to graduation — strictly a `v2` follow-up on the
  frozen v1 card, or does the _possibility_ of primitives change any v1 decision
  now?
- How do we prevent the static list from becoming misleading as servers evolve —
  versioning, freshness signals, or explicit "may be stale" semantics?
- Is the right home the Server Card, the MCP Registry `server.json`, or both,
  and how do they stay consistent?
- Do we constrain how much a card may enumerate (all tools vs. a curated
  subset), and does partial enumeration need to be signalled?

---

## Also on the radar (backlog)

Real work, but explicitly _not_ proposed as roadmap tracks right now — captured
so the gaps are tracked rather than rediscovered. Most of these are `v2` /
fast-follow items that should not disturb the graduation freeze in Track 1.

- **Comprehensive auth scenarios** ([#13](https://github.com/modelcontextprotocol/experimental-ext-server-card/issues/13),
  `v2`). Expand the card's auth shape to cover the broader set of scenarios
  raised in review. Deliberately sequenced _after_ formalizing the initial SEP
  with a limited shape, so we collect community feedback before locking new
  fields in.
- **Catalog discovery completeness**
  ([#43](https://github.com/modelcontextprotocol/experimental-ext-server-card/issues/43)
  and
  [#44](https://github.com/modelcontextprotocol/experimental-ext-server-card/issues/44)).
  Honor the full AI Catalog discovery precedence (`Link` header and HTML
  `<link rel="ai-catalog">`, not just `/.well-known`) and resolve nested
  catalogs with a depth cap and cycle tracking. Same shape — both broaden what
  "resolve a catalog" means — and worth landing together. The well-known flat
  case is the common path, so nothing is blocked on this today.
- **Launch blog post** ([#45](https://github.com/modelcontextprotocol/experimental-ext-server-card/issues/45)).
  A launch/comms task rather than a spec track; drafted once we are ready for
  review, leading with implementation and end-user benefits.
