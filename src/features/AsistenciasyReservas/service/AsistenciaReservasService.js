import apiClient from "../../../service/apiClient";

// 1. Obtener horarios (usa idArea, no idReserva)
export const obtenerHorariosAsistenciasyReservas = async (idArea) => {
  try {
    const response = await apiClient.get(
      "/api/asistenciasyreservas/AsistenciasyReservas",
      {
        params: { idArea }
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error al obtener horarios:", error);
    throw error;
  }
};

export const obtenerHorariosAsistenciasyReservasPorFecha = async (fecha_referencia, idArea) => {
  try {
    // Formatear la fecha a YYYY-MM-DD si es un objeto Date
    let fechaFormateada = fecha_referencia;
    if (fecha_referencia instanceof Date) {
      fechaFormateada = fecha_referencia.toISOString().split('T')[0];
    }
    
    const response = await apiClient.get(
      "/api/asistenciasyreservas/AsistenciasyReservasPorFecha",
      {
        params: { 
          fecha_referencia: fechaFormateada,
          idArea: idArea 
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error al obtener horarios por fecha:", error);
    throw error;
  }
};


// 2. Obtener detalles de usuario por reserva
export const obtenerDetallesUsuarioReserva = async (idReserva) => {
  try {
    const response = await apiClient.get(
      "/api/asistenciasyreservas/detallesusuarioReserva",
      {
        params: { idReserva }
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error al obtener detalles del usuario:", error);
    throw error;
  }
};


// 3. Registrar asistencia
export const registrarAsistencia = async (idReserva) => {
  try {
    const response = await apiClient.patch(
      "/api/asistenciasyreservas/asistencia",
      null,
      {
        params: { idReserva }
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error al registrar asistencia:", error);
    throw error;
  }
};