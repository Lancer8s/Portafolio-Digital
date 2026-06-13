import { getHeroText } from "../services/home.service";
import iconoSol from "../../assets/iconoSol.png";
import iconoLuna from "../../assets/iconoLuna.png";
import { useApp } from "../../context/AppContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function HeroSection({
  isDark,
  toggleTheme,
  onRegister,
  onLogin,
}) {
  const hero = getHeroText();
  const text = isDark ? "#fff" : "#111";
  const sub = isDark ? "#94a3b8" : "#807F81";
  const nav = isDark ? "#0F172A" : "#fff";
  const border = isDark ? "#1D283A" : "#E2E8F0";
  const { isAuthenticated } = useApp();
  const navigate = useNavigate();

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: isDark
          ? "linear-gradient(180deg, #020617 0%, #0F172A 100%)"
          : "#ffffff",
      }}
    >
      {/* NAVBAR */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: isDark
            ? "rgba(15,23,42,0.85)"
            : "rgba(255,255,255,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 32px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background:
                "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            P
          </div>
          <span style={{ color: text, fontWeight: 700, fontSize: 17 }}>
            PortaGen
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
          <button
            onClick={() => scrollToSection("search-section")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: sub,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Explorar
          </button>
          <button
            onClick={() => scrollToSection("sobre-nosotros")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: sub,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Sobre Nosotros
          </button>
        </div>

        {/* Nav derecha */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {isAuthenticated ? (
            <button
              onClick={() => navigate("/vista")}
              style={{
                background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 20px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              Ir a mi Portafolio
            </button>
          ) : (
            <>
              <button
                onClick={onLogin}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#3B82F6",
                  fontWeight: 600,
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={onRegister}
                style={{
                  background:
                    "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 20px",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                Registrarse
              </button>
            </>
          )}
          <button
            onClick={toggleTheme}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <img
              src={isDark ? iconoSol : iconoLuna}
              alt="tema"
              style={{ width: 28, height: 28 }}
            />
          </button>
        </div>
      </motion.nav>

      {/* HERO */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "80px 48px 60px",
          maxWidth: 1200,
          margin: "0 auto",
          gap: 48,
          flexWrap: "wrap",
        }}
      >
        {/* Texto izquierda */}
        <div style={{ flex: "1 1 420px" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: isDark
                ? "rgba(59,130,246,0.15)"
                : "rgba(59,130,246,0.1)",
              borderRadius: 20,
              padding: "6px 16px",
              marginBottom: 24,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                background: "#3B82F6",
                borderRadius: "50%",
                display: "inline-block",
              }}
            />
            <span
              style={{ color: "#3B82F6", fontSize: 13, fontWeight: 600 }}
            >
              Plataforma de Portafolios Profesionales
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              color: text,
              fontWeight: 900,
              fontSize: "clamp(36px, 6vw, 64px)",
              lineHeight: 1.05,
              marginBottom: 8,
              fontFamily: "'Segoe UI', sans-serif",
            }}
          >
            {hero.title1}
            <br />
            {hero.title2}
            <br />
            <span
              style={{
                background:
                  "linear-gradient(135deg, #3B82F6, #6366F1, #8B5CF6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {hero.highlight}
              <br />
              {hero.title3}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{
              color: sub,
              fontSize: 16,
              lineHeight: 1.7,
              maxWidth: 460,
              margin: "20px 0 36px",
            }}
          >
            {hero.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            style={{ display: "flex", gap: 14, flexWrap: "wrap" }}
          >
            <button
              onClick={onRegister}
              style={{
                background:
                  "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "14px 32px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 15,
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 4px 20px rgba(59,130,246,0.4)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow =
                  "0 8px 30px rgba(59,130,246,0.5)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow =
                  "0 4px 20px rgba(59,130,246,0.4)";
              }}
            >
              🚀 Crear Portafolio
            </button>
            <button
              onClick={onLogin}
              style={{
                background: isDark
                  ? "rgba(29,40,58,0.8)"
                  : "rgba(226,232,240,0.8)",
                color: text,
                border: `1px solid ${border}`,
                borderRadius: 10,
                padding: "14px 32px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 15,
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "background 0.2s",
              }}
            >
              → Iniciar Sesión
            </button>
            <button
              onClick={() => scrollToSection("search-section")}
              style={{
                background: "transparent",
                color: "#3B82F6",
                border: "1px solid rgba(59,130,246,0.45)",
                borderRadius: 10,
                padding: "14px 28px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 15,
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "background 0.2s",
              }}
            >
              🔎 Explorar Portafolios
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{
              display: "flex",
              gap: 32,
              marginTop: 48,
            }}
          >
            {[
              { value: "100%", label: "Gratuito" },
              { value: "∞", label: "Proyectos" },
              { value: "<5min", label: "Configurar" },
            ].map((stat, i) => (
              <div key={i}>
                <p
                  style={{
                    color: "#3B82F6",
                    fontWeight: 800,
                    fontSize: 24,
                    marginBottom: 2,
                  }}
                >
                  {stat.value}
                </p>
                <p style={{ color: sub, fontSize: 12 }}>{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Imagen derecha */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{ flex: "1 1 380px", position: "relative" }}
        >
          <div
            style={{
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: isDark
                ? "0 20px 60px rgba(0,0,0,0.6)"
                : "0 20px 60px rgba(0,0,0,0.15)",
              position: "relative",
            }}
          >
            {/* Gradient overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.4) 100%)",
                zIndex: 1,
              }}
            />
            <img
              src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=700&q=80"
              alt="coding"
              style={{
                width: "100%",
                display: "block",
                objectFit: "cover",
                height: 320,
              }}
            />
          </div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            style={{
              position: "absolute",
              bottom: -20,
              right: 20,
              background: isDark
                ? "rgba(15,23,42,0.95)"
                : "#ffffff",
              backdropFilter: "blur(8px)",
              border: `1px solid ${border}`,
              borderRadius: 12,
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              boxShadow: isDark
                ? "0 8px 30px rgba(0,0,0,0.4)"
                : "0 10px 40px rgba(0,0,0,0.2)",
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                background:
                  "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              {`</>`}
            </div>
            <div>
              <div
                style={{
                  color: text,
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                Portafolio Compilado
              </div>
              <div style={{ color: sub, fontSize: 12 }}>
                Listo para compartir
              </div>
            </div>
          </motion.div>

          {/* Floating accent */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            style={{
              position: "absolute",
              top: -12,
              left: -12,
              background:
                "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
              borderRadius: 10,
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 20px rgba(59,130,246,0.4)",
            }}
          >
            <span style={{ fontSize: 18 }}>⚡</span>
            <span
              style={{
                color: "#fff",
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              Setup rápido
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* Feature cards */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 48px 80px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 20,
        }}
      >
        {[
          {
            icon: "🎨",
            title: "Diseño Profesional",
            desc: "Temas claros y oscuros, con una interfaz moderna y elegante.",
          },
          {
            icon: "🔧",
            title: "Habilidades y Niveles",
            desc: "Muestra tus habilidades técnicas y blandas con barras de nivel.",
          },
          {
            icon: "📁",
            title: "Portafolio de Proyectos",
            desc: "Agrega proyectos con imágenes, descripciones y enlaces GitHub.",
          },
        ].map((feat, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -4, scale: 1.02 }}
            style={{
              background: isDark
                ? "rgba(15,23,42,0.6)"
                : "rgba(255,255,255,0.8)",
              border: `1px solid ${border}`,
              borderRadius: 14,
              padding: "28px 24px",
              backdropFilter: "blur(8px)",
              transition: "box-shadow 0.2s",
              boxShadow: isDark
                ? "none"
                : "0 2px 12px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                fontSize: 32,
                marginBottom: 14,
              }}
            >
              {feat.icon}
            </div>
            <h3
              style={{
                color: text,
                fontWeight: 700,
                fontSize: 16,
                marginBottom: 8,
              }}
            >
              {feat.title}
            </h3>
            <p style={{ color: sub, fontSize: 13, lineHeight: 1.6 }}>
              {feat.desc}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}