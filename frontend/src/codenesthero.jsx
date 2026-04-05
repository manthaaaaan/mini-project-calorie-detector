/**
 * CodeNestHero.jsx
 * Drop this file into your src/ folder and import it wherever needed.
 * It is fully self-contained and does NOT touch or affect App.jsx / CalorieAI.
 *
 * Dependencies to install:
 *   npm install hls.js lucide-react
 *
 * Fonts (add to your index.html <head>):
 *   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@700;800&family=Instrument+Serif:ital@1&display=swap" rel="stylesheet" />
 */

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { ArrowRight, Menu, X } from "lucide-react";

/* ─────────────────────────────────────────────
   Inline styles (avoids Tailwind config changes)
   ───────────────────────────────────────────── */
const S = {
  section: {
    position: "relative",
    width: "100%",
    height: "100vh",
    overflow: "hidden",
    background: "#070b0a",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Inter', sans-serif",
  },
  video: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    opacity: 0.6,
    zIndex: 0,
  },
  overlayLeft: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to right, #070b0a 0%, transparent 55%)",
    zIndex: 1,
  },
  overlayBottom: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to top, #070b0a 0%, transparent 40%)",
    zIndex: 1,
  },
  centerGlow: {
    position: "absolute",
    top: -40,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 2,
    pointerEvents: "none",
  },
  nav: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "28px 48px",
  },
  logo: {
    fontFamily: "'Inter', sans-serif",
    fontWeight: 800,
    fontSize: 20,
    color: "#fff",
    letterSpacing: "-0.5px",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  logoDot: {
    display: "inline-block",
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#5ed29c",
  },
  navLinks: {
    display: "flex",
    gap: 36,
    listStyle: "none",
  },
  navLinkA: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: "0.08em",
    color: "rgba(255,255,255,0.75)",
    textDecoration: "none",
    textTransform: "uppercase",
    transition: "color 0.2s",
    cursor: "pointer",
  },
  hamburger: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#fff",
    padding: 4,
    display: "none", // shown via responsive logic
  },
  content: {
    position: "relative",
    zIndex: 5,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    height: "100%",
    padding: "0 48px 80px",
    maxWidth: 860,
  },
  glassWrap: {
    transform: "translateY(-50px)",
    marginBottom: -10,
  },
  glassCard: {
    width: 200,
    height: 200,
    borderRadius: 18,
    background: "rgba(255,255,255,0.01)",
    backgroundBlendMode: "luminosity",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.1)",
    position: "relative",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 8,
    overflow: "hidden",
  },
  eyebrow: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    color: "#5ed29c",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  headline: {
    fontFamily: "'Inter', sans-serif",
    fontWeight: 800,
    lineHeight: 1.0,
    letterSpacing: "-0.025em",
    textTransform: "uppercase",
    color: "#fff",
    marginBottom: 20,
  },
  desc: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 1.7,
    maxWidth: 512,
    marginBottom: 32,
  },
  cta: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    background: "#5ed29c",
    color: "#070b0a",
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    border: "none",
    borderRadius: 9999,
    padding: "14px 28px",
    cursor: "pointer",
    transition: "opacity 0.2s, transform 0.2s",
  },
  mobileMenu: (open) => ({
    position: "fixed",
    inset: 0,
    background: "rgba(7,11,10,0.97)",
    zIndex: 50,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
    transform: open ? "translateX(0)" : "translateX(100%)",
    transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
  }),
};

/* Keyframes injected once */
const KEYFRAMES = `
@keyframes cnFadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
.cn-fu-1 { animation: cnFadeUp 0.7s ease both 0.1s; }
.cn-fu-2 { animation: cnFadeUp 0.7s ease both 0.25s; }
.cn-fu-3 { animation: cnFadeUp 0.7s ease both 0.4s; }
.cn-fu-4 { animation: cnFadeUp 0.7s ease both 0.55s; }
.cn-fu-5 { animation: cnFadeUp 0.7s ease both 0.7s; }
.cn-glass-before::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 18px;
  padding: 1.4px;
  background: linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
@media (max-width: 767px) {
  .cn-nav-links  { display: none !important; }
  .cn-hamburger  { display: flex !important; }
  .cn-content    { padding: 0 24px 80px !important; }
  .cn-nav        { padding: 20px 24px !important; }
  .cn-headline   { font-size: 38px !important; }
}
@media (min-width: 768px) {
  .cn-grid-lines { display: block !important; }
  .cn-hamburger  { display: none !important; }
}
`;

const HLS_SRC =
  "https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8";

