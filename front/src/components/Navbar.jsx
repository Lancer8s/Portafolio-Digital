import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import iconoSol from "../assets/iconoSol.png";
import iconoLuna from "../assets/iconoLuna.png";

const HIDDEN_ON = ["/", "/registro", "/login", "/auth/callback"];

const LABELS = {
  "/vista": "Mi Portafolio",
  "/habilidad": "Habilidades",
  "/proyecto": "Proyectos",
  "/edicion": "Editar Perfil",
};

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const { userData, isAuthenticated, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  if (HIDDEN_ON.includes(location.pathname)) return null;

  const bg = isDark ? "#0F172A" : "#fff";
  const border = isDark ? "#1D283A" : "#E2E8F0";
  const text = isDark ? "#fff" : "#111";
  const sub = isDark ? "#94a3b8" : "#807F81";

  const initials =
    `${(userData?.nombreCompleto || "")[0] || ""}${
      (userData?.apellidoCompleto || "")[0] || ""
    }`.toUpperCase() || "PG";

  const label = LABELS[location.pathname] || "";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 200,
        background: bg,
        borderBottom: `1px solid ${border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 24px",
        boxShadow: isDark ? "none" : "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      <button
        onClick={() => navigate("/")}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 800,
            fontSize: 13,
          }}
        >
          P
        </div>
        <span style={{ color: text, fontWeight: 700, fontSize: 15 }}>
          PortaGen
        </span>
      </button>

      <span style={{ color: sub, fontSize: 13 }}>{label}</span>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {userData?.preview || userData?.foto_url ? (
          <img
            src={userData.preview || userData.foto_url}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              objectFit: "cover",
            }}
            alt=""
          />
        ) : (
          <div
            style={{
              width: 32,
              height: 32,
              background: "#3B82F6",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            {initials}
          </div>
        )}

        <button
          onClick={toggleTheme}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <img
            src={isDark ? iconoSol : iconoLuna}
            alt="tema"
            style={{ width: 26, height: 26 }}
          />
        </button>

        {isAuthenticated && (
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            style={{
              background: "none",
              border: `1px solid ${border}`,
              borderRadius: 6,
              padding: "5px 12px",
              cursor: "pointer",
              color: "#ef4444",
              fontSize: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
              transition: "all 0.15s",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Salir
          </button>
        )}
      </div>
    </motion.nav>
  );
}