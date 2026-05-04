import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { experienciaAPI } from "../../api";
import lapizClaro from "../../assets/lapizClaro.png";
import lapizOscuro from "../../assets/lapizOscuro.png";

export default function ExperienciaList({ isDark }) {
  const [experiencias, setExperiencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ id_experiencia: null, tipo: "laboral", institucion_empresa: "", cargo_titulo: "", fecha_inicio: "", fecha_fin: "", descripcion: "" });
  const [toast, setToast] = useState(null);

  const text = isDark ? "#fff" : "#111";
  const sub = isDark ? "#94a3b8" : "#807F81";
  const border = isDark ? "#1D283A" : "#E2E8F0";
  const box = isDark ? "#0F172A" : "#F8FAFC";
  const lapiz = isDark ? lapizClaro : lapizOscuro;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await experienciaAPI.listar();
      if (data.ok) {
        setExperiencias(data.experiencias || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
    color: text,
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };
  const lbl = { color: sub, fontSize: 12, marginBottom: 4, display: "block" };

  return (
    <div style={{ marginBottom: 40 }}>
      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: toast.type === "success" ? "#16a34a" : "#ef4444", color: "#fff", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 14, zIndex: 999 }}>
          {toast.msg}
        </div>
      )}

      <button onClick={handleAddNew} style={{ background: "none", border: "none", cursor: "pointer", color: "#3B82F6", fontWeight: 700, fontSize: 17, display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: 0 }}>
        <span style={{ fontSize: 22 }}>+</span> Añadir Experiencia o Formación
      </button>

      {experiencias.length === 0 ? (
        <p style={{ color: sub, fontSize: 13 }}>No hay experiencia registrada aún.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {experiencias.map(exp => (
            <div key={exp.id_experiencia} style={{ background: box, border: `1px solid ${border}`, borderRadius: 10, padding: 16, position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ color: "#3B82F6", fontSize: 12, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
                    {exp.tipo === "laboral" ? "Laboral" : "Académica"}
                  </div>
                  <h3 style={{ color: text, fontSize: 16, margin: "0 0 4px 0" }}>{exp.cargo_titulo}</h3>
                  <div style={{ color: sub, fontSize: 14, marginBottom: 8 }}>{exp.institucion_empresa}</div>
                  <div style={{ color: sub, fontSize: 12, marginBottom: 8 }}>
                    {exp.fecha_inicio} — {exp.fecha_fin ? exp.fecha_fin : "Actualidad"}
                  </div>
                  {exp.descripcion && <p style={{ color: text, fontSize: 13, margin: 0, whiteSpace: "pre-wrap" }}>{exp.descripcion}</p>}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => handleEdit(exp)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                    <img src={lapiz} alt="editar" style={{ width: 14, height: 14 }} />
                  </button>
                  <button onClick={() => deleteExp(exp.id_experiencia)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontWeight: "bold" }}>
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: isDark ? "#0F172A" : "#fff", border: `1px solid ${border}`, borderRadius: 14, padding: 24, width: "100%", maxWidth: 480 }}>
            <h3 style={{ color: text, margin: "0 0 20px 0", fontSize: 18 }}>{form.id_experiencia ? "Editar" : "Añadir"} Experiencia</h3>
            
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
              <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", color: text, cursor: "pointer", fontWeight: 600 }}>Cancelar</button>
              <button onClick={saveExp} disabled={saving} style={{ background: "#3B82F6", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
