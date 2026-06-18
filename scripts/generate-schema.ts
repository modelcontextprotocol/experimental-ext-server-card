#!/usr/bin/env tsx

import { exec } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { promisify } from "util";
import prettier from "prettier";

const execAsync = promisify(exec);

const SCHEMA_TS = "schema.ts";
const SCHEMA_JSON = "schema.json";

const CHECK_MODE = process.argv.includes("--check");

/**
 * Apply JSON Schema 2020-12 transformations to the generated schema string.
 *
 * `typescript-json-schema` emits draft-07 by default; mirror the same
 * post-processing the upstream MCP spec applies to its 2020-12 schemas.
 */
function applyJsonSchema202012Transformations(content: string): string {
  return content
    .replace(
      /http:\/\/json-schema\.org\/draft-07\/schema#/g,
      "https://json-schema.org/draft/2020-12/schema",
    )
    .replace(/"definitions":/g, '"$defs":')
    .replace(/#\/definitions\//g, "#/$defs/");
}

async function generate(): Promise<string> {
  const { stdout } = await execAsync(
    `npx typescript-json-schema --defaultNumberType integer --required --skipLibCheck "${SCHEMA_TS}" "*"`,
  );
  const transformed = applyJsonSchema202012Transformations(stdout);
  const config = (await prettier.resolveConfig(SCHEMA_JSON)) ?? {};
  return prettier.format(transformed, { ...config, filepath: SCHEMA_JSON });
}

async function main(): Promise<void> {
  if (CHECK_MODE) {
    const existing = readFileSync(SCHEMA_JSON, "utf-8");
    const expected = await generate();
    if (existing.trim() !== expected.trim()) {
      console.error(`✗ ${SCHEMA_JSON} is out of date. Run: npm run generate`);
      process.exit(1);
    }
    console.log(`✓ ${SCHEMA_JSON} is up to date`);
  } else {
    const content = await generate();
    writeFileSync(SCHEMA_JSON, content, "utf-8");
    console.log(`✓ Generated ${SCHEMA_JSON}`);
  }
}

main().catch((error) => {
  console.error("Schema generation failed:", error);
  process.exit(1);
});
