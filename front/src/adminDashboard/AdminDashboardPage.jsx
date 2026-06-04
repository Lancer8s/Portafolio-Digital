import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { adminAPI } from "../api";
import AdminEstadisticas from "./components/AdminEstadisticas";
import AdminCIVerification from "./components/AdminCIVerification";
import AdminBitacoras from "./components/AdminBitacoras";

const SECTIONS = [
  { id: "dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" },
  { id: "ci", label: "Verificación CI", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "bitacoras", label: "Bitácoras", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
];

export default function AdminDashboardPage() {
  const { isDark } = useTheme();
  const { logout } = useApp();
  const [section, setSection] = useState("dashboard");
  const [ciCount, setCiCount] = useState(0);

  const bg = isDark ? "#020617" : "#F1F5F9";
  const sidebarBg = isDark ? "#0F172A" : "#FFFFFF";
  const text = isDark ? "#F8FAFC" : "#0F172A";
  const sub = isDark ? "#94A3B8" : "#64748B";
  const border = isDark ? "#1E293B" : "#E2E8F0";
  const accent = "#3B82F6";

  useEffect(() => {
    adminAPI.getPendingCI().then(r => { if (r.ok) setCiCount(r.usuarios.length); }).catch(() => {});
  }, [section]);

  return (
    <>
      <style>{`
        .admin-layout { display: flex; min-height: calc(100vh - 52px); }
        .admin-sidebar { width: 240px; flex-shrink: 0; border-right: 1px solid ${border}; padding: 24px 12px; position: sticky; top: 52px; height: calc(100vh - 52px); overflow-y: auto; }
        .admin-main { flex: 1; padding: 28px 32px; min-width: 0; overflow-y: auto; }
        .admin-nav-btn { width: 100%; text-align: left; padding: 10px 14px; border-radius: 10px; border: none; cursor: pointer; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 10px; transition: all 0.15s; font-family: 'Inter', sans-serif; position: relative; }
        .admin-nav-btn:hover { transform: translateX(2px); }
        @media (max-width: 768px) {
          .admin-sidebar { width: 100%; position: relative; height: auto; border-right: none; border-bottom: 1px solid ${border}; padding: 12px; display: flex; gap: 8px; overflow-x: auto; }
          .admin-layout { flex-direction: column; }
          .admin-main { padding: 16px; }
          .admin-nav-btn { white-space: nowrap; width: auto; }
        }
      `}</style>
      <div className="admin-layout" style={{ background: bg, fontFamily: "'Inter', sans-serif" }}>
        {/* Sidebar */}
        <div className="admin-sidebar" style={{ background: sidebarBg }}>
          <div style={{ marginBottom: 24, padding: "0 8px" }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: text }}>
              Panel <span style={{ color: accent }}>Admin</span>
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: sub }}>Gestión del sistema</p>
          </div>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              className="admin-nav-btn"
              onClick={() => setSection(s.id)}
              style={{
                background: section === s.id ? (isDark ? "rgba(59,130,246,0.15)" : "#EFF6FF") : "transparent",
                color: section === s.id ? accent : sub,
                marginBottom: 4,
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d={s.icon} />
              </svg>
              {s.label}
              {s.id === "ci" && ciCount > 0 && (
                <span style={{
                  marginLeft: "auto", background: "#EF4444", color: "#fff", fontSize: 11, fontWeight: 700,
                  borderRadius: 10, padding: "2px 7px", minWidth: 18, textAlign: "center",
                }}>{ciCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Main */}
        <div className="admin-main">
          <motion.div key={section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {section === "dashboard" && <AdminEstadisticas isDark={isDark} />}
            {section === "ci" && <AdminCIVerification isDark={isDark} onCountChange={setCiCount} />}
            {section === "bitacoras" && <AdminBitacoras isDark={isDark} />}
          </motion.div>
        </div>
      </div>
    </>
  );
}
