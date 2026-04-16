import apiClient from "../../../service/apiClient";

// Registrar equipo
export const registrarEquipo = async (data) => {
  const response = await apiClient.post("/api/equipo/registrarEquipo", data);
  return response.data;
};

// Actualizar equipo
export const actualizarEquipo = async (data) => {
  const response = await apiClient.put("/api/equipo/actualizarEquipo", data);
  return response.data;
};

// Listado de equipos
export const listadoEquipos = async () => {
  const response = await apiClient.get("/api/equipo/ListadoEquipos");
  return response.data;
};

// Obtener equipo por nombre
export const obtenerEquipoPorNombre = async (nombre) => {
  const response = await apiClient.get(`/api/equipo/obtenerEquipoPorNombre?nombre=${nombre}`);
  return response.data;
};

// Obtener equipo por ID
export const obtenerEquipoPorId = async (id) => {
  const response = await apiClient.get(`/api/equipo/obtenerEquipoPorId?idEquipo=${id}`);
  return response.data;
};

// Obtener equipo general por nombre
export const obtenerEquipoGeneralPorNombre = async (nombre) => {
  const response = await apiClient.get(`/api/equipo/obtenerEquipoGeneralPorNombre?nombre=${nombre}`);
  return response.data;
};