import React, { useState, useEffect, useCallback } from 'react';
import Alert from '../../../components/Alert';
import { useListado } from '../../../hooks/useListado';
import { useCatalogos } from '../../../hooks/useCatalogo';
import { buscarAlumnos } from '../../../features/Usuarios/service/UsuariosServiceAdmin';
import apiClient from '../../../service/apiClient';
import '../../../assets/styles/ModalAgregarReserva.css';

const TIPOS_RESERVA = [
  { id: "Laboral", nombre: "📚 Laboral (Clase)" },
  { id: "Personal", nombre: "🏃 Personal" }
];

const ModalAgregarReserva = ({ 
  isOpen, 
  onClose, 
  bloqueSeleccionado, 
  areaId,
  areaNombre,
  equipos,
  equiposCargados,
  onCreateReserva,
  loading 
}) => {
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [tipoReserva, setTipoReserva] = useState('');
  const [claseImpartir, setClaseImpartir] = useState('');
  const [nivelId, setNivelId] = useState('');
  const [licId, setLicId] = useState('');
  const [niveles, setNiveles] = useState([]);
  const [licenciaturas, setLicenciaturas] = useState([]);
  const [licenciaturasFiltradas, setLicenciaturasFiltradas] = useState([]);
  const [equiposSeleccionados, setEquiposSeleccionados] = useState([]);
  const [error, setError] = useState('');
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  
  const { usuarios, buscarUsuarios } = useListado('usuarios');
  const { obtenerNiveles, obtenerLicenciaturas, loading: catalogosLoading } = useCatalogos();
  const BASE_URL = apiClient.defaults.baseURL;

  // Filtrar equipos que solo pertenecen al área con ID 2 (Cardio)
  const equiposCardio = equipos?.filter(equipo => equipo.areaId === 2 || equipo.area === 2) || [];

  const capitalizarTexto = (texto) => {
    if (!texto) return '';
    return texto.toLowerCase().replace(/\b\w/g, letra => letra.toUpperCase());
  };

  const getFotoUrl = (foto) => {
    if (!foto) return null;
    if (foto.startsWith('http://') || foto.startsWith('https://')) {
      return foto;
    }
    return `${BASE_URL}/static/fotos/${foto}`;
  };

  const esFechaHoraPasada = (fechaReserva, horaInicio) => {
    if (!fechaReserva || !horaInicio) return false;
    const fechaHoraReserva = new Date(`${fechaReserva}T${horaInicio}:00`);
    const ahora = new Date();
    const minutosTranscurridos = (ahora - fechaHoraReserva) / (1000 * 60);
    return minutosTranscurridos > 30;
  };

  const handleImageError = (userId) => {
    setImageErrors(prev => ({ ...prev, [userId]: true }));
  };

  const resetFormulario = useCallback(() => {
    setUsuarioSeleccionado(null);
    setTerminoBusqueda('');
    setTipoReserva('');
    setClaseImpartir('');
    setNivelId('');
    setLicId('');
    setNiveles([]);
    setLicenciaturas([]);
    setLicenciaturasFiltradas([]);
    setEquiposSeleccionados([]);
    setError('');
    setMostrarResultados(false);
    setResultadosBusqueda([]);
    setImageErrors({});
  }, []);

  const cargarCatalogos = useCallback(async () => {
    try {
      const nivelesData = await obtenerNiveles();
      const licenciaturasData = await obtenerLicenciaturas();
      setNiveles(nivelesData);
      setLicenciaturas(licenciaturasData);
    } catch (err) {
      console.error('Error cargando catálogos:', err);
    }
  }, [obtenerLicenciaturas, obtenerNiveles]);

  useEffect(() => {
    if (!isOpen) {
      resetFormulario();
      return;
    }

    if (isOpen && usuarioSeleccionado && esProfesor(usuarioSeleccionado) && !niveles.length) {
      cargarCatalogos();
    }
  }, [isOpen, resetFormulario, usuarioSeleccionado, niveles.length, cargarCatalogos]);

  useEffect(() => {
    if (nivelId) {
      const filtradas = licenciaturas.filter(lic => lic.nivelId === parseInt(nivelId, 10));
      setLicenciaturasFiltradas(filtradas);
      setLicId('');
    } else {
      setLicenciaturasFiltradas([]);
    }
  }, [nivelId, licenciaturas]);

  const esProfesor = (usuario) => {
    if (!usuario) return false;
    const rol = usuario.rol?.toUpperCase();
    return rol === 'PROFESOR' || usuario.rolId === 3;
  };

  const obtenerIdUsuario = (usuario) => {
    if (!usuario) return null;
    if (usuario.idUsuario) return usuario.idUsuario;
    if (usuario.id) return usuario.id;
    if (usuario.usuarioId) return usuario.usuarioId;
    if (usuario.id_usuario) return usuario.id_usuario;
    return null;
  };

  const buscarEnAlumnosYUsuarios = useCallback(async (termino) => {
    if (termino.length < 2) return;
    
    setBuscando(true);
    setMostrarResultados(true);
    setError('');
    
    try {
      const usuariosMap = new Map();
      
      try {
        const response = await apiClient.get('/usuarios', {
          params: { nombre: termino }
        });
        
        const listaU = response.data || [];
        
        listaU.forEach(u => {
          const realId = obtenerIdUsuario(u);
          if (realId && !usuariosMap.has(realId)) {
            const rolStr = u.rol?.toUpperCase() || u.rol_nombre?.toUpperCase();
            usuariosMap.set(realId, {
              id: realId,
              idUsuario: realId,
              nombreCompleto: capitalizarTexto(u.nombre || u.usuario || u.nombre_completo),
              correoElectronico: (u.correo || u.email || u.correo_electronico)?.toLowerCase(),
              foto: u.foto,
              rol: rolStr === 'PROFESOR' ? 'Profesor' : (rolStr === 'ALUMNO' ? 'Alumno' : 'Personal'),
              rolId: rolStr === 'PROFESOR' ? 3 : (rolStr === 'ALUMNO' ? 2 : 4),
            });
          }
        });
      } catch (err) { 
        console.error("Error en usuarios API:", err);
        try {
          await buscarUsuarios({ nombre: termino });
          if (usuarios && usuarios.length > 0) {
            usuarios.forEach(u => {
              const realId = obtenerIdUsuario(u);
              if (realId && !usuariosMap.has(realId)) {
                const rolStr = u.rol?.toUpperCase();
                usuariosMap.set(realId, {
                  id: realId,
                  idUsuario: realId,
                  nombreCompleto: capitalizarTexto(u.nombre || u.usuario),
                  correoElectronico: (u.correo || u.email)?.toLowerCase(),
                  foto: u.foto,
                  rol: rolStr === 'PROFESOR' ? 'Profesor' : 'Personal',
                  rolId: rolStr === 'PROFESOR' ? 3 : 4,
                });
              }
            });
          }
        } catch (fallbackErr) {
          console.error("Error en fallback usuarios:", fallbackErr);
        }
      }
      
      try {
        const responseAlumnos = await apiClient.get('/alumnos', {
          params: { nombre: termino }
        });
        
        const alumnosData = responseAlumnos.data || [];
        if (alumnosData && Array.isArray(alumnosData)) {
          alumnosData.forEach(a => {
            const realId = obtenerIdUsuario(a);
            if (realId && !usuariosMap.has(realId)) {
              usuariosMap.set(realId, {
                id: realId,
                idUsuario: realId,
                nombreCompleto: capitalizarTexto(a.nombre || a.nombre_completo),
                correoElectronico: (a.correo || a.email || a.correo_electronico)?.toLowerCase(),
                foto: a.foto,
                rol: 'Alumno',
                rolId: 2,
              });
            }
          });
        }
      } catch (err) { 
        console.error("Error en alumnos API:", err);
        try {
          const alumnosData = await buscarAlumnos({ nombre: termino });
          if (alumnosData && Array.isArray(alumnosData)) {
            alumnosData.forEach(a => {
              const realId = obtenerIdUsuario(a);
              if (realId && !usuariosMap.has(realId)) {
                usuariosMap.set(realId, {
                  id: realId,
                  idUsuario: realId,
                  nombreCompleto: capitalizarTexto(a.nombre || a.nombre_completo),
                  correoElectronico: (a.correo || a.email)?.toLowerCase(),
                  foto: a.foto,
                  rol: 'Alumno',
                  rolId: 2,
                });
              }
            });
          }
        } catch (fallbackErr) {
          console.error("Error en fallback alumnos:", fallbackErr);
        }
      }
      
      const resultados = Array.from(usuariosMap.values())
        .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));
      
      setResultadosBusqueda(resultados);
      if (resultados.length === 0) {
        setError(`No se encontraron resultados para "${termino}"`);
      }
      
    } catch (err) {
      console.error("Error general en búsqueda:", err);
      setError('Error general en la búsqueda');
    } finally {
      setBuscando(false);
    }
  }, [buscarUsuarios, usuarios]);

  const handleBuscarUsuario = useCallback(async () => {
    const terminoLimpio = terminoBusqueda.trim();
    if (terminoLimpio.length < 2) {
      setError('Ingresa al menos 2 caracteres para buscar');
      return;
    }
    await buscarEnAlumnosYUsuarios(terminoLimpio);
  }, [terminoBusqueda, buscarEnAlumnosYUsuarios]);

  const handleSeleccionarUsuario = (usuario) => {
    const usuarioConId = {
      ...usuario,
      id: usuario.id,
      idUsuario: usuario.id,
    };
    
    setUsuarioSeleccionado(usuarioConId);
    setTerminoBusqueda(usuario.nombreCompleto);
    setMostrarResultados(false);
    setResultadosBusqueda([]);
    setError('');
    
    if (esProfesor(usuarioConId)) {
      setTipoReserva('Laboral');
    }
  };

  const handleTerminoChange = (e) => {
    const value = e.target.value;
    setTerminoBusqueda(value);
    if (value.length < 2) {
      setMostrarResultados(false);
      setResultadosBusqueda([]);
    }
  };

  // Función para extraer el mensaje de error del backend
  const extraerMensajeError = (error) => {
    console.log("=== EXTRACCIÓN DE ERROR ===");
    console.log("Error completo:", error);
    
    // Intentar obtener el mensaje del error
    if (error.response) {
      console.log("Error response:", error.response);
      console.log("Error response data:", error.response.data);
      console.log("Error response status:", error.response.status);
      
      const data = error.response.data;
      
      // Si la data es un string
      if (typeof data === 'string') {
        // Si el string contiene "detail", intentar extraerlo
        if (data.includes('"detail"')) {
          try {
            const parsed = JSON.parse(data);
            return parsed.detail || data;
          } catch {
            return data;
          }
        }
        return data;
      }
      
      // Si la data es un objeto
      if (typeof data === 'object') {
        // Buscar 'detail' (FastAPI)
        if (data.detail) {
          return data.detail;
        }
        // Buscar 'message'
        if (data.message) {
          return data.message;
        }
        // Buscar 'error'
        if (data.error) {
          return data.error;
        }
        // Buscar 'msg'
        if (data.msg) {
          return data.msg;
        }
        // Si hay array de errores
        if (Array.isArray(data)) {
          const mensajes = data.map(e => e.msg || e.detail || e.message || e).filter(Boolean);
          if (mensajes.length > 0) {
            return mensajes.join(', ');
          }
        }
      }
      
      // Si no se encuentra nada, mostrar el status
      return `Error ${error.response.status}: ${error.response.statusText || 'Error del servidor'}`;
    }
    
    // Si no hay response, mostrar el mensaje del error
    if (error.message) {
      return error.message;
    }
    
    return 'Error al crear la reserva';
  };

  const handleCrearReserva = async () => {
    if (!usuarioSeleccionado) {
      setError('Selecciona un usuario');
      return;
    }
    
    if (!bloqueSeleccionado?.horarioId) {
      setError('Horario no válido');
      return;
    }

    if (!bloqueSeleccionado?.fecha || !bloqueSeleccionado?.hora || !bloqueSeleccionado?.horaFin) {
      setError('Datos del bloque incompletos');
      return;
    }

    if (esFechaHoraPasada(bloqueSeleccionado.fecha, bloqueSeleccionado.hora)) {
      setError('No se pueden crear reservas si han pasado más de 30 minutos del inicio del horario');
      return;
    }

    let usuarioIdFinal = obtenerIdUsuario(usuarioSeleccionado);
    
    if (!usuarioIdFinal) {
      setError('Error: No se pudo obtener el ID del usuario');
      return;
    }
    
    if (typeof usuarioIdFinal === 'string') {
      usuarioIdFinal = parseInt(usuarioIdFinal, 10);
    }
    
    if (isNaN(usuarioIdFinal) || usuarioIdFinal <= 0) {
      setError('Error: ID de usuario inválido');
      return;
    }
    
    const usuarioEsProfesor = esProfesor(usuarioSeleccionado);

    if (usuarioEsProfesor) {
      if (!tipoReserva) {
        setError('Selecciona tipo de reserva');
        return;
      }
      if (tipoReserva === 'Laboral') {
        if (!nivelId) {
          setError('Selecciona el nivel académico');
          return;
        }
        // Solo validar licenciatura si el nivel NO es Bachillerato (ID 1)
        if (parseInt(nivelId, 10) !== 1 && !licId) {
          setError('Selecciona la licenciatura');
          return;
        }
        if (!claseImpartir.trim()) {
          setError('Indica la clase a impartir');
          return;
        }
      }
    }

    const reservaData = {
      fechaReserva: bloqueSeleccionado.fecha,
      horaInicio: bloqueSeleccionado.hora,
      horaFin: bloqueSeleccionado.horaFin,
      idUsuario: usuarioIdFinal,
      areaId: areaId,
      horarioId: bloqueSeleccionado.horarioId,
      tipoReserva: usuarioEsProfesor ? tipoReserva : null,
      claseImpartir: (usuarioEsProfesor && tipoReserva === 'Laboral') ? claseImpartir : null,
      licId: (usuarioEsProfesor && tipoReserva === 'Laboral' && parseInt(nivelId, 10) !== 1) ? parseInt(licId, 10) : null,
      equipoId: areaId === 2 && equiposSeleccionados.length > 0 ? equiposSeleccionados : null
    };

    try {
      const resultado = await onCreateReserva(reservaData);
      onClose();
    } catch (err) {
      const mensajeError = extraerMensajeError(err);
      console.log("Mensaje de error final:", mensajeError);
      setError(mensajeError);
    }
  };

  if (!isOpen) return null;

  const getRolUI = (rol) => {
    const config = {
      'Profesor': { icono: '👨‍🏫', color: '#f57c00' },
      'Alumno': { icono: '👨‍🎓', color: '#1976d2' },
      'Personal': { icono: '👔', color: '#3f51b5' }
    };
    return config[rol] || { icono: '👤', color: '#9e9e9e' };
  };

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modal-container modal-agregar-reserva">
        <div className="modal-header" style={{ backgroundColor: '#BB3535' }}>
          <h3>
            <i className="fas fa-plus-circle"></i>
            Agregar Nueva Reserva
          </h3>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <Alert message={error} type="error" onClose={() => setError('')} />
          )}

          <div className="bloque-info-crear">
            <h4>📋 Información de la reserva</h4>
            <div className="info-grid">
              <div className="info-item">
                <label>📅 Fecha</label>
                <span>{bloqueSeleccionado?.fecha || 'No seleccionada'}</span>
              </div>
              <div className="info-item">
                <label>⏰ Horario</label>
                <span>
                  {bloqueSeleccionado?.hora} - {bloqueSeleccionado?.horaFin}
                </span>
              </div>
              <div className="info-item">
                <label>📍 Área</label>
                <span>{areaNombre || 'No seleccionada'}</span>
              </div>
            </div>
          </div>

          <div className="buscador-usuario">
            <label>👤 Buscar Usuario *</label>
            <div className="buscador-input-group">
              <input
                type="text"
                value={terminoBusqueda}
                onChange={handleTerminoChange}
                placeholder="Nombre completo o correo electrónico"
                className="form-control"
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                onClick={handleBuscarUsuario}
                disabled={buscando || terminoBusqueda.trim().length < 2}
                className="btn-buscar"
              >
                {buscando ? (
                  <span className="spinner-small"></span>
                ) : (
                  <i className="fas fa-search"></i>
                )}
                Buscar
              </button>
            </div>

            {buscando && (
              <div className="buscando-indicator">
                <div className="spinner-small"></div>
                <span>Buscando usuarios...</span>
              </div>
            )}

            {mostrarResultados && !buscando && resultadosBusqueda.length > 0 && (
              <div className="resultados-container">
                <div className="resultados-header">
                  <i className="fas fa-users"></i>
                  <span>{resultadosBusqueda.length} usuario(s) encontrado(s)</span>
                </div>
                <div className="resultados-lista">
                  {resultadosBusqueda.map(usuario => {
                    const fotoUrl = getFotoUrl(usuario.foto);
                    const hasError = imageErrors[usuario.id];
                    const rolUI = getRolUI(usuario.rol);
                    
                    return (
                      <div
                        key={usuario.id}
                        className={`resultado-item ${usuarioSeleccionado?.id === usuario.id ? 'seleccionado' : ''}`}
                        onClick={() => handleSeleccionarUsuario(usuario)}
                      >
                        <div className="resultado-avatar">
                          {fotoUrl && !hasError ? (
                            <img 
                              src={fotoUrl} 
                              alt={usuario.nombreCompleto}
                              onError={() => handleImageError(usuario.id)}
                            />
                          ) : (
                            <div className="avatar-placeholder" style={{ backgroundColor: rolUI.color }}>
                              {usuario.nombreCompleto?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          )}
                        </div>
                        <div className="resultado-info">
                          <div className="resultado-nombre">{usuario.nombreCompleto}</div>
                          <div className="resultado-correo">
                            <i className="fas fa-envelope"></i> {usuario.correoElectronico || 'Sin correo'}
                          </div>
                          <div className="resultado-rol-badge" style={{ 
                            backgroundColor: `${rolUI.color}20`, 
                            color: rolUI.color 
                          }}>
                            {rolUI.icono} {usuario.rol}
                          </div>
                        </div>
                        {usuarioSeleccionado?.id === usuario.id && (
                          <div className="resultado-check">
                            <i className="fas fa-check-circle"></i>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {mostrarResultados && !buscando && resultadosBusqueda.length === 0 && terminoBusqueda.trim().length >= 2 && (
              <div className="no-resultados">
                <i className="fas fa-user-slash"></i>
                <p>No se encontraron usuarios con <strong>"{terminoBusqueda}"</strong></p>
                <small>Verifica el nombre o correo e intenta nuevamente</small>
              </div>
            )}
          </div>

          {/* Usuario seleccionado */}
          {usuarioSeleccionado && (
            <div className="usuario-seleccionado-card" style={{ 
              borderLeft: `5px solid ${getRolUI(usuarioSeleccionado.rol).color}` 
            }}>
              <div className="usuario-seleccionado-header">
                <i className="fas fa-user-check"></i>
                <span>Usuario seleccionado</span>
              </div>
              <div className="usuario-seleccionado-content">
                <div className="usuario-avatar-large">
                  {(() => {
                    const fotoUrl = getFotoUrl(usuarioSeleccionado.foto);
                    const hasError = imageErrors[`selected_${usuarioSeleccionado.id}`];
                    const rolUI = getRolUI(usuarioSeleccionado.rol);
                    
                    if (fotoUrl && !hasError) {
                      return (
                        <img 
                          src={fotoUrl} 
                          alt={usuarioSeleccionado.nombreCompleto}
                          onError={() => handleImageError(`selected_${usuarioSeleccionado.id}`)}
                        />
                      );
                    } else {
                      return (
                        <div className="avatar-large" style={{ backgroundColor: rolUI.color }}>
                          {usuarioSeleccionado.nombreCompleto?.charAt(0).toUpperCase()}
                        </div>
                      );
                    }
                  })()}
                </div>
                <div className="usuario-info-detalles">
                  <div className="usuario-nombre-completo">
                    {usuarioSeleccionado.nombreCompleto}
                  </div>
                  <div className="usuario-email">
                    <i className="fas fa-envelope"></i> {usuarioSeleccionado.correoElectronico || 'Sin correo'}
                  </div>
                  <div className="usuario-badge-rol" style={{ 
                    backgroundColor: `${getRolUI(usuarioSeleccionado.rol).color}15`, 
                    color: getRolUI(usuarioSeleccionado.rol).color,
                    border: `1px solid ${getRolUI(usuarioSeleccionado.rol).color}30`
                  }}>
                    {getRolUI(usuarioSeleccionado.rol).icono} {usuarioSeleccionado.rol}
                  </div>
                </div>
              </div>
            </div>
          )}

          {usuarioSeleccionado && esProfesor(usuarioSeleccionado) && (
            <>
              <div className="form-group">
                <label>📌 Tipo de Reserva *</label>
                <select
                  value={tipoReserva}
                  onChange={(e) => {
                    const nuevoTipo = e.target.value;
                    setTipoReserva(nuevoTipo);
                    if (nuevoTipo !== 'Laboral') {
                      setClaseImpartir('');
                      setNivelId('');
                      setLicId('');
                      setLicenciaturasFiltradas([]);
                    }
                  }}
                  className="form-control"
                >
                  <option value="">Seleccionar tipo</option>
                  {TIPOS_RESERVA.map(tipo => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {tipoReserva === 'Laboral' && (
                <>
                  <div className="form-group">
                    <label>🎓 Nivel académico *</label>
                    <select
                      value={nivelId}
                      onChange={(e) => setNivelId(e.target.value)}
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

                  {/* SOLO mostrar Licenciatura si el nivel NO es Bachillerato (ID 1) */}
                  {nivelId && parseInt(nivelId, 10) !== 1 && (
                    <div className="form-group">
                      <label>📖 Licenciatura *</label>
                      <select
                        value={licId}
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
                    </div>
                  )}

                  <div className="form-group">
                    <label>📚 Clase a impartir *</label>
                    <input
                      type="text"
                      value={claseImpartir}
                      onChange={(e) => setClaseImpartir(e.target.value)}
                      placeholder="Ej: Matemáticas, Yoga, Entrenamiento funcional"
                      className="form-control"
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* Solo mostrar equipos si el área es Cardio (ID 2) y hay equipos */}
          {areaId === 2 && equiposCardio.length > 0 && (
            <div className="form-group">
              <label>⚙️ Equipos adicionales</label>
              {equiposCargados ? (
                <>
                  <select
                    multiple
                    value={equiposSeleccionados.map(String)}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, opt => parseInt(opt.value, 10));
                      setEquiposSeleccionados(values);
                    }}
                    className="form-control"
                    style={{ height: '140px' }}
                  >
                    {equiposCardio.map(equipo => {
                      const equipoId = equipo.idEquipo || equipo.id || equipo.equipoId;
                      const nombreEquipo = equipo.nombre_maquina || equipo.nombreEquipo || equipo.nombre || equipo.name || 'Equipo';
                      const codigo = equipo.codigo || '';
                      return (
                        <option key={equipoId} value={equipoId}>
                          {nombreEquipo} {codigo ? `(${codigo})` : ''}
                        </option>
                      );
                    })}
                  </select>
                  <small className="text-muted">Ctrl+clic para seleccionar varios equipos</small>
                </>
              ) : (
                <div className="loading-equipos">
                  <i className="fas fa-spinner fa-spin"></i> Cargando equipos...
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={handleCrearReserva}
            disabled={loading || !usuarioSeleccionado}
            style={{ backgroundColor: '#BB3535' }}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Creando reserva...
              </>
            ) : (
              <>
                <i className="fas fa-check"></i>
                Crear Reserva
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAgregarReserva;