export interface GameScreen {
  id: string;
  /** HUD label (English; the level-select is not translated). */
  label: string;
  /**
   * How far into the screen a nav click should land, as a fraction of its
   * scrollable range. Screens that open with a transition (the credits roll)
   * would otherwise drop you on an empty frame before anything has started.
   */
  enter?: number;
}

/** The five screens, in order. `id` doubles as the scroll anchor and hash.
 * Projects sits right after the title: the two are one fused sequence on the
 * same television (see showcase/sequence.ts). */
export const SCREENS: GameScreen[] = [
  { id: "title", label: "TITLE" },
  { id: "projects", label: "PROJECTS" },
  { id: "about", label: "ABOUT" },
  { id: "skills", label: "SKILLS" },
  { id: "contact", label: "CONTACT", enter: 0.42 },
];

export function scrollToScreen(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const screen = SCREENS.find((s) => s.id === id);
  const top = el.getBoundingClientRect().top + window.scrollY;
  const range = Math.max(0, el.offsetHeight - window.innerHeight);
  const into = screen?.enter ? screen.enter * range : 0;
  window.scrollTo({ top: top + into, behavior: "smooth" });
  if (history.replaceState) history.replaceState(null, "", `#${id}`);
}
