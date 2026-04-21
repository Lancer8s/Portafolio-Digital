import "./index.css";
import { useTheme } from "../context/ThemeContext";
import HomeModule from "./modules/HomeModule";

export default function HomePage({ onRegister, onLogin }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <HomeModule
      isDark={isDark}
      toggleTheme={toggleTheme}
      onRegister={onRegister}
      onLogin={onLogin}
    />
  );
}