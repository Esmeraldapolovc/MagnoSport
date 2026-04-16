import { useState, useEffect } from 'react';
import { useHorario } from '../hooks/useHorario';
import Alert from '../../../components/Alert';
import CrearExcepcionModal from './CrearExcepcionModal';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from 'react-datepicker';
import es from 'date-fns/locale/es';
import '../../../assets/styles/HorarioSemanal.css';

// Registrar el locale español
registerLocale('es', es);

export default function ListaHorario() {
  const { horarios, setHorarios, loading, error, obtenerHorarios, crearHorario, crearExcepcion, buscarPorFecha } = useHorario();
  const [alert, setAlert] = useState({ show: false, tipo: '', texto: '' });
  const [showModal, setShowModal] = useState(false);
  const [showExcepcionModal, setShowExcepcionModal] = useState(false);
  const [excepcionData, setExcepcionData] = useState(null);
  const [fechaActual, setFechaActual] = useState(new Date());
  const [cargandoSemana, setCargandoSemana] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Horas del día a mostrar (de 6:00 a 19:00)
  const horas = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  // Días de la semana
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const showAlert = (texto, tipo = 'success') => {
    setAlert({ show: true, tipo, texto });
    setTimeout(() => {
      setAlert({ show: false, tipo: '', texto: '' });
    }, 3000);
  };

  const cargarHorarios = async () => {
    try {
      await obtenerHorarios();
    } catch (err) {
      showAlert('Error al cargar horarios', 'error');
    }
  };

  useEffect(() => {
    cargarHorarios();
  }, []);

  const getColorClass = (estado, tramo) => {
    if (!tramo || tramo === 'Sin horario' || estado === 'Sin horario asignado') {
      return 'sin-horario';
    }
    
    if (estado === 'Abierto') {
      return 'abierto';
    }
    
    if (estado === 'Cerrado') {
      return 'cerrado';
    }
    
    return 'sin-horario';
  };

  const getBloqueTexto = (bloque) => {
    if (!bloque) return '';
    if (bloque.tramo !== 'Sin horario' && bloque.tramo !== 'Regular') {
      return bloque.tramo;
    }
    return '';
  };

  // Función modificada para obtener el bloque con su horarioId
  const getBloque = (diaNombre, hora) => {
    const dia = horarios.find(d => d.diaNombre === diaNombre);
    if (!dia) return null;
    
    return dia.bloques.find(b => b.horaInicio === hora);
  };

  // Función modificada para manejar el clic en un bloque

const handleBloqueClick = (dia, hora) => {
  const bloque = getBloque(dia, hora);
  const diaData = horarios.find(d => d.diaNombre === dia);
  
  // Validar que no sea un bloque "Sin horario"
  if (!bloque || bloque.tramo === 'Sin horario' || bloque.estado === 'Sin horario asignado') {
    showAlert('No se puede crear excepción para un bloque sin horario', 'error');
    return;
  }

  // Usar el horarioId del bloque
  const horarioId = bloque.horarioId;
  
  if (!horarioId) {
    showAlert('No se puede identificar el horario para este bloque', 'error');
    return;
  }

  setExcepcionData({
    horarioId: horarioId,
    fecha: diaData.fecha,
    horaInicio: hora,
    horaFin: obtenerHoraFin(hora),
    estado: bloque.estado === 'Abierto' ? 'Cerrado' : 'Abierto'
  });
  
  setShowExcepcionModal(true);
};

  const obtenerHoraFin = (horaInicio) => {
    const index = horas.indexOf(horaInicio);
    if (index < horas.length - 1) {
      return horas[index + 1];
    }
    return horaInicio;
  };

  // Función para obtener el lunes de la semana de una fecha dada
  const obtenerLunesDeSemana = (fecha) => {
    const nuevaFecha = new Date(fecha);
    const dia = nuevaFecha.getDay();
    const diff = dia === 0 ? 6 : dia - 1;
    nuevaFecha.setDate(nuevaFecha.getDate() - diff);
    return nuevaFecha;
  };

  // Función para cargar la semana basada en una fecha
  const cargarSemana = async (fecha) => {
    setCargandoSemana(true);
    try {
      const fechaStr = fecha.toISOString().split('T')[0];
      const datosSemana = await buscarPorFecha(fechaStr);
      
      if (datosSemana && datosSemana.length > 0) {
        setHorarios(datosSemana);
      } else {
        showAlert('No hay horarios para esta semana', 'info');
      }
    } catch (err) {
      showAlert('Error al buscar horarios', 'error');
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

  const getRangoSemana = () => {
    if (horarios.length === 0) return 'Cargando...';
    const inicio = formatearFecha(horarios[0]?.fecha);
    const fin = formatearFecha(horarios[5]?.fecha);
    return `${inicio} - ${fin}`;
  };

  if ((loading || cargandoSemana) && horarios.length === 0) {
    return (
      <div className="horario-loading">
        <div className="loading-spinner"></div>
        <p>Cargando horario...</p>
      </div>
    );
  }

  return (
    <div className="horario-semanal-page">
      {alert.show && (
        <Alert 
          message={alert.texto} 
          type={alert.tipo} 
          onClose={() => setAlert({ show: false, tipo: '', texto: '' })}
        />
      )}

      <div className="horario-container">
        <div className="horario-header">
          <div className="header-left">
            <h1>Horario Semanal</h1>
            <div className="semana-badge" onClick={() => setShowCalendar(!showCalendar)} style={{ cursor: 'pointer' }}>
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

            <button 
              className="btn-nuevo"
              onClick={() => setShowModal(true)}
              disabled={loading || cargandoSemana}
            >
              <i className="fas fa-plus"></i>
              <span>Nuevo Horario</span>
            </button>

            <button 
              className="btn-excepcion"
              onClick={() => setShowExcepcionModal(true)}
              disabled={loading || cargandoSemana}
            >
              <i className="fas fa-exclamation-triangle"></i>
              <span>Nueva Excepción</span>
            </button>
          </div>
        </div>

        <div className="horario-leyenda">
          <div className="leyenda-item">
            <span className="color-box color-sin-horario"></span>
            <span>Sin horario</span>
          </div>
          <div className="leyenda-item">
            <span className="color-box color-abierto"></span>
            <span>Abierto</span>
          </div>
          <div className="leyenda-item">
            <span className="color-box color-cerrado"></span>
            <span>Cerrado</span>
          </div>
        </div>

        <div className="horario-tabla-container">
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
          <table className="horario-tabla">
            <thead>
              <tr>
                <th className="hora-col">Hora</th>
                {diasSemana.map((dia) => {
                  const diaData = horarios.find(d => d.diaNombre === dia);
                  return (
                    <th key={dia} className="dia-col">
                      <div className="dia-header">
                        <span className="dia-nombre">{dia}</span>
                        {diaData && (
                          <>
                            <span className="dia-fecha">{formatearFecha(diaData.fecha)}</span>
                            
                          </>
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
                    const bloque = getBloque(dia, hora);
                    const colorClass = bloque ? getColorClass(bloque.estado, bloque.tramo) : 'sin-horario';
                    const texto = bloque ? getBloqueTexto(bloque) : '';
                    
                    // Tooltip mejorado para mostrar información del horario
                    const tooltip = bloque ? 
                      `${dia} ${hora} - ${bloque.estado}${bloque.horarioId ? ` (ID: ${bloque.horarioId})` : ''}` : 
                      'Sin información';
                    
                    return (
                      <td 
                        key={`${dia}-${hora}`} 
                        className={`bloque-cell ${colorClass}`}  
                        title={tooltip}
                        onClick={() => handleBloqueClick(dia, hora)}
                        style={{ cursor: bloque?.horarioId ? 'pointer' : 'not-allowed' }}
                      >
                        {texto && (
                          <div className="bloque-info">
                            <span className="bloque-tramo">{texto}</span>
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
      </div>

      {showModal && (
        <CrearHorarioModal 
          onClose={() => setShowModal(false)}
          onHorarioCreado={() => {
            cargarHorarios();
            setShowModal(false);
          }}
          crearHorario={crearHorario}
          loading={loading}
          showAlert={showAlert}
        />
      )}

      {showExcepcionModal && (
        <CrearExcepcionModal
          onClose={() => {
            setShowExcepcionModal(false);
            setExcepcionData(null);
          }}
          onExcepcionCreada={() => {
            cargarHorarios();
            setShowExcepcionModal(false);
            setExcepcionData(null);
          }}
          crearExcepcion={crearExcepcion}
          loading={loading}
          showAlert={showAlert}
          datosIniciales={excepcionData}
          horarios={horarios}
        />
      )}
    </div>
  );
}

// ==================== CrearHorarioModal ====================
function CrearHorarioModal({ onClose, onHorarioCreado, crearHorario, loading, showAlert }) {
  const [formData, setFormData] = useState({
    fechaInicio: '',
    fechaFin: '',
    horaInicio: '08:00',
    horaFin: '16:00',
    dias: [],
    estado: 'Abierto'
  });

  const diasOptions = [
    { id: 1, nombre: 'L' },
    { id: 2, nombre: 'M' },
    { id: 3, nombre: 'M' },
    { id: 4, nombre: 'J' },
    { id: 5, nombre: 'V' },
    { id: 6, nombre: 'S' }
  ];

  const diasCompletos = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado'
  };

  // Horas disponibles de 6 a 20
  const horasDisponibles = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  const obtenerDiaSemana = (fechaStr) => {
    if (!fechaStr) return null;
    const fecha = new Date(fechaStr + 'T00:00:00');
    const dia = fecha.getDay();
    // Convertir: domingo(0) -> null, lunes(1) -> 1, martes(2) -> 2, ..., sábado(6) -> 6
    return dia === 0 ? null : dia;
  };

  // Función para calcular los días únicos en el rango de fechas
  const calcularDiasEnRango = (inicio, fin) => {
    if (!inicio || !fin) return [];
    
    const fechaInicio = new Date(inicio + 'T00:00:00');
    const fechaFin = new Date(fin + 'T00:00:00');
    const diasEncontrados = new Set();
    
    let fechaActual = new Date(fechaInicio);
    
    while (fechaActual <= fechaFin) {
      const diaSemana = fechaActual.getDay();
      // Convertir: domingo(0) -> no se agrega, lunes(1) -> 1, ..., sábado(6) -> 6
      if (diaSemana >= 1 && diaSemana <= 6) {
        diasEncontrados.add(diaSemana);
        console.log(`Fecha: ${fechaActual.toISOString().split('T')[0]}, Día: ${diaSemana}`);
      }
      
      // Avanzar un día
      fechaActual.setDate(fechaActual.getDate() + 1);
    }
    
    const resultado = Array.from(diasEncontrados).sort((a, b) => a - b);
    console.log('Días calculados:', resultado);
    return resultado;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      let newData = { ...prev, [name]: value };
      
      // Cuando cambia fechaInicio o fechaFin, recalcular los días automáticamente
      if (name === 'fechaInicio' || name === 'fechaFin') {
        const fechaInicio = name === 'fechaInicio' ? value : prev.fechaInicio;
        const fechaFin = name === 'fechaFin' ? value : prev.fechaFin;
        
        if (fechaInicio && fechaFin) {
          // Validar que la fecha de inicio no sea mayor que la fecha de fin
          if (new Date(fechaInicio + 'T00:00:00') > new Date(fechaFin + 'T00:00:00')) {
            showAlert('La fecha de inicio no puede ser mayor que la fecha de fin', 'error');
            return { ...prev, [name]: '' };
          }
          
          // Validar que no sea domingo
          const diaInicioSemana = obtenerDiaSemana(fechaInicio);
          const diaFinSemana = obtenerDiaSemana(fechaFin);
          
          if (diaInicioSemana === null || diaFinSemana === null) {
            showAlert('No se pueden crear horarios para domingo', 'error');
            return { ...prev, [name]: '' };
          }
          
          // Calcular los días automáticamente
          const diasCalculados = calcularDiasEnRango(fechaInicio, fechaFin);
          newData.dias = diasCalculados;
        } else {
          newData.dias = [];
        }
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const diaInicio = obtenerDiaSemana(formData.fechaInicio);
      const diaFin = obtenerDiaSemana(formData.fechaFin);
      
      if (!diaInicio || !diaFin) {
        showAlert('No se pueden crear horarios para domingo', 'error');
        return;
      }

      if (formData.dias.length === 0) {
        showAlert('No hay días válidos en el rango seleccionado', 'error');
        return;
      }

      // Validar que la hora de inicio sea menor que la hora de fin
      const horaInicioNum = parseInt(formData.horaInicio.split(':')[0]);
      const horaFinNum = parseInt(formData.horaFin.split(':')[0]);
      
      if (horaFinNum <= horaInicioNum) {
        showAlert('La hora de fin debe ser mayor que la hora de inicio', 'error');
        return;
      }

      const horarioData = {
        ...formData,
        horaInicio: formData.horaInicio + ':00',
        horaFin: formData.horaFin + ':00'
      };

      await crearHorario(horarioData);
      showAlert('Horario creado correctamente', 'success');
      onHorarioCreado();
    } catch (err) {
      showAlert(err.message || 'Error al crear horario', 'error');
    }
  };

  const fechasIguales = formData.fechaInicio && formData.fechaFin && formData.fechaInicio === formData.fechaFin;
  const diaSeleccionado = fechasIguales ? obtenerDiaSemana(formData.fechaInicio) : null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Nuevo Horario</h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Fecha Inicio</label>
              <input
                type="date"
                name="fechaInicio"
                value={formData.fechaInicio}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Fecha Fin</label>
              <input
                type="date"
                name="fechaFin"
                value={formData.fechaFin}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          {formData.fechaInicio && formData.fechaFin && formData.dias.length > 0 && (
            <div className="alert alert-info" style={{
              backgroundColor: '#e8f4fd',
              color: '#0a558c',
              padding: '10px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              <i className="fas fa-info-circle"></i> Días detectados en el rango: {
                formData.dias.map(d => diasCompletos[d]).join(', ')
              }
            </div>
          )}

          {fechasIguales && diaSeleccionado && (
            <div className="alert alert-info" style={{
              backgroundColor: '#e8f4fd',
              color: '#0a558c',
              padding: '10px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              <i className="fas fa-info-circle"></i> Horario para un solo día: {diasCompletos[diaSeleccionado]}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Hora Inicio</label>
              <select
                name="horaInicio"
                value={formData.horaInicio}
                onChange={handleInputChange}
                required
                className="form-control"
              >
                {horasDisponibles.map(hora => (
                  <option key={hora} value={hora}>{hora}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Hora Fin</label>
              <select
                name="horaFin"
                value={formData.horaFin}
                onChange={handleInputChange}
                required
                className="form-control"
              >
                {horasDisponibles.map(hora => (
                  <option key={hora} value={hora}>{hora}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Estado</label>
            <select
              name="estado"
              value={formData.estado}
              onChange={handleInputChange}
              required
              className="form-control"
            >
              <option value="Abierto">Abierto</option>
              <option value="Cerrado">Cerrado</option>
            </select>
          </div>

          <div className="form-group">
            <label>Días (selección automática según el rango de fechas)</label>
            <div className="dias-mini-grid">
              {diasOptions.map(dia => (
                <button
                  key={dia.id}
                  type="button"
                  className={`dia-mini-btn ${formData.dias.includes(dia.id) ? 'active' : ''}`}
                  disabled={true}
                  style={{ 
                    opacity: formData.dias.includes(dia.id) ? 1 : 0.5,
                    cursor: 'not-allowed',
                    backgroundColor: formData.dias.includes(dia.id) ? '#d12a2a' : '#e0e0e0',
                    color: formData.dias.includes(dia.id) ? 'white' : '#333',
                    border: formData.dias.includes(dia.id) ? '2px solid #9e1111' : '1px solid #ccc'
                  }}
                  title={`${diasCompletos[dia.id]} - ${formData.dias.includes(dia.id) ? 'seleccionado automáticamente' : 'no incluido en el rango'}`}
                >
                  {dia.nombre}
                </button>
              ))}
            </div>
            <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              Los días se seleccionan automáticamente según las fechas seleccionadas
            </small>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Horario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}