import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import lapizClaro from "../../assets/lapizClaro.png";
import lapizOscuro from "../../assets/lapizOscuro.png";
import { useApp } from "../../context/AppContext";
import { perfilAPI, habilidadAPI, proyectoAPI, resolveMediaUrl as mediaUrl } from "../../api";
import ExperienciaLaboral from "./ExperienciaLaboral";
import FormacionAcademica from "./FormacionAcademica";
import UserHomeStats from "./UserHomeStats";
import DefaultAvatar from "../../components/DefaultAvatar";
import VerificationBadge from "../../components/VerificationBadge";
import SkillSelector from "../../edicionHabilidad/components/SkillSelector";
import ProyectoForm from "../../edicionProyecto/components/ProyectoForm";
import PinToggle from "../../components/PinToggle";
import ProjectImageFallback from "../../components/ProjectImageFallback";
/** Recopila todas las URLs de imágenes de un proyecto en orden de prioridad */
const getProjectImages = (project) => {
  const images = [];
  const add = (url) => {
    const full = mediaUrl(url);
    if (full && !images.includes(full)) images.push(full);
  };

  add(project?.imagen_portada_url);
  add(project?.imagen_url);
  add(project?.portada_url);

  (project?.imagenes || []).forEach((img) => {
    if (typeof img === "string") {
      add(img);
      return;
    }
    add(img?.url || img?.ruta || img?.preview || img?.imagen_url || img?.imagen_portada_url);
  });

  return images;
};
/** Retorna la primera imagen disponible de un proyecto, o null si no hay */

const projectImage = (project) => getProjectImages(project)?.[0] || null;
/** Formatea una fecha ISO a formato legible en español (ej: "ene. 2024") */
const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("es-BO", { year: "numeric", month: "short" });
};
/** Normaliza una URL social: agrega https:// o mailto: si falta el protocolo */
const normalizeSocialUrl = (url) => {
  const value = String(url || "").trim();
  if (!value) return "";
  if (value.includes("@") && !/^https?:\/\//i.test(value) && !/^mailto:/i.test(value)) {
    return `mailto:${value}`;
  }
  if (/^(https?:\/\/|mailto:)/i.test(value)) return value;
  return `https://${value}`;
};
/** Detecta la plataforma social a partir de la URL (Instagram, GitHub, etc.) */
const detectSocialPlatform = (value) => {
  const low = String(value || "").toLowerCase();
  if (low.includes("instagram")) return "Instagram";
  if (low.includes("facebook")) return "Facebook";
  if (low.includes("linkedin")) return "LinkedIn";
  if (low.includes("github")) return "GitHub";
  if (low.includes("youtube")) return "YouTube";
  if (low.includes("tiktok")) return "TikTok";
  if (low.includes("twitter") || low.includes("x.com")) return "X (Twitter)";
  if (low.includes("@") || low.includes("mailto:")) return "Correo";
  return "Enlace";
};
/**
 * Editor principal del portafolio del usuario.
 * Gestiona secciones de perfil, habilidades, proyectos y redes sociales.
 * @param {Object} userData - Datos del usuario autenticado
 * @param {boolean} isDark - Tema oscuro activo
 * @param {string} activeSection - Sección activa del sidebar
 */
