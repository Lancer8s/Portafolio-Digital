/**
 * VerificationBadge — Ícono de verificación tipo Twitter/Instagram
 *
 * Estados:
 *   null / undefined  → Sin verificar (sin badge visible, o con icono gris)
 *   "Pendiente de revisión" → Reloj/pending (amarillo)
 *   "Verificado"            → Check verificado (azul)
 */

// TODO: Agregar estado visual para "Rechazado" (ícono rojo con X)
// para que el usuario sepa que debe reenviar su documento.
export default function VerificationBadge({ ciEstado, size = 18, showUnverified = false }) {
  // Sin estado → no mostrar nada (a menos que showUnverified sea true)
  if (!ciEstado && !showUnverified) return null;

  const s = size;

  // Estado: Verificado — ícono azul con check (estilo Twitter)
  if (ciEstado === "Verificado") {
    return (
      <span
        title="Identidad verificada"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "default",
          verticalAlign: "middle",
          flexShrink: 0,
        }}
      >
        <svg
          width={s}
          height={s}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background circle with checkmark - Twitter style */}
          <path
            d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81C14.67 2.88 13.43 2 12 2s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.88 9.33 2 10.57 2 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81C9.33 21.12 10.57 22 12 22s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91C21.12 14.67 22 13.43 22 12z"
            fill="#3B82F6"
          />
          <path
            d="M9 12l2 2 4-4"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  // Estado: Pendiente de revisión — ícono amarillo con reloj
  if (ciEstado === "Pendiente de revisión") {
    return (
      <span
        title="Verificación en proceso"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "default",
          verticalAlign: "middle",
          flexShrink: 0,
        }}
      >
        <svg
          width={s}
          height={s}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background circle with clock - Pending */}
          <path
            d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81C14.67 2.88 13.43 2 12 2s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.88 9.33 2 10.57 2 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81C9.33 21.12 10.57 22 12 22s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91C21.12 14.67 22 13.43 22 12z"
            fill="#eab308"
          />
          {/* Clock icon */}
          <circle cx="12" cy="12" r="5" stroke="#fff" strokeWidth="1.8" fill="none" />
          <line x1="12" y1="10" x2="12" y2="12.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="12" y1="12.5" x2="13.8" y2="13.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
    );
  }

  // Estado: Sin verificar — ícono gris (solo si showUnverified es true)
  if (showUnverified) {
    return (
      <span
        title="Identidad no verificada"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "default",
          verticalAlign: "middle",
          flexShrink: 0,
          opacity: 0.5,
        }}
      >
        <svg
          width={s}
          height={s}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81C14.67 2.88 13.43 2 12 2s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.88 9.33 2 10.57 2 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81C9.33 21.12 10.57 22 12 22s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91C21.12 14.67 22 13.43 22 12z"
            fill="#94a3b8"
          />
          <path
            d="M9 12l2 2 4-4"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  return null;
}
