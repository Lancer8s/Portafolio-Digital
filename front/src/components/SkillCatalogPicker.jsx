import { useState, useEffect, useMemo } from "react";
import { habilidadAPI } from "../api";

/**
 * SkillCatalogPicker — Reusable skill catalog browser.
 *
 * Props:
 *  - mode: "profile" | "project"
 *  - isDark: boolean
 *  - selected: string[]           — names of currently selected skills
 *  - existing: string[]           — names the user already has (shown as disabled ✓)
 *  - onToggle: (skillName) => void
 *  - showSoftSkills: boolean      — whether to show the "Blandas" tab (default true)
 */
export default function SkillCatalogPicker({
  isDark = false,
  selected = [],
  existing = [],
  onToggle,
  showSoftSkills = true,
}) {
  const [catalogo, setCatalogo] = useState([]);
  const [groupedTech, setGroupedTech] = useState({});
  const [blandas, setBlandas] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Load catalog from backend
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const { data } = await habilidadAPI.catalogo();
        if (!alive) return;
        if (data.ok) {
          const flat = [];
          if (data.tecnicas && typeof data.tecnicas === "object") {
            setGroupedTech(data.tecnicas);
            Object.values(data.tecnicas).forEach((items) => {
              if (Array.isArray(items)) items.forEach((item) => flat.push(item));
            });
          }
          if (Array.isArray(data.blandas)) {
            setBlandas(data.blandas);
            data.blandas.forEach((item) => flat.push(item));
          }
          setCatalogo(flat);
        }
      } catch {
        /* fallback silently */
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, []);

  // Derive categories for tabs
  const categories = useMemo(() => Object.keys(groupedTech), [groupedTech]);

  // Filtered items based on search + activeTab
  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (activeTab === "blandas") {
      if (!q) return blandas;
      return blandas.filter((b) => b.nombre.toLowerCase().includes(q));
    }

    let techItems = [];
    if (activeTab === "all") {
      Object.values(groupedTech).forEach((items) => {
        if (Array.isArray(items)) techItems.push(...items);
      });
    } else {
      techItems = groupedTech[activeTab] || [];
    }

    if (q) {
      techItems = techItems.filter((t) => t.nombre.toLowerCase().includes(q));
    }

    return techItems;
  }, [activeTab, groupedTech, blandas, search]);

  // Group filtered items by category when showing "all"
  const groupedFiltered = useMemo(() => {
    if (activeTab !== "all") return null;

    const q = search.toLowerCase().trim();
    const result = {};
    Object.entries(groupedTech).forEach(([cat, items]) => {
      const filtered = q
        ? items.filter((t) => t.nombre.toLowerCase().includes(q))
        : items;
      if (filtered.length > 0) result[cat] = filtered;
    });
    return result;
  }, [activeTab, groupedTech, search]);

  // Theme
  const text = isDark ? "#fff" : "#111";
  const sub = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#1e293b" : "#e2e8f0";
  const bg = isDark ? "#0f172a" : "#f8fafc";
  const cardBg = isDark ? "#1e293b" : "#fff";

  const selectedLower = selected.map((s) => s.toLowerCase());
  const existingLower = existing.map((s) => s.toLowerCase());

  const getChipState = (name) => {
    const low = name.toLowerCase();
    if (existingLower.includes(low) && !selectedLower.includes(low))
      return "existing";
    if (selectedLower.includes(low)) return "selected";
    return "available";
  };

  const chipStyles = (state) => {
    const base = {
      padding: "6px 14px",
      borderRadius: 20,
      fontSize: 13,
      fontWeight: 500,
      cursor: state === "existing" ? "default" : "pointer",
      border: "1.5px solid",
      transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      userSelect: "none",
      lineHeight: 1.3,
    };

    switch (state) {
      case "existing":
        return {
          ...base,
          background: isDark ? "rgba(34,197,94,0.1)" : "rgba(34,197,94,0.08)",
          borderColor: isDark ? "rgba(34,197,94,0.3)" : "rgba(34,197,94,0.25)",
          color: isDark ? "#4ade80" : "#16a34a",
          opacity: 0.65,
        };
      case "selected":
        return {
          ...base,
          background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
          borderColor: "transparent",
          color: "#fff",
          fontWeight: 600,
          boxShadow: "0 2px 8px rgba(59,130,246,0.3)",
        };
      default:
        return {
          ...base,
          background: cardBg,
          borderColor: border,
          color: text,
        };
    }
  };

  const tabStyle = (active) => ({
    padding: "6px 16px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: active ? 700 : 500,
    cursor: "pointer",
    border: "none",
    background: active
      ? "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)"
      : isDark
      ? "#1e293b"
      : "#f1f5f9",
    color: active ? "#fff" : sub,
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
    flexShrink: 0,
  });

  // Category colors
  const getCatColor = (cat) => {
    const c = cat.toLowerCase();
    if (c.includes("frontend")) return "#3b82f6";
    if (c.includes("backend")) return "#10b981";
    if (c.includes("devops") || c.includes("infra")) return "#f59e0b";
    if (c.includes("mobile") || c.includes("movil") || c.includes("móvil")) return "#ec4899";
    if (c.includes("datos") || c.includes("data") || c.includes("base")) return "#8b5cf6";
    if (c.includes("design") || c.includes("diseño")) return "#f43f5e";
    if (c.includes("testing") || c.includes("qa")) return "#06b6d4";
    return "#64748b";
  };

  const selectedCount = selected.length;

  // Chip renderer helper
  const renderChip = (item) => {
    const state = getChipState(item.nombre);
    const icon = (state === "existing" || state === "selected") ? (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ) : null;

    return (
      <button
        key={item.id_habilidad}
        style={chipStyles(state)}
        onClick={() => { if (state !== "existing") onToggle?.(item.nombre); }}
        title={
          state === "existing" ? "Ya tienes esta habilidad"
          : state === "selected" ? "Click para quitar"
          : "Click para seleccionar"
        }
      >
        {icon}
        {item.nombre}
      </button>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: sub, fontSize: 14, border: `1px solid ${border}`, borderRadius: 14, background: bg }}>
        <div style={{
          width: 24, height: 24,
          border: `2.5px solid ${border}`, borderTopColor: "#3b82f6",
          borderRadius: "50%", animation: "scp-spin 0.8s linear infinite",
          margin: "0 auto 12px",
        }} />
        Cargando catálogo...
        <style>{`@keyframes scp-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ border: `1px solid ${border}`, borderRadius: 14, background: bg, overflow: "hidden" }}>
        {/* Search bar */}
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${border}`, background: cardBg }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: isDark ? "#0f172a" : "#f1f5f9",
            borderRadius: 10, padding: "8px 14px",
            border: `1px solid ${border}`,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar habilidad..."
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: text, fontSize: 14 }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: sub, cursor: "pointer", padding: 0, fontSize: 16, lineHeight: 1 }}>
                ✕
              </button>
            )}
          </div>

          {/* Selected counter */}
          {selectedCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 12, color: "#3b82f6", fontWeight: 600 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {selectedCount} seleccionada{selectedCount !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Category tabs */}
        <div style={{
          display: "flex", gap: 6, padding: "10px 16px",
          overflowX: "auto", borderBottom: `1px solid ${border}`,
          WebkitOverflowScrolling: "touch",
        }}>
          <button style={tabStyle(activeTab === "all")} onClick={() => setActiveTab("all")}>
            Todas
          </button>
          {categories.map((cat) => (
            <button key={cat} style={tabStyle(activeTab === cat)} onClick={() => setActiveTab(cat)}>
              <span style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: getCatColor(cat),
                marginRight: 6,
                verticalAlign: "middle"
              }} />
              {cat}
            </button>
          ))}
          {showSoftSkills && (
            <button style={tabStyle(activeTab === "blandas")} onClick={() => setActiveTab("blandas")}>
              <span style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#64748b",
                marginRight: 6,
                verticalAlign: "middle"
              }} />
              Blandas
            </button>
          )}
        </div>

        {/* Skills grid */}
        <div style={{ padding: "14px 16px", maxHeight: 320, overflowY: "auto" }}>
          {activeTab === "all" && groupedFiltered ? (
            Object.keys(groupedFiltered).length === 0 ? (
              <p style={{ color: sub, fontSize: 13, fontStyle: "italic" }}>No se encontraron habilidades</p>
            ) : (
              Object.entries(groupedFiltered).map(([cat, items]) => (
                <div key={cat} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: getCatColor(cat)
                    }} />
                    <span style={{ color: text, fontSize: 13, fontWeight: 700, letterSpacing: 0.3 }}>{cat}</span>
                    <span style={{ color: sub, fontSize: 11, fontWeight: 500 }}>({items.length})</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {items.map(renderChip)}
                  </div>
                </div>
              ))
            )
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {filteredItems.length === 0 ? (
                <p style={{ color: sub, fontSize: 13, fontStyle: "italic" }}>No se encontraron habilidades</p>
              ) : (
                filteredItems.map(renderChip)
              )}
            </div>
          )}
        </div>
      </div>
  );
}
