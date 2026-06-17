export const validateProyecto = ({ titulo = "", descripcion = "", imagenes = [], link }, options = {}) => {
  const errors = {};
  const imageCount = Array.isArray(imagenes) ? imagenes.filter(Boolean).length : 0;

  if (!String(titulo).trim()) {
    errors.titulo = "El título es requerido";
  } else if (String(titulo).length > 80) {
    errors.titulo = "El título no debe exceder los 80 caracteres";
  }

  if (!String(descripcion).trim()) {
    errors.descripcion = "La descripción es requerida";
  } else if (String(descripcion).length > 120) {
    errors.descripcion = "La descripción no debe exceder los 120 caracteres";
  }

  if (imageCount > 6)
    errors.imagenes = "Solo se permiten hasta un máximo de 6 imágenes por proyecto";

  if (link && String(link).trim()) {
    try {
      new URL(String(link).trim());
    } catch {
      errors.link = "Ingrese un enlace válido (ejemplo: https://...)";
    }
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
