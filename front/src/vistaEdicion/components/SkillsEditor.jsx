import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import lapizClaro from "../../assets/lapizClaro.png";
import lapizOscuro from "../../assets/lapizOscuro.png";
import { useApp } from "../../context/AppContext";
import { perfilAPI, habilidadAPI, proyectoAPI } from "../../api";
import ExperienciaList from "./ExperienciaList";

export default function SkillsEditor({
  userData,
  isDark,
  onGoToHabilidad = () => {},
  onGoToProyecto = () => {},
  onBack = () => {},
  onEditProyecto = () => {},
  onVerProyecto = () => {},
}) {
  const { setUserData, debouncedRefresh } = useApp();

  // Modales de edición inline
  const [editBio, setEditBio] = useState(false);
  const [bioForm, setBioForm] = useState({
    nombreCompleto: userData?.nombreCompleto || "",
    apellidoCompleto: userData?.apellidoCompleto || "",
    titulo: userData?.titulo || "",
    biografia: userData?.biografia || "",
    visibilidad: userData?.visibilidad || "publico",
    redes_sociales: userData?.redes_sociales || [],
  });

  const [editHab, setEditHab] = useState(false);
  const [techList, setTechList] = useState(userData?.techSkills || []);
  const [softList, setSoftList] = useState(userData?.softSkills || []);

  const [toast, setToast] = useState(null);
  const [savingBio, setSavingBio] = useState(false);
  const [savingHab, setSavingHab] = useState(false);
  const [deletingProyecto, setDeletingProyecto] = useState(null);
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

  // Eliminar proyecto via API
  const handleDeleteProyecto = async (proyecto, idx) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este proyecto?"))
      return;
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

  const techSkills = userData?.techSkills || [];
  const softSkills = userData?.softSkills || [];
  const proyectos = userData?.proyectos || [];

  const initials =
    `${(userData?.nombreCompleto || "")[0] || ""}${
      (userData?.apellidoCompleto || "")[0] || ""
    }`.toUpperCase() || "??";

  return (
    <div
      style={{
        maxWidth: 640,
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

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 0",
          borderBottom: `1px solid ${border}`,
          marginBottom: 28,
        }}
      >
        {userData?.preview || userData?.foto_url ? (
          <img
            src={userData.preview || userData.foto_url}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              objectFit: "cover",
              flexShrink: 0,
            }}
            alt=""
          />
        ) : (
          <div
            style={{
              width: 40,
              height: 40,
              background: "#3B82F6",
              borderRadius: 8,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {initials}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <span
            style={{
              color: text,
              fontWeight: 600,
              fontSize: 16,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {userData?.nombreCompleto} {userData?.apellidoCompleto}
          </span>
          <span style={{ color: "#3B82F6", fontWeight: 700, fontSize: 13, marginTop: 2 }}>
            {userData?.titulo || "Tu Rol/Título"}
          </span>
          <p style={{ color: sub, fontSize: 13, margin: "6px 0 0", lineHeight: 1.5, wordBreak: "break-word" }}>
            {userData?.biografia || "Añade una breve biografía..."}
          </p>
        </div>
      </motion.div>

      {/* Editar Datos */}
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
          });
          setEditBio(true);
        })}
      </div>

      {/* HABILIDADES — un solo enlace */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{ marginBottom: 8 }}
      >
        <button
          onClick={onGoToHabilidad}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#3B82F6",
            fontWeight: 700,
            fontSize: 17,
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
            padding: 0,
          }}
        >
          <span style={{ fontSize: 22 }}>+</span> Añadir Habilidades
        </button>

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

      {/* Editar Habilidad */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 28,
        }}
      >
        {editBtn("Editar Habilidades", () => {
          setTechList(userData?.techSkills || []);
          setSoftList(userData?.softSkills || []);
          setEditHab(true);
        })}
      </div>

      {/* EXPERIENCIA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
      >
        <ExperienciaList isDark={isDark} />
      </motion.div>

      {/* PROYECTOS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        style={{ marginBottom: 10 }}
      >
        <button
          onClick={onGoToProyecto}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#3B82F6",
            fontWeight: 700,
            fontSize: 17,
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
            padding: 0,
          }}
        >
          <span style={{ fontSize: 22 }}>+</span> Añadir Nuevo Proyecto
        </button>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))",
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
                <div onClick={() => onVerProyecto(i)}>
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
                    {p.imagen_portada_url || p.imagenes?.[0]?.url ? (
                      <img
                        src={
                          p.imagen_portada_url || p.imagenes[0].url
                        }
                        alt="proyecto"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={sub}
                        strokeWidth="1.5"
                      >
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect
                          x="14"
                          y="3"
                          width="7"
                          height="7"
                          rx="1"
                        />
                        <rect
                          x="3"
                          y="14"
                          width="7"
                          height="7"
                          rx="1"
                        />
                        <rect
                          x="14"
                          y="14"
                          width="7"
                          height="7"
                          rx="1"
                        />
                      </svg>
                    )}
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    <p
                      style={{
                        color: text,
                        fontWeight: 700,
                        fontSize: 14,
                        marginBottom: 6,
                        wordBreak: "break-word",
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

                {/* Botones sobre la tarjeta */}
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
                      onEditProyecto(i);
                    }}
                    style={{
                      background: "rgba(0,0,0,0.55)",
                      border: "none",
                      borderRadius: 6,
                      padding: "5px 7px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <img
                      src={lapiz}
                      alt="editar"
                      style={{ width: 13, height: 13 }}
                    />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProyecto(p, i);
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
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

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
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              style={modalBox}
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                style={{
                  color: text,
                  fontWeight: 700,
                  marginBottom: 18,
                }}
              >
                Editar Datos
              </h3>
              {[
                { name: "nombreCompleto", label: "Nombre Completo" },
                { name: "apellidoCompleto", label: "Apellido Completo" },
                { name: "titulo", label: "Título / Rol" },
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

              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ ...lbl, margin: 0 }}>Redes Sociales y URLs</label>
                  <button 
                    onClick={() => setBioForm(f => ({ ...f, redes_sociales: [...(f.redes_sociales || []), { plataforma: "", url: "" }] }))}
                    style={{ background: "none", border: "none", color: "#3B82F6", fontWeight: 600, cursor: "pointer", fontSize: 12 }}
                  >
                    + Añadir
                  </button>
                </div>
                {(bioForm.redes_sociales || []).map((red, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input
                      style={{ ...inp, flex: 1 }}
                      placeholder="Plataforma (Ej. Twitter)"
                      value={red.plataforma}
                      onChange={(e) => {
                        const newArr = [...bioForm.redes_sociales];
                        newArr[idx].plataforma = e.target.value;
                        setBioForm({ ...bioForm, redes_sociales: newArr });
                      }}
                    />
                    <input
                      style={{ ...inp, flex: 2 }}
                      placeholder="https://..."
                      value={red.url}
                      onChange={(e) => {
                        const newArr = [...bioForm.redes_sociales];
                        newArr[idx].url = e.target.value;
                        setBioForm({ ...bioForm, redes_sociales: newArr });
                      }}
                    />
                    <button 
                      onClick={() => setBioForm(f => ({ ...f, redes_sociales: f.redes_sociales.filter((_, i) => i !== idx) }))}
                      style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, padding: "0 10px", cursor: "pointer", fontWeight: "bold" }}
                    >✕</button>
                  </div>
                ))}
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
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        background: "#3B82F6",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 18,
                      }}
                    >
                      {initials}
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <button
                      onClick={() => fotoRef.current?.click()}
                      style={{
                        background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
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
                            background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
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
                      "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
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
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              style={modalBox}
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                style={{
                  color: text,
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                Editar Habilidades
              </h3>

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
                  <button
                    onClick={() => removeTech(i)}
                    style={{
                      background: "#ef4444",
                      border: "none",
                      color: "#fff",
                      borderRadius: 6,
                      padding: "3px 8px",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    ✕
                  </button>
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
                    <button
                      onClick={() => removeSoft(i)}
                      style={{
                        background: "#ef4444",
                        border: "none",
                        color: "#fff",
                        borderRadius: 4,
                        padding: "1px 6px",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      ✕
                    </button>
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
                      "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}