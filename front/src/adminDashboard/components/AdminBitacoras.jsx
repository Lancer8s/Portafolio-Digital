import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminAPI } from "../../api";

const TABS = [
  { id: "usuario", label: "Usuarios" },
  { id: "proyecto", label: "Proyectos" },
  { id: "habilidad", label: "Habilidades" },
  { id: "rol", label: "Roles" },
];

export default function AdminBitacoras({ isDark }) {
  const [tab, setTab] = useState("usuario");
  const [registros, setRegistros] = useState([]);
  const [paginacion, setPaginacion] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [filtros, setFiltros] = useState({ fecha_desde: "", fecha_hasta: "", accion: "", page: 1 });
  const [exporting, setExporting] = useState(false);

  const text = isDark ? "#F8FAFC" : "#0F172A";
  const sub = isDark ? "#94A3B8" : "#64748B";
  const cardBg = isDark ? "#0F172A" : "#FFFFFF";
  const border = isDark ? "#1E293B" : "#E2E8F0";
  const inputBg = isDark ? "#1E293B" : "#F8FAFC";

  useEffect(() => { fetchData(); }, [tab, filtros.page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getBitacoras(tab, filtros);
      if (res.ok) { setRegistros(res.registros); setPaginacion(res.paginacion); setResumen(res.resumen); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const applyFilters = () => { setFiltros(f => ({ ...f, page: 1 })); fetchData(); };
  const clearFilters = () => { setFiltros({ fecha_desde: "", fecha_hasta: "", accion: "", page: 1 }); };

  const handleExport = async () => {
    setExporting(true);
    try { await adminAPI.exportBitacora(tab, filtros); }
    catch (e) { console.error(e); alert("Error al exportar"); }
    finally { setExporting(false); }
  };

  const actionColors = { INSERT: "#10B981", UPDATE: "#3B82F6", DELETE: "#EF4444" };
  const actionLabels = { INSERT: "Inserción", UPDATE: "Actualización", DELETE: "Eliminación" };

  const inp = { background: inputBg, border: `1px solid ${border}`, color: text, borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: text, fontSize: 24, fontWeight: 800, margin: "0 0 6px" }}>Bitácoras de Auditoría</h1>
          <p style={{ color: sub, margin: 0, fontSize: 14 }}>Registro de todas las operaciones del sistema</p>
        </div>
        <button onClick={handleExport} disabled={exporting}
          style={{ background: isDark ? "#1E293B" : "#F1F5F9", border: `1px solid ${border}`, borderRadius: 8, padding: "8px 16px", color: text, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          {exporting ? "Exportando..." : "Exportar CSV"}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: isDark ? "#0F172A" : "#F1F5F9", borderRadius: 10, padding: 4, marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setFiltros(f => ({ ...f, page: 1 })); setExpandedId(null); }}
            style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.15s",
              background: tab === t.id ? (isDark ? "#1E293B" : "#fff") : "transparent",
              color: tab === t.id ? "#3B82F6" : sub,
              boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Resumen */}
      {resumen && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { label: "Total", value: resumen.total, color: sub },
            { label: "Inserciones", value: resumen.inserts, color: "#10B981" },
            { label: "Actualizaciones", value: resumen.updates, color: "#3B82F6" },
            { label: "Eliminaciones", value: resumen.deletes, color: "#EF4444" },
          ].map((s, i) => (
            <div key={i} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 18px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
              <span style={{ fontSize: 12, color: sub, fontWeight: 600 }}>{s.label}</span>
              <span style={{ fontSize: 16, color: text, fontWeight: 800 }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: 16, marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, color: sub, fontWeight: 600 }}>Desde</label>
          <input type="date" value={filtros.fecha_desde} onChange={e => setFiltros(f => ({ ...f, fecha_desde: e.target.value }))} style={inp} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, color: sub, fontWeight: 600 }}>Hasta</label>
          <input type="date" value={filtros.fecha_hasta} onChange={e => setFiltros(f => ({ ...f, fecha_hasta: e.target.value }))} style={inp} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, color: sub, fontWeight: 600 }}>Acción</label>
          <select value={filtros.accion} onChange={e => setFiltros(f => ({ ...f, accion: e.target.value }))} style={{ ...inp, appearance: "auto" }}>
            <option value="">Todas</option>
            <option value="INSERT">Inserción</option>
            <option value="UPDATE">Actualización</option>
            <option value="DELETE">Eliminación</option>
          </select>
        </div>
        <button onClick={applyFilters} style={{ background: "#3B82F6", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Filtrar</button>
        <button onClick={() => { clearFilters(); setTimeout(fetchData, 50); }} style={{ background: "transparent", color: sub, border: `1px solid ${border}`, borderRadius: 8, padding: "9px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Limpiar</button>
      </div>

      {/* Tabla */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ width: 32, height: 32, border: `3px solid ${border}`, borderTopColor: "#3B82F6", borderRadius: "50%" }} />
        </div>
      ) : registros.length === 0 ? (
        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: 50, textAlign: "center" }}>
          <p style={{ color: sub, fontSize: 14 }}>No se encontraron registros con los filtros aplicados.</p>
        </div>
      ) : (
        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, overflow: "hidden" }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "70px 100px 1fr 150px 90px 40px", gap: 8, padding: "12px 18px", borderBottom: `1px solid ${border}`, background: isDark ? "#0B1120" : "#F8FAFC" }}>
            {["ID", "Acción", "Descripción", "Actor", "Fecha", ""].map((h, i) => (
              <span key={i} style={{ fontSize: 11, color: sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</span>
            ))}
          </div>
          {/* Rows */}
          {registros.map(r => (
            <div key={r.id_bitacora}>
              <div onClick={() => setExpandedId(expandedId === r.id_bitacora ? null : r.id_bitacora)}
                style={{ display: "grid", gridTemplateColumns: "70px 100px 1fr 150px 90px 40px", gap: 8, padding: "12px 18px", borderBottom: `1px solid ${border}`, cursor: "pointer", transition: "background 0.1s",
                  background: expandedId === r.id_bitacora ? (isDark ? "rgba(59,130,246,0.05)" : "#F0F7FF") : "transparent" }}
                onMouseOver={e => { if (expandedId !== r.id_bitacora) e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.02)" : "#FAFAFA"; }}
                onMouseOut={e => { if (expandedId !== r.id_bitacora) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ fontSize: 13, color: sub, fontWeight: 500 }}>#{r.id_bitacora}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: actionColors[r.accion] || sub, background: `${actionColors[r.accion] || sub}18`, padding: "2px 8px", borderRadius: 6, textAlign: "center", alignSelf: "center" }}>
                  {actionLabels[r.accion] || r.accion}
                </span>
                <span style={{ fontSize: 13, color: text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.descripcion}</span>
                <span style={{ fontSize: 12, color: sub }}>{r.actor_nombre ? `${r.actor_nombre} ${r.actor_apellido || ""}`.trim() : "Sistema"}</span>
                <span style={{ fontSize: 12, color: sub }}>{r.fecha}</span>
                <span style={{ fontSize: 14, color: sub, textAlign: "center", transform: expandedId === r.id_bitacora ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
              </div>
              <AnimatePresence>
                {expandedId === r.id_bitacora && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                    style={{ overflow: "hidden", borderBottom: `1px solid ${border}` }}>
                    <div style={{ padding: "16px 18px", background: isDark ? "rgba(15,23,42,0.7)" : "#F8FAFC", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <p style={{ fontSize: 11, color: sub, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>Valor Anterior</p>
                        <pre style={{ background: isDark ? "#0B1120" : "#fff", border: `1px solid ${border}`, borderRadius: 8, padding: 12, fontSize: 12, color: "#EF4444", overflow: "auto", maxHeight: 200, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                          {r.valor_anterior ? JSON.stringify(r.valor_anterior, null, 2) : "—"}
                        </pre>
                      </div>
                      <div>
                        <p style={{ fontSize: 11, color: sub, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>Valor Nuevo</p>
                        <pre style={{ background: isDark ? "#0B1120" : "#fff", border: `1px solid ${border}`, borderRadius: 8, padding: 12, fontSize: 12, color: "#10B981", overflow: "auto", maxHeight: 200, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                          {r.valor_nuevo ? JSON.stringify(r.valor_nuevo, null, 2) : "—"}
                        </pre>
                      </div>
                    </div>
                    <div style={{ padding: "8px 18px 12px", display: "flex", gap: 16, fontSize: 12, color: sub }}>
                      <span>📧 {r.actor_email || "N/A"}</span>
                      <span>🕐 {r.hora}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Paginación */}
      {paginacion && paginacion.total_paginas > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 20 }}>
          <button disabled={paginacion.pagina_actual <= 1} onClick={() => setFiltros(f => ({ ...f, page: f.page - 1 }))}
            style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${border}`, background: cardBg, color: text, cursor: paginacion.pagina_actual <= 1 ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, opacity: paginacion.pagina_actual <= 1 ? 0.4 : 1 }}>← Anterior</button>
          <span style={{ color: sub, fontSize: 13 }}>
            Página {paginacion.pagina_actual} de {paginacion.total_paginas} ({paginacion.total_registros} registros)
          </span>
          <button disabled={paginacion.pagina_actual >= paginacion.total_paginas} onClick={() => setFiltros(f => ({ ...f, page: f.page + 1 }))}
            style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${border}`, background: cardBg, color: text, cursor: paginacion.pagina_actual >= paginacion.total_paginas ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, opacity: paginacion.pagina_actual >= paginacion.total_paginas ? 0.4 : 1 }}>Siguiente →</button>
        </div>
      )}
    </div>
  );
}
