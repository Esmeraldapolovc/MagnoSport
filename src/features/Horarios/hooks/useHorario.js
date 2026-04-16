import { useState, useCallback } from 'react';
import { 
  listadoHorario, 
  crearHorario as crearHorarioService,
  crearExcepcion as crearExcepcionService,
  BuscarPorFecha as buscarPorFechaService
} from '../service/HorarioService';

export const useHorario = () => {

  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Obtener horarios
  const obtenerHorarios = useCallback(async () => {

    setLoading(true);
    setError(null);

    try {
      const data = await listadoHorario();
      setHorarios(data);
      return data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Error al obtener horarios';

      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }

  }, []);

  // Crear horario
  const crearHorario = useCallback(async (nuevoHorario) => {

    setLoading(true);
    setError(null);

    try {

      const response = await crearHorarioService(nuevoHorario);

      // 🔄 Opcional: recargar lista
      await obtenerHorarios();

      return response;

    } catch (err) {

      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Error al crear horario';

      setError(errorMessage);
      throw err;

    } finally {
      setLoading(false);
    }

  }, [obtenerHorarios]);


  const crearExcepcion = useCallback(async (data) => {

  setLoading(true);
  setError(null);

  try {

    const response = await crearExcepcionService(data);

    await obtenerHorarios();

    return response;

  } catch (err) {

    const errorMessage =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      'Error al crear excepción';

    setError(errorMessage);
    throw err;

  } finally {
    setLoading(false);
  }

}, [obtenerHorarios]);


const buscarPorFecha = useCallback(async (fecha) => {

  setLoading(true);
  setError(null);

  try {

    const data = await buscarPorFechaService(fecha);
    return data;

  } catch (err) {

    const errorMessage =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      'Error al buscar por fecha';

    setError(errorMessage);
    throw err;

  } finally {
    setLoading(false);
  }

}, []);

return {
  horarios,
  setHorarios, 
  loading,
  error,
  obtenerHorarios,
  crearHorario,
  crearExcepcion,
  buscarPorFecha
};
};