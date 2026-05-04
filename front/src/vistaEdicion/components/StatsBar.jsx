

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
    <>
      <style>{`
        @media (max-width: 768px) {
          .stats-container { flex-direction: row !important; flex-wrap: wrap !important; height: auto !important; overflow-y: visible !important; }
          .stats-container h3 { width: 100%; }
        }
      `}</style>
      <div className="stats-container" style={{
        display: "flex", flexDirection: "column",
        gap: 12, height: "100%", overflowY: "auto", paddingRight: "10px",
        scrollbarWidth: "none", msOverflowStyle: "none"
      }}>
      {/* Título de la sección para el sidebar */}
      <h3 style={{ color: text, fontSize: 16, fontWeight: 800, margin: "10px 0 10px 4px", textTransform: "uppercase", letterSpacing: "1px" }}>Estadísticas</h3>
      {stats.map((s, i) => (
        <div key={i} style={{
          background: bg, border: `1px solid ${border}`,
          borderRadius: 12, padding: "14px 16px", textAlign: "left",
          boxShadow: isDark ? "none" : "0 2px 8px rgba(0,0,0,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <p style={{ color: sub, fontSize: 13, margin: 0, fontWeight: 500 }}>{s.label}</p>
          <p style={{ color: "#3B82F6", fontWeight: 800, fontSize: 20, margin: 0 }}>{s.value}</p>
        </div>
      ))}

      {/* Redes Sociales */}
      {(userData?.redes_sociales?.length > 0 || userData?.linkedin_url || userData?.github_url) && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ color: text, fontSize: 14, fontWeight: 800, margin: "0 0 10px 4px", textTransform: "uppercase", letterSpacing: "1px" }}>Redes Sociales</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Retrocompatibilidad con DB original */}
            {userData?.linkedin_url && (
              <a href={userData.linkedin_url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "#3B82F6", fontSize: 13, display: "flex", alignItems: "center", gap: 8, background: bg, padding: "10px 12px", borderRadius: 8, border: `1px solid ${border}` }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg> LinkedIn
              </a>
            )}
            {userData?.github_url && (
              <a href={userData.github_url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "#3B82F6", fontSize: 13, display: "flex", alignItems: "center", gap: 8, background: bg, padding: "10px 12px", borderRadius: 8, border: `1px solid ${border}` }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg> GitHub
              </a>
            )}
            {/* Nuevas redes dinámicas */}
            {(userData?.redes_sociales || []).map((red, i) => red.url && (
              <a key={i} href={red.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "#3B82F6", fontSize: 13, display: "flex", alignItems: "center", gap: 8, background: bg, padding: "10px 12px", borderRadius: 8, border: `1px solid ${border}` }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> {red.plataforma || "Enlace"}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
    </>
  );
}