import apiClient from "../../../service/apiClient";



//Obtener horario
export const listadoHorario = async ()  => {
    const response = await apiClient.get("/api/horario/listadoHorario");
    return response.data;
}

// Crear horario
export const crearHorario = async (data) => {
  const response = await apiClient.post("/api/horario/registrarHorario", data);
  return response.data;
};

// Crear Excepcion
export const crearExcepcion = async (data) => {
  const response = await apiClient.post("/api/horario/crearExcepcion", data);
  return response.data;
};

// Buscar por fecha
export const BuscarPorFecha = async (fecha) => {
  const response = await apiClient.get("/api/horario/buscar", {
    params: {
      fecha: fecha // "2026-03-01"
    }
  });

  return response.data;
};