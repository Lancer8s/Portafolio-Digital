import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { perfilAPI, proyectoAPI, adminAPI } from "../api";
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
  const [showShareModal, setShowShareModal] = useState(false);
  const [ciPendingCount, setCiPendingCount] = useState(0);

  const isAdmin = userData?.roles?.includes('administrador');

  useEffect(() => {
    if (isAdmin) {
      adminAPI.getPendingCI().then(r => { if (r.ok) setCiPendingCount(r.usuarios.length); }).catch(() => {});
    }
  }, [isAdmin, location.pathname]);

  if (HIDDEN_ON.includes(location.pathname)) return null;

  // Detectar si estamos en un portafolio público y si es del usuario actual
  const isOnPublicPortfolio = location.pathname.startsWith('/portafolio/');
  const isViewingOwnPortfolio = isOnPublicPortfolio && userData?.id_usuario && (() => {
    const slug = location.pathname.replace('/portafolio/', '');
    const slugId = slug.split('-').pop();
    return String(userData.id_usuario) === String(slugId);
  })();
  const isViewingOthersPortfolio = isOnPublicPortfolio && !isViewingOwnPortfolio;

  const bg = isDark ? "#0F172A" : "#fff";
  const border = isDark ? "#1D283A" : "#E2E8F0";
  const text = isDark ? "#fff" : "#111";
  const sub = isDark ? "#94a3b8" : "#807F81";

  const initials =
    `${(userData?.nombreCompleto || "")[0] || ""}${
      (userData?.apellidoCompleto || "")[0] || ""
    }`.toUpperCase() || "PG";

  const label = LABELS[location.pathname] || "";

  const buildPortfolioSlug = () => {
    const n = (userData?.nombreCompleto || "").trim().toLowerCase().replace(/\s+/g, "-");
    const a = (userData?.apellidoCompleto || "").trim().toLowerCase().replace(/\s+/g, "-");
    const namePart = [n, a].filter(Boolean).join("-");
    return namePart && userData?.id_usuario ? `${namePart}-${userData.id_usuario}` : userData?.id_usuario;
  };

  const buildPortfolioUrl = () => {
    const slug = buildPortfolioSlug();
    return slug ? `${window.location.origin}/portafolio/${slug}` : "";
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (isAdmin) {
    return (
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "sticky", top: 0, zIndex: 200, background: bg, borderBottom: `1px solid ${border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 24px",
          boxShadow: isDark ? "none" : "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <button
          onClick={() => navigate("/admin")}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
        >
          <div style={{
            width: 30, height: 30, background: "linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)", borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13
          }}>A</div>
          <span style={{ color: text, fontWeight: 700, fontSize: 15 }}>Admin Panel</span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Notification Bell */}
          <button
            onClick={() => navigate("/admin")}
            title={`${ciPendingCount} solicitudes CI pendientes`}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", position: "relative" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {ciPendingCount > 0 && (
              <span style={{ position: "absolute", top: -2, right: -4, background: "#EF4444", color: "#fff", fontSize: 10, fontWeight: 800, borderRadius: 10, padding: "1px 5px", minWidth: 16, textAlign: "center", lineHeight: "16px" }}>
                {ciPendingCount}
              </span>
            )}
          </button>
          <button onClick={toggleTheme} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}>
            <img src={isDark ? iconoSol : iconoLuna} alt="tema" style={{ width: 24, height: 24 }} />
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: "none", border: `1px solid ${border}`, borderRadius: 8, padding: "6px 12px",
              cursor: "pointer", color: "#ef4444", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Salir
          </button>
        </div>
      </motion.nav>
    );
  }

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
        {isAuthenticated && userData?.id_usuario && !isViewingOthersPortfolio && (
          <>
            {/* Visibilidad del portafolio - botón directo en header */}
            <button
              onClick={() => { setShowConfig(true); setShowMenu(false); }}
              title="Visibilidad del portafolio"
              style={{
                background: "none",
                border: `1px solid ${border}`,
                borderRadius: 8,
                cursor: "pointer",
                padding: "6px 10px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: text,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              Visibilidad
            </button>

            {isOnPublicPortfolio ? (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert("URL copiada al portapapeles");
                }}
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                Copiar URL
              </button>
            ) : (
              <button
                onClick={() => {
                  setShowShareModal(true);
                  setShowMenu(false);
                }}
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
          </>
        )}
      
        {/* Avatar + menu: solo mostrar si está autenticado Y no está viendo el portafolio de otro */}
        {isViewingOthersPortfolio ? (
          /* Visitante viendo portafolio ajeno: solo toggle de tema */
          <button
            onClick={toggleTheme}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}
          >
            <img src={isDark ? iconoSol : iconoLuna} alt="tema" style={{ width: 24, height: 24 }} />
          </button>
        ) : (
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
        )}
    </div>
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.52)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              style={{ background: bg, padding: 24, borderRadius: 16, width: "100%", maxWidth: 460, border: `1px solid ${border}`, boxShadow: "0 18px 50px rgba(0,0,0,0.25)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ color: text, fontWeight: 800, margin: "0 0 8px", fontSize: 20 }}>Compartir portafolio</h3>
              <p style={{ color: sub, fontSize: 13, lineHeight: 1.6, margin: "0 0 16px" }}>
                Este es el identificador de tu usuario. Puedes pasarlo a otra persona para que busque tu portafolio por ID o compartir directamente la URL.
              </p>

              <div style={{ background: isDark ? "#1D283A" : "#F8FAFC", border: `1px solid ${border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
                <p style={{ margin: "0 0 4px", color: sub, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>Tu ID</p>
                <p style={{ margin: 0, color: "#3B82F6", fontSize: 24, fontWeight: 900 }}>{userData?.id_usuario || "Sin ID"}</p>
              </div>

              <div style={{ background: isDark ? "#1D283A" : "#F8FAFC", border: `1px solid ${border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 18 }}>
                <p style={{ margin: "0 0 6px", color: sub, fontSize: 12, fontWeight: 700 }}>URL pública</p>
                <p style={{ margin: 0, color: text, fontSize: 12, wordBreak: "break-all" }}>{buildPortfolioUrl()}</p>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => setShowShareModal(false)}
                  style={{ background: "transparent", color: sub, border: `1px solid ${border}`, borderRadius: 8, padding: "9px 14px", cursor: "pointer", fontWeight: 700 }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(buildPortfolioUrl());
                    alert("URL copiada al portapapeles");
                  }}
                  style={{ background: isDark ? "#1D283A" : "#fff", color: "#3B82F6", border: `1px solid ${border}`, borderRadius: 8, padding: "9px 14px", cursor: "pointer", fontWeight: 800 }}
                >
                  Copiar URL
                </button>
                <button
                  onClick={() => {
                    const slug = buildPortfolioSlug();
                    setShowShareModal(false);
                    if (slug) navigate(`/portafolio/${slug}`);
                  }}
                  style={{ background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontWeight: 800 }}
                >
                  Abrir portafolio
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfig && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} 
            onClick={() => setShowConfig(false)}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} 
              style={{ background: bg, padding: 24, borderRadius: 16, width: "100%", maxWidth: 400, border: `1px solid ${border}`, boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }} 
              onClick={(e) => e.stopPropagation()}>
              <h3 style={{ color: text, fontWeight: 700, marginBottom: 18, marginTop: 0 }}>Visibilidad del portafolio</h3>
              
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", color: sub, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Visibilidad General</label>
                <select
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${border}`, background: isDark ? "#1D283A" : "#F8FAFC", color: text, fontSize: 15, outline: "none", appearance: "auto" }}
                  value={userData?.visibilidad || "publico"}
                  onChange={async (e) => {
                    const val = e.target.value;
                    setUserData({ ...userData, visibilidad: val });
                    await perfilAPI.actualizar({
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


              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button onClick={() => setShowConfig(false)} style={{ background: "transparent", color: sub, border: `1px solid ${border}`, borderRadius: 8, padding: "9px 16px", cursor: "pointer", fontWeight: 600 }}>
                  Volver atrás
                </button>
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