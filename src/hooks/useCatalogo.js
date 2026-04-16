import { useState, useCallback } from "react";
import { licenciatura, nivel } from "../features/usuario/service/UsuarioService";

// Cache global para persitir entre renders y componentes
const globalCatalogCache = {
  niveles: null,
  licenciaturas: null
};

export const useCatalogos = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const obtenerLicenciaturas = useCallback(async () => {
    try {
      if (globalCatalogCache.licenciaturas) {
        return globalCatalogCache.licenciaturas;
      }
      
      setLoading(true);
      setError(null);
      const data = await licenciatura();
      
      const licenciaturasMapeadas = data.map(lic => ({
        id: lic.idLicenciatura,
        nombre: lic.nombreLic,
        nivelId: lic.nivel
      }));
      
      globalCatalogCache.licenciaturas = licenciaturasMapeadas;
      
      return licenciaturasMapeadas;
    } catch (err) {
      console.error("Error obteniendo licenciaturas:", err);
      setError(err.response?.data?.detail || "Error al cargar licenciaturas");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const obtenerNiveles = useCallback(async () => {
    try {
      if (globalCatalogCache.niveles) {
        return globalCatalogCache.niveles;
      }
      
      setLoading(true);
      setError(null);
      const data = await nivel();
      
      // Mapear al formato que espera el componente { id, nombre }
      const nivelesMapeados = data.map(nivel => ({
        id: nivel.idNivel,
        nombre: nivel.nombreNivel
      }));
      
      // Guardar en cache global
      globalCatalogCache.niveles = nivelesMapeados;
      
      return nivelesMapeados;
    } catch (err) {
      console.error("Error obteniendo niveles:", err);
      setError(err.response?.data?.detail || "Error al cargar niveles");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    obtenerLicenciaturas,
    obtenerNiveles,
    loading,
    error
  };
};