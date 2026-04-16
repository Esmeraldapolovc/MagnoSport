import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useEquipo from "../hook/useEquipo";
import Alert from "../../../components/Alert";
import "../../../assets/styles/ListadoGeneralEquipo.css";

const ListadoGeneralEquipo = () => {
  const navigate = useNavigate();
  const { equipos, obtenerEquipos, agregarEquipo, loading, error } = useEquipo();
  
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [mostrarPanelFiltros, setMostrarPanelFiltros] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  
  // Estado para el modal de agregar
  const [showAddModal, setShowAddModal] = useState(false);
  const [creando, setCreando] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  
  // Estado para nuevo equipo
  const [nuevoEquipo, setNuevoEquipo] = useState({
    nombre: "",
    categoria: "Máquina",
    areaId: "",
    cantidad: 1
  });
  const [erroresForm, setErroresForm] = useState({});

  // Opciones de área
  const areas = [
    { id: 1, nombre: "Gimnasio" },
    { id: 2, nombre: "Cardio" },
    { id: 3, nombre: "TRX" },
    { id: 4, nombre: "Cancha bolada" },
    { id: 5, nombre: "Cancha de Tenis" }
  ];

  const filtroBtnRef = useRef(null);
  const panelRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    obtenerEquipos();
  }, [obtenerEquipos]);

  // Cerrar panel de filtros al hacer click fuera
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

  // Cerrar modal al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowAddModal(false);
        resetForm();
      }
    };

    if (showAddModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddModal]);

  const getStatusClass = (estado) => {
    switch (estado) {
      case "Disponible":
        return "badge-disponible";
      case "Mantenimiento":
        return "badge-mantenimiento";
      case "No disponible":
        return "badge-no-disponible";
      case "Fuera de servicio":
        return "badge-baja";
      default:
        return "";
    }
  };

  const getStatusIcon = (estado) => {
    switch (estado) {
      case "Disponible":
        return "fa-check-circle";
      case "Mantenimiento":
        return "fa-tools";
      case "No disponible":
        return "fa-times-circle";
      case "Fuera de servicio":
        return "fa-ban";
      default:
        return "fa-circle";
    }
  };

  const getAreaNombre = (areaId) => {
    const area = areas.find(a => a.id === parseInt(areaId));
    return area ? area.nombre : `Área ${areaId}`;
  };

  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, type, message });
    setTimeout(() => {
      setAlert({ show: false, type: '', message: '' });
    }, 3000);
  };

  const handleCloseAlert = () => {
    setAlert({ show: false, type: '', message: '' });
  };

  const handleEquipoClick = (equipo) => {
    navigate(`/equipos/${encodeURIComponent(equipo.nombre)}`, {
      state: { nombreEquipo: equipo.nombre }
    });
  };

  // Validar formulario de crear
  const validarFormulario = () => {
    const errors = {};
    if (!nuevoEquipo.nombre.trim()) {
      errors.nombre = "El nombre es obligatorio";
    } else if (nuevoEquipo.nombre.length < 3) {
      errors.nombre = "El nombre debe tener al menos 3 caracteres";
    }
    if (!nuevoEquipo.areaId) {
      errors.areaId = "El área es obligatoria";
    }
    if (nuevoEquipo.cantidad < 1) {
      errors.cantidad = "La cantidad debe ser mayor a 0";
    }
    setErroresForm(errors);
    return Object.keys(errors).length === 0;
  };

  // Manejar cambio en inputs de crear
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoEquipo(prev => ({ ...prev, [name]: value }));
    if (erroresForm[name]) {
      setErroresForm(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Crear nuevo equipo
  const handleCrearEquipo = async (e) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    if (!validarFormulario()) return;

    setCreando(true);
    try {
      const equipoData = {
        nombre: nuevoEquipo.nombre,
        categoria: nuevoEquipo.categoria,
        areaId: parseInt(nuevoEquipo.areaId),
        cantidad: nuevoEquipo.categoria === "Máquina" ? 1 : parseInt(nuevoEquipo.cantidad)
      };
      await agregarEquipo(equipoData);
      showAlert('¡Equipo agregado exitosamente!', 'success');
      resetForm();
      setShowAddModal(false);
      await obtenerEquipos();
    } catch (err) {
      showAlert(err.message || 'Error al crear el equipo', 'error');
    } finally {
      setCreando(false);
    }
  };

  const resetForm = () => {
    setNuevoEquipo({
      nombre: "",
      categoria: "Máquina",
      areaId: "",
      cantidad: 1
    });
    setErroresForm({});
  };

  const abrirModalAgregar = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Filtrar equipos
  const equiposFiltrados = equipos.filter(equipo => {
    if (!equipo || typeof equipo !== 'object') return false;
    const nombre = String(equipo.nombre || '');
    const categoria = String(equipo.categoria || '');
    const estado = String(equipo.estado || '');

    const matchesNombre = nombre.toLowerCase().includes(terminoBusqueda.toLowerCase());
    const matchesCategoria = filtroCategoria === "todos" || categoria === filtroCategoria;
    const matchesEstado = filtroEstado === "todos" || estado === filtroEstado;
    return matchesNombre && matchesCategoria && matchesEstado;
  });

  const categorias = ["todos", "Máquina", "Material", "Accesorio", "Otro"];
  const estados = ["todos", "Disponible", "Mantenimiento", "No Disponible", "Fuera de Servicio"];
  const hayFiltrosActivos = terminoBusqueda || filtroCategoria !== 'todos' || filtroEstado !== 'todos';
  const isLoading = loading || buscando;

  const limpiarFiltros = () => {
    setTerminoBusqueda("");
    setFiltroCategoria("todos");
    setFiltroEstado("todos");
    setMostrarPanelFiltros(false);
  };

  if (error && equipos.length === 0) {
    return (
      <div className="lista-equipos-page">
        <div className="lista-container">
          <div className="sin-resultados">
            <i className="fas fa-exclamation-triangle"></i>
            <p>Error al cargar los equipos</p>
            <button className="btn-ver-todos" onClick={obtenerEquipos}>
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && equipos.length === 0) {
    return (
      <div className="lista-loading">
        <div className="loading-spinner"></div>
        <p>Cargando equipos...</p>
      </div>
    );
  }

  return (
    <div className="lista-equipos-page">
      <div className="lista-container">
        {alert.show && (
          <Alert message={alert.message} type={alert.type} onClose={handleCloseAlert} duration={3000} />
        )}

        {/* Modal para crear equipo */}
        {showAddModal && (
          <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
            <div className="modal-container" ref={modalRef} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2><i className="fas fa-plus-circle"></i> Agregar Equipo</h2>
                <button className="modal-close" onClick={() => setShowAddModal(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <form onSubmit={handleCrearEquipo}>
                <div className="modal-body">
                  <div className="form-group">
                    <label><i className="fas fa-tag"></i> Nombre *</label>
                    <input 
                      type="text" 
                      name="nombre" 
                      className={`form-input ${erroresForm.nombre ? 'error' : ''}`}
                      value={nuevoEquipo.nombre} 
                      onChange={handleInputChange}
                      placeholder="Ingrese el nombre del equipo"
                      autoFocus
                    />
                    {erroresForm.nombre && <span className="error-message">{erroresForm.nombre}</span>}
                  </div>
                  <div className="form-group">
                    <label><i className="fas fa-boxes"></i> Categoría *</label>
                    <select name="categoria" className="form-input" value={nuevoEquipo.categoria} onChange={handleInputChange}>
                      <option value="Máquina">Máquina</option>
                      <option value="Material">Material</option>
                     
                    </select>
                  </div>
                  <div className="form-group">
                    <label><i className="fas fa-building"></i> Área *</label>
                    <select 
                      name="areaId" 
                      className={`form-input ${erroresForm.areaId ? 'error' : ''}`}
                      value={nuevoEquipo.areaId} 
                      onChange={handleInputChange}
                    >
                      <option value="">Seleccione un área</option>
                      {areas.map(area => (
                        <option key={area.id} value={area.id}>
                          {area.nombre}
                        </option>
                      ))}
                    </select>
                    {erroresForm.areaId && <span className="error-message">{erroresForm.areaId}</span>}
                  </div>
                  {nuevoEquipo.categoria !== "Máquina" && (
                    <div className="form-group">
                      <label><i className="fas fa-hashtag"></i> Cantidad *</label>
                      <input 
                        type="number" 
                        name="cantidad" 
                        className={`form-input ${erroresForm.cantidad ? 'error' : ''}`}
                        value={nuevoEquipo.cantidad} 
                        onChange={handleInputChange} 
                        min="1" 
                      />
                      {erroresForm.cantidad && <span className="error-message">{erroresForm.cantidad}</span>}
                    </div>
                  )}
                 
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-cancelar" onClick={() => setShowAddModal(false)}>Cancelar</button>
                  <button type="submit" className="btn-guardar" disabled={creando} onClick={(e) => e.stopPropagation()}>
                    {creando ? <><i className="fas fa-spinner fa-spin"></i> Creando...</> : <><i className="fas fa-save"></i> Guardar</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Header con título y acciones */}
        <div className="lista-header">
          <div className="header-left">
            <h1>Equipos</h1>
            <p>Gestiona los equipos del gimnasio</p>
          </div>
          
          <div className="header-actions">
            {/* Filtro avanzado */}
            <div className="filtro-wrapper">
              <button 
                ref={filtroBtnRef}
                className={`btn-icono filtro-btn ${mostrarPanelFiltros ? 'active' : ''}`} 
                title="Filtros avanzados"
                onClick={() => setMostrarPanelFiltros(!mostrarPanelFiltros)}
                disabled={isLoading}
              >
                <i className={`fas fa-filter ${isLoading ? 'fa-spin' : ''}`}></i>
                {(filtroCategoria !== 'todos' || filtroEstado !== 'todos') && !isLoading && (
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
                    <button 
                      className="panel-close"
                      onClick={() => setMostrarPanelFiltros(false)}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  
                  <div className="filtros-grid">
                    <div className="filtro-item">
                      <label>
                        <i className="fas fa-boxes"></i>
                        Categoría:
                      </label>
                      <select
                        className="search-input-modern"
                        value={filtroCategoria}
                        onChange={(e) => setFiltroCategoria(e.target.value)}
                      >
                        {categorias.map(cat => (
                          <option key={cat} value={cat}>
                            {cat === 'todos' ? 'Todas las categorías' : cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="filtro-estados">
                    <span className="estados-label">
                      <i className="fas fa-circle-info"></i>
                      Estado:
                    </span>
                    <div className="estados-buttons">
                      {estados.map(est => (
                        <button 
                          key={est}
                          className={`estado-btn ${filtroEstado === est ? 'active' : ''}`}
                          onClick={() => setFiltroEstado(est)}
                        >
                          {est === 'todos' ? 'Todos' : est}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="filtro-acciones">
                    <button 
                      className="btn-aplicar" 
                      onClick={() => setMostrarPanelFiltros(false)}
                    >
                      <i className="fas fa-check"></i>
                      Aplicar
                    </button>
                    <button 
                      className="btn-limpiar" 
                      onClick={limpiarFiltros}
                    >
                      <i className="fas fa-eraser"></i>
                      Limpiar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Botón Agregar */}
            <button 
              className="btn-agregar"
              onClick={abrirModalAgregar}
              disabled={isLoading}
            >
              <i className="fas fa-plus"></i>
              <span>Agregar</span>
            </button>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="busqueda-container">
          <div className="busqueda-wrapper">
            <i className={`fas fa-search busqueda-icon ${isLoading ? 'fa-spin' : ''}`}></i>
            <input
              type="text"
              className="busqueda-input"
              placeholder="Buscar equipo por nombre..."
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              disabled={isLoading}
            />
            {terminoBusqueda && !isLoading && (
              <button 
                className="busqueda-clear" 
                onClick={() => setTerminoBusqueda("")}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>

        {/* Tabla de equipos */}
        <div className="tabla-container">
          {isLoading ? (
            <div className="cargando-resultados">
              <div className="loading-spinner-small"></div>
              <p>Realizando búsqueda...</p>
            </div>
          ) : equiposFiltrados.length === 0 ? (
            <div className="sin-resultados">
              <i className="fas fa-dumbbell"></i>
              <p>No se encontraron equipos</p>
              {hayFiltrosActivos && (
                <button className="btn-ver-todos" onClick={limpiarFiltros}>
                  Ver todos los equipos
                </button>
              )}
            </div>
          ) : (
            <table className="tabla-equipos">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Equipo</th>
                  <th>Cantidad</th>
                  <th>Categoría</th>
                  <th>Estado</th>
                  <th>Fecha Registro</th>
                  <th>Área</th>
                 </tr>
              </thead>
              <tbody>
                {equiposFiltrados.map((equipo) => (
                  <tr 
                    key={equipo.idEquipo} 
                    className="equipo-row"
                    onClick={() => handleEquipoClick(equipo)}
                  >
                    <td className="equipo-id">#{equipo.idEquipo}</td>
                    <td className="equipo-nombre">
                      <div className="equipo-info">
                        <div className="equipo-avatar">
                          <div className="avatar-initials">
                            {equipo.nombre?.charAt(0).toUpperCase() || 'E'}
                          </div>
                        </div>
                        <div className="equipo-nombre-text">
                          <strong>{equipo.nombre}</strong>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="cantidad-badge">
                        <i className="fas fa-hashtag"></i>
                        {equipo.cantidad}
                      </span>
                    </td>
                    <td>
                      <span className="badge-categoria">
                        <i className="fas fa-boxes"></i>
                        {equipo.categoria}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusClass(equipo.estado)}`}>
                        <i className={`fas ${getStatusIcon(equipo.estado)}`}></i>
                        {equipo.estado}
                      </span>
                    </td>
                    <td>{equipo.fechaRegistro}</td>
                    <td>
                      <span className="area-badge">
                        <i className="fas fa-building"></i>
                        {getAreaNombre(equipo.area)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Resumen de resultados */}
        {!isLoading && equiposFiltrados.length > 0 && (
          <div className="lista-resumen">
            <p>
              <i className="fas fa-dumbbell"></i>
              Total de equipos: <strong>{equiposFiltrados.length}</strong>
            </p>
            <p>
              <i className="fas fa-check-circle" style={{ color: '#2e7d32' }}></i>
              Disponibles: <strong>{equiposFiltrados.filter(e => e.estado === 'Disponible').length}</strong>
            </p>
            <p>
              <i className="fas fa-tools" style={{ color: '#ed6c02' }}></i>
              Mantenimiento: <strong>{equiposFiltrados.filter(e => e.estado === 'Mantenimiento').length}</strong>
            </p>
            <p>
              <i className="fas fa-ban" style={{ color: '#c62828' }}></i>
              Fuera de servicio: <strong>{equiposFiltrados.filter(e => e.estado === 'Fuera de servicio').length}</strong>
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
};

export default ListadoGeneralEquipo;