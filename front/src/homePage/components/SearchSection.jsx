import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { portafolioAPI } from "../../api";
import DefaultAvatar from "../../components/DefaultAvatar";
import VerificationBadge from "../../components/VerificationBadge";

export default function SearchSection({ isDark }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  const text = isDark ? "#fff" : "#111";
  const sub = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#1D283A" : "#E2E8F0";
  const cardBg = isDark ? "rgba(15,23,42,0.7)" : "rgba(255,255,255,0.85)";
  const sectionBg = isDark
    ? "rgba(2,6,23,0.6)"
    : "rgba(241,245,249,0.7)";

  const doSearch = useCallback(async (q) => {
    if (q.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    try {
      const data = await portafolioAPI.buscar(q.trim());
      setResults(data.resultados || []);
      setHasSearched(true);
    } catch {
      setResults([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(query);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, doSearch]);

  const goToPortfolio = (user) => {
    const n = (user.nombre || "").trim().toLowerCase().replace(/\s+/g, "-");
    const a = (user.apellido || "").trim().toLowerCase().replace(/\s+/g, "-");
    const namePart = [n, a].filter(Boolean).join("-");
    const slug = namePart ? `${namePart}-${user.id_usuario}` : user.id_usuario;
    navigate(`/portafolio/${slug}`);
  };

  return (
    <section
      id="search-section"
      style={{
        padding: "60px 48px 80px",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: "center", marginBottom: 40 }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: isDark
              ? "rgba(59,130,246,0.12)"
              : "rgba(59,130,246,0.08)",
            borderRadius: 20,
            padding: "6px 16px",
            marginBottom: 16,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              background: "#3B82F6",
              borderRadius: "50%",
              display: "inline-block",
            }}
          />
          <span style={{ color: "#3B82F6", fontSize: 13, fontWeight: 600 }}>
            Explorar Talento
          </span>
        </div>
        <h2
          style={{
            color: text,
            fontWeight: 800,
            fontSize: "clamp(28px, 4vw, 40px)",
            lineHeight: 1.1,
            margin: "0 0 12px",
          }}
        >
          Descubre Portafolios{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #3B82F6, #6366F1, #8B5CF6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Profesionales
          </span>
        </h2>
        <p
          style={{
            color: sub,
            fontSize: 15,
            maxWidth: 520,
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          Busca por nombre, profesión o habilidades y conecta con
          profesionales de la plataforma.
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.15 }}
        style={{
          maxWidth: 640,
          margin: "0 auto 36px",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: isDark ? "rgba(15,23,42,0.85)" : "#fff",
            border: `2px solid ${focused ? "#3B82F6" : border}`,
            borderRadius: 16,
            padding: "4px 6px 4px 20px",
            transition: "border-color 0.25s, box-shadow 0.25s",
            boxShadow: focused
              ? "0 0 0 4px rgba(59,130,246,0.15), 0 8px 30px rgba(59,130,246,0.1)"
              : isDark
              ? "0 4px 20px rgba(0,0,0,0.3)"
              : "0 4px 20px rgba(0,0,0,0.06)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Search Icon */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={focused ? "#3B82F6" : sub}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0, transition: "stroke 0.25s" }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            ref={inputRef}
            id="search-portfolios-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Buscar por nombre, profesión o habilidad..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              color: text,
              fontSize: 15,
              fontWeight: 500,
              padding: "14px 0",
              fontFamily: "inherit",
            }}
          />

          {/* Loading spinner or clear button */}
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              style={{
                width: 20,
                height: 20,
                border: "2.5px solid",
                borderColor: "#3B82F6 transparent #3B82F6 transparent",
                borderRadius: "50%",
                marginRight: 12,
                flexShrink: 0,
              }}
            />
          ) : query.length > 0 ? (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
                setHasSearched(false);
                inputRef.current?.focus();
              }}
              style={{
                background: isDark ? "#1D283A" : "#F1F5F9",
                border: "none",
                borderRadius: 8,
                padding: "6px 8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                marginRight: 6,
                flexShrink: 0,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke={sub}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ) : null}

          <button
            onClick={() => doSearch(query)}
            style={{
              background:
                "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "12px 22px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
              transition: "transform 0.15s, box-shadow 0.15s",
              boxShadow: "0 2px 12px rgba(59,130,246,0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow =
                "0 4px 16px rgba(59,130,246,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 2px 12px rgba(59,130,246,0.3)";
            }}
          >
            Buscar
          </button>
        </div>

        {/* Quick suggestion pills */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 14,
            justifyContent: "center",
          }}
        >
          {["Desarrollador", "Diseñador", "React", "Python", "Marketing"].map(
            (tag) => (
              <button
                key={tag}
                onClick={() => {
                  setQuery(tag);
                  inputRef.current?.focus();
                }}
                style={{
                  background: isDark
                    ? "rgba(29,40,58,0.6)"
                    : "rgba(226,232,240,0.6)",
                  color: sub,
                  border: `1px solid ${isDark ? "#1E293B" : "#E2E8F0"}`,
                  borderRadius: 20,
                  padding: "5px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#3B82F6";
                  e.currentTarget.style.color = "#3B82F6";
                  e.currentTarget.style.background = isDark
                    ? "rgba(59,130,246,0.1)"
                    : "rgba(59,130,246,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isDark
                    ? "#1E293B"
                    : "#E2E8F0";
                  e.currentTarget.style.color = sub;
                  e.currentTarget.style.background = isDark
                    ? "rgba(29,40,58,0.6)"
                    : "rgba(226,232,240,0.6)";
                }}
              >
                {tag}
              </button>
            )
          )}
        </div>
      </motion.div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {hasSearched && !loading && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {/* Results count */}
            <div
              style={{
                textAlign: "center",
                marginBottom: 24,
                color: sub,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {results.length > 0 ? (
                <span>
                  Se encontraron{" "}
                  <span style={{ color: "#3B82F6" }}>{results.length}</span>{" "}
                  portafolio{results.length !== 1 ? "s" : ""}
                </span>
              ) : (
                <span>
                  No se encontraron resultados para{" "}
                  <span style={{ color: text, fontWeight: 700 }}>
                    "{query}"
                  </span>
                </span>
              )}
            </div>

            {/* Portfolio Cards Grid */}
            {results.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: 20,
                }}
              >
                {results.map((user, i) => (
                  <motion.div
                    key={user.id_usuario}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.35 }}
                    whileHover={{ y: -6, scale: 1.015 }}
                    onClick={() => goToPortfolio(user)}
                    style={{
                      background: cardBg,
                      border: `1px solid ${border}`,
                      borderRadius: 18,
                      padding: "24px 22px 20px",
                      cursor: "pointer",
                      backdropFilter: "blur(12px)",
                      transition: "box-shadow 0.3s, border-color 0.3s",
                      boxShadow: isDark
                        ? "0 4px 20px rgba(0,0,0,0.3)"
                        : "0 4px 20px rgba(0,0,0,0.05)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)";
                      e.currentTarget.style.boxShadow = isDark
                        ? "0 8px 30px rgba(59,130,246,0.15)"
                        : "0 8px 30px rgba(59,130,246,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = border;
                      e.currentTarget.style.boxShadow = isDark
                        ? "0 4px 20px rgba(0,0,0,0.3)"
                        : "0 4px 20px rgba(0,0,0,0.05)";
                    }}
                  >
                    {/* Gradient accent line top */}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        background:
                          "linear-gradient(90deg, #3B82F6, #6366F1, #8B5CF6)",
                        borderRadius: "18px 18px 0 0",
                        opacity: 0,
                        transition: "opacity 0.3s",
                      }}
                      className="card-accent"
                    />

                    {/* User info row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        marginBottom: 14,
                      }}
                    >
                      {user.foto_url ? (
                        <img
                          src={`http://localhost:8000${user.foto_url}`}
                          alt={`${user.nombre} ${user.apellido}`}
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: `3px solid ${
                              isDark ? "#1D283A" : "#E2E8F0"
                            }`,
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <DefaultAvatar
                          size={52}
                          style={{
                            border: `3px solid ${
                              isDark ? "#1D283A" : "#E2E8F0"
                            }`,
                          }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <h3
                            style={{
                              color: text,
                              fontWeight: 700,
                              fontSize: 16,
                              margin: 0,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {user.nombre} {user.apellido}
                          </h3>
                          <VerificationBadge
                            ciEstado={user.ci_estado}
                            size={16}
                          />
                        </div>
                        {(user.titulo_profesional || user.profesion) && (
                          <p
                            style={{
                              margin: "3px 0 0",
                              color: "#3B82F6",
                              fontSize: 13,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {user.titulo_profesional || user.profesion}
                          </p>
                        )}
                      </div>

                      {/* Arrow icon */}
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={sub}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          flexShrink: 0,
                          opacity: 0.5,
                          transition: "opacity 0.2s, transform 0.2s",
                        }}
                      >
                        <line x1="7" y1="17" x2="17" y2="7" />
                        <polyline points="7 7 17 7 17 17" />
                      </svg>
                    </div>

                    {/* Bio preview */}
                    {user.biografia && (
                      <p
                        style={{
                          color: sub,
                          fontSize: 13,
                          lineHeight: 1.55,
                          margin: "0 0 14px",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {user.biografia}
                      </p>
                    )}

                    {/* Skills badges */}
                    {user.habilidades && user.habilidades.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 6,
                        }}
                      >
                        {user.habilidades.map((h, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "3px 10px",
                              borderRadius: 12,
                              background:
                                h.tipo === "tecnica"
                                  ? isDark
                                    ? "rgba(59,130,246,0.12)"
                                    : "rgba(59,130,246,0.08)"
                                  : isDark
                                  ? "rgba(168,85,247,0.12)"
                                  : "rgba(168,85,247,0.08)",
                              color:
                                h.tipo === "tecnica"
                                  ? "#3B82F6"
                                  : "#a855f7",
                              border: `1px solid ${
                                h.tipo === "tecnica"
                                  ? "rgba(59,130,246,0.2)"
                                  : "rgba(168,85,247,0.2)"
                              }`,
                            }}
                          >
                            {h.nombre}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {results.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  background: cardBg,
                  borderRadius: 18,
                  border: `1px solid ${border}`,
                  maxWidth: 440,
                  margin: "0 auto",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                <p
                  style={{
                    color: text,
                    fontWeight: 700,
                    fontSize: 16,
                    margin: "0 0 6px",
                  }}
                >
                  Sin resultados
                </p>
                <p style={{ color: sub, fontSize: 13, margin: 0 }}>
                  Intenta con otro nombre, profesión o habilidad.
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover effect styles for card accent */}
      <style>{`
        .card-accent {
          opacity: 0 !important;
          transition: opacity 0.3s !important;
        }
        div:hover > .card-accent {
          opacity: 1 !important;
        }
      `}</style>
    </section>
  );
}
