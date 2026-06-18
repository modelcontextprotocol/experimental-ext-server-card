# MCP Server Cards (Experimental Extension)

> #### **Status:** Experimental. This work is for prototyping and feedback only, and is not an accepted or official MCP extension.

This repository defines a TypeScript source-of-truth and generated JSON Schema for **MCP Server Cards**. Server Cards are a static metadata document that describes a remote MCP server enough for clients to discover and connect to it before initialization.

It tracks [SEP-2127](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127) and is intended to be lifted directly into the main spec when Server Cards graduate (see [Graduation plan](#graduation-plan) below).

A prior attempt to land these types directly in the core spec ([modelcontextprotocol#2652](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2652)) is being relaunched here as an experimental extension while the SEP itself is still under review.

## What is a Server Card?

A **Server Card** is a JSON document — hosted at any unreserved URI, with `GET <streamable-http-url>/server-card` reserved as the recommended location (see [discovery.md](docs/discovery.md)) — describing:

- The server's identity (`name`, `version`, `description`, optional `title` / `icons` / `repository` / `websiteUrl`)
- Its remote transport endpoints (URLs, headers, variable templates, supported protocol versions)
- Optional registry-style extension metadata (`_meta`)

Server Cards intentionally omit primitive listings (tools, resources, prompts) — those remain subject to runtime listing via the protocol's standard list operations. They also intentionally omit local installation metadata — see [Relationship to the MCP Registry](#relationship-to-the-mcp-registry).

## Relationship to the MCP Registry

A Server Card describes **remote connectivity only**. Metadata for locally-installable servers, packages, registries (npm, PyPI, OCI, NuGet, MCPB), runtime hints, command-line arguments, environment variables, lives in the [MCP Registry](https://github.com/modelcontextprotocol/registry)'s [`server.json` schema](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/generic-server-json.md), which is owned by the registry, not by this extension.

Vendors who genuinely need to attach install hints to a Server Card can use namespaced [`_meta`](https://modelcontextprotocol.io/specification/latest/basic#meta) extension metadata, which remains the card's extension point.

## Layout

```
schema.ts                    # TypeScript source of truth (single file)
schema.json                  # Generated JSON Schema 2020-12 (do not edit by hand)
scripts/
  generate-schema.ts         # Generates schema.json from schema.ts
  validate-examples.ts       # Validates examples/ against the generated schema
examples/
  ServerCard/{valid,invalid} # Example Server Card documents
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

Schema URLs are versioned by their `vN` segment. Server Card objects are open: the schema does not set `additionalProperties: false`, and vendor-specific data belongs in the namespaced `_meta` field. Once `v1` is published a breaking revision of the shape would publish a new `vN` family rather than mutating `v1` in place. The `v1` shape is still pre-release and card-only — it intentionally does not include the registry-shaped `Server` / `packages` types.

## Graduation plan

When the SEP is accepted and Server Cards graduate from this experimental extension:

1. The contents of `schema.ts` in this repo move into `schema/draft/schema.ts` of [`modelcontextprotocol/modelcontextprotocol`](https://github.com/modelcontextprotocol/modelcontextprotocol). The two `MetaObject` and `Icon` definitions inlined here at the bottom of `schema.ts` already exist in the main spec and are dropped from the migration.
2. The main spec's existing `scripts/generate-schemas.ts` regenerates `schema/draft/schema.json` (and downstream `docs/specification/draft/schema.mdx`) — no per-extension generator is required there. Both generators leave objects open (no `additionalProperties: false`), so the generated shape matches without flag changes.
3. Published documents update their `$schema` to point at the main spec's hosted schema URL (e.g., `https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json` served from `modelcontextprotocol/static`).
4. This repository is archived with a pointer to the relevant section of `schema/draft/schema.ts` in the main spec.

The `schema.ts` in this repo is deliberately structured to be copy-pasted into the main spec's `schema/draft/schema.ts` with no transformation other than removing the inlined `MetaObject` / `Icon` definitions.

## References

- [SEP-2127: MCP Server Cards (PR)](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127)
- [SEP-2133: Extensions framework (PR)](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2133)
- Abandoned core spec PR (superseded by this repo): [modelcontextprotocol#2652](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2652)
- [MCP Registry `server.json` schema](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/generic-server-json.md)
