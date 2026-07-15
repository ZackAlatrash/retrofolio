import { Boot } from "./terminal/Boot";
import { TerminalLayer } from "./terminal/TerminalLayer";
import { ScrollNarrative } from "./sections/ScrollNarrative";
import { ChatSection } from "./sections/ChatSection";
import { ThemeSwitcher } from "./components/ThemeSwitcher";

/**
 * Model D composition: a cinematic boot reveals the recruiter-first scroll
 * narrative. The chatbot renders in the narrative's chat slot; the terminal
 * command palette and a visible theme switcher overlay everything.
 *
 * Native CSS smooth scroll (index.css) drives command and citation navigation
 * reliably; it cooperates with GSAP ScrollTrigger and honors reduced motion.
 */
export function App() {
  return (
    <Boot>
      <ThemeSwitcher />
      <ScrollNarrative chatSlot={<ChatSection />} />
      <TerminalLayer />
    </Boot>
  );
}
