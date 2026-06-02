import { useState } from "react";
import { proyectoAPI } from "../api";
import { motion } from "framer-motion";

export default function StarToggle({ projectId, initiallyVisible }) {
  const [visible, setVisible] = useState(initiallyVisible);
  const [loading, setLoading] = useState(false);

  const toggle = async (e) => {
    e.stopPropagation();
    if (loading) return;

    const newValue = !visible;
    setLoading(true);
    setVisible(newValue);
    try {
      await proyectoAPI.toggleVisibilidad(projectId, newValue);
    } catch (err) {
      console.error("Error toggling visibility:", err);
      setVisible(!newValue);
    } finally {
      setLoading(false);
    }
  };

  const gradientId = `star-grad-${projectId}`;
  const glowId = `star-glow-${projectId}`;

  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.9 }}
      aria-label={visible ? "Quitar de destacados" : "Marcar como destacado"}
      title={visible ? "Proyecto destacado (visible en perfil público)" : "No destacado"}
      disabled={loading}
      style={{
        background: "transparent",
        border: "none",
        cursor: loading ? "wait" : "pointer",
        padding: 0,
        margin: 0,
        width: 34,
        height: 34,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill={visible ? `url(#${gradientId})` : "none"}
        stroke={visible ? "none" : "#cbd5e1"}
        strokeWidth={2}
        style={{
          filter: visible ? `url(#${glowId})` : "none",
          transition: "filter 0.3s ease",
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FFB800" />
          </linearGradient>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#FFD700" />
          </filter>
        </defs>
        <polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9" />
      </svg>
    </motion.button>
  );
}
