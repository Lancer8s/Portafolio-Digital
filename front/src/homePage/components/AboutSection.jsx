import { motion } from "framer-motion";

export default function AboutSection({ isDark }) {
  const text = isDark ? "#fff" : "#111";
  const sub = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#1D283A" : "#E2E8F0";
  const cardBg = isDark ? "rgba(15,23,42,0.72)" : "#ffffff";

  return (
    <section
      id="sobre-nosotros"
      className="home-about-section"
      style={{
        padding: "64px 48px 36px",
        borderTop: `1px solid ${border}`,
        background: isDark
          ? "linear-gradient(180deg, #020617 0%, #0F172A 100%)"
          : "#ffffff",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35 }}
          style={{ textAlign: "center", marginBottom: 32 }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.08)",
              borderRadius: 20,
              padding: "6px 16px",
              marginBottom: 16,
            }}
          >
            <span style={{ width: 8, height: 8, background: "#3B82F6", borderRadius: "50%" }} />
            <span style={{ color: "#3B82F6", fontSize: 13, fontWeight: 700 }}>
              Sobre Nosotros
            </span>
          </div>
          <h2 style={{ color: text, fontSize: "clamp(26px, 4vw, 38px)", margin: 0, fontWeight: 850 }}>
            Plataforma para crear y compartir portafolios digitales
          </h2>
          <p style={{ color: sub, maxWidth: 720, margin: "14px auto 0", lineHeight: 1.7, fontSize: 15 }}>
            PortaGen ayuda a estudiantes y profesionales a organizar su perfil, habilidades,
            experiencia y proyectos en una presentación clara, moderna y fácil de compartir.
          </p>
        </motion.div>

        <div
          className="home-about-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 18,
            marginBottom: 34,
          }}
        >
          {[
            { title: "Resumen del sistema", desc: "Permite crear un portafolio público, registrar habilidades, añadir proyectos con imágenes y compartir el perfil mediante una URL." },
            {
              title: "Contacto",
              desc: "Razón social: AID-SOFT.SRL · E-mail: aidSoft.dev@gmail.com · Representante legal: Erick Samuel Peñaloza Lujan · Teléfono: (+591) 60794951 · Cochabamba - Bolivia",
            },
            { title: "Objetivo", desc: "Facilitar que cada usuario muestre su trabajo de forma profesional sin depender de herramientas complejas." },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                background: cardBg,
                border: `1px solid ${border}`,
                borderRadius: 14,
                padding: "22px 20px",
                boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
              <h3 style={{ color: text, margin: "0 0 8px", fontSize: 16, fontWeight: 800 }}>
                {item.title}
              </h3>
              <p style={{ color: sub, margin: 0, fontSize: 13.5, lineHeight: 1.65 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <footer
          style={{
            borderTop: `1px solid ${border}`,
            paddingTop: 20,
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            color: sub,
            fontSize: 13,
          }}
        >
          <span>© {new Date().getFullYear()} PortaGen. Todos los derechos reservados.</span>
          <span>Sistema de portafolios profesionales</span>
        </footer>
      </div>
    </section>
  );
}
