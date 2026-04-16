import { useState, useCallback } from "react";
import {
  listadoNoticia,
  detalleNoticia
} from "../Service/avisosUsuariosService";

const useAvisosUsuarios = () => {
  const [noticias, setNoticias] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Obtener todas las noticias
  const obtenerNoticias = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listadoNoticia();
      setNoticias(data);
    } catch (err) {
      setError(err);
      console.error("Error al obtener noticias:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener detalle de una noticia
  const obtenerDetalleNoticia = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await detalleNoticia(id);
      setDetalle(data);
    } catch (err) {
      setError(err);
      console.error("Error al obtener detalle:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    noticias,
    detalle,
    loading,
    error,
    obtenerNoticias,
    obtenerDetalleNoticia
  };
};

export default useAvisosUsuarios;