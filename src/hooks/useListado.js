// hooks/useListado.js
import { useEffect, useState, useCallback } from "react";
import { 
  listarAlumno, 
  listarUsuario,
  buscarAlumnos,
  buscarUsuarios 
} from "../features/Usuarios/service/UsuariosServiceAdmin";

export const useListado = (tipo = 'todos') => { // Aceptar parámetro tipo
    const [alumnos, setAlumnos] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [filtrosAlumnos, setFiltrosAlumnos] = useState({});

    const obtenerAlumnos = useCallback(async (filtros = {}) => {
        try {
            setLoading(true);
            setError(null);
            
            let data;
            if (Object.keys(filtros).length > 0) {
                data = await buscarAlumnos(filtros);
            } else {
                data = await listarAlumno();
            }
            
            setAlumnos(data);
            setFiltrosAlumnos(filtros);
        } catch (err) {
            console.error("Error obteniendo alumnos:", err);
            setError(err.response?.data?.detail || err.message || "Error al cargar alumnos");
        } finally {
            setLoading(false);
        }
    }, []);

    const obtenerUsuarios = useCallback(async (filtros = {}) => {
        try {
            setLoading(true);
            setError(null);
            
            let data;
            if (Object.keys(filtros).length > 0) {
                data = await buscarUsuarios(filtros);
            } else {
                data = await listarUsuario();
            }
            
            setUsuarios(data);
        } catch (err) {
            console.error("Error obteniendo usuarios:", err);
            setError(err.response?.data?.detail || err.message || "Error al cargar usuarios");
        } finally {
            setLoading(false);
        }
    }, []);

    const buscarAlumnosConFiltros = useCallback((filtros) => {
        obtenerAlumnos(filtros);
    }, [obtenerAlumnos]);

    const buscarUsuariosConFiltros = useCallback((filtros) => {
        obtenerUsuarios(filtros);
    }, [obtenerUsuarios]);

    // Cargar datos iniciales según el tipo
    useEffect(() => {
        if (tipo === 'alumnos') {
            obtenerAlumnos();
        } else if (tipo === 'usuarios') {
            obtenerUsuarios();
        } else {
            // tipo 'todos' - carga ambos
            obtenerAlumnos();
            obtenerUsuarios();
        }
    }, [tipo, obtenerAlumnos, obtenerUsuarios]);

    return {
        alumnos,
        usuarios,
        loading,
        error,
        buscarAlumnos: buscarAlumnosConFiltros,
        buscarUsuarios: buscarUsuariosConFiltros,
        filtrosAlumnos
    };
};