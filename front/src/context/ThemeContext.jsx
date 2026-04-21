import { createContext, useContext, useState } from "react";
import iconoSol from "../assets/iconoSol.png";
import iconoLuna from "../assets/iconoLuna.png";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const toggleTheme = () => setIsDark((prev) => !prev);
  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, iconoSol, iconoLuna }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);