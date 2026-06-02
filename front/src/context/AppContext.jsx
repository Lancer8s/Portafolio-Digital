import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { authAPI, perfilAPI, habilidadAPI, proyectoAPI } from "../api";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);            // datos auth básicos
  const [userData, setUserDataState] = useState({     // perfil completo
    techSkills: [],
    softSkills: [],
    proyectos: [],
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);       // cargando sesión inicial

  // Evita llamadas concurrentes, pero NO pierde un refresh solicitado durante otra carga.
  const refreshingRef = useRef(false);
  const queuedRefreshRef = useRef(false);
  const refreshTimerRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // ── Helper para actualizar userData parcialmente ──
  const setUserData = (updater) =>
    setUserDataState((s) =>
      typeof updater === "function" ? updater(s) : { ...s, ...updater }
    );

  // ── Login: guardar token y usuario ──
  const login = useCallback((token, usuario) => {
    localStorage.setItem("auth_token", token);
    setUser(usuario);
    userRef.current = usuario;
    setIsAuthenticated(true);
  }, []);

  // ── Logout: revocar token en el backend ──
  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      /* si falla (token ya inválido), igual limpiamos */
    }
    localStorage.removeItem("auth_token");
    setUser(null);
    userRef.current = null;
    setIsAuthenticated(false);
    setUserDataState({ techSkills: [], softSkills: [], proyectos: [] });
  }, []);

  // ── Restaurar sesión al montar ──
  const restoreSession = useCallback(async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setLoading(false);
      return false;
    }
    try {
      const { data } = await authAPI.me();
      if (data.ok) {
        setUser(data.usuario);
        userRef.current = data.usuario;
        setIsAuthenticated(true);
        setLoading(false);
        return true;
      }
    } catch {
      localStorage.removeItem("auth_token");
    }
    setLoading(false);
    return false;
  }, []);

  // ── Cargar datos completos del usuario (perfil + habilidades + proyectos) ──
  const refreshUserData = useCallback(async () => {
    if (!localStorage.getItem("auth_token")) return null;

    // Si ya existe un refresh en curso, dejamos uno en cola para que no se pierda.
    if (refreshingRef.current) {
      queuedRefreshRef.current = true;
      return null;
    }

    refreshingRef.current = true;

    try {
      const [perfilRes, habRes, proyRes] = await Promise.allSettled([
        perfilAPI.obtener(),
        habilidadAPI.listar(),
        proyectoAPI.listar(),
      ]);

      const perfilData =
        perfilRes.status === "fulfilled" && perfilRes.value.data?.ok
          ? perfilRes.value.data
          : {};
      const perfil = perfilData.perfil || perfilData.usuario || {};

      const habData =
        habRes.status === "fulfilled" && habRes.value.data?.ok
          ? habRes.value.data
          : {};
      const allHabs = habData.habilidades || [];

      const tecnicas =
        allHabs.length > 0
          ? allHabs.filter((h) => h.tipo === "tecnica")
          : habData.tecnicas || [];
      const blandas =
        allHabs.length > 0
          ? allHabs.filter((h) => h.tipo === "blanda")
          : habData.blandas || [];

      const techSkills = tecnicas.map((h) => ({
        id_habilidad: h.id_habilidad,
        nombre: h.nombre,
        nivel: h.nivel ?? 50,
      }));

      const softSkills = blandas.map((h) => ({
        id_habilidad: h.id_habilidad,
        nombre: h.nombre,
      }));

      const proyData =
        proyRes.status === "fulfilled" && proyRes.value.data?.ok
          ? proyRes.value.data
          : {};
      const proyectos = (proyData.proyectos || []).map((p) => ({
        id_proyecto: p.id_proyecto,
        titulo: p.titulo || p.nombre || "",
        descripcion: p.descripcion || "",
        link: p.link || p.url_repositorio || "",
        fecha: p.fecha_creacion || p.fecha || "",
        imagen_portada_url: p.imagen_portada_url || null,
        habilidades: p.habilidades || [],
        imagenes: p.imagenes || [],
        visible_portafolio: p.visible_portafolio ?? p.destacado ?? p.es_destacado ?? false,
      }));

      const currentUser = userRef.current;
      let nombre = perfil.nombre || "";
      let apellido = perfil.apellido || "";
      if (!nombre && currentUser) {
        nombre = currentUser.nombre || "";
        apellido = currentUser.apellido || "";
      }

      const nextData = {
        id_usuario: currentUser?.id_usuario || perfil.id_usuario,
        nombreCompleto: nombre,
        apellidoCompleto: apellido,
        telefono: perfil.telefono || "",
        email: perfil.email || currentUser?.email || "",
        titulo: perfil.profesion || perfil.titulo_profesional || "",
        biografia: perfil.biografia || "",
        nombre_modificado: perfil.nombre_modificado || false,
        redes_sociales: perfil.redes_sociales || [],
        linkedin_url: perfil.linkedin_url || "",
        github_url: perfil.github_url || "",
        visibilidad: perfil.visibilidad || "publico",
        ci_estado: perfil.ci_estado || null,
        roles: perfil.roles || currentUser?.roles || [],
        foto_url: perfil.foto_url || null,
        preview: perfil.foto_url || null,
        techSkills,
        softSkills,
        proyectos,
      };

      setUserDataState(nextData);
      return nextData;
    } catch (err) {
      console.error("Error cargando datos del usuario:", err);
      return null;
    } finally {
      refreshingRef.current = false;

      if (queuedRefreshRef.current) {
        queuedRefreshRef.current = false;
        setTimeout(() => {
          refreshUserData();
        }, 0);
      }
    }
  }, []);

  // ── Refresh debounced: colapsa múltiples llamadas en una sola ──
  const debouncedRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = setTimeout(() => {
      refreshUserData();
      refreshTimerRef.current = null;
    }, 200);
  }, [refreshUserData]);

  // Restaurar sesión al montar
  useEffect(() => {
    restoreSession().then((restored) => {
      if (restored) refreshUserData();
    });
  }, [restoreSession, refreshUserData]);

  const resetState = () => {
    localStorage.removeItem("auth_token");
    setUser(null);
    userRef.current = null;
    setIsAuthenticated(false);
    setUserDataState({ techSkills: [], softSkills: [], proyectos: [] });
  };

  return (
    <AppContext.Provider
      value={{
        user,
        userData,
        setUserData,
        isAuthenticated,
        loading,
        login,
        logout,
        restoreSession,
        refreshUserData,
        debouncedRefresh,
        resetState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
