import { describe, it, expect } from "vitest";
import { projects, deepProjects, getProject } from "../src/content/projects";
import { profile } from "../src/content/profile";
import type { Project } from "../src/content/types";

const EM_DASH = "—";

function copyStrings(p: Project): string[] {
  const out: string[] = [
    p.name,
    p.whatItIs,
    p.problem ?? "",
    p.architecture ?? "",
    p.hardestProblem ?? "",
    p.tradeoffs ?? "",
    p.limitations ?? "",
  ];
  p.metrics?.forEach((m) => out.push(m.label));
  p.diagram?.forEach((d) => out.push(d.caption));
  return out.filter(Boolean);
}

describe("project inventory", () => {
  it("has 12 projects", () => {
    expect(projects).toHaveLength(12);
  });

  it("has exactly 6 deep-tier projects", () => {
    expect(deepProjects).toHaveLength(6);
  });

  it("every project has core fields", () => {
    for (const p of projects) {
      expect(p.id, "id").toBeTruthy();
      expect(p.name, `${p.id} name`).toBeTruthy();
      expect(p.whatItIs, `${p.id} whatItIs`).toBeTruthy();
      expect(p.stack.length, `${p.id} stack`).toBeGreaterThan(0);
      expect(p.status.length, `${p.id} status`).toBeGreaterThan(0);
    }
  });

  it("deep projects carry the full case-study fields", () => {
    for (const p of deepProjects) {
      expect(p.problem, `${p.id} problem`).toBeTruthy();
      expect(p.architecture, `${p.id} architecture`).toBeTruthy();
      expect(p.hardestProblem, `${p.id} hardestProblem`).toBeTruthy();
      expect(p.tradeoffs, `${p.id} tradeoffs`).toBeTruthy();
      expect(p.limitations, `${p.id} limitations`).toBeTruthy();
      expect(p.metrics?.length, `${p.id} metrics`).toBeGreaterThan(0);
    }
  });

  it("has unique ids", () => {
    const ids = projects.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getProject resolves a known id", () => {
    expect(getProject("omnipotence")?.name).toContain("Omnipotence");
    expect(getProject("nope")).toBeUndefined();
  });

  it("contains no em dashes in visitor copy", () => {
    for (const p of projects) {
      for (const s of copyStrings(p)) {
        expect(s.includes(EM_DASH), `${p.id}: "${s}"`).toBe(false);
      }
    }
  });
});

describe("profile", () => {
  it("has identity, metrics, pillars, and skill groups", () => {
    expect(profile.name).toBeTruthy();
    expect(profile.positioning).toBeTruthy();
    expect(profile.headlineMetrics.length).toBeGreaterThan(0);
    expect(profile.pillars.length).toBe(3);
    expect(profile.skillGroups.length).toBeGreaterThan(0);
  });

  it("has no em dashes in positioning or pillar copy", () => {
    const strings = [
      profile.positioning,
      profile.seeking,
      profile.education,
      ...profile.pillars.flatMap((p) => [p.title, p.body]),
    ];
    for (const s of strings) {
      expect(s.includes(EM_DASH), s).toBe(false);
    }
  });
});
