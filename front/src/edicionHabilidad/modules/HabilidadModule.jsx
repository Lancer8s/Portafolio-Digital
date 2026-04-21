

import SkillSelector from "../components/SkillSelector";

export default function HabilidadModule({ isDark, onBack, onSave, userData }) {
  return (
    <SkillSelector
      isDark={isDark}
      onBack={onBack}
      onSave={onSave}
      userData={userData}
    />
  );
}