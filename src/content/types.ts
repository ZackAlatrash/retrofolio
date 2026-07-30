export type ProjectTier = "deep" | "card";

export type ProjectStatus =
  | "deployed"
  | "adopted"
  | "beta"
  | "live"
  | "academic"
  | "personal";

export interface Metric {
  value: string;
  label: string;
}

export interface ProjectLink {
  label: string;
  href: string;
}

/** A pipeline/architecture stage for the diagram visual. */
export interface DiagramStage {
  label: string;
  caption: string;
}

/**
 * One stage of a real, separately runnable pipeline. `command` and `impl` are
 * the actual CLI subcommand and the actual class that implements the stage, so
 * the system map shows the codebase rather than a redrawn abstraction of it.
 */
export interface PipelineStage {
  /**
   * CLI subcommand that runs this stage on its own. Absent for stages that
   * only run as part of the whole track, which is most of what makes the
   * "independently runnable" claim worth stating at all.
   */
  command?: string;
  /** Progress label the tool itself prints, e.g. "3/6". Absent where it prints none. */
  step?: string;
  label: string;
  /** The adapter or service that implements it, named as in the codebase. */
  impl: string;
  detail: string;
  /** The artifact this stage hands to the next one. */
  output?: string;
  /** Adapter that changes with the deployment target. Proof the port holds. */
  swap?: { local: string; prod: string };
}

/** A pipeline that can be run end to end or one stage at a time. */
export interface PipelineTrack {
  id: string;
  label: string;
  purpose: string;
  stages: PipelineStage[];
}

/**
 * Two or more pipelines and the point where they meet. Rendered as the detail
 * screen's signature module.
 */
export interface SystemMap {
  tracks: PipelineTrack[];
  /** Where the tracks meet, in one sentence. */
  join: string;
}

/**
 * How much freedom a coach capability is given. The split is a judgement about
 * blast radius and reversibility rather than a mechanical read/write test,
 * which is the part worth showing.
 */
export type ToolLane = "read" | "confirm" | "memory";

/** One thing the coach can do, in plain language. No signatures. */
export interface CoachTool {
  label: string;
  lane: ToolLane;
  detail: string;
}

/** One outcome of the weekly verdict, in the order the engine tries them. */
export interface VerdictOutcome {
  when: string;
  verdict: string;
  /** The calorie move, where there is one. */
  change?: string;
}

/** A span of a coach answer, tagged with who produced it. */
export interface AnswerSpan {
  text: string;
  source: "computed" | "written";
}

/**
 * The deterministic boundary the AI sits behind: what the app computes, what
 * the model is allowed to say, and what it needs permission to do. Rendered as
 * the detail screen's signature module for an AI product.
 */
export interface CoachBoundary {
  /** The claim the module exists to demonstrate rather than assert. */
  claim: string;
  /** The shape of an answer, not a transcript of one. */
  anatomy: AnswerSpan[];
  lanes: { id: ToolLane; label: string; rule: string; why: string }[];
  tools: CoachTool[];
  verdict: {
    states: string[];
    note: string;
    outcomes: VerdictOutcome[];
  };
}

/** One of the consent rows a single submission writes. */
export interface ConsentRow {
  kind: string;
  purpose: string;
  /** True when it is granted by simply using the feature. */
  grantedByDefault: boolean;
  /** What is possible while it stands, and what stops when it does not. */
  allows: string;
}

/** A field every consent record snapshots at the moment of submission. */
export interface ConsentField {
  label: string;
  detail: string;
}

/** Something the design makes structurally impossible, and what prevents it. */
export interface Guarantee {
  cannot: string;
  because: string;
}

/**
 * The consent model as an operable receipt: what a submission actually writes,
 * what each record preserves, and the list of things that cannot happen as a
 * result. Rendered as the detail screen's signature module for a compliance
 * product, where the selling point is impossibility rather than features.
 */
export interface ConsentLedger {
  claim: string;
  rows: ConsentRow[];
  snapshot: ConsentField[];
  guarantees: Guarantee[];
}

/** A measured range of retrieval confidence from the project's own benchmark. */
export interface GateBand {
  label: string;
  from: number;
  to: number;
  meaning: string;
  /** True when questions in this band are answered rather than refused. */
  answered: boolean;
}

/** One piece of machinery built by hand rather than imported. */
export interface HandBuilt {
  label: string;
  detail: string;
}

/**
 * The evidence gate: a retrieval-confidence threshold below which the system
 * refuses instead of guessing. Rendered as the signature module for a project
 * whose point is knowing when not to answer.
 */
export interface EvidenceGateModule {
  claim: string;
  threshold: number;
  bands: GateBand[];
  /** What happens on each side of the line. */
  below: string;
  above: string;
  /** Why the number is defensible rather than chosen by feel. */
  calibration: string;
  /** The same design running on this site, and how it differs. */
  handBuilt: HandBuilt[];
}

/** A named point with an explanation. Shared by several detail modules. */
export interface DetailPoint {
  label: string;
  detail: string;
}

