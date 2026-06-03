import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { perfilAPI } from "../api";
import axios from "axios";
import DefaultAvatar from "../components/DefaultAvatar";
import VerificationBadge from "../components/VerificationBadge";

export default function PublicPortfolioPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { userData, setUserData } = useApp();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [savingVisibility, setSavingVisibility] = useState(false);

  const bg = isDark ? "#020617" : "#F1F5F9";
  const text = isDark ? "#fff" : "#111";
  const sub = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#1D283A" : "#E2E8F0";
  const cardBg = isDark ? "#0F172A" : "#fff";
  const sectionBg = isDark ? "#1E293B" : "#F1F5F9";

  const actualId = String(id || "").split("-").pop();
  const publicPortfolioPath = id ? `/portafolio/${id}` : actualId ? `/portafolio/${actualId}` : "";
  const publicPortfolioUrl = publicPortfolioPath
    ? `${window.location.origin}${publicPortfolioPath}`
    : "";

  const copyPublicPortfolioUrl = async () => {
    if (!publicPortfolioUrl) return;

    try {
      await navigator.clipboard.writeText(publicPortfolioUrl);
      alert("Enlace del portafolio copiado");
    } catch {
      alert(publicPortfolioUrl);
    }
  };

  const updateVisibility = async (value) => {
    if (!userData) return;

    const previousUserData = userData;
    const previousData = data;

    try {
      setSavingVisibility(true);
      setUserData({ ...userData, visibilidad: value });
      setData((prev) => (prev ? { ...prev, visibilidad: value } : prev));

      await perfilAPI.actualizar({
        nombre: userData.nombreCompleto || data?.nombre || "",
        apellido: userData.apellidoCompleto || data?.apellido || "",
        visibilidad: value,
      });
    } catch (err) {
      setUserData(previousUserData);
      setData(previousData);
      alert("No se pudo actualizar la visibilidad. Intenta nuevamente.");
    } finally {
      setSavingVisibility(false);
    }
  };

  const actionButton = (label, description, code, onClick) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        border: `1px solid ${border}`,
        borderRadius: 18,
        padding: "15px 16px",
        cursor: "pointer",
        background: cardBg,
        color: text,
        display: "flex",
        alignItems: "center",
        gap: 14,
        textAlign: "left",
        boxShadow: isDark ? "none" : "0 8px 20px rgba(15,23,42,0.045)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.borderColor = "rgba(59,130,246,0.45)";
        e.currentTarget.style.boxShadow = isDark
          ? "0 10px 24px rgba(0,0,0,0.22)"
          : "0 12px 26px rgba(15,23,42,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = border;
        e.currentTarget.style.boxShadow = isDark ? "none" : "0 8px 20px rgba(15,23,42,0.045)";
      }}
    >
      <span
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isDark ? "rgba(59,130,246,0.16)" : "#EFF6FF",
          color: "#2563EB",
          fontSize: 13,
          fontWeight: 900,
          letterSpacing: "0.03em",
        }}
      >
        {code}
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <strong style={{ fontSize: 14.5, lineHeight: 1.2 }}>{label}</strong>
        <span style={{ fontSize: 12.2, lineHeight: 1.35, color: sub }}>
          {description}
        </span>
      </span>
    </button>
  );

  const sectionTitle = (label) => (
    <div
      style={{
        width: "100%",
        borderRadius: 12,
        padding: "9px 12px",
        background: sectionBg,
        border: `1px solid ${border}`,
        color: sub,
        fontSize: 11,
        fontWeight: 900,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        boxSizing: "border-box",
      }}
    >
      {label}
    </div>
  );

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const headers = {};
        const token = localStorage.getItem("auth_token");
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        const resp = await axios.get(`http://localhost:8000/api/portafolio/${actualId}`, { headers });
        setData(resp.data.perfil);
        setIsOwner(resp.data.perfil?.is_owner || false);
      } catch (err) {
        if (err.response?.status === 403) {
          setError("Este portafolio es privado.");
        } else if (err.response?.status === 404) {
          setError("El portafolio no existe.");
        } else {
          setError("Error al cargar el portafolio.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, [actualId]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: bg, color: text }}>
        Cargando portafolio...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: bg, color: text }}>
        <h2 style={{ marginBottom: 16 }}>{error}</h2>
        <button onClick={() => navigate("/")} style={{ background: "#3B82F6", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
          Ir al Inicio
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ background: bg, minHeight: "100vh", width: "100%", paddingBottom: 80 }}>
      <style>{`
        @media (max-width: 1100px) {
          .portfolio-layout {
            flex-direction: column !important;
          }
          .portfolio-sidebar {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid ${border};
            position: relative !important;
            height: auto !important;
            top: 0 !important;
          }
          .portfolio-main {
            padding: 32px 24px !important;
            width: 100% !important;
          }
          .portfolio-owner-actions {
            width: 100% !important;
            padding: 0 24px 24px !important;
            position: relative !important;
            top: 0 !important;
          }
          .portfolio-owner-panel {
            height: auto !important;
          }
        }
      `}</style>

      <div
        className="portfolio-layout"
        style={{
          display: "flex",
          maxWidth: isOwner ? 1500 : 1200,
          margin: "0 auto",
          position: "relative",
          alignItems: "flex-start",
        }}
      >
        {/* SIDEBAR */}
        <div
          className="portfolio-sidebar"
          style={{
            width: 320,
            borderRight: `1px solid ${border}`,
            padding: "32px 24px",
            height: "calc(100vh - 60px)",
            position: "sticky",
            top: 60,
            overflowY: "auto",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 32 }}>
            {data.foto_url ? (
              <img src={`http://localhost:8000/api/media/${data.foto_url}`} alt="perfil" style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", border: `4px solid ${isDark ? "#1D283A" : "#fff"}`, boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }} />
            ) : (
              <DefaultAvatar size={120} style={{ border: `4px solid ${isDark ? "#1D283A" : "#fff"}`, boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }} />
            )}
            <h1 style={{ color: text, fontSize: 24, fontWeight: 800, margin: "16px 0 4px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span>{data.nombre} {data.apellido}</span>
              <VerificationBadge ciEstado={data.ci_estado} size={22} />
            </h1>
            {data.titulo_profesional && (
              <span style={{ display: "inline-block", fontSize: 13, fontWeight: 600, color: "#3B82F6", background: isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.08)", padding: "4px 12px", borderRadius: 20, marginBottom: 12 }}>
                {data.titulo_profesional}
              </span>
            )}
          </div>

          <div style={{ marginBottom: 32 }}>
            <h3 style={{ color: text, fontSize: 14, fontWeight: 800, margin: "0 0 10px 4px", textTransform: "uppercase", letterSpacing: "1px" }}>Sobre mí</h3>
            <p style={{ color: sub, fontSize: 14, lineHeight: 1.6, margin: 0, padding: "0 4px", whiteSpace: "pre-wrap" }}>
              {data.biografia || "Sin biografía."}
            </p>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h3 style={{ color: text, fontSize: 14, fontWeight: 800, margin: "0 0 10px 4px", textTransform: "uppercase", letterSpacing: "1px" }}>Contacto & Redes</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.telefono && (
                <div style={{ color: sub, fontSize: 13, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: cardBg, borderRadius: 8, border: `1px solid ${border}` }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> {data.telefono}
                </div>
              )}
              {data.linkedin_url && (
                <a href={data.linkedin_url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "#3B82F6", fontSize: 13, display: "flex", alignItems: "center", gap: 8, background: cardBg, padding: "8px 12px", borderRadius: 8, border: `1px solid ${border}` }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg> LinkedIn
                </a>
              )}
              {data.github_url && (
                <a href={data.github_url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "#3B82F6", fontSize: 13, display: "flex", alignItems: "center", gap: 8, background: cardBg, padding: "8px 12px", borderRadius: 8, border: `1px solid ${border}` }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg> GitHub
                </a>
              )}
              {(data.redes_sociales || []).map((red, i) => {
                if (!red.url) return null;
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
                }

                return (
                  <a key={i} href={red.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "#3B82F6", fontSize: 13, display: "flex", alignItems: "center", gap: 8, background: cardBg, padding: "8px 12px", borderRadius: 8, border: `1px solid ${border}` }}>
                    {icon} {red.plataforma || "Enlace"}
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="portfolio-main" style={{ flex: 1, padding: "40px 32px", boxSizing: "border-box", overflowX: "hidden", minWidth: 0 }}>
          {/* Habilidades */}
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ color: text, fontSize: 22, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
              Habilidades
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {data.techSkills?.map((s, i) => (
                <span key={`t-${i}`} style={{ background: "rgba(59,130,246,0.1)", color: "#3B82F6", padding: "6px 14px", borderRadius: 20, fontSize: 14, fontWeight: 600, border: "1px solid rgba(59,130,246,0.2)" }}>
                  {s.nombre} {s.nivel ? `(${s.nivel}%)` : ""}
                </span>
              ))}
              {data.softSkills?.map((s, i) => (
                <span key={`s-${i}`} style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7", padding: "6px 14px", borderRadius: 20, fontSize: 14, fontWeight: 600, border: "1px solid rgba(168,85,247,0.2)" }}>
                  {s.nombre}
                </span>
              ))}
            </div>
          </section>

          {/* Proyectos */}
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ color: text, fontSize: 22, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
              Proyectos Destacados
            </h2>
            {data.proyectos?.length === 0 ? (
              <p style={{ color: sub, fontSize: 14 }}>Aún no hay proyectos.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
                {data.proyectos?.map((p, i) => (
                  <motion.div key={i} whileHover={{ y: -4 }} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, overflow: "hidden", boxShadow: isDark ? "none" : "0 4px 12px rgba(0,0,0,0.05)" }}>
                    <div style={{ width: "100%", height: 160, background: isDark ? "#1D283A" : "#E2E8F0" }}>
                      {p.imagen_portada_url ? (
                        <img src={`http://localhost:8000${p.imagen_portada_url}`} alt="portada" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: sub }}>Sin imagen</div>
                      )}
                    </div>
                    <div style={{ padding: 20 }}>
                      <h4 style={{ margin: "0 0 8px", color: text, fontSize: 16 }}>{p.titulo}</h4>
                      <p style={{ margin: "0 0 16px", color: sub, fontSize: 13, lineHeight: 1.5 }}>{p.descripcion}</p>
                      {p.link && (
                        <a href={p.link} target="_blank" rel="noreferrer" style={{ color: "#3B82F6", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>Ver Proyecto →</a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Experiencia (Línea de tiempo) */}
          <section>
            <h2 style={{ color: text, fontSize: 22, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
              Trayectoria
            </h2>
            {data.experiencias?.length === 0 ? (
              <p style={{ color: sub, fontSize: 14 }}>Aún no hay experiencia registrada.</p>
            ) : (
              <div style={{ position: "relative", paddingLeft: 24 }}>
                <div style={{ position: "absolute", left: 7, top: 6, bottom: 6, width: 2, background: "linear-gradient(to bottom, #3B82F6, #6366F1 50%, transparent)", borderRadius: 2 }} />
                {data.experiencias?.map((exp, i) => (
                  <div key={i} style={{ position: "relative", marginBottom: 24 }}>
                    <div style={{ position: "absolute", left: -20, top: 8, width: 12, height: 12, borderRadius: "50%", background: "#3B82F6", border: `2px solid ${cardBg}`, boxShadow: "0 0 0 3px rgba(59,130,246,0.2)" }} />
                    <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", padding: "2px 8px", borderRadius: 4, background: exp.tipo === "laboral" ? "rgba(59,130,246,0.12)" : "rgba(168,85,247,0.12)", color: exp.tipo === "laboral" ? "#3B82F6" : "#a855f7" }}>
                          {exp.tipo}
                        </span>
                        <span style={{ color: sub, fontSize: 12 }}>
                          {new Date(exp.fecha_inicio).toLocaleDateString()} — {exp.fecha_fin ? new Date(exp.fecha_fin).toLocaleDateString() : "Actualidad"}
                        </span>
                      </div>
                      <h4 style={{ color: text, fontSize: 16, margin: "0 0 4px", fontWeight: 700 }}>{exp.cargo_titulo}</h4>
                      <div style={{ color: text, fontSize: 14, opacity: 0.9 }}>{exp.institucion_empresa}</div>
                      {exp.descripcion && <p style={{ color: sub, fontSize: 13, margin: "8px 0 0", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{exp.descripcion}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* OWNER ACTIONS */}
        {isOwner && (
          <aside
            className="portfolio-owner-actions"
            style={{
              width: 320,
              flexShrink: 0,
              position: "sticky",
              top: 76,
              padding: "32px 24px 32px 0",
              boxSizing: "border-box",
            }}
          >
            <div
              className="portfolio-owner-panel"
              style={{
                background: cardBg,
                border: `1px solid ${border}`,
                borderRadius: 22,
                padding: 17,
                boxShadow: isDark ? "none" : "0 12px 32px rgba(15,23,42,0.08)",
              }}
            >
              <div style={{ marginBottom: 15 }}>
                <p
                  style={{
                    color: text,
                    fontSize: 18,
                    fontWeight: 900,
                    margin: "0 0 5px",
                    letterSpacing: "0.01em",
                  }}
                >
                  Acciones públicas
                </p>
                <p style={{ color: sub, fontSize: 12.5, lineHeight: 1.45, margin: 0 }}>
                  Información para compartir tu portafolio con reclutadores.
                </p>
              </div>

              <div
                style={{
                  border: `1px solid ${border}`,
                  borderRadius: 18,
                  padding: "15px 16px",
                  background: cardBg,
                  marginBottom: 14,
                  boxShadow: isDark ? "none" : "0 8px 20px rgba(15,23,42,0.045)",
                }}
              >
                <p
                  style={{
                    color: sub,
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    margin: "0 0 8px",
                  }}
                >
                  Portafolio público
                </p>
                <p style={{ color: text, fontSize: 14, fontWeight: 800, margin: "0 0 8px" }}>
                  Tu ID público es: {actualId}
                </p>
                <p style={{ color: sub, fontSize: 12.2, lineHeight: 1.45, margin: "0 0 12px" }}>
                  Comparte este ID o enlace con reclutadores para que puedan ver tu portafolio desde el HOME.
                </p>
                <div
                  style={{
                    border: `1px solid ${border}`,
                    borderRadius: 12,
                    background: isDark ? "#111827" : "#F8FAFC",
                    color: sub,
                    fontSize: 12.2,
                    padding: "11px 12px",
                    marginBottom: 12,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {publicPortfolioPath}
                </div>
                <button
                  type="button"
                  onClick={copyPublicPortfolioUrl}
                  style={{
                    width: "100%",
                    border: "none",
                    borderRadius: 14,
                    padding: "12px 14px",
                    cursor: "pointer",
                    color: "#FFFFFF",
                    background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
                    fontSize: 14,
                    fontWeight: 900,
                  }}
                >
                  Copiar enlace público
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {sectionTitle("Gestión")}
                {actionButton("Visibilidad", "Público o privado", "VI", () => setShowVisibilityModal(true))}               
                {actionButton("Editar portafolio", "Volver al panel de edición", "EP", () => navigate("/vista"))}
              </div>
            </div>
          </aside>
        )}
      </div>

      <AnimatePresence>
        {showVisibilityModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
            onClick={() => setShowVisibilityModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              style={{
                background: cardBg,
                padding: 24,
                borderRadius: 16,
                width: "100%",
                maxWidth: 400,
                border: `1px solid ${border}`,
                boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ color: text, fontWeight: 800, marginBottom: 18, marginTop: 0 }}>
                Visibilidad del portafolio
              </h3>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", color: sub, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Estado del portafolio
                </label>
                <select
                  disabled={savingVisibility}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 8,
                    border: `1px solid ${border}`,
                    background: isDark ? "#1D283A" : "#F8FAFC",
                    color: text,
                    fontSize: 15,
                    outline: "none",
                    appearance: "auto",
                  }}
                  value={userData?.visibilidad || data?.visibilidad || "publico"}
                  onChange={(e) => updateVisibility(e.target.value)}
                >
                  <option value="publico">Público (cualquiera puede verlo)</option>
                  <option value="privado">Privado (solo tú puedes verlo)</option>
                </select>
                <p style={{ color: sub, fontSize: 12, marginTop: 6 }}>
                  Si está privado, los visitantes no podrán ver tu portafolio público.
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowVisibilityModal(false)}
                  style={{
                    background: "transparent",
                    color: sub,
                    border: `1px solid ${border}`,
                    borderRadius: 8,
                    padding: "9px 16px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Volver atrás
                </button>
                <button
                  type="button"
                  onClick={() => setShowVisibilityModal(false)}
                  style={{
                    background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "9px 24px",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Hecho
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
