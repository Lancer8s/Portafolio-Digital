import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { defaultRegisterForm } from "../interfaces/register.interface";
import { validateRegisterForm } from "../services/register.service";
import { authAPI } from "../../api";
import { useApp } from "../../context/AppContext";
import { motion } from "framer-motion";

export default function RegisterForm({ isDark }) {
  const [form, setForm] = useState(defaultRegisterForm);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, refreshUserData } = useApp();
  const navigate = useNavigate();

  const border = isDark ? "#1D283A" : "#E2E8F0";
  const text = isDark ? "#fff" : "#111";
  const sub = isDark ? "#94a3b8" : "#807F81";

  const inp = {
    background: isDark ? "#1D283A" : "#F8FAFC",
    border: `1px solid ${border}`,
    color: text,
    borderRadius: 8,
    padding: "12px 14px",
    fontSize: 15,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  const handle = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((er) => ({ ...er, [e.target.name]: undefined }));
    setApiError("");
  };

  const calculateStrength = (pass) => {
    let score = 0;
    if (!pass) return { score, text: "", color: "transparent" };
    if (pass.length > 7) score += 1;
    if (pass.length > 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    if (score < 2) return { score: 1, text: "Débil", color: "#ef4444" };
    if (score < 4) return { score: 2, text: "Media", color: "#eab308" };
    return { score: 3, text: "Fuerte", color: "#22c55e" };
  };
  const str = calculateStrength(form.contrasena);

  const submit = async () => {
    const errs = validateRegisterForm(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setApiError("");
    try {
      const { data } = await authAPI.registro({
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.correo,
        password: form.contrasena,
      });
      if (data.ok) {
        login(data.token, data.usuario);
        refreshUserData(); // fire-and-forget
        navigate("/edicion");
      } else {
        setApiError(data.mensaje || "Error al registrar");
      }
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.errores) {
        // Mapear errores del backend al frontend
        const backendErrors = {};
        if (resp.errores.nombre) backendErrors.nombre = resp.errores.nombre[0];
        if (resp.errores.apellido)
          backendErrors.apellido = resp.errores.apellido[0];
        if (resp.errores.email) backendErrors.correo = resp.errores.email[0];
        if (resp.errores.password)
          backendErrors.contrasena = resp.errores.password[0];
        setErrors(backendErrors);
      } else {
        setApiError(
          resp?.mensaje || "Error de conexión con el servidor"
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGitHub = () => {
    authAPI.githubRedirect();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      {apiError && (
        <div
          style={{
            background: isDark ? "#3B1A1A" : "#FEE2E2",
            border: "1px solid #ef4444",
            borderRadius: 8,
            padding: "10px 14px",
            color: "#ef4444",
            fontSize: 13,
            textAlign: "center",
          }}
        >
          {apiError}
        </div>
      )}

      {[
        { name: "nombre", placeholder: "Nombre", type: "text" },
        { name: "apellido", placeholder: "Apellido", type: "text" },
        { name: "correo", placeholder: "Correo electrónico", type: "email" },
        { name: "contrasena", placeholder: "Contraseña", type: "password" },
        {
          name: "confirmarContrasena",
          placeholder: "Confirmar Contraseña",
          type: "password",
        },
      ].map(({ name, placeholder, type }) => (
        <div key={name}>
          <input
            style={{
              ...inp,
              borderColor: errors[name] ? "#ef4444" : border,
            }}
            name={name}
            type={type}
            placeholder={placeholder}
            value={form[name]}
            onChange={handle}
            onKeyDown={(e) => e.key === "Enter" && submit()}
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
          {name === "contrasena" && form.contrasena && (
            <div style={{ marginTop: 6 }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: str.score >= 1 ? str.color : (isDark ? "#334155" : "#e2e8f0") }} />
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: str.score >= 2 ? str.color : (isDark ? "#334155" : "#e2e8f0") }} />
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: str.score >= 3 ? str.color : (isDark ? "#334155" : "#e2e8f0") }} />
              </div>
              <span style={{ color: str.color, fontSize: 11, fontWeight: 600 }}>Seguridad: {str.text}</span>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={submit}
        disabled={submitting}
        style={{
          background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "13px",
          fontWeight: 700,
          fontSize: 16,
          cursor: submitting ? "not-allowed" : "pointer",
          marginTop: 4,
          width: "100%",
          opacity: submitting ? 0.7 : 1,
          transition: "opacity 0.2s",
        }}
      >
        {submitting ? "Registrando..." : "Registrarse"}
      </button>

      {/* Divisor */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "4px 0",
        }}
      >
        <hr style={{ flex: 1, borderColor: border }} />
        <span style={{ color: sub, fontSize: 13 }}>O continúa con</span>
        <hr style={{ flex: 1, borderColor: border }} />
      </div>

      {/* GitHub */}
      <button
        onClick={handleGitHub}
        style={{
          width: "100%",
          padding: "11px",
          border: `1px solid ${border}`,
          borderRadius: 8,
          background: isDark ? "#1D283A" : "#F8FAFC",
          color: text,
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={isDark ? "#fff" : "#111"}
        >
          <path
            d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577
            0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755
            -1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236
            1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466
            -1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176
            0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405
            2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23
            1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22
            0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295
            24 12c0-6.63-5.37-12-12-12z"
          />
        </svg>
        Continuar con GitHub
      </button>

      {/* Link a login */}
      <p
        style={{
          color: sub,
          fontSize: 13,
          textAlign: "center",
          marginTop: 4,
        }}
      >
        ¿Ya tienes cuenta?{" "}
        <button
          onClick={() => navigate("/login")}
          style={{
            background: "none",
            border: "none",
            color: "#3B82F6",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 13,
            textDecoration: "underline",
          }}
        >
          Inicia sesión
        </button>
      </p>
    </motion.div>
  );
}