export default function SkillsEditor({
  userData,
  isDark,
  activeSection = "inicio",
  onGoToHabilidad = () => {},
  onGoToProyecto = () => {},
  onBack = () => {},
  onEditProyecto = () => {},
  onVerProyecto = () => {},
}) {
  const { setUserData, debouncedRefresh } = useApp();

  // Modales de edición inline
  const [editBio, setEditBio] = useState(false);
  const [showCompletarDatos, setShowCompletarDatos] = useState(false);
  const [completarForm, setCompletarForm] = useState({ titulo: "", telefono: "", biografia: "" });
  const [savingCompletar, setSavingCompletar] = useState(false);
  const [completarPhoto, setCompletarPhoto] = useState(null);
  const [completarPhotoPreview, setCompletarPhotoPreview] = useState(null);
  const completarFotoRef = useRef(null);
  const [isEditingProyectos, setIsEditingProyectos] = useState(false);
  const [isDeletingProyectos, setIsDeletingProyectos] = useState(false);
  const [bioForm, setBioForm] = useState({
    nombreCompleto: userData?.nombreCompleto || "",
    apellidoCompleto: userData?.apellidoCompleto || "",
    titulo: userData?.titulo || "",
    biografia: userData?.biografia || "",
    telefono: userData?.telefono || "",
    visibilidad: userData?.visibilidad || "publico",
    redes_sociales: userData?.redes_sociales || [],
  });

  const [editHab, setEditHab] = useState(false);
  const [deleteHab, setDeleteHab] = useState(false);
  const [techList, setTechList] = useState(userData?.techSkills || []);
  const [softList, setSoftList] = useState(userData?.softSkills || []);
  const [editRedes, setEditRedes] = useState(false);
  const [deleteRedes, setDeleteRedes] = useState(false);
  const [showAddRed, setShowAddRed] = useState(false);
  const [addRedForm, setAddRedForm] = useState({ plataforma: "", url: "" });
  const [redesForm, setRedesForm] = useState(userData?.redes_sociales || []);
  const [savingRedes, setSavingRedes] = useState(false);

  const [toast, setToast] = useState(null);
  const [savingBio, setSavingBio] = useState(false);
  const [savingHab, setSavingHab] = useState(false);
  const [deletingProyecto, setDeletingProyecto] = useState(null);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [showAddProyecto, setShowAddProyecto] = useState(false);
  const [viewProjectModal, setViewProjectModal] = useState(null);
  const [editProjectModal, setEditProjectModal] = useState(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null); // { proyecto, idx }
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [pendingPhoto, setPendingPhoto] = useState(null);      // File object
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState(null); // blob URL
  const [pendingCI, setPendingCI] = useState(null);
  const [pendingCIPreview, setPendingCIPreview] = useState(null);
  const [savingCI, setSavingCI] = useState(false);
  const fotoRef = useRef(null);
  const ciRef = useRef(null);

  const text = isDark ? "#fff" : "#111";
  const sub = isDark ? "#94a3b8" : "#807F81";
  const border = isDark ? "#1D283A" : "#E2E8F0";
  const box = isDark ? "#0F172A" : "#F8FAFC";
  const lapiz = isDark ? lapizClaro : lapizOscuro;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openRedesEditor = () => {
    setRedesForm((userData?.redes_sociales || []).map((red) => ({
      plataforma: red.plataforma || detectSocialPlatform(red.url),
      url: red.url || "",
    })));
    setEditRedes(true);
  };

  const saveRedes = async () => {
    const validRedes = redesForm
      .map((red) => ({
        plataforma: (red.plataforma || detectSocialPlatform(red.url)).trim(),
        url: normalizeSocialUrl(red.url),
      }))
      .filter((red) => red.url);

    setSavingRedes(true);
    try {
      const { data } = await perfilAPI.actualizar({
        redes_sociales: validRedes,
      });

      if (!data.ok) {
        showToast(data.mensaje || "Error al guardar redes sociales", "error");
        return;
      }

      setUserData({ ...userData, redes_sociales: validRedes });
      debouncedRefresh();
      setEditRedes(false);
      showToast("Redes sociales actualizadas correctamente");
    } catch (err) {
      showToast(err.response?.data?.mensaje || "Error al guardar redes sociales", "error");
    } finally {
      setSavingRedes(false);
    }
  };

  const overlay = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 300,
    padding: 20,
  };
  const modalBox = {
    background: isDark ? "#0F172A" : "#fff",
    border: `1px solid ${border}`,
    borderRadius: 14,
    padding: "24px",
    width: "100%",
    maxWidth: 480,
    maxHeight: "90vh",
    overflowY: "auto",
    boxSizing: "border-box",
  };
  const inp = {
    background: isDark ? "#1D283A" : "#F8FAFC",
    border: `1px solid ${border}`,
    color: text,
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };
  const lbl = {
    color: sub,
    fontSize: 12,
    marginBottom: 4,
    display: "block",
  };

  // Guardar biografía + foto (si hay pendiente) via API
 const saveBio = async () => {
  // Validaciones de campos obligatorios
  if (!bioForm.nombreCompleto.trim()) {
    showToast("El nombre completo es obligatorio", "error");
    return;
  }
  if (!bioForm.apellidoCompleto.trim()) {
    showToast("El apellido es obligatorio", "error");
    return;
  }
  if (!bioForm.titulo.trim()) {
    showToast("El título es obligatorio", "error");
    return;
  }

  setSavingBio(true);
  try {
    const { data } = await perfilAPI.actualizar({
      nombre: bioForm.nombreCompleto,
      apellido: bioForm.apellidoCompleto,
      profesion: bioForm.titulo,
      titulo_profesional: bioForm.titulo,
      biografia: bioForm.biografia,
      visibilidad: bioForm.visibilidad,
      redes_sociales: bioForm.redes_sociales,
      telefono: bioForm.telefono,
    });
    if (!data.ok) {
      showToast(data.mensaje || "Error al guardar", "error");
      setSavingBio(false);
      return;
    }

    if (pendingPhoto) {
      try {
        const { data: fotoResp } = await perfilAPI.subirFoto(pendingPhoto);
        if (!fotoResp.ok) {
          showToast("Datos guardados, pero error al subir foto", "error");
        }
      } catch {
        showToast("Datos guardados, pero error al subir foto", "error");
      }
      setPendingPhoto(null);
      if (pendingPhotoPreview) {
        URL.revokeObjectURL(pendingPhotoPreview);
        setPendingPhotoPreview(null);
      }
    }

    showToast("Cambios guardados correctamente");
    debouncedRefresh();
    setEditBio(false);
  } catch (err) {
    showToast(
      err.response?.data?.mensaje || "Error de conexión",
      "error"
    );
  } finally {
    setSavingBio(false);
  }
};

  // Guardar habilidades via API (sincronizar)
  const saveHab = async () => {
    setSavingHab(true);
    try {
      // Filtrar items con id_habilidad válido
      const techPayload = techList
        .filter((s) => s.id_habilidad)
        .map((s) => ({
          id_habilidad: s.id_habilidad,
          nivel: s.nivel ?? 50,
        }));

      const softPayload = softList
        .filter((s) => typeof s !== "string" && s.id_habilidad)
        .map((s) => ({
          id_habilidad: s.id_habilidad,
        }));

      // Ejecutar ambas sincronizaciones en paralelo
      const [techRes, softRes] = await Promise.allSettled([
        habilidadAPI.sincronizar("tecnica", techPayload),
        habilidadAPI.sincronizar("blanda", softPayload),
      ]);

      const techOk = techRes.status === "fulfilled" && techRes.value.data?.ok;
      const softOk = softRes.status === "fulfilled" && softRes.value.data?.ok;

      if (techOk && softOk) {
        showToast("Habilidades actualizadas correctamente");
      } else if (techOk || softOk) {
        showToast("Algunas habilidades no se sincronizaron", "error");
      } else {
        showToast("Error al sincronizar habilidades", "error");
      }

      debouncedRefresh();
      setEditHab(false);
    } catch (err) {
      showToast(
        err.response?.data?.mensaje || "Error al sincronizar habilidades",
        "error"
      );
    } finally {
      setSavingHab(false);
    }
  };

  // Eliminar proyecto via API — con confirmación
  const handleDeleteProyecto = async () => {
    if (!deleteConfirmModal) return;
    const { proyecto, idx } = deleteConfirmModal;
    setDeletingProyecto(idx);
    try {
      const { data } = await proyectoAPI.eliminar(proyecto.id_proyecto);
      if (data.ok) {
        showToast("Proyecto eliminado correctamente");
        debouncedRefresh();
      } else {
        showToast(data.mensaje || "Error al eliminar", "error");
      }
    } catch (err) {
      showToast(
        err.response?.data?.mensaje || "Error al eliminar proyecto",
        "error"
      );
    } finally {
      setDeletingProyecto(null);
      setDeleteConfirmModal(null);
      setDeleteConfirmText("");
    }
  };

  const handleDeleteSkill = async (skill) => {
    const idHabilidad = skill.id_habilidad;
    const nombre = typeof skill === "string" ? skill : skill.nombre;
    
    if (!idHabilidad) {
      showToast("No se pudo identificar el ID de la habilidad", "error");
      return;
    }

    const confirmDelete = window.confirm(`¿Estás seguro de que deseas eliminar la habilidad "${nombre}"?`);
    if (!confirmDelete) return;

    try {
      const { data } = await habilidadAPI.eliminar(idHabilidad);
      if (data.ok) {
        showToast(`Habilidad "${nombre}" eliminada correctamente`);
        setTechList((prev) => prev.filter((s) => s.id_habilidad !== idHabilidad));
        setSoftList((prev) => prev.filter((s) => (typeof s === "string" ? s : s.id_habilidad) !== idHabilidad));
        debouncedRefresh();
      } else {
        showToast(data.mensaje || "Error al eliminar la habilidad", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.mensaje || "Error al eliminar la habilidad", "error");
    }
  };

  const handleDeleteRed = async (idxToDelete) => {
    const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar esta red social?");
    if (!confirmDelete) return;

    const updatedRedes = (userData?.redes_sociales || []).filter((_, idx) => idx !== idxToDelete);
    try {
      const { data } = await perfilAPI.actualizar({
        redes_sociales: updatedRedes,
      });

      if (!data.ok) {
        showToast(data.mensaje || "Error al eliminar la red social", "error");
        return;
      }

      setUserData({ ...userData, redes_sociales: updatedRedes });
      debouncedRefresh();
      showToast("Red social eliminada correctamente");
    } catch (err) {
      showToast(err.response?.data?.mensaje || "Error al eliminar la red social", "error");
    }
  };

  const handleAddRed = async () => {
    if (!addRedForm.url.trim()) {
      showToast("La URL o correo es obligatorio", "error");
      return;
    }
    const plat = (addRedForm.plataforma || detectSocialPlatform(addRedForm.url)).trim();
    const newRed = {
      plataforma: plat,
      url: normalizeSocialUrl(addRedForm.url),
    };

    const updatedRedes = [...(userData?.redes_sociales || []), newRed];
    setSavingRedes(true);
    try {
      const { data } = await perfilAPI.actualizar({
        redes_sociales: updatedRedes,
      });

      if (!data.ok) {
        showToast(data.mensaje || "Error al añadir la red social", "error");
        return;
      }

      setUserData({ ...userData, redes_sociales: updatedRedes });
      debouncedRefresh();
      setShowAddRed(false);
      showToast("Red social añadida correctamente");
    } catch (err) {
      showToast(err.response?.data?.mensaje || "Error al añadir la red social", "error");
    } finally {
      setSavingRedes(false);
    }
  };

  const removeTech = (i) =>
    setTechList((l) => l.filter((_, idx) => idx !== i));
  const removeSoft = (i) =>
    setSoftList((l) => l.filter((_, idx) => idx !== i));
  const updateTechLevel = (i, val) =>
    setTechList((l) =>
      l.map((s, idx) => (idx === i ? { ...s, nivel: val } : s))
    );

  const section = {
    border: `1px solid ${border}`,
    borderRadius: 10,
    padding: "16px 20px",
    background: box,
    width: "100%",
    boxSizing: "border-box",
  };

  const openViewProjectModal = async (project) => {
    setViewProjectModal(project);

    const projectId = project?.id_proyecto || project?.id;
    if (!projectId) return;

    try {
      const { data } = await proyectoAPI.obtener(projectId);
      if (data?.ok && data.proyecto) {
        setViewProjectModal({ ...project, ...data.proyecto });
      }
    } catch {
      // Mantener la información que ya estaba cargada.
    }
  };

  const editBtn = (label, onClick) => (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        color: sub,
        fontSize: 13,
        padding: 0,
      }}
    >
      <img src={lapiz} alt="editar" style={{ width: 14, height: 14 }} />
      <span>{label}</span>
    </button>
  );

  const addBtn = (label, onClick) => (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 5,
        color: "#3B82F6",
        fontSize: 13,
        fontWeight: 600,
        padding: 0,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      <span>{label}</span>
    </button>
  );

  const deleteBtn = (label, onClick) => (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        color: "#ef4444",
        fontSize: 13,
        padding: 0,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
      <span>{label}</span>
    </button>
  );

  const techSkills = userData?.techSkills || [];
  const softSkills = userData?.softSkills || [];
  const proyectos = userData?.proyectos || [];

  const initials =
    `${(userData?.nombreCompleto || "")[0] || ""}${
      (userData?.apellidoCompleto || "")[0] || ""
    }`.toUpperCase() || "??";

  // Calcular completitud
  const missingData = [];
  let completion = 0;

  if (userData?.titulo) {
    completion += 25;
  } else {
    missingData.push("Título o Profesión");
  }

  if (userData?.telefono) {
    completion += 25;
  } else {
    missingData.push("Teléfono");
  }

  if (userData?.biografia) {
    completion += 25;
  } else {
    missingData.push("Biografía");
  }

  if (userData?.foto_url || userData?.preview) {
    completion += 25;
  } else {
    missingData.push("Foto de Perfil");
  }

  return (
    <div
      style={{
        maxWidth: 820,
        margin: "0 auto",
        padding: "0 16px 80px",
        boxSizing: "border-box",
        width: "100%",
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

      {/* ── Sección: Inicio ── */}
      {activeSection === "inicio" && (
        <UserHomeStats userData={userData} isDark={isDark} />
      )}

      {/* === SECTION: PERFIL === */}
      {activeSection === "perfil" && (<>
      {/* Completar Datos Widget */}
      {completion < 100 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: isDark ? "#0F172A" : "#fff",
            border: `1px solid ${border}`,
            borderRadius: 16,
            padding: 0,
            marginBottom: 24,
            overflow: "hidden",
            boxShadow: isDark ? "none" : "0 1px 6px rgba(0,0,0,0.05)",
          }}
        >
          {/* Top accent bar */}
          <div style={{ height: 3, background: "#3B82F6", width: `${completion}%`, transition: "width 1s ease-out" }} />

          <div style={{ padding: "20px 24px", display: "flex", gap: 20, alignItems: "center" }}>
            {/* Circular progress ring */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <svg width="72" height="72" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="30" fill="none" stroke={isDark ? "#1D283A" : "#E2E8F0"} strokeWidth="6" />
                <motion.circle
                  cx="36" cy="36" r="30"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 30}
                  initial={{ strokeDashoffset: 2 * Math.PI * 30 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 30 * (1 - completion / 100) }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#3B82F6", fontWeight: 800, fontSize: 18 }}>{completion}%</span>
              </div>
            </div>

            {/* Right content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ margin: "0 0 4px", color: text, fontSize: 16, fontWeight: 700 }}>
                Completar Perfil
              </h3>
              <p style={{ margin: "0 0 4px", color: sub, fontSize: 12, lineHeight: 1.4 }}>
                Completa estos datos obligatorios para que tu portafolio sea público
              </p>
              <p style={{ margin: "0 0 12px", color: "#F59E0B", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Sin completar, tu portafolio no será visible para los demás
              </p>

              {/* Checklist items */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "Título o Profesión", done: !!userData?.titulo },
                  { label: "Teléfono", done: !!userData?.telefono },
                  { label: "Biografía", done: !!userData?.biografia },
                  { label: "Foto de Perfil", done: !!(userData?.foto_url || userData?.preview) },
                ].map((item, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {item.done ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    ) : (
                      <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${isDark ? "#334155" : "#CBD5E1"}` }} />
                    )}
                    <span style={{ fontSize: 12, color: item.done ? (isDark ? "#64748b" : "#94a3b8") : text, textDecoration: item.done ? "line-through" : "none", fontWeight: item.done ? 400 : 500 }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setCompletarForm({
                    titulo: userData?.titulo || "",
                    telefono: userData?.telefono || "",
                    biografia: userData?.biografia || "",
                  });
                  setCompletarPhoto(null);
                  setCompletarPhotoPreview(null);
                  setShowCompletarDatos(true);
                }}
                style={{
                  marginTop: 14,
                  background: "#3B82F6",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 20px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Completar ahora
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* PROFILE CARD — social-media style */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: isDark ? "#0F172A" : "#fff",
          border: `1px solid ${border}`,
          borderRadius: 16,
          padding: "24px 28px",
          marginBottom: 24,
          boxShadow: isDark ? "none" : "0 1px 6px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
          {userData?.preview || userData?.foto_url ? (
            <img
              src={userData.preview || userData.foto_url}
              style={{
                width: 72, height: 72, borderRadius: "50%",
                objectFit: "cover", flexShrink: 0,
                border: `3px solid ${isDark ? "#1D283A" : "#E2E8F0"}`,
              }}
              alt=""
            />
          ) : (
            <DefaultAvatar size={72} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{
              color: text, fontSize: 20, fontWeight: 700, margin: "0 0 4px",
              lineHeight: 1.2, display: "flex", alignItems: "center", gap: 6,
            }}>
              <span>{userData?.nombreCompleto}{userData?.apellidoCompleto ? ` ${userData?.apellidoCompleto}` : ''}</span>
              <VerificationBadge ciEstado={userData?.ci_estado} size={20} showUnverified />
            </h2>
            {userData?.titulo && (
              <span style={{
                display: "inline-block", fontSize: 12, fontWeight: 600,
                color: "#3B82F6", background: isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.08)",
                padding: "3px 10px", borderRadius: 6, marginBottom: 6,
              }}>
                {userData.titulo}
              </span>
            )}
            {userData?.email && (
              <div style={{ color: sub, fontSize: 12, marginTop: 4 }}>
                {userData.email}
              </div>
            )}
            {userData?.telefono && (
              <div style={{ color: sub, fontSize: 12, marginTop: 4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, verticalAlign: "-2px" }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                {userData.telefono}
              </div>
            )}
          </div>
        </div>
        {userData?.biografia ? (
          <p style={{
            color: text, fontSize: 14, lineHeight: 1.65,
            margin: "16px 0 0", padding: "14px 16px",
            background: isDark ? "rgba(30,41,59,0.5)" : "#F8FAFC",
            borderRadius: 10, borderLeft: "3px solid #3B82F6",
            whiteSpace: "pre-wrap", wordBreak: "break-word",
          }}>
            {userData.biografia}
          </p>
        ) : (
          <p style={{
            color: sub, fontSize: 13, fontStyle: "italic",
            margin: "14px 0 0", padding: "12px 16px",
            background: isDark ? "rgba(30,41,59,0.3)" : "#F8FAFC",
            borderRadius: 10, borderLeft: "3px solid #3B82F6",
          }}>
            Añade una breve biografía desde &quot;Editar Datos&quot;...
          </p>
        )}
      </motion.div>

      {/* Editar Datos — solo visible cuando el perfil está completo */}
      {completion >= 100 && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 28,
          }}
        >
          {editBtn("Editar Datos", () => {
            setBioForm({
              nombreCompleto: userData?.nombreCompleto || "",
              apellidoCompleto: userData?.apellidoCompleto || "",
              titulo: userData?.titulo || "",
              biografia: userData?.biografia || "",
              visibilidad: userData?.visibilidad || "publico",
              redes_sociales: userData?.redes_sociales || [],
              telefono: userData?.telefono || "",
            });
            setEditBio(true);
          })}
        </div>
      )}
      </>)}

      {/* ── Sección: Habilidades ── */}
      {activeSection === "habilidades" && (<>
      {/* HABILIDADES */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{ marginBottom: 8 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p
            style={{
              color: text,
              fontWeight: 700,
              fontSize: 17,
              margin: 0,
              padding: 0,
            }}
          >
            Habilidades
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {addBtn("Añadir Habilidades", () => setShowAddSkill(true))}
            {editBtn("Editar Habilidades", () => {
              setTechList(userData?.techSkills || []);
              setSoftList(userData?.softSkills || []);
              setEditHab(true);
            })}
            {deleteBtn("Eliminar Habilidades", () => {
              setTechList(userData?.techSkills || []);
              setSoftList(userData?.softSkills || []);
              setDeleteHab(true);
            })}
          </div>
        </div>

        {/* Técnicas */}
        <div style={section}>
          <p
            style={{
              color: "#3B82F6",
              fontWeight: 700,
              fontSize: 14,
              marginBottom: 10,
            }}
          >
            Habilidades Técnicas
          </p>
          {techSkills.length === 0 ? (
            <p style={{ color: sub, fontSize: 13 }}>
              Aún no hay habilidades técnicas.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px,1fr))",
                gap: "16px 24px",
              }}
            >
              {techSkills.map((s, i) => (
                <motion.div
                  key={s.id_habilidad || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ color: sub, fontSize: 13 }}>
                      {s.nombre}
                    </span>
                    <span style={{ color: sub, fontSize: 13 }}>
                      {s.nivel}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: isDark ? "#1D283A" : "#E2E8F0",
                      borderRadius: 99,
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${s.nivel}%` }}
                      transition={{
                        duration: 0.6,
                        ease: "easeOut",
                        delay: i * 0.05,
                      }}
                      style={{
                        height: "100%",
                        background: "#3B82F6",
                        borderRadius: 99,
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* BLANDAS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ marginBottom: 8 }}
      >
        <div style={section}>
          <p
            style={{
              color: "#3B82F6",
              fontWeight: 700,
              fontSize: 14,
              marginBottom: 10,
            }}
          >
            Habilidades Blandas
          </p>
          {softSkills.length === 0 ? (
            <p style={{ color: sub, fontSize: 13 }}>
              Aún no hay habilidades blandas.
            </p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {softSkills.map((s, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    border: `1px solid ${border}`,
                    borderRadius: 6,
                    padding: "6px 16px",
                    color: text,
                    fontSize: 14,
                  }}
                >
                  {typeof s === "string" ? s : s.nombre}
                </motion.span>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      </>)}

      {/* ── Sección: Proyectos ── */}
      {activeSection === "proyectos" && (<>
      {/* PROYECTOS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        style={{ marginBottom: 10 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p
            style={{
              color: text,
              fontWeight: 700,
              fontSize: 17,
              margin: 0,
              padding: 0,
            }}
          >
            Proyectos
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {addBtn("Añadir Proyecto", () => setShowAddProyecto(true))}
            {proyectos.length > 0 && (
              <>
                <button
                  onClick={() => {
                    setIsEditingProyectos(!isEditingProyectos);
                    setIsDeletingProyectos(false);
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: sub, fontSize: 13, display: "flex", alignItems: "center", gap: 6, padding: 0 }}
                >
                  <img src={lapiz} alt="editar" style={{ width: 14, height: 14 }} />
                  <span>{isEditingProyectos ? "Hecho" : "Editar Proyectos"}</span>
                </button>
                <button
                  onClick={() => {
                    setIsDeletingProyectos(!isDeletingProyectos);
                    setIsEditingProyectos(false);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#ef4444",
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: 0
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                  <span>{isDeletingProyectos ? "Hecho" : "Eliminar Proyectos"}</span>
                </button>
              </>
            )}
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))",
            gap: 16,
          }}
        >
          {proyectos.length === 0 ? (
            <p style={{ color: sub, fontSize: 13 }}>
              Aún no hay proyectos añadidos.
            </p>
          ) : (
            proyectos.map((p, i) => (
              <motion.div
                key={p.id_proyecto || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ scale: 1.03 }}
                style={{
                  background: isDark ? "#0f1f35" : "#fff",
                  border: `1px solid ${border}`,
                  borderRadius: 12,
                  overflow: "hidden",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                {/* Pin de destacado (Top Left) */}
                <div style={{ position: "absolute", top: 8, left: 8, zIndex: 10 }}>
                  <PinToggle 
                    projectId={p.id_proyecto} 
                    initiallyVisible={p.visible_portafolio !== false} 
                  />
                </div>

                <div onClick={() => openViewProjectModal(p)}>
                  <div
                    style={{
                      width: "100%",
                      height: 130,
                      background: isDark ? "#1D283A" : "#E2E8F0",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {projectImage(p) ? (
                      <img
                        src={projectImage(p)}
                        alt="proyecto"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <ProjectImageFallback title={p.titulo || p.nombre || "Proyecto"} height="100%" />
                    )}
                  </div>
                  <div style={{ padding: "12px 14px", minWidth: 0 }}>
                    <p
                      style={{
                        color: text,
                        fontWeight: 700,
                        fontSize: 14,
                        marginBottom: 6,
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                      }}
                    >
                      {p.titulo || p.nombre}
                    </p>
                    <p
                      style={{
                        color: sub,
                        fontSize: 12,
                        lineHeight: 1.5,
                        marginBottom: 8,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                      }}
                    >
                      {p.descripcion}
                    </p>
                    {p.habilidades?.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 5,
                        }}
                      >
                        {p.habilidades.map((h, j) => (
                          <span
                            key={j}
                            style={{
                              background: "#3B82F6",
                              color: "#fff",
                              borderRadius: 4,
                              padding: "2px 8px",
                              fontSize: 11,
                            }}
                          >
                            {typeof h === "string" ? h : h.nombre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Botones de acción sobre la tarjeta (solo en modo edición) */}
                {isEditingProyectos && (
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      display: "flex",
                      gap: 4,
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditProjectModal(p);
                      }}
                      style={{
                        background: "rgba(59,130,246,0.85)",
                        border: "none",
                        borderRadius: 6,
                        padding: "5px",
                        cursor: "pointer",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <img src={lapizClaro} alt="editar" style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                )}
                {isDeletingProyectos && (
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      display: "flex",
                      gap: 4,
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmModal({ proyecto: p, idx: i });
                        setDeleteConfirmText("");
                      }}
                      disabled={deletingProyecto === i}
                      style={{
                        background: "rgba(239,68,68,0.85)",
                        border: "none",
                        borderRadius: 6,
                        padding: "5px 7px",
                        cursor: "pointer",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {deletingProyecto === i ? "..." : "✕"}
                    </button>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
      </>)}

      {/* ── Sección: Redes Sociales ── */}
      {activeSection === "redes" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          style={{ marginBottom: 10 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
            <div>
              <p style={{ color: text, fontWeight: 700, fontSize: 17, margin: 0 }}>Redes Sociales</p>
              <p style={{ color: sub, fontSize: 13, margin: "4px 0 0" }}>Añade enlaces para que las personas puedan contactarte o revisar tu trabajo.</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {addBtn("Añadir Red Social", () => {
                setAddRedForm({ plataforma: "", url: "" });
                setShowAddRed(true);
              })}
              {editBtn("Editar Redes Sociales", openRedesEditor)}
              {deleteBtn("Eliminar Redes Sociales", () => setDeleteRedes(true))}
            </div>
          </div>

          <div style={section}>
            {((userData?.redes_sociales || []).length === 0 && !userData?.linkedin_url && !userData?.github_url) ? (
              <p style={{ color: sub, fontSize: 13, margin: 0 }}>Aún no tienes redes sociales registradas.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                {userData?.linkedin_url && (
                  <a href={normalizeSocialUrl(userData.linkedin_url)} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "#3B82F6", background: isDark ? "#0F172A" : "#fff", border: `1px solid ${border}`, borderRadius: 10, padding: "12px 14px", fontWeight: 700, fontSize: 13 }}>
                    🔗 LinkedIn
                  </a>
                )}
                {userData?.github_url && (
                  <a href={normalizeSocialUrl(userData.github_url)} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "#3B82F6", background: isDark ? "#0F172A" : "#fff", border: `1px solid ${border}`, borderRadius: 10, padding: "12px 14px", fontWeight: 700, fontSize: 13 }}>
                    🔗 GitHub
                  </a>
                )}
                {(userData?.redes_sociales || []).map((red, i) => (
                  <a key={i} href={normalizeSocialUrl(red.url)} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "#3B82F6", background: isDark ? "#0F172A" : "#fff", border: `1px solid ${border}`, borderRadius: 10, padding: "12px 14px", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                    <span>🔗</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{red.plataforma || detectSocialPlatform(red.url)}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 14 }}>
          </div>
        </motion.div>
      )}

      {/* === SECTION: EXPERIENCIA LABORAL === */}
      {activeSection === "exp_laboral" && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
      >
        <ExperienciaLaboral isDark={isDark} />
      </motion.div>
      )}

      {/* === SECTION: FORMACIÓN ACADÉMICA === */}
      {activeSection === "formacion_academica" && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
      >
        <FormacionAcademica isDark={isDark} />
      </motion.div>
      )}

      {/* ====== MODAL REDES SOCIALES ====== */}
      <AnimatePresence>
        {editRedes && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={overlay}
            onClick={() => setEditRedes(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 22, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
              style={{ ...modalBox, maxWidth: 520 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 18 }}>
                <div>
                  <h3 style={{ color: text, fontWeight: 800, margin: "0 0 4px", fontSize: 20 }}>Redes Sociales</h3>
                  <p style={{ color: sub, fontSize: 13, margin: 0, lineHeight: 1.5 }}>Agrega enlaces como LinkedIn, GitHub, Instagram, Facebook, YouTube, TikTok o correo.</p>
                </div>
                <button
                  onClick={() => setEditRedes(false)}
                  style={{ background: isDark ? "#1D283A" : "#F1F5F9", color: text, border: `1px solid ${border}`, borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontWeight: 800 }}
                >
                  ×
                </button>
              </div>

              {redesForm.length === 0 && (
                <div style={{ border: `1px dashed ${border}`, borderRadius: 12, padding: "18px 14px", color: sub, fontSize: 13, textAlign: "center", marginBottom: 14 }}>
                  Todavía no agregaste ninguna red. Presiona “Añadir otra red”.
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                {redesForm.map((red, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 8, alignItems: "center" }}>
                    <input
                      placeholder="Plataforma"
                      value={red.plataforma || ""}
                      onChange={(e) => {
                        const next = [...redesForm];
                        next[i] = { ...next[i], plataforma: e.target.value };
                        setRedesForm(next);
                      }}
                      style={inp}
                    />
                    <input
                      placeholder="URL o correo"
                      value={red.url || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        const next = [...redesForm];
                        next[i] = {
                          ...next[i],
                          url: value,
                          plataforma: next[i].plataforma || detectSocialPlatform(value),
                        };
                        setRedesForm(next);
                      }}
                      style={inp}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  onClick={() => setEditRedes(false)}
                  style={{ background: "transparent", color: sub, border: `1px solid ${border}`, borderRadius: 8, padding: "9px 16px", cursor: "pointer", fontWeight: 700 }}
                >
                  Cancelar
                </button>
                <button
                  onClick={saveRedes}
                  disabled={savingRedes}
                  style={{ background: "#3B82F6", color: "#fff", border: "none", borderRadius: 8, padding: "9px 22px", cursor: savingRedes ? "not-allowed" : "pointer", fontWeight: 800, opacity: savingRedes ? 0.7 : 1 }}
                >
                  {savingRedes ? "Guardando..." : "Guardar Redes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== MODAL ELIMINAR REDES SOCIALES ====== */}
      <AnimatePresence>
        {deleteRedes && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={overlay}
            onClick={() => setDeleteRedes(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 22, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
              style={{ ...modalBox, maxWidth: 520 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 18 }}>
                <div>
                  <h3 style={{ color: "#EF4444", fontWeight: 800, margin: "0 0 4px", fontSize: 20 }}>Eliminar Redes Sociales</h3>
                  <p style={{ color: sub, fontSize: 13, margin: 0, lineHeight: 1.5 }}>Elimina de forma permanente redes sociales de tu perfil.</p>
                </div>
                <button
                  onClick={() => setDeleteRedes(false)}
                  style={{ background: isDark ? "#1D283A" : "#F1F5F9", color: text, border: `1px solid ${border}`, borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontWeight: 800 }}
                >
                  ✕
                </button>
              </div>

              {(!userData?.redes_sociales || userData.redes_sociales.length === 0) ? (
                <div style={{ border: `1px dashed ${border}`, borderRadius: 12, padding: "18px 14px", color: sub, fontSize: 13, textAlign: "center", marginBottom: 14 }}>
                  No tienes redes sociales registradas para eliminar.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                  {userData.redes_sociales.map((red, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        background: isDark ? "#1D283A" : "#F1F5F9",
                        borderRadius: 8,
                        padding: "10px 12px",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                        <span style={{ color: text, fontSize: 13, fontWeight: 600 }}>
                          {red.plataforma || detectSocialPlatform(red.url)}
                        </span>
                        <span style={{ color: sub, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {red.url}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteRed(i)}
                        style={{
                          background: "#ef4444",
                          border: "none",
                          color: "#fff",
                          borderRadius: 6,
                          padding: "6px 12px",
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          flexShrink: 0,
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <button
                  onClick={() => setDeleteRedes(false)}
                  style={{
                    background: isDark ? "#1D283A" : "#E2E8F0",
                    border: "none",
                    color: text,
                    borderRadius: 8,
                    padding: "10px 24px",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== MODAL AÑADIR RED SOCIAL ====== */}
      <AnimatePresence>
        {showAddRed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={overlay}
            onClick={() => setShowAddRed(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 22, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
              style={{ ...modalBox, maxWidth: 520 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 18 }}>
                <div>
                  <h3 style={{ color: text, fontWeight: 800, margin: "0 0 4px", fontSize: 20 }}>Añadir Red Social</h3>
                  <p style={{ color: sub, fontSize: 13, margin: 0, lineHeight: 1.5 }}>Registra un nuevo enlace a tu perfil.</p>
                </div>
                <button
                  onClick={() => setShowAddRed(false)}
                  style={{ background: isDark ? "#1D283A" : "#F1F5F9", color: text, border: `1px solid ${border}`, borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontWeight: 800 }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={lbl}>Plataforma</label>
                  <input
                    placeholder="Ej: GitHub, LinkedIn, Twitter, etc."
                    value={addRedForm.plataforma || ""}
                    onChange={(e) => setAddRedForm({ ...addRedForm, plataforma: e.target.value })}
                    style={inp}
                  />
                </div>
                <div>
                  <label style={lbl}>URL o correo</label>
                  <input
                    placeholder="https://github.com/usuario o correo@ejemplo.com"
                    value={addRedForm.url || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setAddRedForm({
                        ...addRedForm,
                        url: value,
                        plataforma: addRedForm.plataforma || detectSocialPlatform(value),
                      });
                    }}
                    style={inp}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  onClick={() => setShowAddRed(false)}
                  style={{ background: "transparent", color: sub, border: `1px solid ${border}`, borderRadius: 8, padding: "9px 16px", cursor: "pointer", fontWeight: 700 }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddRed}
                  disabled={savingRedes}
                  style={{ background: "#3B82F6", color: "#fff", border: "none", borderRadius: 8, padding: "9px 22px", cursor: savingRedes ? "not-allowed" : "pointer", fontWeight: 800, opacity: savingRedes ? 0.7 : 1 }}
                >
                  {savingRedes ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== MODAL EDITAR DATOS / BIOGRAFÍA ====== */}
      <AnimatePresence>
        {editBio && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={overlay}
            onClick={() => setEditBio(false)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 22, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: isDark ? "#0F172A" : "#fff",
                border: `1px solid ${border}`,
                borderRadius: 20,
                padding: 0,
                width: "100%",
                maxWidth: 520,
                maxHeight: "90vh",
                overflowY: "auto",
                boxSizing: "border-box",
                boxShadow: isDark ? "0 25px 60px rgba(0,0,0,0.5)" : "0 25px 60px rgba(0,0,0,0.1)",
              }}
            >
              {/* Header */}
              <div style={{
                background: "#3B82F6",
                padding: "24px 28px 20px",
                borderRadius: "20px 20px 0 0",
                position: "relative",
              }}>
                <button
                  onClick={() => setEditBio(false)}
                  style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#fff", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  ✕
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  <h3 style={{ margin: 0, color: "#fff", fontSize: 19, fontWeight: 800 }}>Editar Datos</h3>
                </div>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
                  Modifica tu información personal y profesional
                </p>
              </div>

              {/* Body */}
              <div style={{ padding: "24px 28px 28px" }}>
              {[
                { name: "nombreCompleto", label: "Nombre Completo" },
                { name: "apellidoCompleto", label: "Apellido Completo" },
                { name: "titulo", label: "Título o Profesión" },
                { name: "telefono", label: "Teléfono" },
              ].map(({ name, label }) => {
                const disabled = userData?.nombre_modificado && (name === "nombreCompleto" || name === "apellidoCompleto");
                return (
                <div key={name} style={{ marginBottom: 12 }}>
                  <label style={lbl}>{label}</label>
                  <input
                    style={{ ...inp, opacity: disabled ? 0.6 : 1, cursor: disabled ? "not-allowed" : "text" }}
                    value={bioForm[name]}
                    disabled={disabled}
                    onChange={(e) =>
                      setBioForm((f) => ({
                        ...f,
                        [name]: e.target.value,
                      }))
                    }
                  />
                  {disabled ? (
                    <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>
                      Este campo no se puede volver a modificar.
                    </span>
                  ) : (
                    (name === "nombreCompleto" || name === "apellidoCompleto") && (
                      <span style={{ color: sub, fontSize: 11, marginTop: 4, display: "block" }}>
                        ⚠️ Atención: solo podrás modificar tu {label.toLowerCase()} <b>una única vez</b>.
                      </span>
                    )
                  )}
                </div>
              )})}
              <div style={{ marginBottom: 18 }}>
                <label style={lbl}>Biografía</label>
                <textarea
                  rows={4}
                  style={{ ...inp, resize: "vertical" }}
                  value={bioForm.biografia}
                  onChange={(e) =>
                    setBioForm((f) => ({
                      ...f,
                      biografia: e.target.value,
                    }))
                  }
                />
              </div>



              {/* ── Foto de Perfil ── */}
              <div style={{ marginBottom: 18 }}>
                <label style={lbl}>Foto de Perfil</label>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {pendingPhotoPreview || userData?.preview || userData?.foto_url ? (
                    <img
                      src={pendingPhotoPreview || userData?.preview || userData?.foto_url}
                      alt="perfil"
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 8,
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <DefaultAvatar size={56} style={{ borderRadius: 8 }} />
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <button
                      onClick={() => fotoRef.current?.click()}
                      style={{
                        background: "#3B82F6",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "7px 16px",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      Cambiar Foto
                    </button>
                    <span style={{ color: sub, fontSize: 11 }}>
                      JPG/PNG · Máx. 2MB
                      {pendingPhoto && " ✓ Foto seleccionada"}
                    </span>
                  </div>
                  <input
                    ref={fotoRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        showToast("La imagen no puede superar 2MB", "error");
                        return;
                      }
                      if (!["image/jpeg", "image/png"].includes(file.type)) {
                        showToast("Solo se permiten JPG/PNG", "error");
                        return;
                      }
                      // Solo guardar localmente — se sube al presionar Guardar
                      if (pendingPhotoPreview) URL.revokeObjectURL(pendingPhotoPreview);
                      setPendingPhoto(file);
                      setPendingPhotoPreview(URL.createObjectURL(file));
                    }}
                  />
                </div>
              </div>

              {/* ── Verificación de Identidad (CI) ── */}
              <div style={{ marginBottom: 18, paddingTop: 14, borderTop: `1px solid ${border}` }}>
                <label style={{ ...lbl, fontWeight: 700, fontSize: 13 }}>Verificación de Identidad</label>
                {userData?.ci_estado ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      background: userData.ci_estado === 'Verificado' ? 'rgba(22,163,74,0.15)' : 'rgba(234,179,8,0.15)',
                      color: userData.ci_estado === 'Verificado' ? '#16a34a' : '#eab308',
                      padding: "6px 12px", borderRadius: 6, fontSize: 13, fontWeight: 600
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        {userData.ci_estado === 'Verificado' ? (
                          <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>
                        ) : (
                          <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
                        )}
                      </svg>
                      {userData.ci_estado}
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: 8 }}>
                    <p style={{ color: sub, fontSize: 12, marginBottom: 10, marginTop: 0 }}>
                      Sube una foto de tu Cédula de Identidad para verificar tu cuenta. Un administrador revisará tu solicitud.
                    </p>
                    {pendingCIPreview && (
                      <img src={pendingCIPreview} alt="CI preview" style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 8, marginBottom: 8, border: `1px solid ${border}` }} />
                    )}
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button
                        onClick={() => ciRef.current?.click()}
                        style={{
                          background: isDark ? "#1D283A" : "#E2E8F0",
                          color: text, border: "none", borderRadius: 6,
                          padding: "7px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13,
                        }}
                      >
                        {pendingCI ? "Cambiar CI" : "Seleccionar CI"}
                      </button>
                      {pendingCI && (
                        <button
                          onClick={async () => {
                            setSavingCI(true);
                            try {
                              const { data: resp } = await perfilAPI.subirCI(pendingCI);
                              if (resp.ok) {
                                showToast("CI enviado para verificación");
                                setPendingCI(null);
                                setPendingCIPreview(null);
                                debouncedRefresh();
                              } else {
                                showToast("Error al subir CI", "error");
                              }
                            } catch { showToast("Error al subir CI", "error"); }
                            finally { setSavingCI(false); }
                          }}
                          disabled={savingCI}
                          style={{
                            background: "#3B82F6",
                            color: "#fff", border: "none", borderRadius: 6,
                            padding: "7px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13,
                            opacity: savingCI ? 0.6 : 1,
                          }}
                        >
                          {savingCI ? "Enviando..." : "Enviar para Verificación"}
                        </button>
                      )}
                      <input
                        ref={ciRef}
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        hidden
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          if (file.size > 2 * 1024 * 1024) { showToast("La imagen no puede superar 2MB", "error"); return; }
                          if (!["image/jpeg", "image/png"].includes(file.type)) { showToast("Solo JPG/PNG", "error"); return; }
                          if (pendingCIPreview) URL.revokeObjectURL(pendingCIPreview);
                          setPendingCI(file);
                          setPendingCIPreview(URL.createObjectURL(file));
                        }}
                      />
                    </div>
                    {pendingCI && (
                      <span style={{ color: "#16a34a", fontSize: 11, marginTop: 4, display: "block" }}>
                        ✓ Archivo seleccionado: {pendingCI.name}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                }}
              >
                <button
                  onClick={() => setEditBio(false)}
                  style={{
                    background: "none",
                    border: `1px solid ${border}`,
                    color: text,
                    borderRadius: 8,
                    padding: "9px 20px",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={saveBio}
                  disabled={savingBio}
                  style={{
                    background:
                      "#3B82F6",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "9px 24px",
                    cursor: savingBio ? "not-allowed" : "pointer",
                    fontWeight: 700,
                    opacity: savingBio ? 0.7 : 1,
                  }}
                >
                  {savingBio ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== MODAL COMPLETAR DATOS (interfaz separada) ====== */}
      <AnimatePresence>
        {showCompletarDatos && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={overlay}
            onClick={() => setShowCompletarDatos(false)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 22, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: isDark ? "#0F172A" : "#fff",
                border: `1px solid ${isDark ? "rgba(59,130,246,0.2)" : "#BFDBFE"}`,
                borderRadius: 20,
                padding: 0,
                width: "100%",
                maxWidth: 520,
                maxHeight: "90vh",
                overflowY: "auto",
                boxSizing: "border-box",
                boxShadow: isDark ? "0 25px 60px rgba(0,0,0,0.5)" : "0 25px 60px rgba(59,130,246,0.15)",
              }}
            >
              {/* Header */}
              <div style={{
                background: "#3B82F6",
                padding: "24px 28px 20px",
                borderRadius: "20px 20px 0 0",
                position: "relative",
              }}>
                <button
                  onClick={() => setShowCompletarDatos(false)}
                  style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#fff", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  ✕
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  <h3 style={{ margin: 0, color: "#fff", fontSize: 19, fontWeight: 800 }}>Completar tu Perfil</h3>
                </div>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
                  Completa los datos faltantes para un portafolio profesional
                </p>
              </div>

              {/* Body */}
              <div style={{ padding: "24px 28px 28px" }}>
                {/* Missing fields indicators */}
                <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
                  {missingData.map((item, idx) => (
                    <span key={idx} style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      background: isDark ? "rgba(239,68,68,0.1)" : "#FEF2F2",
                      color: "#EF4444",
                      fontSize: 11, fontWeight: 600,
                      padding: "5px 10px", borderRadius: 20,
                      border: `1px solid ${isDark ? "rgba(239,68,68,0.2)" : "#FECACA"}`
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {item}
                    </span>
                  ))}
                </div>

                {/* Título field - only if missing */}
                {!userData?.titulo && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: isDark ? "rgba(59,130,246,0.15)" : "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                      <label style={{ color: text, fontSize: 13, fontWeight: 700 }}>Título o Profesión</label>
                    </div>
                    <input
                      style={{ ...inp, borderRadius: 10, padding: "12px 16px", fontSize: 14, transition: "border-color 0.2s", borderColor: completarForm.titulo ? "#3B82F6" : border, boxShadow: completarForm.titulo ? "0 0 0 3px rgba(59,130,246,0.1)" : "none" }}
                      value={completarForm.titulo}
                      placeholder="Ej: Desarrollador Full Stack, Diseñador UX/UI..."
                      onChange={(e) => setCompletarForm(f => ({ ...f, titulo: e.target.value }))}
                    />
                  </motion.div>
                )}

                {/* Teléfono field - only if missing */}
                {!userData?.telefono && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: isDark ? "rgba(59,130,246,0.15)" : "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      </div>
                      <label style={{ color: text, fontSize: 13, fontWeight: 700 }}>Teléfono</label>
                    </div>
                    <input
                      style={{ ...inp, borderRadius: 10, padding: "12px 16px", fontSize: 14, transition: "border-color 0.2s", borderColor: completarForm.telefono ? "#3B82F6" : border, boxShadow: completarForm.telefono ? "0 0 0 3px rgba(59,130,246,0.1)" : "none" }}
                      value={completarForm.telefono}
                      placeholder="Ej: +591 78945612"
                      onChange={(e) => setCompletarForm(f => ({ ...f, telefono: e.target.value }))}
                    />
                  </motion.div>
                )}

                {/* Biografía field - only if missing */}
                {!userData?.biografia && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: isDark ? "rgba(59,130,246,0.15)" : "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                      </div>
                      <label style={{ color: text, fontSize: 13, fontWeight: 700 }}>Biografía</label>
                    </div>
                    <textarea
                      rows={4}
                      style={{ ...inp, borderRadius: 10, padding: "12px 16px", fontSize: 14, resize: "vertical", transition: "border-color 0.2s", borderColor: completarForm.biografia ? "#3B82F6" : border, boxShadow: completarForm.biografia ? "0 0 0 3px rgba(59,130,246,0.1)" : "none" }}
                      value={completarForm.biografia}
                      placeholder="Cuéntanos sobre ti, tu experiencia y lo que te apasiona..."
                      onChange={(e) => setCompletarForm(f => ({ ...f, biografia: e.target.value }))}
                    />
                  </motion.div>
                )}

                {/* Foto de perfil - only if missing */}
                {!userData?.foto_url && !userData?.preview && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} style={{ marginBottom: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: isDark ? "rgba(59,130,246,0.15)" : "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      </div>
                      <label style={{ color: text, fontSize: 13, fontWeight: 700 }}>Foto de Perfil</label>
                      <span style={{ color: sub, fontSize: 11, fontStyle: "italic" }}>(opcional)</span>
                    </div>
                    <div style={{
                      border: `2px dashed ${completarPhotoPreview ? "#3B82F6" : border}`,
                      borderRadius: 12,
                      padding: 20,
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      background: isDark ? "rgba(59,130,246,0.04)" : "#FAFAFE",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                      onClick={() => completarFotoRef.current?.click()}
                    >
                      {completarPhotoPreview ? (
                        <img src={completarPhotoPreview} alt="preview" style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover", border: "3px solid #3B82F6" }} />
                      ) : (
                        <div style={{ width: 64, height: 64, borderRadius: 12, background: isDark ? "#1D283A" : "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={sub} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        </div>
                      )}
                      <div>
                        <p style={{ margin: 0, color: text, fontSize: 13, fontWeight: 600 }}>
                          {completarPhotoPreview ? "Foto seleccionada ✓" : "Haz clic para subir una foto"}
                        </p>
                        <p style={{ margin: "4px 0 0", color: sub, fontSize: 11 }}>JPG/PNG · Máx. 2MB</p>
                      </div>
                    </div>
                    <input
                      ref={completarFotoRef}
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) { showToast("La imagen no puede superar 2MB", "error"); return; }
                        if (!["image/jpeg", "image/png"].includes(file.type)) { showToast("Solo se permiten JPG/PNG", "error"); return; }
                        if (completarPhotoPreview) URL.revokeObjectURL(completarPhotoPreview);
                        setCompletarPhoto(file);
                        setCompletarPhotoPreview(URL.createObjectURL(file));
                      }}
                    />
                  </motion.div>
                )}

                {/* Action buttons */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    onClick={() => setShowCompletarDatos(false)}
                    style={{
                      background: "none",
                      border: `1px solid ${border}`,
                      color: text,
                      borderRadius: 10,
                      padding: "10px 22px",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      setSavingCompletar(true);
                      try {
                        const payload = {
                          profesion: completarForm.titulo || userData?.titulo || "",
                          titulo_profesional: completarForm.titulo || userData?.titulo || "",
                          biografia: completarForm.biografia || userData?.biografia || "",
                          visibilidad: userData?.visibilidad || "publico",
                          telefono: completarForm.telefono || userData?.telefono || "",
                        };
                        const nombreSeguro = (userData?.nombreCompleto || "").trim();
                        const apellidoSeguro = (userData?.apellidoCompleto || "").trim();
                        if (nombreSeguro) payload.nombre = nombreSeguro;
                        if (apellidoSeguro) payload.apellido = apellidoSeguro;
                        const { data } = await perfilAPI.actualizar(payload);
                        if (!data.ok) {
                          showToast(data.mensaje || "Error al guardar", "error");
                          setSavingCompletar(false);
                          return;
                        }
                        if (completarPhoto) {
                          try {
                            const { data: fotoResp } = await perfilAPI.subirFoto(completarPhoto);
                            if (!fotoResp.ok) showToast("Datos guardados, pero error al subir foto", "error");
                          } catch { showToast("Datos guardados, pero error al subir foto", "error"); }
                          setCompletarPhoto(null);
                          if (completarPhotoPreview) { URL.revokeObjectURL(completarPhotoPreview); setCompletarPhotoPreview(null); }
                        }
                        showToast("¡Perfil actualizado correctamente!");
                        debouncedRefresh();
                        setShowCompletarDatos(false);
                      } catch (err) {
                        showToast(err.response?.data?.mensaje || "Error de conexión", "error");
                      } finally {
                        setSavingCompletar(false);
                      }
                    }}
                    disabled={savingCompletar}
                    style={{
                      background: "#3B82F6",
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      padding: "10px 28px",
                      cursor: savingCompletar ? "not-allowed" : "pointer",
                      fontWeight: 700,
                      fontSize: 14,
                      opacity: savingCompletar ? 0.7 : 1,
                      boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
                      transition: "all 0.2s",
                    }}
                  >
                    {savingCompletar ? "Guardando..." : "Completar Perfil"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== MODAL EDITAR HABILIDADES ====== */}
      <AnimatePresence>
        {editHab && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={overlay}
            onClick={() => setEditHab(false)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 22, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: isDark ? "#0F172A" : "#fff",
                border: `1px solid ${border}`,
                borderRadius: 20,
                padding: 0,
                width: "100%",
                maxWidth: 520,
                maxHeight: "90vh",
                overflowY: "auto",
                boxSizing: "border-box",
                boxShadow: isDark ? "0 25px 60px rgba(0,0,0,0.5)" : "0 25px 60px rgba(0,0,0,0.1)",
              }}
            >
              {/* Header */}
              <div style={{
                background: "#3B82F6",
                padding: "24px 28px 20px",
                borderRadius: "20px 20px 0 0",
                position: "relative",
              }}>
                <button
                  onClick={() => setEditHab(false)}
                  style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#fff", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  ✕
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  <h3 style={{ margin: 0, color: "#fff", fontSize: 19, fontWeight: 800 }}>Editar Habilidades</h3>
                </div>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
                  Ajusta los niveles de tus habilidades en tu perfil
                </p>
              </div>

              {/* Body */}
              <div style={{ padding: "24px 28px 28px" }}>

              {/* Técnicas */}
              <p style={{ color: sub, fontSize: 13, marginBottom: 10 }}>
                Técnicas
              </p>
              {techList.length === 0 && (
                <p
                  style={{
                    color: sub,
                    fontSize: 12,
                    marginBottom: 10,
                  }}
                >
                  Sin habilidades técnicas.
                </p>
              )}
              {techList.map((s, i) => (
                <div
                  key={s.id_habilidad || i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                    background: isDark ? "#1D283A" : "#F1F5F9",
                    borderRadius: 8,
                    padding: "10px 12px",
                  }}
                >
                  <span
                    style={{ color: text, fontSize: 13, minWidth: 60 }}
                  >
                    {s.nombre}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={s.nivel}
                    onChange={(e) =>
                      updateTechLevel(i, Number(e.target.value))
                    }
                    style={{ flex: 1, accentColor: "#3B82F6" }}
                  />
                  <span
                    style={{ color: sub, fontSize: 12, minWidth: 36 }}
                  >
                    {s.nivel}%
                  </span>
                </div>
              ))}

              <hr style={{ borderColor: border, margin: "14px 0" }} />

              {/* Blandas */}
              <p style={{ color: sub, fontSize: 13, marginBottom: 10 }}>
                Blandas
              </p>
              {softList.length === 0 && (
                <p
                  style={{
                    color: sub,
                    fontSize: 12,
                    marginBottom: 10,
                  }}
                >
                  Sin habilidades blandas.
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                {softList.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      border: `1px solid ${border}`,
                      borderRadius: 6,
                      padding: "5px 10px",
                    }}
                  >
                    <span style={{ color: text, fontSize: 13 }}>
                      {typeof s === "string" ? s : s.nombre}
                    </span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                }}
              >
                <button
                  onClick={() => setEditHab(false)}
                  style={{
                    background: "none",
                    border: `1px solid ${border}`,
                    color: text,
                    borderRadius: 8,
                    padding: "9px 20px",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={saveHab}
                  disabled={savingHab}
                  style={{
                    background:
                      "#3B82F6",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "9px 24px",
                    cursor: savingHab ? "not-allowed" : "pointer",
                    fontWeight: 700,
                    opacity: savingHab ? 0.7 : 1,
                  }}
                >
                  {savingHab ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== MODAL ELIMINAR HABILIDADES ====== */}
      <AnimatePresence>
        {deleteHab && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={overlay}
            onClick={() => setDeleteHab(false)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 22, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: isDark ? "#0F172A" : "#fff",
                border: `1px solid ${border}`,
                borderRadius: 20,
                padding: 0,
                width: "100%",
                maxWidth: 520,
                maxHeight: "90vh",
                overflowY: "auto",
                boxSizing: "border-box",
                boxShadow: isDark ? "0 25px 60px rgba(0,0,0,0.5)" : "0 25px 60px rgba(0,0,0,0.1)",
              }}
            >
              {/* Header */}
              <div style={{
                background: "#EF4444",
                padding: "24px 28px 20px",
                borderRadius: "20px 20px 0 0",
                position: "relative",
              }}>
                <button
                  onClick={() => setDeleteHab(false)}
                  style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#fff", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  ✕
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                  <h3 style={{ margin: 0, color: "#fff", fontSize: 19, fontWeight: 800 }}>Eliminar Habilidades</h3>
                </div>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
                  Elimina de forma permanente habilidades de tu perfil
                </p>
              </div>

              {/* Body */}
              <div style={{ padding: "24px 28px 28px" }}>

                {/* Técnicas */}
                <p style={{ color: sub, fontSize: 13, marginBottom: 10, fontWeight: 700 }}>
                  Técnicas
                </p>
                {techList.length === 0 && (
                  <p style={{ color: sub, fontSize: 12, marginBottom: 10 }}>
                    Sin habilidades técnicas.
                  </p>
                )}
                {techList.map((s, i) => (
                  <div
                    key={s.id_habilidad || i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      marginBottom: 10,
                      background: isDark ? "#1D283A" : "#F1F5F9",
                      borderRadius: 8,
                      padding: "10px 12px",
                    }}
                  >
                    <span style={{ color: text, fontSize: 13, fontWeight: 600 }}>
                      {s.nombre}
                    </span>
                    <button
                      onClick={() => handleDeleteSkill(s)}
                      style={{
                        background: "#ef4444",
                        border: "none",
                        color: "#fff",
                        borderRadius: 6,
                        padding: "6px 12px",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                      Eliminar
                    </button>
                  </div>
                ))}

                <hr style={{ borderColor: border, margin: "18px 0" }} />

                {/* Blandas */}
                <p style={{ color: sub, fontSize: 13, marginBottom: 10, fontWeight: 700 }}>
                  Blandas
                </p>
                {softList.length === 0 && (
                  <p style={{ color: sub, fontSize: 12, marginBottom: 10 }}>
                    Sin habilidades blandas.
                  </p>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {softList.map((s, i) => {
                    const nombre = typeof s === "string" ? s : s.nombre;
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          background: isDark ? "#1D283A" : "#F1F5F9",
                          borderRadius: 8,
                          padding: "10px 12px",
                        }}
                      >
                        <span style={{ color: text, fontSize: 13, fontWeight: 600 }}>
                          {nombre}
                        </span>
                        <button
                          onClick={() => handleDeleteSkill(s)}
                          style={{
                            background: "#ef4444",
                            border: "none",
                            color: "#fff",
                            borderRadius: 6,
                            padding: "6px 12px",
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                      }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                          Eliminar
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 24,
                  }}
                >
                  <button
                    onClick={() => setDeleteHab(false)}
                    style={{
                      background: isDark ? "#1D283A" : "#E2E8F0",
                      border: "none",
                      color: text,
                      borderRadius: 8,
                      padding: "10px 24px",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== MODAL CONFIRMAR ELIMINACIÓN DE PROYECTO ====== */}
      <AnimatePresence>
        {deleteConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={overlay}
            onClick={() => { setDeleteConfirmModal(null); setDeleteConfirmText(""); }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              style={{ ...modalBox, maxWidth: 420 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ color: "#ef4444", fontWeight: 700, marginBottom: 12, marginTop: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Eliminar Proyecto
              </h3>
              <p style={{ color: sub, fontSize: 14, lineHeight: 1.6, margin: "0 0 16px" }}>
                Estás a punto de eliminar <strong style={{ color: text }}>{deleteConfirmModal.proyecto.titulo || deleteConfirmModal.proyecto.nombre}</strong>. Esta acción es <strong style={{ color: "#ef4444" }}>irreversible</strong>.
              </p>
              <p style={{ color: sub, fontSize: 13, marginBottom: 8 }}>
                Escribe <strong style={{ color: text }}>confirmar</strong> para continuar:
              </p>
              <input
                style={{ ...inp, borderColor: deleteConfirmText === "confirmar" ? "#22c55e" : border, marginBottom: 16 }}
                placeholder="Escribe confirmar"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value.toLowerCase())}
                autoFocus
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  onClick={() => { setDeleteConfirmModal(null); setDeleteConfirmText(""); }}
                  style={{
                    background: "none", border: `1px solid ${border}`,
                    color: text, borderRadius: 8, padding: "9px 20px", cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteProyecto}
                  disabled={deleteConfirmText !== "confirmar" || deletingProyecto !== null}
                  style={{
                    background: deleteConfirmText === "confirmar" ? "#ef4444" : (isDark ? "#1D283A" : "#E2E8F0"),
                    color: deleteConfirmText === "confirmar" ? "#fff" : sub,
                    border: "none", borderRadius: 8, padding: "9px 24px",
                    cursor: deleteConfirmText === "confirmar" ? "pointer" : "not-allowed",
                    fontWeight: 700, opacity: deletingProyecto !== null ? 0.6 : 1,
                    transition: "all 0.2s ease",
                  }}
                >
                  {deletingProyecto !== null ? "Eliminando..." : "Eliminar Proyecto"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ====== MODAL AÑADIR HABILIDAD ====== */}
      <AnimatePresence>
        {showAddSkill && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={overlay}
            onClick={() => setShowAddSkill(false)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 22, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: isDark ? "#0F172A" : "#fff",
                border: `1px solid ${border}`,
                borderRadius: 20,
                padding: 0,
                width: "100%",
                maxWidth: 600,
                maxHeight: "85vh",
                overflowY: "auto",
                boxSizing: "border-box",
                boxShadow: isDark ? "0 25px 60px rgba(0,0,0,0.5)" : "0 25px 60px rgba(0,0,0,0.1)",
              }}
            >
              {/* Header */}
              <div style={{
                background: "#3B82F6",
                padding: "24px 28px 20px",
                borderRadius: "20px 20px 0 0",
                position: "relative",
              }}>
                <button
                  onClick={() => setShowAddSkill(false)}
                  style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#fff", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  ✕
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <h3 style={{ margin: 0, color: "#fff", fontSize: 19, fontWeight: 800 }}>Añadir Habilidades</h3>
                </div>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
                  Selecciona habilidades técnicas y blandas para tu perfil
                </p>
              </div>

              {/* Body */}
              <div style={{ padding: "24px 28px 28px" }}>
              <SkillSelector
                isDark={isDark}
                userData={userData}
                onBack={() => setShowAddSkill(false)}
                onSave={() => {
                  setShowAddSkill(false);
                  debouncedRefresh();
                }}
              />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== MODAL AÑADIR PROYECTO ====== */}
      <AnimatePresence>
        {showAddProyecto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={overlay}
            onClick={() => setShowAddProyecto(false)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 22, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: isDark ? "#0F172A" : "#fff",
                border: `1px solid ${border}`,
                borderRadius: 20,
                padding: 0,
                width: "100%",
                maxWidth: 620,
                maxHeight: "90vh",
                overflowY: "auto",
                boxSizing: "border-box",
                boxShadow: isDark ? "0 25px 60px rgba(0,0,0,0.5)" : "0 25px 60px rgba(0,0,0,0.1)",
              }}
            >
              {/* Header */}
              <div style={{
                background: "#3B82F6",
                padding: "24px 28px 20px",
                borderRadius: "20px 20px 0 0",
                position: "relative",
              }}>
                <button
                  onClick={() => setShowAddProyecto(false)}
                  style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#fff", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  ✕
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <h3 style={{ margin: 0, color: "#fff", fontSize: 19, fontWeight: 800 }}>Añadir Proyecto</h3>
                </div>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
                  Agrega un nuevo proyecto a tu portafolio
                </p>
              </div>

              {/* Body */}
              <div style={{ padding: "24px 28px 28px" }}>
              <ProyectoForm
                isDark={isDark}
                onBack={() => setShowAddProyecto(false)}
                onSave={() => {
                  setShowAddProyecto(false);
                  debouncedRefresh();
                }}
              />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== MODAL VER PROYECTO: solo lectura ====== */}
      <ProjectReadOnlyModal
        project={viewProjectModal}
        onClose={() => setViewProjectModal(null)}
        isDark={isDark}
        text={text}
        sub={sub}
        border={border}
      />

      {/* ====== MODAL EDITAR PROYECTO ====== */}
      <AnimatePresence>
        {editProjectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={overlay}
            onClick={() => setEditProjectModal(null)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 22, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: isDark ? "#0F172A" : "#fff",
                border: `1px solid ${border}`,
                borderRadius: 20,
                padding: 0,
                width: "100%",
                maxWidth: 620,
                maxHeight: "90vh",
                overflowY: "auto",
                boxSizing: "border-box",
                boxShadow: isDark ? "0 25px 60px rgba(0,0,0,0.5)" : "0 25px 60px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{
                background: "#3B82F6",
                padding: "24px 28px 20px",
                borderRadius: "20px 20px 0 0",
                position: "relative",
              }}>
                <button
                  onClick={() => setEditProjectModal(null)}
                  style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#fff", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  ✕
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <img src={lapizClaro} alt="editar" style={{ width: 20, height: 20 }} />
                  <h3 style={{ margin: 0, color: "#fff", fontSize: 19, fontWeight: 800 }}>Editar Proyecto</h3>
                </div>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
                  Modifica los datos del proyecto sin salir de esta pantalla
                </p>
              </div>

              <div style={{ padding: "24px 28px 28px" }}>
                <ProyectoForm
                  isDark={isDark}
                  initialData={editProjectModal}
                  onBack={() => setEditProjectModal(null)}
                  onSave={() => {
                    setEditProjectModal(null);
                    debouncedRefresh();
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProjectReadOnlyModal({ project, onClose, isDark, text, sub, border }) {
  const [carouselIdx, setCarouselIdx] = useState(0);
  const cardBg = isDark ? "#0F172A" : "#fff";
  const boxBg = isDark ? "#1D283A" : "#F8FAFC";
  const images = getProjectImages(project || {});
  const total = images.length;
  const currentImage = images[Math.min(carouselIdx, Math.max(total - 1, 0))];

  useEffect(() => {
    setCarouselIdx(0);
  }, [project?.id_proyecto, project?.id]);

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 350,
            padding: 20,
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 24 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: cardBg,
              border: `1px solid ${border}`,
              borderRadius: 20,
              width: "100%",
              maxWidth: 680,
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: isDark ? "0 25px 60px rgba(0,0,0,0.5)" : "0 25px 60px rgba(0,0,0,0.18)",
            }}
          >
            <div style={{ position: "relative", height: 240, background: boxBg, overflow: "hidden", borderRadius: "20px 20px 0 0" }}>
              {currentImage ? (
                <img src={currentImage} alt="proyecto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <ProjectImageFallback title={project.titulo || project.nombre || "Proyecto"} height="100%" />
              )}

              {total > 1 && (
                <>
                  <button
                    onClick={() => setCarouselIdx((i) => (i <= 0 ? total - 1 : i - 1))}
                    style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(15,23,42,0.72)", color: "#fff", cursor: "pointer", fontSize: 18, fontWeight: 900 }}
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setCarouselIdx((i) => (i >= total - 1 ? 0 : i + 1))}
                    style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(15,23,42,0.72)", color: "#fff", cursor: "pointer", fontSize: 18, fontWeight: 900 }}
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

              <button
                onClick={onClose}
                style={{ position: "absolute", top: 14, right: 14, background: "rgba(15,23,42,0.72)", border: "none", borderRadius: 10, width: 34, height: 34, cursor: "pointer", color: "#fff", fontSize: 18 }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "24px 28px", minWidth: 0 }}>
              <h2 style={{ margin: "0 0 10px", color: text, fontSize: 24, fontWeight: 800, wordBreak: "break-word", overflowWrap: "break-word" }}>
                {project.titulo || project.nombre || "Proyecto"}
              </h2>
              <p style={{ color: sub, fontSize: 14, lineHeight: 1.7, margin: "0 0 18px", whiteSpace: "pre-wrap", wordBreak: "break-word", overflowWrap: "break-word" }}>
                {project.descripcion || "Sin descripción."}
              </p>

              {project.habilidades?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                  {project.habilidades.map((h, i) => (
                    <span key={i} style={{ background: "rgba(59,130,246,0.12)", color: "#3B82F6", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 700 }}>
                      {typeof h === "string" ? h : h.nombre}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 18 }}>
                {project.fecha_inicio && (
                  <div style={{ background: boxBg, border: `1px solid ${border}`, borderRadius: 10, padding: 12 }}>
                    <div style={{ color: sub, fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>Inicio</div>
                    <div style={{ color: text, fontSize: 13, marginTop: 4 }}>{formatDate(project.fecha_inicio)}</div>
                  </div>
                )}
                {project.fecha_fin && (
                  <div style={{ background: boxBg, border: `1px solid ${border}`, borderRadius: 10, padding: 12 }}>
                    <div style={{ color: sub, fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>Fin</div>
                    <div style={{ color: text, fontSize: 13, marginTop: 4 }}>{formatDate(project.fecha_fin)}</div>
                  </div>
                )}
              </div>

              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", background: "#3B82F6", color: "#fff", textDecoration: "none", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 800 }}
                >
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
