# Proposal evaluation: a `/server-card.json` path-suffix discovery convention

**Status:** Draft for discussion. Not a settled change.
**Relates to:** [SEP-2127](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127), [`docs/discovery.md`](../discovery.md), issue #12 / PR #22 (which introduced the current `/server-card` reservation).

## TL;DR

The suggestion is to recommend fetching a Server Card with a plain `GET` at a fixed
path suffix — `<mcp_url>/server-card.json` — to spare simple scrapers from HTTP
content-type negotiation.

The motivating premise is **largely already true in this spec, and stronger than the
suggestion assumes**: discovery here does **not** hinge on content negotiation against
the `/mcp` endpoint. The spec already reserves a path-suffix convention,
`GET <streamable-http-url>/server-card`, and the "Alternatives considered" section of
[`discovery.md`](../discovery.md) already _explicitly rejects_ serving the card off the
bare `/mcp` endpoint **because** that would "force content negotiation to disambiguate."
So the headline win the suggestion is reaching for — "a plain GET to a predictable URL,
no content negotiation" — is the design the spec already landed on.

That reframes the decision to two narrow, genuine questions:

1. Should the reserved suffix carry a **`.json` extension** (`/server-card.json`) instead
   of the current extension-less `/server-card`?
2. Should the spec **soften the `Accept: application/mcp-server-card+json` expectation**
   so that a naive scraper issuing a bare `GET` to the reserved path is a first-class,
   guaranteed-to-work client?

This document recommends: **(1) keep `/server-card` — do not adopt `.json` as the
reserved suffix**, for the reasons below; and **(2) yes — clarify that the reserved
endpoint MUST answer a plain `GET` regardless of `Accept`.** (2) delivers essentially all
of the scraper-friendliness the suggestion wants, without a churn-y change to an in-flight
convention. The contrary case for (1) is laid out honestly so a maintainer can overrule.

## What the spec actually says today

From [`docs/discovery.md`](../discovery.md):

- **The discovery entrypoint is the MCP Catalog**, a JSON document at the well-known URI
  `/.well-known/mcp/catalog.json`. Each catalog entry carries an explicit `url` for that
  server's card. **Clients following the catalog never guess a card URL — they follow the
  `url` the catalog hands them**, and a card "MAY be hosted at any unreserved URI (on any
  domain)."
- **For servers that want a predictable default location**, the spec reserves exactly one:

  > MCP Servers MAY host their Server Card at `GET <streamable-http-url>/server-card`,
  > which we reserve for this purpose, though any unreserved URI (on any domain) is valid.

  A server at `https://host/mcp` therefore yields `https://host/mcp/server-card` — the
  doc's stated rationale is that you "get path-namespacing for free."

- **Content negotiation is layered on top as a SHOULD, not a load-bearing requirement.**
  Clients SHOULD send `Accept: application/mcp-server-card+json`; the card has the media
  type `application/mcp-server-card+json`. But because the path is _already dedicated to
  the card_, the `Accept` header is a politeness/robustness hint, not the disambiguator.
- **The bare-endpoint, content-negotiated approach was considered and rejected.** The
  "Alternatives considered" list rejects `GET <streamable-http-url>` (no suffix) precisely
  because in Streamable HTTP a `GET` on the MCP endpoint already opens the SSE stream, so
  serving the card there "overloads that endpoint and forces content negotiation to
  disambiguate 'give me the card' from 'open the stream.'" `.well-known` for the
  single-server card and a domain-root `/mcp/` metadata namespace were also considered and
  rejected.

**Correction to the framing:** the suggestion is pitched as "switch _away from_ content
negotiation _to_ a path suffix." The spec is already on the path-suffix side of that line.
The live decision is not _whether_ to use a path suffix, but _which spelling_ of the
suffix, and _how hard_ to lean on `Accept`.

## The crux the "no drawback" claim skips: appending a suffix to an arbitrary URL is not free

The suggestion frames `/server-card.json` as "just a convention tacked onto the end of an
`/mcp` URL." Tacking a segment onto an _arbitrary_ URL by string concatenation is **not**
unambiguous. These edge cases apply, and note they apply **equally to the current
`/server-card`** — they are a property of "suffix on a server URL," not of the `.json`
spelling:

- **Query strings.** A streamable-HTTP URL may carry query parameters
  (`https://host/mcp?tenant=acme`). Naive concatenation produces
  `https://host/mcp?tenant=acme/server-card.json`, which puts the "suffix" _inside the
  query string_ — wrong. Correct resolution requires manipulating the URL **path**
  component (RFC 3986), stripping/handling the query and fragment.
- **Trailing slash.** `https://host/mcp/` vs `https://host/mcp` yields `…/mcp//server-card`
  vs `…/mcp/server-card`. The convention needs a defined normalization rule.
- **Templated URLs.** Server Cards already ship templated remote URLs in this repo —
  `examples/ServerCard/valid/templated-remote.json` has
  `"url": "https://{tenant}.example.com/mcp"`. The suffix must be appended to the
  _resolved_ URL, after variable expansion, which a scraper that has only the template
  cannot do on its own.
