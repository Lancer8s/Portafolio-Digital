

import { useState } from "react";
import { createPortal } from "react-dom";
import { perfilAPI } from "../../api";
import { useApp } from "../../context/AppContext";

// TODO: Manejar caso donde los datos del usuario aún no se han cargado
// para evitar mostrar "0" momentáneamente antes de que llegue la respuesta API.
export default function StatsBar({ userData, isDark }) {
  const { debouncedRefresh } = useApp();
  const [showRedesModal, setShowRedesModal] = useState(false);
  const [redesForm, setRedesForm] = useState([]);
  const [savingRedes, setSavingRedes] = useState(false);

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
      <div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 0 10px 4px" }}>
          <h3 style={{ color: text, fontSize: 14, fontWeight: 800, margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>Redes Sociales</h3>
          <button 
            onClick={() => {
              setRedesForm(userData?.redes_sociales || []);
              setShowRedesModal(true);
            }} 
            style={{ background: "none", border: "none", cursor: "pointer", color: "#3B82F6", fontSize: 20, padding: 0, fontWeight: "bold" }}
          >
            +
          </button>
        </div>
        {(userData?.redes_sociales?.length > 0 || userData?.linkedin_url || userData?.github_url) && (
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
            {(userData?.redes_sociales || []).map((red, i) => {
              if (!red.url) return null;
              
              // Determinar el icono según el nombre o URL
              const urlStr = red.url.toLowerCase();
              const platName = (red.plataforma || "").toLowerCase();
              let icon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
              
              if (urlStr.includes("instagram") || platName.includes("instagram")) {
                icon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>;
              } else if (urlStr.includes("facebook") || platName.includes("facebook")) {
                icon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
              } else if (urlStr.includes("twitter") || urlStr.includes("x.com") || platName.includes("twitter") || platName === "x") {
                icon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>;
              } else if (urlStr.includes("youtube") || platName.includes("youtube")) {
                icon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>;
              } else if (urlStr.includes("tiktok") || platName.includes("tiktok")) {
                icon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5v3a8 8 0 0 1-5-1.5z"/></svg>;
              } else if (urlStr.includes("mailto:") || platName.includes("correo") || platName.includes("mail")) {
                icon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
              } else if (urlStr.includes("linkedin") || platName.includes("linkedin")) {
                icon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>;
              } else if (urlStr.includes("github") || platName.includes("github")) {
                icon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>;
              }

              return (
                <a key={i} href={red.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "#3B82F6", fontSize: 13, display: "flex", alignItems: "center", gap: 8, background: bg, padding: "10px 12px", borderRadius: 8, border: `1px solid ${border}` }}>
                  {icon} {red.plataforma || "Enlace"}
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Redes Sociales */}
      {showRedesModal && createPortal(
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999, padding: 20 }}>
          <div style={{ background: isDark ? "#0F172A" : "#fff", border: `1px solid ${border}`, borderRadius: 14, padding: 24, width: "100%", maxWidth: 400, maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ color: text, fontWeight: 700, margin: "0 0 20px 0" }}>Redes Sociales</h3>
            
            {redesForm.map((red, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <input
                  placeholder="URL (ej. https://linkedin.com/in/tu-perfil)"
                  value={red.url}
                  onChange={(e) => {
                    const newR = [...redesForm];
                    const val = e.target.value;
                    newR[i].url = val;
                    
                    let plat = "Enlace";
                    const lowVal = val.toLowerCase();
                    if (lowVal.includes("instagram")) plat = "Instagram";
                    else if (lowVal.includes("facebook")) plat = "Facebook";
                    else if (lowVal.includes("twitter") || lowVal.includes("x.com")) plat = "X (Twitter)";
                    else if (lowVal.includes("youtube")) plat = "YouTube";
                    else if (lowVal.includes("linkedin")) plat = "LinkedIn";
                    else if (lowVal.includes("github")) plat = "GitHub";
                    else if (lowVal.includes("tiktok")) plat = "TikTok";
                    else if (lowVal.includes("mail") || lowVal.includes("@")) plat = "Correo";
                    
                    newR[i].plataforma = plat;
                    setRedesForm(newR);
                  }}
                  style={{ flex: 1, background: isDark ? "#1D283A" : "#F8FAFC", border: `1px solid ${border}`, color: text, borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none", minWidth: 0 }}
                />
                <button
                  onClick={() => setRedesForm(redesForm.filter((_, idx) => idx !== i))}
                  style={{ background: "none", border: "none", color: "#ef4444", fontSize: 16, cursor: "pointer", fontWeight: "bold" }}
                >
                  ✕
                </button>
              </div>
            ))}
            
            <button
              onClick={() => setRedesForm([...redesForm, { plataforma: "", url: "" }])}
              style={{ background: "none", border: "none", color: "#3B82F6", fontWeight: 700, cursor: "pointer", fontSize: 14, padding: 0, marginBottom: 20 }}
            >
              + Añadir otra red
            </button>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setShowRedesModal(false)}
                style={{ background: "none", border: "none", color: sub, cursor: "pointer", fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button
                disabled={savingRedes}
                onClick={async () => {
                  setSavingRedes(true);
                  try {
                    const validRedes = redesForm.filter(r => r.url.trim());
                    await perfilAPI.actualizar({
                      nombre: userData.nombreCompleto,
                      apellido: userData.apellidoCompleto,
                      redes_sociales: validRedes
                    });
                    debouncedRefresh();
                    setShowRedesModal(false);
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setSavingRedes(false);
                  }
                }}
                style={{ background: "#3B82F6", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 600 }}
              >
                {savingRedes ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
    </>
  );
}