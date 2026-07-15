import { describe, it, expect } from "vitest";
import { parse, run } from "../src/terminal/CommandBus";
import { registry, resolveProjectId } from "../src/terminal/registry";

describe("CommandBus.parse", () => {
  it("parses `cat omnipotence` into the cat command with a project arg", () => {
    const p = parse("cat omnipotence");
    expect(p.command?.name).toBe("cat");
    expect(p.args).toEqual(["omnipotence"]);
    expect(p.argString).toBe("omnipotence");
  });

  it("keeps a quoted question as a single argString", () => {
    const p = parse('ask "does he know AWS?"');
    expect(p.command?.name).toBe("ask");
    expect(p.argString).toBe("does he know AWS?");
    // The quoted span is one token, not four.
    expect(p.args).toEqual(["does he know AWS?"]);
  });

  it("is case-insensitive and trims whitespace", () => {
    const p = parse("   WhoAmI   ");
    expect(p.command?.name).toBe("whoami");
  });

  it("resolves aliases to the canonical command", () => {
    expect(parse("?").command?.name).toBe("help");
    expect(parse("cv").command?.name).toBe("resume");
    expect(parse("open lex-ai").command?.name).toBe("cat");
  });

  it("returns a suggestion (never throws) for an unknown command", () => {
    const p = parse("whoare");
    expect(p.command).toBeNull();
    expect(typeof p.suggestion).toBe("string");
    expect(p.suggestion).toBe("whoami");
  });
});

describe("project aliases", () => {
  it("maps codelens -> omnipotence", () => {
    expect(resolveProjectId("codelens")).toBe("omnipotence");
  });

  it("maps recomp -> recomp-tracker", () => {
    expect(resolveProjectId("recomp")).toBe("recomp-tracker");
  });

  it("resolves canonical ids directly and unknown to undefined", () => {
    expect(resolveProjectId("tulipvision")).toBe("tulipvision");
    expect(resolveProjectId("nope-not-real")).toBeUndefined();
  });
});

describe("CommandBus.run", () => {
  it("never throws on unknown input and surfaces a suggestion string", () => {
    let result!: ReturnType<typeof run>;
    expect(() => {
      result = run("whoare");
    }).not.toThrow();
    const text = result.lines.map((l) => l.text).join("\n");
    expect(text).toMatch(/command not found/i);
    expect(text).toMatch(/whoami/);
  });

  it("runs `cat codelens` and targets the omnipotence section", () => {
    const result = run("cat codelens");
    expect(result.effects).toContainEqual({
      type: "scroll",
      target: "project-omnipotence",
    });
  });

  it("routes `ask` to the chatbot with the question", () => {
    const result = run('ask "does he know AWS?"');
    expect(result.effects).toContainEqual({
      type: "ask",
      question: "does he know AWS?",
    });
  });

  it("returns empty output for a blank line without throwing", () => {
    expect(() => run("   ")).not.toThrow();
    expect(run("   ").lines).toEqual([]);
  });
});

describe("registry integrity", () => {
  it("gives every command a non-empty help string", () => {
    for (const c of registry) {
      expect(c.help.trim().length, `help for ${c.name}`).toBeGreaterThan(0);
    }
  });

  it("has unique primary command names", () => {
    const names = registry.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
