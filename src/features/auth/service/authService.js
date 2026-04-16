import apiClient from "../../../service/apiClient.js";

export const login = async (correo, contrasenia) => {
  const response = await apiClient.post("/api/usuarios/login", {
    correo,
    contrasenia,
  });

  return response.data;
};