// pages/Admin/ListaAlumnos.jsx
import { useState, useEffect, useRef } from "react";
import { useListado } from "../../../hooks/useListado";
import { useCatalogos } from "../../../hooks/useCatalogo";
import { useActualizar } from "../../../hooks/useActualizar";
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../service/apiClient';
import Alert from '../../../components/Alert';
import "../../../assets/styles/ListaAlumnos.css";

export default function ListaAlumnos() {
  const navigate = useNavigate();
  const { alumnos, loading, error, buscarAlumnos } = useListado('alumnos');
  const { eliminar } = useActualizar(); // Importar eliminar
  const { obtenerNiveles, obtenerLicenciaturas } = useCatalogos();
  
  const [niveles, setNiveles] = useState([]);
  const [licenciaturas, setLicenciaturas] = useState([]);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [filtroActivo, setFiltroActivo] = useState("todos");
  const [filtroNivel, setFiltroNivel] = useState("");
  const [filtroLicenciatura, setFiltroLicenciatura] = useState("");
  const [mostrarPanelFiltros, setMostrarPanelFiltros] = useState(false);
  const [alert, setAlert] = useState({ show: false, tipo: '', texto: '' });
  const [buscando, setBuscando] = useState(false);
  const [eliminando, setEliminando] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  
  const filtroBtnRef = useRef(null);
  const panelRef = useRef(null);
  const searchInputRef = useRef(null); // Referencia para el input de búsqueda

  const handleEditar = (alumno) => {
    navigate('/actualizar', { 
      state: { alumno } 
    });
  };

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const nivelesData = await obtenerNiveles();
        const licenciaturasData = await obtenerLicenciaturas();
        setNiveles(nivelesData);
        setLicenciaturas(licenciaturasData);
      } catch (error) {
        console.error("Error cargando catálogos:", error);
      }
    };
    cargarCatalogos();
  }, [obtenerNiveles, obtenerLicenciaturas]);

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

  // Función para obtener nombre del nivel por ID
  const getNombreNivel = (nivelId) => {
    if (nivelId === null || nivelId === undefined) return "No especificado";
    const nivel = niveles.find(n => n.id === nivelId);
    return nivel ? nivel.nombre : `${nivelId}`;
  };

  // Función para obtener nombre de la licenciatura por ID
  const getNombreLicenciatura = (licenciaturaId) => {
    if (licenciaturaId === null || licenciaturaId === undefined) return "No especificada";
    const lic = licenciaturas.find(l => l.id === licenciaturaId);
    return lic ? lic.nombre : `${licenciaturaId}`;
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return "—";
    return new Date(fecha).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  };

  // Función para buscar primero por nombre y si no hay resultados, por correo
  const buscarPorNombreOCorreo = async (termino, otrosFiltros = {}) => {
    setBuscando(true);
    
    try {
      // Primero intentar buscar por nombre
      const resultadosPorNombre = await buscarAlumnos({
        ...otrosFiltros,
        nombre: termino
      });
      
      // Si hay resultados por nombre, devolverlos
      if (resultadosPorNombre && resultadosPorNombre.length > 0) {
        return resultadosPorNombre;
      }
      
      // Si no, intentar por correo
      const resultadosPorCorreo = await buscarAlumnos({
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

  // Función para cargar todos los alumnos
  const cargarTodosLosAlumnos = async () => {
    setBuscando(true);
    try {
      await buscarAlumnos({});
    } catch (error) {
      console.error('Error cargando alumnos:', error);
      showAlert('Error al cargar los alumnos', 'error');
    } finally {
      setBuscando(false);
    }
  };

  // Función para aplicar filtros
  const aplicarFiltros = async () => {
    const otrosFiltros = {};
    
    if (filtroNivel) otrosFiltros.nivelId = parseInt(filtroNivel);
    if (filtroLicenciatura) otrosFiltros.licenciaturaId = parseInt(filtroLicenciatura);
    
    if (filtroActivo === "activos") {
      otrosFiltros.estado = 1; 
    } else if (filtroActivo === "inactivos") {
      otrosFiltros.estado = 0;  
    }
    
    // Si hay término de búsqueda
    if (terminoBusqueda.trim() !== '') {
      await buscarPorNombreOCorreo(terminoBusqueda, otrosFiltros);
    } 
    // Si solo hay filtros de nivel, licenciatura o estado
    else if (Object.keys(otrosFiltros).length > 0) {
      setBuscando(true);
      try {
        await buscarAlumnos(otrosFiltros);
      } catch (error) {
        console.error('Error aplicando filtros:', error);
        showAlert('Error al aplicar filtros', 'error');
      } finally {
        setBuscando(false);
      }
    } 
    // Si no hay filtros ni búsqueda, obtener todos
    else {
      await cargarTodosLosAlumnos();
    }
    
    setMostrarPanelFiltros(false);
  };

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setFiltroNivel("");
    setFiltroLicenciatura("");
    setFiltroActivo("todos");
    setTerminoBusqueda("");
    cargarTodosLosAlumnos();
    setMostrarPanelFiltros(false);
  };

  // Función para limpiar la búsqueda
  const handleClearSearch = () => {
    setTerminoBusqueda('');
    setFiltroNivel('');
    setFiltroLicenciatura('');
    setFiltroActivo('todos');
    cargarTodosLosAlumnos();
  };

  // ELIMINAMOS EL USEEFFECT QUE APLICABA FILTROS AUTOMÁTICAMENTE
  // Ahora los filtros solo se aplican con el botón "Aplicar filtros"

  // Nueva función para manejar la búsqueda con Enter
  const handleSearchEnter = () => {
    if (terminoBusqueda.trim() !== '') {
      // Si hay término de búsqueda, aplicar la búsqueda secuencial
      aplicarFiltros();
    } else {
      // Si no hay término de búsqueda, cargar todos los alumnos
      cargarTodosLosAlumnos();
    }
  };

  // Modificar handleKeyPress para usar la nueva función
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevenir comportamiento por defecto
      handleSearchEnter();
    }
  };

  // Función para eliminar alumno
  const handleEliminar = async () => {
    if (!alumnoSeleccionado) return;
    
    setEliminando(alumnoSeleccionado.idUsuario);
    setShowConfirmDialog(false);

    try {
      const response = await eliminar(alumnoSeleccionado.idUsuario);
      
      if (response) {
        showAlert(response.mensaje || 'Alumno eliminado correctamente', 'success');
        await cargarTodosLosAlumnos();
      }
    } catch (error) {
      console.error('Error eliminando alumno:', error);
      
      let mensajeError = 'Error al eliminar el alumno';
      if (error.response?.data?.detail) {
        mensajeError = error.response.data.detail;
      } else if (error.message) {
        mensajeError = error.message;
      }
      
      showAlert(mensajeError, 'error');
    } finally {
      setEliminando(null);
      setAlumnoSeleccionado(null);
    }
  };

  const openConfirmDialog = (alumno) => {
    setAlumnoSeleccionado(alumno);
    setShowConfirmDialog(true);
  };

  const showAlert = (texto, tipo = 'success') => {
    setAlert({ show: true, tipo, texto });
    setTimeout(() => {
      setAlert({ show: false, tipo: '', texto: '' });
    }, 3000);
  };

  const getInitials = (nombre) => {
    return nombre?.charAt(0).toUpperCase() || 'A';
  };

  const isLoading = loading || buscando;

  if (isLoading && alumnos.length === 0) {
    return (
      <div className="lista-loading">
        <div className="loading-spinner"></div>
        <p>Cargando alumnos...</p>
      </div>
    );
  }

  const hayFiltrosActivos = terminoBusqueda || filtroNivel || filtroLicenciatura || filtroActivo !== 'todos';

  return (
    <div className="lista-alumnos-page">
      {alert.show && (
        <Alert 
          message={alert.texto} 
          type={alert.tipo} 
          onClose={() => setAlert({ show: false, tipo: '', texto: '' })}
        />
      )}

      {/* Diálogo de confirmación para eliminar */}
      {showConfirmDialog && alumnoSeleccionado && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <div className="confirm-dialog-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3>¿Eliminar alumno?</h3>
            <p>¿Estás seguro de que deseas eliminar a <strong>{alumnoSeleccionado.nombre}</strong>?</p>
            <p className="confirm-dialog-warning">Esta acción no se puede deshacer.</p>
            <div className="confirm-dialog-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowConfirmDialog(false);
                  setAlumnoSeleccionado(null);
                }}
                disabled={eliminando === alumnoSeleccionado.idUsuario}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleEliminar}
                disabled={eliminando === alumnoSeleccionado.idUsuario}
              >
                {eliminando === alumnoSeleccionado.idUsuario ? (
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

      <div className="lista-container">
        {/* Header con título y acciones */}
        <div className="lista-header">
          <div className="header-left">
            <h1>Alumnos</h1>
            <p>Gestiona los alumnos del sistema</p>
          </div>
          
          <div className="header-actions">
            {/* Botón Personal */}
            <button 
              className="btn-nav btn-personal"
              onClick={() => navigate('/personal')}
              disabled={isLoading}
            >
              <i className="fas fa-users-gear"></i>
              <span>Personal</span>
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
                {(filtroNivel || filtroLicenciatura || filtroActivo !== 'todos') && !isLoading && (
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
                      <label>Nivel:</label>
                      <select 
                        value={filtroNivel} 
                        onChange={(e) => setFiltroNivel(e.target.value)}
                        disabled={isLoading}
                      >
                        <option value="">Todos los niveles</option>
                        {niveles.map(n => (
                          <option key={n.id} value={n.id}>{n.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div className="filtro-item">
                      <label>Licenciatura:</label>
                      <select 
                        value={filtroLicenciatura} 
                        onChange={(e) => setFiltroLicenciatura(e.target.value)}
                        disabled={isLoading}
                      >
                        <option value="">Todas las licenciaturas</option>
                        {licenciaturas.map(l => (
                          <option key={l.id} value={l.id}>{l.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="filtro-estados">
                    <span className="estados-label">Estado:</span>
                    <div className="estados-buttons">
                      <button 
                        className={`estado-btn ${filtroActivo === 'todos' ? 'active' : ''}`}
                        onClick={() => setFiltroActivo('todos')}
                        disabled={isLoading}
                      >
                        Todos
                      </button>
                      <button 
                        className={`estado-btn ${filtroActivo === 'activos' ? 'active' : ''}`}
                        onClick={() => setFiltroActivo('activos')}
                        disabled={isLoading}
                      >
                        Activos
                      </button>
                      <button 
                        className={`estado-btn ${filtroActivo === 'inactivos' ? 'active' : ''}`}
                        onClick={() => setFiltroActivo('inactivos')}
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
                      onClick={limpiarFiltros}
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
              ref={searchInputRef}
              type="text"
              className="busqueda-input"
              placeholder="Buscar por nombre o correo... "
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

        {/* Tabla de alumnos */}
        <div className="tabla-container">
          {isLoading ? (
            <div className="cargando-resultados">
              <div className="loading-spinner-small"></div>
              <p>Realizando búsqueda...</p>
            </div>
          ) : alumnos.length === 0 ? (
            <div className="sin-resultados">
              <i className="fas fa-users-slash"></i>
              <p>No se encontraron alumnos</p>
              {hayFiltrosActivos && (
                <button 
                  className="btn-ver-todos"
                  onClick={limpiarFiltros}
                  disabled={isLoading}
                >
                  Ver todos los alumnos
                </button>
              )}
            </div>
          ) : (
            <table className="tabla-alumnos">
              <thead>
                <tr>
                  <th>Alumno</th>
                  <th>Correo</th>
                  <th>Nivel</th>
                  <th>Licenciatura</th>
                  <th>Fecha Inicio</th>
                  <th>Fecha Fin</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {alumnos.map((alumno) => (
                  <tr key={alumno.idUsuario}>
                    <td className="alumno-info">
                      <div className="alumno-avatar">
                        {alumno.foto ? (
                          <img 
                            src={`${apiClient.defaults.baseURL}/static/fotos/${alumno.foto}`} 
                            alt={alumno.nombre}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentNode.innerHTML += `<div class="avatar-initials">${getInitials(alumno.nombre)}</div>`;
                            }}
                          />
                        ) : (
                          <div className="avatar-initials">
                            {getInitials(alumno.nombre)}
                          </div>
                        )}
                      </div>
                      <div className="alumno-nombre">
                        <strong>{alumno.nombre}</strong>
                      </div>
                    </td>
                    <td>{alumno.correo}</td>
                    <td>
                      <span className="badge badge-nivel">
                        {getNombreNivel(alumno.nivel)}
                      </span>
                    </td>
                    <td>
                      <span className="badge">
                        {getNombreLicenciatura(alumno.licenciatura)}
                      </span>
                    </td>
                    <td>{formatearFecha(alumno.fechaInicio)}</td>
                    <td>
                      {alumno.fechaFin ? (
                        <span className="badge badge-inactivo">
                          {formatearFecha(alumno.fechaFin)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <div className="acciones">
                        <button 
                          className="btn-icon btn-editar"
                          onClick={() => handleEditar(alumno)}
                          title="Editar alumno"
                          disabled={isLoading || eliminando === alumno.idUsuario}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className="btn-icon btn-eliminar"
                          onClick={() => openConfirmDialog(alumno)}
                          title="Eliminar alumno"
                          disabled={isLoading || eliminando === alumno.idUsuario}
                        >
                          {eliminando === alumno.idUsuario ? (
                            <i className="fas fa-spinner fa-spin"></i>
                          ) : (
                            <i className="fas fa-trash"></i>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Resumen */}
        {!isLoading && alumnos.length > 0 && (
          <div className="lista-resumen">
            <p>
              <i className="fas fa-users"></i>
              Total de alumnos: <strong>{alumnos.length}</strong>
            </p>
            <p>
              <i className="fas fa-check-circle" style={{ color: '#2e7d32' }}></i>
              Activos: <strong>{alumnos.filter(u => u.estatus === 1).length}</strong>
            </p>
            <p>
              <i className="fas fa-times-circle" style={{ color: '#b91c1c' }}></i>
              Inactivos: <strong>{alumnos.filter(u => u.estatus === 0).length}</strong>
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