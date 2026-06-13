import HeroSection from "../components/HeroSection";
import SearchSection from "../components/SearchSection";
import AboutSection from "../components/AboutSection";

export default function HomeModule({ isDark, toggleTheme, onRegister, onLogin }) {
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
    </div>
  );
}
