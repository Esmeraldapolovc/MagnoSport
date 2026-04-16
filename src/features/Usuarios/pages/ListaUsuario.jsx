// pages/Admin/ListaUsuario.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useListado } from '../../../hooks/useListado';
import { useActualizar } from '../../../hooks/useActualizar';
import { listarUsuario } from '../../../features/Usuarios/service/UsuariosServiceAdmin';
import apiClient from '../../../service/apiClient';
import Alert from '../../../components/Alert';
import '../../../assets/styles/ListaUsuario.css';

export default function ListaUsuario() {
  const navigate = useNavigate();
  const { 
    usuarios, 
    loading, 
    error, 
    obtenerUsuarios,
    buscarUsuarios: buscarUsuariosConFiltros 
  } = useListado('usuarios');
  const { eliminar, activar } = useActualizar();
  
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [mostrarPanelFiltros, setMostrarPanelFiltros] = useState(false);
  const [eliminando, setEliminando] = useState(null);
  const [activando, setActivando] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showActivarDialog, setShowActivarDialog] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [alert, setAlert] = useState({ show: false, tipo: '', texto: '' });
  const [buscando, setBuscando] = useState(false);
  
  const filtroBtnRef = useRef(null);
  const panelRef = useRef(null);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    cargarTodosLosUsuarios();
  }, []);

  // Función para cargar TODOS los usuarios
  const cargarTodosLosUsuarios = async () => {
    setBuscando(true);
    try {
      console.log('Cargando todos los usuarios...');
      // Usar buscarUsuariosConFiltros en lugar de obtenerUsuarios
      await buscarUsuariosConFiltros({});
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      showAlert('Error al cargar los usuarios', 'error');
    } finally {
      setBuscando(false);
    }
  };

  const showAlert = (texto, tipo = 'success') => {
    setAlert({ show: true, tipo, texto });
    setTimeout(() => {
      setAlert({ show: false, tipo: '', texto: '' });
    }, 3000);
  };

  // Cerrar panel al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target) && 
          filtroBtnRef.current && !filtroBtnRef.current.contains(event.target)) {
        setMostrarPanelFiltros(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Función para buscar primero por nombre y si no hay resultados, por correo
  const buscarPorNombreOCorreo = async (termino, otrosFiltros = {}) => {
    setBuscando(true);
    
    try {
      // Primero intentar buscar por nombre
      const resultadosPorNombre = await buscarUsuariosConFiltros({
        ...otrosFiltros,
        nombre: termino
      });
      
      // Si hay resultados por nombre, devolverlos
      if (resultadosPorNombre && resultadosPorNombre.length > 0) {
        return resultadosPorNombre;
      }
      
      // Si no, intentar por correo
      const resultadosPorCorreo = await buscarUsuariosConFiltros({
        ...otrosFiltros,
        correo: termino
      });
      
      return resultadosPorCorreo || [];
    } catch (error) {
      console.error('Error en búsqueda secuencial:', error);
      showAlert('Error al realizar la búsqueda', 'error');
      return [];
    } finally {
      setBuscando(false);
    }
  };

  const aplicarFiltros = async () => {
    const otrosFiltros = {};
    
    if (filtroRol !== '') {
      otrosFiltros.rol = parseInt(filtroRol);
    }

    if (filtroEstado !== 'todos') {
      otrosFiltros.estado = filtroEstado === 'activos' ? 1 : 0;
    }
    
    // Si hay término de búsqueda
    if (terminoBusqueda.trim() !== '') {
      await buscarPorNombreOCorreo(terminoBusqueda, otrosFiltros);
    } 
    // Si solo hay filtros de rol o estado
    else if (Object.keys(otrosFiltros).length > 0) {
      setBuscando(true);
      try {
        await buscarUsuariosConFiltros(otrosFiltros);
      } catch (error) {
        console.error('Error aplicando filtros:', error);
        showAlert('Error al aplicar filtros', 'error');
      } finally {
        setBuscando(false);
      }
    } 
    // Si no hay filtros ni búsqueda, obtener todos
    else {
      await cargarTodosLosUsuarios();
    }
    
    setMostrarPanelFiltros(false);
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    aplicarFiltros();
  };

  const handleClearFilters = () => {
    // Limpiar todos los estados de filtros
    setTerminoBusqueda('');
    setFiltroRol('');
    setFiltroEstado('todos');
    
    // Cargar todos los usuarios
    cargarTodosLosUsuarios();
    
    setMostrarPanelFiltros(false);
  };

  // Función CORREGIDA para limpiar la búsqueda
  const handleClearSearch = () => {
    console.log('Limpiando búsqueda - cargando todos los usuarios');
    
    // Limpiar el término de búsqueda
    setTerminoBusqueda('');
    
    // Limpiar los filtros de rol y estado
    setFiltroRol('');
    setFiltroEstado('todos');
    
    // Cargar todos los usuarios
    cargarTodosLosUsuarios();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleEliminar = async () => {
    if (!usuarioSeleccionado) return;
    
    setEliminando(usuarioSeleccionado.idUsuario);
    setShowConfirmDialog(false);

    try {
      const response = await eliminar(usuarioSeleccionado.idUsuario);
      
      if (response) {
        showAlert(response.mensaje || 'Usuario eliminado correctamente', 'success');
        await cargarTodosLosUsuarios();
      }
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      
      let mensajeError = 'Error al eliminar el usuario';
      if (error.response?.data?.detail) {
        mensajeError = error.response.data.detail;
      } else if (error.message) {
        mensajeError = error.message;
      }
      
      showAlert(mensajeError, 'error');
    } finally {
      setEliminando(null);
      setUsuarioSeleccionado(null);
    }
  };

  const handleActivar = async () => {
    if (!usuarioSeleccionado) return;
    
    setActivando(usuarioSeleccionado.idUsuario);
    setShowActivarDialog(false);

    try {
      const response = await activar(usuarioSeleccionado.idUsuario);
      
      if (response) {
        showAlert(response.mensaje || 'Usuario activado correctamente', 'success');
        await cargarTodosLosUsuarios();
      }
    } catch (error) {
      console.error('Error activando usuario:', error);
      
      let mensajeError = 'Error al activar el usuario';
      if (error.response?.data?.detail) {
        mensajeError = error.response.data.detail;
      } else if (error.message) {
        mensajeError = error.message;
      }
      
      showAlert(mensajeError, 'error');
    } finally {
      setActivando(null);
      setUsuarioSeleccionado(null);
    }
  };

  const openConfirmDialog = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setShowConfirmDialog(true);
  };

  const openActivarDialog = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setShowActivarDialog(true);
  };

  const handleEdit = (usuario) => {
    navigate('/actualizacionUsuario', { state: { usuario } });
  };

  const getInitials = (nombre) => {
    return nombre?.charAt(0).toUpperCase() || 'U';
  };

  const getFotoUrl = (foto) => {
    if (!foto) return null;
    return `${apiClient.defaults.baseURL}/static/fotos/${foto}`;
  };

  // Función para obtener la clase CSS según el rol
  const getRolClass = (rol) => {
    const rolMap = {
      'PROFESOR': 'rol-3',
      'PERSONAL': 'rol-4'
    };
    return rolMap[rol] || '';
  };

  // Formatear nombre del rol
  const formatRol = (rol) => {
    return rol.charAt(0) + rol.slice(1).toLowerCase();
  };

  // Mostrar error si existe
  if (error) {
    return (
      <div className="lista-error">
        <i className="fas fa-exclamation-triangle"></i>
        <h3>Error al cargar los usuarios</h3>
        <p>{error}</p>
        <button 
          className="btn-reintentar"
          onClick={cargarTodosLosUsuarios}
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Determinar si estamos en estado de carga
  const isLoading = loading || buscando;

  if (isLoading && usuarios.length === 0) {
    return (
      <div className="lista-loading">
        <div className="loading-spinner"></div>
        <p>Cargando usuarios...</p>
      </div>
    );
  }

  const hayFiltrosActivos = terminoBusqueda || filtroRol || filtroEstado !== 'todos';

  return (
    <div className="lista-usuario-page">
      {alert.show && (
        <Alert 
          message={alert.texto} 
          type={alert.tipo} 
          onClose={() => setAlert({ show: false, tipo: '', texto: '' })}
        />
      )}

      {/* Diálogo de confirmación para eliminar */}
      {showConfirmDialog && usuarioSeleccionado && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <div className="confirm-dialog-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3>¿Eliminar usuario?</h3>
            <p>¿Estás seguro de que deseas eliminar a <strong>{usuarioSeleccionado.nombre}</strong>?</p>
            <p className="confirm-dialog-warning"></p>
            <div className="confirm-dialog-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowConfirmDialog(false);
                  setUsuarioSeleccionado(null);
                }}
                disabled={eliminando === usuarioSeleccionado.idUsuario}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleEliminar}
                disabled={eliminando === usuarioSeleccionado.idUsuario}
              >
                {eliminando === usuarioSeleccionado.idUsuario ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Eliminando...
                  </>
                ) : (
                  'Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de confirmación para activar */}
      {showActivarDialog && usuarioSeleccionado && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <div className="confirm-dialog-icon success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h3>¿Activar usuario?</h3>
            <p>¿Estás seguro de que deseas activar a <strong>{usuarioSeleccionado.nombre}</strong>?</p>
            <p>El usuario podrá acceder al sistema nuevamente.</p>
            <div className="confirm-dialog-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowActivarDialog(false);
                  setUsuarioSeleccionado(null);
                }}
                disabled={activando === usuarioSeleccionado.idUsuario}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-success"
                onClick={handleActivar}
                disabled={activando === usuarioSeleccionado.idUsuario}
              >
                {activando === usuarioSeleccionado.idUsuario ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Activando...
                  </>
                ) : (
                  'Activar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="lista-container">
        {/* Header con título y acciones */}
        <div className="lista-header">
          <div className="header-left">
            <h1>Usuarios</h1>
            <p>Gestiona los usuarios del sistema</p>
          </div>
          
          <div className="header-actions">
            {/* Botón Alumnos */}
            <button 
              className="btn-nav btn-alumnos"
              onClick={() => navigate('/usuarios')}
              disabled={isLoading}
            >
              <i className="fas fa-user-graduate"></i>
              <span>Alumnos</span>
            </button>

            {/* Filtro avanzado */}
            <div className="filtro-wrapper">
              <button 
                ref={filtroBtnRef}
                className={`btn-icono filtro-btn ${mostrarPanelFiltros ? 'active' : ''} ${isLoading ? 'buscando' : ''}`} 
                title="Filtros avanzados"
                onClick={() => setMostrarPanelFiltros(!mostrarPanelFiltros)}
                disabled={isLoading}
              >
                <i className={`fas fa-filter ${isLoading ? 'fa-spin' : ''}`}></i>
                {(filtroRol || filtroEstado !== 'todos') && !isLoading && (
                  <span className="filtro-indicador"></span>
                )}
              </button>
              
              {/* Panel de filtros flotante */}
              {mostrarPanelFiltros && !isLoading && (
                <div ref={panelRef} className="panel-filtros-flotante">
                  <div className="panel-header">
                    <h4>
                      <i className="fas fa-filter"></i>
                      Filtros avanzados
                    </h4>
                  </div>
                  
                  <div className="filtros-grid">
                    <div className="filtro-item">
                      <label>Rol:</label>
                      <select 
                        value={filtroRol} 
                        onChange={(e) => setFiltroRol(e.target.value)}
                        disabled={isLoading}
                      >
                        <option value="">Todos los roles</option>
                        <option value="3">Profesor</option>
                        <option value="4">Personal</option>
                      </select>
                    </div>
                  </div>

                  <div className="filtro-estados">
                    <span className="estados-label">Estado:</span>
                    <div className="estados-buttons">
                      <button 
                        className={`estado-btn ${filtroEstado === 'todos' ? 'active' : ''}`}
                        onClick={() => setFiltroEstado('todos')}
                        disabled={isLoading}
                      >
                        Todos
                      </button>
                      <button 
                        className={`estado-btn ${filtroEstado === 'activos' ? 'active' : ''}`}
                        onClick={() => setFiltroEstado('activos')}
                        disabled={isLoading}
                      >
                        Activos
                      </button>
                      <button 
                        className={`estado-btn ${filtroEstado === 'inactivos' ? 'active' : ''}`}
                        onClick={() => setFiltroEstado('inactivos')}
                        disabled={isLoading}
                      >
                        Inactivos
                      </button>
                    </div>
                  </div>

                  <div className="filtro-acciones">
                    <button 
                      className="btn-aplicar" 
                      onClick={aplicarFiltros}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Buscando...' : 'Aplicar filtros'}
                    </button>
                    <button 
                      className="btn-limpiar" 
                      onClick={handleClearFilters}
                      disabled={isLoading}
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Botón Agregar */}
            <button 
              className="btn-agregar"
              onClick={() => navigate('/crearUsuario')}
              disabled={isLoading}
            >
              <i className="fas fa-plus"></i>
              <span>Agregar</span>
            </button>
          </div>
        </div>

        {/* Barra de búsqueda angosta */}
        <div className="busqueda-container">
          <div className="busqueda-wrapper">
            <i className={`fas fa-search busqueda-icon ${isLoading ? 'fa-spin' : ''}`}></i>
            <input
              type="text"
              className="busqueda-input"
              placeholder="Buscar por nombre o correo..."
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            {terminoBusqueda && !isLoading && (
              <button 
                className="busqueda-clear"
                onClick={handleClearSearch}
                title="Limpiar búsqueda"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
            {isLoading && (
              <span className="buscando-texto">Buscando...</span>
            )}
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="tabla-container">
          {isLoading ? (
            <div className="cargando-resultados">
              <div className="loading-spinner-small"></div>
              <p>Realizando búsqueda...</p>
            </div>
          ) : usuarios.length === 0 ? (
            <div className="sin-resultados">
              <i className="fas fa-users-slash"></i>
              <p>No se encontraron usuarios</p>
              {hayFiltrosActivos && (
                <button 
                  className="btn-ver-todos"
                  onClick={handleClearFilters}
                  disabled={isLoading}
                >
                  Ver todos los usuarios
                </button>
              )}
            </div>
          ) : (
            <table className="tabla-usuarios">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.idUsuario}>
                    <td className="usuario-info">
                      <div className="usuario-avatar">
                        {usuario.foto ? (
                          <img 
                            src={getFotoUrl(usuario.foto)} 
                            alt={usuario.nombre}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentNode.innerHTML += `<div class="avatar-initials">${getInitials(usuario.nombre)}</div>`;
                            }}
                          />
                        ) : (
                          <div className="avatar-initials">
                            {getInitials(usuario.nombre)}
                          </div>
                        )}
                      </div>
                      <div className="usuario-nombre">
                        <strong>{usuario.nombre}</strong>
                      </div>
                    </td>
                    <td>{usuario.correo}</td>
                    <td>
                      <span className={`rol-badge ${getRolClass(usuario.rol)}`}>
                        {formatRol(usuario.rol)}
                      </span>
                    </td>
                    <td>
                      <span className={`estado-badge ${usuario.estatus === 1 ? 'activo' : 'inactivo'}`}>
                        {usuario.estatus === 1 ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="acciones">
                        <button 
                          className="btn-icon btn-editar"
                          onClick={() => handleEdit(usuario)}
                          title="Editar usuario"
                          disabled={isLoading || eliminando === usuario.idUsuario || activando === usuario.idUsuario}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        
                        {usuario.estatus === 1 ? (
                          <button 
                            className="btn-icon btn-eliminar"
                            onClick={() => openConfirmDialog(usuario)}
                            disabled={isLoading || eliminando === usuario.idUsuario || activando === usuario.idUsuario}
                            title="Eliminar usuario"
                          >
                            {eliminando === usuario.idUsuario ? (
                              <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                              <i className="fas fa-trash"></i>
                            )}
                          </button>
                        ) : (
                          <button 
                            className="btn-icon btn-activar"
                            onClick={() => openActivarDialog(usuario)}
                            disabled={isLoading || eliminando === usuario.idUsuario || activando === usuario.idUsuario}
                            title="Activar usuario"
                          >
                            {activando === usuario.idUsuario ? (
                              <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                              <i className="fas fa-check-circle"></i>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Resumen */}
        {!isLoading && usuarios.length > 0 && (
          <div className="lista-resumen">
            <p>
              <i className="fas fa-users"></i>
              Total de usuarios: <strong>{usuarios.length}</strong>
            </p>
            <p>
              <i className="fas fa-check-circle" style={{ color: '#2e7d32' }}></i>
              Activos: <strong>{usuarios.filter(u => u.estatus === 1).length}</strong>
            </p>
            <p>
              <i className="fas fa-times-circle" style={{ color: '#b91c1c' }}></i>
              Inactivos: <strong>{usuarios.filter(u => u.estatus === 0).length}</strong>
            </p>
            {hayFiltrosActivos && (
              <p className="resultados-filtro">
                <i className="fas fa-filter"></i>
                Mostrando resultados filtrados
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}