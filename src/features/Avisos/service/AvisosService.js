import apiClient from "../../../service/apiClient";

// Obtener noticias
export const listadoNoticia = async () => {
  const response = await apiClient.get("/api/noticia/obtenerNoticias");
  return response.data;
};

// Crear noticia
export const crearNoticia = async (data) => {
  const response = await apiClient.post("/api/noticia/agregarNoticia", data);
  return response.data;
};

// Detalle de noticia
export const detalleNoticia = async (id) => {
  const response = await apiClient.get(`/api/noticia/detalleNoticia?idNoticia=${id}`);
  return response.data;
};

// Modificar noticia
export const modificarNoticia = async (data) => {
  const response = await apiClient.put("/api/noticia/modificarNoticia", data);
  return response.data;
};

// Eliminar noticia 
export const eliminarNoticia = async (data) => {
  const response = await apiClient.patch("/api/noticia/eliminarNoticia", data);
  return response.data;
};

// Buscar noticia por fecha
export const buscarNoticiaPorFecha = async (fecha) => {
  const response = await apiClient.get(`/api/noticia/buscarPorFecha?fecha=${fecha}`);
  return response.data;
};