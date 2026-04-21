import "./index.css";
import { useTheme } from "../context/ThemeContext";
import ProfileModule from "./modules/ProfileModule";
import iconoSol from "../assets/iconoSol.png";
import iconoLuna from "../assets/iconoLuna.png";

export default function EdicionPerfilPage({ userData, onNext }) {
  const { isDark, toggleTheme } = useTheme();
  const bg = isDark ? "#020617" : "#D9D9D9";
  const card = isDark ? "#0F172A" : "#fff";
  const sub = isDark ? "#94a3b8" : "#807F81";

  return (
    <div style={{
      minHeight: "100vh", background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, position: "relative",
    }}>
      <button onClick={toggleTheme} style={{
        position: "fixed", top: 16, right: 16,
        background: "none",
        border: "none",  
        padding: "10px 12px", cursor: "pointer", fontSize: 18,
      }}>
            <img
              src={isDark ? iconoSol : iconoLuna}
              alt="tema"
              style={{ width: 40, height: 40 }}
            />
      </button>

      <div className="edit-card" style={{ background: card }}>
        <div style={{ background: "#3B82F6", padding: "14px 20px", marginBottom: 20 }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 17 }}>Bienvenido</div>
          <div style={{ color: "#e0efff", fontSize: 13 }}>Ingrese sus datos basicos para comenzar</div>
        </div>
        <div className="edit-body">
          <ProfileModule onNext={onNext} isDark={isDark} />
        </div>
      </div>
    </div>
  );
}