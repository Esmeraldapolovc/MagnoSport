import React, { useState, useEffect } from 'react';
import { useReserva } from '../hook/useReserva';
import { useCatalogos } from '../../../hooks/useCatalogo';
import Alert from '../../../components/Alert';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from 'react-datepicker';
import es from 'date-fns/locale/es';
import { useUser } from '../../../hooks/useUser';
import '../../../assets/styles/Reserva.css';

// Registrar el locale español
registerLocale('es', es);

// --- MAPA DE ROLES ---
const ROLES = {
  ADMIN: 1,
  ALUMNO: 2,
  PROFESOR: 3,
  PERSONAL: 4
};

// --- ÁREAS QUE REQUIEREN EQUIPOS (Cardio) ---
const AREAS_CON_EQUIPOS = [2]; // ID 2 = Cardio

// --- DATOS DE ESPACIOS ---
const ESPACIOS = [
  { id: 1, nombre: "Gimnasio" },
  { id: 2, nombre: "Cardio"},
  { id: 3, nombre: "TRX" },
  { id: 4, nombre: "Cancha Bolada"},
  { id: 5, nombre: "Cancha de Tenis"},
];

// --- FUNCIÓN PARA VALIDAR SI LA HORA ES VÁLIDA PARA RESERVAR ---
const esHoraValidaParaReservar = (fechaReserva, horaInicio) => {
  const ahora = new Date();
  const [year, month, day] = fechaReserva.split('-');
  const [hora, minuto] = horaInicio.split(':');
  const fechaHoraReserva = new Date(year, month - 1, day, hora, minuto, 0);
  const minutosTranscurridos = (ahora - fechaHoraReserva) / (1000 * 60);
  return minutosTranscurridos < 15;
};

