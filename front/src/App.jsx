import { useState } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeProvider } from "./context/ThemeContext";
import { AppProvider, useApp } from "./context/AppContext";
import Navbar from "./components/Navbar";

import HomePage from "./homePage/HomePage";
import LoginPage from "./loginUsuario/LoginPage";
import AuthCallbackPage from "./authCallback/AuthCallbackPage";
import RegistroUsuarioPage from "./registroUsuario/RegistroUsuarioPage";
import EdicionPerfilPage from "./edicionPerfil/EdicionPerfilPage";
import VistaEdicionPage from "./vistaEdicion/VistaEdicionPage";
import EdicionHabilidadPage from "./edicionHabilidad/EdicionHabilidadPage";
import EdicionProyectoPage from "./edicionProyecto/EdicionProyectoPage";
import VistaProyectoPage from "./vistaProyecto/VistaProyectoPage";
import PublicPortfolioPage from "./publicPortfolio/PublicPortfolioPage";
import AdminDashboardPage from "./adminDashboard/AdminDashboardPage";
// Variantes de animación para transiciones entre páginas (fade rápido)
const pageVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.08, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.05, ease: "easeIn" },
  },
};

/**
 * Wrapper de ruta protegida.
 * - Redirige a "/" si el usuario no está autenticado.
 * - Redirige a "/admin" si el usuario es administrador intentando acceder a rutas normales.
 * - Redirige a "/vista" si un usuario normal intenta acceder a rutas de admin.
 * @param {boolean} requireAdmin - Si true, solo permite acceso a administradores
 */
function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, loading, userData } = useApp();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#020617",
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={{
            width: 48,
            height: 48,
            border: "4px solid",
            borderColor: "#3B82F6 transparent #3B82F6 transparent",
            borderRadius: "50%",
          }}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const isAdmin = userData?.roles?.includes('administrador');

  if (isAdmin && location.pathname !== '/admin') {
    return <Navigate to="/admin" replace />;
  }

  if (!isAdmin && requireAdmin) {
    return <Navigate to="/vista" replace />;
  }

  return children;
}

function AnimatedRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData, refreshUserData } = useApp();
  const [editProyectoIdx, setEditProyectoIdx] = useState(null);

  return (
    <AnimatePresence mode="sync">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ minHeight: "100vh" }}
      >
        <Routes location={location}>
          {/* ── Rutas públicas: accesibles sin autenticación ── */}
          <Route
            path="/"
            element={
              <HomePage
                onRegister={() => navigate("/")}
                onLogin={() => navigate("/login")}
              />
            }
          />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/portafolio/:id" element={<PublicPortfolioPage />} />
          <Route path="/registro" element={<Navigate to="/" replace />} />

          {/* ── Rutas protegidas: requieren sesión activa ── */}
          <Route
            path="/edicion"
            element={
              <ProtectedRoute>
                <EdicionPerfilPage
                  userData={userData}
                  onNext={() => {
                    refreshUserData();
                    navigate("/vista");
                  }}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vista"
            element={
              <ProtectedRoute>
                <VistaEdicionPage
                  userData={userData}
                  onGoToHabilidad={() => navigate("/habilidad")}
                  onGoToProyecto={() => {
                    setEditProyectoIdx(null);
                    navigate("/proyecto");
                  }}
                  onEditProyecto={(idx) => {
                    setEditProyectoIdx(idx);
                    navigate("/proyecto");
                  }}
                  onVerProyecto={(idx) =>
                    navigate(`/proyecto/${idx}`)
                  }
                  onBack={() => navigate("/edicion")}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/habilidad"
            element={
              <ProtectedRoute>
                <EdicionHabilidadPage
                  userData={userData}
                  onBack={() => navigate("/vista")}
                  onSave={() => {
                    navigate("/vista");
                  }}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/proyecto"
            element={
              <ProtectedRoute>
                <EdicionProyectoPage
                  initialData={
                    editProyectoIdx !== null
                      ? userData.proyectos?.[editProyectoIdx]
                      : null
                  }
                  onBack={() => navigate("/vista")}
                  onSave={() => {
                    setEditProyectoIdx(null);
                    navigate("/vista");
                  }}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/proyecto/:idx"
            element={
              <ProtectedRoute>
                <VistaProyectoPage
                  userData={userData}
                  onBack={() => navigate("/vista")}
                />
              </ProtectedRoute>
            }
          />
          {/* ── Rutas de administrador: requieren rol 'administrador' ── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <Navbar />
        <AnimatedRoutes />
      </AppProvider>
    </ThemeProvider>
  );
}