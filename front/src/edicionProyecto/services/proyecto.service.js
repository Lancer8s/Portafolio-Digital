

export const validateProyecto = ({ titulo, descripcion, imagenes, link }) => {
  const errors = {};

  if (!titulo.trim())
    errors.titulo = "El título es requerido";

  if (!descripcion.trim())
    errors.descripcion = "La descripción es requerida";

  if (imagenes.filter(Boolean).length < 3)
    errors.imagenes = "Mínimo 3 imágenes requeridas";

  if (imagenes.filter(Boolean).length > 6)
    errors.imagenes = "Solo se permiten hasta un máximo de 6 imágenes por proyecto";

  if (link && link.trim()) {
    const githubRegex = /^https:\/\/(www\.)?github\.com\/[^/]+\/[^/]+/;
    if (!githubRegex.test(link.trim()))
      errors.link = "Ingrese un enlace válido de repositorio (GitHub)";
  }

  return errors;
};

export const validateImageFile = (file) => {
  if (!file) return null;
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (!allowed.includes(file.type))
    return "El archivo debe ser una imagen válida (JPG, PNG)";
  if (file.size > 2 * 1024 * 1024)
    return "La imagen no debe superar los 2 MB";
  return null;
};