

export default function StatsBar({ userData, isDark }) {
  const border = isDark ? "#1D283A" : "#E2E8F0";
  const text   = isDark ? "#fff"    : "#111";
  const sub    = isDark ? "#94a3b8" : "#807F81";
  const bg     = isDark ? "#0F172A" : "#fff";

  const stats = [
    { label: "Habilidades Técnicas", value: (userData?.techSkills || []).length },
    { label: "Habilidades Blandas",  value: (userData?.softSkills || []).length },
    { label: "Proyectos",            value: (userData?.proyectos  || []).length },
    { label: "Nivel Promedio",
      value: (userData?.techSkills || []).length > 0
        ? Math.round((userData.techSkills.reduce((a, s) => a + s.nivel, 0)) / userData.techSkills.length) + "%"
        : "—"
    },
  ];

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
      gap: 12, margin: "0 16px 28px",
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          background: bg, border: `1px solid ${border}`,
          borderRadius: 10, padding: "16px 12px", textAlign: "center",
          boxShadow: isDark ? "none" : "0 2px 8px rgba(0,0,0,0.06)",
        }}>
          <p style={{ color: "#3B82F6", fontWeight: 800, fontSize: 26 }}>{s.value}</p>
          <p style={{ color: sub, fontSize: 12, marginTop: 4 }}>{s.label}</p>
        </div>
      ))}
    </div>
  );
}