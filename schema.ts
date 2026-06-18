/**
 * MCP Server Cards
 *
 * Schema for the experimental Server Card extension. This file is the single
 * source of truth for the Server Card types.
 */

/**
 * A static metadata document describing a remote MCP server, suitable for
 * pre-connection discovery. A Server Card may be hosted at any unreserved URI;
 * MCP reserves `GET <streamable-http-url>/server-card` as the recommended
 * location. Clients learn a card's URL from an [AI Catalog](https://github.com/Agent-Card/ai-catalog)
 * rather than guessing it.
 *
 * Server Cards describe only what is needed to discover and connect to a remote server:
 * identity, transport, and protocol versions.
 *
 * They do not enumerate primitives (tools, resources, prompts) — those remain
 * subject to runtime listing via the protocol's standard list operations.
 *
 * The fields a Server Card does declare (identity, transport, protocol
 * versions) are advisory, not authoritative: they should be consistent with
 * the server's `server/discover` response, and clients must not treat them as
 * authoritative for security decisions. See "Consistency with Runtime
 * Behavior" in docs/discovery.md for the normative requirement.
 *
 * @category Server Cards
 */
export interface ServerCard {
  /**
   * The Server Card JSON Schema URI that this document conforms to. Required.
   *
   * Must be the `/v1/` Server Card schema URL under
   * `static.modelcontextprotocol.io/schemas/` (i.e.,
   * `https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json`).
   * Schema URLs are versioned by the `vN` segment rather than by date; a
   * breaking revision of the Server Card shape publishes a new `vN` family.
   *
   * @format uri
   * @pattern ^https://static\.modelcontextprotocol\.io/schemas/v1/server-card\.schema\.json$
   */
  $schema: string;

  /**
   * Server name in reverse-DNS format. Must contain exactly one forward slash
   * separating namespace from server name.
   *
   * @minLength 3
   * @maxLength 200
   * @pattern ^[a-zA-Z0-9.-]+/[a-zA-Z0-9._-]+$
   */
  name: string;

  /**
   * Version string for this server. SHOULD follow semantic versioning
   * (e.g., '1.0.2', '2.1.0-alpha'). Equivalent of `Implementation.version`
   * in the MCP specification. Non-semantic versions are allowed but may not
   * sort predictably. Version ranges are rejected (e.g., '^1.2.3', '~1.2.3',
   * '>=1.2.3', '1.x', '1.*').
   *
   * @maxLength 255
   */
  version: string;

  /**
   * Clear human-readable explanation of server functionality. Should focus on
   * capabilities, not implementation details.
   *
   * @minLength 1
   * @maxLength 100
   */
  description: string;

  /**
   * Optional human-readable title or display name for the MCP server.
   * MCP subregistries or clients MAY choose to use this for display purposes.
   *
   * @minLength 1
   * @maxLength 100
   */
  title?: string;

  /**
   * Optional URL to the server's homepage, documentation, or project website.
   * Provides a central link for users to learn more about the server.
   * Particularly useful when the server has custom installation instructions
   * or setup requirements.
   *
   * @format uri
   */
  websiteUrl?: string;

  /**
   * Optional repository metadata for the MCP server source code.
   * Recommended for transparency and security inspection.
   */
  repository?: Repository;

  /**
   * Optional set of sized icons that the client can display in a user interface.
   *
   * Clients that support rendering icons MUST support at least the following
   * MIME types: `image/png` and `image/jpeg` (safe, universal compatibility).
   * Clients SHOULD also support: `image/svg+xml` (scalable but requires security
   * precautions) and `image/webp` (modern, efficient format).
   */
  icons?: Icon[];

  /**
   * Metadata helpful for making HTTP-based connections to this MCP server.
   */
  remotes?: Remote[];

  /**
   * Extension metadata using reverse-DNS namespacing for vendor-specific data.
   *
   * Follows the protocol's standard `_meta` definition.
   *
   * @see {@link MetaObject}
   */
  _meta?: MetaObject;
}

/**
 * Repository metadata for the MCP server source code. Enables users and
 * security experts to inspect the code, improving transparency.
 *
 * @category Server Cards
 */
export interface Repository {
  /**
   * Repository URL for browsing source code. Should support both web browsing
   * and `git clone` operations.
   *
   * @format uri
   */
  url: string;

  /**
   * Repository hosting service identifier (e.g., `"github"`). Used by registries
   * to determine validation and API access methods.
   */
  source: string;

  /**
   * Optional relative path from repository root to the server location within a
   * monorepo or nested package structure. Must be a clean relative path.
   */
  subfolder?: string;

  /**
   * Repository identifier from the hosting service (e.g., GitHub repo ID).
   * Owned and determined by the source forge. Should remain stable across
   * repository renames and may be used to detect repository resurrection
   * attacks — if a repository is deleted and recreated, the ID should change.
   */
  id?: string;
}

/**
 * Metadata for connecting to a remote (HTTP-based) MCP server endpoint.
 *
 * @category Server Cards
 */
export interface Remote {
  /**
   * The transport type for this remote endpoint.
   */
  type: "streamable-http" | "sse";

  /**
   * URL template for the remote endpoint. Must start with `http://`,
   * `https://`, or a `{template-variable}`. Variables in `{curly_braces}`
   * are substituted from the {@link Remote.variables} map before the
   * client connects.
   *
   * @pattern ^(https?://[^\s]+|\{[a-zA-Z_][a-zA-Z0-9_]*\}[^\s]*)$
   */
  url: string;

