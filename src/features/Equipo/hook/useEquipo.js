import { useState, useCallback } from "react";
import {
  registrarEquipo,
  actualizarEquipo,
  listadoEquipos,
  obtenerEquipoPorNombre,
  obtenerEquipoPorId,
  obtenerEquipoGeneralPorNombre
} from "../service/EquipoService"; // ajusta la ruta

const useEquipo = () => {
  const [equipos, setEquipos] = useState([]);
  const [equipoDetalle, setEquipoDetalle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Obtener todos los equipos
  const obtenerEquipos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listadoEquipos();
      setEquipos(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Registrar equipo
  const agregarEquipo = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const nuevo = await registrarEquipo(data);
      if (nuevo == null) {
        throw new Error('No se recibió respuesta al crear el equipo.');
      }
      if (typeof nuevo === 'object') {
        setEquipos((prev) => [...prev, nuevo]);
      }
      return nuevo;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar equipo
  const editarEquipo = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const actualizado = await actualizarEquipo(data);

      setEquipos((prev) =>
        prev.map((e) =>
          e.idEquipo === actualizado.idEquipo ? actualizado : e
        )
      );

      return actualizado;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener equipo por ID
  const obtenerPorId = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await obtenerEquipoPorId(id);
      setEquipoDetalle(data);
      return data;
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar por nombre
  const buscarPorNombre = useCallback(async (nombre) => {
    setLoading(true);
    setError(null);
    try {
      const data = await obtenerEquipoPorNombre(nombre);
      setEquipos(data);
      return data;
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar general por nombre
  const buscarGeneralPorNombre = useCallback(async (nombre) => {
    setLoading(true);
    setError(null);
    try {
      const data = await obtenerEquipoGeneralPorNombre(nombre);
      setEquipos(data);
      return data;
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    equipos,
    equipoDetalle,
    loading,
    error,
    obtenerEquipos,
    agregarEquipo,
    editarEquipo,
    obtenerPorId,
    buscarPorNombre,
    buscarGeneralPorNombre
  };
};

export default useEquipo;