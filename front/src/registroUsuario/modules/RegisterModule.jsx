import RegisterForm from "../components/RegisterForm";

export default function RegisterModule({ isDark, onSwitchToLogin }) {
  return <RegisterForm isDark={isDark} onSwitchToLogin={onSwitchToLogin} />;
}