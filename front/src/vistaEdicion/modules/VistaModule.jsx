import SkillsEditor from "../components/SkillsEditor";
import UserHomeStats from "../components/UserHomeStats";

export default function VistaModule({ userData, isDark, activeSection, onGoToHabilidad, onGoToProyecto, onBack, onEditDatos, onEditProyecto, onVerProyecto }) {
  return (
    <SkillsEditor
      userData={userData}
      isDark={isDark}
      activeSection={activeSection || "inicio"}
      onGoToHabilidad={onGoToHabilidad}
      onGoToProyecto={onGoToProyecto}
      onBack={onBack}
      onEditDatos={onEditDatos}
      onEditProyecto={onEditProyecto}
      onVerProyecto={onVerProyecto}
    />
  );
}