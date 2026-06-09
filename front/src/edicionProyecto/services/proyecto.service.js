export const validateProyecto = ({ titulo = "", descripcion = "", imagenes = [], link }, options = {}) => {
  const errors = {};
  const requireImages = options.requireImages ?? true;
  const imageCount = Array.isArray(imagenes) ? imagenes.filter(Boolean).length : 0;

  if (!String(titulo).trim())
    errors.titulo = "El título es requerido";

  if (!String(descripcion).trim())
    errors.descripcion = "La descripción es requerida";

  if (requireImages && imageCount < 3)
    errors.imagenes = "Mínimo 3 imágenes requeridas";

  if (imageCount > 6)
    errors.imagenes = "Solo se permiten hasta un máximo de 6 imágenes por proyecto";

  if (link && String(link).trim()) {
    const githubRegex = /^https:\/\/(www\.)?github\.com\/[^/]+\/[^/]+/;
    if (!githubRegex.test(String(link).trim()))
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
