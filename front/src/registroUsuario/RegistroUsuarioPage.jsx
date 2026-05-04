import "./index.css";
import { useTheme } from "../context/ThemeContext";
import RegisterModule from "./modules/RegisterModule";
import iconoSol from "../assets/iconoSol.png";
import iconoLuna from "../assets/iconoLuna.png";

export default function RegistroUsuarioPage() {
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
      <button
        onClick={toggleTheme}
        style={{
          position: "fixed", top: 16, right: 16,
          background: "none",
          border: "none",
          padding: "10px 12px", cursor: "pointer", fontSize: 18,
        }}
      >
        <img
          src={isDark ? iconoSol : iconoLuna}
          alt="Toggle Theme"
          style={{ width: 40, height: 40, display: "block" }}
        />
      </button>

      <div className="reg-card" style={{
        background: card,
        boxShadow: isDark
          ? "0 8px 40px rgba(0,0,0,0.5)"
          : "0 8px 40px rgba(0,0,0,0.1)",
      }}>
        <h1
          style={{
            color: isDark ? "#fff" : "#111",
            fontSize: 28,
            fontWeight: 800,
            textAlign: "center",
            marginBottom: 8,
            letterSpacing: "-0.5px"
          }}
        >
          Crear Cuenta
        </h1>
        <p style={{ color: sub, textAlign: "center", marginBottom: 20 }}>
          Regístrate para continuar
        </p>
        <RegisterModule isDark={isDark} />
      </div>
    </div>
  );
}