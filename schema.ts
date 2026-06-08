/**
 * MCP Server Cards
 *
 * Experimental schema for SEP-2127. This file is the single source of truth
 * for the Server Card and `server.json` types and is intended to be lifted
 * directly into `schema/draft/schema.ts` of the main MCP specification when
 * Server Cards graduate from this experimental extension.
 *
 * @see https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127
 */

/**
 * A static metadata document describing a remote MCP server, suitable for
 * pre-connection discovery. A Server Card MAY be hosted at any unreserved URI;
 * MCP reserves `GET <streamable-http-url>/server-card` as the recommended
 * location. Clients learn a card's URL from an MCP/AI Catalog rather than
 * guessing it.
 *
 * Server Cards intentionally describe only what is needed to discover and
 * connect to a remote server: identity, transport, and protocol versions.
 * They do not enumerate primitives (tools, resources, prompts) — those remain
 * subject to runtime listing via the protocol's standard list operations.
 *
 * The companion {@link Server} shape is a strict superset that adds local
 * package metadata for use cases like the MCP Registry's `server.json`.
 *
 * @see [SEP-2127: MCP Server Cards](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127)
 * @category Server Cards
 */
export interface ServerCard {
  /**
   * The Server Card JSON Schema URI that this document conforms to. Required.
   *
   * Must be a `/v1/` URL under `static.modelcontextprotocol.io/schemas/`,
   * naming a Server Card / `server.json` schema (e.g.,
   * `https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json`
   * or `https://static.modelcontextprotocol.io/schemas/v1/server.schema.json`).
   * Schema URLs are versioned by the `vN` segment rather than by date so that
   * minor, additive revisions of the v1 shape don't bump every published
   * document's `$schema` URL.
   *
   * @format uri
   * @pattern ^https://static\.modelcontextprotocol\.io/schemas/v1/[^/]+\.schema\.json$
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
 * A superset of {@link ServerCard} that additionally describes locally-runnable
 * packages. This is the shape used by the MCP Registry's `server.json`.
 *
 * `Server` documents are typically published to a registry rather than served
 * from a Server Card URI (e.g., `<streamable-http-url>/server-card`), since they
 * may include instructions for installing and executing a server on a client's
 * local machine.
 *
 * @see [SEP-2127: MCP Server Cards](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127)
 * @category Server Cards
 */
export interface Server extends ServerCard {
  /**
   * Metadata helpful for running and connecting to local instances of this MCP server.
   */
  packages?: Package[];
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
   * {@link InputWithVariables.variables}). The map key is the variable
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
 * Metadata for installing and running a packaged MCP server locally.
 *
 * @category Server Cards
 */
export interface Package {
  /**
   * Registry type indicating how to download packages
   * (e.g., `"npm"`, `"pypi"`, `"oci"`, `"nuget"`, `"mcpb"`).
   */
  registryType: string;

  /**
   * Package identifier — either a package name (for registries)
   * or a URL (for direct downloads).
   */
  identifier: string;

  /**
   * Transport configuration for invoking this package after installation.
   */
  transport: PackageTransport;

  /**
   * Base URL of the package registry.
   *
   * @format uri
   */
  registryBaseUrl?: string;

  /**
   * Package version.
   *
   * @minLength 1
   */
  version?: string;

  /**
   * MCP protocol versions actively supported by this package.
   */
  supportedProtocolVersions?: string[];

  /**
   * A hint to help clients determine the appropriate runtime for the package
   * (e.g., `"npx"`, `"uvx"`, `"docker"`, `"dnx"`). Should be provided when
   * `runtimeArguments` are present.
   */
  runtimeHint?: string;

  /**
   * Arguments passed to the package's runtime command (such as `docker` or
   * `npx`). The `runtimeHint` field should be provided when `runtimeArguments`
   * are present.
   */
  runtimeArguments?: Argument[];

  /**
   * Arguments passed to the package's binary.
   */
  packageArguments?: Argument[];

  /**
   * Environment variables to be set when running the package.
   */
  environmentVariables?: KeyValueInput[];

