import axios from "axios";

// En desarrollo, Vite proxy redirige /api → http://127.0.0.1:8000/api
// Esto elimina los preflight CORS (OPTIONS) y reduce la latencia a la mitad.
const API_BASE = "/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { Accept: "application/json" },
});

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
      localStorage.removeItem("auth_token");
      const path = window.location.pathname;
      if (!["/", "/registro", "/login", "/auth/callback"].includes(path)) {
        window.location.href = "/login";
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
  actualizar: (data) => api.put("/usuario/perfil", data),
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
