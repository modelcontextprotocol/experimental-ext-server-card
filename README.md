# MCP Server Cards (Experimental Extension)

> #### **Status:** Experimental. This work is for prototyping and feedback only, and is not an accepted or official MCP extension.

This repository defines a TypeScript source-of-truth and generated JSON Schema for **MCP Server Cards** — a static metadata document that describes a remote MCP server enough for clients to discover and connect to it before initialization.

It tracks [SEP-2127](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127) and is intended to be lifted directly into the main spec when Server Cards graduate (see [Graduation plan](#graduation-plan) below).

A prior attempt to land these types directly in the core spec ([modelcontextprotocol#2652](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2652)) is being relaunched here as an experimental extension while the SEP itself is still under review.

## What is a Server Card?

A **Server Card** is a JSON document — hosted at any unreserved URI, with `GET <streamable-http-url>/server-card` reserved as the recommended location (see [discovery.md](docs/discovery.md)) — describing:

- The server's identity (`name`, `version`, `description`, optional `title` / `icons` / `repository` / `websiteUrl`)
- Its remote transport endpoints (URLs, headers, variable templates, supported protocol versions)
- Optional registry-style extension metadata (`_meta`)

The companion **Server** document is a strict superset that adds locally-runnable `packages` — it is the shape the [MCP Registry](https://github.com/modelcontextprotocol/registry) uses for `server.json`.

Server Cards intentionally omit primitive listings (tools, resources, prompts) — those remain subject to runtime listing via the protocol's standard list operations.

## Layout

```
schema.ts                    # TypeScript source of truth (single file)
schema.json                  # Generated JSON Schema 2020-12 (do not edit by hand)
scripts/
  generate-schema.ts         # Generates schema.json from schema.ts
  validate-examples.ts       # Validates examples/ against the generated schema
examples/
  ServerCard/{valid,invalid} # Example Server Card documents
  Server/{valid,invalid}     # Example Server (registry-shaped) documents
```

The generated `schema.json` is checked into the repo so consumers can grab it without running the toolchain.

## Working on the schema

```bash
npm install
npm run generate         # regenerates schema.json from schema.ts
npm run validate         # runs all examples through ajv against schema.json
npm run check            # asserts schema.json is in sync with schema.ts and tsc passes
npm run format           # prettier write
```

When you change `schema.ts`, always run `npm run generate` and commit the updated `schema.json` in the same commit. CI runs `npm run check` and will fail if they drift.

## Schema URL conventions

The `$schema` field on every document MUST be a URL of the form:

```
https://static.modelcontextprotocol.io/schemas/v1/<name>.schema.json
```

Schema URLs are versioned by their `vN` segment rather than by date, so additive revisions of the v1 shape don't bump every published document's `$schema`. Breaking changes would publish a `v2` family.

## Graduation plan

When the SEP is accepted and Server Cards graduate from this experimental extension:

1. The contents of `schema.ts` in this repo move into `schema/draft/schema.ts` of [`modelcontextprotocol/modelcontextprotocol`](https://github.com/modelcontextprotocol/modelcontextprotocol). The two `MetaObject` and `Icon` definitions inlined here at the bottom of `schema.ts` already exist in the main spec and are dropped from the migration.
2. The main spec's existing `scripts/generate-schemas.ts` regenerates `schema/draft/schema.json` (and downstream `docs/specification/draft/schema.mdx`) — no per-extension generator is required there.
3. Published documents update their `$schema` to point at the main spec's hosted schema URL (e.g., `https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json` served from `modelcontextprotocol/static`).
4. This repository is archived with a pointer to the relevant section of `schema/draft/schema.ts` in the main spec.

The `schema.ts` in this repo is deliberately structured to be copy-pasted into the main spec's `schema/draft/schema.ts` with no transformation other than removing the inlined `MetaObject` / `Icon` definitions.

## References

- [SEP-2127: MCP Server Cards (PR)](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127)
- [SEP-2133: Extensions framework (PR)](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2133)
- Abandoned core spec PR (superseded by this repo): [modelcontextprotocol#2652](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2652)
- [MCP Registry `server.json` schema](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/generic-server-json.md)
