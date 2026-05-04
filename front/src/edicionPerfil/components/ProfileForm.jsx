import React, { useState, useEffect, useRef } from "react";
import { validateProfileData, validateProfileImage, getInitials } from "../services/profile.service";
import { perfilAPI } from "../../api";
import { useApp } from "../../context/AppContext";

export default function ProfileForm({ onNext, isDark }) {
  const { userData, debouncedRefresh } = useApp();
  const [step, setStep] = useState("datos");
  const [data, setData] = useState({
    nombreCompleto: "",
    apellidoCompleto: "",
    titulo: "",
    biografia: "",
    foto: null,
    ci: null,
  });
  const [errors, setErrors] = useState({});
  const [imgError, setImgError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [ciPreview, setCiPreview] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingCI, setSavingCI] = useState(false);

  const hasLoaded = React.useRef(false);

  // Cargar datos existentes del contexto
  useEffect(() => {
    if (userData && !hasLoaded.current) {
      setData({
        nombreCompleto: userData.nombreCompleto || "",
        apellidoCompleto: userData.apellidoCompleto || "",
        titulo: userData.titulo || userData.titulo_profesional || "",
        biografia: userData.biografia || "",
        foto: null,
        ci: null,
      });
      if (userData.foto_url || userData.preview) {
        setPreview(userData.foto_url || userData.preview);
      }
      hasLoaded.current = true;
    }
  }, [userData]);

  const border = isDark ? "#1D283A" : "#E2E8F0";
  const text = isDark ? "#fff" : "#111";
  const sub = isDark ? "#94a3b8" : "#807F81";
  const inp = {
    background: isDark ? "#1D283A" : "#F8FAFC",
    border: `1px solid ${border}`,
    color: text,
    borderRadius: 8,
    padding: "11px 14px",
    fontSize: 15,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };
  const lbl = { color: sub, fontSize: 13, marginBottom: 4, display: "block" };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
    setErrors((er) => ({ ...er, [e.target.name]: undefined }));
  };

  const handleNext = async () => {
    const errs = validateProfileData(data);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const { data: resp } = await perfilAPI.actualizar({
        nombre: data.nombreCompleto,
        apellido: data.apellidoCompleto,
        profesion: data.titulo,
        titulo_profesional: data.titulo,
        biografia: data.biografia
      });
      if (resp.ok) {
        showToast("Perfil actualizado correctamente");
        debouncedRefresh();
        setTimeout(() => setStep("foto"), 800);
      } else {
        showToast(resp.mensaje || "Error al guardar", "error");
      }
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.errores) {
        const backendErrors = {};
        if (resp.errores.nombre)
          backendErrors.nombreCompleto = resp.errores.nombre[0];
        if (resp.errores.apellido)
          backendErrors.apellidoCompleto = resp.errores.apellido[0];
        if (resp.errores.profesion)
          backendErrors.titulo = resp.errores.profesion[0];
        setErrors(backendErrors);
      } else {
        showToast("Error de conexión con el servidor", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const err = validateProfileImage(file);
    if (err) {
      setImgError(err);
      return;
    }
    setImgError(null);

    // Mostrar preview local inmediatamente
    setPreview(URL.createObjectURL(file));

    // Subir al backend
    setSaving(true);
    try {
      const { data: resp } = await perfilAPI.subirFoto(file);
      if (resp.ok) {
        showToast("Foto actualizada correctamente");
        if (resp.foto_url) {
          setPreview(resp.foto_url);
        }
        debouncedRefresh();
      } else {
        showToast("Error al subir la foto", "error");
        setPreview(null);
      }
    } catch (err) {
      const msg =
        err.response?.data?.errores?.foto?.[0] ||
        "Error al subir la foto";
      setImgError(msg);
      setPreview(null);
    } finally {
      setSaving(false);
    }
  };

  const handleCIFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const err = validateProfileImage(file);
    if (err) {
      showToast(err, "error");
      return;
    }

    // Show CI preview locally
    setCiPreview(URL.createObjectURL(file));

    setSavingCI(true);
    try {
      const { data: resp } = await perfilAPI.subirCI(file);
      if (resp.ok) {
        showToast("CI subido correctamente para revisión");
        debouncedRefresh();
      } else {
        showToast("Error al subir el CI", "error");
        setCiPreview(null);
      }
    } catch (err) {
      const msg = err.response?.data?.errores?.ci?.[0] || "Error al subir el CI";
      showToast(msg, "error");
      setCiPreview(null);
    } finally {
      setSavingCI(false);
    }
  };

  const handleFinish = () => {
    onNext({
      ...data,
      preview: preview,
    });
  };

  const initials = getInitials(data.nombreCompleto, data.apellidoCompleto);

  return (
    <div style={{ position: "relative" }}>
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

      {step === "datos" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { name: "nombreCompleto", label: "Nombre Completo" },
            { name: "apellidoCompleto", label: "Apellido Completo" },
            { name: "titulo", label: "Titulo / Rol" },
          ].map(({ name, label }) => (
            <div key={name}>
              <label style={lbl}>{label}</label>
              <input
                style={{
                  ...inp,
                  borderColor: errors[name] ? "#ef4444" : border,
                }}
                name={name}
                type="text"
                value={data[name]}
                onChange={handleChange}
              />
              {errors[name] && (
                <span
                  style={{
                    color: "#ef4444",
                    fontSize: 12,
                    marginTop: 3,
                    display: "block",
                  }}
                >
                  {errors[name]}
                </span>
              )}
            </div>
          ))}


          <div>
            <label style={lbl}>Breve Biografía</label>
            <textarea
              name="biografia"
              value={data.biografia}
              onChange={handleChange}
              rows={3}
              style={{
                ...inp,
                resize: "vertical",
                minHeight: 80,
                maxHeight: 160,
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleNext}
              disabled={saving}
              style={{
                background:
                  "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "11px 32px",
                cursor: saving ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: 15,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Guardando..." : "Siguiente"}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <p style={{ color: sub, fontSize: 13 }}>
            Máximo tamaño del archivo 2 MB · Solo JPG/PNG
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            {preview ? (
              <img
                src={preview}
                alt="perfil"
                style={{
                  width: 130,
                  height: 130,
                  borderRadius: 12,
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: 130,
                  height: 130,
                  background: "#3B82F6",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 40,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {initials}
              </div>
            )}
            <p style={{ color: text, fontWeight: 600 }}>Foto de Perfil</p>
            <p style={{ color: sub, fontSize: 12 }}>
              Nota: Puedes saltar este paso y agregarlo después
            </p>

            {imgError && (
              <p
                style={{
                  color: "#ef4444",
                  fontSize: 12,
                  textAlign: "center",
                  background: isDark ? "#1D283A" : "#FEE2E2",
                  borderRadius: 6,
                  padding: "8px 12px",
                }}
              >
                {imgError}
              </p>
            )}

            <label
              style={{
                background:
                  "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
                color: "#fff",
                borderRadius: 8,
                padding: "10px 28px",
                cursor: saving ? "not-allowed" : "pointer",
                fontWeight: 600,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Subiendo..." : "Subir Foto"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                hidden
                onChange={handleFile}
                disabled={saving}
              />
            </label>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              marginTop: 20,
              paddingTop: 20,
              borderTop: `1px solid ${border}`
            }}
          >
            <p style={{ color: text, fontWeight: 600 }}>Cédula de Identidad (CI)</p>
            <p style={{ color: sub, fontSize: 12, textAlign: 'center' }}>
              Adjunta una foto de tu CI para futura verificación de identidad
            </p>
            {userData?.ci_estado && (
              <p style={{ color: userData.ci_estado === 'Pendiente de revisión' ? '#eab308' : '#16a34a', fontSize: 13, fontWeight: 600 }}>
                Estado: {userData.ci_estado}
              </p>
            )}
            {ciPreview && (
              <img src={ciPreview} alt="CI" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, border: `1px solid ${border}` }} />
            )}
            <label
              style={{
                background: isDark ? "#1D283A" : "#E2E8F0",
                color: text,
                borderRadius: 8,
                padding: "10px 28px",
                cursor: savingCI ? "not-allowed" : "pointer",
                fontWeight: 600,
                opacity: savingCI ? 0.7 : 1,
              }}
            >
              {savingCI ? "Subiendo CI..." : "Subir CI"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                hidden
                onChange={handleCIFile}
                disabled={savingCI}
              />
            </label>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
            }}
          >
            <button
              onClick={() => setStep("datos")}
              style={{
                background: isDark ? "#1D283A" : "#E2E8F0",
                color: text,
                border: "none",
                borderRadius: 8,
                padding: "10px 28px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Atrás
            </button>
            <button
              onClick={handleFinish}
              style={{
                background:
                  "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 28px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {preview ? "Finalizar" : "Saltar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}