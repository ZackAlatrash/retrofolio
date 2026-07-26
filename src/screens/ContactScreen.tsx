import { useEffect, useRef, useState } from "react";
import { profile } from "../content/profile";
import { useReducedMotion } from "../motion/useReducedMotion";
import { useSettings, pick, type Lang } from "../game/settings";
import { skyUrl } from "../showcase/showcaseData";

/**
 * The final screen - CREDITS (Contact). The end of the game: the credits roll
 * up over the same night sky the constellation ends on, and settle on the
 * contact card with INSERT COIN TO CONTINUE.
 *
 * The roll doubles as the fact sheet a recruiter actually needs (role sought,
 * availability, permit, languages, education, location), so it informs rather
 * than just decorating. Every destination is real and comes from the content
 * model; nothing here is invented.
 */

const PIXEL = '"Press Start 2P", ui-monospace, monospace';
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

const HEADING = { en: "CREDITS", nl: "AFTITELING" };
/**
 * The screen label, in the same shape as every other stage marker: the stage
 * line, then a dim line saying what the screen is for. It used to read
 * "// THE END · GET IN TOUCH", which broke the numbering the other screens
 * follow, left the plate built for two lines two thirds empty, and repeated
 * the call to action that the credits themselves already make.
 */
const STAGE = { en: "// STAGE 04 · CREDITS", nl: "// STAGE 04 · AFTITELING" };
const STAGE_SUB = {
  en: "the run is over · here is how to reach me",
  nl: "de run is voorbij · zo kun je me bereiken",
};
const CONTINUE = { en: "INSERT COIN TO CONTINUE", nl: "GOOI EEN MUNT ERIN" };
const OUTRO = {
  en: "thanks for playing · now let's build something",
  nl: "bedankt voor het spelen · nu iets moois bouwen",
};
const REACH = { en: "HOW TO REACH ME", nl: "ZO BEREIK JE MIJ" };
const RESUME_LABEL = { en: "DOWNLOAD CV", nl: "CV DOWNLOADEN" };
const COPY = { en: "COPY", nl: "KOPIEER" };
const COPIED = { en: "COPIED", nl: "GEKOPIEERD" };

