# MCP Server Card — Experimental Extension

> ⚠️ **Experimental** — This is an experimental MCP extension and is not yet part of the core specification. See [Extensions Overview](https://modelcontextprotocol.io/extensions/overview) for more on experimental extensions.

## What is an MCP Server Card?

An MCP Server Card is a structured metadata document that servers expose through standardized mechanisms — primarily `.well-known` endpoints — to enable discovery of MCP servers without requiring a full initialization handshake.

### Key use cases

- **Autoconfiguration** — Clients can automatically configure connections to MCP servers using discovered metadata
- **Automated discovery** — Tooling and registries can find and catalog MCP servers without manual entry
- **Reduced latency metadata retrieval** — Essential server information is available before establishing a full MCP session

## Status

The Server Card specification is being developed as [SEP-2127: MCP Server Cards — HTTP Server Discovery via `.well-known`](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127). This repository hosts the experimental extension while the proposal progresses through the specification process.

## Working Group

The Server Card Working Group drives the design and development of this extension.

**Leads:**
- [@dsp-ant](https://github.com/dsp-ant) (David Soria Parra, Anthropic)
- [@SamMorrowDrums](https://github.com/SamMorrowDrums) (Sam Morrow Drums, GitHub)

**Members:**
- [@tadasant](https://github.com/tadasant) (Tadas Antanavicius)

**Discord:** `#server-card-wg`

### Scope

- Server Card format and schema
- Discovery mechanism (`.well-known` endpoints)
- Cross-ecosystem coordination with the AI Card effort

### Out of scope

- Changes to MCP initialization or transport
- General-purpose registry (owned by the Registry Working Group)
- Internationalization (i18n)

## Links

- [SEP-2127 — Server Card Specification PR](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127)
- [MCP Specification Repository](https://github.com/modelcontextprotocol/modelcontextprotocol)
- [Working Group Charter (PR #2480)](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2480)
- [Extensions Overview](https://modelcontextprotocol.io/extensions/overview)