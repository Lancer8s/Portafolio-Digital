/**
 * Default avatar — modern silhouette with subtle gradient.
 * Used when no profile photo is uploaded.
 */
/**
 * Avatar por defecto con silueta moderna y gradiente azul.
 * Se muestra cuando el usuario no ha subido una foto de perfil.
 * @param {number} size - Tamaño en píxeles del avatar (ancho y alto)
 * @param {Object} style - Estilos adicionales para el contenedor
 */

export default function DefaultAvatar({ size = 40, style = {} }) {
  const s = size;
  return (
    <div
      style={{
        width: s,
        height: s,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
        boxShadow: "inset 0 2px 6px rgba(0,0,0,0.25)",
        ...style,
      }}
    >
      <svg width={s * 0.55} height={s * 0.55} viewBox="0 0 24 24" fill="none">
        {/* Head */}
        <circle cx="12" cy="9" r="4" fill="#ffffff" />
        {/* Shoulders */}
        <path
          d="M4.5 22c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5"
          fill="#ffffff"
        />
      </svg>
    </div>
  );
}
