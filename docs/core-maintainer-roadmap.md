# Server Cards: Roadmap Priorities

The Server Card working group's proposed priorities for the core-maintainer
roadmap. Maintainers are consolidating the roadmap around an upcoming spec
release. These are the three themes, in priority order, we want carried into that
roadmap.

## 1. Unlock MCP Discovery

The next step is to graduate the Server Card to an official MCP extension as
Server Cards are still experimental. [SEP-2127] is in review, and the
Extensions Track ([SEP-2133]) also requires a merged SDK reference implementation.
Getting to an accepted, adoptable extension is the top priority. This will
unlock MCP as a part of a discoverable web of agents.

## 2. Describe what a server does

A card today says _where_ to connect but not _what_ the server can do. That
blocks consumers from using Server Cards for richer discovery and informing
end users of what to expect. `server/discover` and list endpoints are
frequently gated by auth, so an enriched server card would help significantly.
Primitives were deliberately removed from the card ([PR #19]); this track
revisits adding them back for static discovery.

## 3. Authentication

Cards need to express real-world auth well enough that a client can actually
connect. Auth is per-remote and varies across endpoints, and reviewers have
raised scenarios the current shape doesn't cover ([#13], core-spec
[PR #2742][pr2742]).

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
