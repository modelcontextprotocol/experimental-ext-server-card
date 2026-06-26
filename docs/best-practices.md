# Best Practices

Practical guidance for the two sides of the Server Card ecosystem: people **hosting**
remote MCP servers, and people **building MCP clients** that discover and connect to them.

This document is advisory. The normative mechanics live in the
[README](../README.md) and [discovery.md](./discovery.md) — this page only collects
recommendations on top of them.

## Best Practices for Server Implementors

- **If you host a remote MCP server, we highly recommend you serve a Server Card.** The
  card is your server's **connection entry point**: it advertises how to connect —
  transport endpoints, supported protocol versions, and a hint at the incoming
  requirements a client should expect (such as authentication) — before initialization and
  without prior configuration. This is valuable on its own: a client that already knows
  your MCP URL can point at the card directly, no catalog traversal required. Keep in mind
  the card is advisory and read before connecting, so clients reconcile it against the live
  connection and
  [MUST NOT treat it as authoritative for access control](./discovery.md#consistency-with-runtime-behavior) —
  the connection itself remains the source of truth. (The spec's coverage of these incoming
  requirements is still expanding — see the pending
  [comprehensive auth scenarios](https://github.com/modelcontextprotocol/experimental-ext-server-card/issues/13)
  and
  [optional tool metadata](https://github.com/modelcontextprotocol/experimental-ext-server-card/issues/30)
  discussions.)
- **Fill out your card completely.** Populate every applicable field — not just the
  required minimum. Optional identity fields (`title`, `description`, `icons`,
  `repository`, `websiteUrl`) and fully-specified transport metadata make your server
  easier to discover, present, and connect to. The card is also the natural home for any
  vendor-specific extension data via namespaced [`_meta`](https://modelcontextprotocol.io/specification/latest/basic#meta).
- **Server Cards describe remote connectivity only.** If your server is **not remote**,
  there is nothing to serve a card for — Server Cards exist to advertise remote transport
  endpoints, and locally-installable server metadata lives in the
  [MCP Registry](https://github.com/modelcontextprotocol/registry)'s `server.json` schema
  instead (see [Relationship to the MCP Registry](../README.md#relationship-to-the-mcp-registry)).
- **Internal-only but still remote? Serve a card anyway.** Even if your server is not
  meant for the public, a card is still worth publishing — some clients may discover and
  connect to you this way within your organization.
- **Also link your Server Card from a catalog entry.** A card lets a client connect once it
  has your URL; a catalog is what lets clients _find_ that URL in the first place — so
  publish both. Clients discover cards by way of an [MCP Catalog](./discovery.md#mcp-catalog)
  entry — which is forward-compatible with, and can be indexed as-is within, the broader
  [AI Catalog](https://github.com/Agent-Card/ai-catalog). Publish that catalog at the
  domain people associate with your service:
  - For a **public server**, that is your **primary domain** — the domain humans or agents
    would naturally associate with your service.
  - For an **internal enterprise** server, that is wherever an internal team would first
    encounter you — for example the domain hosting your REST API or the other resources a
    team becomes aware of _before_ they learn you also expose MCP.

## Best Practices for Client Implementors

- **Probe domains opportunistically, wherever one enters the session.** The trigger is not
  one specific operation — it is _any_ moment a concrete domain surfaces. When one does,
  kick off a background check of whether it publishes a catalog with an MCP entry — an
  [MCP Catalog](./discovery.md#client-discovery-flow), or an
  [AI Catalog](https://github.com/Agent-Card/ai-catalog) that indexes MCP servers alongside
  other AI artifacts. The probe is a single well-known
  [`GET /.well-known/mcp/catalog.json`](./discovery.md#well-known-uri), served with CORS
  headers (and usually cache headers), so it is cheap enough to run speculatively — even
  from a browser-based client. Useful places to hook it in:
  - **Your own fetch / browse tooling.** The cleanest hook. Before a built-in web-fetch
    (or browse / open-URL) tool runs, fire a non-blocking probe of the target host in
    parallel with the fetch. A client with a **pre-tool-invocation hook** mechanism — e.g.
    a `PreToolUse`-style hook that sees a `WebFetch`'s URL before it executes — can run the
    probe there without modifying the tool itself. The same applies to web-search result
    domains and outbound requests made by sandboxed code execution.
  - **URLs surfaced by already-connected MCP servers.** Tool-result text, resource URIs,
    resource links, and prompt outputs routinely carry links — and you are already parsing
    these messages. The host of any URL a connected server hands back is a probe candidate
    (a GitHub server returning a PR URL, a fetch-style server returning a page, and so on).
  - **Domains revealed while connecting.** Establishing one connection can structurally
    expose related domains — for example the authorization server or resource named in an
    OAuth `WWW-Authenticate` / protected-resource-metadata challenge. Those are learned, not
    guessed, and worth probing too.
  - **User- and project-level signals.** A domain the user pastes or names, the active page
    in a browser-extension client, or — for a coding agent — the project's git remote host,
    `package.json` URLs, and configured API endpoints.
- **Keep probing cheap and respectful.** Run probes asynchronously and never block the
  operation the user actually asked for. Cache the result per domain — _including misses_,
  since most domains publish no catalog — and honor the catalog's `Cache-Control` (see
  [Caching](./discovery.md#caching)) so you do not re-probe on every touch. Because each
  probe reveals to the domain that the user interacted with it, let enterprises scope or
  disable probing (see the enterprise-configuration note below).
- **Surface the possibility of an MCP server installation.** If you find a catalog entry,
  let the user know an MCP server is available for that domain. Whether you interrupt the
  session to surface it, or present it more passively, is up to you as the client
  implementor.
- **Let the user say yes, and install mid-turn.** Make clear **which domain** you are
  connecting to, and if the user agrees, install and connect within the same turn rather
  than forcing a restart or a separate configuration step.
  - **Model the install permission like a tool permission.** Reuse the mental model your
    users already have for tool authorization — e.g. "always allow", "allow from this
    domain", "always ask" — so connecting to a newly discovered server feels familiar
    rather than novel.
- **Let enterprises configure the flow.** Give administrators control over how discovery
  and installation behave in your client. For example, an enterprise might prefer an **IT
  escalation path that adds the server to their gateway** rather than letting users install
  servers in-flight.
