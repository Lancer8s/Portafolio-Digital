import React, { useState } from "react";
import { proyectoAPI } from "../api";
import { motion } from "framer-motion";

export default function PinToggle({ projectId, initiallyVisible }) {
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
      // Revert in case of failure
      setVisible(!newValue);
    } finally {
      setLoading(false);
    }
  };

  const gradientId = `pin-grad-${projectId}`;
  const glowId = `pin-glow-${projectId}`;

  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.9 }}
      aria-label={visible ? "Desfijar proyecto" : "Fijar proyecto"}
      title={visible ? "Proyecto fijado (destacado en perfil público)" : "Fijar en el portafolio público"}
      disabled={loading}
      style={{
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        border: visible ? "1px solid rgba(59, 130, 246, 0.5)" : "1px solid rgba(255, 255, 255, 0.15)",
        cursor: loading ? "wait" : "pointer",
        padding: 0,
        margin: 0,
        width: 32,
        height: 32,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: visible ? "0 0 10px rgba(59, 130, 246, 0.3)" : "none",
        transition: "border-color 0.25s, box-shadow 0.25s",
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={visible ? `url(#${gradientId})` : "none"}
        stroke={visible ? "none" : "#cbd5e1"}
        strokeWidth={2}
        style={{
          filter: visible ? `url(#${glowId})` : "none",
          transform: visible ? "rotate(0deg)" : "rotate(-35deg)",
          transition: "filter 0.3s ease, transform 0.3s ease",
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#3B82F6" floodOpacity="0.65" />
          </filter>
        </defs>
        {/* Sleek Pushpin drawing */}
        <line x1="12" y1="17" x2="12" y2="22" stroke={visible ? "#3B82F6" : "#cbd5e1"} strokeWidth="2.5" strokeLinecap="round" />
        <path
          d="M5 17h14v-1.76a2 2 0 0 0-.44-1.24l-2.32-2.9A2 2 0 0 1 15 9.86V5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v4.86c0 .42-.13.83-.38 1.16l-2.37 3.16A2 2 0 0 0 5 15.24V17z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.button>
  );
}
