import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";
import { proyectoAPI } from "../api";
import DefaultAvatar from "../components/DefaultAvatar";
import VerificationBadge from "../components/VerificationBadge";
import { useApp } from "../context/AppContext";

const API_HOST = "http://localhost:8000";

const mediaUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("blob:")) return url;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/api/media")) return `${API_HOST}${url}`;
  if (url.startsWith("/")) return `${API_HOST}${url}`;
  return `${API_HOST}/api/media/${url}`;
};

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

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("es-BO", { year: "numeric", month: "short" });
};

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

  const bg = isDark ? "#020617" : "#F1F5F9";
  const text = isDark ? "#fff" : "#111";
  const sub = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#1D283A" : "#E2E8F0";
  const cardBg = isDark ? "#0F172A" : "#fff";

  useEffect(() => {
    const fetchPortfolio = async () => {
      const actualId = id.split("-").pop();
      try {
        const headers = {};
        const token = localStorage.getItem("auth_token");
        if (token) headers.Authorization = `Bearer ${token}`;

        const resp = await axios.get(`${API_HOST}/api/portafolio/${actualId}`, { headers });
        const perfil = resp.data.perfil || {};
        let proyectos = perfil.proyectos || [];

        // Sin tocar backend: si el dueño abre su portafolio desde "Compartir",
        // pedimos sus proyectos privados/visibles con el endpoint ya existente.
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
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
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
            <div style={{ width: "100%", height: 160, background: isDark ? "#1D283A" : "#E2E8F0" }}>
              {img ? (
                <img src={img} alt="portada" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: sub }}>Sin imagen</div>
              )}
            </div>
            <div style={{ padding: 20 }}>
              <h4 style={{ margin: "0 0 8px", color: text, fontSize: 16 }}>{p.titulo || p.nombre || "Proyecto"}</h4>
              <p style={{ margin: "0 0 16px", color: sub, fontSize: 13, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
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

  return (
    <div style={{ background: bg, minHeight: "100vh", width: "100%", paddingBottom: 80 }}>
      <style>{`
        @media (max-width: 768px) {
          .portfolio-layout { flex-direction: column !important; }
          .portfolio-sidebar {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid ${border};
            position: relative !important;
            height: auto !important;
          }
          .portfolio-main { padding-left: 0 !important; }
        }
      `}</style>

      <div className="portfolio-layout" style={{ display: "flex", maxWidth: 1200, margin: "0 auto", position: "relative" }}>
        <div className="portfolio-sidebar" style={{ width: 320, borderRight: `1px solid ${border}`, padding: "32px 24px", height: "calc(100vh - 60px)", position: "sticky", top: 60, overflowY: "auto", boxSizing: "border-box" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 24 }}>
            {fotoPerfil ? (
              <img src={fotoPerfil} alt="perfil" style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", border: `4px solid ${isDark ? "#1D283A" : "#fff"}`, boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }} />
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
            <button
              onClick={openCV}
              style={{
                marginTop: 8,
                background: isDark ? "#1D283A" : "#FFFFFF",
                color: "#3B82F6",
                border: `1px solid ${border}`,
                borderRadius: 10,
                padding: "10px 14px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              📄 Descargar PDF / CV
            </button>

            {isOwnerView && portfolioUserId && (
              <div
                style={{
                  width: "100%",
                  marginTop: 12,
                  background: isDark ? "#1D283A" : "#FFFFFF",
                  border: `1px solid ${border}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                  boxSizing: "border-box",
                  textAlign: "left",
                }}
              >
                <p style={{ margin: "0 0 4px", color: sub, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em" }}>ID del portafolio</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <strong style={{ color: "#3B82F6", fontSize: 20 }}>{portfolioUserId}</strong>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(String(portfolioUserId));
                      alert("ID copiado al portapapeles");
                    }}
                    style={{
                      background: isDark ? "#0F172A" : "#F8FAFC",
                      color: "#3B82F6",
                      border: `1px solid ${border}`,
                      borderRadius: 8,
                      padding: "7px 10px",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Copiar ID
                  </button>
                </div>
                <p style={{ color: sub, margin: "8px 0 0", fontSize: 12, lineHeight: 1.5 }}>
                  Comparte este número para que te encuentren desde el buscador.
                </p>
              </div>
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
              {data.telefono && <InfoPill text={data.telefono} sub={sub} cardBg={cardBg} border={border} icon="☎" />}
              {data.email && <InfoPill text={data.email} sub={sub} cardBg={cardBg} border={border} icon="✉" />}
              {data.linkedin_url && <LinkPill href={data.linkedin_url} label="LinkedIn" border={border} cardBg={cardBg} />}
              {data.github_url && <LinkPill href={data.github_url} label="GitHub" border={border} cardBg={cardBg} />}
              {(data.redes_sociales || []).map((red, i) => red.url ? (
                <LinkPill key={i} href={red.url} label={red.plataforma || "Enlace"} border={border} cardBg={cardBg} />
              ) : null)}
            </div>
          </div>
        </div>

        <div className="portfolio-main" style={{ flex: 1, padding: "40px 32px", boxSizing: "border-box", overflowX: "hidden" }}>
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
              {(!data.techSkills?.length && !data.softSkills?.length) && <p style={{ color: sub, fontSize: 14 }}>Aún no hay habilidades registradas.</p>}
            </div>
          </section>

          <section style={{ marginBottom: 48 }}>
            <h2 style={{ color: text, fontSize: 22, fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
              Proyectos Destacados
            </h2>
            {proyectosDestacados.length === 0 ? (
              <p style={{ color: sub, fontSize: 14 }}>Aún no hay proyectos destacados.</p>
            ) : renderProjectGrid(proyectosDestacados)}
          </section>

          {proyectosGenerales.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <h2 style={{ color: text, fontSize: 22, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                Proyectos Generales
              </h2>
              <p style={{ color: sub, fontSize: 13, margin: "0 0 20px" }}>
                Proyectos adicionales del portafolio.
              </p>
              {renderProjectGrid(proyectosGenerales)}
            </section>
          )}

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
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", padding: "2px 8px", borderRadius: 4, background: exp.tipo === "laboral" ? "rgba(59,130,246,0.12)" : "rgba(168,85,247,0.12)", color: exp.tipo === "laboral" ? "#3B82F6" : "#a855f7" }}>
                          {exp.tipo}
                        </span>
                        <span style={{ color: sub, fontSize: 12 }}>
                          {formatDate(exp.fecha_inicio)} — {exp.fecha_fin ? formatDate(exp.fecha_fin) : "Actualidad"}
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

function InfoPill({ icon, text, sub, cardBg, border }) {
  return (
    <div style={{ color: sub, fontSize: 13, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: cardBg, borderRadius: 8, border: `1px solid ${border}` }}>
      <span>{icon}</span> {text}
    </div>
  );
}

function LinkPill({ href, label, cardBg, border }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "#3B82F6", fontSize: 13, display: "flex", alignItems: "center", gap: 8, background: cardBg, padding: "8px 12px", borderRadius: 8, border: `1px solid ${border}` }}>
      🔗 {label}
    </a>
  );
}

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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.62)", backdropFilter: "blur(7px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 760, maxHeight: "90vh", overflowY: "auto", background: cardBg, border: `1px solid ${border}`, borderRadius: 18, boxShadow: isDark ? "0 20px 70px rgba(0,0,0,0.55)" : "0 20px 70px rgba(15,23,42,0.25)" }}
          >
            <div style={{ position: "relative", height: 280, background: isDark ? "#1D283A" : "#E2E8F0", borderRadius: "18px 18px 0 0", overflow: "hidden" }}>
              {currentImage ? (
                <img src={currentImage} alt="proyecto" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: sub }}>
                  {loading ? "Cargando imágenes..." : "Sin imagen"}
                </div>
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

            <div style={{ padding: 26 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <p style={{ color: "#3B82F6", fontSize: 12, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", margin: "0 0 8px" }}>Vista de solo lectura</p>
                  <h2 style={{ color: text, fontSize: 26, margin: 0, fontWeight: 900 }}>{project.titulo || project.nombre || "Proyecto"}</h2>
                </div>
                <button onClick={onClose} style={{ background: isDark ? "#1D283A" : "#F1F5F9", color: text, border: `1px solid ${border}`, borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontWeight: 900 }}>×</button>
              </div>

              <p style={{ color: sub, fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap", margin: "0 0 18px" }}>
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