- **Non-root / nested paths.** `https://host/server/mcp` →
  `https://host/server/mcp/server-card.json`. Fine, but only if "append to the path" is
  the defined operation, not "append to the string."

**Implication:** the simplest scrapers — the population the suggestion is trying to help —
are exactly the ones least likely to do correct RFC 3986 path resolution. For those
clients the **catalog `url` is usually the robust answer**: in the common single-endpoint
case it is an already-resolved, absolute URL that needs no suffix arithmetic. (The escape
hatch is not total: for a multi-tenant server whose `remotes[].url` is itself templated —
e.g. `https://{tenant}.example.com/mcp` — there is no single concrete card URL to publish
either, so the catalog `url` faces the same per-tenant expansion problem. The suffix
convention is no _worse_ there, but neither is fully pre-resolved.) The path-suffix
convention (either spelling) is best understood as a _convenience for servers/operators_
and for clients that already hold a concrete `/mcp` URL — not as the primary scraper
interface. If we adopt or keep _any_ suffix convention, the spec should state the
resolution rule explicitly (operate on the path component; strip query and fragment;
collapse a single trailing slash). This is a real gap in the current text regardless of
the `.json` question.

## `/server-card.json` vs `/server-card`: the honest ledger

### Arguments for `.json`

- **Static file hosts.** A dumb static server (S3/GCS bucket, `nginx autoindex`, GitHub
  Pages) infers `Content-Type: application/json` from a `.json` extension and serves the
  bytes with zero configuration. An extension-less `/server-card` on such a host often
  defaults to `application/octet-stream` or `text/plain`.
- **Human/tooling legibility.** `.json` signals "this is a JSON file" to a developer
  eyeballing a URL, and to generic tooling (browsers, `curl`-to-file, link scanners) that
  keys off extensions.
- **CDN / cache key cleanliness.** A fixed `.json` URL with no reliance on `Vary: Accept`
  is the friendliest possible CDN object — one URL, one representation, one cache key.

### Arguments against `.json` (why this doc leans "keep `/server-card`")

- **The benefit is weakest exactly where the convention applies.** The reserved suffix
  hangs off a server's **streamable-HTTP endpoint** — a _live MCP server_, not a dumb
  static host. That server is, by definition, capable of setting
  `Content-Type: application/mcp-server-card+json` on the response. The headline `.json`
  win ("static host guesses the content type for you") mostly evaporates when the host is a
  dynamic application endpoint. A server that genuinely _wants_ static-host hosting can
  already put the card at a `.json` URL anywhere and advertise it via the catalog `url` —
  the spec already permits "any unreserved URI." So `.json` buys little _at the reserved
  location_ specifically.
