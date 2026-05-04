/**
 * Default avatar silhouette — used when no profile photo is available.
 * Shows a clean person-shaped icon like phone contacts.
 */
export default function DefaultAvatar({ size = 40, style = {} }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
        ...style,
      }}
    >
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle cx="12" cy="8" r="4.5" fill="rgba(255,255,255,0.85)" />
        <path
          d="M4 21c0-4.418 3.582-8 8-8s8 3.582 8 8"
          fill="rgba(255,255,255,0.85)"
        />
      </svg>
    </div>
  );
}
