import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminAPI, resolveMediaUrl } from "../../api";

export default function AdminCIVerification({ isDark, onCountChange }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const text = isDark ? "#F8FAFC" : "#0F172A";
  const sub = isDark ? "#94A3B8" : "#64748B";
  const cardBg = isDark ? "#0F172A" : "#FFFFFF";
  const border = isDark ? "#1E293B" : "#E2E8F0";
  const accent = "#3B82F6";

  useEffect(() => { fetchPending(); }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getPendingCI();
      if (res.ok) { setUsuarios(res.usuarios); onCountChange?.(res.usuarios.length); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAction = async (id, action) => {
    try {
      setIsProcessing(true);
      await adminAPI.verifyCI(id, action);
      const updated = usuarios.filter(u => u.id_usuario !== id);
      setUsuarios(updated);
      onCountChange?.(updated.length);
      setSelectedUser(null);
    } catch { alert("Error al procesar la solicitud."); }
    finally { setIsProcessing(false); }
  };

  return (
    <div>
      <h1 style={{ color: text, fontSize: 24, fontWeight: 800, margin: "0 0 6px" }}>Verificación de Identidad</h1>
      <p style={{ color: sub, margin: "0 0 28px", fontSize: 14 }}>Revisión de documentos de identidad (CI) pendientes</p>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ width: 36, height: 36, border: `3px solid ${border}`, borderTopColor: accent, borderRadius: "50%" }} />
        </div>
      ) : usuarios.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, padding: 60, textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: isDark ? "rgba(59,130,246,0.1)" : "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h2 style={{ color: text, fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>Todo al día</h2>
          <p style={{ color: sub, margin: 0, fontSize: 14 }}>No hay documentos pendientes de revisión.</p>
        </motion.div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          <AnimatePresence>
            {usuarios.map(u => (
              <motion.div key={u.id_usuario} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -3 }}
                style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                    {u.nombre[0]}{u.apellido[0]}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: 0, color: text, fontSize: 15, fontWeight: 600 }}>{u.nombre} {u.apellido}</h3>
                    <p style={{ margin: 0, color: sub, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</p>
                  </div>
                  <span style={{ marginLeft: "auto", background: "#FEF3C7", color: "#92400E", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, flexShrink: 0 }}>Pendiente</span>
                </div>
                <div style={{ padding: 20, flex: 1 }}>
                  <div onClick={() => setSelectedUser(u)}
                    style={{ background: isDark ? "#1E293B" : "#F1F5F9", borderRadius: 12, height: 150, backgroundImage: `url(${resolveMediaUrl(u.ci_url)})`, backgroundSize: "cover", backgroundPosition: "center", cursor: "pointer", border: `1px solid ${border}`, position: "relative" }}>
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }} className="ci-overlay">
                      <span style={{ color: "#fff", fontWeight: 600, background: "rgba(0,0,0,0.5)", padding: "6px 14px", borderRadius: 20, backdropFilter: "blur(4px)", fontSize: 13 }}>Ver Documento</span>
                    </div>
                  </div>
                </div>
                <div style={{ padding: "0 20px 20px", display: "flex", gap: 10 }}>
                  <button onClick={() => handleAction(u.id_usuario, 'reject')}
                    style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${border}`, background: "transparent", color: "#EF4444", fontWeight: 600, cursor: "pointer", fontSize: 13, transition: "all 0.15s" }}
                    onMouseOver={e => { e.currentTarget.style.background = isDark ? "rgba(239,68,68,0.1)" : "#FEF2F2"; }}
                    onMouseOut={e => { e.currentTarget.style.background = "transparent"; }}>Rechazar</button>
                  <button onClick={() => handleAction(u.id_usuario, 'approve')}
                    style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: accent, color: "#FFF", fontWeight: 600, cursor: "pointer", fontSize: 13, boxShadow: "0 4px 12px rgba(59,130,246,0.3)" }}
                    onMouseOver={e => e.currentTarget.style.transform = "translateY(-1px)"}
                    onMouseOut={e => e.currentTarget.style.transform = "none"}>Aprobar</button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal de imagen */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
            onClick={() => setSelectedUser(null)}>
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
              style={{ background: cardBg, borderRadius: 20, padding: 24, maxWidth: 800, width: "100%", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", border: `1px solid ${border}` }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, color: text, fontSize: 18, fontWeight: 700 }}>Documento de Identidad</h3>
                  <p style={{ margin: "4px 0 0", color: sub, fontSize: 13 }}>{selectedUser.nombre} {selectedUser.apellido}</p>
                </div>
                <button onClick={() => setSelectedUser(null)} style={{ background: "transparent", border: "none", color: sub, cursor: "pointer", padding: 4 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div style={{ flex: 1, overflow: "auto", borderRadius: 12, border: `1px solid ${border}`, background: isDark ? "#000" : "#F8FAFC" }}>
                <img src={resolveMediaUrl(selectedUser.ci_url)} alt="CI" style={{ width: "100%", height: "auto", display: "block" }} />
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 20, justifyContent: "flex-end" }}>
                <button disabled={isProcessing} onClick={() => handleAction(selectedUser.id_usuario, 'reject')}
                  style={{ padding: "10px 22px", borderRadius: 8, border: `1px solid ${border}`, background: "transparent", color: "#EF4444", fontWeight: 600, cursor: isProcessing ? "not-allowed" : "pointer", fontSize: 13 }}>Rechazar</button>
                <button disabled={isProcessing} onClick={() => handleAction(selectedUser.id_usuario, 'approve')}
                  style={{ padding: "10px 28px", borderRadius: 8, border: "none", background: accent, color: "#FFF", fontWeight: 600, cursor: isProcessing ? "not-allowed" : "pointer", fontSize: 13 }}>Aprobar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`.ci-overlay { opacity: 0; } div:hover > .ci-overlay { opacity: 1 !important; }`}</style>
    </div>
  );
}