export default function Reserva() {
  const { user } = useUser();
  const { 
    agenda, 
    loading, 
    error, 
    obtenerAgenda,
    crearReserva,
    cancelarReserva,
    equipos,
    obtenerEquipos,
    clearStates,
    obtenerDetalle,
    detalle,
    detalleModal,
    setDetalleModal,
    registrarUso,
    buscarHorario,
    agregarEquipo
  } = useReserva();

  // Usar el hook de catálogos
  const { 
    obtenerLicenciaturas, 
    obtenerNiveles, 
    loading: catalogosLoading,
    error: catalogosError 
  } = useCatalogos();

  // --- ESTADOS ---
  const [alert, setAlert] = useState({ show: false, tipo: '', texto: '' });
  const [showModal, setShowModal] = useState(false);
  const [espacioSel, setEspacioSel] = useState("");
  const [fechaSel, setFechaSel] = useState("");
  const [horaSel, setHoraSel] = useState("");
  const [claseImpartir, setClaseImpartir] = useState("");
  const [licId, setLicId] = useState("");
  const [nivelId, setNivelId] = useState(null);
  const [equiposSeleccionados, setEquiposSeleccionados] = useState([]);
  const [fechaActual, setFechaActual] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [bloqueSeleccionado, setBloqueSeleccionado] = useState(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [tipoReserva, setTipoReserva] = useState(null);
  const [equiposCargados, setEquiposCargados] = useState(false);
  const [cargandoSemana, setCargandoSemana] = useState(false);
  
  // Estados para agregar equipos adicionales
  const [showAgregarEquipoModal, setShowAgregarEquipoModal] = useState(false);
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [equipoSeleccionadoAgregar, setEquipoSeleccionadoAgregar] = useState("");
  const [agregandoEquipo, setAgregandoEquipo] = useState(false);
  
  // Estados para los catálogos
  const [niveles, setNiveles] = useState([]);
  const [licenciaturas, setLicenciaturas] = useState([]);
  const [licenciaturasFiltradas, setLicenciaturasFiltradas] = useState([]);

  // Detectar cambio de tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cargar equipos al montar el componente
  useEffect(() => {
    const cargarEquipos = async () => {
      try {
        const data = await obtenerEquipos();
        setEquiposCargados(true);
      } catch (err) {
        console.error("Error al cargar equipos:", err);
        setEquiposCargados(false);
      }
    };
    cargarEquipos();
  }, []);

  // Cargar catálogos al montar el componente
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        console.log("=== CARGANDO CATÁLOGOS ===");
        // Cargar niveles
        const nivelesData = await obtenerNiveles();
        console.log("Niveles recibidos:", nivelesData);
        setNiveles(nivelesData);
        
        // Cargar licenciaturas
        const licenciaturasData = await obtenerLicenciaturas();
        console.log("Licenciaturas recibidas:", licenciaturasData);
        setLicenciaturas(licenciaturasData);
      } catch (err) {
        console.error("Error cargando catálogos:", err);
      }
    };
    
    cargarCatalogos();
  }, []);

  // Filtrar licenciaturas cuando se selecciona un nivel
  useEffect(() => {
    console.log("=== FILTRANDO LICENCIATURAS ===");
    console.log("Nivel seleccionado:", nivelId);
    console.log("Todas las licenciaturas:", licenciaturas);
    
    if (nivelId) {
      const filtradas = licenciaturas.filter(lic => {
        console.log(`Comparando licenciatura ${lic.nombre} (nivelId: ${lic.nivelId}) con nivel seleccionado: ${nivelId}`);
        return lic.nivelId == nivelId;
      });
      console.log("Licenciaturas filtradas:", filtradas);
      setLicenciaturasFiltradas(filtradas);
      // Resetear licenciatura seleccionada cuando cambia el nivel
      setLicId("");
    } else {
      console.log("No hay nivel seleccionado, limpiando filtradas");
      setLicenciaturasFiltradas([]);
    }
  }, [nivelId, licenciaturas]);

  // Debug: Verificar estados cada vez que cambian
  useEffect(() => {
    console.log("=== DEBUG ESTADOS CATÁLOGOS ===");
    console.log("Niveles:", niveles);
    console.log("Licenciaturas:", licenciaturas);
    console.log("Nivel seleccionado:", nivelId);
    console.log("Licenciaturas filtradas:", licenciaturasFiltradas);
    console.log("Catalogos loading:", catalogosLoading);
  }, [niveles, licenciaturas, nivelId, licenciaturasFiltradas, catalogosLoading]);

  // Establecer tipo de reserva inicial según el rol
  useEffect(() => {
    if (user?.rol) {
      if (user.rol === ROLES.PROFESOR) {
        setTipoReserva("Laboral");
      } else {
        setTipoReserva(null);
      }
    }
  }, [user]);

  // Limpiar error automáticamente después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearStates();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearStates]);

  // Actualizar día seleccionado cuando cambia la agenda (para móvil)
  useEffect(() => {
    if (isMobile && diaSeleccionado && agenda.length > 0) {
      const diaActualizado = agenda.find(d => d.fecha === diaSeleccionado.fecha);
      if (diaActualizado) {
        setDiaSeleccionado(diaActualizado);
      }
    }
  }, [agenda, isMobile]);

  // Horas del día a mostrar (de 6:00 a 19:00)
  const horas = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  // --- CARGAR AGENDA AL MONTAR EL COMPONENTE ---
  useEffect(() => {
    cargarAgenda();
  }, []);

  const showAlert = (texto, tipo = 'success') => {
    setAlert({ show: true, tipo, texto });
    setTimeout(() => {
      setAlert({ show: false, tipo: '', texto: '' });
    }, 3000);
  };

  const cargarAgenda = async () => {
    try {
      await obtenerAgenda();
    } catch (err) {
      // El error ya se maneja en el hook
    }
  };

  const cargarSemana = async (fecha) => {
    setCargandoSemana(true);
    try {
      const fechaStr = fecha.toISOString().split('T')[0];
      const datosSemana = await buscarHorario(fechaStr);
      if (datosSemana && Array.isArray(datosSemana) && datosSemana.length > 0) {
        console.log("Semana cargada correctamente:", datosSemana.length, "días");
      } else {
        showAlert('No hay horarios para esta semana', 'warning');
      }
    } catch (err) {
      console.error("Error en cargarSemana:", err);
      showAlert('Error al cargar los horarios de la semana', 'error');
    } finally {
      setCargandoSemana(false);
      setShowCalendar(false);
    }
  };

  const handleDateSelect = (date) => {
    const lunesSemana = obtenerLunesDeSemana(date);
    setFechaActual(lunesSemana);
    cargarSemana(lunesSemana);
  };

  const handleCloseError = () => {
    clearStates();
  };

  const getColorClass = (bloque) => {
    if (!bloque) return 'sin-horario';
    if (bloque.reservadoPorMi) return 'mi-reserva';
    if (bloque.estado === 'Abierto') return 'disponible';
    if (bloque.estado === 'Cerrado') return 'cerrado';
    return 'sin-horario';
  };

  const getColorStyle = (bloque) => {
    if (!bloque) return '#E8EDE9';
    if (bloque.reservadoPorMi) return '#4CAF50';
    if (bloque.estado === 'Abierto') return '#A5D6A5';
    if (bloque.estado === 'Cerrado') return '#FFB5B5';
    return '#E8EDE9';
  };

  const getBloqueTexto = (bloque) => {
    if (!bloque) return '';
    if (bloque.reservadoPorMi) return 'Mi reserva';
    if (bloque.estado === 'Abierto') return 'Disponible';
    if (bloque.estado === 'Cerrado') return 'Cerrado';
    return '';
  };

  const getBloque = (dia, hora) => {
    if (!dia || !dia.bloques || !Array.isArray(dia.bloques)) return null;
    return dia.bloques.find(b => b && b.horaInicio === hora);
  };

  const handleBloqueClick = (dia, bloque) => {
    if (!bloque || !dia) {
      showAlert('Bloque no válido', 'error');
      return;
    }

    if (bloque.reservadoPorMi) {
      verDetalleReserva(bloque.idReserva);
    } else if (bloque.estado === 'Abierto') {
      if (!bloque.horarioId) {
        showAlert('Este horario no está disponible para reservar', 'error');
        return;
      }
      
      if (!esHoraValidaParaReservar(dia.fecha, bloque.horaInicio)) {
        showAlert('No se puede reservar en este horario', 'error');
        return;
      }
      
      setBloqueSeleccionado(bloque);
      setFechaSel(dia.fecha);
      setHoraSel(bloque.horaInicio);
      setEspacioSel("");
      setNivelId(null);
      setLicId("");
      
      if (user?.rol === ROLES.PROFESOR) {
        setTipoReserva("Laboral");
      } else {
        setTipoReserva(null);
      }
      
      setShowModal(true);
    }
  };

  const verDetalleReserva = async (idReserva) => {
    try {
      await obtenerDetalle(idReserva);
      setDetalleModal(true);
    } catch (err) {
      showAlert('Error al cargar los detalles', 'error');
    }
  };

  const handleDiaClick = (dia) => {
    if (dia) {
      setDiaSeleccionado(dia);
    }
  };

  const handleBloqueMovilClick = (bloque) => {
    if (!bloque || !diaSeleccionado) return;

    if (bloque.reservadoPorMi) {
      verDetalleReserva(bloque.idReserva);
    } else if (bloque.estado === 'Abierto') {
      if (!bloque.horarioId) {
        showAlert('Este horario no está disponible para reservar', 'error');
        return;
      }

      if (!esHoraValidaParaReservar(diaSeleccionado.fecha, bloque.horaInicio)) {
        showAlert('No se puede reservar este horario porque ya pasaron más de 15 minutos de la hora de inicio', 'error');
        return;
      }

      setBloqueSeleccionado(bloque);
      setFechaSel(diaSeleccionado.fecha);
      setHoraSel(bloque.horaInicio);
      setEspacioSel("");
      setNivelId(null);
      setLicId("");
      
      if (user?.rol === ROLES.PROFESOR) {
        setTipoReserva("Laboral");
      } else {
        setTipoReserva(null);
      }
      
      setShowModal(true);
    }
  };

  const volverADias = () => {
    setDiaSeleccionado(null);
  };

  const obtenerLunesDeSemana = (fecha) => {
    const nuevaFecha = new Date(fecha);
    const dia = nuevaFecha.getDay();
    const diff = dia === 0 ? 6 : dia - 1;
    nuevaFecha.setDate(nuevaFecha.getDate() - diff);
    return nuevaFecha;
  };

  const semanaAnterior = async () => {
    const nuevaFecha = new Date(fechaActual);
    nuevaFecha.setDate(nuevaFecha.getDate() - 7);
    setFechaActual(nuevaFecha);
    await cargarSemana(nuevaFecha);
  };

  const semanaSiguiente = async () => {
    const nuevaFecha = new Date(fechaActual);
    nuevaFecha.setDate(nuevaFecha.getDate() + 7);
    setFechaActual(nuevaFecha);
    await cargarSemana(nuevaFecha);
  };

  const irSemanaActual = async () => {
    const nuevaFecha = new Date();
    setFechaActual(nuevaFecha);
    await cargarSemana(nuevaFecha);
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr + 'T00:00:00');
    return fecha.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric' 
    });
  };

  const formatearFechaLegible = (fechaStr) => {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr + 'T00:00:00');
    return fecha.toLocaleDateString('es-MX', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long'
    });
  };

  const getRangoSemana = () => {
    if (!agenda || agenda.length === 0) return 'Cargando...';
    if (agenda.length < 6) return 'Semana incompleta';
    const inicio = formatearFecha(agenda[0]?.fecha);
    const fin = formatearFecha(agenda[5]?.fecha);
    return `${inicio} - ${fin}`;
  };

  const handleReservar = async () => {
    if (!espacioSel) {
      showAlert('Selecciona un espacio', 'error');
      return;
    }

    if (!agenda || !fechaSel) {
      showAlert('Error con la fecha seleccionada', 'error');
      return;
    }

    if (!esHoraValidaParaReservar(fechaSel, horaSel)) {
      showAlert('No se puede reservar este horario porque ya pasaron más de 15 minutos de la hora de inicio', 'error');
      setShowModal(false);
      limpiarFormulario();
      return;
    }

    const dia = agenda.find(d => d && d.fecha === fechaSel);
    if (!dia) {
      showAlert('No se encontró el día seleccionado', 'error');
      return;
    }

    const bloque = bloqueSeleccionado || dia.bloques?.find(b => b && b.horaInicio === horaSel);
    if (!bloque || !bloque.horarioId) {
      showAlert('No se puede reservar este horario', 'error');
      return;
    }

    const espacioEncontrado = ESPACIOS.find(e => e.id === parseInt(espacioSel));
    if (!espacioEncontrado) {
      showAlert('Espacio no válido', 'error');
      return;
    }

    const reservaData = {
      fechaReserva: fechaSel,
      horaInicio: horaSel,
      horaFin: bloque.horaFin,
      areaId: parseInt(espacioSel),
      horarioId: bloque.horarioId,
      tipoReserva: null,
      claseImpartir: null,
      licId: null,
      equipoId: null
    };

    if (user?.rol === ROLES.PROFESOR) {
      reservaData.tipoReserva = tipoReserva;
      
      if (tipoReserva === "Laboral") {
        if (!claseImpartir) {
          showAlert('Debes especificar la clase a impartir', 'error');
          return;
        }
        if (!nivelId) {
          showAlert('Debes seleccionar un nivel', 'error');
          return;
        }
        if (nivelId === 2 && !licId) {
        showAlert('Debes seleccionar una licenciatura', 'error');
        return;
      }
        reservaData.claseImpartir = claseImpartir;
        reservaData.licId = parseInt(licId);
      }
    }

    if (AREAS_CON_EQUIPOS.includes(parseInt(espacioSel))) {
      if (user?.rol !== ROLES.PROFESOR || tipoReserva !== "Laboral") {
        reservaData.equipoId = equiposSeleccionados.length > 0 ? equiposSeleccionados : null;
      }
    }

    try {
      await crearReserva(reservaData);
      showAlert('Reserva creada exitosamente', 'success');
      setShowModal(false);
      limpiarFormulario();
      await cargarSemana(fechaActual);
    } catch (err) {
      // El error ya se establece en el hook
    }
  };

  const limpiarFormulario = () => {
    setEspacioSel("");
    setClaseImpartir("");
    setLicId("");
    setNivelId(null);
    setEquiposSeleccionados([]);
    setBloqueSeleccionado(null);
    setLicenciaturasFiltradas([]);
    if (user?.rol === ROLES.PROFESOR) {
      setTipoReserva("Laboral");
    } else {
      setTipoReserva(null);
    }
  };

  const requiereEquipos = espacioSel === "2";

  const equiposFiltrados = equipos.filter(equipo => equipo.area == parseInt(espacioSel));

  const handleCancelarReservaDetalle = async () => {
    if (detalle && detalle.id_reserva) {
      if (window.confirm('¿Estás seguro de cancelar esta reserva?')) {
        try {
          await cancelarReserva(detalle.id_reserva);
          setDetalleModal(false);
          showAlert('Reserva cancelada exitosamente', 'success');
          await cargarSemana(fechaActual);
          
          if (isMobile && diaSeleccionado) {
            const diaActualizado = agenda.find(d => d.fecha === diaSeleccionado.fecha);
            if (diaActualizado) {
              setDiaSeleccionado(diaActualizado);
            }
          }
        } catch (err) {
          showAlert('Error al cancelar la reserva', 'error');
        }
      }
    }
  };

  // Función para cargar equipos disponibles
  const cargarEquiposDisponibles = async () => {
    try {
      const data = await obtenerEquipos();
      // Filtrar equipos que pertenecen al área Cardio (id 2) y no están ya asignados a esta reserva
      const equiposAsignadosIds = detalle?.maquinas?.map(m => m.idEquipo || m.id_equipo) || [];
      const disponibles = data.filter(equipo => {
        const equipoId = equipo.idEquipo || equipo.id || equipo.equipoId;
        return (equipo.area === 2 || equipo.areaId === 2) && !equiposAsignadosIds.includes(equipoId);
      });
      setEquiposDisponibles(disponibles);
    } catch (err) {
      showAlert('Error al cargar equipos disponibles', 'error');
    }
  };

  // Función para abrir el modal de agregar equipo
  const handleAbrirAgregarEquipo = async () => {
    await cargarEquiposDisponibles();
    setShowAgregarEquipoModal(true);
  };

  // Función para agregar equipo a la reserva
  const handleAgregarEquipo = async () => {
    if (!equipoSeleccionadoAgregar) {
      showAlert('Selecciona un equipo', 'error');
      return;
    }

    setAgregandoEquipo(true);
    try {
      await agregarEquipo(detalle.id_reserva, parseInt(equipoSeleccionadoAgregar));
      showAlert('Equipo agregado exitosamente', 'success');
      setShowAgregarEquipoModal(false);
      setEquipoSeleccionadoAgregar("");
      // Recargar el detalle para mostrar el nuevo equipo
      await obtenerDetalle(detalle.id_reserva);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Error al agregar equipo';
      showAlert(errorMsg, 'error');
    } finally {
      setAgregandoEquipo(false);
    }
  };

 // Registrar uso de equipo - Maneja las dos etapas: Iniciar uso y Finalizar uso
