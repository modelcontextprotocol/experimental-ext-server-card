# Server Cards: Roadmap Priorities

The Server Card working group's proposed priorities for the core-maintainer
roadmap. Maintainers are consolidating the roadmap around an upcoming spec
release, so new proposals are paused for ~2 weeks; until then the WG stays
focused on landing the Server Card SEP ([SEP-2127]) and finishing SDK reviews.
These are the three themes, in priority order, we want carried into that
roadmap.

## 1. Graduate the Server Card as an official MCP extension

Server Cards are close but still experimental. [SEP-2127] is in review, and the
Extensions Track ([SEP-2133]) will not advance it without a merged SDK reference
implementation. Getting to an accepted, adoptable extension is the top priority.

- **SDK reference implementations** ([#16]): Python ([python-sdk#2951]), Go
  ([go-sdk#1024]), TypeScript ([typescript-sdk#2527]) — the drafts need a
  client-implementer review before leaving draft.
- **Best practices** for client and server implementors ([#40], [PR #36]) —
  trimming length, likely via collapsible sections.
- **Reference showcase** (GitHub MCP Server) kept in sync with the spec ([#34]).
- Freeze `schema.json` as a public contract and keep the SDK models from
  drifting from it.

## 2. Describe what a server does, not just where to reach it

A card today says _where_ to connect but not _what_ the server can do. That
blocks consumers who never open a live connection — registries, developer
portals, agent orchestrators planning tool routing — for whom the card is a list
of URLs with no operations (the role OpenAPI plays for REST APIs). Primitives
were deliberately removed from the card ([PR #19]); this track revisits adding
them back for static discovery.

- Optional `tools` / `resources` / `prompts` using the existing MCP types;
  dynamic servers omit them and `tools/list` stays the runtime source of truth
  ([#30], [SEP-2127 thread][sep-2127]).
- Settle the split with the MCP Registry `server.json` and keep the two shapes
  consistent (avoid `server.json` breaking changes).

## 3. Authentication

Cards need to express real-world auth well enough that a client can actually
connect. Auth is per-remote and varies across endpoints, and reviewers have
raised scenarios the current shape doesn't cover ([#13], core-spec
[PR #2742][pr2742]).

- First confirm the current draft isn't backwards-incompatible with those
  scenarios.
- Land the initial SEP with a deliberately limited auth shape.
- Fast-follow to the fuller set once we have community feedback, rather than
  locking many new fields in up front.

[sep-2127]: https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127
[SEP-2133]: https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2133
[pr2742]: https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2742
[python-sdk#2951]: https://github.com/modelcontextprotocol/python-sdk/pull/2951
[go-sdk#1024]: https://github.com/modelcontextprotocol/go-sdk/pull/1024
[typescript-sdk#2527]: https://github.com/modelcontextprotocol/typescript-sdk/pull/2527
[#13]: https://github.com/modelcontextprotocol/experimental-ext-server-card/issues/13
[#16]: https://github.com/modelcontextprotocol/experimental-ext-server-card/issues/16
[#30]: https://github.com/modelcontextprotocol/experimental-ext-server-card/issues/30
[#34]: https://github.com/modelcontextprotocol/experimental-ext-server-card/issues/34
[#40]: https://github.com/modelcontextprotocol/experimental-ext-server-card/issues/40
[PR #19]: https://github.com/modelcontextprotocol/experimental-ext-server-card/pull/19
[PR #36]: https://github.com/modelcontextprotocol/experimental-ext-server-card/pull/36
