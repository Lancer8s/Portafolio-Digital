import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { experienciaAPI } from "../../api";
import lapizClaro from "../../assets/lapizClaro.png";
import lapizOscuro from "../../assets/lapizOscuro.png";

const formatDate = (dateStr) => {
  if (!dateStr) return "Actualidad";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-BO", { year: "numeric", month: "short", day: "numeric" });
};

export default function ExperienciaList({ isDark }) {
  const [experiencias, setExperiencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ id_experiencia: null, tipo: "laboral", institucion_empresa: "", cargo_titulo: "", fecha_inicio: "", fecha_fin: "", descripcion: "" });
  const [toast, setToast] = useState(null);

  const text = isDark ? "#fff" : "#111";
  const sub = isDark ? "#94a3b8" : "#807F81";
  const border = isDark ? "#1D283A" : "#E2E8F0";
  const box = isDark ? "#0F172A" : "#fff";
  const lapiz = isDark ? lapizClaro : lapizOscuro;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const sortExperiencias = (list) =>
    [...list].sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio));

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await experienciaAPI.listar();
      if (data.ok) {
        setExperiencias(sortExperiencias(data.experiencias || []));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleEdit = (exp) => {
    setForm({
      id_experiencia: exp.id_experiencia,
      tipo: exp.tipo,
      institucion_empresa: exp.institucion_empresa,
      cargo_titulo: exp.cargo_titulo,
      fecha_inicio: exp.fecha_inicio.split('T')[0],
      fecha_fin: exp.fecha_fin ? exp.fecha_fin.split('T')[0] : "",
      descripcion: exp.descripcion || ""
    });
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setForm({ id_experiencia: null, tipo: "laboral", institucion_empresa: "", cargo_titulo: "", fecha_inicio: "", fecha_fin: "", descripcion: "" });
    setModalOpen(true);
  };

  const saveExp = async () => {
    if (!form.institucion_empresa.trim() || !form.cargo_titulo.trim() || !form.fecha_inicio) {
      showToast("Completa los campos obligatorios", "error");
      return;
    }
    if (form.fecha_fin && form.fecha_fin < form.fecha_inicio) {
      showToast("La fecha de fin no puede ser anterior al inicio", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.fecha_fin) payload.fecha_fin = null;
      let res;
      if (form.id_experiencia) {
        res = await experienciaAPI.actualizar(form.id_experiencia, payload);
      } else {
        res = await experienciaAPI.crear(payload);
      }
      if (res.data.ok) {
        showToast("Guardado correctamente");
        setModalOpen(false);
        loadData();
      } else {
        showToast("Error al guardar", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.errores?.institucion_empresa?.[0] || "Error", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteExp = async (id) => {
    if (!confirm("¿Eliminar este registro?")) return;
    try {
      await experienciaAPI.eliminar(id);
      loadData();
    } catch (err) {
      showToast("Error al eliminar", "error");
    }
  };

  const inp = {
    background: isDark ? "#1D283A" : "#F8FAFC",
    border: `1px solid ${border}`,
    color: text, borderRadius: 8, padding: "10px 14px",
    fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box",
  };
  const lbl = { color: sub, fontSize: 12, marginBottom: 4, display: "block" };

  return (
    <div style={{ marginBottom: 24 }}>
      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: toast.type === "success" ? "#16a34a" : "#ef4444", color: "#fff", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 14, zIndex: 999 }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <p style={{ color: text, fontWeight: 700, fontSize: 17, margin: 0, padding: 0 }}>
          Experiencia
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <button onClick={handleAddNew} style={{ background: "none", border: "none", cursor: "pointer", color: "#3B82F6", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 5, padding: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>Añadir Experiencia</span>
          </button>
          {experiencias.length > 0 && (
            <>
              <button
                onClick={() => {
                  setIsEditing(!isEditing);
                  setIsDeleting(false);
                }}
                style={{ background: "none", border: "none", cursor: "pointer", color: sub, fontSize: 13, display: "flex", alignItems: "center", gap: 6, padding: 0 }}
              >
                <img src={lapiz} alt="editar" style={{ width: 14, height: 14 }} />
                <span>{isEditing ? "Hecho" : "Editar Experiencias"}</span>
              </button>
              <button
                onClick={() => {
                  setIsDeleting(!isDeleting);
                  setIsEditing(false);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#ef4444",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: 0
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
                <span>{isDeleting ? "Hecho" : "Eliminar Experiencias"}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {experiencias.length === 0 ? (
        <p style={{ color: sub, fontSize: 13 }}>No hay experiencia registrada aún.</p>
      ) : (
        <div style={{ position: "relative", paddingLeft: 24 }}>
          {/* Vertical timeline line */}
          <div style={{
            position: "absolute", left: 7, top: 6, bottom: 6, width: 2,
            background: isDark
              ? "linear-gradient(to bottom, #3B82F6, #6366F1 50%, transparent)"
              : "linear-gradient(to bottom, #3B82F6, #6366F1 50%, transparent)",
            borderRadius: 2,
          }} />

          {experiencias.map((exp, i) => (
            <motion.div
              key={exp.id_experiencia}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{ position: "relative", marginBottom: i < experiencias.length - 1 ? 16 : 0 }}
            >
              {/* Dot */}
              <div style={{
                position: "absolute", left: -20, top: 8, width: 12, height: 12,
                borderRadius: "50%", background: "#3B82F6",
                border: `2px solid ${isDark ? "#0F172A" : "#F8FAFC"}`,
                boxShadow: "0 0 0 3px rgba(59,130,246,0.2)",
              }} />

              <div style={{
                background: box, border: `1px solid ${border}`,
                borderRadius: 10, padding: "12px 14px",
                transition: "box-shadow 0.2s",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{
                        display: "inline-block", fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                        letterSpacing: "0.05em", padding: "2px 8px", borderRadius: 4,
                        background: exp.tipo === "laboral" ? "rgba(59,130,246,0.12)" : "rgba(168,85,247,0.12)",
                        color: exp.tipo === "laboral" ? "#3B82F6" : "#a855f7",
                      }}>
                        {exp.tipo === "laboral" ? "Laboral" : "Académica"}
                      </span>
                      <span style={{ color: sub, fontSize: 11 }}>
                        {formatDate(exp.fecha_inicio)} — {formatDate(exp.fecha_fin)}
                      </span>
                    </div>
                    <h4 style={{ color: text, fontSize: 14, margin: "2px 0 1px", fontWeight: 600 }}>{exp.cargo_titulo}</h4>
                    <div style={{ color: sub, fontSize: 12 }}>{exp.institucion_empresa}</div>
                    {exp.descripcion && <p style={{ color: text, fontSize: 12, margin: "6px 0 0", whiteSpace: "pre-wrap", opacity: 0.85, lineHeight: 1.5 }}>{exp.descripcion}</p>}
                  </div>
                  {isEditing && (
                    <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 8 }}>
                      <button onClick={() => handleEdit(exp)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                        <img src={lapiz} alt="editar" style={{ width: 13, height: 13 }} />
                      </button>
                    </div>
                  )}
                  {isDeleting && (
                    <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 8 }}>
                      <button onClick={() => deleteExp(exp.id_experiencia)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontWeight: "bold", fontSize: 14, padding: 4 }}>
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{
            background: isDark ? "#0F172A" : "#fff",
            border: `1px solid ${border}`,
            borderRadius: 20,
            padding: 0,
            width: "100%",
            maxWidth: 520,
            maxHeight: "90vh",
            overflowY: "auto",
            boxSizing: "border-box",
            boxShadow: isDark ? "0 25px 60px rgba(0,0,0,0.5)" : "0 25px 60px rgba(0,0,0,0.1)",
          }}>
            {/* Header */}
            <div style={{
              background: "#3B82F6",
              padding: "24px 28px 20px",
              borderRadius: "20px 20px 0 0",
              position: "relative",
            }}>
              <button
                onClick={() => setModalOpen(false)}
                style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#fff", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ✕
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                {form.id_experiencia ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                )}
                <h3 style={{ margin: 0, color: "#fff", fontSize: 19, fontWeight: 800 }}>{form.id_experiencia ? "Editar" : "Añadir"} Experiencia</h3>
              </div>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
                {form.id_experiencia ? "Modifica los datos de esta experiencia" : "Registra una nueva experiencia laboral o académica"}
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: "24px 28px 28px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={lbl}>Tipo</label>
                <select style={inp} value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
                  <option value="laboral">Laboral</option>
                  <option value="academica">Académica</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Institución o Empresa</label>
                <input style={inp} type="text" value={form.institucion_empresa} onChange={e => setForm({...form, institucion_empresa: e.target.value})} />
              </div>
              <div>
                <label style={lbl}>Cargo o Título</label>
                <input style={inp} type="text" value={form.cargo_titulo} onChange={e => setForm({...form, cargo_titulo: e.target.value})} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Fecha de Inicio</label>
                  <input style={inp} type="date" value={form.fecha_inicio} onChange={e => setForm({...form, fecha_inicio: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Fecha de Fin (Opcional)</label>
                  <input style={inp} type="date" value={form.fecha_fin} onChange={e => setForm({...form, fecha_fin: e.target.value})} />
                </div>
              </div>
              <div>
                <label style={lbl}>Descripción (Opcional)</label>
                <textarea style={{...inp, resize: "vertical"}} rows={3} value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button onClick={() => setModalOpen(false)} style={{ background: "none", border: `1px solid ${border}`, color: text, borderRadius: 10, padding: "10px 22px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Cancelar</button>
              <button onClick={saveExp} disabled={saving} style={{ background: "#3B82F6", color: "#fff", border: "none", borderRadius: 10, padding: "10px 28px", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, boxShadow: "0 4px 14px rgba(59,130,246,0.3)" }}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
