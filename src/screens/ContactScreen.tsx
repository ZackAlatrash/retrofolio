import { useEffect, useRef, useState } from "react";
import { profile } from "../content/profile";
import { useReducedMotion } from "../motion/useReducedMotion";
import { useSettings, pick } from "../game/settings";
import { skyUrl } from "../showcase/showcaseData";

/**
 * Screen 6 - CREDITS (Contact). The end of the game: the credits roll up over
 * the same night sky the constellation ends on, and settle on the contact
 * card with INSERT COIN TO CONTINUE.
 *
 * Every destination is real (from the content model); nothing is invented.
 * The resume button only appears if a resume actually exists at /resume.pdf.
 * Reduced motion drops the roll and lays the same content out statically.
 */

const PIXEL = '"Press Start 2P", ui-monospace, monospace';
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

const HEADING = { en: "CREDITS", nl: "AFTITELING" };
const CONTINUE = { en: "INSERT COIN TO CONTINUE", nl: "GOOI EEN MUNT ERIN" };
const OUTRO = {
  en: "thanks for playing · now let's build something",
  nl: "bedankt voor het spelen · nu iets moois bouwen",
};

const ROLES: { label: { en: string; nl: string }; value: string }[] = [
  { label: { en: "A PORTFOLIO BY", nl: "EEN PORTFOLIO VAN" }, value: "Zack Alatrash" },
  {
    label: { en: "DESIGN & ENGINEERING", nl: "ONTWERP & ONTWIKKELING" },
    value: "Zack Alatrash",
  },
  { label: { en: "BUILT WITH", nl: "GEBOUWD MET" }, value: "React 18 · TypeScript · Vite" },
  {
    label: { en: "PIXEL ART", nl: "PIXELART" },
    value: "Generated and art-directed by Zack",
  },
  {
    label: { en: "THE HELP BOT", nl: "DE HELP-BOT" },
    value: "Retrieval + an evidence gate, so it never invents an answer",
  },
  {
    label: { en: "SPECIAL THANKS", nl: "MET DANK AAN" },
    value: "Impala Studios · Hogeschool Inholland",
  },
  { label: { en: "BASED IN", nl: "GEVESTIGD IN" }, value: profile.location },
  {
    label: { en: "STATUS", nl: "STATUS" },
    value: "Available from summer 2026",
  },
];

const RESUME_URL = `${import.meta.env.BASE_URL}resume.pdf`;

