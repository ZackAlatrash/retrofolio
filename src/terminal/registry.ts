import { profile } from "../content/profile";
import { projects, deepProjects, getProject } from "../content/projects";
import { themeList, isThemeName } from "../theme/themes";
import type {
  Command,
  CommandContext,
  CommandResult,
  OutputLine,
} from "./commandTypes";

/** Section ids from the cross-component navigation contract. */
export const SECTION_IDS = {
  hero: "hero",
  proof: "proof",
  pipeline: "pipeline",
  work: "work",
  more: "more",
  skills: "skills",
  chat: "chat",
  contact: "contact",
} as const;

/** Grouping labels, in display order for `help` and the palette empty state. */
export const GROUPS = {
  identity: "navigation & identity",
  projects: "projects",
  chat: "the chatbot",
  session: "appearance & session",
  eggs: "easter eggs",
} as const;

/** Suggested questions shown in the palette empty state and by bare `ask`. */
export const SUGGESTED_QUESTIONS: string[] = [
  "What's his strongest AI project?",
  "Does he have production AWS experience?",
  "Show me his testing discipline.",
];

/**
 * Project id aliases for `cat`. `codelens` and `recomp` are required by spec;
 * the rest are convenient short forms. Canonical ids always resolve directly.
 */
const PROJECT_ALIASES: Record<string, string> = {
  codelens: "omnipotence",
  omni: "omnipotence",
  recomp: "recomp-tracker",
  cart: "consented-cart",
  lex: "lex-ai",
  tulip: "tulipvision",
  locked: "locked-in",
  banking: "digital-banking",
  festival: "haarlem-festival",
};

/** Resolve a user-typed project token to a canonical project id. */
export function resolveProjectId(input: string): string | undefined {
  const key = input.trim().toLowerCase();
  if (!key) return undefined;
  if (getProject(key)) return key;
  return PROJECT_ALIASES[key];
}

// -- small line helpers -------------------------------------------------------

const line = (text: string, kind?: OutputLine["kind"]): OutputLine => ({
  text,
  kind,
});
const blank = (): OutputLine => ({ text: "" });

// -- handlers -----------------------------------------------------------------

function helpHandler(): CommandResult {
  const lines: OutputLine[] = [
    line("Available commands. Open this palette any time with Cmd/Ctrl-K or `.", "dim"),
  ];
  for (const group of Object.values(GROUPS)) {
    const inGroup = registry.filter((c) => c.group === group);
    if (inGroup.length === 0) continue;
    lines.push(blank());
    lines.push(line(group, "heading"));
    for (const c of inGroup) {
      const usage = c.args ? `${c.name} ${c.args}` : c.name;
      lines.push(line(`  ${usage.padEnd(22)} ${c.help}`, "text"));
    }
  }
  return { lines };
}

function whoamiHandler(): CommandResult {
  return {
    lines: [
      line(`${profile.name} (${profile.goesBy})`, "accent"),
      line(profile.positioning, "text"),
      blank(),
      line(`location   ${profile.location}`, "dim"),
      line(`status     ${profile.status}`, "dim"),
      line(`seeking    ${profile.seeking}`, "dim"),
      line(`education  ${profile.education}`, "dim"),
      line(`cert       ${profile.certHighlight}`, "dim"),
      blank(),
      ...profile.headlineMetrics.map((m) =>
        line(`  ${m.value.padEnd(10)} ${m.label}`, "cite"),
      ),
    ],
    effects: [{ type: "scroll", target: SECTION_IDS.hero }],
    closeAfter: true,
  };
}

function skillsHandler(): CommandResult {
  const lines: OutputLine[] = [];
  for (const g of profile.skillGroups) {
    lines.push(line(g.name, "heading"));
    lines.push(line(`  ${g.skills.join(", ")}`, "text"));
    lines.push(blank());
  }
  return {
    lines,
    effects: [{ type: "scroll", target: SECTION_IDS.skills }],
    closeAfter: true,
  };
}

