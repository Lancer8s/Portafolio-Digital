import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { authAPI } from "../api";
import { motion } from "framer-motion";

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, refreshUserData } = useApp();
  const { isDark } = useTheme();
  const [error, setError] = useState(null);

  const bg = isDark ? "#020617" : "#D9D9D9";
  const text = isDark ? "#fff" : "#111";
  const sub = isDark ? "#94a3b8" : "#807F81";

  useEffect(() => {
    const token = searchParams.get("token");
    const err = searchParams.get("error");

    if (err) {
      setError(
        err === "github_auth_failed"
          ? "La autenticación con GitHub falló. Intenta de nuevo."
          : `Error: ${err}`
      );
      return;
    }

    if (!token) {
      setError("No se recibió un token de autenticación.");
      return;
    }

    // Guardar token y restaurar sesión
    const init = async () => {
      try {
        localStorage.setItem("auth_token", token);
        // Usamos la API me() para obtener datos del usuario
        const { data } = await authAPI.me();
        if (data.ok) {
          login(token, data.usuario);
          await refreshUserData();
          navigate("/vista", { replace: true });
        } else {
          setError("No se pudo verificar la sesión.");
        }
      } catch {
        localStorage.removeItem("auth_token");
        setError("Error al verificar el token. Intenta de nuevo.");
      }
    };

    init();
  }, [searchParams, login, refreshUserData, navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          background: isDark ? "#0F172A" : "#fff",
          borderRadius: 16,
          padding: "40px 32px",
          textAlign: "center",
          maxWidth: 420,
          width: "100%",
          boxShadow: isDark
            ? "0 8px 40px rgba(0,0,0,0.5)"
            : "0 8px 40px rgba(0,0,0,0.1)",
        }}
      >
        {error ? (
          <>
            <div
              style={{
                width: 56,
                height: 56,
                background: "#FEE2E2",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: 28,
              }}
            >
              ✕
            </div>
            <h2
              style={{
                color: "#ef4444",
                fontWeight: 700,
                fontSize: 20,
                marginBottom: 10,
              }}
            >
              Error de Autenticación
            </h2>
            <p style={{ color: sub, fontSize: 14, marginBottom: 24 }}>
              {error}
            </p>
            <button
              onClick={() => navigate("/login")}
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
              Volver al Login
            </button>
          </>
        ) : (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{
                width: 48,
                height: 48,
                border: "4px solid",
                borderColor: `#3B82F6 transparent #3B82F6 transparent`,
                borderRadius: "50%",
                margin: "0 auto 20px",
              }}
            />
            <h2
              style={{
                color: text,
                fontWeight: 700,
                fontSize: 20,
                marginBottom: 8,
              }}
            >
              Autenticando...
            </h2>
            <p style={{ color: sub, fontSize: 14 }}>
              Verificando tu sesión con GitHub
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
