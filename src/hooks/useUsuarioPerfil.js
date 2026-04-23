import { useState, useCallback } from "react";
import { usuario, alumno } from "../features/usuario/service/UsuarioService";

// Cache global para persitir entre renders y componentes
const globalUserCache = {};

export const useUsuarioPerfil = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const obtenerUsuarioPerfil = useCallback(async (idUsuario, rol) => {
    try {
      // Crear una clave única para el cache con idUsuario y rol
      const cacheKey = `${idUsuario}-${rol}`;
      
      // Si ya tenemos los datos en cache, devolverlos sin hacer petición
      if (globalUserCache[cacheKey]) {
        console.log(" USANDO CACHE para usuario:", cacheKey);
        return globalUserCache[cacheKey];
      }
      
      console.log("📡 HACIENDO PETICIÓN para usuario:", cacheKey);
      setLoading(true);
      setError(null);
      
      let data;
      if (rol != 2) {
        data = await usuario();
      } else {
        data = await alumno();
      }
      
      // Guardar en cache global
      globalUserCache[cacheKey] = data;
      console.log("💾 GUARDADO EN CACHE:", cacheKey);
      
      return data;
    } catch (err) {
      console.error("Error obteniendo usuario:", err);
      setError(err.response?.data?.detail || "Error al cargar usuario");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    obtenerUsuarioPerfil,
    loading,
    error
  };
};
