import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { perfilAPI } from "../../api";
import { useApp } from "../../context/AppContext";

export default function StatsBar({ userData, isDark }) {
  const { debouncedRefresh } = useApp();
  const [showRedesModal, setShowRedesModal] = useState(false);
  const [redesForm, setRedesForm] = useState([]);
  const [savingRedes, setSavingRedes] = useState(false);

  const border = isDark ? "#1D283A" : "#E2E8F0";
  const text = isDark ? "#fff" : "#111";
  const sub = isDark ? "#94a3b8" : "#807F81";
  const bg = isDark ? "#0F172A" : "#fff";
  const cardBg = isDark ? "#111827" : "#F8FAFC";

  const openRedesModal = () => {
    setRedesForm(userData?.redes_sociales || []);
    setShowRedesModal(true);
  };

  useEffect(() => {
    const handleEditSocials = () => openRedesModal();
    window.addEventListener("portfolio:edit-socials", handleEditSocials);
    return () => window.removeEventListener("portfolio:edit-socials", handleEditSocials);
  }, [userData]);

  const stats = [
    {
      label: "Habilidades Técnicas",
      value: (userData?.techSkills || []).length,
      icon: "HT",
      desc: "registradas",
    },
    {
      label: "Habilidades Blandas",
      value: (userData?.softSkills || []).length,
      icon: "HB",
      desc: "registradas",
    },
    {
      label: "Proyectos",
      value: (userData?.proyectos || []).length,
      icon: "PR",
      desc: "en el portafolio",
    },
    {
      label: "Nivel Promedio",
      value:
        (userData?.techSkills || []).length > 0
          ? `${Math.round(
              userData.techSkills.reduce((a, s) => a + s.nivel, 0) /
                userData.techSkills.length
            )}%`
          : "—",
      icon: "NP",
      desc: "habilidades técnicas",
    },
  ];

  const modalInput = {
    flex: 1,
    background: isDark ? "#1D283A" : "#F8FAFC",
    border: `1px solid ${border}`,
    color: text,
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    outline: "none",
    minWidth: 0,
  };

  return (
    <>
      <style>{`
        .stats-top-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(150px, 1fr));
          gap: 14px;
        }
        @media (max-width: 980px) {
          .stats-top-grid {
            grid-template-columns: repeat(2, minmax(150px, 1fr));
          }
        }
        @media (max-width: 560px) {
          .stats-top-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <section
        style={{
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: 20,
          padding: 18,
          boxShadow: isDark ? "none" : "0 12px 32px rgba(15,23,42,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 14,
            marginBottom: 14,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h3
              style={{
                color: text,
                fontSize: 18,
                fontWeight: 900,
                margin: 0,
                letterSpacing: "0.02em",
              }}
            >
              Estadísticas del portafolio
            </h3>
            <p style={{ color: sub, fontSize: 12.5, margin: "4px 0 0" }}>
              Resumen general visible en la parte superior.
            </p>
          </div>
        </div>

        <div className="stats-top-grid">
          {stats.map((s, i) => (
            <div
              key={i}
              style={{
                background: cardBg,
                border: `1px solid ${border}`,
                borderRadius: 16,
                padding: "18px 18px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                minHeight: 86,
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isDark ? "rgba(59,130,246,0.16)" : "#EFF6FF",
                  fontSize: 13,
                  fontWeight: 900,
                  letterSpacing: "0.03em",
                  color: "#2563EB",
                  flexShrink: 0,
                }}
              >
                {s.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    color: "#3B82F6",
                    fontWeight: 900,
                    fontSize: 28,
                    lineHeight: 1,
                    margin: "0 0 5px",
                  }}
                >
                  {s.value}
                </p>
                <p style={{ color: text, fontSize: 13, fontWeight: 800, margin: 0 }}>
                  {s.label}
                </p>
                <p style={{ color: sub, fontSize: 11.5, margin: "2px 0 0" }}>
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {showRedesModal &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 999999,
              padding: 20,
            }}
            onClick={() => setShowRedesModal(false)}
          >
            <div
              style={{
                background: isDark ? "#0F172A" : "#fff",
                border: `1px solid ${border}`,
                borderRadius: 18,
                padding: 0,
                width: "100%",
                maxWidth: 440,
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: isDark
                  ? "0 25px 60px rgba(0,0,0,0.5)"
                  : "0 25px 60px rgba(0,0,0,0.1)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  background: "#3B82F6",
                  padding: "22px 24px 18px",
                  borderRadius: "18px 18px 0 0",
                  position: "relative",
                }}
              >
                <button
                  onClick={() => setShowRedesModal(false)}
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    background: "rgba(255,255,255,0.15)",
                    border: "none",
                    borderRadius: 8,
                    width: 32,
                    height: 32,
                    cursor: "pointer",
                    color: "#fff",
                    fontSize: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✕
                </button>
                <h3 style={{ color: "#fff", fontWeight: 800, margin: "0 0 5px" }}>
                  Redes profesionales
                </h3>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.78)", fontSize: 13 }}>
                  Agrega enlaces como LinkedIn, GitHub u otras redes.
                </p>
              </div>

              <div style={{ padding: 24 }}>
                {redesForm.length === 0 && (
                  <p style={{ color: sub, fontSize: 13, margin: "0 0 14px" }}>
                    Aún no tienes redes agregadas.
                  </p>
                )}

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
                      style={modalInput}
                    />
                    <button
                      onClick={() => setRedesForm(redesForm.filter((_, idx) => idx !== i))}
                      style={{
                        background: "rgba(239,68,68,0.12)",
                        border: "none",
                        color: "#ef4444",
                        fontSize: 16,
                        cursor: "pointer",
                        fontWeight: "bold",
                        borderRadius: 10,
                        width: 38,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => setRedesForm([...redesForm, { plataforma: "", url: "" }])}
                  style={{
                    background: isDark ? "rgba(59,130,246,0.16)" : "#EFF6FF",
                    border: "1px solid rgba(59,130,246,0.28)",
                    color: "#3B82F6",
                    fontWeight: 800,
                    cursor: "pointer",
                    fontSize: 14,
                    padding: "10px 14px",
                    borderRadius: 10,
                    marginBottom: 20,
                    width: "100%",
                  }}
                >
                  + Añadir otra red
                </button>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    onClick={() => setShowRedesModal(false)}
                    style={{
                      background: "none",
                      border: `1px solid ${border}`,
                      color: text,
                      borderRadius: 10,
                      padding: "10px 20px",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    disabled={savingRedes}
                    onClick={async () => {
                      setSavingRedes(true);
                      try {
                        const validRedes = redesForm.filter((r) => r.url.trim());
                        await perfilAPI.actualizar({
                          nombre: userData.nombreCompleto,
                          apellido: userData.apellidoCompleto,
                          redes_sociales: validRedes,
                        });
                        debouncedRefresh();
                        setShowRedesModal(false);
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setSavingRedes(false);
                      }
                    }}
                    style={{
                      background: "#3B82F6",
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      padding: "10px 22px",
                      cursor: savingRedes ? "not-allowed" : "pointer",
                      fontWeight: 800,
                      opacity: savingRedes ? 0.7 : 1,
                    }}
                  >
                    {savingRedes ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
