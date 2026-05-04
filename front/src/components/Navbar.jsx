import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { perfilAPI } from "../api";
import iconoSol from "../assets/iconoSol.png";
import iconoLuna from "../assets/iconoLuna.png";
import DefaultAvatar from "./DefaultAvatar";

const HIDDEN_ON = ["/", "/registro", "/login", "/auth/callback"];

const LABELS = {
  "/vista": "Mi Portafolio",
  "/habilidad": "Habilidades",
  "/proyecto": "Proyectos",
  "/edicion": "Editar Perfil",
};

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const { userData, isAuthenticated, logout, setUserData } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

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

      <span style={{ color: sub, fontSize: 13, display: "none" }}>{label}</span>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {isAuthenticated && userData?.id_usuario && (
          <button
            onClick={() => window.open(`/portafolio/${userData.id_usuario}`, "_blank")}
            style={{
              background: "#3B82F6",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            Compartir
          </button>
        )}
      
        <div style={{ position: "relative" }}>
          <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
          }}
        >
          {userData?.preview || userData?.foto_url ? (
            <img
              src={userData.preview || userData.foto_url}
              style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", border: `2px solid ${border}` }}
              alt=""
            />
          ) : (
            <DefaultAvatar size={34} style={{ border: `2px solid ${border}` }} />
          )}
        </button>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "absolute",
                top: 48,
                right: 0,
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: 12,
                padding: "8px 0",
                minWidth: 200,
                boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.5)" : "0 4px 20px rgba(0,0,0,0.08)",
                zIndex: 300,
              }}
            >
              <div style={{ padding: "8px 16px", borderBottom: `1px solid ${border}`, marginBottom: 8 }}>
                <p style={{ margin: 0, color: text, fontWeight: 700, fontSize: 14 }}>{userData?.nombreCompleto}</p>
                <p style={{ margin: 0, color: sub, fontSize: 12 }}>{userData?.email || "Usuario"}</p>
              </div>

              <button
                onClick={() => { setShowMenu(false); setShowConfig(true); }}
                style={{ width: "100%", textAlign: "left", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", color: text, fontSize: 14, display: "flex", alignItems: "center", gap: 10 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> Ajustes del Portafolio
              </button>
              
              <button
                onClick={() => { toggleTheme(); setShowMenu(false); }}
                style={{ width: "100%", textAlign: "left", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", color: text, fontSize: 14, display: "flex", alignItems: "center", gap: 10 }}
              >
                <img src={isDark ? iconoSol : iconoLuna} alt="tema" style={{ width: 16, height: 16 }} />
                Cambiar a Tema {isDark ? "Claro" : "Oscuro"}
              </button>

              {isAuthenticated && (
                <button
                  onClick={() => { setShowMenu(false); handleLogout(); }}
                  style={{ width: "100%", textAlign: "left", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 14, display: "flex", alignItems: "center", gap: 10, borderTop: `1px solid ${border}`, marginTop: 8 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Cerrar sesión
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
      <AnimatePresence>
        {showConfig && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} 
            onClick={() => setShowConfig(false)}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} 
              style={{ background: bg, padding: 24, borderRadius: 16, width: "100%", maxWidth: 400, border: `1px solid ${border}`, boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }} 
              onClick={(e) => e.stopPropagation()}>
              <h3 style={{ color: text, fontWeight: 700, marginBottom: 18, marginTop: 0 }}>Ajustes del Portafolio</h3>
              
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", color: sub, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Visibilidad</label>
                <select
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${border}`, background: isDark ? "#1D283A" : "#F8FAFC", color: text, fontSize: 15, outline: "none", appearance: "auto" }}
                  value={userData?.visibilidad || "publico"}
                  onChange={async (e) => {
                    const val = e.target.value;
                    setUserData({ visibilidad: val });
                    await perfilAPI.actualizar({
                      nombre: userData.nombreCompleto,
                      apellido: userData.apellidoCompleto,
                      visibilidad: val
                    });
                  }}
                >
                  <option value="publico">Público (Cualquiera puede verlo)</option>
                  <option value="privado">Privado (Solo tú puedes verlo)</option>
                </select>
                <p style={{ color: sub, fontSize: 12, marginTop: 6 }}>
                  Si es privado, tu portafolio no será visible para personas sin sesión iniciada.
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => setShowConfig(false)} style={{ background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 24px", cursor: "pointer", fontWeight: 700 }}>
                  Hecho
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}