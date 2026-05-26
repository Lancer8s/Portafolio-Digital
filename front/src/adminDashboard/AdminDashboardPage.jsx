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

  const bg = isDark ? "#020617" : "#F8FAFC";
  const cardBg = isDark ? "#0F172A" : "#FFFFFF";
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

  return (
    <div
      style={{
        minHeight: "calc(100vh - 60px)",
        background: bg,
        padding: "40px 24px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 40 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <button
              onClick={() => navigate("/")}
              style={{
                background: cardBg,
                border: `1px solid ${border}`,
                borderRadius: "50%",
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: text,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
            <h1 style={{ margin: 0, color: text, fontSize: 28, fontWeight: 800 }}>
              Panel <span style={{ color: accent }}>Administrativo</span>
            </h1>
          </div>
          <p style={{ color: sub, margin: 0, fontSize: 15, paddingLeft: 48 }}>
            Verificación de Identidad de Usuarios (CI)
          </p>
        </motion.div>

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
              borderRadius: 16,
              padding: 60,
              textAlign: "center",
            }}
          >
            <div style={{
              width: 80, height: 80, borderRadius: "50%", background: isDark ? "rgba(59, 130, 246, 0.1)" : "#EFF6FF",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px"
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h2 style={{ color: text, fontSize: 20, fontWeight: 700, margin: "0 0 8px 0" }}>
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
                    borderRadius: 16,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ padding: 20, borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                      display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18
                    }}>
                      {u.nombre[0]}{u.apellido[0]}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, color: text, fontSize: 16, fontWeight: 600 }}>
                        {u.nombre} {u.apellido}
                      </h3>
                      <p style={{ margin: 0, color: sub, fontSize: 13 }}>{u.email}</p>
                    </div>
                  </div>
                  <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column" }}>
                    <p style={{ fontSize: 13, color: sub, marginBottom: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Documento Adjunto
                    </p>
                    <div
                      onClick={() => setSelectedUser(u)}
                      style={{
                        background: isDark ? "#1E293B" : "#F1F5F9",
                        borderRadius: 12,
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
                      }}
                    >
                      <div style={{
                        position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", borderRadius: 11,
                        display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s"
                      }} className="img-overlay">
                        <span style={{ color: "#fff", fontWeight: 600, background: "rgba(0,0,0,0.6)", padding: "6px 12px", borderRadius: 20, backdropFilter: "blur(4px)" }}>
                          Ver Documento
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "0 20px 20px 20px", display: "flex", gap: 12 }}>
                    <button
                      onClick={() => handleAction(u.id_usuario, 'reject')}
                      style={{
                        flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${border}`,
                        background: "transparent", color: "#EF4444", fontWeight: 600, cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = "#FEF2F2"; e.currentTarget.style.borderColor = "#FCA5A5"; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = border; }}
                    >
                      Rechazar
                    </button>
                    <button
                      onClick={() => handleAction(u.id_usuario, 'approve')}
                      style={{
                        flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
                        background: accent, color: "#FFF", fontWeight: 600, cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)", transition: "all 0.2s"
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                      onMouseOut={(e) => e.currentTarget.style.transform = "none"}
                    >
                      Aprobar
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)",
              zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24
            }}
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: cardBg, borderRadius: 20, padding: 24, maxWidth: 800, width: "100%",
                maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column",
                border: `1px solid ${border}`, boxShadow: "0 24px 48px rgba(0,0,0,0.4)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <h3 style={{ margin: 0, color: text, fontSize: 20, fontWeight: 700 }}>
                    Documento de Identidad
                  </h3>
                  <p style={{ margin: "4px 0 0 0", color: sub, fontSize: 14 }}>
                    {selectedUser.nombre} {selectedUser.apellido}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  style={{ background: "transparent", border: "none", color: sub, cursor: "pointer" }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <div style={{ flex: 1, overflow: "auto", borderRadius: 12, border: `1px solid ${border}`, background: isDark ? "#000" : "#F8FAFC" }}>
                <img
                  src={`http://localhost:8000${selectedUser.ci_url}`}
                  alt="CI"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 24, justifyContent: "flex-end" }}>
                <button
                  disabled={isProcessing}
                  onClick={() => handleAction(selectedUser.id_usuario, 'reject')}
                  style={{
                    padding: "12px 24px", borderRadius: 8, border: `1px solid ${border}`,
                    background: "transparent", color: "#EF4444", fontWeight: 600, cursor: isProcessing ? "not-allowed" : "pointer",
                  }}
                >
                  Rechazar
                </button>
                <button
                  disabled={isProcessing}
                  onClick={() => handleAction(selectedUser.id_usuario, 'approve')}
                  style={{
                    padding: "12px 32px", borderRadius: 8, border: "none",
                    background: accent, color: "#FFF", fontWeight: 600, cursor: isProcessing ? "not-allowed" : "pointer",
                  }}
                >
                  Aprobar
                </button>
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
