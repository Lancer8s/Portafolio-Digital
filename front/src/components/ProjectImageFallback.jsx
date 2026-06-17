import React from "react";

export default function ProjectImageFallback({ title, height = "100%" }) {
  // Curated, premium gradient palettes
  const gradients = [
    "linear-gradient(135deg, #1e1b4b 0%, #311042 100%)", // Deep Indigo/Purple
    "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", // Slate/Charcoal
    "linear-gradient(135deg, #022c22 0%, #064e3b 100%)", // Forest Green/Teal
    "linear-gradient(135deg, #172554 0%, #1e1b4b 100%)", // Navy/Midnight Blue
  ];

  // Hash title to get a deterministic gradient index
  const hash = title
    ? title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    : 0;
  const gradient = gradients[hash % gradients.length];

  return (
    <div
      style={{
        width: "100%",
        height: height,
        background: gradient,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        color: "#fff",
      }}
    >
      {/* Subtle Grid Pattern Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.08,
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "16px 16px",
          pointerEvents: "none",
        }}
      />

      {/* Sleek Floating Code Brackets Icon */}
      <svg
        width="44"
        height="44"
        viewBox="0 0 24 24"
        fill="none"
        stroke="url(#fallback-icon-grad)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter: "drop-shadow(0 4px 12px rgba(99, 102, 241, 0.45))",
          marginBottom: 8,
          position: "relative",
          zIndex: 2,
        }}
      >
        <defs>
          <linearGradient id="fallback-icon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="50%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#F472B6" />
          </linearGradient>
        </defs>
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>

      {/* Styled Project Label */}
      <span
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          opacity: 0.65,
          position: "relative",
          zIndex: 2,
          fontFamily: "'Segoe UI', Roboto, sans-serif",
        }}
      >
        PROYECTO
      </span>
    </div>
  );
}
