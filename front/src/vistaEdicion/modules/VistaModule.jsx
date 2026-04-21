
import SkillsEditor from "../components/SkillsEditor";

export default function VistaModule({ userData, isDark, onGoToHabilidad, onGoToProyecto, onBack, onEditDatos, onEditProyecto, onVerProyecto }) {
  return (
    <SkillsEditor
      userData={userData}
      isDark={isDark}
      onGoToHabilidad={onGoToHabilidad}
      onGoToProyecto={onGoToProyecto}
      onBack={onBack}
      onEditDatos={onEditDatos}
      onEditProyecto={onEditProyecto}
      onVerProyecto={onVerProyecto}
    />
  );
}