export function ContactScreen() {
  const reduced = useReducedMotion();
  const { lang } = useSettings();
  const sectionRef = useRef<HTMLElement>(null);
  const rollRef = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  const [shift, setShift] = useState({ from: 0, travel: 0 });
  const [hasResume, setHasResume] = useState(false);
  // Debug: ?cp=<0..1> forces the roll's progress (renders at scroll 0).
  const forced =
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("cp");

  // The resume button only exists once the file does.
  useEffect(() => {
    let live = true;
    fetch(RESUME_URL, { method: "HEAD" })
      .then((r) => {
        if (live && r.ok && (r.headers.get("content-type") ?? "").includes("pdf")) {
          setHasResume(true);
        }
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  // Measure the roll so it starts below the fold and ends holding the card.
  useEffect(() => {
    if (reduced) return;
    const measure = () => {
      const h = rollRef.current?.offsetHeight ?? 0;
      const vh = window.innerHeight;
      setShift({ from: vh * 0.9, travel: h + vh * 0.35 });
    };
    measure();
    const id = window.setTimeout(measure, 500); // after webfonts settle
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", measure);
    };
  }, [reduced, lang, hasResume]);

  // Scroll drives the roll.
  useEffect(() => {
    if (reduced || forced != null) return;
    const el = sectionRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const total = el.offsetHeight - window.innerHeight;
        const top = el.getBoundingClientRect().top;
        setP(total > 0 ? clamp01(-top / total) : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const prog = forced != null ? clamp01(parseFloat(forced)) : p;
  const y = reduced ? 0 : shift.from - prog * shift.travel;

  return (
    <section
      id="contact"
      ref={sectionRef}
      aria-label="Contact"
      style={{
        position: "relative",
        height: reduced ? "auto" : "260vh",
        minHeight: "100vh",
        scrollMarginTop: 52,
        backgroundColor: "#05081a",
      }}
    >
      <div
        style={{
          position: reduced ? "relative" : "sticky",
          top: 0,
          height: reduced ? "auto" : "100vh",
          overflow: "hidden",
          backgroundImage: `linear-gradient(rgba(6,9,26,0.62), rgba(6,9,26,0.78)), url(${skyUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: reduced ? "84px 20px 64px" : undefined,
        }}
      >
        <div
          ref={rollRef}
          style={{
            position: reduced ? "relative" : "absolute",
            left: 0,
            right: 0,
            transform: reduced ? undefined : `translateY(${y}px)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 34,
            padding: "0 20px",
            willChange: "transform",
          }}
        >
          <div
            style={{
              fontFamily: PIXEL,
              fontSize: "clamp(16px, 3vw, 26px)",
              color: "#f4f4fb",
              textShadow: "3px 3px 0 #4a2f9e",
              letterSpacing: 2,
            }}
          >
            {pick(lang, HEADING)}
          </div>

          {ROLES.map((r) => (
            <div key={r.label.en} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: PIXEL,
                  fontSize: 9,
                  color: "#8fb6ff",
                  letterSpacing: 1.5,
                  marginBottom: 10,
                }}
              >
                {pick(lang, r.label)}
              </div>
              <div
                className="font-mono"
                style={{ fontSize: "clamp(13px, 1.5vw, 16px)", color: "#e2e6f5" }}
              >
                {r.value}
              </div>
            </div>
          ))}

          {/* the last card: how to reach me */}
          <div
            style={{
              marginTop: 14,
              width: "min(560px, 100%)",
              border: "2px solid rgba(122,162,247,0.4)",
              borderRadius: 14,
              background: "rgba(10,16,34,0.86)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(122,162,247,0.14)",
              padding: "26px 22px",
              textAlign: "center",
            }}
          >
            <div
              className="press-blink"
              style={{
                fontFamily: PIXEL,
                fontSize: "clamp(10px, 1.5vw, 13px)",
                color: "#fff",
                textShadow: "0 0 14px rgba(122,162,247,0.7)",
              }}
            >
              ▸ {pick(lang, CONTINUE)}
            </div>
            <div
              className="font-mono"
              style={{ fontSize: 12, color: "#8a93bd", margin: "14px 0 20px" }}
            >
              {pick(lang, OUTRO)}
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                justifyContent: "center",
              }}
            >
              <Link href={`mailto:${profile.email}`} label="EMAIL" value={profile.email} primary />
              <Link href={profile.github} label="GITHUB" value="ZackAlatrash" />
              <Link href={profile.linkedin} label="LINKEDIN" value="ziad-alatrash" />
              {hasResume && <Link href={RESUME_URL} label="RESUME" value="PDF" download />}
            </div>

            <div
              className="font-mono"
              style={{ fontSize: 10.5, color: "#68719c", marginTop: 20, lineHeight: 1.7 }}
            >
              {profile.seeking}
              <br />
              {profile.status} · references available on request
            </div>
          </div>

          <div
            className="font-mono"
            style={{ fontSize: 10, color: "#565f89", letterSpacing: 1, paddingBottom: 8 }}
          >
            © 2026 ZACK ALATRASH · {profile.location.toUpperCase()}
          </div>
        </div>
      </div>
    </section>
  );
}

function Link({
  href,
  label,
  value,
  primary,
  download,
}: {
  href: string;
  label: string;
  value: string;
  primary?: boolean;
  download?: boolean;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("mailto:") ? undefined : "_blank"}
      rel={href.startsWith("mailto:") ? undefined : "noreferrer noopener"}
      download={download ? "" : undefined}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 5,
        padding: "10px 15px",
        borderRadius: 8,
        textDecoration: "none",
        background: primary ? "rgba(122,162,247,0.16)" : "rgba(16,24,46,0.75)",
        border: `1px solid ${primary ? "rgba(122,162,247,0.6)" : "rgba(122,162,247,0.25)"}`,
      }}
    >
      <span style={{ fontFamily: PIXEL, fontSize: 7.5, color: "#8fb6ff", letterSpacing: 1 }}>
        {label}
      </span>
      <span className="font-mono" style={{ fontSize: 11.5, color: "#e2e6f5" }}>
        {value}
      </span>
    </a>
  );
}
