import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { experienciaAPI } from "../../api";
import lapizClaro from "../../assets/lapizClaro.png";
import lapizOscuro from "../../assets/lapizOscuro.png";

const formatDate = (dateStr) => {
  if (!dateStr) return "Actualidad";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-BO", { year: "numeric", month: "short" });
};

const EMPTY_FORM = {
  id_experiencia: null,
  tipo: "laboral",
  cargo_titulo: "",
  institucion_empresa: "",
  fecha_inicio: "",
  fecha_fin: "",
  actualmente: false,
  descripcion: "",
  referencias: "",
};

export default function ExperienciaLaboral({ isDark }) {
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
      const { data } = await experienciaAPI.listar();
      if (data.ok) {
        const laborales = (data.experiencias || [])
          .filter((e) => e.tipo === "laboral")
          .sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio));
        setItems(laborales);
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

  const openEdit = (exp) => {
    setForm({
      id_experiencia: exp.id_experiencia,
      tipo: "laboral",
      cargo_titulo: exp.cargo_titulo || "",
      institucion_empresa: exp.institucion_empresa || "",
      fecha_inicio: exp.fecha_inicio ? String(exp.fecha_inicio).split("T")[0] : "",
      fecha_fin: exp.fecha_fin ? String(exp.fecha_fin).split("T")[0] : "",
      actualmente: !exp.fecha_fin,
      descripcion: exp.descripcion || "",
      referencias: exp.referencias || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.cargo_titulo.trim())        { showToast("El cargo es obligatorio", "error"); return; }
    if (!form.institucion_empresa.trim()) { showToast("La empresa es obligatoria", "error"); return; }
    if (!form.fecha_inicio)               { showToast("La fecha de inicio es obligatoria", "error"); return; }
    if (!form.actualmente && form.fecha_fin && form.fecha_fin < form.fecha_inicio) {
      showToast("La fecha de fin no puede ser anterior al inicio", "error"); return;
    }

    setSaving(true);
    try {
      const payload = {
        tipo: "laboral",
        cargo_titulo: form.cargo_titulo.trim(),
        institucion_empresa: form.institucion_empresa.trim(),
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.actualmente ? null : (form.fecha_fin || null),
        descripcion: form.descripcion.trim() || null,
        referencias: form.referencias.trim() || null,
      };

      let res;
      if (form.id_experiencia) {
        res = await experienciaAPI.actualizar(form.id_experiencia, payload);
      } else {
        res = await experienciaAPI.crear(payload);
      }

      if (res.data.ok) {
        showToast(form.id_experiencia ? "Experiencia actualizada" : "Experiencia guardada");
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
    if (!confirm("¿Eliminar esta experiencia laboral?")) return;
    try {
      await experienciaAPI.eliminar(id);
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
          Experiencia Laboral
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {addBtn("Añadir Experiencia", openAdd)}
          {items.length > 0 && editBtn("Editar Experiencia", () => { setIsEditing(!isEditing); setIsDeleting(false); })}
          {items.length > 0 && deleteBtn("Eliminar Experiencia", () => { setIsDeleting(!isDeleting); setIsEditing(false); })}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: sub }}>Cargando...</div>
      ) : items.length === 0 ? (
        <div style={{ background: box, border: `1px dashed ${border}`, borderRadius: 14, padding: "40px 24px", textAlign: "center" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={sub} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 12px", display: "block" }}>
            <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p style={{ color: sub, fontSize: 14, margin: 0 }}>No hay experiencia laboral registrada aún</p>
          <p style={{ color: sub, fontSize: 12, margin: "4px 0 0", opacity: 0.7 }}>Añade tus empleos y trabajos anteriores</p>
        </div>
      ) : (
        <div style={{ position: "relative", paddingLeft: 26 }}>
          <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 2, background: "linear-gradient(to bottom, #3B82F6, #6366f1 70%, transparent)", borderRadius: 2 }} />
          {items.map((exp, i) => (
            <motion.div
              key={exp.id_experiencia}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{ position: "relative", marginBottom: i < items.length - 1 ? 14 : 0 }}
            >
              <div style={{ position: "absolute", left: -21, top: 14, width: 12, height: 12, borderRadius: "50%", background: "#3B82F6", border: `2px solid ${isDark ? "#020617" : "#F1F5F9"}`, boxShadow: "0 0 0 3px rgba(59,130,246,0.2)" }} />
              <div style={{ background: box, border: `1px solid ${border}`, borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      {!exp.fecha_fin && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "2px 8px", borderRadius: 4, background: "rgba(16,185,129,0.12)", color: "#10b981" }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                          Actual
                        </span>
                      )}
                      <span style={{ color: sub, fontSize: 11 }}>
                        {formatDate(exp.fecha_inicio)} — {formatDate(exp.fecha_fin)}
                      </span>
                    </div>
                    <h4 style={{ color: text, fontSize: 15, margin: "2px 0 2px", fontWeight: 700 }}>{exp.cargo_titulo}</h4>
                    <p style={{ color: "#3B82F6", fontSize: 13, margin: 0, fontWeight: 600 }}>{exp.institucion_empresa}</p>
                    {exp.descripcion && (
                      <p style={{ color: text, fontSize: 12, margin: "8px 0 0", whiteSpace: "pre-wrap", opacity: 0.8, lineHeight: 1.5 }}>{exp.descripcion}</p>
                    )}
                    {exp.referencias && (
                      <div style={{ marginTop: 8, padding: "6px 10px", background: isDark ? "#1D283A" : "#F1F5F9", borderRadius: 6, borderLeft: "3px solid #3B82F6" }}>
                        <p style={{ color: sub, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 2px" }}>Referencia</p>
                        <p style={{ color: text, fontSize: 12, margin: 0, opacity: 0.85 }}>{exp.referencias}</p>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 10 }}>
                    {isEditing && (
                      <button onClick={() => openEdit(exp)} style={{ background: isDark ? "#1D283A" : "#F1F5F9", border: `1px solid ${border}`, borderRadius: 7, cursor: "pointer", padding: "6px 8px", display: "flex", alignItems: "center" }}>
                        <img src={lapiz} alt="editar" style={{ width: 13, height: 13 }} />
                      </button>
                    )}
                    {isDeleting && (
                      <button onClick={() => handleDelete(exp.id_experiencia)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 7, cursor: "pointer", color: "#ef4444", fontWeight: 700, fontSize: 15, padding: "6px 9px", display: "flex", alignItems: "center" }}>
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
                    <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h3 style={{ margin: 0, color: "#fff", fontSize: 19, fontWeight: 800 }}>
                    {form.id_experiencia ? "Editar" : "Añadir"} Experiencia Laboral
                  </h3>
                </div>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
                  {form.id_experiencia ? "Modifica los datos de esta experiencia" : "Completa los detalles de tu experiencia laboral"}
                </p>
              </div>

              {/* Modal Body */}
              <div style={{ padding: "24px 26px 26px", display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={lbl}>Cargo <span style={required}>*</span></label>
                  <input style={inp} type="text" value={form.cargo_titulo} onChange={(e) => setForm({ ...form, cargo_titulo: e.target.value })} placeholder="Ej: Desarrollador Full Stack" />
                </div>

                <div>
                  <label style={lbl}>Empresa <span style={required}>*</span></label>
                  <input style={inp} type="text" value={form.institucion_empresa} onChange={(e) => setForm({ ...form, institucion_empresa: e.target.value })} placeholder="Ej: Google, Microsoft, Startup X" />
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={lbl}>Fecha Inicio <span style={required}>*</span></label>
                    <input style={inp} type="date" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={lbl}>Fecha Fin</label>
                    <input style={{ ...inp, opacity: form.actualmente ? 0.4 : 1 }} type="date" value={form.actualmente ? "" : form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} disabled={form.actualmente} />
                  </div>
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", userSelect: "none" }}>
                  <input type="checkbox" checked={form.actualmente} onChange={(e) => setForm({ ...form, actualmente: e.target.checked, fecha_fin: "" })} style={{ width: 15, height: 15, accentColor: "#3B82F6", cursor: "pointer" }} />
                  <span style={{ color: text, fontSize: 13, fontWeight: 500 }}>Trabajo actualmente aquí</span>
                </label>

                <div>
                  <label style={lbl}>Descripción</label>
                  <textarea style={{ ...inp, resize: "vertical", lineHeight: 1.55 }} rows={4} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Describe tus responsabilidades y logros..." />
                </div>

                <div>
                  <label style={lbl}>Referencias <span style={{ color: sub, fontWeight: 400 }}>(opcional)</span></label>
                  <textarea style={{ ...inp, resize: "vertical", lineHeight: 1.55 }} rows={2} value={form.referencias} onChange={(e) => setForm({ ...form, referencias: e.target.value })} placeholder="Ej: Juan Pérez — Jefe directo · juan@empresa.com · +591 70000000" />
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