/** One architecture in a like-for-like comparison. */
export interface ModelResult {
  name: string;
  /** True for the track this project's author owned. */
  mine: boolean;
  /** Mean average precision at 0.5 IoU. Absent where no figure was recorded. */
  map50?: number;
  precision?: number;
  recall?: number;
  note?: string;
}

/**
 * A vision project's two halves: the method that made detection work, and the
 * like-for-like study that says how well each architecture actually did.
 */
export interface VisionBench {
  claim: string;
  /**
   * The tiled-inference walkthrough, one step at a time. `image` is optional
   * illustration sitting *behind* the overlay: the tiles and boxes are always
   * drawn live, so the picture can never read as detector output.
   */
  tiling: { steps: DetailPoint[]; note: string; image?: string };
  models: ModelResult[];
  protocol: string;
  shipped: DetailPoint[];
}

/** A refusal the policy engine can return, in the app's own words. */
export interface PolicyReasonCopy {
  id: string;
  title: string;
  /** May interpolate {n}, {date}, {a}, {b}. Pluralisation is applied to {n}. */
  message: string;
  hint?: string;
}

/** A mutation the policy engine gates. */
export interface GatedAction {
  id: string;
  label: string;
}

/**
 * A commitment played forward day by day: the lifecycle, the rules that fire,
 * and the refusal the policy engine returns for each blocked action at that
 * moment. The signature module for a project whose hardest logic only exists
 * across time.
 */
export interface CommitmentClock {
  claim: string;
  /** States plainly that this is one worked example, not a recording. */
  note: string;
  /** Default lock length. Users pick from several; only the window is fixed. */
  lockDays: number;
  windowDays: number;
  weeklyTarget: number;
  /** Monday the example lock starts, so the dates in refusals are real dates. */
  baseDate: string;
  /** Day indices where the scenario turns. */
  timeline: { violation: number; resolved: number; restored: number };
  actions: GatedAction[];
  reasons: PolicyReasonCopy[];
  pipeline: DetailPoint[];
  layers: DetailPoint[];
}

/** What one approach can do about one kind of shopper. */
export interface ShopperOutcome {
  approach: string;
  reachable: boolean;
  detail: string;
}

/** A shopper, defined by the one choice that matters to the argument. */
export interface ShopperCase {
  id: string;
  label: string;
  outcomes: ShopperOutcome[];
}

/**
 * A marketing site whose job is to land one argument. The module leads with
 * the argument rather than the craft, because that is what the site is for.
 */
export interface MarketingSite {
  claim: string;
  /** The legal distinction the whole product rests on. */
  premise: string;
  cases: ShopperCase[];
  hero: DetailPoint[];
  /** A true, checkable link between that hero and this one. */
  heroNote: string;
  delivery: DetailPoint[];
}

export interface Project {
  id: string;
  name: string;
  tier: ProjectTier;
  status: ProjectStatus[];
  whatItIs: string;
  stack: string[];
  /** Deep-tier fields (optional on card-tier). */
  problem?: string;
  architecture?: string;
  hardestProblem?: string;
  tradeoffs?: string;
  limitations?: string;
  metrics?: Metric[];
  diagram?: DiagramStage[];
  /** How the work came about: employer, team, duration, adoption. */
  context?: string;
  /** The runnable pipelines behind the project, for the detail screen. */
  systemMap?: SystemMap;
  /** The deterministic boundary the project's AI sits behind. */
  coachBoundary?: CoachBoundary;
  /** The consent model, for a project whose selling point is a rule it cannot break. */
  consentLedger?: ConsentLedger;
  /** The refusal threshold, for a project whose point is knowing when not to answer. */
  evidenceGate?: EvidenceGateModule;
  /** The detection method and the model comparison, for a vision project. */
  visionBench?: VisionBench;
  /** The lifecycle and its gatekeeper, for a project built around elapsed time. */
  commitmentClock?: CommitmentClock;
  /** The argument a marketing site exists to land, and how it was built. */
  marketingSite?: MarketingSite;
  /**
   * Other projects in this inventory that this one belongs with, by id. Used
   * for real relationships (a company and the product it sells), not for
   * "you might also like".
   */
  relatedIds?: string[];
  /** Only real, shareable links. Never fabricated. */
  links?: ProjectLink[];
}

export interface SkillGroup {
  name: string;
  skills: string[];
}

export interface Profile {
  name: string;
  goesBy: string;
  positioning: string;
  /** First-person professional summary for the About screen. */
  bio: string;
  location: string;
  status: string;
  languages: string[];
  seeking: string;
  education: string;
  certHighlight: string;
  github: string;
  linkedin: string;
  email: string;
  headlineMetrics: Metric[];
  pillars: { title: string; body: string }[];
  skillGroups: SkillGroup[];
}

/** A retrieval chunk for the grounded chatbot knowledge base. */
export interface KBChunk {
  id: string;
  projectId: string | null;
  sectionLabel: string;
  text: string;
  tags: string[];
  embedding?: number[];
}
