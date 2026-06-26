# Best Practices

Practical guidance for the two sides of the Server Card ecosystem: people **hosting**
remote MCP servers, and people **building MCP clients** that discover and connect to them.

This document is advisory. The normative mechanics for Server Cards live in the
[README](../README.md) and [discovery.md](./discovery.md), and the catalog format is defined
by the [AI Catalog specification](https://github.com/Agent-Card/ai-catalog) — this page only
collects recommendations on top of them.

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
- **Also link your Server Card from an [AI Catalog](https://github.com/Agent-Card/ai-catalog)
  entry.** A card lets a client connect once it has your URL; a catalog is what lets clients
  _find_ that URL in the first place — so publish both. An AI Catalog is a cross-protocol
  discovery document (served at `/.well-known/ai-catalog.json`) that can index your MCP
  server alongside other AI artifacts; see
  [Relationship to AI Catalog](./discovery.md#relationship-to-ai-catalog). Publish it at the
  domain people associate with your service:
  - For a **public server**, that is your **primary domain** — the domain humans or agents
    would naturally associate with your service.
  - For an **internal enterprise** server, that is wherever an internal team would first
    encounter you — for example the domain hosting your REST API or the other resources a
    team becomes aware of _before_ they learn you also expose MCP.

## Best Practices for Client Implementors

When a client interacts with a domain that publishes an
[AI Catalog](https://github.com/Agent-Card/ai-catalog) — a `/.well-known/ai-catalog.json`
discovery document that indexes MCP servers alongside other AI artifacts — it can offer to
connect the corresponding server in-session. The probe itself is cheap: one asynchronous,
well-known `GET /.well-known/ai-catalog.json`, run in the background so it never blocks what
the user asked for.

Where you wire that probe in is a design decision with real range, and there is no single
right answer — **do what fits your client.** You can watch _broadly_, inspecting outbound
requests and keeping a running, cached list of which domains expose a catalog; or _narrowly_,
probing only when a domain enters the session with clear intent. Broader coverage finds more
servers at the cost of more requests, more noise, and more domains learning the user touched
them; narrower coverage is cheaper and quieter but misses some. The mechanisms below —
grounded in [Goose](https://goose-docs.ai/), Block's open-source MCP agent, whose extensions
are themselves MCP servers — span that range, from a network-wide egress sniff to a single
tool hook. Pick the ones that match your architecture and your users' expectations; the
shapes generalize to any client.

### Watch outbound traffic at the egress boundary

If your client already mediates network access, that chokepoint is the broadest place to
discover catalogs — it sees every domain the agent actually reaches, not just the ones a
particular tool or file surfaced. Goose's
[macOS sandbox](https://goose-docs.ai/docs/guides/sandbox/) is built exactly this way: the
seatbelt sandbox denies direct network access and forces all outbound traffic through a local
proxy, which evaluates each connection's destination domain against a `blocked.txt` list.
Discovery can ride the same seam as that filtering — as a new destination domain appears at
the proxy, fire a background probe for it and keep a cached `domain → catalog` map (misses
included). This is the comprehensive end of the spectrum, and it composes with the allow /
deny boundary you may already run; the cost of that breadth is noise — most domains publish
no catalog, so the caching and rate-limiting in
[Keep probing cheap](#keep-probing-cheap-and-let-enterprises-scope-it) matter most here.

### Probe on a deliberate fetch

The strongest signal is an intentional fetch: the user or the agent chose to retrieve a page
from a domain. Goose exposes exactly this through its
[lifecycle hooks](https://goose-docs.ai/docs/guides/context-engineering/hooks) — a
`hooks.json` maps events such as `PreToolUse` / `PostToolUse` to scripts, with a `matcher`
regular expression that selects which tool the rule runs for (the docs match tool names like
`developer__shell|developer__text_editor`). Match a `PreToolUse` rule to a web-fetch tool —
Goose's Computer Controller extension, for instance, exposes a web-scrape tool (`web_scrape`
in current builds) that retrieves a page — and the hook receives the tool input as JSON,
including the target URL. From there it can fire the catalog probe for that host before or
alongside the fetch, without modifying the tool itself. The same hook shape works for any
URL-bearing tool you choose to match, so you stay in control of _which_ tools trigger a
probe.

### Probe the domains a project already points at

A session also carries domains the user has _deliberately_ put in front of the agent: links
in a `.goosehints` file (Goose injects these into the system prompt and supports literal
`https://` URLs), an `AGENTS.md`, or a recipe's configuration. A `SessionStart` or
`UserPromptSubmit` hook can probe that bounded set once per session — these are the domains
the project is built around, a naturally bounded set.

### Offer a hit as a one-click extension install

Because a Goose extension _is_ an MCP server, an AI Catalog entry maps straight onto Goose's
existing [install path](https://goose-docs.ai/docs/getting-started/using-extensions) — no
new machinery. When a probe finds an entry, surface it to the user (interrupting the turn or
presenting it passively is your call) and offer a `goose://extension?...` deep link, the same
format Goose's extensions directory generates:

```
goose://extension?url=<streamable-http-url>&type=streamable_http&id=<id>&name=<name>&description=<description>
```

All parameters are URL-encoded; alternatively, write the equivalent block into Goose's
`config.yaml`. Either way the server is added and connected **mid-turn**, and you make clear
**which domain** the user is connecting to.

### Gate the install behind the permission model the user already knows

Connecting a freshly discovered server is exactly the kind of action a client already gates,
so reuse that model rather than inventing a separate consent flow. Goose has
[permission modes](https://goose-docs.ai/docs/guides/managing-tools/goose-permissions) —
**Completely Autonomous**, **Manual Approval**, **Smart Approval**, **Chat Only** — plus
per-tool levels. Under Manual or Smart Approval, surface "install and connect `<domain>`?" as
a one-time approval the user answers with the familiar _always allow_ / _ask before_ /
_never allow_ choices. This is the "permission model as tools" principle expressed in the client's
own vocabulary.

### Keep probing cheap, and let enterprises scope it

Run probes asynchronously and never block the operation the user asked for. Cache the result
per domain — _including misses_, since most domains publish no catalog — and honor the
catalog's `Cache-Control` response headers so you do not re-probe on every touch. Because
each probe reveals to the domain that the user interacted with it, give enterprises control:
an organization might disable in-flight discovery entirely, restrict it to an allowlist, or
route a find into an **IT escalation path that adds the server to a managed gateway** instead
of letting users install servers ad hoc.
