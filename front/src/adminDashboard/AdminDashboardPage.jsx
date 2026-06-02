import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { adminAPI } from "../api";
import { useNavigate } from "react-router-dom";

export default function AdminDashboardPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const bg = isDark ? "#020617" : "#F1F5F9";
  const cardBg = isDark ? "#0F172A" : "#FFFFFF";
  const actionBg = isDark ? "#111827" : "#FFFFFF";
  const sectionBg = isDark ? "#1E293B" : "#F1F5F9";
  const text = isDark ? "#F8FAFC" : "#0F172A";
  const sub = isDark ? "#94A3B8" : "#64748B";
  const border = isDark ? "#1E293B" : "#E2E8F0";
  const accent = "#3B82F6";

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getPendingCI();
      if (res.ok) {
        setUsuarios(res.usuarios);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      setIsProcessing(true);
      await adminAPI.verifyCI(id, action);
      setUsuarios(usuarios.filter((u) => u.id_usuario !== id));
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
      alert("Error al procesar la solicitud.");
    } finally {
      setIsProcessing(false);
    }
  };

  const sectionTitle = (label) => (
    <div
      style={{
        width: "100%",
        borderRadius: 12,
        padding: "9px 12px",
        background: sectionBg,
        border: `1px solid ${border}`,
        color: sub,
        fontSize: 11,
        fontWeight: 900,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        boxSizing: "border-box",
        marginTop: 6,
      }}
    >
      {label}
    </div>
  );

  const sideButton = (label, description, code, onClick, disabled = false) => (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        width: "100%",
        border: `1px solid ${border}`,
        borderRadius: 18,
        padding: "15px 16px",
        cursor: disabled ? "not-allowed" : "pointer",
        background: actionBg,
        color: text,
        display: "flex",
        alignItems: "center",
        gap: 14,
        textAlign: "left",
        opacity: disabled ? 0.7 : 1,
        boxShadow: isDark ? "none" : "0 8px 20px rgba(15,23,42,0.045)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.borderColor = "rgba(59,130,246,0.45)";
        e.currentTarget.style.boxShadow = isDark
          ? "0 10px 24px rgba(0,0,0,0.22)"
          : "0 12px 26px rgba(15,23,42,0.08)";
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = border;
        e.currentTarget.style.boxShadow = isDark ? "none" : "0 8px 20px rgba(15,23,42,0.045)";
      }}
    >
      <span
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isDark ? "rgba(59,130,246,0.16)" : "#EFF6FF",
          color: "#2563EB",
          fontSize: 13,
          fontWeight: 900,
          letterSpacing: "0.03em",
        }}
      >
        {code}
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <strong style={{ fontSize: 14.5, lineHeight: 1.2 }}>{label}</strong>
        <span style={{ color: sub, fontSize: 12.2, lineHeight: 1.35 }}>{description}</span>
      </span>
    </button>
  );

  const statCard = (label, value, description, code) => (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${border}`,
        borderRadius: 18,
        padding: "18px 18px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        minHeight: 88,
        boxSizing: "border-box",
        boxShadow: isDark ? "none" : "0 10px 26px rgba(15,23,42,0.06)",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isDark ? "rgba(59,130,246,0.16)" : "#EFF6FF",
          color: "#2563EB",
          fontSize: 13,
          fontWeight: 900,
          letterSpacing: "0.03em",
          flexShrink: 0,
        }}
      >
        {code}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ color: accent, fontWeight: 900, fontSize: 28, lineHeight: 1, margin: "0 0 5px" }}>
          {value}
        </p>
        <p style={{ color: text, fontSize: 13, fontWeight: 800, margin: 0 }}>{label}</p>
        <p style={{ color: sub, fontSize: 11.5, margin: "2px 0 0" }}>{description}</p>
      </div>
    </div>
  );

  const reviewButton = (label, code, onClick, color, disabled = false) => (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        flex: 1,
        minHeight: 46,
        padding: "10px 12px",
        borderRadius: 14,
        border: `1px solid ${border}`,
        background: actionBg,
        color,
        fontWeight: 800,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        boxShadow: isDark ? "none" : "0 8px 18px rgba(15,23,42,0.045)",
        transition: "transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
      }}
      onMouseOver={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.boxShadow = "0 10px 22px rgba(15,23,42,0.09)";
      }}
      onMouseOut={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.borderColor = border;
        e.currentTarget.style.boxShadow = isDark ? "none" : "0 8px 18px rgba(15,23,42,0.045)";
      }}
    >
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isDark ? "rgba(59,130,246,0.14)" : "#EFF6FF",
          color: "#2563EB",
          fontSize: 11,
          fontWeight: 900,
        }}
      >
        {code}
      </span>
      {label}
    </button>
  );

  return (
    <div
      style={{
        minHeight: "calc(100vh - 60px)",
        background: bg,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <style>{`
        .admin-layout {
          min-height: calc(100vh - 60px);
          display: flex;
          align-items: flex-start;
        }
        .admin-sidebar {
          width: 340px;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          height: calc(100vh - 60px);
          padding: 20px 0 20px 20px;
          box-sizing: border-box;
        }
        .admin-actions-panel {
          height: calc(100vh - 100px);
          overflow-y: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .admin-actions-panel::-webkit-scrollbar {
          display: none;
        }
        .admin-main {
          flex: 1;
          padding: 28px 24px 42px 26px;
          min-width: 0;
        }
        .admin-content {
          max-width: 1080px;
          margin: 0 auto;
        }
        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(180px, 1fr));
          gap: 14px;
          margin-bottom: 24px;
        }
        @media (max-width: 980px) {
          .admin-layout {
            flex-direction: column;
          }
          .admin-sidebar {
            width: 100%;
            position: relative;
            height: auto;
            padding: 16px;
          }
          .admin-actions-panel {
            height: auto;
          }
          .admin-main {
            width: 100%;
            box-sizing: border-box;
            padding: 0 16px 32px;
          }
          .admin-stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div
            className="admin-actions-panel"
            style={{
              background: cardBg,
              border: `1px solid ${border}`,
              borderRadius: 22,
              padding: 17,
              boxShadow: isDark ? "none" : "0 12px 32px rgba(15,23,42,0.08)",
            }}
          >
            <div style={{ marginBottom: 15 }}>
              <p style={{ color: text, fontSize: 18, fontWeight: 900, margin: "0 0 5px" }}>
                Acciones del administrador
              </p>
              <p style={{ color: sub, fontSize: 12.5, lineHeight: 1.45, margin: 0 }}>
                Opciones principales separadas por sección.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {sectionTitle("Navegación")}
              {sideButton("Volver al portafolio", "Regresar a la pantalla principal", "VP", () => navigate("/"))}

              {sectionTitle("Verificación")}
              {sideButton("Actualizar lista", "Recargar usuarios pendientes", "AL", fetchPending, loading)}
              {sideButton(
                "Pendientes de CI",
                `${usuarios.length} usuario${usuarios.length === 1 ? "" : "s"} por revisar`,
                "CI",
                () => {},
                true
              )}

              {sectionTitle("Revisión")}
              {sideButton(
                selectedUser ? "Usuario seleccionado" : "Selecciona una tarjeta",
                selectedUser
                  ? `${selectedUser.nombre} ${selectedUser.apellido}`
                  : "Abre un documento para revisar",
                selectedUser ? "US" : "ST",
                () => {},
                true
              )}
            </div>
          </div>
        </aside>

        <main className="admin-main">
          <div className="admin-content">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{ marginBottom: 22 }}
            >
              <h1 style={{ margin: 0, color: text, fontSize: 30, fontWeight: 900 }}>
                Panel <span style={{ color: accent }}>Administrativo</span>
              </h1>
              <p style={{ color: sub, margin: "7px 0 0", fontSize: 15 }}>
                Verificación de Identidad de Usuarios mediante CI.
              </p>
            </motion.div>

            <section
              style={{
                background: cardBg,
                border: `1px solid ${border}`,
                borderRadius: 22,
                padding: 18,
                boxShadow: isDark ? "none" : "0 12px 32px rgba(15,23,42,0.08)",
                marginBottom: 24,
              }}
            >
              <div style={{ marginBottom: 14 }}>
                <h3 style={{ color: text, fontSize: 18, fontWeight: 900, margin: 0 }}>
                  Resumen administrativo
                </h3>
                <p style={{ color: sub, fontSize: 12.5, margin: "4px 0 0" }}>
                  Estado general de la revisión de documentos.
                </p>
              </div>
              <div className="admin-stats-grid">
                {statCard("Usuarios pendientes", usuarios.length, "documentos por revisar", "UP")}
                {statCard("Módulo", "CI", "verificación manual", "MD")}
                {statCard("Estado", loading ? "..." : "Activo", "panel disponible", "ES")}
              </div>
            </section>

            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  style={{
                    width: 40,
                    height: 40,
                    border: `3px solid ${border}`,
                    borderTopColor: accent,
                    borderRadius: "50%",
                  }}
                />
              </div>
            ) : usuarios.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  background: cardBg,
                  border: `1px solid ${border}`,
                  borderRadius: 18,
                  padding: 60,
                  textAlign: "center",
                  boxShadow: isDark ? "none" : "0 12px 32px rgba(15,23,42,0.06)",
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: isDark ? "rgba(59, 130, 246, 0.1)" : "#EFF6FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 24px",
                  }}
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <h2 style={{ color: text, fontSize: 20, fontWeight: 800, margin: "0 0 8px 0" }}>
                  Todo al día
                </h2>
                <p style={{ color: sub, margin: 0 }}>
                  No hay documentos de identidad pendientes de revisión.
                </p>
              </motion.div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
                <AnimatePresence>
                  {usuarios.map((u) => (
                    <motion.div
                      key={u.id_usuario}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ y: -4, boxShadow: "0 12px 24px rgba(0,0,0,0.1)" }}
                      style={{
                        background: cardBg,
                        border: `1px solid ${border}`,
                        borderRadius: 18,
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <div style={{ padding: 20, borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 16 }}>
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: "50%",
                            background: isDark ? "rgba(59,130,246,0.18)" : "#EFF6FF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: accent,
                            fontWeight: 900,
                            fontSize: 16,
                          }}
                        >
                          {u.nombre[0]}{u.apellido[0]}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <h3 style={{ margin: 0, color: text, fontSize: 16, fontWeight: 700 }}>
                            {u.nombre} {u.apellido}
                          </h3>
                          <p style={{ margin: 0, color: sub, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</p>
                        </div>
                      </div>
                      <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column" }}>
                        <p style={{ fontSize: 12, color: sub, marginBottom: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                          Documento adjunto
                        </p>
                        <div
                          onClick={() => setSelectedUser(u)}
                          style={{
                            background: isDark ? "#1E293B" : "#F1F5F9",
                            borderRadius: 14,
                            height: 160,
                            backgroundImage: `url(http://localhost:8000${u.ci_url})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            cursor: "pointer",
                            border: `1px solid ${border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              background: "rgba(0,0,0,0.3)",
                              borderRadius: 13,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              opacity: 0,
                              transition: "opacity 0.2s",
                            }}
                            className="img-overlay"
                          >
                            <span style={{ color: "#fff", fontWeight: 700, background: "rgba(0,0,0,0.6)", padding: "7px 13px", borderRadius: 20, backdropFilter: "blur(4px)" }}>
                              Ver documento
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ padding: "0 20px 20px 20px", display: "flex", gap: 12 }}>
                        {reviewButton("Rechazar", "RE", () => handleAction(u.id_usuario, "reject"), "#EF4444", isProcessing)}
                        {reviewButton("Aprobar", "AP", () => handleAction(u.id_usuario, "approve"), "#16A34A", isProcessing)}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </main>
      </div>

      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(8px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: cardBg,
                borderRadius: 22,
                padding: 24,
                maxWidth: 800,
                width: "100%",
                maxHeight: "90vh",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                border: `1px solid ${border}`,
                boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <h3 style={{ margin: 0, color: text, fontSize: 20, fontWeight: 800 }}>
                    Documento de Identidad
                  </h3>
                  <p style={{ margin: "4px 0 0 0", color: sub, fontSize: 14 }}>
                    {selectedUser.nombre} {selectedUser.apellido}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  style={{
                    background: actionBg,
                    border: `1px solid ${border}`,
                    color: sub,
                    cursor: "pointer",
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    fontWeight: 900,
                  }}
                >
                  X
                </button>
              </div>
              <div style={{ flex: 1, overflow: "auto", borderRadius: 14, border: `1px solid ${border}`, background: isDark ? "#000" : "#F8FAFC" }}>
                <img
                  src={`http://localhost:8000${selectedUser.ci_url}`}
                  alt="CI"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 24, justifyContent: "flex-end" }}>
                {reviewButton("Rechazar", "RE", () => handleAction(selectedUser.id_usuario, "reject"), "#EF4444", isProcessing)}
                {reviewButton("Aprobar", "AP", () => handleAction(selectedUser.id_usuario, "approve"), "#16A34A", isProcessing)}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        .img-overlay { opacity: 0; }
        div[style*="cursor: pointer"]:hover .img-overlay { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
