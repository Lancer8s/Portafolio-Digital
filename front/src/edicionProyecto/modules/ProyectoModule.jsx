import ProyectoForm from "../components/ProyectoForm";

export default function ProyectoModule({ isDark, onBack, onSave, initialData }) {
  return <ProyectoForm isDark={isDark} onBack={onBack} onSave={onSave} initialData={initialData} />;
}