  /**
   * HTTP headers required or accepted when connecting to this remote
   * endpoint. Each header is described as a {@link KeyValueInput} so that
   * clients can prompt users for required values, mark secrets, surface
   * defaults, and constrain to a list of choices.
   */
  headers?: KeyValueInput[];

  /**
   * Configuration variables that can be referenced as `{curly_braces}`
   * placeholders in `url` (and inside header values via
   * {@link KeyValueInput.variables}). The map key is the variable
   * name; the value defines the variable's properties (e.g., human-readable
   * description, default, whether it is required or secret).
   */
  variables?: { [key: string]: Input };

  /**
   * MCP protocol versions actively supported by this remote endpoint. Allows
   * clients to negotiate a compatible protocol version before initialization.
   */
  supportedProtocolVersions?: string[];
}

/**
 * A user-supplied or pre-set input value, used for {@link Remote} URL
 * variables and header values.
 *
 * @category Server Cards
 */
export interface Input {
  /**
   * Human-readable explanation of the input. Clients can use this to provide
   * context to the user.
   */
  description?: string;

  /**
   * Whether the input must be supplied for the connection to succeed.
   */
  isRequired?: boolean;

  /**
   * Whether the input is a secret value (e.g., password, token). If true,
   * clients should handle the value securely.
   */
  isSecret?: boolean;

  /**
   * Specifies the input format. `"filepath"` should be interpreted as a file
   * on the user's filesystem. When the input is converted to a string,
   * booleans should be represented by `"true"`/`"false"`, and numbers by
   * decimal values.
   */
  format?: "string" | "number" | "boolean" | "filepath";

  /**
   * Default value for the input. SHOULD be a valid value for the input.
   */
  default?: string;

  /**
   * Placeholder displayed during configuration to provide examples or
   * guidance about the expected form of the input.
   */
  placeholder?: string;

  /**
   * Pre-set value for the input. If set, the value should not be configurable
   * by end users. Identifiers wrapped in `{curly_braces}` will be replaced
   * with the corresponding entries from the input's `variables` map (if any).
   */
  value?: string;

  /**
   * Allowed values for the input. If provided, the user must select one.
   */
  choices?: string[];
}

/**
 * A named {@link Input} — used for HTTP headers — whose `value` may reference
 * variables for substitution.
 *
 * @category Server Cards
 */
export interface KeyValueInput extends Input {
  /**
   * Name of the header.
   */
  name: string;

  /**
   * Variables referenced by `{curly_braces}` identifiers in `value`. The map
   * key is the variable name; the value defines the variable's properties.
   */
  variables?: { [key: string]: Input };
}

/* ---------- Inlined dependencies from the main MCP spec ---------- */

/**
 * Represents the contents of a `_meta` field, which clients and servers use to attach additional metadata to their interactions.
 *
 * Certain key names are reserved by MCP for protocol-level metadata; implementations MUST NOT make assumptions about values at these keys. Additionally, specific schema definitions may reserve particular names for purpose-specific metadata, as declared in those definitions.
 *
 * Valid keys have two segments:
 *
 * **Prefix:**
 * - Optional — if specified, MUST be a series of _labels_ separated by dots (`.`), followed by a slash (`/`).
 * - Labels MUST start with a letter and end with a letter or digit. Interior characters may be letters, digits, or hyphens (`-`).
 * - Any prefix consisting of zero or more labels, followed by `modelcontextprotocol` or `mcp`, followed by any label, is **reserved** for MCP use. For example: `modelcontextprotocol.io/`, `mcp.dev/`, `api.modelcontextprotocol.org/`, and `tools.mcp.com/` are all reserved.
 *
 * **Name:**
 * - Unless empty, MUST start and end with an alphanumeric character (`[a-z0-9A-Z]`).
 * - Interior characters may be alphanumeric, hyphens (`-`), underscores (`_`), or dots (`.`).
 *
 * @see [General fields: `_meta`](https://modelcontextprotocol.io/specification/draft/basic#meta) for more details.
 * @category Common Types
 */
export interface MetaObject {
  [key: string]: unknown;
}

/**
 * An optionally-sized icon that can be displayed in a user interface.
 *
 * @category Common Types
 */
export interface Icon {
  /**
   * A standard URI pointing to an icon resource. May be an HTTP/HTTPS URL or a
   * `data:` URI with Base64-encoded image data.
   *
   * Consumers SHOULD take steps to ensure URLs serving icons are from the
   * same domain as the client/server or a trusted domain.
   *
   * Consumers SHOULD take appropriate precautions when consuming SVGs as they can contain
   * executable JavaScript.
   *
   * @format uri
   */
  src: string;

  /**
   * Optional MIME type override if the source MIME type is missing or generic.
   * For example: `"image/png"`, `"image/jpeg"`, or `"image/svg+xml"`.
   */
  mimeType?: string;

  /**
   * Optional array of strings that specify sizes at which the icon can be used.
   * Each string should be in WxH format (e.g., `"48x48"`, `"96x96"`) or `"any"` for scalable formats like SVG.
   *
   * If not provided, the client should assume that the icon can be used at any size.
   */
  sizes?: string[];

  /**
   * Optional specifier for the theme this icon is designed for. `"light"` indicates
   * the icon is designed to be used with a light background, and `"dark"` indicates
   * the icon is designed to be used with a dark background.
   *
   * If not provided, the client should assume the icon can be used with any theme.
   */
  theme?: "light" | "dark";
}
