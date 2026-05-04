import "./index.css";
import { useTheme } from "../context/ThemeContext";
import VistaModule from "./modules/VistaModule";
import iconoSol from "../assets/iconoSol.png";
import iconoLuna from "../assets/iconoLuna.png";
import StatsBar from "./components/StatsBar";

export default function VistaEdicionPage({ userData, 
    onGoToHabilidad, onGoToProyecto, onBack, 
    onEditDatos, onEditProyecto, onVerProyecto }) {
  const { isDark, toggleTheme } = useTheme();
  const bg = isDark ? "#020617" : "#D9D9D9";

  return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", flexDirection: "row", alignItems: "flex-start" }}>


      <div style={{ width: "260px", flexShrink: 0, position: "sticky", top: 0, height: "100vh", padding: "20px 0 20px 20px", boxSizing: "border-box" }}>
        <StatsBar userData={userData} isDark={isDark} />
      </div>

      <div style={{ flex: 1, padding: "20px 20px 20px 0" }}>
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
  );
}