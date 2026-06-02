import "./index.css";
import { useTheme } from "../context/ThemeContext";
import VistaModule from "./modules/VistaModule";
import StatsBar from "./components/StatsBar";

export default function VistaEdicionPage({
  userData,
  onGoToHabilidad,
  onGoToProyecto,
  onBack,
  onEditDatos,
  onEditProyecto,
  onVerProyecto,
}) {
  const { isDark } = useTheme();
  const bg = isDark ? "#020617" : "#F1F5F9";
  const panelBg = isDark ? "#0F172A" : "#FFFFFF";
  const cardBg = isDark ? "#111827" : "#FFFFFF";
  const sectionBg = isDark ? "#1E293B" : "#F1F5F9";
  const text = isDark ? "#FFFFFF" : "#111827";
  const sub = isDark ? "#94A3B8" : "#64748B";
  const border = isDark ? "#1D283A" : "#E2E8F0";

  const dispatchPortfolioAction = (actionName) => {
    window.dispatchEvent(new CustomEvent(actionName));
  };

  const sectionTitle = (label) => (
    <div
      style={{
        width: "100%",
        borderRadius: 12,
        padding: "9px 12px",
        background: sectionBg,
        border: `1px solid ${border}`,
        color: sub,
        fontSize: 11,
        fontWeight: 900,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        boxSizing: "border-box",
        marginTop: 6,
      }}
    >
      {label}
    </div>
  );

  const actionButton = (label, description, code, eventName) => {
    return (
      <button
        type="button"
        onClick={() => dispatchPortfolioAction(eventName)}
        style={{
          width: "100%",
          border: `1px solid ${border}`,
          borderRadius: 18,
          padding: "15px 16px",
          cursor: "pointer",
          background: cardBg,
          color: text,
          display: "flex",
          alignItems: "center",
          gap: 14,
          textAlign: "left",
          boxShadow: isDark ? "none" : "0 8px 20px rgba(15,23,42,0.045)",
          transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.borderColor = "rgba(59,130,246,0.45)";
          e.currentTarget.style.boxShadow = isDark
            ? "0 10px 24px rgba(0,0,0,0.22)"
            : "0 12px 26px rgba(15,23,42,0.08)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.borderColor = border;
          e.currentTarget.style.boxShadow = isDark ? "none" : "0 8px 20px rgba(15,23,42,0.045)";
        }}
      >
        <span
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isDark ? "rgba(59,130,246,0.16)" : "#EFF6FF",
            color: "#2563EB",
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: "0.03em",
          }}
        >
          {code}
        </span>
        <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
          <strong style={{ fontSize: 14.5, lineHeight: 1.2 }}>{label}</strong>
          <span
            style={{
              fontSize: 12.2,
              lineHeight: 1.35,
              color: sub,
            }}
          >
            {description}
          </span>
        </span>
      </button>
    );
  };

  return (
    <>
      <style>{`
        .vista-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: row;
          align-items: flex-start;
        }
        .vista-sidebar {
          width: 340px;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          height: 100vh;
          padding: 20px 0 20px 20px;
          box-sizing: border-box;
        }
        .vista-actions-panel {
          height: calc(100vh - 40px);
          overflow-y: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .vista-actions-panel::-webkit-scrollbar {
          display: none;
        }
        .vista-main {
          flex: 1;
          padding: 20px 20px 40px 26px;
          min-width: 0;
        }
        .vista-top-stats {
          max-width: 1080px;
          margin: 0 auto 22px;
        }
        @media (max-width: 980px) {
          .vista-layout {
            flex-direction: column;
          }
          .vista-sidebar {
            width: 100%;
            position: relative;
            height: auto;
            padding: 16px;
          }
          .vista-actions-panel {
            height: auto;
          }
          .vista-main {
            padding: 0 16px 32px;
            width: 100%;
            box-sizing: border-box;
          }
          .vista-top-stats {
            margin-top: 0;
          }
        }
      `}</style>

      <div className="vista-layout" style={{ background: bg }}>
        <aside className="vista-sidebar">
          <div
            className="vista-actions-panel"
            style={{
              background: panelBg,
              border: `1px solid ${border}`,
              borderRadius: 22,
              padding: 17,
              boxShadow: isDark ? "none" : "0 12px 32px rgba(15,23,42,0.08)",
            }}
          >
            <div style={{ marginBottom: 15 }}>
              <p
                style={{
                  color: text,
                  fontSize: 18,
                  fontWeight: 900,
                  margin: "0 0 5px",
                  letterSpacing: "0.01em",
                }}
              >
                Acciones del portafolio
              </p>
              <p style={{ color: sub, fontSize: 12.5, lineHeight: 1.45, margin: 0 }}>
                Opciones separadas por sección para editar y añadir contenido.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {sectionTitle("Perfil")}
              {actionButton("Editar datos", "Perfil, foto, biografía y CI", "ED", "portfolio:edit-profile")}
              {actionButton("Redes profesionales", "LinkedIn, GitHub y enlaces", "RP", "portfolio:edit-socials")}

              {sectionTitle("Habilidades")}
              {actionButton("Añadir habilidades", "Registrar nuevas habilidades", "AH", "portfolio:add-skills")}
              {actionButton("Editar habilidades", "Actualizar niveles guardados", "EH", "portfolio:edit-skills")}

              {sectionTitle("Proyectos")}
              {actionButton("Añadir proyecto", "Nuevo proyecto al portafolio", "AP", "portfolio:add-project")}
              {actionButton("Editar proyectos", "Mostrar editar y eliminar", "EP", "portfolio:toggle-edit-projects")}

              {sectionTitle("Experiencia")}
              {actionButton("Añadir experiencia", "Laboral o académica", "AE", "portfolio:add-experience")}
              {actionButton("Editar experiencia", "Mostrar editar y eliminar", "EE", "portfolio:toggle-edit-experiences")}
            </div>
          </div>
        </aside>

        <main className="vista-main">
          <div className="vista-top-stats">
            <StatsBar userData={userData} isDark={isDark} />
          </div>

          <VistaModule
            userData={userData}
            isDark={isDark}
            onGoToHabilidad={onGoToHabilidad}
            onGoToProyecto={onGoToProyecto}
            onBack={onBack}
            onEditDatos={onEditDatos}
            onEditProyecto={onEditProyecto}
            onVerProyecto={onVerProyecto}
          />
        </main>
      </div>
    </>
  );
}
