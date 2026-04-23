import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useAsistenciasReservas from '../hook/useAsistenciayReserva';
import Alert from '../../../components/Alert';
import apiClient from '../../../service/apiClient';
import '../../../assets/styles/ListadoAsistenciayReservas.css';
import ModalAgregarReserva from './ModalAgregarReserva';
import { useReserva } from '../../Reserva/hook/useReserva';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from 'react-datepicker';
import es from 'date-fns/locale/es';

// Registrar el locale español
registerLocale('es', es);

const AREAS = [
  { id: 1, nombre: "Gimnasio", color: "#4CAF50", icono: <i className="fas fa-dumbbell"></i> },
  { id: 2, nombre: "Cardio", color: "#2196F3", icono: <i className="fas fa-running"></i> },
  { id: 3, nombre: "TRX", color: "#FF9800", icono: <i className="fas fa-link"></i> },
  { id: 4, nombre: "Cancha Bolada", color: "#9C27B0", icono: <i className="fas fa-futbol fa-spin"></i> },
  { id: 5, nombre: "Cancha de Tenis", color: "#F44336", icono: <i className="fas fa-table-tennis"></i> },
];

const HORAS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];

// Constantes para mensajes
const ALERT_DURATION = 3000;
const ERROR_MESSAGES = {
  LOAD_HORARIOS: 'Error al cargar los horarios',
  LOAD_DETALLES: 'Error al cargar los detalles de la reserva',
  REGISTRAR_ASISTENCIA: 'Error al registrar asistencia'
};

