export const validateRegisterForm = ({ nombre, apellido, correo, contrasena, confirmarContrasena }) => {
  const errors = {};
  if (!nombre.trim()) errors.nombre = "El nombre es requerido";
  if (!apellido.trim()) errors.apellido = "El apellido es requerido";
  if (!correo.trim() || !correo.includes("@")) errors.correo = "Correo inválido";
  if (contrasena.length < 8) errors.contrasena = "Mínimo 8 caracteres";
  if (contrasena !== confirmarContrasena) errors.confirmarContrasena = "Las contraseñas no coinciden";
  return errors;
};