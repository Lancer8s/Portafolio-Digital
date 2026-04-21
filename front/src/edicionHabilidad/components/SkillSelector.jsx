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
  const { debouncedRefresh } = useApp();
  const [selectedTech, setSelectedTech] = useState(null);
  const [techLevel, setTechLevel] = useState(50);
  const [customTech, setCustomTech] = useState("");
  const [selectedSoft, setSelectedSoft] = useState(null);
  const [customSoft, setCustomSoft] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [catalogo, setCatalogo] = useState([]);

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

    setSaving(true);
    try {
      // Ejecutar ambas llamadas en paralelo si hay ambas
      const promises = [];

      // Agregar habilidad técnica
      if (techName) {
        const catalogoItem = catalogo.find(
          (c) =>
            c.nombre.toLowerCase() === techName.toLowerCase() &&
            c.tipo === "tecnica"
        );

        if (catalogoItem) {
          promises.push(habilidadAPI.agregar(catalogoItem.id_habilidad, techLevel));
        } else {
          promises.push(habilidadAPI.agregarPersonalizada(
            techName,
            "tecnica",
            techLevel
          ));
        }
      }

      // Agregar habilidad blanda
      if (softName) {
        const catalogoItem = catalogo.find(
          (c) =>
            c.nombre.toLowerCase() === softName.toLowerCase() &&
            c.tipo === "blanda"
        );

        if (catalogoItem) {
          promises.push(habilidadAPI.agregar(catalogoItem.id_habilidad, null));
        } else {
          promises.push(habilidadAPI.agregarPersonalizada(softName, "blanda", null));
        }
      }

      await Promise.all(promises);

      showToast("Habilidades guardadas correctamente");
      debouncedRefresh();

      // Llamar onSave original para navegar
      setTimeout(() => {
        onSave({
          tech: techName ? buildTechSkill(techName, techLevel) : null,
          soft: softName ? buildSoftSkill(softName) : null,
        });
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
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 14,
            }}
          >
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
              <input
                type="range"
                min={0}
                max={100}
                value={techLevel}
                onChange={(e) => setTechLevel(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#3B82F6" }}
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