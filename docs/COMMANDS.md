# Portfolio — Command Reference

Last updated: 2026-07-15
Refines: DESIGN.md §6 (CommandBus, CommandRegistry), §8

Every command maps to a content surface that is *also* clickable. Commands are
declarative entries in the registry: `{ name, aliases, args, help, group,
handler }`. Adding or renaming a command touches only the registry.

Design rules:
- Case-insensitive. Leading/trailing whitespace trimmed.
- Quoted arguments supported: `ask "does he know AWS?"`.
- Unknown command → nearest-match suggestion + pointer to `help`. Never a dead
  end.
- Tab completion for command names and project ids.
- Up/Down arrow cycles command history (session only).
- Everything a command shows is reachable by clicking chips, nav, or links.

---

## Navigation & identity

| Command        | Aliases        | Description |
|----------------|----------------|-------------|
| `help`         | `?`, `h`       | List available commands, grouped. |
| `whoami`       | `about`, `me`  | Identity + one-line positioning + key metrics readout. |
| `skills`       | `stack`        | Grouped skills inventory (AI/ML, architecture, cloud, backend, frontend, testing). |
| `resume`       | `cv`           | View the resume; `resume --download` downloads the PDF. |
| `contact`      | `email`        | Email, GitHub, LinkedIn. |
| `social`       | `links`        | External profile links. |

## Projects

| Command             | Aliases     | Description |
|---------------------|-------------|-------------|
| `ls projects`       | `ls`, `projects` | List all 12 projects; top 6 flagged `deep`. |
| `ls projects --deep`| —           | List only the 6 deep case studies. |
| `cat <project>`     | `open <project>` | Open a project view (deep or card). |
| `stats`             | `metrics`   | Print the metrics bank (LOC, tests, RAG systems, deploys). |

Project ids (for `cat`): `omnipotence`, `recomp-tracker`, `consented-cart`,
`lex-ai`, `tulipvision`, `locked-in`, `digital-banking`, `kukis`,
`haarlem-festival`, `study-planner`, `chapeau`, `cello`. Aliases allowed, e.g.
`cat codelens` → `omnipotence`, `cat recomp` → `recomp-tracker`.

## The chatbot

| Command          | Aliases   | Description |
|------------------|-----------|-------------|
| `ask "<question>"` | `chat`, `?? <q>` | Ask the grounded RAG assistant. Streams a cited answer, or refuses if off-corpus. Also always available via a persistent chat affordance. |

`ask` with no argument opens the chat panel with focus in the input and a few
suggested questions (e.g. "What's his strongest AI project?", "Does he have
production AWS experience?", "Show me his testing discipline.").

## Appearance & session

| Command            | Aliases   | Description |
|--------------------|-----------|-------------|
| `theme`            | —         | List themes + show current. |
| `theme <name>`     | —         | Switch theme; persists to `localStorage`. Names in DESIGN-SYSTEM.md §4. |
| `crt on\|off`      | —         | Toggle the scanline/CRT effect (off by default; disabled under reduced-motion). |
| `clear`            | `cls`     | Clear the terminal history view. |
| `history`          | —         | Show this session's command history. |

## Easter eggs (low effort, high delight — optional)

| Command   | Behavior |
|-----------|----------|
| `sudo`    | Playful "nice try" line. |
| `neofetch`| ASCII logo + system-style readout of stack and stats. |
| `ligatures on\|off` | Toggle font ligatures. |
| `matrix`  | Brief, skippable, reduced-motion-safe flourish. Optional. |

Easter eggs must never interfere with discoverability or accessibility, and are
cut if they add meaningful build or maintenance cost.

## First-run affordance (critical, not a command)

On first load the terminal shows a one-line, dismissible hint such as:
`» New here? Type help, or just click the chips below.` plus visible clickable
command chips. This guarantees non-technical visitors are never faced with a
blank prompt they don't know how to use.
