import axios from "axios";

// En desarrollo, Vite proxy redirige /api → http://127.0.0.1:8000/api
// Esto elimina los preflight CORS (OPTIONS) y reduce la latencia a la mitad.
const stripTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");
const API_BASE = stripTrailingSlash(import.meta.env.VITE_API_BASE_URL || "/api");

// URL base del servidor para recursos estáticos (imágenes, archivos).
// En producción el frontend y backend están en el mismo dominio,
// por lo que se usa una cadena vacía ("") para que las rutas sean relativas.
const resolveApiHost = () => {
  if (import.meta.env.VITE_API_HOST !== undefined) {
    return stripTrailingSlash(import.meta.env.VITE_API_HOST);
  }

  try {
    return new URL(API_BASE).origin;
  } catch {
    return "";
  }
};

export const API_HOST = resolveApiHost();
/**
 * Resuelve la URL completa de un recurso multimedia.
 * Prioridad: blob > http absoluto > /api/media > /storage > relativa
 * @param {string|null} url - Ruta relativa o absoluta del recurso
 * @returns {string|null}
 */
export const resolveMediaUrl = (url) => {
  if (!url) return null;
  const value = String(url);
  if (value.startsWith("blob:") || value.startsWith("http")) return value;
  if (value.startsWith("/api/media")) return `${API_HOST}${value}`;
  if (value.startsWith("/storage/")) return `${API_HOST}${value}`;
  if (value.startsWith("/")) return `${API_HOST}${value}`;
  return `${API_HOST}/api/media/${value}`;
};

const api = axios.create({
  baseURL: API_BASE,
  headers: { Accept: "application/json" },
});
/**
 * Extrae un mensaje legible del error de Axios.
 * @param {import('axios').AxiosError} err - Error capturado
 * @param {string} fallback - Mensaje por defecto si no se puede interpretar
 * @returns {string}
 */
export const getApiErrorMessage = (err, fallback = "Error de conexión con el servidor") => {
  if (err.code === "ECONNABORTED") return "El servidor tardó demasiado en responder";
  if (!err.response) return fallback;

  const { status, data } = err.response;
  if (data?.mensaje) return data.mensaje;
  if (data?.message) return data.message;
  if (status === 401) return "Tu sesión expiró. Inicia sesión nuevamente";
  if (status === 403) return "No tienes permisos para realizar esta acción";
  if (status === 429) return "Demasiadas solicitudes. Espera unos segundos y vuelve a intentar";
  if (status === 404) return "No se encontró la ruta del servidor";
  if (status === 405) return "El servidor no acepta este método HTTP";
  if (status >= 500) return "Error interno del servidor. Revisa los logs de Laravel";
  return fallback;
};

