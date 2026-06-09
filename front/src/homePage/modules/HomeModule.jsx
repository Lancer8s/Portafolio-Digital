import HeroSection from "../components/HeroSection";
import SearchSection from "../components/SearchSection";

export default function HomeModule({ isDark, toggleTheme, onRegister, onLogin }) {
  return (
    <>
      <HeroSection
        isDark={isDark}
        toggleTheme={toggleTheme}
        onRegister={onRegister}
        onLogin={onLogin}
      />
      <SearchSection isDark={isDark} />
    </>
  );
}