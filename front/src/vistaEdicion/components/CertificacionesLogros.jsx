import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { certificacionAPI } from "../../api";
import lapizClaro from "../../assets/lapizClaro.png";
import lapizOscuro from "../../assets/lapizOscuro.png";

const MAX_LENGTHS = {
  titulo: 150,
  institucion: 150,
  descripcion: 500,
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-BO", { year: "numeric", month: "short" });
};

const EMPTY_FORM = {
  id: null,
  titulo: "",
  institucion: "",
  fecha_emision: "",
  descripcion: "",
};

export default function CertificacionesLogros({ isDark }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState(null);

  const text    = isDark ? "#fff"     : "#111";
  const sub     = isDark ? "#94a3b8"  : "#807F81";
  const border  = isDark ? "#1D283A"  : "#E2E8F0";
  const box     = isDark ? "#0F172A"  : "#fff";
  const inputBg = isDark ? "#1D283A"  : "#F8FAFC";
  const lapiz   = isDark ? lapizClaro : lapizOscuro;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await certificacionAPI.listar();
      if (data.ok) {
        const certs = (data.certificaciones || [])
          .sort((a, b) => new Date(b.fecha_emision || 0) - new Date(a.fecha_emision || 0));
        setItems(certs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setIsEditing(false);
    setIsDeleting(false);
    setModalOpen(true);
  };

  const openEdit = (cert) => {
    setForm({
      id: cert.id,
      titulo: cert.titulo || "",
      institucion: cert.institucion || "",
      fecha_emision: cert.fecha_emision ? String(cert.fecha_emision).split("T")[0] : "",
      descripcion: cert.descripcion || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.titulo.trim())       { showToast("El título es obligatorio", "error"); return; }
    if (!form.institucion.trim())  { showToast("La institución es obligatoria", "error"); return; }
    if (!form.fecha_emision)       { showToast("La fecha de emisión es obligatoria", "error"); return; }

    setSaving(true);
    try {
      const payload = {
        titulo: form.titulo.trim(),
        institucion: form.institucion.trim(),
        fecha_emision: form.fecha_emision,
        descripcion: form.descripcion.trim() || null,
      };

      let res;
      if (form.id) {
        res = await certificacionAPI.actualizar(form.id, payload);
      } else {
        res = await certificacionAPI.crear(payload);
      }

      if (res.data.ok) {
        showToast(form.id ? "Certificación actualizada" : "Certificación guardada");
        setModalOpen(false);
        loadData();
      } else {
        showToast("Error al guardar", "error");
      }
    } catch (err) {
      const msg = err.response?.data?.errores
        ? Object.values(err.response.data.errores).flat()[0]
        : "Error al guardar";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta certificación?")) return;
    try {
      await certificacionAPI.eliminar(id);
      showToast("Eliminado");
      loadData();
    } catch {
      showToast("Error al eliminar", "error");
    }
  };

  const inp = {
    background: inputBg,
    border: `1px solid ${border}`,
    color: text,
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "'Inter', sans-serif",
  };
  const lbl = { color: sub, fontSize: 12, fontWeight: 600, marginBottom: 5, display: "block" };
  const required = { color: "#ef4444", marginLeft: 2 };

  /* ── Botones estilo igual que el resto de módulos ── */
  const addBtn = (label, onClick) => (
    <button onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: "#3B82F6", fontSize: 13, fontWeight: 600, padding: 0 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      <span>{label}</span>
    </button>
  );
  const editBtn = (label, onClick) => (
    <button onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: sub, fontSize: 13, fontWeight: 600, padding: 0 }}>
      <img src={lapiz} alt="editar" style={{ width: 14, height: 14 }} />
      <span>{label}</span>
    </button>
  );
  const deleteBtn = (label, onClick) => (
    <button onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#ef4444", fontSize: 13, padding: 0 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
      <span>{label}</span>
    </button>
  );

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            style={{
              position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
              background: toast.type === "success" ? "#16a34a" : "#ef4444",
              color: "#fff", borderRadius: 10, padding: "10px 24px",
              fontWeight: 600, fontSize: 14, zIndex: 9999,
              boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra de título + botones (mismo estilo que Habilidades) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <p style={{ color: text, fontWeight: 700, fontSize: 17, margin: 0 }}>
          Certificaciones y Logros
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {addBtn("Añadir Certificación", openAdd)}
          {items.length > 0 && editBtn("Editar Certificación", () => { setIsEditing(!isEditing); setIsDeleting(false); })}
          {items.length > 0 && deleteBtn("Eliminar Certificación", () => { setIsDeleting(!isDeleting); setIsEditing(false); })}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: sub }}>Cargando...</div>
      ) : items.length === 0 ? (
        <div style={{ background: box, border: `1px dashed ${border}`, borderRadius: 14, padding: "40px 24px", textAlign: "center" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={sub} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 12px", display: "block" }}>
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p style={{ color: sub, fontSize: 14, margin: 0 }}>No hay certificaciones registradas</p>
          <p style={{ color: sub, fontSize: 12, margin: "4px 0 0", opacity: 0.7 }}>Añade tus certificaciones, cursos y logros</p>
        </div>
      ) : (
        <div style={{ position: "relative", paddingLeft: 26 }}>
          <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 2, background: "linear-gradient(to bottom, #f59e0b, #ef4444 70%, transparent)", borderRadius: 2 }} />
          {items.map((cert, i) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{ position: "relative", marginBottom: i < items.length - 1 ? 14 : 0 }}
            >
              <div style={{ position: "absolute", left: -21, top: 14, width: 12, height: 12, borderRadius: "50%", background: "#f59e0b", border: `2px solid ${isDark ? "#020617" : "#F1F5F9"}`, boxShadow: "0 0 0 3px rgba(245,158,11,0.2)" }} />
              <div style={{ background: box, border: `1px solid ${border}`, borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "2px 8px", borderRadius: 4, background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>
                        Certificación
                      </span>
                      {cert.fecha_emision && (
                        <span style={{ color: sub, fontSize: 11 }}>
                          Emitido: {formatDate(cert.fecha_emision)}
                        </span>
                      )}
                    </div>
                    <h4 style={{ color: text, fontSize: 15, margin: "2px 0 2px", fontWeight: 700 }}>{cert.titulo}</h4>
                    <p style={{ color: "#f59e0b", fontSize: 13, margin: 0, fontWeight: 600 }}>{cert.institucion}</p>
                    {cert.descripcion && (
                      <p style={{ color: text, fontSize: 12, margin: "8px 0 0", whiteSpace: "pre-wrap", opacity: 0.8, lineHeight: 1.5 }}>{cert.descripcion}</p>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 10 }}>
                    {isEditing && (
                      <button onClick={() => openEdit(cert)} style={{ background: isDark ? "#1D283A" : "#F1F5F9", border: `1px solid ${border}`, borderRadius: 7, cursor: "pointer", padding: "6px 8px", display: "flex", alignItems: "center" }}>
                        <img src={lapiz} alt="editar" style={{ width: 13, height: 13 }} />
                      </button>
                    )}
                    {isDeleting && (
                      <button onClick={() => handleDelete(cert.id)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 7, cursor: "pointer", color: "#ef4444", fontWeight: 700, fontSize: 15, padding: "6px 9px", display: "flex", alignItems: "center" }}>
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 20 }}
              style={{
                background: isDark ? "#0F172A" : "#fff",
                border: `1px solid ${border}`,
                borderRadius: 20,
                width: "100%",
                maxWidth: 520,
                maxHeight: "92vh",
                overflowY: "auto",
                boxShadow: isDark ? "0 25px 60px rgba(0,0,0,0.6)" : "0 25px 60px rgba(0,0,0,0.12)",
              }}
            >
              {/* Modal Header — azul sólido igual que los demás módulos */}
              <div style={{ background: "#3B82F6", padding: "24px 28px 20px", borderRadius: "20px 20px 0 0", position: "relative" }}>
                <button onClick={() => setModalOpen(false)} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#fff", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <h3 style={{ margin: 0, color: "#fff", fontSize: 19, fontWeight: 800 }}>
                    {form.id ? "Editar" : "Añadir"} Certificación
                  </h3>
                </div>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
                  {form.id ? "Modifica los datos de esta certificación" : "Completa los detalles de tu certificación o logro"}
                </p>
              </div>

              {/* Modal Body */}
              <div style={{ padding: "24px 26px 26px", display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={lbl}>Título <span style={required}>*</span></label>
                  <input style={inp} type="text" maxLength={MAX_LENGTHS.titulo} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: AWS Cloud Practitioner" />
                </div>

                <div>
                  <label style={lbl}>Institución <span style={required}>*</span></label>
                  <input style={inp} type="text" maxLength={MAX_LENGTHS.institucion} value={form.institucion} onChange={(e) => setForm({ ...form, institucion: e.target.value })} placeholder="Ej: Amazon Web Services, Google, Coursera" />
                </div>

                <div>
                  <label style={lbl}>Fecha de Emisión <span style={required}>*</span></label>
                  <input style={inp} type="date" value={form.fecha_emision} onChange={(e) => setForm({ ...form, fecha_emision: e.target.value })} />
                </div>

                <div>
                  <label style={lbl}>Descripción</label>
                  <textarea style={{ ...inp, resize: "vertical", lineHeight: 1.55 }} rows={4} maxLength={MAX_LENGTHS.descripcion} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Describe lo que aprendiste o lograste..." />
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button onClick={() => setModalOpen(false)} style={{ flex: 1, background: "none", border: `1px solid ${border}`, color: text, borderRadius: 10, padding: "11px 0", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
                    Cancelar
                  </button>
                  <button onClick={handleSave} disabled={saving} style={{ flex: 2, background: saving ? "#6B7280" : "#3B82F6", color: "#fff", border: "none", borderRadius: 10, padding: "11px 0", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 14, opacity: saving ? 0.7 : 1 }}>
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
