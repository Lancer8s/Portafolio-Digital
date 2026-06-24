import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { perfilAPI, adminAPI } from "../api";
import iconoSol from "../assets/iconoSol.png";
import iconoLuna from "../assets/iconoLuna.png";
import DefaultAvatar from "./DefaultAvatar";
// Rutas donde la navbar no se muestra
const HIDDEN_ON = ["/", "/registro", "/login", "/auth/callback"];

// Etiquetas de título por ruta para mostrar en la navbar
const LABELS = {
  "/vista": "Mi Portafolio",
  "/habilidad": "Habilidades",
  "/proyecto": "Proyectos",
  "/edicion": "Editar Perfil",
};
/**
 * Barra de navegación principal de la aplicación.
 * Se oculta en rutas públicas (login, registro, home).
 * Muestra navbar de administrador o usuario según el rol.
 */
export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const { userData, isAuthenticated, logout, setUserData } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [ciNotifications, setCiNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const notificationsRef = useRef(null);

  const isAdmin = userData?.roles?.includes('administrador');
  const ciPendingCount = ciNotifications.length;

  const loadPendingNotifications = useCallback(async (silent = false) => {
    if (!isAdmin) return;
    if (!silent) setNotificationsLoading(true);
    try {
      const response = await adminAPI.getPendingCI();
      if (response.ok) {
        setCiNotifications(response.usuarios || []);
        setNotificationsError("");
      }
    } catch {
      if (!silent) setNotificationsError("No se pudieron cargar las notificaciones.");
    } finally {
      if (!silent) setNotificationsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      setCiNotifications([]);
      setShowNotifications(false);
      return undefined;
    }

    loadPendingNotifications();
    const intervalId = window.setInterval(() => loadPendingNotifications(true), 15000);
    const handleFocus = () => loadPendingNotifications(true);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAdmin, loadPendingNotifications]);

  useEffect(() => {
    if (!showNotifications) return undefined;
    const handleOutsideClick = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showNotifications]);

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

  const label = LABELS[location.pathname] || "";
  const showBackButton = !["/vista", "/admin"].includes(location.pathname);
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(isAuthenticated ? "/vista" : "/");
  };
