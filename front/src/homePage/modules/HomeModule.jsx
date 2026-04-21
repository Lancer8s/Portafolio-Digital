import HeroSection from "../components/HeroSection";

export default function HomeModule({ isDark, toggleTheme, onRegister, onLogin }) {
  return (
    <HeroSection
      isDark={isDark}
      toggleTheme={toggleTheme}
      onRegister={onRegister}
      onLogin={onLogin}
    />
  );
}