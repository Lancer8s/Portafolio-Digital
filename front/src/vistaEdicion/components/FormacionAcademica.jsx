import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { experienciaAPI } from "../../api";
import lapizClaro from "../../assets/lapizClaro.png";
import lapizOscuro from "../../assets/lapizOscuro.png";

const NIVELES = ["Técnico", "Tecnólogo", "Pregrado", "Posgrado", "Maestría", "Doctorado", "Diplomado", "Curso"];
const MAX_LENGTHS = {
  cargo_titulo: 150,
  institucion_empresa: 150,
  descripcion: 500,
  url_certificado: 255,
};

const formatDate = (dateStr) => {
  if (!dateStr) return "Actualidad";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-BO", { year: "numeric", month: "short" });
};

const formatAcademicDates = (exp) => {
  if (!exp.fecha_inicio && exp.fecha_fin) return `Fecha de emisión: ${formatDate(exp.fecha_fin)}`;
  if (!exp.fecha_inicio && !exp.fecha_fin) return "Sin fecha registrada";
  return `${formatDate(exp.fecha_inicio)} — ${exp.fecha_fin ? formatDate(exp.fecha_fin) : "Actualidad"}`;
};

const NIVEL_COLORS = {
  "Técnico":   { bg: "rgba(59,130,246,0.12)",  text: "#3B82F6" },
  "Tecnólogo": { bg: "rgba(99,102,241,0.12)",  text: "#6366f1" },
  "Pregrado":  { bg: "rgba(16,185,129,0.12)",  text: "#10b981" },
  "Posgrado":  { bg: "rgba(245,158,11,0.12)",  text: "#f59e0b" },
  "Maestría":  { bg: "rgba(168,85,247,0.12)",  text: "#a855f7" },
  "Doctorado": { bg: "rgba(236,72,153,0.12)",  text: "#ec4899" },
  "Diplomado": { bg: "rgba(6,182,212,0.12)",   text: "#06b6d4" },
  "Curso":     { bg: "rgba(107,114,128,0.12)", text: "#6b7280" },
};

const EMPTY_FORM = {
  id_experiencia: null,
  tipo: "academica",
  cargo_titulo: "",
  institucion_empresa: "",
  nivel_academico: "",
  fecha_inicio: "",
  fecha_fin: "",
  actualmente: false,
  descripcion: "",
  url_certificado: "",
};