function resumeHandler(ctx: CommandContext): CommandResult {
  const download = ctx.args.some((a) => a.toLowerCase() === "--download");
  if (download) {
    return {
      lines: [line("Downloading resume PDF...", "success")],
      effects: [{ type: "download", url: "/resume.pdf", filename: "Ziad-Alatrash-Resume.pdf" }],
    };
  }
  return {
    lines: [
      line("Resume available in the contact section.", "text"),
      line("Run `resume --download` to grab the PDF.", "dim"),
    ],
    effects: [{ type: "scroll", target: SECTION_IDS.contact }],
    closeAfter: true,
  };
}

function contactHandler(): CommandResult {
  return {
    lines: [
      line(`email      ${profile.email}`, "text"),
      line(`github     ${profile.github}`, "accent"),
      line(`linkedin   ${profile.linkedin}`, "accent"),
    ],
    effects: [{ type: "scroll", target: SECTION_IDS.contact }],
    closeAfter: true,
  };
}

function socialHandler(): CommandResult {
  return {
    lines: [
      line("External profiles:", "dim"),
      line(`github     ${profile.github}`, "accent"),
      line(`linkedin   ${profile.linkedin}`, "accent"),
    ],
    effects: [{ type: "scroll", target: SECTION_IDS.contact }],
    closeAfter: true,
  };
}

function lsHandler(ctx: CommandContext): CommandResult {
  const deepOnly = ctx.args.some((a) => a.toLowerCase() === "--deep");
  const list = deepOnly ? deepProjects : projects;
  const lines: OutputLine[] = [
    line(
      deepOnly
        ? `${list.length} deep case studies`
        : `${list.length} projects (top ${deepProjects.length} flagged deep)`,
      "dim",
    ),
    blank(),
  ];
  for (const p of list) {
    const flag = p.tier === "deep" ? "deep" : "";
    lines.push(
      line(`  ${p.id.padEnd(18)} ${p.name}${flag ? `  [${flag}]` : ""}`, "text"),
    );
  }
  lines.push(blank());
  lines.push(line("Open one with `cat <project>`.", "dim"));
  return {
    lines,
    effects: [{ type: "scroll", target: SECTION_IDS.work }],
    closeAfter: true,
  };
}

function catHandler(ctx: CommandContext): CommandResult {
  const token = ctx.args[0] ?? "";
  if (!token) {
    return {
      lines: [
        line("Usage: cat <project>", "warn"),
        line(`Try: ${projects.map((p) => p.id).slice(0, 4).join(", ")}, ...`, "dim"),
      ],
    };
  }
  const id = resolveProjectId(token);
  const project = id ? getProject(id) : undefined;
  if (!project) {
    const nearest = nearestProject(token);
    return {
      lines: [
        line(`cat: ${token}: no such project`, "error"),
        nearest
          ? line(`Did you mean \`cat ${nearest}\`?`, "dim")
          : line("Run `ls projects` to see them all.", "dim"),
      ],
    };
  }
  const lines: OutputLine[] = [
    line(project.name, "accent"),
    line(`  ${project.status.join(" · ")}`, "dim"),
    blank(),
    line(project.whatItIs, "text"),
    blank(),
    line(`stack  ${project.stack.join(", ")}`, "dim"),
  ];
  if (project.metrics?.length) {
    lines.push(blank());
    for (const m of project.metrics) {
      lines.push(line(`  ${m.value.padEnd(10)} ${m.label}`, "cite"));
    }
  }
  return {
    lines,
    effects: [{ type: "scroll", target: `project-${project.id}` }],
    closeAfter: true,
  };
}

function statsHandler(): CommandResult {
  const lines: OutputLine[] = [
    line("metrics bank", "heading"),
    blank(),
    ...profile.headlineMetrics.map((m) =>
      line(`  ${m.value.padEnd(10)} ${m.label}`, "cite"),
    ),
    blank(),
    line("per-project highlights:", "dim"),
  ];
  for (const p of deepProjects) {
    const top = p.metrics?.[0];
    if (top) lines.push(line(`  ${top.value.padEnd(10)} ${p.name} · ${top.label}`, "text"));
  }
  return {
    lines,
    effects: [{ type: "scroll", target: SECTION_IDS.proof }],
    closeAfter: true,
  };
}

