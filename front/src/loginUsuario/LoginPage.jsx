import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { authAPI } from "../api";
import { motion } from "framer-motion";
import iconoSol from "../assets/iconoSol.png";
import iconoLuna from "../assets/iconoLuna.png";
/**
 * Página de inicio de sesión.
 * Soporta login con email/contraseña y OAuth con GitHub.
 * @param {boolean} modal - Si true, se renderiza sin fondo completo (modo modal)
 * @param {Function} onSwitchToRegister - Callback para cambiar al formulario de registro
 */
export default function LoginPage({ modal = false, onSwitchToRegister } = {}) {
  const { isDark, toggleTheme } = useTheme();
  const { login, refreshUserData } = useApp();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const bg = isDark ? "#020617" : "#D9D9D9";
  const card = isDark ? "#0F172A" : "#fff";
  const text = isDark ? "#fff" : "#111";
  const sub = isDark ? "#94a3b8" : "#807F81";
  const border = isDark ? "#1D283A" : "#E2E8F0";

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

  const submit = async () => {
    const errs = {};
    if (!form.email.trim() || !form.email.includes("@"))
      errs.email = "Correo inválido";
    if (!form.password) errs.password = "La contraseña es requerida";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setApiError("");
    try {
      const { data } = await authAPI.login({
        email: form.email,
        password: form.password,
      });
      if (data.ok) {
        login(data.token, data.usuario);
        refreshUserData(); // fire-and-forget: se carga en background
        
        if (data.usuario.roles?.includes('administrador')) {
          navigate("/admin");
        } else {
          navigate("/vista");
        }
      } else {
        setApiError(data.mensaje || "Error al iniciar sesión");
      }
    } catch (err) {
      const msg =
        err.response?.data?.mensaje ||
        err.response?.data?.errores?.email?.[0] ||
        "Error de conexión con el servidor";
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGitHub = () => {
    authAPI.githubRedirect();
  };

  return (
    <div
      style={{
        minHeight: modal ? "auto" : "100vh",
        background: modal ? "transparent" : bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: modal ? 0 : 20,
        position: "relative",
      }}
    >
      {!modal && <button
        onClick={toggleTheme}
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          background: "none",
          border: "none",
          padding: "10px 12px",
          cursor: "pointer",
        }}
      >
        <img
          src={isDark ? iconoSol : iconoLuna}
          alt="Toggle Theme"
          style={{ width: 40, height: 40, display: "block" }}
        />
      </button>}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{
          background: card,
          borderRadius: 16,
          padding: "32px 28px",
          width: "100%",
          maxWidth: 400,
          boxShadow: isDark
            ? "0 8px 40px rgba(0,0,0,0.5)"
            : "0 8px 40px rgba(0,0,0,0.1)",
        }}
      >
        <h1
          style={{
            color: text,
            fontSize: 28,
            fontWeight: 800,
            textAlign: "center",
            marginBottom: 8,
            letterSpacing: "-0.5px"
          }}
        >
          Bienvenido
        </h1>
        <p style={{ color: sub, textAlign: "center", marginBottom: 24, fontSize: 14 }}>
          Ingresa tus credenciales para continuar
        </p>

        {apiError && (
          <div
            style={{
              background: isDark ? "#3B1A1A" : "#FEE2E2",
              border: "1px solid #ef4444",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 14,
              color: "#ef4444",
              fontSize: 13,
              textAlign: "center",
            }}
          >
            {apiError}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            {
              name: "email",
              placeholder: "Correo electrónico",
              type: "email",
            },
            { name: "password", placeholder: "Contraseña", type: "password" },
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
            {submitting ? "Ingresando..." : "Iniciar Sesión"}
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

          {/* Link a registro */}
          <p
            style={{
              color: sub,
              fontSize: 13,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            ¿No tienes cuenta?{" "}
            <button
              onClick={() => modal && onSwitchToRegister ? onSwitchToRegister() : navigate("/")}
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
              Regístrate aquí
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