/** The roll: the facts a recruiter is actually looking for, in plain terms. */
const ROLES: {
  label: { en: string; nl: string };
  value: { en: string; nl: string };
}[] = [
  {
    label: { en: "PLAYER 1", nl: "SPELER 1" },
    value: {
      en: "Zack Alatrash · AI/LLM systems engineer",
      nl: "Zack Alatrash · AI/LLM systems engineer",
    },
  },
  {
    label: { en: "LOOKING FOR", nl: "OP ZOEK NAAR" },
    value: {
      en: "A part-time junior software developer role, alongside my studies",
      nl: "Een parttime junior softwareontwikkelaar-rol, naast mijn studie",
    },
  },
  {
    label: { en: "AVAILABLE FROM", nl: "BESCHIKBAAR VANAF" },
    value: { en: "Summer 2026", nl: "Zomer 2026" },
  },
  {
    label: { en: "BASED IN", nl: "GEVESTIGD IN" },
    value: {
      en: "Haarlem, Netherlands · open to Amsterdam and remote",
      nl: "Haarlem, Nederland · open voor Amsterdam en remote",
    },
  },
  {
    label: { en: "WORK PERMIT", nl: "WERKVERGUNNING" },
    value: {
      en: "Valid Dutch residence and work permit",
      nl: "Geldige Nederlandse verblijfs- en werkvergunning",
    },
  },
  {
    label: { en: "LANGUAGES", nl: "TALEN" },
    value: {
      en: "Arabic (native) · English (C1) · Dutch (B1, improving)",
      nl: "Arabisch (moedertaal) · Engels (C1) · Nederlands (B1, groeiend)",
    },
  },
  {
    label: { en: "STUDYING", nl: "STUDIE" },
    value: {
      en: "BSc Information Technology, Inholland · 4th year, graduating 2027",
      nl: "BSc Informatica, Inholland · 4e jaar, afstuderen in 2027",
    },
  },
  {
    label: { en: "MOST RECENTLY", nl: "MEEST RECENT" },
    value: {
      en: "Backend intern at Impala Studios · graded 9/10",
      nl: "Backend-stagiair bij Impala Studios · beoordeeld met een 9",
    },
  },
  {
    label: { en: "BUILT WITH", nl: "GEBOUWD MET" },
    value: {
      en: "React 18 · TypeScript · Vite · a grounded RAG help bot",
      nl: "React 18 · TypeScript · Vite · een gefundeerde RAG-helpbot",
    },
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
  // Debug: ?cp=<0..1> forces the roll's progress (renders at scroll 0).
  const forced =
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("cp");

  // Measure the roll so it starts below the fold and ends holding the card.
  useEffect(() => {
    if (reduced) return;
    const measure = () => {
      const h = rollRef.current?.offsetHeight ?? 0;
      const vh = window.innerHeight;
      // Ends with the stack's foot just inside the frame, so the contact card
      // lands held in view rather than rolling off the top.
      setShift({ from: vh * 0.92, travel: h + vh * 0.02 });
    };
    measure();
    const id = window.setTimeout(measure, 500); // after webfonts settle
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", measure);
    };
  }, [reduced, lang]);

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
  }, [reduced, forced]);

  const raw = forced != null ? clamp01(parseFloat(forced)) : p;
  // The roll finishes at 80%, so the contact card holds while you read it.
  const prog = clamp01(raw / 0.8);
  const y = reduced ? 0 : shift.from - prog * shift.travel;

  return (
    <section
      id="contact"
      ref={sectionRef}
      aria-label="Contact"
      style={{
        position: "relative",
        height: reduced ? "auto" : "300vh",
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
          backgroundImage: `linear-gradient(rgba(6,9,26,0.66), rgba(6,9,26,0.82)), url(${skyUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: reduced ? "84px 20px 64px" : undefined,
        }}
      >
        {/*
          What screen this is, held still while the credits roll past.

          A plate, not a band. This used to be a full-bleed gradient that began
          at 97% black with nothing fading into it, so it drew a hard line
          across the whole screen and then dissolved downward: one crisp edge,
          one soft one, which reads as a smudge rather than a designed element.
          It also landed 8px under the HUD bar, so the screen wore two dark
          slabs with a sliver of sky between them. Framed and frosted, it
          matches every other label on the site instead. The job the gradient
          was really doing, keeping the roll from clipping at the top edge,
          belongs to the roll and now lives there.
        */}
        {!reduced && (
          <div
            style={{
              position: "absolute",
              top: 82,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              zIndex: 3,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                textAlign: "center",
                padding: "9px 18px 10px",
                borderRadius: 9,
                border: "1px solid rgba(122,162,247,0.22)",
                background: "rgba(8,13,28,0.72)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
            >
              <div
                className="font-mono"
                style={{
                  fontSize: 10.5,
                  letterSpacing: 2,
                  color: "var(--term-green)",
                }}
              >
                {pick(lang, STAGE)}
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: 0.6,
                  color: "#9ba4ca",
                  marginTop: 4,
                }}
              >
                {pick(lang, STAGE_SUB)}
              </div>
            </div>
          </div>
        )}

        {/*
          The roll dissolves as it reaches the top of the frame rather than
          clipping on it. The mask lives on this wrapper, which stays put, and
          not on the roll itself, which moves: a mask travels with its element,
          so on the roll the fade would slide up the page with the credits.
        */}
        <div
          style={
            reduced
              ? undefined
              : {
                  position: "absolute",
                  inset: 0,
                  overflow: "hidden",
                  zIndex: 1,
                  // Held fully clear through the plate's band, then ramping in,
                  // so a line emerges from behind the header rather than
                  // appearing at its bottom edge looking struck through.
                  maskImage:
                    "linear-gradient(to bottom, transparent 0, transparent 112px, #000 208px)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent 0, transparent 112px, #000 208px)",
                }
          }
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
              gap: 40,
              padding: "0 20px",
              willChange: "transform",
            }}
          >
            <div
              style={{
                fontFamily: PIXEL,
                fontSize: "clamp(20px, 3.6vw, 34px)",
                color: "#f4f4fb",
                textShadow: "3px 3px 0 #4a2f9e",
                letterSpacing: 2,
              }}
            >
              {pick(lang, HEADING)}
            </div>

            {ROLES.map((r) => (
              <div
                key={r.label.en}
                style={{ textAlign: "center", maxWidth: 760 }}
              >
                <div
                  style={{
                    fontFamily: PIXEL,
                    fontSize: 11,
                    color: "#8fb6ff",
                    letterSpacing: 1.5,
                    marginBottom: 14,
                  }}
                >
                  {pick(lang, r.label)}
                </div>
                <div
                  className="font-mono"
                  style={{
                    fontSize: "clamp(16px, 1.9vw, 21px)",
                    color: "#eef1fa",
                    lineHeight: 1.55,
                  }}
                >
                  {pick(lang, r.value)}
                </div>
              </div>
            ))}

            {/* the last card: how to reach me */}
            <div
              style={{
                marginTop: 20,
                width: "min(680px, 100%)",
                border: "2px solid rgba(122,162,247,0.45)",
                borderRadius: 16,
                background: "rgba(10,16,34,0.9)",
                boxShadow:
                  "0 30px 80px rgba(0,0,0,0.6), 0 0 70px rgba(122,162,247,0.16)",
                padding: "32px 26px",
                textAlign: "center",
              }}
            >
              <div
                className="press-blink"
                style={{
                  fontFamily: PIXEL,
                  fontSize: "clamp(12px, 1.8vw, 16px)",
                  color: "#fff",
                  textShadow: "0 0 14px rgba(122,162,247,0.7)",
                }}
              >
                ▸ {pick(lang, CONTINUE)}
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: 14,
                  color: "#9aa3c8",
                  margin: "16px 0 26px",
                }}
              >
                {pick(lang, OUTRO)}
              </div>

              <div
                style={{
                  fontFamily: PIXEL,
                  fontSize: 9,
                  color: "#68719c",
                  letterSpacing: 1.5,
                  marginBottom: 14,
                }}
              >
                {pick(lang, REACH)}
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                  justifyContent: "center",
                }}
              >
                <EmailTile email={profile.email} lang={lang} />
                <Link
                  href={profile.github}
                  label="GITHUB"
                  value="ZackAlatrash"
                />
                <Link
                  href={profile.linkedin}
                  label="LINKEDIN"
                  value="ziad-alatrash"
                />
              </div>

              <a
                href={RESUME_URL}
                // so it lands in their downloads folder with his name on it
                download="Ziad_Alatrash_CV.pdf"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 18,
                  padding: "13px 22px",
                  borderRadius: 9,
                  textDecoration: "none",
                  fontFamily: PIXEL,
                  fontSize: 10,
                  letterSpacing: 1,
                  color: "#06091a",
                  background: "var(--term-green)",
                  boxShadow: "0 0 24px rgba(158,206,106,0.35)",
                }}
              >
                ⇩ {pick(lang, RESUME_LABEL)}
              </a>
            </div>

            <div
              className="font-mono"
              style={{
                fontSize: 11,
                color: "#565f89",
                letterSpacing: 1,
                paddingBottom: 8,
              }}
            >
              © 2026 ZACK ALATRASH · {profile.location.toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * The email tile: the address still opens a mail client, but plenty of people
 * have none configured, so it also carries a copy button. The button is a
 * sibling of the link rather than inside it (a button cannot nest in an
 * anchor), and it announces the result for screen readers.
 */
function EmailTile({ email, lang }: { email: string; lang: Lang }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(id);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
    } catch {
      // Clipboard API needs a secure context; fall back to a scratch textarea.
      const ta = document.createElement("textarea");
      ta.value = email;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
      } catch {
        /* leave the address on screen to copy by hand */
      }
      ta.remove();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        borderRadius: 9,
        background: "rgba(122,162,247,0.18)",
        border: "1px solid rgba(122,162,247,0.65)",
        overflow: "hidden",
      }}
    >
      <a
        href={`mailto:${email}`}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          padding: "12px 16px",
          textDecoration: "none",
        }}
      >
        <span
          style={{
            fontFamily: PIXEL,
            fontSize: 8,
            color: "#8fb6ff",
            letterSpacing: 1,
          }}
        >
          EMAIL
        </span>
        <span className="font-mono" style={{ fontSize: 13, color: "#eef1fa" }}>
          {email}
        </span>
      </a>
      <button
        type="button"
        onClick={copy}
        aria-label={`${pick(lang, COPY)} ${email}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 14px",
          cursor: "pointer",
          background: copied ? "rgba(158,206,106,0.22)" : "rgba(10,16,34,0.55)",
          border: "none",
          borderLeft: "1px solid rgba(122,162,247,0.4)",
          fontFamily: PIXEL,
          fontSize: 7.5,
          letterSpacing: 1,
          color: copied ? "var(--term-green)" : "#8fb6ff",
          transition: "background 0.2s ease, color 0.2s ease",
        }}
      >
        {copied ? `✓ ${pick(lang, COPIED)}` : `⧉ ${pick(lang, COPY)}`}
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? `${email} ${pick(lang, COPIED).toLowerCase()}` : ""}
      </span>
    </div>
  );
}

function Link({
  href,
  label,
  value,
  primary,
}: {
  href: string;
  label: string;
  value: string;
  primary?: boolean;
}) {
  const external = !href.startsWith("mailto:");
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer noopener" : undefined}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "12px 18px",
        borderRadius: 9,
        textDecoration: "none",
        background: primary ? "rgba(122,162,247,0.18)" : "rgba(16,24,46,0.78)",
        border: `1px solid ${primary ? "rgba(122,162,247,0.65)" : "rgba(122,162,247,0.28)"}`,
      }}
    >
      <span
        style={{
          fontFamily: PIXEL,
          fontSize: 8,
          color: "#8fb6ff",
          letterSpacing: 1,
        }}
      >
        {label}
      </span>
      <span className="font-mono" style={{ fontSize: 13, color: "#eef1fa" }}>
        {value}
      </span>
    </a>
  );
}
