import type {
  CommandContext,
  CommandResult,
  CommandRuntime,
  OutputLine,
  ParsedCommand,
} from "./commandTypes";
import { resolveCommand, suggestCommand } from "./registry";

/**
 * Tokenize an input line, honoring double and single quotes so that
 * `ask "does he know AWS?"` yields a single argument. Whitespace outside quotes
 * separates tokens; quotes are stripped from the emitted token.
 */
function tokenize(input: string): string[] {
  const tokens: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    tokens.push(m[1] ?? m[2] ?? m[3] ?? "");
  }
  return tokens;
}

/** Strip a single layer of matching outer quotes, if present. */
function stripOuterQuotes(s: string): string {
  if (s.length >= 2) {
    const first = s[0];
    const last = s[s.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return s.slice(1, -1);
    }
  }
  return s;
}

/**
 * Parse a raw input line into a ParsedCommand. Case-insensitive command
 * resolution, whitespace trimmed, quoted arguments preserved. Never throws.
 * Unknown commands come back with `command: null` and a nearest-match
 * `suggestion` when one is close enough.
 */
export function parse(input: string): ParsedCommand {
  const raw = input ?? "";
  const trimmed = raw.trim();
  const tokens = tokenize(trimmed);

  if (tokens.length === 0) {
    return { command: null, name: "", args: [], argString: "", raw };
  }

  const first = tokens[0];
  const command = resolveCommand(first) ?? null;
  const args = tokens.slice(1);

  // argString: everything after the first whitespace-delimited token, with a
  // single layer of outer quotes removed (so bare and quoted questions match).
  const spaceIdx = trimmed.search(/\s/);
  const rest = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx + 1).trim();
  const argString = stripOuterQuotes(rest);

  return {
    command,
    name: command ? command.name : first.toLowerCase(),
    args,
    argString,
    raw,
    suggestion: command ? undefined : suggestCommand(first),
  };
}

/** Build the not-found result for an unknown command. */
function notFound(parsed: ParsedCommand): CommandResult {
  const lines: OutputLine[] = [
    { text: `command not found: ${parsed.name}`, kind: "error" },
  ];
  if (parsed.suggestion) {
    lines.push({ text: `Did you mean \`${parsed.suggestion}\`?`, kind: "dim" });
  }
  lines.push({ text: "Type `help` to see everything.", kind: "dim" });
  return { lines };
}

/**
 * Parse and execute an input line, returning a CommandResult. Guaranteed not to
 * throw: unknown commands yield a suggestion, and any handler error is caught
 * and surfaced as an error line.
 */
export function run(input: string, runtime?: CommandRuntime): CommandResult {
  const parsed = parse(input);

  if (parsed.raw.trim() === "") {
    return { lines: [] };
  }
  if (!parsed.command) {
    return notFound(parsed);
  }

  const ctx: CommandContext = {
    args: parsed.args,
    argString: parsed.argString,
    raw: parsed.raw,
    history: runtime?.history ?? [],
    currentTheme: runtime?.currentTheme,
  };

  try {
    return parsed.command.handler(ctx);
  } catch (err) {
    return {
      lines: [
        {
          text: `error running \`${parsed.command.name}\`: ${
            err instanceof Error ? err.message : "unknown error"
          }`,
          kind: "error",
        },
      ],
    };
  }
}

export { tokenize, stripOuterQuotes };
