import { useState, useCallback } from "react";
import {
  obtenerHorariosAsistenciasyReservas,
  obtenerDetallesUsuarioReserva,
  registrarAsistencia,
  obtenerHorariosAsistenciasyReservasPorFecha
} from "../service/AsistenciaReservasService";

const useAsistenciasReservas = () => {

  const [horarios, setHorarios] = useState([]);
  const [detallesUsuario, setDetallesUsuario] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Obtener horarios por área
  const fetchHorarios = useCallback(async (idArea) => {
    setLoading(true);
    setError(null);
    try {
      const data = await obtenerHorariosAsistenciasyReservas(idArea);
      setHorarios(data);
    } catch (err) {
      setError(err);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);


  const fetchHorariosPorFecha = useCallback(async (fecha_referencia, idArea) => {
    setLoading(true);
    setError(null);
    try {
      const data = await obtenerHorariosAsistenciasyReservasPorFecha(fecha_referencia, idArea);
      setHorarios(data);
      return data;
    } catch (err) {
      setError(err);
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);


  //  Obtener detalles de usuario por reserva
  const fetchDetallesUsuario = useCallback(async (idReserva) => {
    setLoading(true);
    setError(null);
    try {
      const data = await obtenerDetallesUsuarioReserva(idReserva);
      setDetallesUsuario(data);
    } catch (err) {
      setError(err);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔹 Registrar asistencia
  const handleRegistrarAsistencia = useCallback(async (idReserva) => {
  setLoading(true);
  setError(null);
  try {
    const response = await registrarAsistencia(idReserva);
    // ✅ Devolver la respuesta completa para que el componente la use
    return response;
  } catch (err) {
    setError(err);
    console.error(err);
    throw err;
  } finally {
    setLoading(false);
  }
}, []);

  return {
    horarios,
    detallesUsuario,
    loading,
    error,
    fetchHorarios,
    fetchHorariosPorFecha,
    fetchDetallesUsuario,
    handleRegistrarAsistencia
  };
};

export default useAsistenciasReservas;