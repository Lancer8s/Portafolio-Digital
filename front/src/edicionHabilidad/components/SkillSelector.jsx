import { useState, useEffect } from "react";
import { habilidadAPI } from "../../api";
import { useApp } from "../../context/AppContext";
import SkillCatalogPicker from "../../components/SkillCatalogPicker";

export default function SkillSelector({ isDark, onBack, onSave, userData }) {
  const { debouncedRefresh } = useApp();
  
  // Selected lists
  const [selectedTechs, setSelectedTechs] = useState([]); // Array of { nombre, nivel }
  const [selectedSofts, setSelectedSofts] = useState([]); // Array of string names

  // Custom skill form states
  const [customName, setCustomName] = useState("");
  const [customType, setCustomType] = useState("tecnica");
  const [customLevel, setCustomLevel] = useState(50);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [catalogo, setCatalogo] = useState([]);

  // Load catalog from backend
  useEffect(() => {
    const loadCatalogo = async () => {
      try {
        const { data } = await habilidadAPI.catalogo();
        if (data.ok) {
          const flat = [];
          if (data.tecnicas && typeof data.tecnicas === "object") {
            Object.values(data.tecnicas).forEach((items) => {
              if (Array.isArray(items)) {
                items.forEach((item) => flat.push(item));
              }
            });
          }
          if (Array.isArray(data.blandas)) {
            data.blandas.forEach((item) => flat.push(item));
          }
          setCatalogo(flat);
        }
      } catch {
        /* fallback silently */
      }
    };
    loadCatalogo();
  }, []);

  // Skills already owned by user (to disable them in picker)
  const existingTech = (userData?.techSkills || []).map((s) =>
    s.nombre.toLowerCase()
  );
  const existingSoft = (userData?.softSkills || []).map((s) =>
    (typeof s === "string" ? s : s.nombre).toLowerCase()
  );

  const existingAll = [...existingTech, ...existingSoft];

  const text = isDark ? "#fff" : "#111";
  const sub = isDark ? "#94a3b8" : "#807F81";
  const border = isDark ? "#1D283A" : "#E2E8F0";
  const bg = isDark ? "#0F172A" : "#F8FAFC";

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Toggle selection from the catalog picker
  const handleToggleSkill = (name) => {
    // Check type in catalog
    const catalogItem = catalogo.find(
      (c) => c.nombre.toLowerCase() === name.toLowerCase()
    );

    const isBlanda = catalogItem?.tipo === "blanda";

    if (isBlanda) {
      if (selectedSofts.some((s) => s.toLowerCase() === name.toLowerCase())) {
        setSelectedSofts((prev) => prev.filter((s) => s.toLowerCase() !== name.toLowerCase()));
      } else {
        setSelectedSofts((prev) => [...prev, name]);
      }
    } else {
      // It is a tech skill
      if (selectedTechs.some((t) => t.nombre.toLowerCase() === name.toLowerCase())) {
        setSelectedTechs((prev) => prev.filter((t) => t.nombre.toLowerCase() !== name.toLowerCase()));
      } else {
        setSelectedTechs((prev) => [...prev, { nombre: name, nivel: 50 }]);
      }
    }
  };

  const handleUpdateTechLevel = (nombre, nuevoNivel) => {
    setSelectedTechs((prev) =>
      prev.map((t) =>
        t.nombre.toLowerCase() === nombre.toLowerCase() ? { ...t, nivel: nuevoNivel } : t
      )
    );
  };

  const handleRemoveTech = (nombre) => {
    setSelectedTechs((prev) =>
      prev.filter((t) => t.nombre.toLowerCase() !== nombre.toLowerCase())
    );
  };

  const handleRemoveSoft = (nombre) => {
    setSelectedSofts((prev) =>
      prev.filter((s) => s.toLowerCase() !== nombre.toLowerCase())
    );
  };

  // Add custom skill manually
  const handleAddCustomSkill = () => {
    const trimmed = customName.trim();
    if (!trimmed) {
      showToast("Escribe el nombre de la habilidad", "error");
      return;
    }

    const low = trimmed.toLowerCase();

    // Check if user already has it
    if (existingAll.includes(low)) {
      showToast("Ya tienes esta habilidad en tu perfil", "error");
      return;
    }

    // Check if it is already selected
    const inTechSelected = selectedTechs.some((t) => t.nombre.toLowerCase() === low);
    const inSoftSelected = selectedSofts.some((s) => s.toLowerCase() === low);

    if (inTechSelected || inSoftSelected) {
      showToast("Esta habilidad ya está seleccionada", "error");
      return;
    }

    // Add to list
    if (customType === "tecnica") {
      setSelectedTechs((prev) => [...prev, { nombre: trimmed, nivel: customLevel }]);
    } else {
      setSelectedSofts((prev) => [...prev, trimmed]);
    }

    // Reset inputs
    setCustomName("");
    setCustomLevel(50);
    showToast(`"${trimmed}" agregada a la lista`);
  };

  const handleSave = async () => {
    if (selectedTechs.length === 0 && selectedSofts.length === 0) {
      showToast(
        "Debe seleccionar o agregar al menos una tecnología o habilidad blanda",
        "error"
      );
      return;
    }

    setSaving(true);
    try {
      const promises = [];

      // Save tech skills
      selectedTechs.forEach((tech) => {
        const catalogoItem = catalogo.find(
          (c) =>
            c.nombre.toLowerCase() === tech.nombre.toLowerCase() &&
            c.tipo === "tecnica"
        );

        if (catalogoItem) {
          promises.push(habilidadAPI.agregar(catalogoItem.id_habilidad, tech.nivel));
        } else {
          promises.push(
            habilidadAPI.agregarPersonalizada(tech.nombre, "tecnica", tech.nivel)
          );
        }
      });

      // Save soft skills
      selectedSofts.forEach((soft) => {
        const catalogoItem = catalogo.find(
          (c) =>
            c.nombre.toLowerCase() === soft.toLowerCase() &&
            c.tipo === "blanda"
        );

        if (catalogoItem) {
          promises.push(habilidadAPI.agregar(catalogoItem.id_habilidad, null));
        } else {
          promises.push(
            habilidadAPI.agregarPersonalizada(soft, "blanda", null)
          );
        }
      });

      await Promise.all(promises);

      showToast("Habilidades guardadas correctamente");
      debouncedRefresh();

      setTimeout(() => {
        onSave();
      }, 500);
    } catch (err) {
      const msg =
        err.response?.data?.mensaje ||
        err.response?.data?.errores?.nombre?.[0] ||
        "Error al guardar habilidades";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  // Helper lists to send to picker
  const selectedAllNames = [
    ...selectedTechs.map((t) => t.nombre),
    ...selectedSofts,
  ];

  const totalSelectedCount = selectedTechs.length + selectedSofts.length;

  return (
    <div
      style={{
        maxWidth: 780,
        margin: "0 auto",
        padding: "12px 0 24px",
        position: "relative",
      }}
    >
      <style>{`
        .skill-range { -webkit-appearance: none; appearance: none; width: 100%; height: 8px; border-radius: 4px; outline: none; cursor: pointer; margin: 4px 0; }
        .skill-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #3B82F6; cursor: grab; border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.3); }
        .skill-range::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.15); }
        .skill-range::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: #3B82F6; cursor: grab; border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.3); }
        .selected-skills-scroll::-webkit-scrollbar { width: 6px; }
        .selected-skills-scroll::-webkit-scrollbar-track { background: transparent; }
        .selected-skills-scroll::-webkit-scrollbar-thumb { background: ${isDark ? "#334155" : "#cbd5e1"}; border-radius: 4px; }
        .selected-skills-scroll::-webkit-scrollbar-thumb:hover { background: ${isDark ? "#475569" : "#94a3b8"}; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: toast.type === "success" ? "#16a34a" : "#ef4444",
            color: "#fff",
            borderRadius: 8,
            padding: "10px 24px",
            fontWeight: 600,
            fontSize: 14,
            zIndex: 999,
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          {toast.msg}
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        {/* LEFT COLUMN: Catalog Picker */}
        <div style={{ flex: "1 1 360px", minWidth: 320, display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ color: text, fontWeight: 700, fontSize: 15, margin: "0 0 4px" }}>
            Explora el Catálogo de Habilidades
          </p>
          <SkillCatalogPicker
            isDark={isDark}
            selected={selectedAllNames}
            existing={existingAll}
            onToggle={handleToggleSkill}
            showSoftSkills={true}
          />
        </div>

        {/* RIGHT COLUMN: Settings, Custom Skill, Actions */}
        <div style={{ flex: "1 1 320px", minWidth: 280, display: "flex", flexDirection: "column", gap: 16 }}>
          
          {/* ADJUST LEVELS SECTION (SCROLLABLE BOX) */}
          <div style={{ border: `1px solid ${border}`, borderRadius: 12, padding: 14, background: bg, display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ color: text, fontWeight: 700, fontSize: 14, margin: 0 }}>
              Habilidades Seleccionadas ({totalSelectedCount})
            </p>
            
            {totalSelectedCount > 0 ? (
              <div 
                className="selected-skills-scroll"
                style={{ 
                  maxHeight: 220, 
                  overflowY: "auto", 
                  paddingRight: 6, 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: 12 
                }}
              >
                {selectedTechs.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <p style={{ color: sub, fontWeight: 600, fontSize: 12, margin: 0 }}>
                      Ajustar Nivel de Técnicas
                    </p>
                    {selectedTechs.map((tech) => (
                      <div
                        key={tech.nombre}
                        style={{
                          background: isDark ? "#1D283A" : "#fff",
                          border: `1px solid ${border}`,
                          borderRadius: 8,
                          padding: "8px 12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: text, fontWeight: 600, fontSize: 13 }}>{tech.nombre}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ color: "#3B82F6", fontWeight: 700, fontSize: 13 }}>{tech.nivel}%</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTech(tech.nombre)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#ef4444",
                                cursor: "pointer",
                                fontSize: 14,
                                padding: 0,
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={tech.nivel}
                          onChange={(e) => handleUpdateTechLevel(tech.nombre, Number(e.target.value))}
                          style={{
                            width: "100%",
                            background: `linear-gradient(to right, #3B82F6 ${tech.nivel}%, ${isDark ? '#0F172A' : '#F8FAFC'} ${tech.nivel}%)`
                          }}
                          className="skill-range"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {selectedSofts.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                    <p style={{ color: sub, fontWeight: 600, fontSize: 12, margin: 0 }}>
                      Habilidades Blandas
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {selectedSofts.map((soft) => (
                        <div
                          key={soft}
                          style={{
                            background: isDark ? "#1D283A" : "#fff",
                            border: `1.5px dashed ${border}`,
                            borderRadius: 20,
                            padding: "4px 10px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 12,
                            color: text,
                          }}
                        >
                          {soft}
                          <button
                            type="button"
                            onClick={() => handleRemoveSoft(soft)}
                            style={{
                              background: "none",
                              border: "none",
                              color: sub,
                              cursor: "pointer",
                              fontSize: 12,
                              padding: 0,
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: "30px 0", textAlign: "center", color: sub, fontSize: 13, fontStyle: "italic" }}>
                Selecciona habilidades a la izquierda para configurar su nivel.
              </div>
            )}
          </div>

          {/* CUSTOM SKILL SECTION */}
          <div style={{ border: `1px solid ${border}`, borderRadius: 12, padding: 14, background: bg, display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ color: text, fontWeight: 700, fontSize: 13, margin: 0 }}>
              ¿No encuentras tu habilidad? Agrégala personalizada
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end" }}>
              <div style={{ flex: "1 1 120px" }}>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Nombre de habilidad"
                  style={{
                    width: "100%",
                    background: isDark ? "#1D283A" : "#fff",
                    border: `1px solid ${border}`,
                    borderRadius: 6,
                    padding: "6px 10px",
                    color: text,
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ width: 90 }}>
                <select
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  style={{
                    width: "100%",
                    background: isDark ? "#1D283A" : "#fff",
                    border: `1px solid ${border}`,
                    borderRadius: 6,
                    padding: "6px 10px",
                    color: text,
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="tecnica">Técnica</option>
                  <option value="blanda">Blanda</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleAddCustomSkill}
                style={{
                  background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "7px 12px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                + Añadir
              </button>
            </div>

            {customType === "tecnica" && customName.trim() && (
              <div style={{ background: isDark ? "#020617" : "#E2E8F0", borderRadius: 6, padding: "8px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: sub, marginBottom: 4 }}>
                  <span>Nivel para "{customName}"</span>
                  <strong>{customLevel}%</strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={customLevel}
                  onChange={(e) => setCustomLevel(Number(e.target.value))}
                  style={{
                    width: "100%",
                    background: `linear-gradient(to right, #3B82F6 ${customLevel}%, ${isDark ? '#1D283A' : '#E2E8F0'} ${customLevel}%)`
                  }}
                  className="skill-range"
                />
              </div>
            )}
          </div>

          {/* FOOTER ACTIONS */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 4,
            }}
          >
            <button
              type="button"
              onClick={onBack}
              style={{
                background: isDark ? "#1D283A" : "#E2E8F0",
                color: text,
                border: "none",
                borderRadius: 8,
                padding: "10px 24px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Atras
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || totalSelectedCount === 0}
              style={{
                background: saving
                  ? "#6B7280"
                  : totalSelectedCount === 0
                  ? "#94a3b8"
                  : "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 24px",
                cursor: (saving || totalSelectedCount === 0) ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: 14,
                transition: "all 0.2s",
                opacity: (saving || totalSelectedCount === 0) ? 0.7 : 1,
              }}
            >
              {saving ? "Guardando..." : `Guardar (${totalSelectedCount})`}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}