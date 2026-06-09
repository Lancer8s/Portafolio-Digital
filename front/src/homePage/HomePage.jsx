import "./index.css";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import HomeModule from "./modules/HomeModule";
import AuthModal from "./components/AuthModal";

export default function HomePage() {
  const { isDark, toggleTheme } = useTheme();
  const [authModal, setAuthModal] = useState(null);

  return (
    <>
      <HomeModule
        isDark={isDark}
        toggleTheme={toggleTheme}
        onRegister={() => setAuthModal("registro")}
        onLogin={() => setAuthModal("login")}
      />
      <AuthModal
        type={authModal}
        onClose={() => setAuthModal(null)}
        onSwitch={setAuthModal}
      />
    </>
  );
}