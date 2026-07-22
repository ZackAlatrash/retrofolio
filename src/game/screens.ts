export interface GameScreen {
  id: string;
  /** HUD label (English; the level-select is not translated). */
  label: string;
}

/** The six screens, in order. `id` doubles as the scroll anchor and hash. */
export const SCREENS: GameScreen[] = [
  { id: "title", label: "TITLE" },
  { id: "about", label: "ABOUT" },
  { id: "projects", label: "PROJECTS" },
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
