import { profile } from "../content/profile";

interface LinkDef {
  label: string;
  href: string;
  hint: string;
}

function ContactLink({ label, href, hint }: LinkDef) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      className="contact-link"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "16px 18px",
        borderRadius: 12,
        textDecoration: "none",
        border: "1px solid color-mix(in srgb, var(--term-dim) 55%, transparent)",
        background: "color-mix(in srgb, var(--term-fg) 4%, var(--term-bg))",
        transition: "border-color 0.2s ease, transform 0.2s ease",
      }}
    >
      <span
        className="font-mono"
        style={{ fontSize: 13, color: "var(--term-accent)" }}
      >
        {label}
      </span>
      <span style={{ fontSize: 13, color: "var(--term-dim)" }}>{hint}</span>
    </a>
  );
}

/** Contact links (all real) plus a labelled resume-download button. */
export function Contact({ id = "contact" }: { id?: string }) {
  const links: LinkDef[] = [
    {
      label: "email",
      href: `mailto:${profile.email}`,
      hint: profile.email,
    },
    { label: "github", href: profile.github, hint: "github.com/ZackAlatrash" },
    {
      label: "linkedin",
      href: profile.linkedin,
      hint: "in/ziad-alatrash",
    },
  ];

  return (
    <section
      id={id}
      aria-label="Contact"
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "72px 24px 112px",
      }}
    >
      <div
        className="font-mono"
        style={{ fontSize: 12, color: "var(--term-dim)", marginBottom: 8 }}
      >
        <span style={{ color: "var(--term-green)" }}>{"// "}</span>
        contact
      </div>
      <h2
        style={{
          margin: "0 0 8px",
          fontSize: "clamp(24px, 4vw, 34px)",
          fontWeight: 600,
          color: "var(--term-fg)",
          letterSpacing: -0.4,
        }}
      >
        Let us build something grounded
      </h2>
      <p
        style={{
          margin: "0 0 32px",
          fontSize: 15,
          lineHeight: 1.6,
          color: "var(--term-dim)",
          maxWidth: 560,
        }}
      >
        {profile.seeking}. Based in {profile.location}.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {links.map((l) => (
          <ContactLink key={l.href} {...l} />
        ))}
      </div>

      <a
        href="#"
        download
        aria-label="Download resume (PDF)"
        className="resume-btn"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 20px",
          borderRadius: 10,
          textDecoration: "none",
          fontWeight: 500,
          fontSize: 14,
          color: "var(--term-bg)",
          background: "var(--term-green)",
          transition: "filter 0.2s ease, transform 0.2s ease",
        }}
      >
        <span className="font-mono" aria-hidden="true">
          ↓
        </span>
        Download resume
      </a>

      <style>{`
        .contact-link:hover, .contact-link:focus-visible {
          border-color: var(--term-accent);
          transform: translateY(-2px);
          outline: none;
        }
        .resume-btn:hover, .resume-btn:focus-visible {
          filter: brightness(1.08);
          transform: translateY(-2px);
          outline: none;
        }
      `}</style>
    </section>
  );
}
