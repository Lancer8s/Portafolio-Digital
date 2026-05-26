import { useState } from "react";
import { proyectoAPI } from "../api";
import { motion } from "framer-motion";

export default function StarToggle({ projectId, initiallyVisible, onToggle }) {
  const [visible, setVisible] = useState(initiallyVisible);
  const [loading, setLoading] = useState(false);

  const toggle = async (e) => {
    e.stopPropagation(); // Evita navegar a la vista de detalle
    if (loading) return;

    const newValue = !visible;
    setLoading(true);
    
    // Actualización optimista local
    setVisible(newValue);
    if (onToggle) onToggle(newValue);

    try {
      await proyectoAPI.toggleVisibilidad(projectId, newValue);
    } catch (error) {
      console.error("Error toggling visibility:", error);
      // Revertir en caso de error
      setVisible(!newValue);
      if (onToggle) onToggle(!newValue);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label={visible ? "Quitar de destacados" : "Marcar como destacado"}
      style={{
        background: visible ? "rgba(255, 215, 0, 0.15)" : "rgba(0, 0, 0, 0.5)",
        border: "none",
        cursor: "pointer",
        color: visible ? "#FFD700" : "#CBD5E1",
        fontSize: "18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        backdropFilter: "blur(4px)",
        transition: "all 0.2s ease-in-out",
        boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
      }}
      title={visible ? "Proyecto destacado (visible en perfil público)" : "No destacado"}
    >
      {visible ? "★" : "☆"}
    </motion.button>
  );
}
