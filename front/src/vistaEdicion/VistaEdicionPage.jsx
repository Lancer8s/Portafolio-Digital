import "./index.css";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { motion } from "framer-motion";
import VistaModule from "./modules/VistaModule";
import DefaultAvatar from "../components/DefaultAvatar";

const NAV_ITEMS = [
  { id: "inicio", label: "Inicio", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" },
  { id: "perfil", label: "Perfil", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { id: "habilidades", label: "Habilidades", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
  { id: "proyectos", label: "Proyectos", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
  { id: "redes", label: "Redes Sociales", icon: "M13.828 10.172a4 4 0 010 5.656l-2 2a4 4 0 01-5.656-5.656l1.172-1.172M10.172 13.828a4 4 0 010-5.656l2-2a4 4 0 015.656 5.656l-1.172 1.172" },
  { id: "exp_laboral", label: "Experiencia Laboral", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { id: "formacion_academica", label: "Formación Académica", icon: "M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" },
];


/**
 * Página principal de edición del portafolio.
 * Muestra un sidebar de navegación y el contenido de cada sección.
 * @param {Object} userData - Datos del usuario autenticado
 * @param {Function} onGoToHabilidad - Navega a la página de habilidades
 * @param {Function} onGoToProyecto - Navega a la página de proyectos
 * @param {Function} onBack - Navega a la página anterior
 * @param {Function} onEditProyecto - Abre edición de un proyecto específico
 * @param {Function} onVerProyecto - Abre vista de un proyecto específico
 */
export default function VistaEdicionPage({ userData,
    onGoToHabilidad, onGoToProyecto, onBack,
    onEditDatos, onEditProyecto, onVerProyecto }) {
  const { isDark } = useTheme();
  const [activeSection, setActiveSection] = useState("inicio");

  const bg = isDark ? "#020617" : "#F1F5F9";
  const sidebarBg = isDark ? "#0F172A" : "#FFFFFF";
  const text = isDark ? "#fff" : "#111";
  const sub = isDark ? "#94a3b8" : "#807F81";
  const border = isDark ? "#1D283A" : "#E2E8F0";
  const accent = "#3B82F6";

  return (
    <>
      <style>{`
        .vista-layout { min-height: calc(100vh - 52px); display: flex; }
        .vista-sidebar {
          width: 240px; flex-shrink: 0; position: sticky; top: 52px;
          height: calc(100vh - 52px); overflow-y: auto; padding: 20px 12px;
          border-right: 1px solid ${border};
        }
        .vista-main { flex: 1; padding: 28px 32px; min-width: 0; overflow-y: auto; }
        .vista-nav-btn {
          width: 100%; text-align: left; padding: 10px 14px; border-radius: 10px;
          border: none; cursor: pointer; font-size: 14px; font-weight: 600;
          display: flex; align-items: center; gap: 10px; transition: all 0.15s;
          font-family: 'Inter', sans-serif; margin-bottom: 2px;
        }
        .vista-nav-btn:hover { transform: translateX(2px); }
        @media (max-width: 768px) {
          .vista-layout { flex-direction: column; }
          .vista-sidebar {
            width: 100%; position: relative; height: auto;
            border-right: none; border-bottom: 1px solid ${border};
            padding: 12px; display: flex; gap: 6px; overflow-x: auto;
            top: 0;
          }
          .vista-main { padding: 16px; }
          .vista-nav-btn { white-space: nowrap; width: auto; padding: 8px 12px; font-size: 13px; }
        }
        @media (max-width: 560px) {
          .vista-sidebar { padding: 10px 8px; gap: 5px; }
          .vista-user-card { display: none !important; }
          .vista-nav-btn { padding: 8px 10px; font-size: 12px; }
          .vista-nav-btn svg { width: 16px; height: 16px; }
          .vista-main { padding: 14px 12px 24px; }
        }
      `}</style>
      <div className="vista-layout" style={{ background: bg, fontFamily: "'Inter', sans-serif" }}>
        {/* Sidebar */}
        <div className="vista-sidebar" style={{ background: sidebarBg }}>
          {/* User Mini Card */}
          <div className="vista-user-card" style={{ padding: "8px 10px 20px", marginBottom: 8, borderBottom: `1px solid ${border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {userData?.preview || userData?.foto_url ? (
                <img src={userData.preview || userData.foto_url} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: `2px solid ${border}` }} alt="" />
              ) : (
                <DefaultAvatar size={38} />
              )}
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, color: text, fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {userData?.nombreCompleto || "Usuario"}
                </p>
                <p style={{ margin: 0, color: sub, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {userData?.titulo || "Sin título"}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className="vista-nav-btn"
              onClick={() => setActiveSection(item.id)}
              style={{
                background: activeSection === item.id ? (isDark ? "rgba(59,130,246,0.15)" : "#EFF6FF") : "transparent",
                color: activeSection === item.id ? accent : sub,
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="vista-main">
          <motion.div key={activeSection} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <VistaModule
              userData={userData}
              isDark={isDark}
              activeSection={activeSection}
              onGoToHabilidad={onGoToHabilidad}
              onGoToProyecto={onGoToProyecto}
              onBack={onBack}
              onEditDatos={onEditDatos}
              onEditProyecto={onEditProyecto}
              onVerProyecto={onVerProyecto}
            />
          </motion.div>
        </div>
      </div>
    </>
  );
}
