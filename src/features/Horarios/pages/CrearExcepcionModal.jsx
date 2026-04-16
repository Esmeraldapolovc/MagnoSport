import { useState, useEffect } from 'react';

export default function CrearExcepcionModal({ 
  onClose, 
  onExcepcionCreada, 
  crearExcepcion, 
  loading, 
  showAlert,
  datosIniciales,
  horarios 
}) {
  const [formData, setFormData] = useState({
    horarioId: '',
    fechaInicio: '',
    fechaFin: '',
    horaInicio: '',
    horaFin: '',
    estado: 'Cerrado'
  });

  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);
  const [fechasDisponibles, setFechasDisponibles] = useState([]);

  const horas = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  // Obtener todas las fechas disponibles con horarios
  useEffect(() => {
    const fechas = new Set();
    
    horarios.forEach(dia => {
      const tieneHorario = dia.bloques.some(bloque => bloque.horarioId);
      if (tieneHorario) {
        fechas.add(dia.fecha);
      }
    });
    setFechasDisponibles(Array.from(fechas).sort());
  }, [horarios]);

  // Función para verificar si se puede crear excepción (solo valida fecha y hora)
  const puedeCrearExcepcion = (fechaStr, horaStr) => {
    if (!fechaStr || !horaStr) return false;
    
    // Crear fecha actual con hora actual
    const ahora = new Date();
    
    // Crear fecha de la excepción (año, mes, día, hora, minuto)
    const [year, month, day] = fechaStr.split('-').map(Number);
    const [hour, minute] = horaStr.split(':').map(Number);
    const fechaExcepcion = new Date(year, month - 1, day, hour, minute, 0);
    
    console.log('=== VALIDACIÓN ===');
    console.log('Fecha excepción:', fechaExcepcion.toString());
    console.log('Fecha actual:', ahora.toString());
    console.log('Es válida (fechaExcepcion > ahora):', fechaExcepcion > ahora);
    
    // La excepción es válida si la fecha+hora es mayor a la actual
    return fechaExcepcion > ahora;
  };

  // Función para obtener horas disponibles según la fecha seleccionada
  const obtenerHorasDisponibles = () => {
    const fechaSeleccionada = formData.fechaInicio;
    if (!fechaSeleccionada) return [];
    
    const ahora = new Date();
    const [year, month, day] = fechaSeleccionada.split('-').map(Number);
    const fechaComparar = new Date(year, month - 1, day);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Si la fecha es futura (mayor que hoy), mostrar todas las horas
    if (fechaComparar > hoy) {
      return horas;
    }
    
    // Si la fecha es hoy, mostrar solo horas futuras
    if (fechaComparar.getTime() === hoy.getTime()) {
      const horaActual = ahora.getHours();
      
      return horas.filter(hora => {
        const [horaNum] = hora.split(':').map(Number);
        return horaNum > horaActual;
      });
    }
    
    // Si la fecha es pasada, no mostrar horas (no se puede crear excepción)
    return [];
  };

  // Efecto para cuando llegan datos iniciales (desde clic en la tabla)
  useEffect(() => {
    if (datosIniciales) {
      // Validar si se puede crear excepción
      if (!puedeCrearExcepcion(datosIniciales.fecha, datosIniciales.horaInicio)) {
        showAlert('No se puede crear excepción para una fecha/hora que ya pasó', 'error');
        onClose();
        return;
      }
      
      // Crear el ID compuesto para el select
      const horarioIdCompuesto = datosIniciales.horarioId 
        ? `${datosIniciales.horarioId}:${datosIniciales.horaInicio}`
        : '';

      setFormData({
        horarioId: horarioIdCompuesto,
        fechaInicio: datosIniciales.fecha || '',
        fechaFin: datosIniciales.fecha || '',
        horaInicio: datosIniciales.horaInicio?.substring(0, 5) || '',
        horaFin: datosIniciales.horaFin?.substring(0, 5) || '',
        estado: datosIniciales.estado || 'Cerrado'
      });

      // Buscar información del horario seleccionado
      if (datosIniciales.horarioId && datosIniciales.fecha) {
        const horario = buscarHorarioPorId(datosIniciales.horarioId, datosIniciales.fecha);
        setHorarioSeleccionado(horario);
      }
    }
  }, [datosIniciales]);

  // Función para buscar un horario por ID y fecha
  const buscarHorarioPorId = (horarioId, fecha) => {
    for (const dia of horarios) {
      if (dia.fecha === fecha) {
        const bloque = dia.bloques.find(b => b.horarioId === horarioId);
        if (bloque) {
          return {
            id: horarioId,
            diaNombre: dia.diaNombre,
            fecha: dia.fecha,
            horaInicio: bloque.horaInicio,
            horaFin: bloque.horaFin,
            estado: bloque.estado,
            tramo: bloque.tramo,
            esExcepcion: bloque.esExcepcion
          };
        }
      }
    }
    return null;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      if (name === 'fechaInicio') {
        newData.fechaFin = value;
        newData.horarioId = '';
        newData.horaInicio = '';
        newData.horaFin = '';
        setHorarioSeleccionado(null);
      }
      
      if (name === 'horarioId' && value) {
        const [horarioId, horaInicio] = value.split(':');
        const horario = buscarHorarioPorId(parseInt(horarioId), prev.fechaInicio);
        setHorarioSeleccionado(horario);
        
        if (horario) {
          newData.horaInicio = horaInicio;
          
          const dia = horarios.find(d => d.fecha === prev.fechaInicio);
          if (dia) {
            const bloqueEspecifico = dia.bloques.find(b => 
              b.horarioId === parseInt(horarioId) && b.horaInicio === horaInicio
            );
            if (bloqueEspecifico) {
              newData.horaFin = bloqueEspecifico.horaFin.substring(0, 5);
            }
          }
          
          newData.estado = horario.estado === 'Abierto' ? 'Cerrado' : 'Abierto';
        }
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.horarioId) {
        showAlert('Debes seleccionar un horario', 'error');
        return;
      }

      if (!formData.fechaInicio) {
        showAlert('Debes seleccionar una fecha', 'error');
        return;
      }

      if (!formData.horaInicio || !formData.horaFin) {
        showAlert('Debes seleccionar las horas', 'error');
        return;
      }

      // Validar que la fecha/hora de inicio no haya pasado
      if (!puedeCrearExcepcion(formData.fechaInicio, formData.horaInicio)) {
        showAlert(`No se puede crear excepción para la fecha/hora ${formData.fechaInicio} ${formData.horaInicio} porque ya pasó`, 'error');
        return;
      }

      const horaInicioIndex = horas.indexOf(formData.horaInicio);
      const horaFinIndex = horas.indexOf(formData.horaFin);
      
      if (horaFinIndex <= horaInicioIndex) {
        showAlert('La hora fin debe ser mayor que la hora inicio', 'error');
        return;
      }

      const horarioId = parseInt(formData.horarioId.split(':')[0]);

      const excepcionData = {
        horarioId: horarioId,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin || formData.fechaInicio,
        horaInicio: formData.horaInicio + ':00',
        horaFin: formData.horaFin + ':00',
        estado: formData.estado
      };

      await crearExcepcion(excepcionData);
      showAlert('Excepción creada correctamente', 'success');
      onExcepcionCreada();
    } catch (err) {
      showAlert(err.message || 'Error al crear excepción', 'error');
    }
  };

  // Obtener todos los bloques con horario para la fecha seleccionada
  const obtenerBloquesPorFecha = () => {
    if (!formData.fechaInicio) return [];
    
    const ahora = new Date();
    const [year, month, day] = formData.fechaInicio.split('-').map(Number);
    const fechaSeleccionada = new Date(year, month - 1, day);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const bloques = [];
    
    horarios.forEach(dia => {
      if (dia.fecha === formData.fechaInicio) {
        dia.bloques.forEach(bloque => {
          if (bloque.horarioId) {
            let incluir = true;
            
            // Si la fecha es hoy, solo incluir bloques con hora futura
            if (fechaSeleccionada.getTime() === hoy.getTime()) {
              const [horaBloque] = bloque.horaInicio.split(':').map(Number);
              const horaActual = ahora.getHours();
              
              if (horaBloque <= horaActual) {
                incluir = false;
              }
            }
            
            if (incluir) {
              bloques.push({
                id: `${bloque.horarioId}:${bloque.horaInicio}`,
                horarioId: bloque.horarioId,
                diaNombre: dia.diaNombre,
                fecha: dia.fecha,
                horaInicio: bloque.horaInicio,
                horaFin: bloque.horaFin,
                estado: bloque.estado,
                tramo: bloque.tramo,
                esExcepcion: bloque.esExcepcion
              });
            }
          }
        });
      }
    });
    
    return bloques.sort((a, b) => {
      return horas.indexOf(a.horaInicio) - horas.indexOf(b.horaInicio);
    });
  };

  const bloquesDisponibles = obtenerBloquesPorFecha();
  const horasDisponibles = obtenerHorasDisponibles();

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    const [year, month, day] = fechaStr.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
    return fecha.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric' 
    });
  };

  const getTipoIcono = (bloque) => {
    if (bloque.esExcepcion) return '🔸';
    if (bloque.tramo === 'Regular') return '🔹';
    return '⬜';
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3>Nueva Excepción</h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Selector de Fecha */}
          <div className="form-group">
            <label>Fecha de la excepción</label>
            <select
              name="fechaInicio"
              value={formData.fechaInicio}
              onChange={handleInputChange}
              required
              className="form-control"
            >
              <option value="">Seleccionar fecha</option>
              {fechasDisponibles.map(fecha => {
                const [year, month, day] = fecha.split('-').map(Number);
                const fechaObj = new Date(year, month - 1, day);
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                const esHoy = fechaObj.getTime() === hoy.getTime();
                const esPasado = fechaObj < hoy;
                
                return (
                  <option key={fecha} value={fecha} disabled={esPasado}>
                    {formatearFecha(fecha)} {esHoy ? '(Hoy)' : esPasado ? '(Pasado - No disponible)' : '(Futuro)'}
                  </option>
                );
              })}
            </select>
            <small style={{ color: '#666', fontSize: '12px' }}>
              Las fechas pasadas están deshabilitadas
            </small>
          </div>

          {/* Selector de Bloque base */}
          <div className="form-group">
            <label>Selecciona el bloque base para la excepción</label>
            <select
              name="horarioId"
              value={formData.horarioId}
              onChange={handleInputChange}
              required
              disabled={!formData.fechaInicio || bloquesDisponibles.length === 0}
              className="form-control"
            >
              <option value="">
                {!formData.fechaInicio 
                  ? 'Primero selecciona una fecha'
                  : bloquesDisponibles.length === 0
                  ? 'No hay bloques disponibles para esta fecha (todas las horas ya pasaron)'
                  : 'Seleccionar bloque base'}
              </option>
              {bloquesDisponibles.map(bloque => (
                <option key={bloque.id} value={bloque.id}>
                  {getTipoIcono(bloque)} {bloque.horaInicio.substring(0,5)} - {bloque.horaFin.substring(0,5)} | {bloque.estado}
                </option>
              ))}
            </select>
          </div>

          {/* Información del bloque seleccionado */}
          {horarioSeleccionado && formData.horarioId && (
            <div className="info-box" style={{
              backgroundColor: '#e8f4fd',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '13px',
              borderLeft: '4px solid #2196F3'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <i className="fas fa-info-circle" style={{ marginRight: '8px', color: '#2196F3' }}></i>
                <strong>Bloque base seleccionado:</strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 8px' }}>
                <span style={{ color: '#666' }}>Día:</span>
                <span>{horarioSeleccionado.diaNombre}</span>
                <span style={{ color: '#666' }}>Fecha:</span>
                <span>{formatearFecha(horarioSeleccionado.fecha)}</span>
                <span style={{ color: '#666' }}>Horario original:</span>
                <span>{formData.horaInicio} - {formData.horaFin}</span>
                <span style={{ color: '#666' }}>Tipo:</span>
                <span>{horarioSeleccionado.esExcepcion ? 'Excepción' : horarioSeleccionado.tramo}</span>
                <span style={{ color: '#666' }}>Estado actual:</span>
                <span style={{ 
                  color: horarioSeleccionado.estado === 'Abierto' ? '#4caf50' : '#f44336',
                  fontWeight: 'bold'
                }}>
                  {horarioSeleccionado.estado}
                </span>
              </div>
            </div>
          )}

          {/* Fecha Fin (opcional) */}
          <div className="form-group">
            <label>Fecha Fin (opcional - para excepción en múltiples días)</label>
            <select
              name="fechaFin"
              value={formData.fechaFin}
              onChange={handleInputChange}
              className="form-control"
            >
              <option value="">Misma fecha</option>
              {fechasDisponibles.map(fecha => {
                if (fecha >= formData.fechaInicio) {
                  return (
                    <option key={fecha} value={fecha}>
                      {formatearFecha(fecha)}
                    </option>
                  );
                }
                return null;
              }).filter(Boolean)}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Hora Inicio de la excepción</label>
              <select
                name="horaInicio"
                value={formData.horaInicio}
                onChange={handleInputChange}
                required
                className="form-control"
                disabled={!formData.horarioId}
              >
                <option value="">Seleccionar</option>
                {horasDisponibles.map(hora => (
                  <option key={hora} value={hora}>{hora}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Hora Fin de la excepción</label>
              <select
                name="horaFin"
                value={formData.horaFin}
                onChange={handleInputChange}
                required
                className="form-control"
                disabled={!formData.horarioId}
              >
                <option value="">Seleccionar</option>
                {horasDisponibles.map(hora => {
                  const horaInicioNum = parseInt(formData.horaInicio?.split(':')[0] || 0);
                  const horaNum = parseInt(hora.split(':')[0]);
                  if (formData.horaInicio && horaNum <= horaInicioNum) return null;
                  return <option key={hora} value={hora}>{hora}</option>;
                }).filter(Boolean)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Nuevo Estado</label>
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

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || !formData.horarioId || horasDisponibles.length === 0}
              style={{ background: '#FF9800' }}
            >
              {loading ? 'Creando...' : 'Crear Excepción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}