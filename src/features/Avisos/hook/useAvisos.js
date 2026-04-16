import { useState, useCallback } from "react";
import {
  listadoNoticia,
  crearNoticia,
  detalleNoticia,
  modificarNoticia,
  eliminarNoticia,
  buscarNoticiaPorFecha
} from "../service/AvisosService"; 
const useNoticia = () => {
  const [noticias, setNoticias] = useState([]);
  const [noticiaDetalle, setNoticiaDetalle] = useState(null);
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
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear noticia
  const agregarNoticia = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const nueva = await crearNoticia(data);
      setNoticias((prev) => [...prev, nueva]);
      return nueva;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener detalle
  const obtenerDetalleNoticia = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await detalleNoticia(id);
      setNoticiaDetalle(data);
      return data;
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Modificar noticia
  const actualizarNoticia = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const actualizada = await modificarNoticia(data);

      setNoticias((prev) =>
        prev.map((n) =>
          n.idNoticia === actualizada.idNoticia ? actualizada : n
        )
      );

      return actualizada;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Eliminar noticia
  const borrarNoticia = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      await eliminarNoticia(data);

      setNoticias((prev) =>
        prev.filter((n) => n.idNoticia !== data.idNoticia)
      );
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar por fecha
  const buscarPorFecha = useCallback(async (fecha) => {
    setLoading(true);
    setError(null);
    try {
      const data = await buscarNoticiaPorFecha(fecha);
      setNoticias(data);
      return data;
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    noticias,
    noticiaDetalle,
    loading,
    error,
    obtenerNoticias,
    agregarNoticia,
    obtenerDetalleNoticia,
    actualizarNoticia,
    borrarNoticia,
    buscarPorFecha
  };
};

export default useNoticia;