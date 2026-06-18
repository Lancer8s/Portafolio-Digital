import { createContext, useContext, useEffect, useState } from "react";
import iconoSol from "../assets/iconoSol.png";
import iconoLuna from "../assets/iconoLuna.png";

const ThemeContext = createContext();
/**
 * Proveedor del contexto de tema (claro/oscuro).
 * Persiste la preferencia en localStorage y aplica clases al documento.
 * @param {{ children: React.ReactNode }} props
 */
export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
// Sincroniza el tema con localStorage, data-theme y colores del body
  useEffect(() => {
    localStorage.setItem("theme", isDark ? "dark" : "light");
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    document.body.style.backgroundColor = isDark ? "#020617" : "#ffffff";
    document.body.style.color = isDark ? "#F8FAFC" : "#111111";
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, iconoSol, iconoLuna }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
