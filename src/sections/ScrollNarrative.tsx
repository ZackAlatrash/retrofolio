import type { ReactNode } from "react";
import { Hero } from "./Hero";
import { ProofStrip } from "./ProofStrip";
import { PipelineScene } from "./PipelineScene";
import { SelectedWork } from "./SelectedWork";
import { MoreWork } from "./MoreWork";
import { Skills } from "./Skills";
import { Contact } from "./Contact";

/**
 * Composes the full scroll narrative in the spec order. `chatSlot` (the live
 * chatbot, wired by the chat workstream) renders between Skills and Contact.
 */
export function ScrollNarrative({ chatSlot }: { chatSlot?: ReactNode }) {
  return (
    <main>
      <Hero id="hero" />
      <ProofStrip id="proof" />
      <PipelineScene id="pipeline" />
      <SelectedWork id="work" />
      <MoreWork id="more" />
      <Skills id="skills" />
      {chatSlot}
      <Contact id="contact" />
    </main>
  );
}
