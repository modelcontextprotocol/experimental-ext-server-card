#!/usr/bin/env tsx

/**
 * Validate the example documents under `examples/` against the generated
 * `schema.json`. Each example is run against `#/$defs/ServerCard` and
 * against the schema's expected acceptance — `valid/` examples must validate
 * cleanly, `invalid/` examples must fail at least one constraint.
 */

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

const SCHEMA_JSON = "schema.json";
const EXAMPLES_DIR = "examples";

type Outcome = {
  name: string;
  expected: "valid" | "invalid";
  passed: boolean;
  message: string;
};

function loadSchema() {
  const schema = JSON.parse(readFileSync(SCHEMA_JSON, "utf-8"));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats.default(ajv);
  ajv.addSchema(schema, "schema.json");
  return ajv;
}

function listJsonFiles(dir: string): string[] {
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => join(dir, f));
  } catch {
    return [];
  }
}

function runServerCardExamples(ajv: Ajv2020): Outcome[] {
  const root = join(EXAMPLES_DIR, "ServerCard");
  const outcomes: Outcome[] = [];

  const validate = ajv.getSchema(`schema.json#/$defs/ServerCard`);
  if (!validate) {
    throw new Error(`Could not resolve ServerCard schema in ${SCHEMA_JSON}`);
  }

  for (const expected of ["valid", "invalid"] as const) {
    const dir = join(root, expected);
    for (const file of listJsonFiles(dir)) {
      const data = JSON.parse(readFileSync(file, "utf-8"));
      const ok = validate(data);
      const passed = expected === "valid" ? !!ok : !ok;
      const errors = validate.errors ?? [];
      outcomes.push({
        name: `ServerCard/${expected}/${file.split("/").pop()}`,
        expected,
        passed,
        message: passed
          ? expected === "valid"
            ? "validated cleanly"
            : `rejected (${errors.length} error(s))`
          : expected === "valid"
            ? `unexpectedly invalid: ${ajv.errorsText(errors)}`
            : `unexpectedly valid (no errors raised)`,
      });
    }
  }

  return outcomes;
}

function main(): void {
  const ajv = loadSchema();
  const outcomes = runServerCardExamples(ajv);

  if (outcomes.length === 0) {
    console.error(`No examples found under ${EXAMPLES_DIR}/.`);
    process.exit(1);
  }

  let failed = 0;
  for (const o of outcomes) {
    const status = o.passed ? "✓" : "✗";
    console.log(`${status} ${o.name} — ${o.message}`);
    if (!o.passed) failed++;
  }

  console.log();
  if (failed > 0) {
    console.error(`${failed} of ${outcomes.length} example(s) failed.`);
    process.exit(1);
  }
  console.log(`All ${outcomes.length} example(s) passed.`);
}

main();
