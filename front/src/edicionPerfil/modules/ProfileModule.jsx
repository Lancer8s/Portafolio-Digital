import ProfileForm from "../components/ProfileForm";

export default function ProfileModule({ onNext, isDark }) {
  return <ProfileForm onNext={onNext} isDark={isDark} />;
}