export default function CodeNestHero() {
  const videoRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  /* Inject keyframes once */
  useEffect(() => {
    if (document.getElementById("cn-styles")) return;
    const style = document.createElement("style");
    style.id = "cn-styles";
    style.textContent = KEYFRAMES;
    document.head.appendChild(style);
  }, []);

  /* HLS video */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: false });
      hls.loadSource(HLS_SRC);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      return () => hls.destroy();
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = HLS_SRC;
      video.addEventListener("loadedmetadata", () =>
        video.play().catch(() => {})
      );
    }
  }, []);

  const headlineSize = "clamp(36px, 6vw, 72px)";

  return (
    <section style={S.section} id="codenest-hero">
      {/* ── Video ── */}
      <video ref={videoRef} style={S.video} autoPlay muted loop playsInline />

      {/* ── Overlays ── */}
      <div style={S.overlayLeft} />
      <div style={S.overlayBottom} />

      {/* ── Grid lines (desktop) ── */}
      <div
        className="cn-grid-lines"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          display: "none",
        }}
      >
        {[25, 50, 75].map((pct) => (
          <div
            key={pct}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${pct}%`,
              width: 1,
              background: "rgba(255,255,255,0.10)",
            }}
          />
        ))}
      </div>

      {/* ── Center Glow ── */}
      <div style={S.centerGlow}>
        <svg
          width="700"
          height="120"
          viewBox="0 0 700 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="cn-glow-blur">
              <feGaussianBlur stdDeviation="25" />
            </filter>
            <linearGradient id="cn-glow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00b882" />
              <stop offset="50%" stopColor="#2ce4d4" />
              <stop offset="100%" stopColor="#00b882" />
            </linearGradient>
          </defs>
          <ellipse
            cx="350"
            cy="50"
            rx="320"
            ry="40"
            fill="url(#cn-glow-grad)"
            filter="url(#cn-glow-blur)"
            opacity="0.55"
          />
        </svg>
      </div>

      {/* ── Nav ── */}
      <nav className="cn-nav" style={{ ...S.nav, zIndex: 10 }}>
        <a href="#" style={S.logo}>
          CodeNest <span style={S.logoDot} />
        </a>

        <ul className="cn-nav-links" style={S.navLinks}>
          {["Projects", "Blog", "About", "Resume"].map((label) => (
            <li key={label}>
              <a
                href="#"
                style={S.navLinkA}
                onMouseEnter={(e) => (e.target.style.color = "#5ed29c")}
                onMouseLeave={(e) =>
                  (e.target.style.color = "rgba(255,255,255,0.75)")
                }
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        <button
          className="cn-hamburger"
          style={{ ...S.hamburger, alignItems: "center" }}
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
        >
          <Menu size={24} color="#fff" />
        </button>
      </nav>

      {/* ── Mobile Menu ── */}
      <div style={S.mobileMenu(menuOpen)}>
        <button
          style={{
            position: "absolute",
            top: 28,
            right: 24,
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        >
          <X size={28} color="#fff" />
        </button>
        {["Projects", "Blog", "About", "Resume"].map((label) => (
          <a
            key={label}
            href="#"
            onClick={() => setMenuOpen(false)}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 28,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.8)",
              textDecoration: "none",
            }}
          >
            {label}
          </a>
        ))}
      </div>

      {/* ── Hero Content ── */}
      <div className="cn-content" style={S.content}>
        {/* Liquid Glass Card */}
        <div className="cn-fu-1" style={S.glassWrap}>
          <div
            className="cn-glass-before"
            style={S.glassCard}
          >
            <p
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 11,
                color: "#5ed29c",
                letterSpacing: "0.12em",
                fontWeight: 600,
                opacity: 0.8,
              }}
            >
              [ 2025 ]
            </p>
            <h3
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: "#fff",
                lineHeight: 1.35,
              }}
            >
              Taught by{" "}
              <em
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                Industry
              </em>
              <br />
              Professionals
            </h3>
            <p
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.55,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Real-world projects. Mentorship from engineers at top-tier tech
              companies.
            </p>
          </div>
        </div>

        {/* Eyebrow */}
        <p className="cn-fu-2" style={S.eyebrow}>
          Career-Ready Curriculum
        </p>

        {/* Headline */}
        <h1
          className="cn-fu-3 cn-headline"
          style={{ ...S.headline, fontSize: headlineSize }}
        >
          Launch Your
          <br />
          Coding Career
          <span style={{ color: "#5ed29c" }}>.</span>
        </h1>

        {/* Description */}
        <p className="cn-fu-4" style={S.desc}>
          Master in-demand coding skills through project-based learning, guided
          mentorship, and a curriculum built around what employers actually hire
          for.
        </p>

        {/* CTA */}
        <button
          className="cn-fu-5"
          style={S.cta}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.88";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Get Started
          <ArrowRight size={16} strokeWidth={2.5} color="#070b0a" />
        </button>
      </div>
    </section>
  );
}