const handleRegistrarUso = async (idReservaEquipo, estadoActual) => {
    try {
        let accion = '';
        let mensajeExito = '';
        
        // Normalizar el estado para comparación (convertir a minúsculas y eliminar espacios)
        const estadoNormalizado = estadoActual?.toLowerCase().trim();
        
        // Determinar la acción según el estado actual
        if (estadoNormalizado === 'pendiente') {
            accion = 'iniciar';
            mensajeExito = '✅ Uso de equipo iniciado exitosamente';
        } else if (estadoNormalizado === 'en uso' || estadoNormalizado === 'enuso') {
            accion = 'finalizar';
            mensajeExito = '✅ Uso de equipo finalizado exitosamente';
        } else {
            console.log('Estado no reconocido:', estadoActual);
            showAlert(`No se puede registrar uso en este estado: ${estadoActual}`, 'error');
            return;
        }
        
        console.log(`Registrando uso - ID: ${idReservaEquipo}, Acción: ${accion}, Estado actual: ${estadoActual}`);
        
        // Llamar al hook con la acción correspondiente
        await registrarUso(idReservaEquipo, accion);
        showAlert(mensajeExito, 'success');
        
        // Recargar los detalles para actualizar el estado
        if (detalle && detalle.id_reserva) {
            await obtenerDetalle(detalle.id_reserva);
        }
    } catch (err) {
        // El error ya viene con el mensaje del backend desde el hook
        const errorMessage = err.message || 'Error al registrar uso';
        console.error('Error en registro de uso:', errorMessage);
        
        // Verificar tipos específicos de error por el mensaje
        if (errorMessage.includes('fuera de horario') || 
            errorMessage.includes('fuera del horario') ||
            errorMessage.includes('no está dentro del horario')) {
            showAlert('⏰ No se puede registrar el uso porque el registro está fuera del horario permitido (solo 15 minutos antes o después)', 'error');
        } else if (errorMessage.includes('está siendo usada') || errorMessage.includes('está siendo utilizado')) {
            showAlert('🔴 La máquina ya está siendo utilizada por otro usuario en este momento', 'error');
        } else if (errorMessage.includes('ya fue finalizado')) {
            showAlert('📌 El uso de este equipo ya fue finalizado anteriormente', 'error');
        } else if (errorMessage.includes('ya está en uso')) {
            showAlert('🔴 El equipo ya está en uso por otro usuario', 'error');
        } else {
            // Mostrar el mensaje exacto del backend
            const accionTexto = estadoActual === 'Pendiente' ? 'iniciar' : 'finalizar';
            showAlert(`❌ Error al ${accionTexto} el uso: ${errorMessage}`, 'error');
        }
    }
};

  if ((loading || cargandoSemana) && (!agenda || agenda.length === 0)) {
    return (
      <div className="reserva-loading">
        <div className="loading-spinner"></div>
        <p>Cargando agenda...</p>
      </div>
    );
  }

  return (
    <div className="reserva-page">
      {error && (
        <Alert 
          message={error} 
          type="error" 
          onClose={handleCloseError}
        />
      )}
      
      {alert.show && (
        <Alert 
          message={alert.texto} 
          type={alert.tipo} 
          onClose={() => setAlert({ show: false, tipo: '', texto: '' })}
        />
      )}

      <div className="reserva-container">
        <div className="reserva-header">
          <div className="header-left">
            <h1>Reservas</h1>
            <div 
              className="semana-badge" 
              onClick={() => setShowCalendar(!showCalendar)}
              style={{ cursor: 'pointer' }}
            >
              <i className="fas fa-calendar-week"></i>
              <span>{getRangoSemana()}</span>
              <i className="fas fa-chevron-down" style={{ marginLeft: '8px', fontSize: '12px' }}></i>
            </div>
            
            {showCalendar && (
              <div style={{ 
                position: 'absolute', 
                top: '70px', 
                left: '200px', 
                zIndex: 1000,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                borderRadius: '12px'
              }}>
                <DatePicker
                  selected={fechaActual}
                  onChange={handleDateSelect}
                  inline
                  onClickOutside={() => setShowCalendar(false)}
                  locale="es"
                />
              </div>
            )}
          </div>
          
          <div className="header-actions">
            <div className="nav-semana">
              <button 
                onClick={semanaAnterior} 
                disabled={loading || cargandoSemana} 
                className="nav-btn" 
                title="Semana anterior"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <button 
                onClick={irSemanaActual} 
                className="btn-hoy" 
                disabled={loading || cargandoSemana}
              >
                <i className="fas fa-calendar-day"></i>
                <span>Hoy</span>
              </button>
              <button 
                onClick={semanaSiguiente} 
                disabled={loading || cargandoSemana} 
                className="nav-btn" 
                title="Semana siguiente"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>

        <div className="reserva-leyenda">
          <div className="leyenda-item">
            <span className="color-box color-mi-reserva"></span>
            <span>Mis reservas</span>
          </div>
          <div className="leyenda-item">
            <span className="color-box color-disponible"></span>
            <span>Disponible</span>
          </div>
          <div className="leyenda-item">
            <span className="color-box color-cerrado"></span>
            <span>Cerrado</span>
          </div>
          <div className="leyenda-item">
            <span className="color-box color-sin-horario"></span>
            <span>Sin horario</span>
          </div>
        </div>

        {cargandoSemana && (
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255,255,255,0.9)',
            padding: '20px',
            borderRadius: '10px',
            zIndex: 100
          }}>
            <div className="loading-spinner"></div>
            <p>Cargando semana...</p>
          </div>
        )}

        {!isMobile && agenda && agenda.length > 0 && (
          <div className="reserva-tabla-container desktop-view">
            <table className="reserva-tabla">
              <thead>
                <tr>
                  <th className="hora-col">Hora</th>
                  {agenda.map((dia) => (
                    <th key={dia?.fecha || Math.random()} className="dia-col">
                      <div className="dia-header">
                        <span className="dia-nombre">{dia?.diaNombre || 'Día'}</span>
                        <span className="dia-fecha">{formatearFecha(dia?.fecha)}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {horas.map((hora) => (
                  <tr key={hora}>
                    <td className="hora-cell">{hora}</td>
                    {agenda.map((dia) => {
                      const bloque = getBloque(dia, hora);
                      return (
                        <td 
                          key={`${dia?.fecha}-${hora}`} 
                          className={`bloque-cell ${getColorClass(bloque)}`}  
                          onClick={() => handleBloqueClick(dia, bloque)}
                          style={{ cursor: bloque && (bloque.reservadoPorMi || bloque.estado === 'Abierto') ? 'pointer' : 'not-allowed' }}
                        >
                          {getBloqueTexto(bloque) && (
                            <div className="bloque-info">
                              <span className="bloque-tramo">{getBloqueTexto(bloque)}</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isMobile && agenda && agenda.length > 0 && (
          <div className="movil-view">
            {!diaSeleccionado ? (
              <div className="dias-lista">
                {agenda.map((dia) => {
                  if (!dia) return null;
                  const disponibles = dia.bloques?.filter(b => b && b.estado === 'Abierto' && !b.reservadoPorMi).length || 0;
                  const misReservas = dia.bloques?.filter(b => b && b.reservadoPorMi).length || 0;
                  
                  return (
                    <div 
                      key={dia.fecha} 
                      className="dia-card"
                      onClick={() => handleDiaClick(dia)}
                    >
                      <div className="dia-card-header">
                        <span className="dia-card-nombre">{dia.diaNombre}</span>
                        <span className="dia-card-fecha">{formatearFecha(dia.fecha)}</span>
                      </div>
                      <div className="dia-card-stats">
                        {misReservas > 0 && (
                          <span className="stats-badge mis-reservas">
                            🟢 {misReservas} {misReservas === 1 ? 'reserva' : 'reservas'}
                          </span>
                        )}
                        {disponibles > 0 && (
                          <span className="stats-badge disponibles">
                            🔵 {disponibles} disponibles
                          </span>
                        )}
                      </div>
                      <i className="fas fa-chevron-right dia-card-arrow"></i>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="dia-detalle">
                <div className="detalle-header">
                  <button className="btn-volver" onClick={volverADias}>
                    <i className="fas fa-arrow-left"></i> Volver
                  </button>
                  <h2>{diaSeleccionado.diaNombre}</h2>
                  <p className="detalle-fecha">{formatearFechaLegible(diaSeleccionado.fecha)}</p>
                </div>

                <div className="horas-lista">
                  {diaSeleccionado.bloques?.map((bloque) => {
                    if (!bloque) return null;
                    const colorFondo = getColorStyle(bloque);
                    const texto = getBloqueTexto(bloque);
                    const esInteractivo = bloque?.reservadoPorMi || bloque?.estado === 'Abierto';
                    
                    return (
                      <div 
                        key={bloque.horaInicio}
                        className="hora-item"
                        style={{ 
                          borderLeftColor: colorFondo,
                          backgroundColor: `${colorFondo}20`,
                          cursor: esInteractivo ? 'pointer' : 'default',
                          opacity: esInteractivo ? 1 : 0.7
                        }}
                        onClick={() => esInteractivo && handleBloqueMovilClick(bloque)}
                      >
                        <div className="hora-item-tiempo">
                          <span className="hora-inicio">{bloque.horaInicio}</span>
                          <span className="hora-separador">-</span>
                          <span className="hora-fin">{bloque.horaFin}</span>
                        </div>
                        <div className="hora-item-info">
                          <span className="hora-estado" style={{ color: colorFondo }}>
                            {texto}
                          </span>
                        </div>
                        {esInteractivo && (
                          <i className={`fas fa-${bloque.reservadoPorMi ? 'eye' : 'plus'}`}></i>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Reserva */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Nueva Reserva</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label>Fecha</label>
                <input type="date" value={fechaSel || ''} readOnly className="form-control" />
              </div>

              <div className="form-group">
                <label>Hora</label>
                <input type="text" value={horaSel || ''} readOnly className="form-control" />
              </div>

              {user?.rol === ROLES.PROFESOR && (
                <div className="form-group">
                  <label>Tipo de Reserva</label>
                  <select 
                    value={tipoReserva || "Laboral"} 
                    onChange={(e) => {
                      setTipoReserva(e.target.value);
                      // Limpiar campos de nivel y licenciatura cuando cambia el tipo
                      if (e.target.value !== "Laboral") {
                        setNivelId(null);
                        setLicId("");
                        setLicenciaturasFiltradas([]);
                      }
                    }}
                    className="form-control"
                  >
                    <option value="Laboral">Laboral (Clase)</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Selecciona el espacio</label>
                <select
                  value={espacioSel}
                  onChange={(e) => setEspacioSel(e.target.value)}
                  className="form-control"
                  required
                >
                  <option value="">-- Selecciona un espacio --</option>
                  {ESPACIOS.map(espacio => (
                    <option key={espacio.id} value={espacio.id}>
                      {espacio.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {user?.rol === ROLES.PROFESOR && tipoReserva === "Laboral" && (
                <>
                  <div className="form-group">
                    <label>Clase a impartir *</label>
                    <input
                      type="text"
                      value={claseImpartir}
                      onChange={(e) => setClaseImpartir(e.target.value)}
                      placeholder=""
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label>Nivel *</label>
                    <select 
                      value={nivelId || ""} 
                      onChange={(e) => {
                        console.log("Nivel seleccionado en el select:", e.target.value);
                        setNivelId(parseInt(e.target.value) || null);
                      }}
                      className="form-control"
                      disabled={catalogosLoading}
                    >
                      <option value="">Seleccionar nivel</option>
                      {niveles.map(nivel => (
                        <option key={nivel.id} value={nivel.id}>
                          {nivel.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {nivelId === 2 && (
                    <div className="form-group">
                      <label>Licenciatura *</label>
                      <select 
                        value={ licId} 
                        onChange={(e) => setLicId(e.target.value)}
                        className="form-control"
                        disabled={catalogosLoading || licenciaturasFiltradas.length === 0}
                      >
                        <option value="">Seleccionar licenciatura</option>
                        {licenciaturasFiltradas.map(lic => (
                          <option key={lic.id} value={lic.id}>
                            {lic.nombre}
                          </option>
                        ))}
                      </select>
                      {licenciaturasFiltradas.length === 0 && nivelId && (
                        <small className="text-muted" style={{ color: '#ff9800' }}>
                          No hay licenciaturas disponibles para este nivel
                        </small>
                      )}
                      {licenciaturasFiltradas.length > 0 && (
                        <small className="text-muted" style={{ color: '#4caf50' }}>
                          {licenciaturasFiltradas.length} licenciatura(s) disponible(s)
                        </small>
                      )}
                    </div>
                  )}
                </>
              )}

              {requiereEquipos && (user?.rol !== ROLES.PROFESOR || tipoReserva !== "Laboral") && (
                <div className="form-group">
                  <label>Equipos adicionales (opcional)</label>
                  {equiposCargados ? (
                    equiposFiltrados && equiposFiltrados.length > 0 ? (
                      <>
                        <select
                          multiple
                          value={equiposSeleccionados}
                          onChange={(e) => {
                            const values = Array.from(e.target.selectedOptions, opt => parseInt(opt.value));
                            setEquiposSeleccionados(values);
                          }}
                          className="form-control"
                          style={{ height: '120px' }}
                        >
                          {equiposFiltrados.map(equipo => {
                            const equipoId = equipo.idEquipo || equipo.id || equipo.equipoId;
                            const nombreEquipo = equipo.nombreEquipo || equipo.nombre || equipo.descripcion || 'Equipo';
                            const codigo = equipo.codigo || '';
                            
                            return (
                              <option key={equipoId} value={equipoId}>
                                {nombreEquipo} {codigo ? `(${codigo})` : ''}
                              </option>
                            );
                          })}
                        </select>
                        <small className="text-muted">Ctrl+clic para seleccionar múltiples equipos</small>
                      </>
                    ) : (
                      <div className="loading-equipos">
                        No hay equipos disponibles para esta área
                      </div>
                    )
                  ) : (
                    <div className="loading-equipos">
                      Cargando equipos...
                    </div>
                  )}
                </div>
              )}

              {user?.rol === ROLES.PROFESOR && tipoReserva === "Laboral" && requiereEquipos && (
                <div className="info-message">
                  <i className="fas fa-info-circle"></i> Las reservas laborales no incluyen equipos adicionales
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowModal(false);
                  limpiarFormulario();
                }}>
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleReservar}
                  disabled={catalogosLoading}
                >
                  Confirmar Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Reserva */}
      {detalleModal && detalle && (
        <div className="modal-overlay">
          <div className="modal modal-detalle">
            <div className="modal-header">
              <h3>Detalle de Reserva</h3>
              <button className="modal-close" onClick={() => setDetalleModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-content">
              <div className="detalle-info">
                <div className="detalle-item">
                  <span className="detalle-label">Área:</span>
                  <span className="detalle-valor">{detalle.nombre_area}</span>
                </div>
                <div className="detalle-item">
                  <span className="detalle-label">Fecha:</span>
                  <span className="detalle-valor"> {detalle.fechaReserva}</span>
                </div>
                <div className="detalle-item">
                  <span className="detalle-label">Hora:</span>
                  <span className="detalle-valor">{detalle.hora_inicio?.substring(0,5)} - {detalle.hora_fin?.substring(0,5)}</span>
                </div>
                <div className="detalle-item">
                  <span className="detalle-label">Asistencia:</span>
                  <span className={`detalle-valor badge ${detalle.Asistencia?.toLowerCase()}`}>{detalle.Asistencia}</span>
                </div>
              </div>

              {detalle.maquinas && detalle.maquinas.length > 0 && (
                <div className="detalle-equipos">
                  <div className="equipos-header">
                    <h4>Equipos asignados</h4>
                    {/* Botón para agregar más equipos - solo si el área es Cardio (ID 2) */}
                    {detalle.nombre_area === "Cardio" && (
                      <button 
                        className="btn-agregar-equipo"
                        onClick={handleAbrirAgregarEquipo}
                      >
                        <i className="fas fa-plus"></i> Agregar equipo
                      </button>
                    )}
                  </div>
                  <div className="equipos-lista">
                    {detalle.maquinas.map((maquina, index) => {
                      const estadoNormalizado = maquina.estado_Uso?.toLowerCase().trim();
                      const usoFinalizado = estadoNormalizado === 'fin uso' || estadoNormalizado === 'finalizado';
                      const usoPendiente = estadoNormalizado === 'pendiente';
                      const usoEnProceso = estadoNormalizado === 'en uso' || estadoNormalizado === 'enuso';
                      
                      return (
                        <div key={index} className="equipo-item">
                          <div className="equipo-header">
                            <span className="equipo-nombre">{maquina.nombre_maquina}</span>
                            <span className={`equipo-estado ${estadoNormalizado}`}>
                              {usoPendiente && 'Pendiente'}
                              {usoEnProceso && 'En uso'}
                              {usoFinalizado && 'Finalizado'}
                            </span>
                          </div>
                          
                          <div className="equipo-contenido">
                            {/* Mostrar horas de uso de la máquina */}
                            {!usoFinalizado && (
                              <>
                                <div className="horas-uso-container">
                                  {/* Hora de inicio del uso */}
                                  {maquina.hora_inicio_uso && (
                                    <div className="horario-item">
                                      <div className="horario-titulo">Hora de inicio de uso</div>
                                      <div className="horario-tiempo">{maquina.hora_inicio_uso}</div>
                                    </div>
                                  )}
                                  
                                  {/* Hora de fin del uso */}
                                  {maquina.hora_fin_uso && (
                                    <div className="horario-item">
                                      <div className="horario-titulo">Hora de finalización de uso</div>
                                      <div className="horario-tiempo">{maquina.hora_fin_uso}</div>
                                    </div>
                                  )}
                                  
                                  {/* Si no hay horas registradas */}
                                  {!maquina.hora_inicio_uso && !maquina.hora_fin_uso && (
                                    <div className="horario-item">
                                      <div className="horario-titulo">Estado del uso</div>
                                      <div className="horario-tiempo sin-registro">
                                        {usoPendiente ? 'Uso no iniciado' : 'Uso en proceso sin registro de hora'}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                
                              </>
                            )}
                            
                          
                            
                            {usoPendiente && detalle.Asistencia === "Asistió" && (
                              <button 
                                className="btn-registrar-uso btn-iniciar"
                                onClick={() => handleRegistrarUso(maquina.reserva_Equipo, maquina.estado_Uso)}
                              >
                                Iniciar uso
                              </button>
                            )}
                            
                            {usoEnProceso && detalle.Asistencia === "Asistió" && (
                              <button 
                                className="btn-registrar-uso btn-finalizar"
                                onClick={() => handleRegistrarUso(maquina.reserva_Equipo, maquina.estado_Uso)}
                              >
                                Finalizar uso
                              </button>
                            )}
                            
                            {usoFinalizado && (
                              <div className="uso-finalizado">
                                ✓ Uso finalizado
                                {/* Mostrar horas también cuando está finalizado */}
                                {maquina.hora_inicio_uso && (
                                  <div className="horario-item-finalizado">
                                    <span>Inicio: {maquina.hora_inicio_uso}</span>
                                    {maquina.hora_fin_uso && <span>Fin: {maquina.hora_fin_uso}</span>}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(!detalle.maquinas || detalle.maquinas.length === 0) && detalle.id_area === 2 && (
                <div className="detalle-sin-equipos">
                  <p>Esta reserva no tiene equipos asignados.</p>
                  <button 
                    className="btn-agregar-equipo-primario"
                    onClick={handleAbrirAgregarEquipo}
                  >
                    <i className="fas fa-plus"></i> Agregar equipo a la reserva
                  </button>
                </div>
              )}

              {(!detalle.maquinas || detalle.maquinas.length === 0) && detalle.id_area !== 2 && (
                <div className="detalle-sin-equipos">
                  <p>Esta reserva no requiere equipos.</p>
                </div>
              )}

              <div className="modal-actions">
                <button 
                  className="btn btn-danger" 
                  onClick={handleCancelarReservaDetalle}
                >
                  Cancelar Reserva
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setDetalleModal(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar equipo */}
      {showAgregarEquipoModal && (
        <div className="modal-overlay">
          <div className="modal modal-small">
            <div className="modal-header">
              <h3>Agregar equipo a la reserva</h3>
              <button className="modal-close" onClick={() => {
                setShowAgregarEquipoModal(false);
                setEquipoSeleccionadoAgregar("");
              }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label>Selecciona el equipo</label>
                <select
                  value={equipoSeleccionadoAgregar}
                  onChange={(e) => setEquipoSeleccionadoAgregar(e.target.value)}
                  className="form-control"
                  disabled={agregandoEquipo}
                >
                  <option value="">-- Selecciona un equipo --</option>
                  {equiposDisponibles.map(equipo => {
                    const equipoId = equipo.idEquipo || equipo.id || equipo.equipoId;
                    const nombreEquipo = equipo.nombreEquipo || equipo.nombre || equipo.descripcion || 'Equipo';
                    const codigo = equipo.codigo || '';
                    
                    return (
                      <option key={equipoId} value={equipoId}>
                        {nombreEquipo} {codigo ? `(${codigo})` : ''}
                      </option>
                    );
                  })}
                </select>
                {equiposDisponibles.length === 0 && (
                  <small className="text-muted" style={{ color: '#ff9800' }}>
                    No hay equipos disponibles para agregar
                  </small>
                )}
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowAgregarEquipoModal(false);
                    setEquipoSeleccionadoAgregar("");
                  }}
                  disabled={agregandoEquipo}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleAgregarEquipo}
                  disabled={agregandoEquipo || !equipoSeleccionadoAgregar}
                >
                  {agregandoEquipo ? 'Agregando...' : 'Agregar equipo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}