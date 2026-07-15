import type { ThemeName } from "../theme/themes";

/**
 * Types for the terminal command layer. The CommandBus parses raw input into a
 * ParsedCommand, the registry resolves it to a Command, and the handler returns
 * a declarative CommandResult (never raw HTML). Side effects are expressed as
 * CommandEffect descriptors so the bus stays pure and testable; the palette
 * applies them against the cross-component contract.
 */

/** Visual role for a single output line. Maps to a --term-* color. */
export type OutputKind =
  | "text"
  | "dim"
  | "accent"
  | "success"
  | "error"
  | "warn"
  | "heading"
  | "cite";

/** One rendered line of command output. */
export interface OutputLine {
  text: string;
  kind?: OutputKind;
}

/**
 * A declarative side effect. The palette (which owns React context and DOM
 * access) applies these; handlers never touch the DOM directly.
 */
export type CommandEffect =
  | { type: "scroll"; target: string }
  | { type: "ask"; question?: string }
  | { type: "theme"; name: ThemeName }
  | { type: "clear" }
  | { type: "download"; url: string; filename?: string }
  | { type: "openUrl"; url: string };

/** The structured result of running a command. */
export interface CommandResult {
  lines: OutputLine[];
  effects?: CommandEffect[];
  /** When true the palette closes after applying effects (navigation, ask). */
  closeAfter?: boolean;
}

/** Runtime state the palette hands to a handler at execution time. */
export interface CommandRuntime {
  history: string[];
  currentTheme?: ThemeName;
}

/** The context a handler receives. */
export interface CommandContext {
  /** Positional args after the command token, quotes already stripped. */
  args: string[];
  /** Everything after the command token, trimmed, outer quotes stripped. */
  argString: string;
  /** The full raw input line. */
  raw: string;
  /** Session command history (most recent last). */
  history: string[];
  /** The currently active theme, if known. */
  currentTheme?: ThemeName;
}

/** A declarative registry entry. Adding a command touches only the registry. */
export interface Command {
  name: string;
  aliases: string[];
  /** Usage hint for the argument portion, e.g. "<project>". */
  args?: string;
  help: string;
  group: string;
  handler: (ctx: CommandContext) => CommandResult;
}

/** The result of parsing a raw input line. */
export interface ParsedCommand {
  /** Resolved command, or null when unknown. */
  command: Command | null;
  /** Canonical name when resolved, otherwise the raw first token. */
  name: string;
  args: string[];
  argString: string;
  raw: string;
  /** Nearest-match suggestion when the command is unknown. */
  suggestion?: string;
}
