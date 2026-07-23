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
