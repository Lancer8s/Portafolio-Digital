import "./index.css";
import { useTheme } from "../context/ThemeContext";
import VistaModule from "./modules/VistaModule";
import StatsBar from "./components/StatsBar";

export default function VistaEdicionPage({ userData, 
    onGoToHabilidad, onGoToProyecto, onBack, 
    onEditDatos, onEditProyecto, onVerProyecto }) {
  const { isDark } = useTheme();
  const bg = isDark ? "#020617" : "#D9D9D9";

  return (
    <>
      {/* Responsive styles */}
      <style>{`
        .vista-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: row;
          align-items: flex-start;
        }
        .vista-sidebar {
          width: 260px;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          height: 100vh;
          padding: 20px 0 20px 20px;
          box-sizing: border-box;
        }
        .vista-main {
          flex: 1;
          padding: 20px 20px 20px 0;
          min-width: 0;
        }
        @media (max-width: 768px) {
          .vista-layout {
            flex-direction: column;
          }
          .vista-sidebar {
            width: 100%;
            position: relative;
            height: auto;
            padding: 16px;
          }
          .vista-main {
            padding: 16px;
          }
        }
      `}</style>
      <div className="vista-layout" style={{ background: bg }}>
        <div className="vista-sidebar">
          <StatsBar userData={userData} isDark={isDark} />
        </div>
        <div className="vista-main">
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
        </div>
      </div>
    </>
  );
}