  /**
   * SHA-256 hash of the package file for integrity verification. Required for
   * MCPB packages and optional for other package types. If present, MCP
   * clients MUST validate the downloaded file matches the hash before running
   * packages to ensure file integrity.
   *
   * @pattern ^[a-f0-9]{64}$
   */
  fileSha256?: string;
}

/**
 * Transport protocol configuration for a locally-runnable package.
 *
 * @category Server Cards
 */
export type PackageTransport =
  | StdioTransport
  | StreamableHttpPackageTransport
  | SsePackageTransport;

/**
 * Stdio transport — the client launches the package as a subprocess and
 * communicates over standard input and output.
 *
 * @category Server Cards
 */
export interface StdioTransport {
  type: "stdio";
}

/**
 * Streamable-HTTP transport for a locally-runnable package that exposes
 * itself over HTTP after launch.
 *
 * @category Server Cards
 */
export interface StreamableHttpPackageTransport {
  type: "streamable-http";

  /**
   * URL template for the streamable-http transport. Must start with
   * `http://`, `https://`, or a `{template-variable}`. Variables in
   * `{curly_braces}` reference argument value-hints, argument names, or
   * environment variable names from the parent {@link Package}.
   *
   * @pattern ^(https?://[^\s]+|\{[a-zA-Z_][a-zA-Z0-9_]*\}[^\s]*)$
   */
  url: string;

  /**
   * HTTP headers to include when connecting to the package's local endpoint.
   */
  headers?: KeyValueInput[];
}

/**
 * Server-sent events (SSE) transport for a locally-runnable package.
 *
 * @category Server Cards
 */
export interface SsePackageTransport {
  type: "sse";

  /**
   * SSE endpoint URL template. See {@link StreamableHttpPackageTransport.url}
   * for variable-substitution semantics.
   *
   * @pattern ^(https?://[^\s]+|\{[a-zA-Z_][a-zA-Z0-9_]*\}[^\s]*)$
   */
  url: string;

  /**
   * HTTP headers to include when connecting to the package's local endpoint.
   */
  headers?: KeyValueInput[];
}

/**
 * A command-line argument supplied to a package's binary or runtime.
 *
 * @remarks
 * Arguments construct command-line parameters that may contain user-provided
 * input. This creates potential command-injection risks if clients execute
 * commands in a shell environment. Clients SHOULD prefer non-shell execution
 * methods (e.g., `posix_spawn`) when possible to eliminate injection risks
 * entirely. Where not possible, clients SHOULD obtain user consent to run the
 * resolved command before execution.
 *
 * @category Server Cards
 */
export type Argument = PositionalArgument | NamedArgument;

/**
 * A user-supplied or pre-set input value, used in {@link Package} argument
 * and environment-variable definitions.
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
   * Whether the input must be supplied for the package to run.
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
 * An {@link Input} whose `value` may reference variables for substitution.
 *
 * @category Server Cards
 */
export interface InputWithVariables extends Input {
  /**
   * Variables referenced by `{curly_braces}` identifiers in `value`. The map
   * key is the variable name; the value defines the variable's properties.
   */
  variables?: { [key: string]: Input };
}

/**
 * A named input — used for environment variables and HTTP headers.
 *
 * @category Server Cards
 */
export interface KeyValueInput extends InputWithVariables {
  /**
   * Name of the header or environment variable.
   */
  name: string;
}

/**
 * A positional command-line input — a value inserted verbatim into the
 * command line.
 *
 * @category Server Cards
 */
export interface PositionalArgument extends InputWithVariables {
  type: "positional";

  /**
   * Identifier for the positional argument. It is not part of the command
   * line; it may be used by client configuration as a label identifying the
   * argument, and it identifies the value in transport URL variable
   * substitution.
   *
   * Implementations SHOULD ensure that at least one of `valueHint` or
   * `value` is set so the positional argument resolves to a concrete value.
   */
  valueHint?: string;

  /**
   * Whether the argument can be repeated multiple times in the command line.
   */
  isRepeated?: boolean;
}

/**
 * A named command-line input — a `--flag={value}` parameter.
 *
 * @category Server Cards
 */
export interface NamedArgument extends InputWithVariables {
  type: "named";

  /**
   * The flag name, including any leading dashes (e.g., `"--port"`).
   */
  name: string;

  /**
   * Whether the argument can be repeated multiple times.
   */
  isRepeated?: boolean;
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
export type MetaObject = Record<string, unknown>;

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
