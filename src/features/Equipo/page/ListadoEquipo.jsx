import React, { useEffect, useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import useEquipo from "../hook/useEquipo";
import Alert from "../../../components/Alert";
import "../../../assets/styles/ListadoEquipo.css";

const ListadoEquipo = () => {
  const { nombreEquipo: nombreParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { equipos, buscarPorNombre, agregarEquipo, editarEquipo, obtenerPorId, loading, error } = useEquipo();
  const [nombreBuscado, setNombreBuscado] = useState("");
  
  // Estados para filtros
  const [mostrarPanelFiltros, setMostrarPanelFiltros] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const filtroBtnRef = useRef(null);
  const panelRef = useRef(null);
  
  // Estados para modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  
  // Opciones de área
  const areas = [
    { id: 1, nombre: "Gimnasio" },
    { id: 2, nombre: "Cardio" },
    { id: 3, nombre: "TRX" },
    { id: 4, nombre: "Cancha bolada" },
    { id: 5, nombre: "Cancha de Tenis" }
  ];
  
  // Estado para nuevo equipo
  const [nuevoEquipo, setNuevoEquipo] = useState({
    nombre: "",
    categoria: "Máquina",
    areaId: "",
    cantidad: 1
  });
  const [erroresForm, setErroresForm] = useState({});
  
  // Estado para editar equipo
  const [equipoEdit, setEquipoEdit] = useState({
    idEquipo: null,
    nombre: "",
    categoria: "Máquina",
    fechaRegistro: "",
    estado: "Disponible",
    areaId: "",
    cantidad: 1
  });
  const [erroresEditForm, setErroresEditForm] = useState({});

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

  // Obtener el nombre del equipo desde params o state
  useEffect(() => {
    const nombre = nombreParam || location.state?.nombreEquipo;
    if (nombre) {
      setNombreBuscado(nombre);
      buscarPorNombre(nombre);
    }
  }, [nombreParam, location.state]);

  const getStatusClass = (estado) => {
    switch (estado) {
      case "Disponible":
        return "status-disponible";
      case "Mantenimiento":
        return "status-mantenimiento";
      case "Fuera de servicio":
        return "status-baja";
      case "No disponible":
        return "status-no-disponible";
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
      case "Fuera de servicio":
        return "fa-ban";
      case "No disponible":
        return "fa-times-circle";
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

  // Validar formulario de editar
  const validarEditFormulario = () => {
    const errors = {};
    if (!equipoEdit.nombre.trim()) {
      errors.nombre = "El nombre es obligatorio";
    } else if (equipoEdit.nombre.length < 3) {
      errors.nombre = "El nombre debe tener al menos 3 caracteres";
    }
    if (!equipoEdit.areaId) {
      errors.areaId = "El área es obligatoria";
    }
    if (equipoEdit.cantidad < 1) {
      errors.cantidad = "La cantidad debe ser mayor a 0";
    }
    setErroresEditForm(errors);
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

  // Manejar cambio en inputs de editar
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEquipoEdit(prev => ({ ...prev, [name]: value }));
    if (erroresEditForm[name]) {
      setErroresEditForm(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Abrir modal de agregar con el nombre y categoría pre-cargados
  const abrirModalAgregar = () => {
    const nombreEquipoActual = nombreBuscado || location.state?.nombreEquipo || "";
    
    let categoriaPredeterminada = "Máquina";
    if (equipos.length > 0 && equipos[0].categoria) {
      categoriaPredeterminada = equipos[0].categoria;
    }
    
    setNuevoEquipo({
      nombre: nombreEquipoActual,
      categoria: categoriaPredeterminada,
      areaId: "",
      cantidad: 1
    });
    setErroresForm({});
    setShowAddModal(true);
  };

  // Crear nuevo equipo
  const handleCrearEquipo = async (e) => {
    e.preventDefault();
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
      await buscarPorNombre(nombreBuscado);
    } catch (err) {
      showAlert(err.message || 'Error al crear el equipo', 'error');
    } finally {
      setCreando(false);
    }
  };

  // Abrir modal de editar y cargar datos
  const handleEditarClick = async (equipo) => {
    setCargandoDetalle(true);
    setShowEditModal(true);
    try {
      const detalle = await obtenerPorId(equipo.idEquipo);
      setEquipoEdit({
        idEquipo: detalle.idEquipo,
        nombre: detalle.nombre,
        categoria: detalle.categoria,
        fechaRegistro: detalle.fechaRegistro,
        estado: detalle.estado,
        areaId: detalle.area,
        cantidad: detalle.cantidad
      });
    } catch (err) {
      showAlert('Error al cargar los detalles del equipo', 'error');
      setShowEditModal(false);
    } finally {
      setCargandoDetalle(false);
    }
  };

  // Actualizar equipo
  const handleActualizarEquipo = async (e) => {
    e.preventDefault();
    if (!validarEditFormulario()) return;

    setEditando(true);
    try {
      const equipoData = {
        idEquipo: equipoEdit.idEquipo,
        nombre: equipoEdit.nombre,
        categoria: equipoEdit.categoria,
        fechaRegistro: equipoEdit.fechaRegistro,
        estado: equipoEdit.estado,
        areaId: parseInt(equipoEdit.areaId),
        cantidad: equipoEdit.categoria === "Máquina" ? 1 : parseInt(equipoEdit.cantidad)
      };
      await editarEquipo(equipoData);
      showAlert('¡Equipo actualizado exitosamente!', 'success');
      setShowEditModal(false);
      await buscarPorNombre(nombreBuscado);
    } catch (err) {
      showAlert(err.message || 'Error al actualizar el equipo', 'error');
    } finally {
      setEditando(false);
    }
  };

  // Abrir modal de eliminar (cambiar estado a Fuera de servicio)
  const handleEliminarClick = (equipo) => {
    setEquipoSeleccionado(equipo);
    setShowDeleteModal(true);
  };

  // Confirmar eliminación (cambiar estado a Fuera de servicio)
  const handleConfirmarEliminar = async () => {
    if (!equipoSeleccionado) return;
    
    setEliminando(true);
    try {
      const equipoData = {
        idEquipo: equipoSeleccionado.idEquipo,
        nombre: equipoSeleccionado.nombre,
        categoria: equipoSeleccionado.categoria,
        fechaRegistro: equipoSeleccionado.fechaRegistro,
        estado: "Fuera de servicio",
        areaId: equipoSeleccionado.area,
        cantidad: equipoSeleccionado.cantidad
      };
      await editarEquipo(equipoData);
      showAlert('Equipo marcado como Fuera de servicio', 'success');
      setShowDeleteModal(false);
      await buscarPorNombre(nombreBuscado);
    } catch (err) {
      showAlert(err.message || 'Error al cambiar el estado del equipo', 'error');
    } finally {
      setEliminando(false);
      setEquipoSeleccionado(null);
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

  const handleBuscar = (e) => {
    e.preventDefault();
    if (nombreBuscado.trim()) {
      buscarPorNombre(nombreBuscado);
      navigate(`/equipos/${encodeURIComponent(nombreBuscado)}`);
    }
  };

  const limpiarFiltros = () => {
    setFiltroCategoria("todos");
    setFiltroEstado("todos");
    setMostrarPanelFiltros(false);
  };

  // Filtrar equipos
  const equiposFiltrados = equipos.filter(equipo => {
    const matchesCategoria = filtroCategoria === "todos" || equipo.categoria === filtroCategoria;
    const matchesEstado = filtroEstado === "todos" || equipo.estado === filtroEstado;
    return matchesCategoria && matchesEstado;
  });

  const categorias = ["todos", "Máquina", "Material", "Accesorio", "Otro"];
  const estados = ["todos", "Disponible", "Mantenimiento", "No Disponible", "Fuera de Servicio"];
  const hayFiltrosActivos = filtroCategoria !== 'todos' || filtroEstado !== 'todos';
  const isLoading = loading;

  if (loading && equipos.length === 0) {
    return (
      <div className="listado-equipo-page">
        <div className="listado-equipo-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Buscando equipos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="listado-equipo-page">
      <div className="listado-equipo-container">
        {alert.show && (
          <Alert message={alert.message} type={alert.type} onClose={handleCloseAlert} duration={3000} />
        )}

        {/* Modal para crear equipo */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h2><i className="fas fa-plus-circle"></i> Agregar {nuevoEquipo.nombre || "Equipo"}</h2>
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
                      className="form-input readonly-input"
                      value={nuevoEquipo.nombre}
                      readOnly
                      disabled
                    />
                    <small className="readonly-hint">El nombre del equipo está predefinido</small>
                  </div>
                  <div className="form-group">
                    <label><i className="fas fa-boxes"></i> Categoría *</label>
                    <select 
                      name="categoria" 
                      className="form-input readonly-input"
                      value={nuevoEquipo.categoria}
                      disabled
                    >
                      <option value="Máquina">Máquina</option>
                      <option value="Material">Material</option>
                    </select>
                    <small className="readonly-hint">La categoría está predefinida según el equipo</small>
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
                      <input type="number" name="cantidad" className={`form-input ${erroresForm.cantidad ? 'error' : ''}`}
                        value={nuevoEquipo.cantidad} onChange={handleInputChange} min="1" />
                      {erroresForm.cantidad && <span className="error-message">{erroresForm.cantidad}</span>}
                    </div>
                  )}
                  {nuevoEquipo.categoria === "Máquina" && (
                    <div className="form-info">
                      <i className="fas fa-info-circle"></i> Las máquinas siempre tienen cantidad 1
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-cancelar" onClick={() => setShowAddModal(false)}>Cancelar</button>
                  <button type="submit" className="btn-guardar" disabled={creando}>
                    {creando ? <><i className="fas fa-spinner fa-spin"></i> Creando...</> : <><i className="fas fa-save"></i> Guardar</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal para editar equipo */}
        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h2><i className="fas fa-edit"></i> Editar Equipo</h2>
                <button className="modal-close" onClick={() => setShowEditModal(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              {cargandoDetalle ? (
                <div className="modal-body text-center"><div className="loading-spinner-small"></div><p>Cargando...</p></div>
              ) : (
                <form onSubmit={handleActualizarEquipo}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label><i className="fas fa-tag"></i> Nombre *</label>
                      <input type="text" name="nombre" className={`form-input ${erroresEditForm.nombre ? 'error' : ''}`}
                        value={equipoEdit.nombre} onChange={handleEditInputChange} />
                      {erroresEditForm.nombre && <span className="error-message">{erroresEditForm.nombre}</span>}
                    </div>
                    <div className="form-group">
                      <label><i className="fas fa-boxes"></i> Categoría *</label>
                      <select name="categoria" className="form-input" value={equipoEdit.categoria} onChange={handleEditInputChange}>
                        <option value="Máquina">Máquina</option>
                        <option value="Material">Material</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label><i className="fas fa-circle-info"></i> Estado *</label>
                      <select name="estado" className="form-input" value={equipoEdit.estado} onChange={handleEditInputChange}>
                        <option value="Disponible">Disponible</option>
                        <option value="Mantenimiento">Mantenimiento</option>
                        <option value="No disponible">No disponible</option>
                        <option value="Fuera de servicio">Fuera de servicio</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label><i className="fas fa-building"></i> Área *</label>
                      <select 
                        name="areaId" 
                        className={`form-input ${erroresEditForm.areaId ? 'error' : ''}`}
                        value={equipoEdit.areaId} 
                        onChange={handleEditInputChange}
                      >
                        <option value="">Seleccione un área</option>
                        {areas.map(area => (
                          <option key={area.id} value={area.id}>
                            {area.nombre}
                          </option>
                        ))}
                      </select>
                      {erroresEditForm.areaId && <span className="error-message">{erroresEditForm.areaId}</span>}
                    </div>
                    {equipoEdit.categoria !== "Máquina" && (
                      <div className="form-group">
                        <label><i className="fas fa-hashtag"></i> Cantidad *</label>
                        <input type="number" name="cantidad" className={`form-input ${erroresEditForm.cantidad ? 'error' : ''}`}
                          value={equipoEdit.cantidad} onChange={handleEditInputChange} min="1" />
                        {erroresEditForm.cantidad && <span className="error-message">{erroresEditForm.cantidad}</span>}
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn-cancelar" onClick={() => setShowEditModal(false)}>Cancelar</button>
                    <button type="submit" className="btn-guardar" disabled={editando}>
                      {editando ? <><i className="fas fa-spinner fa-spin"></i> Actualizando...</> : <><i className="fas fa-save"></i> Actualizar</>}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Modal para eliminar (cambiar estado a Fuera de servicio) */}
        {showDeleteModal && equipoSeleccionado && (
          <div className="confirm-dialog-overlay">
            <div className="confirm-dialog">
              <div className="confirm-dialog-icon"><i className="fas fa-exclamation-triangle"></i></div>
              <h3>¿Dar de baja equipo?</h3>
              <p>¿Estás seguro de que deseas marcar el equipo <strong>{equipoSeleccionado.nombre}</strong> como <strong>Fuera de servicio</strong>?</p>
              <p className="confirm-dialog-warning">Esta acción no se puede deshacer.</p>
              <div className="confirm-dialog-actions">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)} disabled={eliminando}>Cancelar</button>
                <button className="btn btn-danger" onClick={handleConfirmarEliminar} disabled={eliminando}>
                  {eliminando ? <><i className="fas fa-spinner fa-spin"></i> Procesando...</> : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header con título y acciones */}
        <div className="listado-equipo-header">
          <div className="header-left">
            <button onClick={() => navigate(-1)} className="btn-back">
              <i className="fas fa-arrow-left"></i> 
            </button>
            <div className="header-title">
              <h1>Equipos: {nombreBuscado || "Resultados de búsqueda"}</h1>
              <p>Gestión y visualización de equipos por nombre</p>
            </div>
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
                    <h4><i className="fas fa-filter"></i> Filtros avanzados</h4>
                    <button className="panel-close" onClick={() => setMostrarPanelFiltros(false)}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  
                  

                  <div className="filtro-estados">
                    <span className="estados-label">
                      <i className="fas fa-circle-info"></i> Estado:
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
                    <button className="btn-aplicar" onClick={() => setMostrarPanelFiltros(false)}>
                      <i className="fas fa-check"></i> Aplicar
                    </button>
                    <button className="btn-limpiar" onClick={limpiarFiltros}>
                      <i className="fas fa-eraser"></i> Limpiar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Botón Agregar */}
            <button className="btn-agregar" onClick={abrirModalAgregar} disabled={isLoading}>
              <i className="fas fa-plus"></i>
              <span>Agregar</span>
            </button>
          </div>
        </div>

       

        {/* Error */}
        {error && (
          <div className="error-container">
            <div className="error-icon"><i className="fas fa-exclamation-triangle"></i></div>
            <h3>Error</h3>
            <p>{error.message || "Ocurrió un error al buscar los equipos"}</p>
            <button onClick={() => buscarPorNombre(nombreBuscado)} className="btn-retry">
              <i className="fas fa-sync-alt"></i> Reintentar
            </button>
          </div>
        )}

        {/* Sin resultados */}
        {equiposFiltrados.length === 0 && !loading && !error && (
          <div className="empty-state">
            <div className="empty-icon"><i className="fas fa-dumbbell"></i></div>
            <h3>No se encontraron equipos</h3>
            <p>No hay equipos registrados con el nombre "{nombreBuscado}"</p>
            {hayFiltrosActivos && (
              <button className="btn-ver-todos" onClick={limpiarFiltros}>
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {/* Tabla */}
        {equiposFiltrados.length > 0 && (
          <>
            <div className="tabla-wrapper">
              <table className="tabla-equipos-detalle">
                <thead>
                  <tr><th>ID</th><th>Nombre</th><th>Cantidad</th><th>Categoría</th><th>Estado</th><th>Fecha Registro</th><th>Área</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {equiposFiltrados.map((equipo) => (
                    <tr key={equipo.idEquipo}>
                      <td className="equipo-id">#{equipo.idEquipo}</td>
                      <td className="equipo-nombre">{equipo.nombre}</td>
                      <td><span className="cantidad-badge"><i className="fas fa-hashtag"></i>{equipo.cantidad}</span></td>
                      <td><span className="categoria-badge"><i className="fas fa-boxes"></i>{equipo.categoria}</span></td>
                      <td><span className={`status-badge ${getStatusClass(equipo.estado)}`}>
                        <i className={`fas ${getStatusIcon(equipo.estado)}`}></i>{equipo.estado}
                      </span></td>
                      <td>{equipo.fechaRegistro}</td>
                      <td><span className="area-badge">
                        <i className="fas fa-building"></i>
                        {getAreaNombre(equipo.area)}
                      </span></td>
                      <td>
                        <div className="acciones">
                          <button className="btn-icon btn-editar" onClick={() => handleEditarClick(equipo)} title="Editar">
                            <i className="fas fa-edit"></i>
                          </button>
                          <button className="btn-icon btn-eliminar" onClick={() => handleEliminarClick(equipo)} title="Dar de baja">
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="info-adicional">
              <div className="total-registros"><i className="fas fa-dumbbell"></i>Total: <strong>{equiposFiltrados.length}</strong></div>
              {hayFiltrosActivos && (
                <div className="filtro-activo-indicador">
                  <i className="fas fa-filter"></i> Filtros activos
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ListadoEquipo;