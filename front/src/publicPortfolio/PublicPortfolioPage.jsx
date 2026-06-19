import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { proyectoAPI, portafolioAPI, resolveMediaUrl as mediaUrl } from "../api";
import DefaultAvatar from "../components/DefaultAvatar";
import VerificationBadge from "../components/VerificationBadge";
import { useApp } from "../context/AppContext";
import ProjectImageFallback from "../components/ProjectImageFallback";
/** Convierte cualquier formato de lista de imágenes a un array limpio */
const parseImageList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === "object") return [parsed];
    } catch {
      // Puede venir como una URL simple o como varias rutas separadas por coma.
    }

    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "object") return [value];
  return [];
};
/** Extrae la URL de imagen de un objeto con múltiples posibles propiedades */
const getImagePathFromObject = (img) => {
  if (!img || typeof img !== "object") return img;

  return (
    img.url ||
    img.ruta ||
    img.path ||
    img.preview ||
    img.imagen_url ||
    img.imagen ||
    img.imagen_portada ||
    img.imagen_portada_url ||
    img.portada_url ||
    img.ruta_imagen ||
    img.url_imagen
  );
};
/** Recopila todas las URLs de imágenes de un proyecto en orden de prioridad */
const getProjectImages = (project) => {
  const images = [];
  const add = (url) => {
    const full = mediaUrl(url);
    if (full && !images.includes(full)) images.push(full);
  };

  [
    project?.imagen_portada_url,
    project?.imagen_portada,
    project?.imagen_url,
    project?.url_imagen,
    project?.ruta_imagen,
    project?.portada_url,
    project?.portada,
  ].forEach(add);

  [
    project?.imagenes,
    project?.imagenes_urls,
    project?.imagenes_url,
    project?.galeria,
    project?.capturas,
    project?.screenshots,
    project?.fotos,
    project?.images,
    project?.proyecto_imagenes,
  ].forEach((list) => {
    parseImageList(list).forEach((img) => add(getImagePathFromObject(img)));
  });

  return images;
};

