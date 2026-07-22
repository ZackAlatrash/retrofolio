export interface GameScreen {
  id: string;
  /** HUD label (English; the level-select is not translated). */
  label: string;
}

/** The six screens, in order. `id` doubles as the scroll anchor and hash.
 * Projects sits right after the title: the two are one fused sequence on the
 * same television (see showcase/sequence.ts). */
export const SCREENS: GameScreen[] = [
  { id: "title", label: "TITLE" },
  { id: "projects", label: "PROJECTS" },
  { id: "about", label: "ABOUT" },
  { id: "skills", label: "SKILLS" },
  { id: "patch", label: "PATCH" },
  { id: "contact", label: "CONTACT" },
];

export function scrollToScreen(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  if (history.replaceState) history.replaceState(null, "", `#${id}`);
}