- **`.json` advertises `application/json`, but the card's media type is
  `application/mcp-server-card+json`.** A `.json` extension nudges static hosts toward the
  _generic_ `application/json`, which is a less specific content type than the registered
  card media type the spec asks servers to serve (a SHOULD, per `discovery.md`). So the
  extension can pull the served `Content-Type` in the _wrong_ direction on the very hosts
  where it has effect. The weight of this con depends on whether `application/json` is an
  acceptable fallback — an explicit open question for maintainers below (#4); treat this
  bullet as contingent on that answer rather than decisive on its own.
- **Couples the discovery path to a serialization.** `/server-card` names the _resource_;
  `/server-card.json` bakes the _encoding_ into the path. If a future revision ever serves
  an alternate representation (e.g. a signed/JWT-wrapped card, or a CBOR variant for
  constrained clients), an extension-less resource path negotiates that cleanly while a
  `.json` path has pre-committed. This is a small risk, but it cuts against an _in-flight,
  experimental_ convention.
- **Churn on a convention that was just set.** `/server-card` landed deliberately in PR #22
  (resolving #12) with written rationale. Re-spelling it now, while SEP-2127 is under
  review, spends maintainer/reviewer attention and any nascent implementer goodwill for a
  marginal, host-dependent gain. Principle 3 of this repo's `AGENTS.md` ("respect the
  experimental, spec-tracked nature") and the "stay conservative" guidance both point
  toward _not_ re-litigating a fresh decision without a strong forcing function.
- **It does not fix the real ambiguity.** As shown above, query strings / trailing slashes
  / templated URLs are problems for `/server-card.json` just as much as for `/server-card`.
  `.json` changes the spelling, not the hard part.

### Net

The `.json` extension is a **legitimate option with a coherent rationale**, but its main
benefit (static-host content-type inference) is structurally weakest at the reserved
location it would govern (a dynamic MCP endpoint), it risks mis-advertising the card's
specific media type as generic `application/json`, and it couples the path to a
serialization on an experimental convention that was only just decided. On balance this
doc recommends **keeping `/server-card`** and instead making the cheaper, higher-leverage
change below.

## The change that actually delivers the suggestion's goal

The suggestion's real target is "**a simple scraper can do a plain `GET` and get the
card, without dealing with content negotiation.**" That is achievable today with a one-line
clarification, no path change and no breaking effect on consumers:

> A server that hosts its Server Card at the reserved `<streamable-http-url>/server-card`
> location **MUST** serve the card in response to a plain `GET`, i.e. it MUST NOT _require_
> an `Accept: application/mcp-server-card+json` request header to return the card at that
> reserved path. Clients SHOULD still send the `Accept` header; servers SHOULD still
> respond with `Content-Type: application/mcp-server-card+json`. (For cards hosted at an
> arbitrary `url` advertised by a catalog, content negotiation at that URL remains at the
> host's discretion.)

This:

- makes the bare-`GET` scraper a **first-class, guaranteed** client at the reserved path —
  the exact ergonomics the suggestion wants;
- keeps `Accept`/`Content-Type` as the correct, recommended behavior for well-behaved
  clients and caches;
- is **non-breaking for card consumers** (clients/caches/scrapers): it only constrains
  servers _toward_ being more permissive, so no existing reader breaks. It is, to be
  precise, a **new normative obligation on _producers_** — a server that today gates the
  reserved path on `Accept` would have to relax that. Per this repo's `AGENTS.md`
  (Principle 4, treat the schema as a public contract), that producer-side tightening is
  called out explicitly rather than buried; and
- does not pre-empt any unresolved SEP-2127 question about media types or alternate
  representations.

If, after discussion, maintainers still want the static-host ergonomics of an extension,
the **least-disruptive** form is to keep `/server-card` as the reserved suffix and add a
note that servers/operators **MAY** additionally expose the card at a `.json` URL and point
the catalog `url` at it — rather than re-spelling the single reserved location.

### Authenticated and private servers (a caveat on the bare-`GET` MUST)

Neither spelling changes how the card is _protected_, but the bare-`GET` MUST above
deserves a scoping caveat. A private server whose `/mcp` endpoint sits behind OAuth may
not want — or may not be able — to serve its card unauthenticated at the reserved path.
The Server Card is intentionally pre-connection, public-leaning metadata (the discovery
catalog that points at it is "publicly accessible by design," per `discovery.md`'s
Security Considerations), but a server is free to host the card anywhere, including behind
the same auth wall, and advertise it through a trusted channel rather than a public
catalog. So the MUST should be scoped as: _if_ a server chooses to expose its card at the
reserved `/server-card` path, a bare `GET` (no `Accept`) must return it — it is **not** a
requirement to expose the card publicly at all. Servers that require authentication to
even reach `/mcp` are out of scope for the reserved-path guarantee and rely on the catalog
`url` (or out-of-band distribution) instead. This is also why the `.json` spelling earns
nothing here: auth posture is orthogonal to the path's file extension.

### Collision with a real application route

One argument the suggestion's "no drawback" framing skips, and one that mildly _favors_ an
extension or `.well-known` discriminator: appending `/server-card` (or `/server-card.json`)
to a server's base URL could collide with an actual application route the server already
serves at that path. In practice the collision risk is low — `server-card` is a specific,
reserved token, and a `.json`-suffixed path is marginally less likely to clash with a
human-facing route than a bare one — but it is real for servers that route their entire
`/mcp/*` subtree to the JSON-RPC handler and would need to carve out the reserved suffix
explicitly. This is a (weak) point in the `.json` column, noted for completeness; it does
not move the overall recommendation.

## Recommendation

1. **Do not adopt `/server-card.json` as the reserved suffix.** Keep `/server-card`. The
   premise that this escapes content negotiation is already satisfied by the current path
   convention; the `.json` benefit is weakest at the dynamic endpoint it would govern, and
   re-spelling a just-decided experimental convention is not worth the churn. _(Presented as
   an available option above, with the case argued against.)_
2. **Adopt the bare-`GET` clarification** (servers MUST serve the card at the reserved path
   without requiring `Accept`). This is the cheap, non-breaking change that delivers the
   scraper-friendliness the suggestion is after.
3. **Specify the suffix-resolution rule** in `discovery.md` (operate on the URL _path_
   component per RFC 3986; strip query and fragment; collapse a single trailing slash;
   append after template expansion) so "append `/server-card`" is unambiguous. This gap
   exists today independent of the `.json` question.
4. **Keep steering scrapers to the catalog `url`** as the robust path: it is an
   already-resolved absolute URL and sidesteps all suffix arithmetic.

## Open questions for maintainers

- Is there a concrete deployment scenario where MCP servers genuinely sit behind a
  pure static host that cannot set `Content-Type` for the reserved path? If that population
  is real and large, the case for `.json` strengthens and item (1) should be reconsidered.
- Should the bare-`GET`-MUST guarantee (item 2) be scoped strictly to the _reserved_
  `/server-card` path (as proposed here), or generalized? Generalizing would intrude on the
  "any unreserved URI" freedom and is probably out of scope.
- Does SEP-2127 anticipate any non-JSON or wrapped (signed) card representation? If yes,
  that is a further argument for an extension-less resource path (item 1) and worth
  recording in the SEP.
- Is `application/json` (what a `.json` extension tends to advertise on static hosts)
  acceptable as a fallback `Content-Type`, or must the registered
  `application/mcp-server-card+json` always be served? The answer affects how damaging the
  `.json` media-type-genericization point is.