const ListadoAsistenciayReservas = () => {
  const [areaSeleccionada, setAreaSeleccionada] = useState(1);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [bloqueSeleccionado, setBloqueSeleccionado] = useState(null);
  const [alert, setAlert] = useState({ show: false, tipo: '', texto: '' });
  const [cargandoSemana, setCargandoSemana] = useState(false);
  const [modalAgregarAbierto, setModalAgregarAbierto] = useState(false);
  const [bloqueParaAgregar, setBloqueParaAgregar] = useState(null);
  const [equiposCargados, setEquiposCargados] = useState(false);
  
  // Estados para manejo de fechas
  const [fechaActual, setFechaActual] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [horarios, setHorarios] = useState([]); // Estado local para horarios

  const { crearReserva, crearReservaParaUsuario, equipos, obtenerEquipos, loading: reservaLoading } = useReserva();

  const BASE_URL = apiClient.defaults.baseURL;

  const {
    horarios: horariosHook,
    detallesUsuario,
    loading: loadingHorarios,
    error,
    fetchHorarios,
    fetchHorariosPorFecha,
    fetchDetallesUsuario,
    handleRegistrarAsistencia
  } = useAsistenciasReservas();

  // Memoizar área actual
  const areaActual = useMemo(() => 
    AREAS.find(a => a.id === areaSeleccionada), 
    [areaSeleccionada]
  );

  // Función para obtener el lunes de la semana de una fecha dada
  const obtenerLunesDeSemana = useCallback((fecha) => {
    const nuevaFecha = new Date(fecha);
    const dia = nuevaFecha.getDay();
    const diff = dia === 0 ? 6 : dia - 1;
    nuevaFecha.setDate(nuevaFecha.getDate() - diff);
    return nuevaFecha;
  }, []);

  // Función para cargar la semana basada en una fecha
  const cargarSemana = useCallback(async (fecha) => {
    setCargandoSemana(true);
    try {
      const fechaStr = fecha.toISOString().split('T')[0];
      const datosSemana = await fetchHorariosPorFecha(fechaStr, areaSeleccionada);
      
      if (datosSemana && datosSemana.length > 0) {
        setHorarios(datosSemana);
      } else {
        // Si no hay horarios para la fecha, cargar semana actual
        const hoy = new Date();
        const lunesHoy = obtenerLunesDeSemana(hoy);
        const fechaHoyStr = lunesHoy.toISOString().split('T')[0];
        const datosHoy = await fetchHorariosPorFecha(fechaHoyStr, areaSeleccionada);
        setHorarios(datosHoy || []);
        setFechaActual(lunesHoy);
        if (datosHoy?.length === 0) {
          showAlert('No hay horarios disponibles para esta semana', 'info');
        }
      }
    } catch (err) {
      console.error('Error al cargar semana:', err);
      showAlert(ERROR_MESSAGES.LOAD_HORARIOS, 'error');
    } finally {
      setCargandoSemana(false);
      setShowCalendar(false);
    }
  }, [areaSeleccionada, fetchHorariosPorFecha, obtenerLunesDeSemana]);

  // Cargar horarios al cambiar de área o al iniciar
  useEffect(() => {
    const lunesActual = obtenerLunesDeSemana(fechaActual);
    setFechaActual(lunesActual);
    cargarSemana(lunesActual);
  }, [areaSeleccionada]);

  // Sincronizar horarios del hook con el estado local
  useEffect(() => {
    if (horariosHook && horariosHook.length > 0) {
      setHorarios(horariosHook);
    }
  }, [horariosHook]);

  useEffect(() => {
    const cargarEquipos = async () => {
      try {
        await obtenerEquipos();
      } catch (err) {
        console.error('Error cargando equipos:', err);
      } finally {
        setEquiposCargados(true);
      }
    };
    cargarEquipos();
  }, [obtenerEquipos]);

  const showAlert = useCallback((texto, tipo = 'success') => {
    setAlert({ show: true, tipo, texto });
    setTimeout(() => {
      setAlert({ show: false, tipo: '', texto: '' });
    }, ALERT_DURATION);
  }, []);

  // Navegación entre semanas
  const semanaAnterior = useCallback(async () => {
    const nuevaFecha = new Date(fechaActual);
    nuevaFecha.setDate(nuevaFecha.getDate() - 7);
    setFechaActual(nuevaFecha);
    await cargarSemana(nuevaFecha);
  }, [fechaActual, cargarSemana]);

  const semanaSiguiente = useCallback(async () => {
    const nuevaFecha = new Date(fechaActual);
    nuevaFecha.setDate(nuevaFecha.getDate() + 7);
    setFechaActual(nuevaFecha);
    await cargarSemana(nuevaFecha);
  }, [fechaActual, cargarSemana]);

  const irSemanaActual = useCallback(async () => {
    const nuevaFecha = new Date();
    setFechaActual(nuevaFecha);
    await cargarSemana(nuevaFecha);
  }, [cargarSemana]);

  const handleDateSelect = useCallback((date) => {
    const lunesSemana = obtenerLunesDeSemana(date);
    setFechaActual(lunesSemana);
    cargarSemana(lunesSemana);
  }, [obtenerLunesDeSemana, cargarSemana]);

  const handleBloqueClick = useCallback((dia, hora, bloque) => {
    if (!dia || !hora) return;
    
    setBloqueSeleccionado({
      dia: dia.dia,
      fecha: dia.fecha,
      hora: hora,
      horaFin: obtenerHoraFin(hora),
      usuarios: bloque?.usuarios || [],
      estadoHorario: bloque?.estadoHorario,
      ocupacion: bloque?.ocupacion,
      esExcepcion: bloque?.esExcepcion,
      horarioId: bloque?.horarioId
    });
    setModalAbierto(true);
  }, []);

  // Función para abrir el modal de agregar reserva
  const esFechaHoraPasada = useCallback((fechaReserva, horaInicio) => {
    if (!fechaReserva || !horaInicio) return false;
    const fechaHoraReserva = new Date(`${fechaReserva}T${horaInicio}:00`);
    const ahora = new Date();
    const minutosTranscurridos = (ahora - fechaHoraReserva) / (1000 * 60);
    return minutosTranscurridos > 30;
  }, []);

  const handleAbrirAgregarReserva = useCallback(() => {
    if (!bloqueSeleccionado) {
      console.warn("No hay bloque seleccionado");
      return;
    }
    
    if (!bloqueSeleccionado.horarioId) {
      showAlert('Error: El bloque no tiene un horario válido', 'error');
      return;
    }

    if (esFechaHoraPasada(bloqueSeleccionado.fecha, bloqueSeleccionado.hora)) {
      showAlert('No se pueden hacer reservas en un horario que ya ha pasado', 'error');
      return;
    }
    
    setBloqueParaAgregar({
      fecha: bloqueSeleccionado.fecha,
      hora: bloqueSeleccionado.hora,
      horaFin: bloqueSeleccionado.horaFin,
      horarioId: bloqueSeleccionado.horarioId
    });
    setModalAgregarAbierto(true);
  }, [bloqueSeleccionado, esFechaHoraPasada, showAlert]);

  // Función para manejar la creación de reserva
  const handleCrearReserva = useCallback(async (reservaData) => {
    console.log("=== handleCrearReserva iniciado ===");
    console.log("reservaData:", reservaData);
    
    try {
        if (!crearReservaParaUsuario || typeof crearReservaParaUsuario !== 'function') {
            console.error("crearReservaParaUsuario no está definida o no es una función");
            showAlert('Error: La función crearReserva no está disponible', 'error');
            return;
        }
        
        console.log("Llamando a crearReservaParaUsuario...");
        const resultado = await crearReservaParaUsuario(reservaData);
        console.log("Reserva creada exitosamente:", resultado);
        
        showAlert('Reserva creada exitosamente', 'success');
        setModalAgregarAbierto(false);
        setBloqueParaAgregar(null);
        
        // Recargar horarios para actualizar la vista
        console.log("Recargando horarios...");
        await cargarSemana(fechaActual);
        console.log("Proceso completado");
        
    } catch (err) {
        console.error("Error en handleCrearReserva:", err);
        console.error("Detalle del error:", err.message);
        showAlert(err.message || 'Error al crear la reserva', 'error');
    }
  }, [crearReservaParaUsuario, cargarSemana, fechaActual, showAlert]); 

  const handleVerDetalleUsuario = useCallback(async (idReserva) => {
    if (!idReserva) {
      showAlert('ID de reserva no válido', 'error');
      return;
    }
    
    try {
      await fetchDetallesUsuario(idReserva);
      setModalAbierto(false);
      setModalDetalleAbierto(true);
    } catch (error) {
      const mensaje = error.response?.data?.detail || error.message || ERROR_MESSAGES.LOAD_DETALLES;
      showAlert(mensaje, 'error');
    }
  }, [fetchDetallesUsuario, showAlert]);

const handleRegistrarAsistenciaClick = useCallback(async (idReserva, e) => {
  if (e) e.stopPropagation();
  
  if (!idReserva) {
    showAlert('ID de reserva no válido', 'error');
    return;
  }
  
  try {
    const response = await handleRegistrarAsistencia(idReserva);
    
    console.log("Respuesta del backend:", response);
    
    // El backend devuelve: { idReserva, mensaje, nuevo_estado }
    const exito = response?.nuevo_estado === "Asistió" || 
                  response?.mensaje?.includes("confirmada") ||
                  response?.success === true ||
                  response?.exito === true;
    
    const mensaje = response?.mensaje || response?.message || 'Asistencia registrada exitosamente';
    
    if (exito) {
      showAlert(mensaje, 'success');
      await cargarSemana(fechaActual);
      
      if (bloqueSeleccionado) {
        const diaActualizado = horarios.find(d => d.fecha === bloqueSeleccionado.fecha);
        if (diaActualizado) {
          const bloqueActualizado = diaActualizado.bloques?.find(b => b.horaInicio === bloqueSeleccionado.hora);
          if (bloqueActualizado) {
            setBloqueSeleccionado(prev => ({
              ...prev,
              usuarios: bloqueActualizado.usuarios || [],
              ocupacion: bloqueActualizado.ocupacion,
              estadoHorario: bloqueActualizado.estadoHorario
            }));
          }
        }
      }
      
      if (modalDetalleAbierto && detallesUsuario) {
        const idReservaActual = detallesUsuario.reservaId || detallesUsuario.id;
        if (idReservaActual) {
          await fetchDetallesUsuario(idReservaActual);
        }
      }
      
  
      
    } else {
      showAlert(mensaje || 'Error al registrar asistencia', 'error');
    }
  } catch (error) {
    const mensaje = error.response?.data?.detail || 
                    error.response?.data?.mensaje ||
                    error.message || 
                    ERROR_MESSAGES.REGISTRAR_ASISTENCIA;
    showAlert(mensaje, 'error');
  }
}, [handleRegistrarAsistencia, cargarSemana, fechaActual, showAlert, bloqueSeleccionado, horarios, modalDetalleAbierto, detallesUsuario, fetchDetallesUsuario]);
  const handleCerrarModal = useCallback(() => {
    setModalAbierto(false);
    setBloqueSeleccionado(null);
  }, []);

  const handleCerrarModalDetalle = useCallback(() => {
    setModalDetalleAbierto(false);
  }, []);

  const getColorClass = useCallback((estadoHorario) => {
    switch (estadoHorario?.toLowerCase()) {
      case 'abierto':
        return 'abierto';
      case 'cerrado':
        return 'cerrado';
      case 'sin programación':
      case 'sin programacion':
        return 'sin-programacion';
      default:
        return 'sin-programacion';
    }
  }, []);

  const getOcupacionTexto = useCallback((ocupacion) => {
    return ocupacion || '0/10';
  }, []);

  const getBloque = useCallback((dia, hora) => {
    if (!dia?.bloques || !hora) return null;
    return dia.bloques.find(b => b.horaInicio === hora);
  }, []);

  const obtenerHoraFin = useCallback((horaInicio) => {
    const index = HORAS.indexOf(horaInicio);
    if (index < HORAS.length - 1 && index !== -1) {
      return HORAS[index + 1];
    }
    return horaInicio;
  }, []);

  const formatearFecha = useCallback((fechaStr) => {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr + 'T00:00:00');
    return fecha.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric' 
    });
  }, []);

  const getRangoSemana = useCallback(() => {
    if (horarios.length === 0) return 'Cargando...';
    const inicio = formatearFecha(horarios[0]?.fecha);
    const fin = formatearFecha(horarios[horarios.length - 1]?.fecha);
    return `${inicio} - ${fin}`;
  }, [horarios, formatearFecha]);

  const isLoading = loadingHorarios || cargandoSemana;

  if (isLoading && horarios.length === 0) {
    return (
      <div className="horario-loading">
        <div className="loading-spinner"></div>
        <p>Cargando horario...</p>
      </div>
    );
  }

  return (
    <div className="asistencias-reservas-page">
      {alert.show && (
        <Alert
          message={alert.texto}
          type={alert.tipo}
          onClose={() => setAlert({ show: false, tipo: '', texto: '' })}
        />
      )}

      <div className="asistencias-container">
        {/* Barra unificada con todo (título, área, selector de semana y actualizar) */}
        <div className="header-unificado">
          <div className="header-top">
            <div className="header-title-section">
              <h1 className="page-title">Gestión de Asistencias y Reservas</h1>
              <div className="area-badge" style={{ backgroundColor: `${areaActual?.color}20`, color: areaActual?.color }}>
                <span className="area-icon">{areaActual?.icono}</span>
                <span>{areaActual?.nombre}</span>
              </div>
            </div>
            
            <div className="header-actions">
              <button 
                className="btn-refresh"
                onClick={() => cargarSemana(fechaActual)}
                disabled={isLoading}
              >
                <i className="fas fa-sync-alt"></i>
                <span>Actualizar</span>
              </button>
            </div>
          </div>
          
          <div className="header-bottom">
            <div className="selector-semana">
              <div className="semana-badge" onClick={() => setShowCalendar(!showCalendar)} style={{ cursor: 'pointer' }}>
                <i className="fas fa-calendar-week"></i>
                <span>{getRangoSemana()}</span>
                <i className="fas fa-chevron-down" style={{ marginLeft: '8px', fontSize: '12px' }}></i>
              </div>
              
              {showCalendar && (
                <div className="calendar-popup">
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

            <div className="nav-semana">
              <button 
                onClick={semanaAnterior} 
                disabled={isLoading} 
                className="nav-btn" 
                title="Semana anterior"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <button 
                onClick={irSemanaActual} 
                className="btn-hoy" 
                disabled={isLoading}
              >
                <i className="fas fa-calendar-day"></i>
                <span>Hoy</span>
              </button>
              <button 
                onClick={semanaSiguiente} 
                disabled={isLoading} 
                className="nav-btn" 
                title="Semana siguiente"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
        
        <AreasTabs 
          areas={AREAS}
          areaSeleccionada={areaSeleccionada}
          onAreaChange={setAreaSeleccionada}
        />
        
        <Leyenda />
        
        <HorarioTable
          horarios={horarios}
          horas={HORAS}
          cargandoSemana={cargandoSemana}
          getBloque={getBloque}
          getColorClass={getColorClass}
          getOcupacionTexto={getOcupacionTexto}
          onBloqueClick={handleBloqueClick}
          onRefresh={() => cargarSemana(fechaActual)}
          formatearFecha={formatearFecha}
        />
      </div>

      {modalAbierto && bloqueSeleccionado && (
        <ModalReservas
          bloqueSeleccionado={bloqueSeleccionado}
          onClose={handleCerrarModal}
          onVerDetalle={handleVerDetalleUsuario}
          onRegistrarAsistencia={handleRegistrarAsistenciaClick}
          onAgregarReserva={handleAbrirAgregarReserva} 
          getColorClass={getColorClass}
          BASE_URL={BASE_URL}
        />
      )}

      {modalDetalleAbierto && detallesUsuario && (
        <ModalDetalleUsuario
          detallesUsuario={detallesUsuario}
          onClose={handleCerrarModalDetalle}
          onRegistrarAsistencia={handleRegistrarAsistenciaClick}
          reservaSeleccionada={detallesUsuario.reservaId || detallesUsuario.id}
          loading={isLoading}
          BASE_URL={BASE_URL}
        />
      )}

      <ModalAgregarReserva
        isOpen={modalAgregarAbierto}
        onClose={() => {
          setModalAgregarAbierto(false);
          setBloqueParaAgregar(null);
        }}
        bloqueSeleccionado={bloqueParaAgregar}
        areaId={areaSeleccionada}
        areaNombre={areaActual ? areaActual.nombre : ''}
        equipos={equipos}
        equiposCargados={equiposCargados}
        onCreateReserva={handleCrearReserva}
        loading={reservaLoading}
      />
    </div>
  );
};

// AreasTabs component
const AreasTabs = ({ areas, areaSeleccionada, onAreaChange }) => (
  <div className="areas-tabs">
    {areas.map(area => (
      <button
        key={area.id}
        className={`tab-btn ${areaSeleccionada === area.id ? 'active' : ''}`}
        onClick={() => onAreaChange(area.id)}
        style={{
          borderBottomColor: areaSeleccionada === area.id ? area.color : 'transparent',
          color: areaSeleccionada === area.id ? area.color : '#64748b'
        }}
      >
        <span className="tab-icon">{area.icono}</span>
        <span>{area.nombre}</span>
      </button>
    ))}
  </div>
);

// Leyenda component
const Leyenda = () => (
  <div className="horario-leyenda">
    <div className="leyenda-item">
      <span className="color-box color-abierto"></span>
      <span>Abierto</span>
    </div>
    <div className="leyenda-item">
      <span className="color-box color-cerrado"></span>
      <span>Cerrado</span>
    </div>
    <div className="leyenda-item">
      <span className="color-box color-sin-programacion"></span>
      <span>Sin programación</span>
    </div>
    <div className="leyenda-item">
      <i className="fas fa-users"></i>
      <span>Click en bloque para ver reservas</span>
    </div>
  </div>
);

// HorarioTable component
const HorarioTable = ({ 
  horarios, 
  horas, 
  cargandoSemana, 
  getBloque, 
  getColorClass, 
  getOcupacionTexto, 
  onBloqueClick,
  onRefresh,
  formatearFecha
}) => {
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  if (!horarios || horarios.length === 0) {
    return (
      <div className="no-data">
        <p>No hay horarios disponibles para esta área</p>
        <button className="btn-reintentar" onClick={onRefresh}>
          <i className="fas fa-sync-alt"></i> Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="horario-tabla-container">
      {cargandoSemana && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Cargando semana...</p>
        </div>
      )}
      
      <table className="horario-tabla">
        <thead>
          <tr>
            <th className="hora-col">Hora</th>
            {diasSemana.map((dia) => {
              const diaData = horarios.find(d => d.dia === dia);
              return (
                <th key={dia} className="dia-col">
                  <div className="dia-header">
                    <span className="dia-nombre">{dia}</span>
                    {diaData && (
                      <span className="dia-fecha">{formatearFecha(diaData.fecha)}</span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {horas.map((hora) => (
            <tr key={hora}>
              <td className="hora-cell">{hora}</td>
              {diasSemana.map((dia) => {
                const diaData = horarios.find(d => d.dia === dia);
                const bloque = diaData ? getBloque(diaData, hora) : null;
                const colorClass = bloque ? getColorClass(bloque.estadoHorario) : 'sin-programacion';
                const ocupacion = getOcupacionTexto(bloque?.ocupacion);
                const tieneUsuarios = bloque?.usuarios && bloque.usuarios.length > 0;
                
                return (
                  <td 
                    key={`${dia}-${hora}`} 
                    className={`bloque-cell ${colorClass} ${tieneUsuarios ? 'has-reservas' : ''}`}
                    onClick={() => onBloqueClick(diaData, hora, bloque)}
                    title={tieneUsuarios ? `${bloque.usuarios.length} reserva(s) - Click para ver` : 'Sin reservas'}
                  >
                    <div className="bloque-content">
                      <div className="ocupacion-compact">
                        <i className="fas fa-users"></i>
                        <span>{ocupacion}</span>
                      </div>
                      
                      {tieneUsuarios && (
                        <div className="reservas-indicator">
                          <i className="fas fa-calendar-check"></i>
                          <span>{bloque.usuarios.length}</span>
                        </div>
                      )}
                    </div>
                    
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ModalReservas component
const ModalReservas = ({ 
  bloqueSeleccionado, 
  onClose, 
  onVerDetalle, 
  onRegistrarAsistencia, 
  onAgregarReserva,
  getColorClass, 
  BASE_URL 
}) => {
  const [imageErrors, setImageErrors] = useState({});
  const [fotoVersions, setFotoVersions] = useState({});

  const getFotoUrl = (foto, userId) => {
    if (!foto) return null;
    
    if (foto.startsWith('http')) {
      return foto;
    }
    
    const version = fotoVersions[userId] || 0;
    return `${BASE_URL}/static/fotos/${foto}?v=${version}`;
  };

  const handleImageError = (userId) => {
    setImageErrors(prev => ({ ...prev, [userId]: true }));
  };

  const retryImage = (userId, e) => {
    e.stopPropagation();
    setFotoVersions(prev => ({ ...prev, [userId]: (prev[userId] || 0) + 1 }));
    setImageErrors(prev => ({ ...prev, [userId]: false }));
  };

  const estaAbierto = bloqueSeleccionado?.estadoHorario?.toLowerCase() === 'abierto';

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modal-container">
        <div className="modal-header">
          <h3>
            <i className="fas fa-calendar-alt"></i>
            Reservas - {bloqueSeleccionado.dia} {bloqueSeleccionado.hora} - {bloqueSeleccionado.horaFin}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="modal-body">
          <div className="bloque-info-modal">
            <div className="info-item">
              <span className="info-label">Fecha</span>
              <span className="info-value">{bloqueSeleccionado.fecha}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Horario</span>
              <span className="info-value">{bloqueSeleccionado.hora} - {bloqueSeleccionado.horaFin}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Estado</span>
              <span className={`estado-badge ${getColorClass(bloqueSeleccionado.estadoHorario)}`}>
                {bloqueSeleccionado.estadoHorario || 'Sin programación'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Ocupación</span>
              <span className="info-value">{bloqueSeleccionado.ocupacion || '0/10'}</span>
            </div>
          </div>

          {estaAbierto && (
            <div className="agregar-reserva-btn-container">
              <button 
                className="btn-agregar-reserva"
                onClick={onAgregarReserva}
              >
                <i className="fas fa-plus"></i>
                Agregar Nueva Reserva
              </button>
            </div>
          )}

          <div className="usuarios-lista-modal">
            <h4>
              <i className="fas fa-users"></i>
              Reservaciones ({bloqueSeleccionado.usuarios.length})
            </h4>
            
            {bloqueSeleccionado.usuarios.length === 0 ? (
              <div className="no-reservas-modal">
                <p>No hay reservas en este horario</p>
                {estaAbierto && (
                  <p className="sugerencia-texto">
                    <i className="fas fa-info-circle"></i>
                    Haz clic en "Agregar Nueva Reserva" para crear una
                  </p>
                )}
              </div>
            ) : (
              bloqueSeleccionado.usuarios.map((usuario, idx) => {
                const estadoReserva = usuario['estado Reserva'];
                const esPendiente = estadoReserva?.toLowerCase() === 'pendiente';
                const hasError = imageErrors[usuario.id];
                
                return (
                  <div 
                    key={idx} 
                    className={`usuario-card ${estadoReserva?.toLowerCase()}`}
                    onClick={() => onVerDetalle(usuario.reservaId)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="usuario-avatar">
                      {usuario.foto && !hasError ? (
                        <img 
                          src={getFotoUrl(usuario.foto, usuario.id)}
                          alt={usuario.usuario}
                          className="usuario-avatar-img"
                          onError={() => handleImageError(usuario.id)}
                        />
                      ) : (
                        <div className="usuario-avatar-placeholder">
                          {usuario.usuario?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      {hasError && usuario.foto && (
                        <button 
                          className="avatar-retry-btn"
                          onClick={(e) => retryImage(usuario.id, e)}
                          title="Reintentar cargar imagen"
                        >
                          <i className="fas fa-sync-alt"></i>
                        </button>
                      )}
                    </div>
                    <div className="usuario-info">
                      <div className="usuario-nombre">{usuario.usuario}</div>
                      <div className="usuario-rol">{usuario.rol}</div>
                    </div>
                    <div className="usuario-estado">
                      <span className={`estado-reserva ${estadoReserva?.toLowerCase()}`}>
                        {estadoReserva === 'Asistió' ? (
                          <i className="fas fa-check-circle" style={{ color: '#28a745', marginRight: '6px' }}></i>
                        ) : estadoReserva === 'Pendiente' ? (
                          <i className="fas fa-hourglass-half" style={{ color: '#ffc107', marginRight: '6px' }}></i>
                        ) : (
                          <i className="fas fa-ban" style={{ color: '#dc3545', marginRight: '6px' }}></i>
                        )} {estadoReserva}
                      </span>
                      {esPendiente && (
                        <button
                          className="btn-asistencia"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRegistrarAsistencia(usuario.reservaId, e);
                          }}
                        >
                          <i className="fas fa-check"></i>
                          Registrar
                        </button>
                      )}
                    </div>
                    {usuario.motivoCancelacion && (
                      <div className="motivo-cancelacion" title={usuario.motivoCancelacion}>
                        <i className="fas fa-exclamation-triangle"></i>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ModalDetalleUsuario component
const ModalDetalleUsuario = ({ detallesUsuario, onClose, onRegistrarAsistencia, reservaSeleccionada, loading, BASE_URL }) => {
  const [imageError, setImageError] = useState(false);
  const [fotoVersion, setFotoVersion] = useState(0);

  useEffect(() => {
    setImageError(false);
  }, [detallesUsuario?.foto]);

  const getFotoUrl = () => {
    if (!detallesUsuario?.foto) return null;
    
    if (detallesUsuario.foto.startsWith('http')) {
      return detallesUsuario.foto;
    }
    
    return `${BASE_URL}/static/fotos/${detallesUsuario.foto}?v=${fotoVersion}`;
  };

  const getEstadoIcon = useCallback((estado) => {
    switch (estado?.toLowerCase()) {
      case 'asistió':
        return '✓';
      case 'pendiente':
        return '○';
      case 'cancelado':
        return '✗';
      default:
        return '•';
    }
  }, []);

  const getEstadoClass = useCallback((estado) => {
    return estado?.toLowerCase() || '';
  }, []);

  const esReservaLaboral = detallesUsuario?.detalle_laboral && 
                           detallesUsuario.detalle_laboral.tipo_reserva === 'Laboral';
  const esReservaCardio = detallesUsuario?.info_cardio && detallesUsuario.info_cardio.length > 0;

  if (!detallesUsuario) return null;

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modal-container modal-large">
        <div className="modal-header" style={{ backgroundColor: '#BB3535' }}>
          <h3>
            <i className="fas fa-user-circle"></i>
            Detalle de Reserva
            {esReservaLaboral && <span className="badge-profesor" style={{ marginLeft: '10px' }}>- Clase Laboral</span>}
            {esReservaCardio && <span className="badge-cardio" style={{ marginLeft: '10px' }}>- Cardio</span>}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="modal-body">
          <div className="detalle-usuario-perfil">
            <div className="perfil-foto-container">
              {detallesUsuario.foto && !imageError ? (
                <img 
                  key={`foto-detalle-${fotoVersion}`}
                  src={getFotoUrl()}
                  alt={`Foto de ${detallesUsuario.nombre}`}
                  className="perfil-foto-circular"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="perfil-foto-placeholder">
                  {detallesUsuario.nombre?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="perfil-info">
              <h3 className="perfil-nombre">{detallesUsuario.nombre}</h3>
              <div className="perfil-correo">
                <i className="fas fa-envelope"></i>
                <span>{detallesUsuario.correo || 'No especificado'}</span>
              </div>
              <div className={`perfil-estado ${getEstadoClass(detallesUsuario.estado_reserva)}`}>
                <span className="estado-icon">{getEstadoIcon(detallesUsuario.estado_reserva)}</span>
                <span className="estado-texto">{detallesUsuario.estado_reserva || 'No especificado'}</span>
              </div>
            </div>
          </div>

          <div className="detalle-grid-container">
            <div className="detalle-card">
              <div className="card-header">
                <i className="fas fa-calendar-alt" style={{ color: '#BB3535' }}></i>
                <h4>Información de la Reserva</h4>
              </div>
              <div className="card-content">
                <div className="info-row">
                  <span className="info-label">Estado</span>
                  <span className={`estado-text ${getEstadoClass(detallesUsuario.estado_reserva)}`}>
                    {detallesUsuario.estado_reserva || 'No especificado'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Rol</span>
                  <span>
                   {detallesUsuario.rol_usuario === 'Profesor' ? (
  <><i className="fas fa-chalkboard-user" style={{ color: '#2196F3', marginRight: '6px' }}></i> Profesor</>
) : detallesUsuario.rol_usuario === 'Alumno' ? (
  <><i className="fas fa-user-graduate" style={{ color: '#4CAF50', marginRight: '6px' }}></i> Alumno</>
) : (
  <><i className="fas fa-user" style={{ color: '#9E9E9E', marginRight: '6px' }}></i> {detallesUsuario.rol_usuario || 'No especificado'}</>
)}
                  </span>
                </div>
                {detallesUsuario.fecha_reserva && (
                  <div className="info-row">
                    <span className="info-label">Fecha</span>
                    <span>{detallesUsuario.fecha_reserva}</span>
                  </div>
                )}
                {detallesUsuario.hora_inicio && detallesUsuario.hora_fin && (
                  <div className="info-row">
                    <span className="info-label">Horario</span>
                    <span>{detallesUsuario.hora_inicio} - {detallesUsuario.hora_fin}</span>
                  </div>
                )}
                {detallesUsuario.area && (
                  <div className="info-row">
                    <span className="info-label">Área</span>
                    <span>{detallesUsuario.area}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="detalle-card">
              <div className="card-header">
                <i className="fas fa-user" style={{ color: '#BB3535' }}></i>
                <h4>Información Personal</h4>
              </div>
              <div className="card-content">
                <div className="info-row">
                  <span className="info-label">Nombre completo</span>
                  <span>{detallesUsuario.nombre || 'No especificado'}</span>
                </div>
                {detallesUsuario.nivel_academico && (
                  <div className="info-row">
                    <span className="info-label">Nivel académico</span>
                    <span>{detallesUsuario.nivel_academico}</span>
                  </div>
                )}
                {detallesUsuario.licenciatura && detallesUsuario.licenciatura !== 'N/A' && (
                  <div className="info-row">
                    <span className="info-label">Licenciatura</span>
                    <span>{detallesUsuario.licenciatura}</span>
                  </div>
                )}
              </div>
            </div>

            {esReservaLaboral && (
              <div className="detalle-card laboral-card">
                <div className="card-header">
                  <i className="fas fa-chalkboard-teacher" style={{ color: '#BB3535' }}></i>
                  <h4>Información de la Clase</h4>
                </div>
                <div className="card-content">
                  <div className="info-row">
                    <span className="info-label">Tipo de reserva</span>
                    <span>
                      <i className="fas fa-briefcase"></i>
                      {detallesUsuario.detalle_laboral.tipo_reserva || 'No especificado'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Clase a impartir</span>
                    <span>
                      <i className="fas fa-chalkboard"></i>
                      {detallesUsuario.detalle_laboral.clase || 'No especificado'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Licenciatura</span>
                    <span>
                      <i className="fas fa-graduation-cap"></i>
                      {detallesUsuario.detalle_laboral.licenciatura_destino || 'No especificado'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {esReservaCardio && (
              <div className="detalle-card">
                <div className="card-header">
                  <i className="fas fa-heartbeat" style={{ color: '#BB3535' }}></i>
                  <h4>Equipos de Cardio</h4>
                </div>
                <div className="card-content">
                  {detallesUsuario.info_cardio.map((equipo, index) => (
                    <div key={index} className="equipo-item">
                      <div className="equipo-info">
                        <i className="fas fa-bicycle"></i>
                        <span className="equipo-nombre">{equipo.nombre_equipo}</span>
                      </div>
                      <div className="equipo-horario">
                        <i className="far fa-clock"></i>
                        <span>
                          {equipo.hora_inicio} 
                          {equipo.hora_fin && equipo.hora_fin !== 'N/A' ? ` - ${equipo.hora_fin}` : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detallesUsuario.motivo_cancelacion && (
              <div className="detalle-card warning-card">
                <div className="card-header">
                  <i className="fas fa-info-circle" style={{ color: '#BB3535' }}></i>
                  <h4>Motivo de Cancelación</h4>
                </div>
                <div className="card-content">
                  <p className="motivo-texto">
                    <i className="fas fa-exclamation-triangle"></i>
                    {detallesUsuario.motivo_cancelacion}
                  </p>
                </div>
              </div>
            )}
          </div>

          {detallesUsuario.estado_reserva?.toLowerCase() === 'pendiente' && (
            <div className="detalle-actions">
              <button
                className="btn-registrar-asistencia"
                onClick={() => onRegistrarAsistencia(reservaSeleccionada)}
                disabled={loading}
              >
                {loading ? 'Registrando asistencia...' : 'Registrar Asistencia'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListadoAsistenciayReservas;