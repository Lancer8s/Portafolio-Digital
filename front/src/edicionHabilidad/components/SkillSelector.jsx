import { useState, useEffect } from "react";
import {
  TECH_SUGGESTIONS,
  SOFT_SUGGESTIONS,
} from "../interfaces/habilidad.interface";
import {
  buildTechSkill,
  buildSoftSkill,
  isCustom,
} from "../services/habilidad.service";
import { habilidadAPI } from "../../api";
import { useApp } from "../../context/AppContext";

export default function SkillSelector({ isDark, onBack, onSave, userData }) {
  const { setUserData, refreshUserData, debouncedRefresh } = useApp();
  const [selectedTech, setSelectedTech] = useState(null);
  const [techLevel, setTechLevel] = useState(50);
  const [customTech, setCustomTech] = useState("");
  const [selectedSoft, setSelectedSoft] = useState(null);
  const [customSoft, setCustomSoft] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [catalogo, setCatalogo] = useState([]);
  const [groupedTech, setGroupedTech] = useState({});

  // Cargar catálogo de habilidades del backend
  useEffect(() => {
    const loadCatalogo = async () => {
      try {
        const { data } = await habilidadAPI.catalogo();
        if (data.ok) {
          // El SP devuelve tecnicas como objeto agrupado { Frontend: [...], Backend: [...] }
          // y blandas como array plano [...]
          const flat = [];
          if (data.tecnicas && typeof data.tecnicas === "object") {
            setGroupedTech(data.tecnicas);
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
        /* usar sugerencias locales si el catálogo falla */
      }
    };
    loadCatalogo();
  }, []);

  // Habilidades que el usuario YA tiene
  const existingTech = (userData?.techSkills || []).map((s) =>
    s.nombre.toLowerCase()
  );
  const existingSoft = (userData?.softSkills || []).map((s) =>
    (typeof s === "string" ? s : s.nombre).toLowerCase()
  );

  const text = isDark ? "#fff" : "#111";
  const sub = isDark ? "#94a3b8" : "#807F81";
  const border = isDark ? "#1D283A" : "#E2E8F0";
  const bg = isDark ? "#0F172A" : "#F8FAFC";
  const chip = isDark ? "#1D283A" : "#fff";

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const chipStyle = (active, alreadyHas) => ({
    padding: "7px 16px",
    border: `1px solid ${alreadyHas ? "#1d4ed8" : active ? "#3B82F6" : border}`,
    borderRadius: 6,
    background: alreadyHas ? "#1e3a5f" : active ? "#3B82F6" : chip,
    color: alreadyHas ? "#60a5fa" : active ? "#fff" : text,
    cursor: alreadyHas ? "not-allowed" : "pointer",
    fontSize: 13,
    fontWeight: active || alreadyHas ? 700 : 400,
    transition: "all 0.15s",
    opacity: alreadyHas ? 0.7 : 1,
  });

  const handleSelectTech = (s) => {
    if (existingTech.includes(s.toLowerCase())) return;
    setSelectedTech(s);
  };

  const handleSelectSoft = (s) => {
    if (existingSoft.includes(s.toLowerCase())) return;
    setSelectedSoft(s);
  };

  const buildSavedSkill = (resp, fallbackName, fallbackTipo, fallbackNivel = null) => {
    const data = resp?.data || resp || {};
    return {
      id_habilidad: data.id_habilidad,
      nombre: data.nombre || fallbackName,
      tipo: data.tipo || fallbackTipo,
      nivel: data.nivel ?? fallbackNivel,
    };
  };

  const refreshImmediately = async () => {
    try {
      await refreshUserData();
    } catch {
      debouncedRefresh();
    }
  };

  const handleSave = async () => {
    if (!selectedTech && !selectedSoft) {
      showToast(
        "Debe seleccionar al menos una tecnología o habilidad blanda",
        "error"
      );
      return;
    }
    const techName = isCustom(selectedTech) ? customTech : selectedTech;
    const softName = isCustom(selectedSoft) ? customSoft : selectedSoft;

    if (selectedTech && !techName?.trim()) {
      showToast("Debe escribir el nombre de la habilidad técnica", "error");
      return;
    }
    if (selectedSoft && !softName?.trim()) {
      showToast("Debe escribir el nombre de la habilidad blanda", "error");
      return;
    }

    setSaving(true);
    try {
      let savedTech = null;
      let savedSoft = null;

      if (techName) {
        const catalogoItem = catalogo.find(
          (c) =>
            c.nombre.toLowerCase() === techName.toLowerCase() &&
            c.tipo === "tecnica"
        );

        const resp = catalogoItem
          ? await habilidadAPI.agregar(catalogoItem.id_habilidad, techLevel)
          : await habilidadAPI.agregarPersonalizada(techName, "tecnica", techLevel);

        if (!resp.data?.ok) {
          throw new Error(resp.data?.mensaje || "Error al guardar habilidad técnica");
        }

        savedTech = buildSavedSkill(resp, techName, "tecnica", techLevel);
      }

      if (softName) {
        const catalogoItem = catalogo.find(
          (c) =>
            c.nombre.toLowerCase() === softName.toLowerCase() &&
            c.tipo === "blanda"
        );

        const resp = catalogoItem
          ? await habilidadAPI.agregar(catalogoItem.id_habilidad, null)
          : await habilidadAPI.agregarPersonalizada(softName, "blanda", null);

        if (!resp.data?.ok) {
          throw new Error(resp.data?.mensaje || "Error al guardar habilidad blanda");
        }

        savedSoft = buildSavedSkill(resp, softName, "blanda", null);
      }

      setUserData((prev) => {
        const nextTechSkills = [...(prev.techSkills || [])];
        const nextSoftSkills = [...(prev.softSkills || [])];

        if (savedTech?.id_habilidad) {
          const exists = nextTechSkills.some((s) => s.id_habilidad === savedTech.id_habilidad);
          if (!exists) {
            nextTechSkills.push({
              id_habilidad: savedTech.id_habilidad,
              nombre: savedTech.nombre,
              nivel: savedTech.nivel ?? techLevel,
            });
          }
        }

        if (savedSoft?.id_habilidad) {
          const exists = nextSoftSkills.some((s) => s.id_habilidad === savedSoft.id_habilidad);
          if (!exists) {
            nextSoftSkills.push({
              id_habilidad: savedSoft.id_habilidad,
              nombre: savedSoft.nombre,
            });
          }
        }

        return {
          ...prev,
          techSkills: nextTechSkills,
          softSkills: nextSoftSkills,
        };
      });

      showToast("Habilidades guardadas correctamente");
      await refreshImmediately();

      onSave({
        tech: savedTech
          ? {
              id_habilidad: savedTech.id_habilidad,
              nombre: savedTech.nombre,
              nivel: savedTech.nivel ?? techLevel,
            }
          : techName
            ? buildTechSkill(techName, techLevel)
            : null,
        soft: savedSoft
          ? {
              id_habilidad: savedSoft.id_habilidad,
              nombre: savedSoft.nombre,
            }
          : softName
            ? buildSoftSkill(softName)
            : null,
      });
    } catch (err) {
      const msg =
        err.response?.data?.mensaje ||
        err.response?.data?.errores?.nombre?.[0] ||
        err.message ||
        "Error al guardar habilidades";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 560,
        margin: "0 auto",
        padding: "24px 16px 40px",
        display: "flex",
        flexDirection: "column",
        gap: 32,
        position: "relative",
      }}
    >
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

      {/* TÉCNICAS */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <span style={{ color: "#3B82F6", fontSize: 22, fontWeight: 700 }}>
            +
          </span>
          <span style={{ color: text, fontWeight: 700, fontSize: 18 }}>
            Añadir Habilidad Tecnica
          </span>
        </div>

        <div
          style={{
            border: `1px solid ${border}`,
            borderRadius: 10,
            padding: 16,
            background: bg,
          }}
        >
          <div>
            {Object.keys(groupedTech).length > 0 ? (
              <>
                {Object.entries(groupedTech).map(([category, items]) => (
                  <div key={category} style={{ marginBottom: 16 }}>
                    <p style={{ color: sub, fontSize: 13, marginBottom: 8, fontWeight: 600 }}>{category}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {items.map((item) => {
                        const s = item.nombre;
                        const alreadyHas = existingTech.includes(s.toLowerCase());
                        return (
                          <button
                            key={s}
                            style={chipStyle(selectedTech === s, alreadyHas)}
                            onClick={() => handleSelectTech(s)}
                            title={alreadyHas ? "Ya tienes esta habilidad" : ""}
                          >
                            {s}
                            {alreadyHas && " ✓"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 10 }}>
                  <button
                    style={chipStyle(selectedTech === "Otro", false)}
                    onClick={() => handleSelectTech("Otro")}
                  >
                    Otro
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                {TECH_SUGGESTIONS.map((s) => {
                  const alreadyHas = existingTech.includes(s.toLowerCase());
                  return (
                    <button
                      key={s}
                      style={chipStyle(selectedTech === s, alreadyHas)}
                      onClick={() => handleSelectTech(s)}
                      title={alreadyHas ? "Ya tienes esta habilidad" : ""}
                    >
                      {s}
                      {alreadyHas && " ✓"}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedTech && (
            <div
              style={{
                background: isDark ? "#020617" : "#E2E8F0",
                border: `1px solid ${border}`,
                borderRadius: 8,
                padding: "12px 16px",
                marginTop: 8,
              }}
            >
              <p style={{ color: sub, fontSize: 12, marginBottom: 8 }}>
                Añadir Nivel de la habilidad
              </p>
              <style>{`
                .skill-range { -webkit-appearance: none; appearance: none; width: 100%; height: 8px; border-radius: 4px; outline: none; cursor: pointer; }
                .skill-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #3B82F6; cursor: grab; border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.3); }
                .skill-range::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.15); }
                .skill-range::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: #3B82F6; cursor: grab; border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.3); }
              `}</style>
              <input
                className="skill-range"
                type="range"
                min={0}
                max={100}
                value={techLevel}
                onChange={(e) => setTechLevel(Number(e.target.value))}
                style={{ background: `linear-gradient(to right, #3B82F6 ${techLevel}%, ${isDark ? '#1D283A' : '#E2E8F0'} ${techLevel}%)` }}
              />
              <span style={{ color: text, fontWeight: 700, fontSize: 15 }}>
                {techLevel}%
              </span>

              {isCustom(selectedTech) && (
                <input
                  placeholder="Nombre de la habilidad"
                  value={customTech}
                  onChange={(e) => setCustomTech(e.target.value)}
                  style={{
                    marginTop: 10,
                    width: "100%",
                    background: isDark ? "#1D283A" : "#fff",
                    border: `1px solid ${border}`,
                    borderRadius: 6,
                    padding: "8px 12px",
                    color: text,
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* BLANDAS */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <span style={{ color: "#3B82F6", fontSize: 22, fontWeight: 700 }}>
            +
          </span>
          <span style={{ color: text, fontWeight: 700, fontSize: 18 }}>
            Añadir Habilidad Blanda
          </span>
        </div>

        <div
          style={{
            border: `1px solid ${border}`,
            borderRadius: 10,
            padding: 16,
            background: bg,
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SOFT_SUGGESTIONS.map((s) => {
              const alreadyHas = existingSoft.includes(s.toLowerCase());
              return (
                <button
                  key={s}
                  style={chipStyle(selectedSoft === s, alreadyHas)}
                  onClick={() => handleSelectSoft(s)}
                  title={alreadyHas ? "Ya tienes esta habilidad" : ""}
                >
                  {s}
                  {alreadyHas && " ✓"}
                </button>
              );
            })}
          </div>

          {isCustom(selectedSoft) && (
            <input
              placeholder="Nombre de la habilidad blanda"
              value={customSoft}
              onChange={(e) => setCustomSoft(e.target.value)}
              style={{
                marginTop: 12,
                width: "100%",
                background: isDark ? "#1D283A" : "#fff",
                border: `1px solid ${border}`,
                borderRadius: 6,
                padding: "8px 12px",
                color: text,
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          )}
        </div>
      </div>

      {/* BOTONES */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: isDark ? "#1D283A" : "#E2E8F0",
            color: text,
            border: "none",
            borderRadius: 8,
            padding: "10px 28px",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          Atras
        </button>

        {(selectedTech || selectedSoft) && (
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving
                ? "#6B7280"
                : "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 28px",
              cursor: saving ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        )}
      </div>
    </div>
  );
}