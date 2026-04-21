import "./index.css";
import { useTheme } from "../context/ThemeContext";
import ProyectoModule from "./modules/ProyectoModule";
import iconoSol from "../assets/iconoSol.png";
import iconoLuna from "../assets/iconoLuna.png";

export default function EdicionProyectoPage({ onBack, onSave, initialData }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div style={{ minHeight: "100vh", background: isDark ? "#020617" : "#D9D9D9" }}>
      <button onClick={toggleTheme} style={{
        position: "fixed", top: 16, right: 16, zIndex: 100,
        background: "none", border: "none", cursor: "pointer", padding: 0,
      }}>
        <img src={isDark ? iconoSol : iconoLuna} alt="tema" style={{ width: 28, height: 28 }} />
      </button>
      <ProyectoModule
        isDark={isDark}
        onBack={onBack}
        onSave={onSave}
        initialData={initialData}  
      />
    </div>
  );
}