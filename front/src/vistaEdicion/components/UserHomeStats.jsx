import { motion } from "framer-motion";

export default function UserHomeStats({ userData, isDark }) {
  const text = isDark ? "#F8FAFC" : "#0F172A";
  const sub = isDark ? "#94A3B8" : "#64748B";
  const cardBg = isDark ? "#0F172A" : "#FFFFFF";
  const border = isDark ? "#1E293B" : "#E2E8F0";

  const techSkills = userData?.techSkills || [];
  const softSkills = userData?.softSkills || [];
  const proyectos = userData?.proyectos || [];

  const avgLevel = techSkills.length > 0 ? Math.round(techSkills.reduce((a, s) => a + s.nivel, 0) / techSkills.length) : 0;

  const stats = [
    { label: "Habilidades Técnicas", value: techSkills.length, color: "#3B82F6", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    { label: "Habilidades Blandas", value: softSkills.length, color: "#8B5CF6", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
    { label: "Proyectos", value: proyectos.length, color: "#10B981", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
    { label: "Nivel Promedio", value: avgLevel + "%", color: "#F59E0B", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  ];

  // Profile completion
  let completion = 0;
  if (userData?.titulo) completion += 20;
  if (userData?.telefono) completion += 20;
  if (userData?.biografia) completion += 20;
  if (userData?.foto_url || userData?.preview) completion += 20;
  if (techSkills.length > 0 || softSkills.length > 0) completion += 10;
  if (proyectos.length > 0) completion += 10;

  // Group tech skills by category for chart
  const skillsByCategory = {};
  techSkills.forEach(s => {
    const cat = s.categoria || "Otras";
    if (!skillsByCategory[cat]) skillsByCategory[cat] = [];
    skillsByCategory[cat].push(s);
  });

  return (
    <div>
      <h1 style={{ color: text, fontSize: 24, fontWeight: 800, margin: "0 0 6px" }}>
        Bienvenido, {userData?.nombreCompleto || "Usuario"} 👋
      </h1>
      <p style={{ color: sub, margin: "0 0 28px", fontSize: 14 }}>
        Resumen de tu portafolio digital
      </p>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: "18px 16px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: s.color, borderRadius: "14px 0 0 14px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={s.icon} /></svg>
              </div>
              <p style={{ color: sub, fontSize: 12, fontWeight: 600, margin: 0 }}>{s.label}</p>
            </div>
            <p style={{ color: text, fontSize: 26, fontWeight: 800, margin: 0 }}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
        {/* Profile Completion */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: 24 }}>
          <h3 style={{ color: text, fontSize: 15, fontWeight: 700, margin: "0 0 18px" }}>Completitud del Perfil</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <svg width="90" height="90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r="38" fill="none" stroke={isDark ? "#1E293B" : "#E2E8F0"} strokeWidth="7" />
                <motion.circle cx="45" cy="45" r="38" fill="none"
                  stroke={completion >= 100 ? "#10B981" : "#3B82F6"} strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 38}
                  initial={{ strokeDashoffset: 2 * Math.PI * 38 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 38 * (1 - completion / 100) }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  style={{ transform: "rotate(-90deg)", transformOrigin: "center" }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: completion >= 100 ? "#10B981" : "#3B82F6", fontWeight: 800, fontSize: 22 }}>{completion}%</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              {[
                { l: "Datos personales", d: !!(userData?.titulo && userData?.telefono) },
                { l: "Biografía", d: !!userData?.biografia },
                { l: "Foto de perfil", d: !!(userData?.foto_url || userData?.preview) },
                { l: "Habilidades", d: techSkills.length > 0 || softSkills.length > 0 },
                { l: "Proyectos", d: proyectos.length > 0 },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  {item.d ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  ) : (
                    <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${isDark ? "#334155" : "#CBD5E1"}` }} />
                  )}
                  <span style={{ fontSize: 12, color: item.d ? sub : text, textDecoration: item.d ? "line-through" : "none", fontWeight: item.d ? 400 : 500 }}>{item.l}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Skills Distribution */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: 24 }}>
          <h3 style={{ color: text, fontSize: 15, fontWeight: 700, margin: "0 0 18px" }}>Distribución de Habilidades</h3>
          {techSkills.length === 0 ? (
            <p style={{ color: sub, fontSize: 13 }}>Agrega habilidades técnicas para ver la distribución.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {techSkills.slice(0, 6).map((s, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: text, fontWeight: 500 }}>{s.nombre}</span>
                    <span style={{ fontSize: 12, color: sub }}>{s.nivel}%</span>
                  </div>
                  <div style={{ height: 6, background: isDark ? "#1E293B" : "#E2E8F0", borderRadius: 99 }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${s.nivel}%` }} transition={{ duration: 0.7, delay: i * 0.08 }}
                      style={{ height: "100%", background: `hsl(${220 + i * 20}, 80%, 55%)`, borderRadius: 99 }} />
                  </div>
                </div>
              ))}
              {techSkills.length > 6 && (
                <p style={{ color: sub, fontSize: 12, margin: 0, fontStyle: "italic" }}>+{techSkills.length - 6} más</p>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Activity / Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: 24 }}>
        <h3 style={{ color: text, fontSize: 15, fontWeight: 700, margin: "0 0 18px" }}>Resumen Rápido</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {[
            { label: "Redes Sociales", value: (userData?.redes_sociales?.length || 0) + (userData?.linkedin_url ? 1 : 0) + (userData?.github_url ? 1 : 0), icon: "🔗" },
            { label: "Visibilidad", value: userData?.visibilidad === "publico" ? "Público" : "Privado", icon: userData?.visibilidad === "publico" ? "🌐" : "🔒" },
            { label: "Verificación", value: userData?.ci_estado === "Verificado" ? "Verificado ✓" : userData?.ci_estado || "Sin solicitar", icon: "🪪" },
          ].map((item, i) => (
            <div key={i} style={{ background: isDark ? "rgba(30,41,59,0.5)" : "#F8FAFC", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <div>
                <p style={{ color: sub, fontSize: 11, fontWeight: 600, margin: 0, textTransform: "uppercase" }}>{item.label}</p>
                <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "2px 0 0" }}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
