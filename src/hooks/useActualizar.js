import { useState } from "react";
import { actualizarUsuarioAdmin, actualizarAlumnoAdmin, eliminarUsuario, activarUsuario, crearAlumno, crearUsuario} from "../features/Usuarios/service/UsuariosServiceAdmin";

export const useActualizar = () => {

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const actualizarUsuario = async (data) => {

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const response = await actualizarUsuarioAdmin(data);

      setSuccess(true);
      return response;

    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const actualizarAlumno = async (data) => {

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const response = await actualizarAlumnoAdmin(data);

      setSuccess(true);
      return response;

    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

    const eliminar = async (idUsuario) => {

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const response = await eliminarUsuario(idUsuario);

      setSuccess(true);
      return response;

    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };


   const activar = async (idUsuario) => {

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const response = await activarUsuario(idUsuario);

      setSuccess(true);
      return response;

    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };


  const registrarUsuario = async (data) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validaciones básicas
      if (!data.nombre) throw new Error("El nombre es requerido");
      if (!data.correo) throw new Error("El correo es requerido");
      if (!data.contrasenia) throw new Error("La contraseña es requerida");
      if (!data.rolId) throw new Error("El rol es requerido");
      
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.correo)) {
        throw new Error("El formato del correo no es válido");
      }

      // Validar contraseña (mínimo 8 caracteres)
      if (data.contrasenia.length < 8) {
        throw new Error("La contraseña debe tener al menos 8 caracteres");
      }

      const response = await crearUsuario(data);
      return response;
    } catch (err) {
      console.error("Error en registrarUsuario:", err);
      setError(err.response?.data?.detail || err.message || "Error al registrar usuario");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Registrar alumno
  const registrarAlumno = async (data) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validaciones básicas
      if (!data.nombre) throw new Error("El nombre es requerido");
      if (!data.correo) throw new Error("El correo es requerido");
      if (!data.contrasenia) throw new Error("La contraseña es requerida");
      if (!data.rolId) throw new Error("El rol es requerido");
      if (!data.nivelId) throw new Error("El nivel es requerido");
      if (!data.fechaInicio) throw new Error("La fecha de inicio es requerida");
      
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.correo)) {
        throw new Error("El formato del correo no es válido");
      }

      // Validar contraseña (mínimo 8 caracteres)
      if (data.contrasenia.length < 8) {
        throw new Error("La contraseña debe tener al menos 8 caracteres");
      }

      // Validar fechas si se proporciona fechaFin
      if (data.fechaFin && data.fechaInicio) {
        if (new Date(data.fechaFin) <= new Date(data.fechaInicio)) {
          throw new Error("La fecha de fin debe ser posterior a la fecha de inicio");
        }
      }

      const response = await crearAlumno(data);
      return response;
    } catch (err) {
      console.error("Error en registrarAlumno:", err);
      setError(err.response?.data?.detail || err.message || "Error al registrar alumno");
      throw err;
    } finally {
      setLoading(false);
    }
  };


  return {
    actualizarUsuario,
    actualizarAlumno,
    eliminar,
    activar,
    registrarAlumno,
    registrarUsuario,
    loading,
    error,
    success
  };
};