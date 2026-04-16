import apiClient from "../../../service/apiClient";

// Obtener suario o alumno
export const usuario = async () => {
    const response = await apiClient.get("/api/usuarios/obtnerUsuarioPorId")

    return response.data
}

export const alumno = async() =>{
    const response = await apiClient.get("/api/usuarios/obtnerAlumnoPorId")

    return response.data
}

// ********************************cambiar datos de perfil

export const actualizarUsuario = async (data) => {

  const formData = new FormData();

  formData.append("idUsuario", data.idUsuario);
  formData.append("nombre", data.nombre);
  formData.append("correo", data.correo);
  formData.append("rolId", data.rolId);

  // Solo agregar contraseña si está definida y no es nula
  if (data.contrasenia && data.contrasenia !== null) {
    formData.append("contrasenia", data.contrasenia);
  }

  if (data.contraseniaActual && data.contraseniaActual !== null) {
    formData.append("contraseniaActual", data.contraseniaActual);
  }

  // Solo agregar foto si es un archivo File
  if (data.foto && data.foto instanceof File) {
    formData.append("foto", data.foto);
  }

  const formDataLog = {};
  for (let [key, value] of formData.entries()) {
    if (value instanceof File) {
      formDataLog[key] = `File: ${value.name} (${value.size} bytes)`;
    } else {
      formDataLog[key] = value;
    }
  }
  console.log("FormData actualizarUsuario:", formDataLog);
  const response = await apiClient.put("/api/usuarios/actuaizarUsuario", formData);

  return response.data;
};


export const actualizarAlumno = async (data) =>{
  const formData = new FormData();

  formData.append("nombre", data.nombre);
  formData.append("correo", data.correo);
  formData.append("rolId", data.rolId);
  formData.append("nivelId", data.nivelId);
  formData.append("fechaInicio", data.fechaInicio);
  
  // Solo agregar contraseña si está definida y no es nula
  if (data.contrasenia && data.contrasenia !== null) {
    formData.append("contrasenia", data.contrasenia);
  }

  if (data.contraseniaActual && data.contraseniaActual !== null) {
    formData.append("contraseniaActual", data.contraseniaActual);
  }

  // Solo agregar licId si tiene valor
  if (data.licId && data.licId !== null) {
    formData.append("licId", data.licId);
  }
  
  // Solo agregar fechaFin si tiene valor
  if (data.fechaFin && data.fechaFin !== null) {
    formData.append("fechaFin", data.fechaFin);
  }
  
  // Solo agregar foto si es un archivo File
  if (data.foto && data.foto instanceof File) {
    formData.append("foto", data.foto);
  }
 
  const formDataLog = {};
  for (let [key, value] of formData.entries()) {
    if (value instanceof File) {
      formDataLog[key] = `File: ${value.name} (${value.size} bytes)`;
    } else {
      formDataLog[key] = value;
    }
  }
  console.log("FormData actualizarAlumno:", formDataLog);
  const response = await apiClient.put("/api/usuarios/actualizarAlumno", formData);

  return response.data;
}

//************************optener licenciatura y nivel */

export const licenciatura = async() => {
    const response = await apiClient.get('/api/licenciatura/obtenerLicenciaturas')

    return response.data
}

export const nivel = async() => {
      const response = await apiClient.get('/api/nivel/listadoNivels')

    return response.data
}