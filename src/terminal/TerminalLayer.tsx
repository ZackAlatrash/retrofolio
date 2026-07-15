import { useCallback, useEffect, useState } from "react";
import { CommandPalette } from "./CommandPalette";

/** True when the event target is a field where typing `k`/backtick is content. */
function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable === true
  );
}

/**
 * Mounts the command palette and owns the global open/close key handling.
 * Cmd/Ctrl-K toggles the palette from anywhere; the backtick key opens it when
 * the user is not typing into a field and it is not already open. Boot is
 * mounted separately by App.
 */
export function TerminalLayer() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const cmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (cmdK) {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (
        e.key === "`" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !isEditableTarget(e.target)
      ) {
        e.preventDefault();
        setOpen((o) => (o ? o : true));
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("zk:palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("zk:palette", onOpen);
    };
  }, []);

  return <CommandPalette open={open} onClose={close} />;
}
