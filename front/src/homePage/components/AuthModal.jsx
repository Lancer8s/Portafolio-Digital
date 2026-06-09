import { AnimatePresence, motion } from "framer-motion";
import LoginPage from "../../loginUsuario/LoginPage";
import RegistroUsuarioPage from "../../registroUsuario/RegistroUsuarioPage";

export default function AuthModal({ type, onClose, onSwitch }) {
  return (
    <AnimatePresence>
      {type && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(7px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            boxSizing: "border-box",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: type === "registro" ? 460 : 420,
              position: "relative",
            }}
          >
            <button
              onClick={onClose}
              aria-label="Cerrar ventana"
              style={{
                position: "absolute",
                top: -14,
                right: -14,
                width: 34,
                height: 34,
                borderRadius: "50%",
                border: "1px solid #E2E8F0",
                background: "#ffffff",
                color: "#1E293B",
                cursor: "pointer",
                fontWeight: 900,
                fontSize: 18,
                boxShadow: "0 8px 22px rgba(15,23,42,0.22)",
                zIndex: 2,
              }}
            >
              ×
            </button>

            {type === "login" ? (
              <LoginPage
                modal
                onSwitchToRegister={() => onSwitch("registro")}
              />
            ) : (
              <RegistroUsuarioPage
                modal
                onSwitchToLogin={() => onSwitch("login")}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
