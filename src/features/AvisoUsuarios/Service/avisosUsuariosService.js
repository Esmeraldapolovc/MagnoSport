import apiClient from "../../../service/apiClient";

// Obtener noticias
export const listadoNoticia = async () => {
  const response = await apiClient.get("/api/noticia/obtenerNoticias");
  return response.data;
};

// Detalle de noticia
export const detalleNoticia = async (id) => {
  const response = await apiClient.get(`/api/noticia/detalleNoticia?idNoticia=${id}`);
  return response.data;
};