export default function FormacionAcademica({ isDark }) {
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
        const academicas = (data.experiencias || [])
          .filter((e) => e.tipo === "academica")
          .sort((a, b) => new Date(b.fecha_inicio || b.fecha_fin || 0) - new Date(a.fecha_inicio || a.fecha_fin || 0));
        setItems(academicas);
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
      tipo: "academica",
      cargo_titulo: exp.cargo_titulo || "",
      institucion_empresa: exp.institucion_empresa || "",
      nivel_academico: exp.nivel_academico || "",
      fecha_inicio: exp.fecha_inicio ? String(exp.fecha_inicio).split("T")[0] : "",
      fecha_fin: exp.fecha_fin ? String(exp.fecha_fin).split("T")[0] : "",
      actualmente: !exp.fecha_fin,
      descripcion: exp.descripcion || "",
      url_certificado: exp.url_certificado || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.cargo_titulo.trim())        { showToast("El título es obligatorio", "error"); return; }
    if (!form.institucion_empresa.trim()) { showToast("La institución es obligatoria", "error"); return; }
    if (!form.nivel_academico)            { showToast("Selecciona un nivel académico", "error"); return; }
    if (!form.actualmente && form.fecha_inicio && form.fecha_fin && form.fecha_fin < form.fecha_inicio) {
      showToast("La fecha de fin no puede ser anterior al inicio", "error"); return;
    }

    setSaving(true);
    try {
      const payload = {
        tipo: "academica",
        cargo_titulo: form.cargo_titulo.trim(),
        institucion_empresa: form.institucion_empresa.trim(),
        nivel_academico: form.nivel_academico,
        fecha_inicio: form.fecha_inicio || null,
        fecha_fin: form.actualmente ? null : (form.fecha_fin || null),
        descripcion: form.descripcion.trim() || null,
        url_certificado: form.url_certificado.trim() || null,
      };

      let res;
      if (form.id_experiencia) {
        res = await experienciaAPI.actualizar(form.id_experiencia, payload);
      } else {
        res = await experienciaAPI.crear(payload);
      }

      if (res.data.ok) {
        showToast(form.id_experiencia ? "Formación actualizada" : "Formación guardada");
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
    if (!confirm("¿Eliminar esta formación académica?")) return;
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
          Formación Académica
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {addBtn("Añadir Formación", openAdd)}
          {items.length > 0 && editBtn("Editar Formación", () => { setIsEditing(!isEditing); setIsDeleting(false); })}
          {items.length > 0 && deleteBtn("Eliminar Formación", () => { setIsDeleting(!isDeleting); setIsEditing(false); })}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: sub }}>Cargando...</div>
      ) : items.length === 0 ? (
        <div style={{ background: box, border: `1px dashed ${border}`, borderRadius: 14, padding: "40px 24px", textAlign: "center" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={sub} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 12px", display: "block" }}>
            <path d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
          <p style={{ color: sub, fontSize: 14, margin: 0 }}>No hay formación académica registrada</p>
          <p style={{ color: sub, fontSize: 12, margin: "4px 0 0", opacity: 0.7 }}>Añade tus títulos, cursos y certificaciones</p>
        </div>
      ) : (
        <div style={{ position: "relative", paddingLeft: 26 }}>
          <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 2, background: "linear-gradient(to bottom, #a855f7, #6366f1 70%, transparent)", borderRadius: 2 }} />
          {items.map((exp, i) => {
            const nc = NIVEL_COLORS[exp.nivel_academico] || { bg: "rgba(107,114,128,0.12)", text: "#6b7280" };
            return (
              <motion.div
                key={exp.id_experiencia}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                style={{ position: "relative", marginBottom: i < items.length - 1 ? 14 : 0 }}
              >
                <div style={{ position: "absolute", left: -21, top: 14, width: 12, height: 12, borderRadius: "50%", background: "#a855f7", border: `2px solid ${isDark ? "#020617" : "#F1F5F9"}`, boxShadow: "0 0 0 3px rgba(168,85,247,0.2)" }} />
                <div style={{ background: box, border: `1px solid ${border}`, borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        {exp.nivel_academico && (
                          <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "2px 8px", borderRadius: 4, background: nc.bg, color: nc.text }}>
                            {exp.nivel_academico}
                          </span>
                        )}
                        {!exp.fecha_fin && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "2px 8px", borderRadius: 4, background: "rgba(16,185,129,0.12)", color: "#10b981" }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                            En curso
                          </span>
                        )}
                        <span style={{ color: sub, fontSize: 11 }}>
                          {formatAcademicDates(exp)}
                        </span>
                      </div>
                      <h4 style={{ color: text, fontSize: 15, margin: "2px 0 2px", fontWeight: 700 }}>{exp.cargo_titulo}</h4>
                      <p style={{ color: "#a855f7", fontSize: 13, margin: 0, fontWeight: 600 }}>{exp.institucion_empresa}</p>
                      {exp.descripcion && (
                        <p style={{ color: text, fontSize: 12, margin: "8px 0 0", whiteSpace: "pre-wrap", opacity: 0.8, lineHeight: 1.5 }}>{exp.descripcion}</p>
                      )}
                      {exp.url_certificado && (
                        <a href={exp.url_certificado} target="_blank" rel="noreferrer" style={{ color: "#3B82F6", fontSize: 12, fontWeight: 700, display: "inline-block", marginTop: 8, textDecoration: "none" }}>
                          Ver certificado
                        </a>
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
            );
          })}
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
                    <path d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                  <h3 style={{ margin: 0, color: "#fff", fontSize: 19, fontWeight: 800 }}>
                    {form.id_experiencia ? "Editar" : "Añadir"} Formación Académica
                  </h3>
                </div>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
                  {form.id_experiencia ? "Modifica los datos de esta formación" : "Completa los detalles de tu formación académica"}
                </p>
              </div>

              {/* Modal Body */}
              <div style={{ padding: "24px 26px 26px", display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={lbl}>Título <span style={required}>*</span></label>
                  <input style={inp} type="text" maxLength={MAX_LENGTHS.cargo_titulo} value={form.cargo_titulo} onChange={(e) => setForm({ ...form, cargo_titulo: e.target.value })} placeholder="Ej: Ingeniería Informática" />
                </div>

                <div>
                  <label style={lbl}>Institución <span style={required}>*</span></label>
                  <input style={inp} type="text" maxLength={MAX_LENGTHS.institucion_empresa} value={form.institucion_empresa} onChange={(e) => setForm({ ...form, institucion_empresa: e.target.value })} placeholder="Ej: Universidad Nacional" />
                </div>

                <div>
                  <label style={lbl}>Nivel <span style={required}>*</span></label>
                  <select style={inp} value={form.nivel_academico} onChange={(e) => setForm({ ...form, nivel_academico: e.target.value })}>
                    <option value="">Selecciona un nivel</option>
                    {NIVELES.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={lbl}>Fecha Inicio</label>
                    <input style={inp} type="date" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={lbl}>Fecha Fin</label>
                    <input style={{ ...inp, opacity: form.actualmente ? 0.4 : 1 }} type="date" value={form.actualmente ? "" : form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} disabled={form.actualmente} />
                  </div>
                </div>
                <p style={{ color: sub, fontSize: 12, margin: "-8px 0 0", lineHeight: 1.45 }}>
                  Para cursos o certificaciones, puedes dejar la fecha de inicio en blanco y usar «Fecha Fin» como la fecha de emisión
                </p>

                <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", userSelect: "none" }}>
                  <input type="checkbox" checked={form.actualmente} onChange={(e) => setForm({ ...form, actualmente: e.target.checked, fecha_fin: "" })} style={{ width: 15, height: 15, accentColor: "#3B82F6", cursor: "pointer" }} />
                  <span style={{ color: text, fontSize: 13, fontWeight: 500 }}>Actualmente estudiando aquí</span>
                </label>

                <div>
                  <label style={lbl}>Descripción</label>
                  <textarea style={{ ...inp, resize: "vertical", lineHeight: 1.55 }} rows={4} maxLength={MAX_LENGTHS.descripcion} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Describe lo que aprendiste o destacaste..." />
                </div>

                <div>
                  <label style={lbl}>URL del Certificado (Opcional)</label>
                  <input style={inp} type="url" maxLength={MAX_LENGTHS.url_certificado} value={form.url_certificado} onChange={(e) => setForm({ ...form, url_certificado: e.target.value })} placeholder="Link a tu credencial de AWS, Google, etc." />
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
