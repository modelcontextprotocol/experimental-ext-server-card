# MCP Server Card Best Practices

Practical guidance for the two sides of the Server Card ecosystem: people **hosting**
remote MCP servers, and people **building MCP clients** that discover and connect to them.

This document is advisory. The normative mechanics for Server Cards live in the
[README](../README.md) and [discovery.md](./discovery.md), and the catalog format is defined
by the [AI Catalog specification](https://github.com/Agent-Card/ai-catalog) — this page only
collects recommendations on top of them.

## Best Practices for Server Implementors

If you host a remote MCP server, we highly recommend you serve a Server Card — and publish an
AI Catalog entry that points at it. The two do different jobs: the card is how a client
_connects_ to you, and the catalog is how a client _finds_ you in the first place. The guidance
below covers what to put in the card, what does not belong in one, and where to publish the
catalog entry.

### Serve a card: it is your connection entry point

A Server Card advertises how to connect — transport endpoints, supported protocol versions, and
a hint at the incoming requirements a client should expect (such as authentication) — before
the client connects, and without prior configuration. This is valuable on its own, with no
catalog involved: a client that already knows your MCP URL can point at the card directly.

Keep in mind the card is advisory and read before connecting, so clients reconcile it against
the live connection and
[MUST NOT treat it as authoritative for access control](./discovery.md#consistency-with-runtime-behavior) —
the connection itself remains the source of truth.

### Fill out your card completely

Populate every applicable field — not just the required minimum. Optional identity fields
(`title`, `description`, `icons`, `repository`, `websiteUrl`) and fully-specified transport
metadata make your server easier to discover, present, and connect to.

### Server Cards describe remote connectivity only

If your server is **not remote**, there is nothing to serve a card for — Server Cards exist to
advertise remote transport endpoints only. Locally-installable server metadata lives in the
[MCP Registry](https://github.com/modelcontextprotocol/registry)'s `server.json` schema instead
(see [Relationship to the MCP Registry](../README.md#relationship-to-the-mcp-registry)).

Internal-only but still remote is a different case: serve a card anyway. Even if your server is
not meant for the public, a card is still worth publishing — some clients may discover and
connect to you this way within your organization.

### Link your card from an AI Catalog entry

A card lets a client connect once it has your URL; an
[AI Catalog](https://github.com/Agent-Card/ai-catalog) is what lets clients find that URL in the
first place — so publish both. An AI Catalog is a cross-protocol discovery document (served at
`/.well-known/ai-catalog.json`) that can index your MCP server alongside other AI artifacts; see
[discovery.md](./discovery.md).

Publish it at the domain people associate with your service:

- For a **public server**, that is your **primary domain** — the domain humans or agents would
  naturally associate with your service.
- For an **internal enterprise** server, that is wherever an internal team would first encounter
  you — for example the domain hosting your REST API or the other resources a team becomes aware
  of _before_ they learn you also expose MCP.

Review the guidance below for Client Implementors to determine the appropriate domain for your service. For example, for GitHub, it would be common for the user of a coding agent to paste a URL like `https://github.com/modelcontextprotocol/experimental-ext-server-card/pull/36` into a session. So `github.com/.well-known/ai-catalog.json` is an excellent place to put your AI catalog - not `githubcopilot.com/.well-known/ai-catalog.json`, where GitHub's MCP server [happens to live](https://github.com/github/github-mcp-server).

## Best Practices for Client Implementors

Every MCP server your client can reach is capability you did not have to build. A user who
connects one gets more done without leaving you, and comes back for it — servers make a client
more useful and stickier, at someone else's development cost. The hard part is that connecting a server is a chore the user has to go and do somewhere
else, out of band, before it can help them — so most users never do it, and the capability
sits unclaimed.

As per above guidance for server implementors, we now have a way for them to advertise
their service in an easy-to-find, standardized location. Using this, your client can offer the
connection **at the moment the user is already referencing that service** — mid-session, in
context, instead of in a settings pane the user never visits.

If you wire that in where we recommend below, it costs you remarkably little:

- **No new UX to design.** You already ask users to approve consequential actions like tool calls. This is one
  more approval, in a flow they already know.
- **No new trust to establish.** You only ever offer servers published by a domain the user
  themselves just put in front of you. You are not recommending anyone — the domain the user
  named is.
- **No discovery problem to solve.** No ranking, no index, no crawl, no editorial judgment.
  The user supplied the domain; you are just asking it what it offers.

The outcome compounds in every direction: the user gets a capability exactly when they need
it, your client gets stickier, the service gets reached by agents that would otherwise have
scraped it or given up, and the pie grows as complementary AI services get strung together.

### Where to trigger discovery

The probe itself is always the same and always cheap: one asynchronous
`GET /.well-known/ai-catalog.json`, run in the background so it never blocks what the user
asked for. The design decision is not _how_ to probe — it is **which moments** in a session
should trigger one.

#### Start here: probe the domains a user hands you

**At minimum, we recommend a default-on experience that probes any domain a user enters as a
URL.** This is the strongest signal in the session and the safest place to begin: the user
typed or pasted the domain themselves, so there is no ambiguity about intent, no inference,
and no domain touched that the user did not already name.

```mermaid
flowchart TD
    A[User enters a URL in the session] --> B[Probe domain's /.well-known/ai-catalog.json]
    B --> C{AI Catalog found?}
    C -->|No| D[Cache the miss, stay silent]
    C -->|Yes| E[Select application/mcp-server-card+json entries]
    E --> F{Already installed, or previously declined?}
    F -->|Yes| D
    F -->|No| G[Fetch the Server Card from the entry's url]
    G --> H["Offer install — naming the endorsement chain"]
    H --> I{User approves?}
    I -->|This session| J[Server connected mid-turn]
    I -->|Always| K[Server connected and persisted to config]
    I -->|Not now| L[Remember the decline]
```

A closely related and equally bounded set: the domains a **project** already points at — links
in a `.goosehints` file (Goose injects these into the system prompt and supports literal
`https://` URLs), an `AGENTS.md`, or a recipe's configuration. A `SessionStart` or
`UserPromptSubmit` hook can probe that set once per session. These are the domains the project
is built around, the user put them there deliberately, and there are only ever a handful.

#### Expand carefully: broader triggers, off by default for now

Beyond user-supplied URLs, the same probe can hang off progressively broader signals. These
find more servers and touch more domains, and the trade is the same each time: **broader
coverage, at the cost of more requests, more noise, and more domains learning the user
interacted with them.**

```mermaid
flowchart LR
    A["User-entered URLs<br/>(recommended, default-on)"] --> P[Shared probe + cache]
    B["Project files<br/>(.goosehints, AGENTS.md, recipes)"] --> P
    C["Tool-call results<br/>(web fetch, scrape)"] -.opt-in.-> P
    D["Network egress boundary<br/>(every domain reached)"] -.opt-in.-> P
    P --> E[domain → catalog map, misses cached]
    E --> F[Install offer]
```

- **Tool-call results.** The user or the agent chose to retrieve a page, which is close to
  direct intent. Goose exposes this through its
  [lifecycle hooks](https://goose-docs.ai/docs/guides/context-engineering/hooks) — a
  `hooks.json` maps events such as `PreToolUse` / `PostToolUse` to scripts, with a `matcher`
  regular expression selecting which tool the rule runs for (the docs match tool names like
  `developer__shell|developer__text_editor`). Match a `PreToolUse` rule to a web-fetch tool —
  Goose's Computer Controller extension, for instance, exposes a web-scrape tool — and the hook receives the tool input as JSON, including the target URL,
  so it can fire the probe without modifying the tool itself.
- **The network egress boundary.** The broadest option: if your client already mediates
  network access, that chokepoint sees every domain the agent actually reaches. Goose's
  [macOS sandbox](https://goose-docs.ai/docs/guides/sandbox/) is built this way — the seatbelt
  sandbox denies direct network access and forces outbound traffic through a local proxy that
  evaluates each destination against a `blocked.txt` list. Discovery can ride the same seam as
  that filtering. It composes with an allow/deny boundary you may already run, but it is also
  where the noise is worst: most domains publish no catalog, so the caching in
  [Keep probing cheap](#keep-probing-cheap-and-let-enterprises-scope-it) matters most here.

**We do not recommend turning these on by default at this time.** Ship them opt-in, behind a
setting, while the ecosystem and the interaction pattern are still young — the default-on
case above is the one where the user's intent is unambiguous, and it is worth learning how
that experience lands before widening the aperture. As implementations gather evidence, this
guidance may change.

### Turn a hit into a one-click install

A Goose extension _is_ an MCP server, so an MCP Server Card maps straight onto Goose's
existing [install path](https://goose-docs.ai/docs/getting-started/using-extensions) — no new
machinery. When a probe finds an entry, surface it to the user (interrupting the turn or
presenting it passively is your call) and offer a `goose://extension?...` deep link, the same
format Goose's extensions directory generates:

```
goose://extension?url=<streamable-http-url>&type=streamable_http&id=<id>&name=<name>&description=<description>
```

All parameters are URL-encoded; alternatively, write the equivalent block into Goose's
`config.yaml`. Either way the server is added and connected **mid-turn**.

### Security and trust considerations

#### Show the endorsement chain, not just the endpoint

The domain that publishes a catalog is frequently **not** the domain that hosts the server it
points at. `github.com`'s AI Catalog references a server on `api.githubcopilot.com`; a Google
catalog may point at `googleapis.com`. A prompt that names only the endpoint asks the user to
trust a domain they may not recognize as belonging to the service — which is
indistinguishable, from the user's side, from a phishing prompt.

Surface the **chain** instead: the domain the user actually interacted with, the fact that it
endorsed the entry, and the domain that will own the connection. The endorsement is the trust
signal the user can evaluate; the raw endpoint is not. Name both, and make it clear which one
the credentials and traffic will go to.

A minimal prompt carrying that chain:

```
┌──────────────────────────────────────────────────────────┐
│  Connect an MCP server?                                  │
│                                                          │
│  github.com lists a server it does not host:             │
│                                                          │
│      GitHub          github.com                          │
│         └── hosted at  api.githubcopilot.com             │
│                                                          │
│  Requests and any credentials you approve will go to     │
│  api.githubcopilot.com.                                  │
│                                                          │
│         [ Not now ]   [ This session ]   [ Always ]      │
└──────────────────────────────────────────────────────────┘
```

Two things are doing the work here. The endorsing domain is the one the user recognizes and
just interacted with, so it leads. The hosting domain is named as a **consequence** — where
traffic and credentials actually go — rather than as a bare URL the user is asked to
pattern-match against a brand they know.

#### Always ask before installing — and be stricter here than you are with tools

Reuse the consent surface your users already know; do not invent a second vocabulary for
discovery. But hold discovery to a **higher bar than tool calls**. Approving a tool call
authorizes one action by code the user already chose to run. Installing a discovered server
adds a new, unvetted counterparty to the session — one that will expose its own tools, receive
its own inputs, and persist if the user lets it. That asymmetry means the autonomy settings a
client offers for tools should not simply extend to installs:

- **A discovered server MUST NOT be installed automatically.** No "completely autonomous" mode
  should silently connect one. The approval dialog is load-bearing: the endorsing domain is the
  user's only trust signal, and skipping the prompt discards it.
- **There is no blanket "always allow."** An install approval is scoped to _that server_, never
  to discovery in general and never to a domain's future entries.

Offer the user two accept paths, which is the distinction the prompt above encodes:

- **This session** — connect now, discard at session end. The right default for a server the
  user is trying out; a mistake costs one session.
- **Always** — persist the server to the user's configuration, as if they had installed it
  themselves. This is the equivalent of _always allow_, scoped to that one server.

Together with **Not now**, that is the whole vocabulary. A user who wants a server permanently
can say so in one click, and a user who is merely curious is not talked into a permanent
change to their setup.

#### De-duplicate, and let the user turn it off

Discovery is only useful if it stays quiet. A client that re-offers a server the user already
runs, or that surfaces every entry on a busy catalog at once, trains the user to dismiss the
prompt without reading it — which costs you the one moment where the endorsement chain above
actually gets evaluated.

- **Track what is already installed.** Resolve a discovered entry back to a server the user has
  configured — match on the Server Card's `name`, and on the transport URLs in `remotes[]` for
  servers added before any card existed — and stay silent on a hit.
- **Consider culling a long catalog.** A domain may list many servers. Presenting the full list
  is usually fine — most catalogs are short. But if a catalog is long, there is room to get
  creative: an inference step over the entries' descriptions, weighed against what the user is
  actually doing in the session, can surface the two or three that fit and tuck the rest behind
  a "show all." This is an open design space, and we would like to see what clients try.
- **Remember a "no."** Give the user a durable _don't ask me again_ — per server, and per
  domain — and honor it across sessions. A declined install is a preference, not a
  per-turn answer.

#### Keep probing cheap, and let enterprises scope it

Run probes asynchronously and never block the operation the user asked for. Cache the result
per domain — _including misses_, since most domains publish no catalog — and honor the
catalog's `Cache-Control` response headers so you do not re-probe on every touch. When a cached
entry does expire, revalidate rather than refetch: store the `ETag` a catalog or card endpoint
returns and send it back as `If-None-Match`, so an unchanged document costs you a `304` and no
body.

Because each probe reveals to the domain that the user interacted with it, give enterprises
control: an organization might disable in-session discovery entirely, or restrict it to an
allowlist of domains.

Outright disabling is the blunt option, and it throws away the signal. In a managed
environment, the interesting move is to **keep discovering and change what a hit does**. An
employee who hits a useful server is exactly the demand signal a platform team wants, and today
that signal is lost — the user shrugs, works around it, and nobody learns the server was
wanted. Instead of offering a direct install, route the find into the organization's existing
approval path: the client swaps the install button for a request, pre-filled from the catalog
entry and Server Card it already fetched, so the user supplies intent and the client supplies
the technical detail.

```
┌──────────────────────────────────────────────────────────┐
│  Request this server from IT                             │
│                                                          │
│  Direct installs are disabled by your organization.      │
│                                                          │
│  Server     GitHub                                       │
│  Listed by  github.com                                   │
│  Hosted at  api.githubcopilot.com                        │
│  Auth       OAuth 2.0                                    │
│                                                          │
│  Why do you need it?                                     │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Reviewing PRs in the session — would let the agent │  │
│  │ read diffs directly instead of pasting them.       │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│              [ Cancel ]        [ Send request ]          │
└──────────────────────────────────────────────────────────┘
```

Where that request lands is the organization's business — a ticket, a Slack approval, a pull
request against a gateway's server list. What matters for a client implementor is that the
Server Card gives you everything the approver needs (identity, endpoint, transport, auth
posture) without the user having to hunt for it, and that an approved request ends with the
server added to the **managed gateway** the whole org already connects through, rather than
installed ad hoc on one laptop. The user gets a path instead of a dead end, and the platform
team gets a queue of real, evidenced demand.
