import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

function extractPortfolioValue(value) {
  const trimmedValue = value.trim();

  if (!trimmedValue) return "";

  const portfolioMatch = trimmedValue.match(/\/portafolio\/([^/?#]+)/i);
  if (portfolioMatch?.[1]) {
    return decodeURIComponent(portfolioMatch[1]);
  }

  const numericMatch = trimmedValue.match(/^\d+$/);
  if (numericMatch) {
    return trimmedValue;
  }

  const slugMatch = trimmedValue.match(/^[a-z0-9áéíóúñü]+(?:-[a-z0-9áéíóúñü]+)*-\d+$/i);
  if (slugMatch) {
    return trimmedValue;
  }

  return "";
}

export default function RecruiterPortfolioAccess({ isDark }) {
  const navigate = useNavigate();
  const [portfolioInput, setPortfolioInput] = useState("");
  const [error, setError] = useState("");

  const text = isDark ? "#fff" : "#111827";
  const sub = isDark ? "#94a3b8" : "#64748b";
  const cardBg = isDark ? "rgba(15,23,42,0.72)" : "#ffffff";
  const softBg = isDark ? "rgba(30,41,59,0.78)" : "#f8fafc";
  const border = isDark ? "#1D283A" : "#E2E8F0";

  const handleSubmit = (event) => {
    event.preventDefault();

    const portfolioValue = extractPortfolioValue(portfolioInput);

    if (!portfolioValue) {
      setError("Ingrese un enlace válido o el ID público del portafolio.");
      return;
    }

    setError("");
    navigate(`/portafolio/${portfolioValue}`);
  };

  return (
    <motion.section
      id="recruiter-portfolio-access"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.4 }}
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "10px 48px 72px",
        scrollMarginTop: 90,
      }}
    >
      <div
        style={{
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: 22,
          padding: "30px",
          display: "grid",
          gridTemplateColumns: "minmax(280px, 1fr) minmax(320px, 0.85fr)",
          gap: 28,
          alignItems: "center",
          boxShadow: isDark ? "none" : "0 18px 50px rgba(15,23,42,0.08)",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "6px 12px",
              borderRadius: 999,
              background: isDark ? "rgba(59,130,246,0.14)" : "#eff6ff",
              color: "#3B82F6",
              fontWeight: 700,
              fontSize: 12,
              marginBottom: 14,
            }}
          >
            Acceso para reclutadores e invitados
          </div>

          <h2
            style={{
              color: text,
              margin: "0 0 10px",
              fontSize: "clamp(24px, 3vw, 34px)",
              lineHeight: 1.15,
              fontWeight: 850,
            }}
          >
            Ver un portafolio público
          </h2>

          <p
            style={{
              color: sub,
              margin: 0,
              maxWidth: 620,
              fontSize: 15,
              lineHeight: 1.7,
            }}
          >
            El visitante puede pegar el enlace compartido por el desarrollador o escribir su ID público para visualizar el portafolio sin iniciar sesión.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            background: softBg,
            border: `1px solid ${border}`,
            borderRadius: 18,
            padding: 18,
          }}
        >
          <label
            htmlFor="portfolio-public-search"
            style={{
              color: text,
              fontSize: 13,
              fontWeight: 700,
              display: "block",
              marginBottom: 8,
            }}
          >
            Enlace o ID del portafolio
          </label>

          <input
            id="portfolio-public-search"
            type="text"
            value={portfolioInput}
            onChange={(event) => {
              setPortfolioInput(event.target.value);
              if (error) setError("");
            }}
            placeholder="Ejemplo: /portafolio/1 o 1"
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: `1px solid ${error ? "#ef4444" : border}`,
              borderRadius: 12,
              padding: "13px 14px",
              background: isDark ? "#020617" : "#ffffff",
              color: text,
              outline: "none",
              fontSize: 14,
              marginBottom: 10,
            }}
          />

          {error && (
            <p
              style={{
                color: "#ef4444",
                fontSize: 12,
                margin: "0 0 10px",
                fontWeight: 600,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              border: "none",
              borderRadius: 12,
              padding: "13px 18px",
              background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: 800,
              fontSize: 14,
              boxShadow: "0 10px 25px rgba(59,130,246,0.28)",
            }}
          >
            Buscar portafolio
          </button>
        </form>
      </div>
    </motion.section>
  );
}
