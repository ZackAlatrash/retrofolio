import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Guard: no em dash (U+2014) in any source file. Zack treats em dashes as an AI
 * tell, so all visitor copy must avoid them. Applies across every workstream.
 */
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe("no em dashes in source", () => {
  it("src/ contains no U+2014", () => {
    const offenders: string[] = [];
    for (const file of walk(join(process.cwd(), "src"))) {
      const text = readFileSync(file, "utf8");
      text.split("\n").forEach((lineText, i) => {
        if (lineText.includes("—")) {
          offenders.push(`${file}:${i + 1}`);
        }
      });
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
