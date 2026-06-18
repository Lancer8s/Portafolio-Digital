import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

/**
 * Página 404 — recurso no encontrado.
 * Incluye animaciones, sugerencias de rutas, contador regresivo
 * y redirección automática al inicio.
 */
export default function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();

  const [countdown, setCountdown] = useState(15);
  const [hoveredRoute, setHoveredRoute] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [particles, setParticles] = useState([]);

  const bg     = isDark ? "#020617" : "#D9D9D9";
  const card   = isDark ? "#0F172A" : "#fff";
  const text   = isDark ? "#fff"    : "#111";
  const sub    = isDark ? "#94a3b8" : "#807F81";
  const border = isDark ? "#1D283A" : "#E2E8F0";
  const boxBg  = isDark ? "#1D283A" : "#F8FAFC";

  // Rutas sugeridas según la URL actual
  const SUGGESTED_ROUTES = [
    {
      path: "/",
      label: "Inicio",
      description: "Página principal de la plataforma",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
    {
      path: "/vista",
      label: "Mi Portafolio",
      description: "Ver y editar tu portafolio profesional",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      ),
    },
    {
      path: "/edicion",
      label: "Editar Perfil",
      description: "Actualizar tus datos y habilidades",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
    {
      path: "/login",
      label: "Iniciar Sesión",
      description: "Acceder a tu cuenta",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
          <polyline points="10 17 15 12 10 7"/>
          <line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
      ),
    },
  ];

  // Genera partículas flotantes decorativas al montar el componente
  useEffect(() => {
    const generated = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 3,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 2,
      opacity: Math.random() * 0.4 + 0.1,
    }));
    setParticles(generated);
  }, []);

  // Countdown regresivo — redirige al inicio automáticamente
  useEffect(() => {
    if (countdown <= 0) {
      navigate("/");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  // Determina si la ruta intentada se parece a alguna sugerida
  const getSimilarRoute = () => {
    const attempted = location.pathname.toLowerCase();
    if (attempted.includes("perfil") || attempted.includes("profile")) return "/edicion";
    if (attempted.includes("proyecto") || attempted.includes("project")) return "/edicion";
    if (attempted.includes("login") || attempted.includes("auth")) return "/login";
    if (attempted.includes("admin")) return "/";
    return null;
  };

  const similarRoute = getSimilarRoute();
  const progressPercent = ((15 - countdown) / 15) * 100;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Partículas flotantes de fondo */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          animate={{
            y: [0, -20, 0],
            opacity: [p.opacity, p.opacity * 1.5, p.opacity],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: "#3B82F6",
            opacity: p.opacity,
            pointerEvents: "none",
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          background: card,
          border: `1px solid ${border}`,
          borderRadius: 24,
          padding: "48px 40px",
          maxWidth: 560,
          width: "100%",
          textAlign: "center",
          boxShadow: isDark
            ? "0 25px 60px rgba(0,0,0,0.5)"
            : "0 25px 60px rgba(0,0,0,0.08)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Ícono animado */}
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 1.2, delay: 0.4, repeat: Infinity, repeatDelay: 4 }}
          style={{ fontSize: 64, marginBottom: 8, lineHeight: 1 }}
        >
          🔍
        </motion.div>

        {/* Código 404 con gradiente */}
        <motion.h1
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{
            fontSize: 96,
            fontWeight: 900,
            margin: "0 0 4px",
            background: "linear-gradient(135deg, #3B82F6, #6366f1)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            lineHeight: 1,
            letterSpacing: "-4px",
          }}
        >
          404
        </motion.h1>

        <h2 style={{ color: text, fontSize: 22, fontWeight: 700, margin: "12px 0 8px" }}>
          Página no encontrada
        </h2>

        <p style={{ color: sub, fontSize: 14, lineHeight: 1.65, margin: "0 0 8px" }}>
          La ruta{" "}
          <code
            style={{
              background: boxBg,
              border: `1px solid ${border}`,
              borderRadius: 6,
              padding: "2px 8px",
              fontSize: 13,
              color: "#3B82F6",
              fontFamily: "monospace",
            }}
          >
            {location.pathname}
          </code>{" "}
          no existe en este sistema.
        </p>

        {/* Sugerencia inteligente de ruta */}
        <AnimatePresence>
          {similarRoute && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                background: isDark ? "rgba(59,130,246,0.1)" : "#EFF6FF",
                border: `1px solid rgba(59,130,246,0.3)`,
                borderRadius: 10,
                padding: "10px 16px",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 10,
                textAlign: "left",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span style={{ color: sub, fontSize: 13 }}>
                ¿Querías ir a{" "}
                <button
                  onClick={() => navigate(similarRoute)}
                  style={{ background: "none", border: "none", color: "#3B82F6", fontWeight: 700, cursor: "pointer", fontSize: 13, padding: 0 }}
                >
                  {similarRoute}
                </button>
                ?
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Countdown con barra de progreso */}
        <div
          style={{
            background: boxBg,
            border: `1px solid ${border}`,
            borderRadius: 12,
            padding: "14px 18px",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ color: sub, fontSize: 12, fontWeight: 600 }}>
              Redirigiendo al inicio en...
            </span>
            <span style={{ color: "#3B82F6", fontSize: 18, fontWeight: 800 }}>
              {countdown}s
            </span>
          </div>
          <div style={{ height: 6, background: border, borderRadius: 99, overflow: "hidden" }}>
            <motion.div
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.9, ease: "linear" }}
              style={{ height: "100%", background: "linear-gradient(90deg, #3B82F6, #6366f1)", borderRadius: 99 }}
            />
          </div>
          <button
            onClick={() => setCountdown(999)}
            style={{ background: "none", border: "none", color: sub, fontSize: 11, cursor: "pointer", marginTop: 6, padding: 0 }}
          >
            Cancelar redirección
          </button>
        </div>

        {/* Botones principales */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(-1)}
            style={{
              background: "none",
              border: `1px solid ${border}`,
              color: text,
              borderRadius: 10,
              padding: "11px 24px",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Volver atrás
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/")}
            style={{
              background: "#3B82F6",
              border: "none",
              color: "#fff",
              borderRadius: 10,
              padding: "11px 24px",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 14px rgba(59,130,246,0.35)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Ir al inicio
          </motion.button>
        </div>

        {/* Rutas sugeridas */}
        <div style={{ textAlign: "left" }}>
          <p style={{ color: sub, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
            O navegá a:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {SUGGESTED_ROUTES.map((route) => (
              <motion.button
                key={route.path}
                whileHover={{ x: 4 }}
                onClick={() => navigate(route.path)}
                onMouseEnter={() => setHoveredRoute(route.path)}
                onMouseLeave={() => setHoveredRoute(null)}
                style={{
                  background: hoveredRoute === route.path ? (isDark ? "rgba(59,130,246,0.08)" : "#EFF6FF") : boxBg,
                  border: `1px solid ${hoveredRoute === route.path ? "rgba(59,130,246,0.3)" : border}`,
                  borderRadius: 10,
                  padding: "12px 16px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  width: "100%",
                }}
              >
                <span style={{ color: "#3B82F6", flexShrink: 0 }}>{route.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: text, fontSize: 13, fontWeight: 700 }}>{route.label}</div>
                  <div style={{ color: sub, fontSize: 11, marginTop: 1 }}>{route.description}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={sub} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Detalles técnicos colapsables */}
        <div style={{ marginTop: 24, borderTop: `1px solid ${border}`, paddingTop: 16 }}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              background: "none",
              border: "none",
              color: sub,
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              margin: "0 auto",
              padding: 0,
            }}
          >
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: showDetails ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
            {showDetails ? "Ocultar" : "Ver"} detalles técnicos
          </button>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: "hidden" }}
              >
                <div
                  style={{
                    background: boxBg,
                    border: `1px solid ${border}`,
                    borderRadius: 10,
                    padding: "12px 16px",
                    marginTop: 12,
                    textAlign: "left",
                    fontFamily: "monospace",
                    fontSize: 12,
                  }}
                >
                  <div style={{ color: "#ef4444", marginBottom: 4 }}>HTTP 404 — Not Found</div>
                  <div style={{ color: sub }}>Ruta: <span style={{ color: "#3B82F6" }}>{location.pathname}</span></div>
                  <div style={{ color: sub }}>Timestamp: <span style={{ color: text }}>{new Date().toISOString()}</span></div>
                  <div style={{ color: sub }}>App: <span style={{ color: text }}>Portafolio Digital v1.0</span></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}