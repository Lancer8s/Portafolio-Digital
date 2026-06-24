import { useState, useEffect } from "react";
import { motion as Motion } from "framer-motion";
import { adminAPI } from "../../api";

export default function AdminEstadisticas({ isDark }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const text = isDark ? "#F8FAFC" : "#0F172A";
  const sub = isDark ? "#94A3B8" : "#64748B";
  const cardBg = isDark ? "#0F172A" : "#FFFFFF";
  const border = isDark ? "#1E293B" : "#E2E8F0";

  useEffect(() => {
    adminAPI.getEstadisticas()
      .then(r => { if (r.ok) setStats(r); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
      <Motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{ width: 36, height: 36, border: `3px solid ${border}`, borderTopColor: "#3B82F6", borderRadius: "50%" }} />
    </div>
  );

  if (!stats) return <p style={{ color: sub }}>Error al cargar estadísticas.</p>;

  const e = stats.estadisticas || {};
  const cards = [
    { label: "Total Usuarios", value: e.total_usuarios ?? 0, color: "#3B82F6", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2m22-4a4 4 0 01-4 4h-2" },
    { label: "Usuarios conectados (15 min)", value: e.usuarios_activos ?? 0, color: "#10B981", icon: "M9 12l2 2 4-4" },
    { label: "Total Proyectos", value: e.total_proyectos ?? 0, color: "#8B5CF6", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
    { label: "Proyectos completados", value: e.proyectos_completados ?? 0, color: "#10B981", icon: "M5 13l4 4L19 7" },
    { label: "Proyectos no completados", value: e.proyectos_no_completados ?? 0, color: "#F59E0B", icon: "M12 8v4l3 3" },
    { label: "Habilidades Registradas", value: e.habilidades_registradas ?? 0, color: "#EC4899", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    { label: "CI Pendientes", value: stats.ci_pendientes ?? 0, color: "#EF4444", icon: "M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  ];

  const maxRegistros = Math.max(...(stats.usuarios_por_mes || []).map(u => u.total), 1);
  const projectStateLabels = {
    planificado: "Planificados",
    en_desarrollo: "En desarrollo",
    pausado: "Pausados",
    completado: "Completados",
  };
  const projectStateColors = {
    planificado: "#F59E0B",
    en_desarrollo: "#3B82F6",
    pausado: "#94A3B8",
    completado: "#10B981",
  };
  const totalProyectosPorEstado = (stats.proyectos_por_estado || []).reduce((total, item) => total + Number(item.total), 0);

  return (
    <div>
      <h1 style={{ color: text, fontSize: 24, fontWeight: 800, margin: "0 0 6px" }}>Dashboard</h1>
      <p style={{ color: sub, margin: "0 0 28px", fontSize: 14 }}>Resumen general del sistema</p>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        {cards.map((c, i) => (
          <Motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: "20px 18px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: c.color, borderRadius: "14px 0 0 14px" }} />
            <p style={{ color: sub, fontSize: 12, fontWeight: 600, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>{c.label}</p>
            <p style={{ color: text, fontSize: 28, fontWeight: 800, margin: 0 }}>{c.value}</p>
          </Motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Usuarios por Mes */}
        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: 24 }}>
          <h3 style={{ color: text, fontSize: 15, fontWeight: 700, margin: "0 0 20px" }}>Registros por Mes</h3>
          {(stats.usuarios_por_mes || []).length === 0 ? (
            <p style={{ color: sub, fontSize: 13 }}>Sin datos aún.</p>
          ) : (
            <div style={{ display: "flex", alignItems: "stretch", gap: 10, height: 180, paddingTop: 8 }}>
              {(stats.usuarios_por_mes || []).map((m, i) => (
                <div key={m.periodo || i} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: text, fontWeight: 700 }}>{m.total}</span>
                  <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center", borderBottom: `1px solid ${border}` }}>
                    <Motion.div
                      initial={{ height: 0 }} animate={{ height: `${Math.max((Number(m.total) / maxRegistros) * 100, Number(m.total) > 0 ? 6 : 2)}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                      title={`${m.mes}: ${m.total} registro${Number(m.total) === 1 ? "" : "s"}`}
                      style={{ width: "min(38px, 75%)", background: "linear-gradient(180deg, #3B82F6, #6366F1)", borderRadius: "6px 6px 0 0", opacity: Number(m.total) > 0 ? 1 : 0.25 }} />
                  </div>
                  <span style={{ fontSize: 10, color: sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{m.mes}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Proyectos por Estado */}
        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: 24 }}>
          <h3 style={{ color: text, fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>Distribución de proyectos por estado</h3>
          <p style={{ color: sub, fontSize: 12, margin: "0 0 20px" }}>Situación actual de los {totalProyectosPorEstado} proyectos registrados</p>
          {(stats.proyectos_por_estado || []).length === 0 ? (
            <p style={{ color: sub, fontSize: 13 }}>Sin proyectos aún.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {(stats.proyectos_por_estado || []).map((p, i) => {
                const pct = totalProyectosPorEstado > 0 ? Math.round((Number(p.total) / totalProyectosPorEstado) * 100) : 0;
                return (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: text, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: projectStateColors[p.estado] || "#6366F1" }} />
                        {projectStateLabels[p.estado] || p.estado.replaceAll("_", " ")}
                      </span>
                      <span style={{ fontSize: 12, color: sub }}>{p.total} ({pct}%)</span>
                    </div>
                    <div style={{ height: 8, background: isDark ? "#1E293B" : "#E2E8F0", borderRadius: 99 }}>
                      <Motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                        style={{ height: "100%", background: projectStateColors[p.estado] || "#6366F1", borderRadius: 99 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
