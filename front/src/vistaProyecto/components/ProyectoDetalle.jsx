import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { proyectoAPI, resolveMediaUrl } from "../../api";

export default function ProyectoDetalle({ isDark }) {
  const { idx } = useParams();
  const navigate = useNavigate();
  const { userData } = useApp();
  const [proyecto, setProyecto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [carouselIdx, setCarouselIdx] = useState(0);

  const text = isDark ? "#fff" : "#111";
  const sub = isDark ? "#94a3b8" : "#807F81";
  const border = isDark ? "#1D283A" : "#E2E8F0";
  const bg = isDark ? "#0F172A" : "#F8FAFC";

  useEffect(() => {
    const loadProyecto = async () => {
      // Try to get project by index from userData first, then use id to load detail
      const proyFromData = userData?.proyectos?.[Number(idx)];

      if (proyFromData?.id_proyecto) {
        try {
          const { data } = await proyectoAPI.obtener(proyFromData.id_proyecto);
          if (data.ok) {
            setProyecto(data.proyecto);
            setLoading(false);
            return;
          }
        } catch {
          /* fallback to userData */
        }
      }

      // Fallback: use userData directly
      if (proyFromData) {
        setProyecto(proyFromData);
      }
      setLoading(false);
    };

    loadProyecto();
  }, [idx, userData]);

  if (loading) {
    return (
      <div
        style={{ color: text, textAlign: "center", padding: 40 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{
            width: 40,
            height: 40,
            border: "4px solid",
            borderColor: `#3B82F6 transparent #3B82F6 transparent`,
            borderRadius: "50%",
            margin: "0 auto 16px",
          }}
        />
        Cargando proyecto...
      </div>
    );
  }

  if (!proyecto)
    return (
      <div style={{ color: text, textAlign: "center", padding: 40 }}>
        Proyecto no encontrado.
        <br />
        <button
          onClick={() => navigate("/vista")}
          style={{
            marginTop: 16,
            background: "#3B82F6",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 24px",
            cursor: "pointer",
          }}
        >
          Volver
        </button>
      </div>
    );

  // Build images array from API response
  const imagenes = [];
  const addImage = (url) => {
    const full = resolveMediaUrl(url);
    if (full && !imagenes.includes(full)) imagenes.push(full);
  };

  addImage(proyecto.imagen_portada_url);
  addImage(proyecto.imagen_url);
  addImage(proyecto.portada_url);

  (proyecto.imagenes || []).forEach((img) => {
    if (typeof img === "string") {
      addImage(img);
      return;
    }
    addImage(img?.url || img?.ruta || img?.preview || img?.imagen_url || img?.imagen_portada_url);
  });
  const total = imagenes.length;

  // Get habilidades names
  const habilidades = (proyecto.habilidades || []).map((h) =>
    typeof h === "string" ? h : h.nombre
  );

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: "24px 16px 60px",
        boxSizing: "border-box",
      }}
    >
      {/* Título */}
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          color: text,
          fontWeight: 800,
          fontSize: 22,
          marginBottom: 20,
          wordBreak: "break-word",
        }}
      >
        {proyecto.titulo || proyecto.nombre}
      </motion.h2>

      {/* Carrusel de imágenes */}
      {total > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{
            border: `1px solid ${border}`,
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 24,
            position: "relative",
            background: isDark ? "#1D283A" : "#E2E8F0",
          }}
        >
          <div
            style={{
              width: "100%",
              height: 260,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <img
              src={imagenes[carouselIdx]}
              alt={`evidencia ${carouselIdx + 1}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>

          {total > 1 && (
            <>
              <button
                onClick={() =>
                  setCarouselIdx((i) => Math.max(0, i - 1))
                }
                disabled={carouselIdx === 0}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 10,
                  transform: "translateY(-50%)",
                  background: "rgba(0,0,0,0.5)",
                  border: "none",
                  color: "#fff",
                  borderRadius: "50%",
                  width: 36,
                  height: 36,
                  cursor:
                    carouselIdx === 0 ? "default" : "pointer",
                  fontSize: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: carouselIdx === 0 ? 0.3 : 1,
                }}
              >
                ←
              </button>
              <button
                onClick={() =>
                  setCarouselIdx((i) =>
                    Math.min(total - 1, i + 1)
                  )
                }
                disabled={carouselIdx === total - 1}
                style={{
                  position: "absolute",
                  top: "50%",
                  right: 10,
                  transform: "translateY(-50%)",
                  background: "rgba(0,0,0,0.5)",
                  border: "none",
                  color: "#fff",
                  borderRadius: "50%",
                  width: 36,
                  height: 36,
                  cursor:
                    carouselIdx === total - 1
                      ? "default"
                      : "pointer",
                  fontSize: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: carouselIdx === total - 1 ? 0.3 : 1,
                }}
              >
                →
              </button>
            </>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 6,
              padding: "10px 0",
            }}
          >
            {imagenes.map((_, i) => (
              <button
                key={i}
                onClick={() => setCarouselIdx(i)}
                style={{
                  width: i === carouselIdx ? 20 : 8,
                  height: 8,
                  borderRadius: 99,
                  background:
                    i === carouselIdx
                      ? "#3B82F6"
                      : isDark
                      ? "#1D283A"
                      : "#D1D5DB",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "all 0.2s",
                }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Descripción */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{ marginBottom: 20 }}
      >
        <p
          style={{
            color: sub,
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          Descripcion
        </p>
        <div
          style={{
            border: `1px solid ${border}`,
            borderRadius: 8,
            padding: "14px 16px",
            background: bg,
            color: text,
            fontSize: 14,
            lineHeight: 1.7,
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
          }}
        >
          {proyecto.descripcion}
        </div>
      </motion.div>

      {/* Habilidades Técnicas */}
      {habilidades.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ marginBottom: 16 }}
        >
          <p
            style={{
              color: text,
              fontWeight: 700,
              fontSize: 15,
              marginBottom: 10,
            }}
          >
            Habilidades Tecnicas Usadas
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {habilidades.map((h, i) => (
              <span
                key={i}
                style={{
                  border: `1px solid ${border}`,
                  borderRadius: 6,
                  padding: "5px 14px",
                  color: text,
                  fontSize: 13,
                }}
              >
                {h}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Habilidades blandas del perfil */}
      {(userData?.softSkills || []).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{ marginBottom: 24 }}
        >
          <p
            style={{
              color: text,
              fontWeight: 700,
              fontSize: 15,
              marginBottom: 10,
            }}
          >
            Habilidades Blandas
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {userData.softSkills.map((h, i) => (
              <span
                key={i}
                style={{
                  border: `1px solid ${border}`,
                  borderRadius: 6,
                  padding: "5px 14px",
                  color: text,
                  fontSize: 13,
                }}
              >
                {typeof h === "string" ? h : h.nombre}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Link */}
      {(proyecto.link || proyecto.url_repositorio) && (
        <a
          href={proyecto.link || proyecto.url_repositorio}
          target="_blank"
          rel="noreferrer"
          style={{
            color: "#3B82F6",
            fontSize: 13,
            display: "block",
            marginBottom: 24,
          }}
        >
          🔗 {proyecto.link || proyecto.url_repositorio}
        </a>
      )}

      {/* Volver */}
      <button
        onClick={() => navigate("/vista")}
        style={{
          background: "#3B82F6",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "11px 28px",
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        ← Volver
      </button>
    </div>
  );
}
