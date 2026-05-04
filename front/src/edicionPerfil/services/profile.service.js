export const getInitials = (nombre = "", apellido = "") =>
  `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase() || "??";

export const validateProfileData = ({ titulo }) => {
  const errors = {};
  if (!titulo.trim()) errors.titulo = "El título/rol es obligatorio";
  return errors;
};

export const validateProfileImage = (file) => {
  if (!file) return null;
  const allowed = ["image/jpeg", "image/png", "image/jpg"];
  if (!allowed.includes(file.type))
    return "El archivo debe ser una imagen en formato JPG o PNG";
  if (file.size > 2 * 1024 * 1024)
    return "La imagen no debe superar los 2 MB";
  return null;
};