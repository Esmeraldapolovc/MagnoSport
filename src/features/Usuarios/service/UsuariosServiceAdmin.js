import apiClient from "../../../service/apiClient";

// Obtener lista de alumnos
export const listarAlumno = async () => {
  const response = await apiClient.get("/api/usuarios/listarAlumno");
  return response.data;
};

export const listarUsuario = async () => {
  const response = await apiClient.get("api/usuarios/listarUsuario")

    return  response.data;
};

// Buscar alumnos con filtros
export const buscarAlumnos = async (filtros) => {
  const params = new URLSearchParams();
  
  if (filtros.nombre) params.append("nombre", filtros.nombre);
  if (filtros.correo) params.append("correo", filtros.correo);
  if (filtros.nivelId) params.append("nivelId", filtros.nivelId);
  if (filtros.licenciaturaId) params.append("licenciaturaId", filtros.licenciaturaId);
  if (filtros.estado !== undefined && filtros.estado !== null) {
    params.append("estado", filtros.estado);  
  }
  
  const response = await apiClient.get(`/api/usuarios/busquedaAlumno?${params.toString()}`);
  return response.data;
};


// Buscar usuarios (no alumnos) con filtros
export const buscarUsuarios = async (filtros) => {
  const params = new URLSearchParams();
  
  if (filtros.nombre) params.append("nombre", filtros.nombre);
  if (filtros.correo) params.append("correo", filtros.correo);
  if (filtros.rol) params.append("rol", filtros.rol);
   if (filtros.estado !== undefined && filtros.estado !== null) {
    params.append("estado", filtros.estado);  
  }
  
  const response = await apiClient.get(`/api/usuarios/busquedaUsuario?${params.toString()}`);
  return response.data;
};

// actualizar usuario   
export const actualizarUsuarioAdmin = async (data) => {

  const formData = new FormData();

  formData.append("idUsuario", data.idUsuario);
  formData.append("nombre", data.nombre);
  formData.append("correo", data.correo);
  formData.append("contrasenia", data.contrasenia);
  formData.append("rolId", data.rolId);

  if (data.foto && data.foto instanceof File) {
    formData.append("foto", data.foto);
  }

  const response = await apiClient.put(
    "/api/usuarios/actuaizarUsuarioAdmin",
    formData
  );

  return response.data;
};

// actualizar alumno
export const actualizarAlumnoAdmin = async (data) => {

  const formData = new FormData();

  formData.append("idUsuario", data.idUsuario);
  formData.append("nombre", data.nombre);
  formData.append("correo", data.correo);
  formData.append("rolId", data.rolId);
  formData.append("nivelId", data.nivelId);
  formData.append("fechaInicio", data.fechaInicio);

  if (data.contrasenia) {
    formData.append("contrasenia", data.contrasenia);
  }

  if (data.licId) {
    formData.append("licId", data.licId);
  }

  if (data.fechaFin) {
    formData.append("fechaFin", data.fechaFin);
  }

  if (data.foto && data.foto instanceof File) {
    formData.append("foto", data.foto);
  }

  const response = await apiClient.put(
    "/api/usuarios/actualizarAlumnoAdmin",
    formData
  );

  return response.data;
};

export const eliminarUsuario = async (idUsuario) => {

  const response = await apiClient.put(
    "/api/usuarios/eliminarUsuario",
    {
      idUsuario: idUsuario
    }
  );

  return response.data;
};

export const activarUsuario = async (idUsuario) => {

  const response = await apiClient.put(
    "/api/usuarios/activar",
    {
      idUsuario: idUsuario
    }
  );

  return response.data;
};

// Crear Alumno
export const crearAlumno = async (data) => {
  const formData = new FormData();

  // Campos obligatorios
  formData.append("nombre", data.nombre);
  formData.append("correo", data.correo);
  formData.append("contrasenia", data.contrasenia);
  formData.append("rolId", data.rolId);
  formData.append("fechaInicio", data.fechaInicio); // Formato YYYY-MM-DD
  formData.append("nivelId", data.nivelId);

  // Campos opcionales
  if (data.licId) {
    formData.append("licId", data.licId);
  }
  
  if (data.fechaFin) {
    formData.append("fechaFin", data.fechaFin);
  }

  if (data.foto && data.foto instanceof File) {
    formData.append("foto", data.foto);
  }

  const response = await apiClient.post("/api/usuarios/registroAlumno", formData);

  return response.data;
};

// Crear Usuario (General/Profesor)
export const crearUsuario = async (data) => {
  const formData = new FormData();

  formData.append("nombre", data.nombre);
  formData.append("correo", data.correo);
  formData.append("contrasenia", data.contrasenia);
  formData.append("rolId", data.rolId);

  if (data.foto && data.foto instanceof File) {
    formData.append("foto", data.foto);
  }

  const response = await apiClient.post("/api/usuarios/registroUsuario", formData);

  return response.data;
};