function askHandler(ctx: CommandContext): CommandResult {
  const question = ctx.argString.trim();
  if (!question) {
    return {
      lines: [
        line("Opening the grounded assistant. Try asking:", "text"),
        ...SUGGESTED_QUESTIONS.map((q) => line(`  ${q}`, "cite")),
      ],
      effects: [
        { type: "ask" },
        { type: "scroll", target: SECTION_IDS.chat },
      ],
      closeAfter: true,
    };
  }
  return {
    lines: [line(`Asking: ${question}`, "text")],
    effects: [
      { type: "ask", question },
      { type: "scroll", target: SECTION_IDS.chat },
    ],
    closeAfter: true,
  };
}

function themeHandler(ctx: CommandContext): CommandResult {
  const requested = ctx.args[0]?.toLowerCase();
  if (!requested) {
    return {
      lines: [
        line("themes:", "heading"),
        ...themeList.map((t) =>
          line(
            `  ${t.name === ctx.currentTheme ? "* " : "  "}${t.name.padEnd(14)} ${t.mode}`,
            t.name === ctx.currentTheme ? "accent" : "text",
          ),
        ),
        blank(),
        line("Switch with `theme <name>`.", "dim"),
      ],
    };
  }
  if (!isThemeName(requested)) {
    return {
      lines: [
        line(`theme: ${requested}: unknown theme`, "error"),
        line(`Options: ${themeList.map((t) => t.name).join(", ")}`, "dim"),
      ],
    };
  }
  return {
    lines: [line(`theme set to ${requested}`, "success")],
    effects: [{ type: "theme", name: requested }],
  };
}

function clearHandler(): CommandResult {
  return { lines: [], effects: [{ type: "clear" }] };
}

function historyHandler(ctx: CommandContext): CommandResult {
  if (ctx.history.length === 0) {
    return { lines: [line("(no history yet)", "dim")] };
  }
  return {
    lines: ctx.history.map((h, i) =>
      line(`  ${String(i + 1).padStart(3)}  ${h}`, "text"),
    ),
  };
}

function sudoHandler(): CommandResult {
  return {
    lines: [
      line("nice try.", "warn"),
      line("this portfolio runs on trust, not root.", "dim"),
    ],
  };
}

function neofetchHandler(): CommandResult {
  const logo = [
    "   ______     ",
    "  |__  / |    ",
    "    / /| |__  ",
    "   / /_|  _ \\ ",
    "  /____|_| |_|",
  ];
  const info: string[] = [
    `${profile.goesBy}@portfolio`,
    "-----------------",
    `role     ${profile.positioning.split(",")[0]}`,
    `location ${profile.location}`,
    `cert     ${profile.certHighlight}`,
    `stack    RAG · hexagonal · AWS · Kotlin · Swift · React`,
    `projects ${projects.length} (${deepProjects.length} deep)`,
    ...profile.headlineMetrics.map((m) => `${m.label.padEnd(8)} ${m.value}`),
  ];
  const rows = Math.max(logo.length, info.length);
  const lines: OutputLine[] = [];
  for (let i = 0; i < rows; i++) {
    const l = (logo[i] ?? "").padEnd(15);
    const r = info[i] ?? "";
    lines.push(line(`${l}${r}`, i < logo.length ? "accent" : "text"));
  }
  return { lines };
}

// -- suggestion helpers -------------------------------------------------------

/** Damerau-lite Levenshtein distance for nearest-match suggestions. */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const d: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[m][n];
}

function nearestFrom(input: string, candidates: string[]): string | undefined {
  const key = input.trim().toLowerCase();
  if (!key) return undefined;
  let best: string | undefined;
  let bestScore = Infinity;
  for (const c of candidates) {
    const score = editDistance(key, c.toLowerCase());
    if (score < bestScore) {
      bestScore = score;
      best = c;
    }
  }
  // Only suggest when reasonably close (allow a bit of slack for long names).
  return best !== undefined && bestScore <= Math.max(2, Math.ceil(key.length / 2))
    ? best
    : undefined;
}

