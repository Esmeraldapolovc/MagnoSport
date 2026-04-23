import { useState, useCallback } from 'react';
import {
    agendaUsuario,
    crearReservaAlumno,
    crearReservaAdmin,
    cancelarReserva,
    detalleReserva,
    registrarUsoEquipo,
    buscarHorarioPorFecha,
    agregarEquipoAdicional,
    listadoEquipo
} from '../service/ReservaService';

export const useReserva = () => {
    const [agenda, setAgenda] = useState([]);
    const [detalle, setDetalle] = useState(null);
    const [horario, setHorario] = useState([]);
    const [equipos, setEquipos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [detalleModal, setDetalleModal] = useState(false);

    // Limpiar estados
    const clearStates = useCallback(() => {
        setError(null);
        setSuccess(null);
    }, []);

    // Obtener agenda semanal del usuario
    const obtenerAgenda = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await agendaUsuario();
            setAgenda(data);
            return data;
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 
                             err.response?.data?.message || 
                             err.message || 
                             'Error al cargar la agenda';
            setError(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Crear nueva reserva para alumno
    const crearReserva = useCallback(async (reservaData) => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        
        if (!reservaData.fechaReserva || !reservaData.horaInicio || !reservaData.horaFin || 
            !reservaData.areaId || !reservaData.horarioId) {
            setError('Faltan datos requeridos para la reserva');
            setLoading(false);
            return null;
        }

        try {
            const dataToSend = {
                fechaReserva: reservaData.fechaReserva,
                horaInicio: reservaData.horaInicio,
                horaFin: reservaData.horaFin,
                areaId: reservaData.areaId,
                horarioId: reservaData.horarioId,
                claseImpartir: reservaData.claseImpartir || null,
                licId: reservaData.licId || null,
                equipoId: reservaData.equipoId || null
            };
            
            if (reservaData.tipoReserva) {
                dataToSend.tipoReserva = reservaData.tipoReserva;
            }

            console.log("Enviando a API:", dataToSend);
            const result = await crearReservaAlumno(dataToSend);
            setSuccess('Reserva creada exitosamente');
            
            await obtenerAgenda();
            
            return result;
        } catch (err) {
            console.error("Error completo:", err);
            
            let errorMsg = 'Error al crear la reserva';
            
            if (err.response?.data?.detail) {
                errorMsg = err.response.data.detail;
            } else if (err.response?.data?.message) {
                errorMsg = err.response.data.message;
            } else if (err.response?.data) {
                if (typeof err.response.data === 'string') {
                    errorMsg = err.response.data;
                }
            } else if (err.message) {
                errorMsg = err.message;
            }
            
            setError(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [obtenerAgenda]);



const crearReservaParaUsuario = useCallback(async (reservaData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    //  Validar idUsuario
    if (!reservaData.idUsuario) {
        setError('Se requiere el ID del usuario para crear la reserva');
        setLoading(false);
        return null;
    }
    
    if (!reservaData.fechaReserva || !reservaData.horaInicio || !reservaData.horaFin || 
        !reservaData.areaId || !reservaData.horarioId) {
        setError('Faltan datos requeridos para la reserva');
        setLoading(false);
        return null;
    }

    try {
        const dataToSend = {
            fechaReserva: reservaData.fechaReserva,
            horaInicio: reservaData.horaInicio,
            horaFin: reservaData.horaFin,
            areaId: reservaData.areaId,
            horarioId: reservaData.horarioId,
            idUsuario: reservaData.idUsuario,
            claseImpartir: reservaData.claseImpartir || null,
            licId: reservaData.licId || null,
            equipoId: reservaData.equipoId || null,
            tipoReserva: reservaData.tipoReserva || null
        };
        
        console.log("=== Creando reserva para otro usuario (Admin) ===");
        console.log("ID de usuario a enviar:", dataToSend.idUsuario);
        console.log("Datos completos:", dataToSend);
        
        // Usar el servicio específico para administradores
        const result = await crearReservaAdmin(dataToSend);
        setSuccess('Reserva creada exitosamente');
        
        // Recargar la agenda para reflejar los cambios
        await obtenerAgenda();
        
        return result;
    } catch (err) {
        console.error("Error al crear reserva para usuario:", err);
        
        let errorMsg = 'Error al crear la reserva';
        
        // Extraer el mensaje de error del backend
        if (err.response?.data?.detail) {
            errorMsg = err.response.data.detail;
        } else if (err.response?.data?.message) {
            errorMsg = err.response.data.message;
        } else if (err.response?.data) {
            if (typeof err.response.data === 'string') {
                errorMsg = err.response.data;
            } else if (err.response.data.error) {
                errorMsg = err.response.data.error;
            }
        } else if (err.message) {
            errorMsg = err.message;
        }
        
        setError(errorMsg);
        
        
        const customError = new Error(errorMsg);
        customError.originalError = err;
        throw customError;
    } finally {
        setLoading(false);
    }
}, [obtenerAgenda]);

    // Cancelar reserva
    const cancelar = useCallback(async (idReserva) => {
        if (!idReserva) {
            setError('ID de reserva no proporcionado');
            return null;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);
        
        try {
            const result = await cancelarReserva(idReserva);
            setSuccess('Reserva cancelada exitosamente');
            await obtenerAgenda();
            return result;
        } catch (err) {
            let errorMsg = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Error al cancelar la reserva';
            setError(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [obtenerAgenda]);

    // Obtener detalle de una reserva
    const obtenerDetalle = useCallback(async (idReserva) => {
        if (!idReserva) {
            setError('ID de reserva no proporcionado');
            return null;
        }

        setLoading(true);
        setError(null);
        
        try {
            const data = await detalleReserva(idReserva);
            console.log("Detalle de reserva recibido:", data);
            setDetalle(data);
            return data;
        } catch (err) {
            console.error("Error al obtener detalle:", err);
            let errorMsg = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Error al obtener el detalle de la reserva';
            setError(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Registrar uso de equipo
const registrarUso = useCallback(async (idReservaEquipo, accion) => {
    if (!idReservaEquipo) {
        setError('ID de reserva equipo no proporcionado');
        return null;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
        // Enviar la acción al backend
        const result = await registrarUsoEquipo(idReservaEquipo, accion);
        setSuccess(accion === 'iniciar' ? 'Uso de equipo iniciado exitosamente' : 'Uso de equipo finalizado exitosamente');
        
        // Recargar el detalle si existe
        if (detalle?.id_reserva) {
            await obtenerDetalle(detalle.id_reserva);
        }
        
        return result;
    } catch (err) {
        // Extraer correctamente el mensaje de error del backend
        let errorMsg = 'Error al registrar uso de equipo';
        
        if (err.response?.data?.detail) {
            errorMsg = err.response.data.detail;
        } else if (err.response?.data?.message) {
            errorMsg = err.response.data.message;
        } else if (err.response?.data?.error) {
            errorMsg = err.response.data.error;
        } else if (err.message) {
            errorMsg = err.message;
        }
        
        console.error('Error en registrarUso:', errorMsg);
        setError(errorMsg);
        throw new Error(errorMsg); 
    } finally {
        setLoading(false);
    }
}, [detalle, obtenerDetalle]);

  // Buscar horario por fecha
const buscarHorario = useCallback(async (fecha) => {
    if (!fecha) {
        setError('Fecha no proporcionada');
        return null;
    }

    setLoading(true);
    setError(null);
    
    try {
        const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString().split('T')[0];
        const data = await buscarHorarioPorFecha(fechaStr);
        setHorario(data);
        setAgenda(data); 
        return data;
    } catch (err) {
        console.error("Error en buscarHorario:", err);
        let errorMsg = err.response?.data?.detail || 
                      err.response?.data?.message || 
                      err.message || 
                      'Error al buscar horario';
        setError(errorMsg);
        throw err; // Lanzar el error para que el componente lo capture
    } finally {
        setLoading(false);
    }
}, []);

    // Agregar equipo adicional a una reserva
    const agregarEquipo = useCallback(async (idReserva, idEquipo) => {
        if (!idReserva || !idEquipo) {
            setError('ID de reserva y equipo son requeridos');
            return null;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);
        
        try {
            const result = await agregarEquipoAdicional(idReserva, idEquipo);
            setSuccess('Equipo agregado exitosamente');
            
            if (detalle?.id_reserva === idReserva) {
                await obtenerDetalle(idReserva);
            }
            
            return result;
        } catch (err) {
            let errorMsg = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Error al agregar equipo';
            setError(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [detalle, obtenerDetalle]);

    // Obtener listado de equipos
    const obtenerEquipos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listadoEquipo();
            setEquipos(data);
            return data;
        } catch (err) {
            let errorMsg = err.response?.data?.detail || 
                          err.response?.data?.message || 
                          err.message || 
                          'Error al cargar los equipos';
            setError(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    // Formatear datos para crear reserva
    const formatReservaData = useCallback((data) => {
        return {
            fechaReserva: data.fecha,
            horaInicio: data.horaInicio,
            horaFin: data.horaFin,
            areaId: data.areaId,
            horarioId: data.horarioId,
            tipoReserva: data.tipoReserva || null,
            claseImpartir: data.claseImpartir || null,
            licId: data.licId || null,
            equipoId: Array.isArray(data.equipoId) ? data.equipoId : 
                     (data.equipoId ? [data.equipoId] : null)
        };
    }, []);

       const formatReservaDataAdmin = useCallback((data) => {
    return {
        fechaReserva: data.fecha,
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        areaId: data.areaId,
        horarioId: data.horarioId,
        idUsuario: data.idUsuario, 
        tipoReserva: data.tipoReserva || null,
        claseImpartir: data.claseImpartir || null,
        licId: data.licId || null,
        equipoId: Array.isArray(data.equipoId) ? data.equipoId : 
                 (data.equipoId ? [data.equipoId] : null)
    };
}, []);

    return {
        // Estados
        agenda,
        detalle,
        horario,
        equipos, 
        loading,
        error,
        success,
        detalleModal,     
        setDetalleModal,   
        
        // Funciones principales
        obtenerAgenda,
        crearReserva,
        cancelarReserva: cancelar,
        obtenerDetalle,
        registrarUso,
        buscarHorario,
        agregarEquipo,
        obtenerEquipos, 
        crearReservaParaUsuario,
        // Funciones auxiliares
        formatReservaData,
        clearStates,
        formatReservaDataAdmin
    };
};