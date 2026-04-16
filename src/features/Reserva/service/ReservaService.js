import apiClient from "../../../service/apiClient";


// Horario y reservas del usuario

export const agendaUsuario = async () => {
    const reponse = await apiClient.get("/api/reserva/AgendaSemanaActual")

    return reponse.data;
}


// Crear reserva para alumno 
export const crearReservaAlumno = async (reservaData) => {
    const response = await apiClient.post("/api/reserva/reservaUsuario1", reservaData);
    return response.data;
};

// Crear reserva Admin
export const crearReservaAdmin = async (reservaData) => {
    const response = await apiClient.post("/api/reserva/reservaUsuario2", reservaData);
    return response.data;
};


// Cancelar reserva
export const cancelarReserva = async (idReserva) => {
    const response = await apiClient.put("/api/reserva/cancelarReserva", { 
        idReserva: idReserva 
    });
    return response.data;
};

// Obtener detalle de una reserva específica
export const detalleReserva = async (idReserva) => {
    const response = await apiClient.get(`/api/reserva/detalleReserva?idReserva=${idReserva}`);
    return response.data;
};

// Registrar uso de equipo (actualizar estado)
export const registrarUsoEquipo = async (idReservaEquipo, accion) => {
    const response = await apiClient.put("/api/reserva/estadoUso", {
        idReservaEquipo: idReservaEquipo,
        accion: accion 
    });
    return response.data;
};

// Buscar horario por fecha específica
export const buscarHorarioPorFecha = async (fecha) => {
    // fecha debe ser en formato YYYY-MM-DD
    const response = await apiClient.get(`/api/reserva/horario?fecha=${fecha}`);
    return response.data;
};

export const agregarEquipoAdicional = async (idReserva, idEquipo) => {
    const response = await apiClient.post("/api/reserva/agregarEquipo", {
        id_reserva: idReserva,
        id_equipo: idEquipo
    });
    return response.data;
};


// Listado Equipos
export const listadoEquipo = async () =>{
    const response = await apiClient.get("/api/equipo/ListadoEquipos")


    return response.data;
}