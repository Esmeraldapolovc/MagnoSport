import apiClient from "../../../service/apiClient";

// Asistencia por zona al día
export const asistenciaPorZonaAlDia = async (fecha) => {
  try {
    const response = await apiClient.get("/api/dashboard/asistenciaPorZonaAlDIa", {
      params: { fecha }
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener asistencia por zona:", error);
    throw error;
  }
};

// Asistencia por hora al día
export const asistenciaPorHoraAlDia = async (fecha) => {
  try {
    const response = await apiClient.get("/api/dashboard/asistenciaPorHoraAlDIa", {
      params: { fecha }
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener asistencia por hora:", error);
    throw error;
  }
};

// Asistencia por zona por mes
export const asistenciaPorZonaPorMes = async (fecha) => {
  try {
    const response = await apiClient.get("/api/dashboard/asistenciaPorZonaPorMes", {
      params: { fecha }
    });
    return response.data;
  } catch (error) {
    console.error("Error asistencia zona por mes:", error);
    throw error;
  }
};

// Asistencia por hora por mes
export const asistenciaPorHoraPorMes = async (fecha) => {
  try {
    const response = await apiClient.get("/api/dashboard/asistenciaPorHoraPorMes", {
      params: { fecha }
    });
    return response.data;
  } catch (error) {
    console.error("Error asistencia hora por mes:", error);
    throw error;
  }
};

// Asistencia por zona en rango de fechas
export const asistenciaPorZonaRangoFechas = async (fecha_inicio, fecha_fin) => {
  try {
    const response = await apiClient.get("/api/dashboard/asistenciaPorZonaYRangoFechas", {
      params: { fecha_inicio, fecha_fin }
    });
    return response.data;
  } catch (error) {
    console.error("Error asistencia zona rango fechas:", error);
    throw error;
  }
};

// Asistencia por hora en rango de fechas
export const asistenciaPorHoraRangoFechas = async (fecha_inicio, fecha_fin) => {
  try {
    const response = await apiClient.get("/api/dashboard/asistenciaPorHoraYRangoFechas", {
      params: { fecha_inicio, fecha_fin }
    });
    return response.data;
  } catch (error) {
    console.error("Error asistencia hora rango fechas:", error);
    throw error;
  }
};

// Estadísticas mensuales
export const obtenerEstadisticasMensuales = async (fecha) => {
  try {
    const response = await apiClient.get("/api/dashboard/obtenerEstadisticasMensuales", {
      params: { fecha }
    });
    return response.data;
  } catch (error) {
    console.error("Error estadísticas mensuales:", error);
    throw error;
  }
};

// Reservas que asistieron por zona
export const reservasAsistioPorZona = async (fecha, es_mensual = false) => {
  try {
    const response = await apiClient.get("/api/dashboard/reservasAsistioPorZona", {
      params: { fecha, es_mensual }
    });
    return response.data;
  } catch (error) {
    console.error("Error reservas asistió por zona:", error);
    throw error;
  }
};

// Reservas que asistieron por hora
export const reservasAsistioPorHora = async (fecha, es_mensual = false) => {
  try {
    const response = await apiClient.get("/api/dashboard/reservasAsistioPorHora", {
      params: { fecha, es_mensual }
    });
    return response.data;
  } catch (error) {
    console.error("Error reservas asistió por hora:", error);
    throw error;
  }
};