// Construye el slug del portafolio: "nombre-apellido-id"
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
      <Motion.nav
        className="app-navbar app-navbar-admin"
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

        <div className="app-navbar-actions" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Notification Bell */}
          <div ref={notificationsRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => {
                const nextOpen = !showNotifications;
                setShowNotifications(nextOpen);
                if (nextOpen) loadPendingNotifications();
              }}
              title={`${ciPendingCount} solicitudes CI pendientes`}
              aria-label="Abrir notificaciones pendientes"
              aria-expanded={showNotifications}
              style={{ background: showNotifications ? (isDark ? "#1E293B" : "#F1F5F9") : "none", border: "none", borderRadius: 8, cursor: "pointer", padding: 6, display: "flex", alignItems: "center", position: "relative" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {ciPendingCount > 0 && (
                <span style={{ position: "absolute", top: -3, right: -5, background: "#EF4444", color: "#fff", fontSize: 10, fontWeight: 800, borderRadius: 10, padding: "1px 5px", minWidth: 16, textAlign: "center", lineHeight: "16px" }}>
                  {ciPendingCount > 99 ? "99+" : ciPendingCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <Motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.16 }}
                  style={{
                    position: "absolute", top: 40, right: 0, width: 340, maxWidth: "calc(100vw - 32px)",
                    background: bg, border: `1px solid ${border}`, borderRadius: 14,
                    boxShadow: isDark ? "0 18px 45px rgba(0,0,0,0.55)" : "0 18px 45px rgba(15,23,42,0.16)",
                    overflow: "hidden", zIndex: 500,
                  }}
                >
                  <div style={{ padding: "14px 16px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <p style={{ margin: 0, color: text, fontSize: 14, fontWeight: 800 }}>Notificaciones</p>
                      <p style={{ margin: "2px 0 0", color: sub, fontSize: 11 }}>Solicitudes de verificación pendientes</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => loadPendingNotifications()}
                      disabled={notificationsLoading}
                      style={{ background: "none", border: "none", color: "#3B82F6", cursor: notificationsLoading ? "wait" : "pointer", fontSize: 12, fontWeight: 700, padding: 4 }}
                    >
                      {notificationsLoading ? "Actualizando..." : "Actualizar"}
                    </button>
                  </div>

                  <div style={{ maxHeight: 330, overflowY: "auto" }}>
                    {notificationsLoading && ciNotifications.length === 0 ? (
                      <p style={{ margin: 0, padding: 24, color: sub, fontSize: 13, textAlign: "center" }}>Cargando notificaciones...</p>
                    ) : notificationsError ? (
                      <p style={{ margin: 0, padding: 24, color: "#EF4444", fontSize: 13, textAlign: "center" }}>{notificationsError}</p>
                    ) : ciNotifications.length === 0 ? (
                      <div style={{ padding: "28px 20px", textAlign: "center" }}>
                        <div style={{ width: 38, height: 38, borderRadius: "50%", margin: "0 auto 10px", background: isDark ? "rgba(16,185,129,0.12)" : "#ECFDF5", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>✓</div>
                        <p style={{ margin: 0, color: text, fontSize: 13, fontWeight: 700 }}>Todo al día</p>
                        <p style={{ margin: "4px 0 0", color: sub, fontSize: 12 }}>No hay verificaciones de CI pendientes.</p>
                      </div>
                    ) : (
                      ciNotifications.map((notification) => (
                        <button
                          type="button"
                          key={notification.id_usuario}
                          onClick={() => {
                            setShowNotifications(false);
                            navigate("/admin");
                          }}
                          style={{ width: "100%", padding: "12px 16px", background: "transparent", border: "none", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "flex-start", gap: 11, cursor: "pointer", textAlign: "left" }}
                        >
                          <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: "rgba(59,130,246,0.12)", color: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12 }}>
                            {`${notification.nombre?.[0] || ""}${notification.apellido?.[0] || ""}`.toUpperCase() || "CI"}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={{ margin: 0, color: text, fontSize: 13, fontWeight: 700 }}>{`${notification.nombre || ""} ${notification.apellido || ""}`.trim() || "Usuario"}</p>
                            <p style={{ margin: "2px 0", color: sub, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{notification.email}</p>
                            <span style={{ display: "inline-flex", marginTop: 3, padding: "2px 7px", borderRadius: 999, background: "rgba(245,158,11,0.12)", color: "#F59E0B", fontSize: 10, fontWeight: 800 }}>CI pendiente de revisión</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </Motion.div>
              )}
            </AnimatePresence>
          </div>
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
      </Motion.nav>
    );
  }

  return (
    <Motion.nav
      className="app-navbar"
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
      <div className="app-navbar-left" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {showBackButton && (
          <button
            className="app-back-btn"
            onClick={handleBack}
            style={{
              background: isDark ? "#111827" : "#F8FAFC",
              border: `1px solid ${border}`,
              color: text,
              borderRadius: 8,
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ← Volver
          </button>
        )}

        <button
          onClick={() => navigate("/")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: 0,
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
          <span className="app-brand-text" style={{ color: text, fontWeight: 700, fontSize: 15 }}>
            PortaGen
          </span>
        </button>
      </div>

      <span style={{ color: sub, fontSize: 13, display: "none" }}>{label}</span>

      <div className="app-navbar-actions" style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {isAuthenticated && userData?.id_usuario && !isViewingOthersPortfolio && (
          <>
            {/* Visibilidad del portafolio - OCULTO: ahora la visibilidad depende de la completitud del perfil */}
            {/*
            <button
              className="app-nav-action app-nav-visibility"
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
              <span className="app-nav-action-text">Visibilidad</span>
            </button>
            */}

            {isOnPublicPortfolio ? (
              <button
                className="app-nav-action app-nav-share"
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
                <span className="app-nav-action-text">Copiar URL</span>
              </button>
            ) : (
              <button
                className="app-nav-action app-nav-share"
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
                <span className="app-nav-action-text">Compartir</span>
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
            <Motion.div
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
            </Motion.div>
          )}
        </AnimatePresence>
      </div>
        )}
    </div>
      <AnimatePresence>
        {showShareModal && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.52)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={() => setShowShareModal(false)}
          >
            <Motion.div
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
                  // FIX: navigator.clipboard.writeText puede fallar en contextos
                  // inseguros (HTTP) o cuando el documento no tiene foco.
                  // Usar fallback con document.execCommand('copy') si falla.
                  onClick={() => {
                    navigator.clipboard.writeText(String(userData?.id_usuario || ""));
                    alert("ID copiado al portapapeles");
                  }}
                  style={{ background: isDark ? "#1D283A" : "#fff", color: "#3B82F6", border: `1px solid ${border}`, borderRadius: 8, padding: "9px 14px", cursor: "pointer", fontWeight: 800 }}
                >
                  Copiar ID
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
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfig && (
          <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} 
            onClick={() => setShowConfig(false)}>
            <Motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
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
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </Motion.nav>
  );
}
