import { useState, useCallback } from "react";
import {
  asistenciaPorZonaAlDia,
  asistenciaPorHoraAlDia,
  asistenciaPorZonaPorMes,
  asistenciaPorHoraPorMes,
  asistenciaPorZonaRangoFechas,
  asistenciaPorHoraRangoFechas,
  obtenerEstadisticasMensuales,
  reservasAsistioPorZona,
  reservasAsistioPorHora
} from "../service/DashboardService";

export const useDashboard = () => {
  const [dataZona, setDataZona] = useState([]);
  const [dataHora, setDataHora] = useState([]);
  const [dataZonaMes, setDataZonaMes] = useState([]);
  const [dataHoraMes, setDataHoraMes] = useState([]);
  const [dataZonaRango, setDataZonaRango] = useState([]);
  const [dataHoraRango, setDataHoraRango] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);

  const [dataReservasZona, setDataReservasZona] = useState([]);
  const [dataReservasHora, setDataReservasHora] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Día
  const fetchAsistenciaZona = useCallback(async (fecha) => {
    setLoading(true);
    setError(null);
    try {
      const response = await asistenciaPorZonaAlDia(fecha);
      setDataZona(response);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAsistenciaHora = useCallback(async (fecha) => {
    setLoading(true);
    setError(null);
    try {
      const response = await asistenciaPorHoraAlDia(fecha);
      setDataHora(response);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mes
  const fetchZonaMes = useCallback(async (fecha) => {
    setLoading(true);
    setError(null);
    try {
      const response = await asistenciaPorZonaPorMes(fecha);
      setDataZonaMes(response);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHoraMes = useCallback(async (fecha) => {
    setLoading(true);
    setError(null);
    try {
      const response = await asistenciaPorHoraPorMes(fecha);
      setDataHoraMes(response);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Rango
  const fetchZonaRango = useCallback(async (inicio, fin) => {
    setLoading(true);
    setError(null);
    try {
      const response = await asistenciaPorZonaRangoFechas(inicio, fin);
      setDataZonaRango(response);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHoraRango = useCallback(async (inicio, fin) => {
    setLoading(true);
    setError(null);
    try {
      const response = await asistenciaPorHoraRangoFechas(inicio, fin);
      setDataHoraRango(response);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Estadísticas
  const fetchEstadisticas = useCallback(async (fecha) => {
    setLoading(true);
    setError(null);
    try {
      const response = await obtenerEstadisticasMensuales(fecha);
      setEstadisticas(response);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);


  const fetchReservasZona = useCallback(async (fecha, esMensual = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await reservasAsistioPorZona(fecha, esMensual);
      setDataReservasZona(response);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReservasHora = useCallback(async (fecha, esMensual = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await reservasAsistioPorHora(fecha, esMensual);
      setDataReservasHora(response);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  //  Dashboard general (día)
  const fetchDashboard = useCallback(async (fecha) => {
    setLoading(true);
    setError(null);
    try {
      const [zona, hora] = await Promise.all([
        asistenciaPorZonaAlDia(fecha),
        asistenciaPorHoraAlDia(fecha)
      ]);

      setDataZona(zona);
      setDataHora(hora);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // estados
    dataZona,
    dataHora,
    dataZonaMes,
    dataHoraMes,
    dataZonaRango,
    dataHoraRango,
    estadisticas,
    dataReservasZona,
    dataReservasHora,
    loading,
    error,

    // día
    fetchAsistenciaZona,
    fetchAsistenciaHora,
    fetchDashboard,

    // mes
    fetchZonaMes,
    fetchHoraMes,

    // rango
    fetchZonaRango,
    fetchHoraRango,

    // estadísticas
    fetchEstadisticas,

    //  reservas
    fetchReservasZona,
    fetchReservasHora
  };
};