function nearestProject(input: string): string | undefined {
  const ids = [...projects.map((p) => p.id), ...Object.keys(PROJECT_ALIASES)];
  return nearestFrom(input, ids);
}

// -- the registry -------------------------------------------------------------

export const registry: Command[] = [
  {
    name: "help",
    aliases: ["?", "h"],
    help: "List available commands, grouped.",
    group: GROUPS.identity,
    handler: helpHandler,
  },
  {
    name: "whoami",
    aliases: ["about", "me"],
    help: "Identity, positioning, and key metrics.",
    group: GROUPS.identity,
    handler: whoamiHandler,
  },
  {
    name: "skills",
    aliases: ["stack"],
    help: "Grouped skills inventory.",
    group: GROUPS.identity,
    handler: skillsHandler,
  },
  {
    name: "resume",
    aliases: ["cv"],
    args: "[--download]",
    help: "View the resume; --download grabs the PDF.",
    group: GROUPS.identity,
    handler: resumeHandler,
  },
  {
    name: "contact",
    aliases: ["email"],
    help: "Email, GitHub, LinkedIn.",
    group: GROUPS.identity,
    handler: contactHandler,
  },
  {
    name: "social",
    aliases: ["links"],
    help: "External profile links.",
    group: GROUPS.identity,
    handler: socialHandler,
  },
  {
    name: "ls",
    aliases: ["projects"],
    args: "projects [--deep]",
    help: "List all projects; --deep shows only case studies.",
    group: GROUPS.projects,
    handler: lsHandler,
  },
  {
    name: "cat",
    aliases: ["open"],
    args: "<project>",
    help: "Open a project (e.g. cat omnipotence, cat codelens).",
    group: GROUPS.projects,
    handler: catHandler,
  },
  {
    name: "stats",
    aliases: ["metrics"],
    help: "Print the metrics bank.",
    group: GROUPS.projects,
    handler: statsHandler,
  },
  {
    name: "ask",
    aliases: ["chat", "??"],
    args: '"<question>"',
    help: "Ask the grounded RAG assistant.",
    group: GROUPS.chat,
    handler: askHandler,
  },
  {
    name: "theme",
    aliases: [],
    args: "[name]",
    help: "List themes or switch to one.",
    group: GROUPS.session,
    handler: themeHandler,
  },
  {
    name: "clear",
    aliases: ["cls"],
    help: "Clear the terminal history view.",
    group: GROUPS.session,
    handler: clearHandler,
  },
  {
    name: "history",
    aliases: [],
    help: "Show this session's command history.",
    group: GROUPS.session,
    handler: historyHandler,
  },
  {
    name: "sudo",
    aliases: [],
    help: "You do not have permission for that.",
    group: GROUPS.eggs,
    handler: sudoHandler,
  },
  {
    name: "neofetch",
    aliases: [],
    help: "ASCII logo and a system-style stack readout.",
    group: GROUPS.eggs,
    handler: neofetchHandler,
  },
];

/** name/alias -> Command, all lowercased. Built once. */
const nameIndex = new Map<string, Command>();
for (const c of registry) {
  nameIndex.set(c.name.toLowerCase(), c);
  for (const a of c.aliases) nameIndex.set(a.toLowerCase(), c);
}

/** Resolve a command token (case-insensitive) to a Command. */
export function resolveCommand(token: string): Command | undefined {
  return nameIndex.get(token.trim().toLowerCase());
}

/** All primary names + aliases, for suggestions and tab completion. */
export const allCommandWords: string[] = Array.from(nameIndex.keys());

/** Nearest command name for an unknown token, or undefined if nothing close. */
export function suggestCommand(token: string): string | undefined {
  const hit = nearestFrom(
    token,
    registry.map((c) => c.name),
  );
  return hit;
}

/** Registry grouped for the palette empty state, in display order. */
export const commandGroups: { group: string; commands: Command[] }[] = Object.values(
  GROUPS,
).map((group) => ({
  group,
  commands: registry.filter((c) => c.group === group),
}));