const projectImage = (project) => getProjectImages(project)?.[0] || null;
/** Formatea una fecha ISO a formato legible en español (ej: "ene. 2024") */
const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("es-BO", { year: "numeric", month: "short" });
};
/** Escapa caracteres especiales HTML para prevenir XSS en el CV generado */
const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export default function PublicPortfolioPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { userData, isAuthenticated } = useApp();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("sec-perfil");

  const bg = isDark ? "#020617" : "#F1F5F9";
  const text = isDark ? "#fff" : "#111";
  const sub = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#1D283A" : "#E2E8F0";
  const cardBg = isDark ? "#0F172A" : "#fff";

  useEffect(() => {
    const fetchPortfolio = async () => {
      const actualId = id.split("-").pop();
      try {
        const token = localStorage.getItem("auth_token");

        const resp = await portafolioAPI.obtenerPublico(actualId);
        const perfil = resp.perfil || {};
        let proyectos = perfil.proyectos || [];

        // Sin tocar backend: si el dueño abre su portafolio desde "Compartir",
        // pedimos sus proyectos privados/visibles con el endpoint ya existente.
        // Si el dueño visita su propio portafolio, cargamos también
        // los proyectos privados usando el endpoint autenticado
        if (perfil.is_owner && token) {
          try {
            const proyResp = await proyectoAPI.listar();
            if (proyResp.data?.ok) {
              proyectos = proyResp.data.proyectos || proyectos;
            }
          } catch {
            // Si falla, se mantiene lo que ya devolvió el portafolio público.
          }
        }

        setData({ ...perfil, proyectos });
      } catch (err) {
        if (err.response?.status === 403) {
          const codigo = err.response?.data?.codigo;
          if (codigo === "PERFIL_INCOMPLETO") {
            setError("Este portafolio aún no está disponible. El usuario no ha completado los datos obligatorios de su perfil.");
          } else {
            setError("Este portafolio es privado.");
          }
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
  }, [id]);

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

  const proyectos = data.proyectos || [];
  const routeUserId = String(id?.split("-").pop() || "");
  const portfolioUserId = data.id_usuario || routeUserId;
  const isOwnerView = Boolean(data.is_owner) || (isAuthenticated && String(userData?.id_usuario || "") === String(portfolioUserId || ""));
  const fotoPerfil = data.foto_url
    ? mediaUrl(data.foto_url.startsWith("/api/media") ? data.foto_url : `/api/media/${data.foto_url}`)
    : null;
  const proyectosDestacados = proyectos.filter((p) => p.visible_portafolio !== false);
  const proyectosGenerales = proyectos.filter((p) => p.visible_portafolio === false);

  const waitForImages = (doc) => {
    const images = Array.from(doc.images || []);
    if (!images.length) return Promise.resolve();

    return Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );
  };

  const openCV = async () => {
    const html = buildCvHtml(data, proyectos);
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    await waitForImages(doc);

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1200);
    }, 250);
  };

  const openProjectModal = async (project) => {
    setSelectedProject(project);

    const projectId = project?.id_proyecto || project?.id;
    const token = localStorage.getItem("auth_token");

    // Visitantes: no llamar endpoints protegidos de /proyectos.
    // Así pueden abrir el modal de solo lectura sin que el sistema los mande al login.
    if (!projectId || !token || !isOwnerView) return;

    setModalLoading(true);
    try {
      const { data: resp } = await proyectoAPI.obtener(projectId);
      if (resp?.ok && resp.proyecto) {
        setSelectedProject({ ...project, ...resp.proyecto });
      }
    } catch {
      // Si no se puede pedir el detalle, se muestra la información ya cargada.
    } finally {
      setModalLoading(false);
    }
  };

  const renderProjectGrid = (items) => (
    <div className="portfolio-project-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
      {items.map((p, i) => {
        const img = projectImage(p);
        return (
          <motion.div
            key={p.id_proyecto || `${p.titulo}-${i}`}
            whileHover={{ y: -4 }}
            onClick={() => openProjectModal(p)}
            style={{
              background: cardBg,
              border: `1px solid ${border}`,
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: isDark ? "none" : "0 4px 12px rgba(0,0,0,0.05)",
              cursor: "pointer",
            }}
          >
            <div style={{ width: "100%", height: 160, background: isDark ? "#1D283A" : "#E2E8F0", overflow: "hidden" }}>
              {img ? (
                <img src={img} alt="portada" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <ProjectImageFallback title={p.titulo || p.nombre || "Proyecto"} height="100%" />
              )}
            </div>
            <div style={{ padding: 20, minWidth: 0 }}>
              <h4 style={{ margin: "0 0 8px", color: text, fontSize: 16, wordBreak: "break-word", overflowWrap: "break-word" }}>{p.titulo || p.nombre || "Proyecto"}</h4>
              <p style={{ margin: "0 0 16px", color: sub, fontSize: 13, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "break-word", overflowWrap: "break-word" }}>
                {p.descripcion || "Sin descripción."}
              </p>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <button
                  onClick={(e) => { e.stopPropagation(); openProjectModal(p); }}
                  style={{ background: "#3B82F6", color: "#fff", border: "none", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  Ver Portafolio
                </button>
                {p.link && (
                  <a
                    href={p.link}
                    onClick={(e) => e.stopPropagation()}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#3B82F6", textDecoration: "none", fontSize: 13, fontWeight: 700 }}
                  >
                    Abrir enlace →
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  // Secciones para la navegación
  const NAV_SECTIONS = [
    { id: "sec-perfil",     label: "Acerca de mí",        icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    { id: "sec-habilidades", label: "Habilidades",         icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    { id: "sec-proyectos",  label: "Proyectos",            icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
    { id: "sec-laboral",    label: "Experiencia Laboral",  icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
    { id: "sec-academica",  label: "Formación Académica",  icon: "M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" },
  ];

  const scrollToSection = (id) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const laborales  = (data.experiencias || []).filter(e => e.tipo === "laboral");
  const academicas = (data.experiencias || []).filter(e => e.tipo === "academica");

  const formatExperienceDates = (exp) => {
    if (exp.tipo === "academica" && !exp.fecha_inicio && exp.fecha_fin) {
      return `Fecha de emisión: ${formatDate(exp.fecha_fin)}`;
    }
    if (!exp.fecha_inicio && !exp.fecha_fin) return "Sin fecha registrada";
    return `${formatDate(exp.fecha_inicio)} — ${exp.fecha_fin ? formatDate(exp.fecha_fin) : "Actualidad"}`;
  };

  const renderTimeline = (items, accentColor) => (
    <div style={{ position: "relative", paddingLeft: 24 }}>
      <div style={{ position: "absolute", left: 7, top: 6, bottom: 6, width: 2, background: `linear-gradient(to bottom, ${accentColor}, ${accentColor}88, transparent)`, borderRadius: 2 }} />
      {items.map((exp, i) => (
        <div key={i} style={{ position: "relative", marginBottom: i < items.length - 1 ? 16 : 0 }}>
          <div style={{ position: "absolute", left: -20, top: 10, width: 12, height: 12, borderRadius: "50%", background: accentColor, border: `2px solid ${cardBg}`, boxShadow: `0 0 0 3px ${accentColor}33` }} />
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: "14px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
              {exp.nivel_academico && (
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", padding: "2px 8px", borderRadius: 4, background: `${accentColor}18`, color: accentColor }}>
                  {exp.nivel_academico}
                </span>
              )}
              {!exp.fecha_fin && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, textTransform: "uppercase", padding: "2px 8px", borderRadius: 4, background: "rgba(16,185,129,0.12)", color: "#10b981" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                  {exp.tipo === "laboral" ? "Actual" : "En curso"}
                </span>
              )}
              <span style={{ color: sub, fontSize: 12 }}>
                {formatExperienceDates(exp)}
              </span>
            </div>
            <h4 style={{ color: text, fontSize: 15, margin: "0 0 3px", fontWeight: 700 }}>{exp.cargo_titulo}</h4>
            <div style={{ color: accentColor, fontSize: 13, fontWeight: 600 }}>{exp.institucion_empresa}</div>
            {exp.descripcion && <p style={{ color: sub, fontSize: 12, margin: "8px 0 0", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{exp.descripcion}</p>}
            {exp.url_certificado && (
              <a href={exp.url_certificado} target="_blank" rel="noreferrer" style={{ color: "#3B82F6", fontSize: 12, fontWeight: 700, display: "inline-block", marginTop: 8, textDecoration: "none" }}>
                Ver certificado
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ background: bg, minHeight: "100vh", width: "100%", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }

        .pub-layout {
          display: flex;
          min-height: 100vh;
          max-width: 1280px;
          margin: 0 auto;
        }

        /* ── SIDEBAR ── */
        .pub-sidebar {
          width: 280px;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          border-right: 1px solid ${border};
          background: ${cardBg};
          display: flex;
          flex-direction: column;
          padding: 28px 16px;
          gap: 0;
        }
        .pub-sidebar::-webkit-scrollbar { width: 4px; }
        .pub-sidebar::-webkit-scrollbar-thumb { background: ${border}; border-radius: 4px; }

        /* ── PROFILE CARD IN SIDEBAR ── */
        .pub-profile-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 1px solid ${border};
          margin-bottom: 16px;
        }

        /* ── NAV LINKS ── */
        .pub-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          color: ${sub};
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          transition: all 0.15s;
          margin-bottom: 2px;
          font-family: 'Inter', sans-serif;
        }
        .pub-nav-item:hover { background: ${isDark ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.06)"}; color: #3B82F6; }
        .pub-nav-item.active {
          background: ${isDark ? "rgba(59,130,246,0.15)" : "rgba(59,130,246,0.1)"};
          color: #3B82F6;
          border-left: 3px solid #3B82F6;
        }
        .pub-nav-item svg { flex-shrink: 0; }

        /* ── MAIN AREA ── */
        .pub-main {
          flex: 1;
          min-width: 0;
          overflow-y: auto;
          height: 100vh;
          scroll-behavior: smooth;
        }
        .pub-main::-webkit-scrollbar { width: 5px; }
        .pub-main::-webkit-scrollbar-thumb { background: ${border}; border-radius: 4px; }

        /* ── SECTIONS ── */
        .pub-section {
          padding: 36px 36px 0;
          scroll-margin-top: 20px;
        }
        .pub-section-divider {
          height: 1px;
          background: ${border};
          margin: 36px 36px 0;
        }
        .pub-section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 22px;
        }
        .pub-section-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(59,130,246,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .pub-section-title {
          color: ${text};
          font-size: 20px;
          font-weight: 800;
          margin: 0;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .pub-layout { flex-direction: column; }
          .pub-sidebar {
            width: 100%;
            height: auto;
            position: relative;
            border-right: none;
            border-bottom: 1px solid ${border};
            padding: 20px 16px 12px;
          }
          .pub-nav-row {
            display: flex !important;
            flex-wrap: nowrap;
            overflow-x: auto;
            gap: 6px;
          }
          .pub-nav-item { white-space: nowrap; width: auto; }
          .pub-nav-item.active { border-left: none; border-bottom: 2px solid #3B82F6; }
          .pub-main { height: auto; overflow-y: visible; }
          .pub-section { padding: 24px 16px 0; }
          .pub-section-divider { margin: 24px 16px 0; }
        }
        @media (max-width: 560px) {
          .pub-section-title { font-size: 17px; }
          .portfolio-project-grid {
            grid-template-columns: minmax(0, 1fr) !important;
            gap: 14px !important;
          }
        }
      `}</style>

      <div className="pub-layout">
        {/* ═══════════ SIDEBAR ═══════════ */}
        <aside className="pub-sidebar">

          {/* Perfil card */}
          <div className="pub-profile-card">
            {fotoPerfil ? (
              <img src={fotoPerfil} alt="perfil" style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", border: `3px solid ${isDark ? "#1D283A" : "#E2E8F0"}`, marginBottom: 12 }} />
            ) : (
              <DefaultAvatar size={88} style={{ marginBottom: 12 }} />
            )}
            <h1 style={{ color: text, fontSize: 18, fontWeight: 800, margin: "0 0 4px", lineHeight: 1.2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
              {data.nombre} {data.apellido}
              <VerificationBadge ciEstado={data.ci_estado} size={18} />
            </h1>
            {data.titulo_profesional && (
              <span style={{ display: "inline-block", fontSize: 12, fontWeight: 600, color: "#3B82F6", background: isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.08)", padding: "3px 10px", borderRadius: 20, marginBottom: 10 }}>
                {data.titulo_profesional}
              </span>
            )}
            <button
              onClick={openCV}
              style={{ background: isDark ? "#1D283A" : "#F1F5F9", color: "#3B82F6", border: `1px solid ${border}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 7 }}
            >
              📄 Descargar CV
            </button>

            {isOwnerView && portfolioUserId && (
              <div style={{ width: "100%", marginTop: 10, background: isDark ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.05)", border: `1px solid ${border}`, borderRadius: 10, padding: "10px 12px", textAlign: "left" }}>
                <p style={{ margin: "0 0 4px", color: sub, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em" }}>ID del portafolio</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <strong style={{ color: "#3B82F6", fontSize: 18 }}>{portfolioUserId}</strong>
                  <button
                    onClick={() => { navigator.clipboard.writeText(String(portfolioUserId)); alert("ID copiado al portapapeles"); }}
                    style={{ background: isDark ? "#0F172A" : "#fff", color: "#3B82F6", border: `1px solid ${border}`, borderRadius: 7, padding: "5px 9px", cursor: "pointer", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap" }}
                  >
                    Copiar ID
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navegación de secciones */}
          <p style={{ color: sub, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px 4px" }}>Secciones</p>
          <div className="pub-nav-row" style={{ display: "flex", flexDirection: "column" }}>
            {NAV_SECTIONS.map((s) => (
              <button
                key={s.id}
                className={`pub-nav-item${activeSection === s.id ? " active" : ""}`}
                onClick={() => scrollToSection(s.id)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={s.icon} />
                </svg>
                {s.label}
              </button>
            ))}
          </div>

          {/* Contacto */}
          {(data.telefono || data.email || data.linkedin_url || data.github_url || (data.redes_sociales || []).some(r => r.url)) && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${border}` }}>
              <p style={{ color: sub, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px 4px" }}>Contacto</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {data.telefono && <InfoPill text={data.telefono} sub={sub} cardBg={cardBg} border={border} icon="☎" />}
                {data.email && <InfoPill text={data.email} sub={sub} cardBg={cardBg} border={border} icon="✉" />}
                {data.linkedin_url && <LinkPill href={data.linkedin_url} label="LinkedIn" border={border} cardBg={cardBg} />}
                {data.github_url && <LinkPill href={data.github_url} label="GitHub" border={border} cardBg={cardBg} />}
                {(data.redes_sociales || []).map((red, i) => red.url ? (
                  <LinkPill key={i} href={red.url} label={red.plataforma || "Enlace"} border={border} cardBg={cardBg} />
                ) : null)}
              </div>
            </div>
          )}
        </aside>

        {/* ═══════════ MAIN ═══════════ */}
        <main className="pub-main">

          {/* ── Acerca de mí ── */}
          <section id="sec-perfil" className="pub-section">
            <div className="pub-section-header">
              <div className="pub-section-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="pub-section-title">Acerca de mí</h2>
            </div>
            <p style={{ color: sub, fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0 }}>
              {data.biografia || "Sin biografía registrada."}
            </p>
          </section>

          <div className="pub-section-divider" />

          {/* ── Habilidades ── */}
          <section id="sec-habilidades" className="pub-section">
            <div className="pub-section-header">
              <div className="pub-section-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="pub-section-title">Habilidades</h2>
            </div>
            {(!data.techSkills?.length && !data.softSkills?.length) ? (
              <p style={{ color: sub, fontSize: 14 }}>Aún no hay habilidades registradas.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {data.techSkills?.length > 0 && (
                  <div>
                    <p style={{ color: text, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 10px", opacity: 0.6 }}>Técnicas</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {data.techSkills.map((s, i) => (
                        <span key={`t-${i}`} style={{ background: "rgba(59,130,246,0.1)", color: "#3B82F6", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, border: "1px solid rgba(59,130,246,0.2)" }}>
                          {s.nombre} {s.nivel ? `(${s.nivel}%)` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {data.softSkills?.length > 0 && (
                  <div>
                    <p style={{ color: text, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 10px", opacity: 0.6 }}>Blandas</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {data.softSkills.map((s, i) => (
                        <span key={`s-${i}`} style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, border: "1px solid rgba(168,85,247,0.2)" }}>
                          {s.nombre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <div className="pub-section-divider" />

          {/* ── Proyectos ── */}
          <section id="sec-proyectos" className="pub-section">
            <div className="pub-section-header">
              <div className="pub-section-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h2 className="pub-section-title">Proyectos</h2>
            </div>
            {proyectosDestacados.length === 0 && proyectosGenerales.length === 0 ? (
              <p style={{ color: sub, fontSize: 14 }}>Aún no hay proyectos.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                {proyectosDestacados.length > 0 && (
                  <div>
                    <p style={{ color: text, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 14px", opacity: 0.6 }}>Destacados</p>
                    {renderProjectGrid(proyectosDestacados)}
                  </div>
                )}
                {proyectosGenerales.length > 0 && (
                  <div>
                    <p style={{ color: text, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 14px", opacity: 0.6 }}>Generales</p>
                    {renderProjectGrid(proyectosGenerales)}
                  </div>
                )}
              </div>
            )}
          </section>

          <div className="pub-section-divider" />

          {/* ── Experiencia Laboral ── */}
          <section id="sec-laboral" className="pub-section">
            <div className="pub-section-header">
              <div className="pub-section-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="pub-section-title">Experiencia Laboral</h2>
            </div>
            {laborales.length === 0 ? (
              <p style={{ color: sub, fontSize: 14 }}>Sin experiencia laboral registrada.</p>
            ) : renderTimeline(laborales, "#3B82F6")}
          </section>

          <div className="pub-section-divider" />

          {/* ── Formación Académica ── */}
          <section id="sec-academica" className="pub-section" style={{ paddingBottom: 60 }}>
            <div className="pub-section-header">
              <div className="pub-section-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <h2 className="pub-section-title">Formación Académica</h2>
            </div>
            {academicas.length === 0 ? (
              <p style={{ color: sub, fontSize: 14 }}>Sin formación académica registrada.</p>
            ) : renderTimeline(academicas, "#a855f7")}
          </section>

        </main>
      </div>

      <ProjectModal
        project={selectedProject}
        loading={modalLoading}
        onClose={() => setSelectedProject(null)}
        isDark={isDark}
        text={text}
        sub={sub}
        border={border}
        cardBg={cardBg}
      />
    </div>
  );
}
/** Píldora de información de contacto (teléfono, email) */
function InfoPill({ icon, text, sub, cardBg, border }) {
  return (
    <div style={{ color: sub, fontSize: 13, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: cardBg, borderRadius: 8, border: `1px solid ${border}` }}>
      <span>{icon}</span> {text}
    </div>
  );
}
/** Píldora de enlace externo (LinkedIn, GitHub, redes sociales) */
function LinkPill({ href, label, cardBg, border }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "#3B82F6", fontSize: 13, display: "flex", alignItems: "center", gap: 8, background: cardBg, padding: "8px 12px", borderRadius: 8, border: `1px solid ${border}` }}>
      🔗 {label}
    </a>
  );
}
/** Modal de detalle de proyecto con carrusel de imágenes */
function ProjectModal({ project, loading, onClose, isDark, text, sub, border, cardBg }) {
  const [carouselIdx, setCarouselIdx] = useState(0);

  useEffect(() => {
    setCarouselIdx(0);
  }, [project?.id_proyecto, project?.id]);

  const images = getProjectImages(project || {});
  const total = images.length;
  const currentImage = images[Math.min(carouselIdx, Math.max(total - 1, 0))];

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          className="portfolio-project-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.62)", backdropFilter: "blur(7px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <motion.div
            className="portfolio-project-modal"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 760, maxHeight: "90vh", overflowY: "auto", background: cardBg, border: `1px solid ${border}`, borderRadius: 18, boxShadow: isDark ? "0 20px 70px rgba(0,0,0,0.55)" : "0 20px 70px rgba(15,23,42,0.25)" }}
          >
            <div className="portfolio-project-modal-image" style={{ position: "relative", height: 280, background: isDark ? "#1D283A" : "#E2E8F0", borderRadius: "18px 18px 0 0", overflow: "hidden" }}>
              {currentImage ? (
                <img src={currentImage} alt="proyecto" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : (
                <ProjectImageFallback title={project.titulo || project.nombre || "Proyecto"} height="100%" />
              )}

              {total > 1 && (
                <>
                  <button
                    onClick={() => setCarouselIdx((i) => (i <= 0 ? total - 1 : i - 1))}
                    style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 38, height: 38, borderRadius: "50%", border: "none", background: "rgba(15,23,42,0.72)", color: "#fff", cursor: "pointer", fontSize: 18, fontWeight: 900 }}
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setCarouselIdx((i) => (i >= total - 1 ? 0 : i + 1))}
                    style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 38, height: 38, borderRadius: "50%", border: "none", background: "rgba(15,23,42,0.72)", color: "#fff", cursor: "pointer", fontSize: 18, fontWeight: 900 }}
                  >
                    ›
                  </button>
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: 12, display: "flex", justifyContent: "center", gap: 6 }}>
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCarouselIdx(i)}
                        style={{ width: i === carouselIdx ? 20 : 8, height: 8, borderRadius: 999, border: "none", background: i === carouselIdx ? "#3B82F6" : "rgba(255,255,255,0.75)", cursor: "pointer", padding: 0 }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="portfolio-project-modal-body" style={{ padding: 26 }}>
              <div className="portfolio-project-modal-title-row" style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ color: "#3B82F6", fontSize: 12, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", margin: "0 0 8px" }}>Vista de solo lectura</p>
                  <h2 style={{ color: text, fontSize: 26, margin: 0, fontWeight: 900, wordBreak: "break-word", overflowWrap: "break-word" }}>{project.titulo || project.nombre || "Proyecto"}</h2>
                </div>
                <button onClick={onClose} style={{ background: isDark ? "#1D283A" : "#F1F5F9", color: text, border: `1px solid ${border}`, borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontWeight: 900, flexShrink: 0 }}>×</button>
              </div>

              <p style={{ color: sub, fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap", margin: "0 0 18px", wordBreak: "break-word", overflowWrap: "break-word" }}>
                {project.descripcion || "Sin descripción."}
              </p>

              {project.fecha_creacion && (
                <p style={{ color: sub, fontSize: 13, margin: "0 0 16px" }}>
                  Fecha: <strong style={{ color: text }}>{formatDate(project.fecha_creacion)}</strong>
                </p>
              )}

              {project.habilidades?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                  {project.habilidades.map((h, i) => (
                    <span key={i} style={{ background: isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.08)", color: "#3B82F6", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 999, padding: "5px 11px", fontSize: 12, fontWeight: 700 }}>
                      {h.nombre || h}
                    </span>
                  ))}
                </div>
              )}

              {project.link && (
                <a href={project.link} target="_blank" rel="noreferrer" style={{ color: "#fff", background: "#3B82F6", borderRadius: 10, padding: "10px 16px", display: "inline-flex", textDecoration: "none", fontWeight: 800, fontSize: 14 }}>
                  Abrir enlace del proyecto
                </a>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function buildCvHtml(data, proyectos) {
  const nombreCompleto = `${data.nombre || ""} ${data.apellido || ""}`.trim() || "Currículum";
  const titulo = data.titulo_profesional || data.profesion || "Perfil profesional";
  const tech = data.techSkills || [];
  const soft = data.softSkills || [];
  const exp = data.experiencias || [];
  const foto = data.foto_url
    ? mediaUrl(data.foto_url.startsWith("/api/media") ? data.foto_url : `/api/media/${data.foto_url}`)
    : "";
  const redes = [
    data.telefono ? data.telefono : "",
    data.email ? data.email : "",
    data.linkedin_url ? `LinkedIn: ${data.linkedin_url}` : "",
    data.github_url ? `GitHub: ${data.github_url}` : "",
    ...(data.redes_sociales || []).map((r) => r.url ? `${r.plataforma || "Red"}: ${r.url}` : ""),
  ].filter(Boolean);

  const li = (items) => items.length
    ? items.map((x) => `<li>${x}</li>`).join("")
    : "<li>Sin datos registrados.</li>";

  const techList = tech.map((s) => `${esc(s.nombre)}${s.nivel ? ` (${esc(s.nivel)}%)` : ""}`);
  const softList = soft.map((s) => esc(s.nombre));
  const projectList = proyectos.map((p) => `<strong>${esc(p.titulo || p.nombre || "Proyecto")}</strong>${p.descripcion ? ` — ${esc(p.descripcion)}` : ""}`);

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>CV - ${esc(nombreCompleto)}</title>
<style>
  * { box-sizing: border-box; }
  @page { size: A4; margin: 0; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #2f2f2f; background: #f1f5f9; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; display: grid; grid-template-columns: 58mm 1fr; }
  .sidebar { background: #e8e5ff; padding: 8mm 5mm; color: #2f2f2f; }
  .photo { width: 42mm; height: 48mm; object-fit: cover; display: block; margin: 0 auto 8mm; border: 2px solid #7b72d8; }
  .photo-placeholder { width: 42mm; height: 48mm; margin: 0 auto 8mm; border: 2px solid #7b72d8; display:flex; align-items:center; justify-content:center; font-size:11px; color:#5b5b88; }
  .main { padding: 7mm 8mm; }
  h1 { margin: 0 0 1mm; color: #221b82; font-size: 28px; line-height: 1.08; font-weight: 500; }
  .title { color: #4f46e5; font-weight: 700; font-size: 9px; text-transform: uppercase; margin-bottom: 7mm; }
  h2 { color: #221b82; font-size: 12px; margin: 0 0 3mm; text-transform: uppercase; border-bottom: 1px solid #8b85ff; padding-bottom: 1mm; }
  .sidebar h2 { font-size: 11px; margin-top: 6mm; }
  h3 { color: #221b82; font-size: 11px; margin: 4mm 0 1mm; }
  p { margin: 0 0 4mm; font-size: 10.5px; line-height: 1.35; }
  ul { margin: 0 0 4mm; padding-left: 5mm; }
  li { font-size: 10.3px; line-height: 1.38; margin-bottom: 1mm; }
  .contact div { font-size: 9.5px; line-height: 1.35; margin-bottom: 1mm; word-break: break-word; }
  .item { margin-bottom: 3mm; page-break-inside: avoid; }
  .item-title { font-weight: 800; color: #221b82; font-size: 10.5px; }
  .muted { color: #555; font-size: 9.5px; margin: 0.5mm 0 1mm; }
  @media print {
    body { background: white; }
    .page { margin: 0; width: auto; min-height: auto; }
  }
</style>
</head>
<body>
  <main class="page">
    <aside class="sidebar">
      ${foto ? `<img class="photo" src="${esc(foto)}" alt="Foto de perfil" />` : `<div class="photo-placeholder">Foto de perfil</div>`}

      <h2>Contacto</h2>
      <div class="contact">${redes.length ? redes.map((r) => `<div>${esc(r)}</div>`).join("") : `<div>Sin contacto registrado.</div>`}</div>

      <h2>Habilidades</h2>
      <ul>${li(softList)}</ul>

      <h2>Educación / Trayectoria</h2>
      ${exp.length ? exp.slice(0, 4).map((e) => `
        <div class="item">
          <div class="item-title">${esc(e.institucion_empresa || e.cargo_titulo || "Experiencia")}</div>
          <div class="muted">${esc(e.tipo || "")} ${e.fecha_inicio ? `· ${esc(formatDate(e.fecha_inicio))}` : ""}</div>
        </div>`).join("") : `<p>Sin datos registrados.</p>`}
    </aside>

    <section class="main">
      <h1>${esc(nombreCompleto)}</h1>
      <div class="title">${esc(titulo)}</div>

      <h2>Acerca de mí</h2>
      <p>${esc(data.biografia || "Sin biografía registrada.")}</p>

      <h2>Competencia técnica</h2>
      <h3>Lenguajes, herramientas y tecnologías</h3>
      <ul>${li(techList)}</ul>

      <h2>Actividades y proyectos</h2>
      <ul>${li(projectList)}</ul>

      <h2>Experiencia / Formación</h2>
      ${exp.length ? exp.map((e) => `
        <div class="item">
          <div class="item-title">${esc(e.cargo_titulo || "Experiencia")}</div>
          <div class="muted">${esc(e.institucion_empresa || "")} · ${esc(formatDate(e.fecha_inicio))} - ${esc(e.fecha_fin ? formatDate(e.fecha_fin) : "Actualidad")}</div>
          <p>${esc(e.descripcion || "")}</p>
        </div>`).join("") : `<p>Sin experiencia registrada.</p>`}
    </section>
  </main>
</body>
</html>`;
}
