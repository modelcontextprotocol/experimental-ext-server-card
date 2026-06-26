# Best Practices

Practical guidance for the two sides of the Server Card ecosystem: people **hosting**
remote MCP servers, and people **building MCP clients** that discover and connect to them.

This document is advisory. The normative mechanics live in the
[README](../README.md) and [discovery.md](./discovery.md) — this page only collects
recommendations on top of them.

## Best Practices for Server Implementors

- **If you host a remote MCP server, we highly recommend you serve a Server Card.** A
  Server Card lets clients discover and connect to your server before initialization,
  without prior configuration.
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
- **Make sure your Server Card is linked from a catalog entry.** Serving a card is only
  half of discovery; clients find cards by way of an
  [MCP Catalog](./discovery.md#mcp-catalog) entry — which is forward-compatible with, and
  can be indexed as-is within, the broader
  [AI Catalog](https://github.com/Agent-Card/ai-catalog). Publish that catalog at the
  domain people associate with your service:
  - For a **public server**, that is your **primary domain** — the domain humans or agents
    would naturally associate with your service.
  - For an **internal enterprise** server, that is wherever an internal team would first
    encounter you — for example the domain hosting your REST API or the other resources a
    team becomes aware of _before_ they learn you also expose MCP.

## Best Practices for Client Implementors

- **Notice the domains you touch.** When you execute an operation against a domain (for
  example, a fetch), make note of that domain and **asynchronously check whether it
  publishes a catalog with an MCP entry** — an
  [MCP Catalog](./discovery.md#client-discovery-flow), or an
  [AI Catalog](https://github.com/Agent-Card/ai-catalog) that indexes MCP servers
  alongside other AI artifacts. This check should run in the background and never block the
  operation the user actually asked for.
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
