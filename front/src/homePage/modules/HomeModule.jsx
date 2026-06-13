import { useEffect, useState } from "react";
import HeroSection from "../components/HeroSection";
import SearchSection from "../components/SearchSection";
import AboutSection from "../components/AboutSection";

export default function HomeModule({ isDark, toggleTheme, onRegister, onLogin }) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: isDark
          ? "linear-gradient(180deg, #020617 0%, #0F172A 100%)"
          : "#ffffff",
      }}
    >
      <HeroSection
        isDark={isDark}
        toggleTheme={toggleTheme}
        onRegister={onRegister}
        onLogin={onLogin}
      />
      <SearchSection isDark={isDark} />
      <AboutSection isDark={isDark} />

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          title="Volver al inicio"
          style={{
            position: "fixed",
            right: 24,
            bottom: 24,
            zIndex: 120,
            width: 46,
            height: 46,
            borderRadius: "50%",
            border: isDark ? "1px solid #1D283A" : "1px solid #E2E8F0",
            background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
            color: "#fff",
            cursor: "pointer",
            fontSize: 20,
            fontWeight: 900,
            boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.35)" : "0 10px 30px rgba(59,130,246,0.28)",
          }}
        >
          ↑
        </button>
      )}
    </div>
  );
}
