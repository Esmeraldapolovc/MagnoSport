// hooks/useUsuarios.js
import { useState } from "react";
import { actualizarUsuario, actualizarAlumno } from "../features/usuario/service/UsuarioService";

export const useUsuarios = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const actualizar = async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await actualizarUsuario(data);
      return response;
    } catch (err) {
      console.error("Error en actualizar:", err);
      setError(err.response?.data?.detail || "Error al actualizar usuario");
      throw err; // Re-lanzar para manejo en el componente
    } finally {
      setLoading(false);
    }
  };

  const actualizarAlumnoHook = async (data) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validar que los campos requeridos existan
      if (!data.nombre) throw new Error("nombre es requerido");
      if (!data.correo) throw new Error("correo es requerido");
      if (!data.rolId) throw new Error("rolId es requerido");
      if (!data.nivelId) throw new Error("nivelId es requerido");
      if (!data.fechaInicio) throw new Error("fechaInicio es requerido");

      const response = await actualizarAlumno(data);
      return response;
    } catch (err) {
      console.error("Error en actualizarAlumnoHook:", err);
      setError(err.response?.data?.detail || err.message || "Error al actualizar alumno");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    actualizar,
    actualizarAlumnoHook,
    loading,
    error
  };
};