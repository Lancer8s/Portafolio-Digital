import { useState, useRef, useEffect } from "react";
import { defaultProyecto } from "../interfaces/proyecto.interface";
import { validateProyecto, validateImageFile } from "../services/proyecto.service";
import { proyectoAPI, habilidadAPI, resolveMediaUrl } from "../../api";
import { useApp } from "../../context/AppContext";
import SkillCatalogPicker from "../../components/SkillCatalogPicker";

export default function ProyectoForm({ isDark, onBack, onSave, initialData }) {
  const { debouncedRefresh, userData } = useApp();

  const [form, setForm] = useState(() => {
    if (initialData) {
      return {
        ...initialData,
        // Mantener imágenes existentes aunque el listado solo traiga portada
        imagenes: initialData.imagenes?.length
          ? initialData.imagenes
          : initialData.imagen_portada_url
            ? [{ url: initialData.imagen_portada_url }]
            : [],
        habilidades: (initialData.habilidades || []).map((h) =>
          typeof h === "string" ? h : h.nombre
        ),
      };
    }
    return { ...defaultProyecto };
  });

  const [errors, setErrors] = useState({});
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Store actual File objects for new images
  const [newImageFiles, setNewImageFiles] = useState({});

  const fileRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const [catalogo, setCatalogo] = useState([]);

  // Cargar catálogo de habilidades para mapear nombres a IDs
  useEffect(() => {
    const loadCatalogo = async () => {
      try {
        const { data } = await habilidadAPI.catalogo();
        if (data.ok) {
          const flat = [];
          if (data.tecnicas && typeof data.tecnicas === "object") {
            Object.values(data.tecnicas).forEach((items) => {
              if (Array.isArray(items)) items.forEach((item) => flat.push(item));
            });
          }
          setCatalogo(flat);
        }
      } catch { /* ignorar */ }
    };
    loadCatalogo();
  }, []);

  // Al editar, cargar el detalle real para traer todas las imágenes guardadas.
  useEffect(() => {
    let alive = true;

    const loadProyectoDetalle = async () => {
      if (!initialData?.id_proyecto) return;

      try {
        const { data } = await proyectoAPI.obtener(initialData.id_proyecto);
        if (!alive || !data?.ok || !data.proyecto) return;

        const detalle = data.proyecto;
        setForm((prev) => ({
          ...prev,
          ...detalle,
          imagenes: detalle.imagenes?.length
            ? detalle.imagenes
            : prev.imagenes,
          habilidades: (detalle.habilidades || prev.habilidades || []).map((h) =>
            typeof h === "string" ? h : h.nombre
          ),
        }));
      } catch {
        // Si el detalle falla, se mantienen los datos que ya llegaron en initialData.
      }
    };

    loadProyectoDetalle();

    return () => {
      alive = false;
    };
  }, [initialData?.id_proyecto]);

  const text = isDark ? "#fff" : "#111";
  const sub = isDark ? "#94a3b8" : "#807F81";
  const border = isDark ? "#1D283A" : "#E2E8F0";
  const bg = isDark ? "#0F172A" : "#F8FAFC";
  const inp = {
    background: isDark ? "#1D283A" : "#fff",
    border: `1px solid ${border}`,
    color: text,
    borderRadius: 6,
    padding: "10px 14px",
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };
  const lbl = {
    color: isDark ? "#94a3b8" : "#374151",
    fontWeight: 700,
    fontSize: 15,
    marginBottom: 6,
    display: "block",
  };

  const showToastMsg = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleImage = (idx, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const currentCount = form.imagenes.filter(Boolean).length;
    if (!form.imagenes[idx] && currentCount >= 6) {
      showToastMsg(
        "Solo se permiten hasta un máximo de 6 imágenes por proyecto",
        "error"
      );
      return;
    }

    const err = validateImageFile(file);
    if (err) {
      showToastMsg(err, "error");
      return;
    }

    const url = URL.createObjectURL(file);
    const imgs = [...form.imagenes];
    imgs[idx] = { preview: url, isNew: true };
    setForm({ ...form, imagenes: imgs });

    // Store the file
    setNewImageFiles((prev) => ({ ...prev, [idx]: file }));
  };

  const toggleHabilidad = (h) => {
    const has = form.habilidades.includes(h);
    setForm({
      ...form,
      habilidades: has
        ? form.habilidades.filter((x) => x !== h)
        : [...form.habilidades, h],
    });
  };

  const removeHabilidad = (h) => {
    setForm({
      ...form,
      habilidades: form.habilidades.filter((x) => x !== h),
    });
  };

  const scrollToFirstError = (errs) => {
    const firstErrorKey = Object.keys(errs)[0];
    if (!firstErrorKey) return;

    let element;
    if (firstErrorKey === "imagenes") {
      element = document.getElementById("evidencia-container");
    } else {
      element = document.getElementsByName(firstErrorKey)[0];
    }

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      if (element.focus && firstErrorKey !== "imagenes") {
        element.focus({ preventScroll: true });
      }
    }
  };

  const handleSave = async () => {
    // Validate: count real images
    const errs = validateProyecto({
      ...form,
      imagenes: form.imagenes.map((img) => {
        if (!img) return null;
        if (typeof img === "string") return img;
        return img.preview || img.url || img.ruta || img;
      }),
    });
    if (Object.keys(errs).length) {
      setErrors(errs);
      setTimeout(() => scrollToFirstError(errs), 50);
      return;
    }

    // Evitar proyectos con el mismo nombre (duplicados)
    const isDuplicate = (userData?.proyectos || []).some(
      (p) =>
        p.titulo.toLowerCase().trim() === form.titulo.toLowerCase().trim() &&
        p.id_proyecto !== initialData?.id_proyecto
    );
    if (isDuplicate) {
      const dupErrors = {
        titulo: "Ya tienes un proyecto con este título. Evita duplicados.",
      };
      setErrors(dupErrors);
      setTimeout(() => scrollToFirstError(dupErrors), 50);
      return;
    }

    setSaving(true);
    try {
      let projectId;

      if (initialData?.id_proyecto) {
        // UPDATE existing project
        const { data } = await proyectoAPI.actualizar(
          initialData.id_proyecto,
          {
            titulo: form.titulo,
            descripcion: form.descripcion,
            link: form.link || null,
          }
        );
        if (!data.ok) {
          showToastMsg(data.mensaje || "Error al actualizar", "error");
          setSaving(false);
          return;
        }
        projectId = initialData.id_proyecto;
      } else {
        // CREATE new project
        const { data } = await proyectoAPI.crear({
          titulo: form.titulo,
          descripcion: form.descripcion,
          link: form.link || null,
        });
        if (!data.ok) {
          showToastMsg(data.mensaje || "Error al crear proyecto", "error");
          setSaving(false);
          return;
        }
        projectId = data.id_proyecto || data.proyecto?.id_proyecto;
        if (!projectId) throw new Error("No se recibió el ID del proyecto creado");
      }

      // Subir imágenes nuevas una por una para evitar que alguna se pierda.
      for (const [idx, file] of Object.entries(newImageFiles)) {
        if (!file) continue;
        try {
          await proyectoAPI.agregarImagen(projectId, file);
        } catch (imgErr) {
          console.error(`Error subiendo imagen ${idx}:`, imgErr);
          throw new Error("No se pudieron guardar todas las imágenes del proyecto");
        }
      }

      // Sincronizar habilidades del proyecto
      try {
        const ids = form.habilidades
          .map((name) => {
            const found = catalogo.find(
              (c) => c.nombre.toLowerCase() === name.toLowerCase()
            );
            return found?.id_habilidad;
          })
          .filter(Boolean);
        await proyectoAPI.sincronizarHabilidades(projectId, ids);
      } catch (habErr) {
        console.error("Error sincronizando habilidades:", habErr);
      }

      showToastMsg(
        initialData
          ? "Proyecto actualizado correctamente"
          : "Proyecto creado correctamente"
      );
      debouncedRefresh();

      setTimeout(() => {
        onSave({ ...form, id_proyecto: projectId });
      }, 500);
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.errores) {
        const backendErrors = {};
        if (resp.errores.titulo) backendErrors.titulo = resp.errores.titulo[0];
        if (resp.errores.descripcion)
          backendErrors.descripcion = resp.errores.descripcion[0];
        if (resp.errores.link) backendErrors.link = resp.errores.link[0];
        setErrors(backendErrors);
        setTimeout(() => scrollToFirstError(backendErrors), 50);
      } else {
        showToastMsg(
          err.message || resp?.mensaje || "Error de conexión con el servidor",
          "error"
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // Carrusel — mostramos 3 slots a la vez de 6 posibles
  const totalSlots = 6;
  const visibleSlots = [carouselIdx, carouselIdx + 1, carouselIdx + 2].filter(
    (i) => i < totalSlots
  );

  // Helper to get preview URL from image item
  const getImageUrl = (img) => {
    if (!img) return null;
    if (typeof img === "string") return resolveMediaUrl(img);
    return resolveMediaUrl(img.preview || img.url || img.ruta || img.imagen_portada_url || null);
  };

  return (
    <div
      className="project-form-shell"
      style={{
        maxWidth: 580,
        margin: "0 auto",
        padding: "24px 20px 60px",
        display: "flex",
        flexDirection: "column",
        gap: 22,
        position: "relative",
      }}
    >
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: toast.type === "success" ? "#16a34a" : "#ef4444",
            color: "#fff",
            borderRadius: 8,
            padding: "10px 24px",
            fontWeight: 600,
            fontSize: 14,
            zIndex: 999,
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Título sección */}
      <h2 style={{ color: "#3B82F6", fontWeight: 800, fontSize: 20 }}>
        {initialData ? "EDITAR PROYECTO" : "NUEVO PROYECTO"}
      </h2>

      {/* Título */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <label style={{ ...lbl, marginBottom: 0 }}>Titulo</label>
          <span style={{ color: sub, fontSize: 11 }}>{(form.titulo || "").length}/80</span>
        </div>
        <input
          name="titulo"
          value={form.titulo}
          onChange={handleChange}
          style={inp}
          maxLength={80}
        />
        {errors.titulo && (
          <span style={{ color: "#ef4444", fontSize: 12 }}>
            {errors.titulo}
          </span>
        )}
      </div>

      {/* Descripción */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <label style={{ ...lbl, marginBottom: 0 }}>Descripcion</label>
          <span style={{ color: sub, fontSize: 11 }}>{(form.descripcion || "").length}/120</span>
        </div>
        <input
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          style={inp}
          maxLength={120}
        />
        {errors.descripcion && (
          <span style={{ color: "#ef4444", fontSize: 12 }}>
            {errors.descripcion}
          </span>
        )}
      </div>

      {/* Link */}
      <div>
        <label style={lbl}>Link/Enlace del proyecto</label>
        <input
          name="link"
          value={form.link}
          onChange={handleChange}
          style={inp}
          placeholder="https://..."
        />
        {errors.link && (
          <span style={{ color: "#ef4444", fontSize: 12 }}>
            {errors.link}
          </span>
        )}
      </div>

      {/* HABILIDADES */}
      <div>
        <label style={lbl}>
          {"</>"} Habilidades del Proyecto
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <SkillCatalogPicker
            isDark={isDark}
            selected={form.habilidades}
            existing={[]}
            onToggle={toggleHabilidad}
            showSoftSkills={false}
          />

          {form.habilidades.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
              {form.habilidades.map((h) => (
                <div
                  key={h}
                  style={{
                    background: isDark ? "rgba(59,130,246,0.15)" : "rgba(59,130,246,0.08)",
                    border: `1.5px solid ${isDark ? "rgba(59,130,246,0.3)" : "rgba(59,130,246,0.2)"}`,
                    borderRadius: 20,
                    padding: "6px 14px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    color: isDark ? "#60a5fa" : "#2563eb",
                  }}
                >
                  {h}
                  <button
                    type="button"
                    onClick={() => removeHabilidad(h)}
                    style={{
                      background: "none",
                      border: "none",
                      color: isDark ? "#94a3b8" : "#64748b",
                      cursor: "pointer",
                      fontSize: 14,
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* EVIDENCIA — carrusel */}
      <div id="evidencia-container">
        <p
          style={{
            color: "#3B82F6",
            fontWeight: 700,
            fontSize: 15,
            marginBottom: 4,
          }}
        >
          Evidencia
        </p>
        <p style={{ color: sub, fontSize: 12, marginBottom: 12 }}>
          Máximo 6 imágenes (opcional)
        </p>
        {errors.imagenes && (
          <span style={{ color: "#ef4444", fontSize: 12 }}>
            {errors.imagenes}
          </span>
        )}

        <div className="project-evidence-row" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setCarouselIdx((i) => Math.max(0, i - 1))}
            disabled={carouselIdx === 0}
            style={{
              background: "none",
              border: "none",
              cursor: carouselIdx === 0 ? "default" : "pointer",
              color: carouselIdx === 0 ? "#555" : "#3B82F6",
              fontSize: 24,
            }}
          >
            ←
          </button>

          <div
            className="project-evidence-slots"
            style={{
              display: "flex",
              gap: 10,
              flex: 1,
              justifyContent: "center",
            }}
          >
            {visibleSlots.map((idx) => (
              <div
                className="project-evidence-slot"
                key={idx}
                onClick={() => fileRefs[idx].current?.click()}
                style={{
                  width: 130,
                  height: 110,
                  border: `1px solid ${border}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  background: bg,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {getImageUrl(form.imagenes[idx]) ? (
                  <img
                    src={getImageUrl(form.imagenes[idx])}
                    alt={`evidencia ${idx + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={sub}
                      strokeWidth="1.5"
                    >
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span style={{ color: sub, fontSize: 11 }}>
                      Subir Foto
                    </span>
                  </div>
                )}
                <input
                  ref={fileRefs[idx]}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleImage(idx, e)}
                />
              </div>
            ))}
          </div>

          <button
            onClick={() =>
              setCarouselIdx((i) => Math.min(totalSlots - 3, i + 1))
            }
            disabled={carouselIdx >= totalSlots - 3}
            style={{
              background: "none",
              border: "none",
              cursor:
                carouselIdx >= totalSlots - 3 ? "default" : "pointer",
              color:
                carouselIdx >= totalSlots - 3 ? "#555" : "#3B82F6",
              fontSize: 24,
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* BOTONES */}
      <div
        className="project-form-actions"
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: 8,
        }}
      >
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: saving
              ? "#6B7280"
              : "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "12px 40px",
            fontWeight: 700,
            fontSize: 15,
            cursor: saving ? "not-allowed" : "pointer",
            letterSpacing: 1,
          }}
        >
          {saving
            ? "Guardando..."
            : initialData
            ? "GUARDAR CAMBIOS"
            : "AGREGAR PROYECTO"}
        </button>
      </div>

      {/* Atrás */}
      <div className="project-form-back">
        <button
          onClick={onBack}
          style={{
            background: isDark ? "#1D283A" : "#E2E8F0",
            color: text,
            border: "none",
            borderRadius: 8,
            padding: "10px 28px",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Atras
        </button>
      </div>
    </div>
  );
}
