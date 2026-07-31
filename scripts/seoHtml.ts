import { profile } from "../src/content/profile";
import { projects } from "../src/content/projects";

/**
 * Everything a crawler is given, derived from the same content model the screens
 * read.
 *
 * The app renders entirely on the client, so the served HTML is a bare
 * `<div id="root">`. Google will eventually run the JS, but LinkedIn's preview
 * bot, Bing and the answer engines mostly do not, and to them the page is blank:
 * no title card when the link is shared, nothing to quote when someone asks who
 * he is. So the head tags, the structured data and a plain-HTML summary are
 * generated here and injected at build time.
 *
 * Generated rather than hand-written for the reason the rest of the content
 * model exists: a second copy of the same facts is a second copy to forget. If a
 * number changes in `profile.ts`, it changes here.
 */

export const SITE_URL = "https://zackalatrash.com";

/** The name he goes by, which is the name anyone will actually search for. */
const DISPLAY_NAME = `${profile.goesBy} ${profile.name.split(" ").slice(-1)[0]}`;

const TITLE = `${DISPLAY_NAME} · AI/LLM systems engineer`;

/**
 * ~150 characters. The old one stopped at 83 and left half the snippet unused,
 * which is half a sentence of persuasion given away for nothing.
 */
const DESCRIPTION =
  `${DISPLAY_NAME} is an AI/LLM systems engineer in ${profile.location}, ` +
  "building grounded RAG systems and shipping them to production. " +
  "Available for junior developer roles from summer 2026.";

export const seoDescription = () => escape(DESCRIPTION);

const escape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Head tags: canonical, social cards, icons. */
export function seoHead(): string {
  const og = `${SITE_URL}/og.jpg`;
  return [
    `<link rel="canonical" href="${SITE_URL}/" />`,
    `<link rel="icon" href="/favicon.ico" sizes="any" />`,
    `<meta name="author" content="${escape(profile.name)}" />`,
    // Open Graph: this is what LinkedIn, WhatsApp and Slack read when the link
    // is pasted, which for a job hunt is most of the times it will be seen.
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:site_name" content="${escape(DISPLAY_NAME)}" />`,
    `<meta property="og:title" content="${escape(TITLE)}" />`,
    `<meta property="og:description" content="${escape(DESCRIPTION)}" />`,
    `<meta property="og:url" content="${SITE_URL}/" />`,
    `<meta property="og:image" content="${og}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${escape(`${DISPLAY_NAME}: grounded AI, shipped to production`)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escape(TITLE)}" />`,
    `<meta name="twitter:description" content="${escape(DESCRIPTION)}" />`,
    `<meta name="twitter:image" content="${og}" />`,
  ].join("\n    ");
}

/**
 * Person schema: how Google is told this page *is* someone, rather than
 * guessing. `sameAs` is what ties the name to the GitHub and LinkedIn profiles
 * that already rank for it.
 */
export function seoJsonLd(): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: DISPLAY_NAME,
      alternateName: profile.name,
      url: `${SITE_URL}/`,
      image: `${SITE_URL}/og.jpg`,
      jobTitle: "AI/LLM Systems Engineer",
      description: profile.positioning,
      email: `mailto:${profile.email}`,
      address: {
        "@type": "PostalAddress",
        addressLocality: profile.location.split(",")[0].trim(),
        addressCountry: "NL",
      },
      alumniOf: {
        "@type": "CollegeOrUniversity",
        name: "Hogeschool Inholland",
      },
      knowsLanguage: profile.languages.map((l) => l.split(" (")[0]),
      sameAs: [profile.github, profile.linkedin],
    },
  };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

/**
 * A plain-HTML summary, placed inside `#root`.
 *
 * React replaces it the moment it mounts, so nobody with JavaScript ever sees
 * it; it exists for the crawlers that never run any. It says the same things
 * the screens say, because it is built from the same source, so it is not
 * cloaking, just the content in a form a robot can read.
 */
export function seoBody(): string {
  const items = projects
    .map(
      (p) =>
        `<li><h3>${escape(p.name)}</h3><p>${escape(p.whatItIs)}</p></li>`,
    )
    .join("");
  return [
    `<article>`,
    `<h1>${escape(DISPLAY_NAME)}</h1>`,
    `<p><strong>${escape(profile.positioning)}</strong></p>`,
    `<p>${escape(profile.bio)}</p>`,
    `<h2>Details</h2>`,
    `<ul>`,
    `<li>Based in ${escape(profile.location)}</li>`,
    `<li>${escape(profile.education)}</li>`,
    `<li>${escape(profile.seeking)}</li>`,
    `<li>${escape(profile.status)}</li>`,
    `<li>Languages: ${escape(profile.languages.join(", "))}</li>`,
    `</ul>`,
    `<h2>Projects</h2>`,
    `<ul>${items}</ul>`,
    `<h2>Contact</h2>`,
    `<ul>`,
    `<li><a href="mailto:${escape(profile.email)}">${escape(profile.email)}</a></li>`,
    `<li><a href="${escape(profile.github)}">GitHub</a></li>`,
    `<li><a href="${escape(profile.linkedin)}">LinkedIn</a></li>`,
    `<li><a href="/resume.pdf">CV</a></li>`,
    `</ul>`,
    `</article>`,
  ].join("");
}