// ── Request interceptor: attach Bearer token ──
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 globally ──
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const requestUrl = err.config?.url || "";
      const isLogoutRequest = requestUrl.includes("/auth/logout");
      if (window.__authLogoutInProgress || isLogoutRequest || !localStorage.getItem("auth_token")) {
        return Promise.reject(err);
      }

      const path = window.location.pathname;
      const isPublicPath = ["/", "/registro", "/login", "/auth/callback"].includes(path) || path.startsWith("/portafolio/");

      // En portafolios públicos no se debe expulsar al visitante al login.
      if (!isPublicPath) {
        localStorage.removeItem("auth_token");
        window.location.href = "/";
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ────────────────────────────────────────────────────────
//  Auth endpoints
// ────────────────────────────────────────────────────────
export const authAPI = {
  registro: (data) => api.post("/auth/registro", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  githubRedirect: async () => {
    try {
      const { data } = await api.get("/auth/github");
      if (data.ok && data.url) {
        window.location.href = data.url;
      }
    } catch {
      window.location.href = `${API_BASE}/auth/github`;
    }
  },
};

// ────────────────────────────────────────────────────────
//  Usuario / Perfil endpoints
// ────────────────────────────────────────────────────────
export const perfilAPI = {
  obtener: () => api.get("/usuario/perfil"),
  actualizar: (data) => api.post("/usuario/perfil", data),
  subirFoto: (file) => {
    const fd = new FormData();
    fd.append("foto", file);
    return api.post("/usuario/foto", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  subirCI: (file) => {
    const fd = new FormData();
    fd.append("ci", file);
    return api.post("/usuario/ci", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ────────────────────────────────────────────────────────
//  Habilidades endpoints
// ────────────────────────────────────────────────────────
export const habilidadAPI = {
  catalogo: () => api.get("/habilidades/catalogo"),
  listar: () => api.get("/habilidades"),
  agregar: (id_habilidad, nivel) =>
    api.post("/habilidades", { id_habilidad, nivel }),
  agregarPersonalizada: (nombre, tipo, nivel) =>
    api.post("/habilidades/personalizada", { nombre, tipo, nivel }),
  editarNivel: (idHabilidad, nivel) =>
    api.put(`/habilidades/${idHabilidad}/nivel`, { nivel }),
  eliminar: (idHabilidad) => api.delete(`/habilidades/${idHabilidad}`),
  sincronizar: (tipo, habilidades) =>
    api.put("/habilidades/sincronizar", { tipo, habilidades }),
};

// ────────────────────────────────────────────────────────
//  Proyectos endpoints
// ────────────────────────────────────────────────────────
export const proyectoAPI = {
  listar: () => api.get("/proyectos"),
  crear: (data) => api.post("/proyectos", data),
  obtener: (id) => api.get(`/proyectos/${id}`),
  actualizar: (id, data) => api.put(`/proyectos/${id}`, data),
  eliminar: (id) => api.delete(`/proyectos/${id}`),
  agregarImagen: (idProyecto, file) => {
    const fd = new FormData();
    fd.append("imagen", file);
    return api.post(`/proyectos/${idProyecto}/imagenes`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  eliminarImagen: (idProyecto, idImagen) =>
    api.delete(`/proyectos/${idProyecto}/imagenes/${idImagen}`),
  sincronizarHabilidades: (idProyecto, ids_habilidades) =>
    api.put(`/proyectos/${idProyecto}/habilidades`, { ids_habilidades }),
  toggleVisibilidad: (idProyecto, visible_portafolio) =>
    api.put(`/proyectos/${idProyecto}/visibilidad`, { visible_portafolio }),
  toggleVisibilidadMultiple: (proyectos) =>
    api.put("/proyectos/visibilidad-multiple", { proyectos }),
};

// ────────────────────────────────────────────────────────
//  Experiencias endpoints
// ────────────────────────────────────────────────────────
export const experienciaAPI = {
  listar: () => api.get("/experiencias"),
  crear: (data) => api.post("/experiencias", data),
  actualizar: (id, data) => api.put(`/experiencias/${id}`, data),
  eliminar: (id) => api.delete(`/experiencias/${id}`),
};

// ────────────────────────────────────────────────────────
//  Portafolio y Admin endpoints
// ────────────────────────────────────────────────────────
export const portafolioAPI = {
  obtenerPublico: async (id) => {
    const res = await api.get(`/portafolio/${id}`);
    return res.data;
  },
  buscar: async (q) => {
    const res = await api.get('/portafolios/buscar', { params: { q } });
    return res.data;
  },
};
// Helper reutilizable para construir parámetros de bitácora
/**
 * Construye los parámetros de URL para los endpoints de bitácora.
 * @param {Object} filtros - Filtros opcionales de fecha, acción, usuario, perfil, actividad y paginación.
 * @returns {URLSearchParams}
 */
const buildBitacoraParams = (filtros = {}) => {
  const params = new URLSearchParams();
  if (filtros.fecha_desde) params.set("fecha_desde", filtros.fecha_desde);
  if (filtros.fecha_hasta) params.set("fecha_hasta", filtros.fecha_hasta);
  if (filtros.accion)      params.set("accion", filtros.accion);
  if (filtros.id_usuario)  params.set("id_usuario", filtros.id_usuario);
  if (filtros.search_user) params.set("search_user", filtros.search_user);
  if (filtros.profile_status) params.set("profile_status", filtros.profile_status);
  if (filtros.activity_status) params.set("activity_status", filtros.activity_status);
  if (filtros.page)        params.set("page", filtros.page);
  if (filtros.per_page)    params.set("per_page", filtros.per_page);
  return params;
};
export const adminAPI = {
  getPendingCI: async () => {
    const res = await api.get('/admin/ci-pending');
    return res.data;
  },
  verifyCI: async (id, action) => {
    const res = await api.put(`/admin/ci-verify/${id}`, { action });
    return res.data;
  },
  getEstadisticas: async () => {
    const res = await api.get('/admin/estadisticas');
    return res.data;
  },
  getBitacoras: async (tabla, filtros = {}) => {
    const res = await api.get(`/admin/bitacoras/${tabla}?${buildBitacoraParams(filtros)}`);
    return res.data;
  },
  exportBitacora: async (tabla, filtros = {}) => {
    const res = await api.get(`/admin/bitacoras/${tabla}/export?${buildBitacoraParams(filtros)}`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bitacora_${tabla}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

