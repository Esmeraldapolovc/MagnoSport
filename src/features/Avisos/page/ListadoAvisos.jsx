import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useNoticia from "../hook/useAvisos";
import Alert from "../../../components/Alert";
import "../../../assets/styles/ListadoAvisos.css";

const ListadoAvisos = () => {
  const navigate = useNavigate();
  const {
    noticias,
    loading,
    error,
    obtenerNoticias,
    agregarNoticia,
    actualizarNoticia,
    obtenerDetalleNoticia,
    borrarNoticia,
    buscarPorFecha
  } = useNoticia();

  const [fechaBusqueda, setFechaBusqueda] = useState("");
  const [mostrarPanelFiltros, setMostrarPanelFiltros] = useState(false);
  const [eliminando, setEliminando] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [noticiaSeleccionada, setNoticiaSeleccionada] = useState(null);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [buscando, setBuscando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  
  // Estado para el modal de crear
  const [showModal, setShowModal] = useState(false);
  const [creando, setCreando] = useState(false);
  const [nuevaNoticia, setNuevaNoticia] = useState({
    titulo: "",
    descripcion: ""
  });
  const [erroresForm, setErroresForm] = useState({});

  // Estado para el modal de editar
  const [showEditModal, setShowEditModal] = useState(false);
  const [editando, setEditando] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [noticiaEdit, setNoticiaEdit] = useState({
    idNoticia: null,
    titulo: "",
    descripcion: ""
  });
  const [erroresEditForm, setErroresEditForm] = useState({});

  const filtroBtnRef = useRef(null);
  const panelRef = useRef(null);
  const modalRef = useRef(null);
  const editModalRef = useRef(null);

  useEffect(() => {
    obtenerNoticias();
  }, [obtenerNoticias]);

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

  // Cerrar modal de crear al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowModal(false);
        resetForm();
      }
    };

    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showModal]);

  // Cerrar modal de editar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editModalRef.current && !editModalRef.current.contains(event.target)) {
        setShowEditModal(false);
        resetEditForm();
      }
    };

    if (showEditModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEditModal]);

  const handleEditar = async (noticia) => {
    setCargandoDetalle(true);
    setShowEditModal(true);
    
    try {
      const detalle = await obtenerDetalleNoticia(noticia.idNoticia);
      
      setNoticiaEdit({
        idNoticia: detalle.idNoticia,
        titulo: detalle.titulo,
        descripcion: detalle.descripcion
      });
    } catch (err) {
      showAlert('Error al cargar los detalles de la noticia', 'error');
      setShowEditModal(false);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const handleEliminarClick = (noticia) => {
    setNoticiaSeleccionada(noticia);
    setShowConfirmDialog(true);
  };

  const handleEliminarConfirmado = async () => {
    if (!noticiaSeleccionada) return;
    
    setEliminando(noticiaSeleccionada.idNoticia);
    setShowConfirmDialog(false);

    try {
      await borrarNoticia({ idNoticia: noticiaSeleccionada.idNoticia });
      showAlert('Noticia eliminada exitosamente', 'success');
      await cargarNoticias();
    } catch (err) {
      showAlert('Error al eliminar la noticia', 'error');
    } finally {
      setEliminando(null);
      setNoticiaSeleccionada(null);
    }
  };

  const cargarNoticias = async () => {
    setBuscando(true);
    try {
      await obtenerNoticias();
    } catch (err) {
      showAlert('Error al cargar noticias', 'error');
    } finally {
      setBuscando(false);
    }
  };

  const aplicarFiltros = async () => {
    setBuscando(true);
    try {
      if (fechaBusqueda) {
        await buscarPorFecha(fechaBusqueda);
      } else {
        await obtenerNoticias();
      }
    } catch (err) {
      showAlert('Error al aplicar filtros', 'error');
    } finally {
      setBuscando(false);
      setMostrarPanelFiltros(false);
    }
  };

  const limpiarFiltros = () => {
    setFechaBusqueda("");
    setFiltroEstado("todos");
    cargarNoticias();
    setMostrarPanelFiltros(false);
  };

  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, type, message });
  };

  const handleCloseAlert = () => {
    setAlert({ show: false, type: '', message: '' });
  };

  const getInitials = (titulo) => {
    return titulo?.charAt(0).toUpperCase() || 'N';
  };

  // Función  para formatear fecha SIN problemas de zona horaria
  const formatearFecha = (fecha) => {
    if (!fecha) return "—";
    // Parsear manualmente para evitar el desfase de zona horaria
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  };

  // Función para formatear hora (solo HH:MM)
  const formatearHora = (hora) => {
    if (!hora) return "—";
    return hora.substring(0, 5);
  };

  // Validar formulario de crear
  const validarFormulario = () => {
    const errors = {};
    if (!nuevaNoticia.titulo.trim()) {
      errors.titulo = "El título es obligatorio";
    } else if (nuevaNoticia.titulo.length < 3) {
      errors.titulo = "El título debe tener al menos 3 caracteres";
    } else if (nuevaNoticia.titulo.length > 100) {
      errors.titulo = "El título no puede exceder 100 caracteres";
    }

    if (!nuevaNoticia.descripcion.trim()) {
      errors.descripcion = "La descripción es obligatoria";
    } else if (nuevaNoticia.descripcion.length < 10) {
      errors.descripcion = "La descripción debe tener al menos 10 caracteres";
    } else if (nuevaNoticia.descripcion.length > 500) {
      errors.descripcion = "La descripción no puede exceder 500 caracteres";
    }

    setErroresForm(errors);
    return Object.keys(errors).length === 0;
  };

  // Validar formulario de editar
  const validarEditFormulario = () => {
    const errors = {};
    if (!noticiaEdit.titulo.trim()) {
      errors.titulo = "El título es obligatorio";
    } else if (noticiaEdit.titulo.length < 3) {
      errors.titulo = "El título debe tener al menos 3 caracteres";
    } else if (noticiaEdit.titulo.length > 100) {
      errors.titulo = "El título no puede exceder 100 caracteres";
    }

    if (!noticiaEdit.descripcion.trim()) {
      errors.descripcion = "La descripción es obligatoria";
    } else if (noticiaEdit.descripcion.length < 10) {
      errors.descripcion = "La descripción debe tener al menos 10 caracteres";
    } else if (noticiaEdit.descripcion.length > 500) {
      errors.descripcion = "La descripción no puede exceder 500 caracteres";
    }

    setErroresEditForm(errors);
    return Object.keys(errors).length === 0;
  };

  // Manejar cambio en inputs de crear
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevaNoticia(prev => ({ ...prev, [name]: value }));
    if (erroresForm[name]) {
      setErroresForm(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Manejar cambio en inputs de editar
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setNoticiaEdit(prev => ({ ...prev, [name]: value }));
    if (erroresEditForm[name]) {
      setErroresEditForm(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Crear nueva noticia
  const handleCrearNoticia = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setCreando(true);
    try {
      const fechaActual = new Date();
      const noticiaCompleta = {
        ...nuevaNoticia,
        estado: 1,
        fechaPublicacion: fechaActual.toISOString().split('T')[0],
        horaPublicacion: fechaActual.toTimeString().split(' ')[0]
      };
      
      await agregarNoticia(noticiaCompleta);
      showAlert('¡Aviso Publicado!', 'success');
      resetForm();
      setShowModal(false);
      await cargarNoticias();
    } catch (err) {
      showAlert(err.message || 'Error al crear la noticia', 'error');
    } finally {
      setCreando(false);
    }
  };

  // Actualizar noticia
  const handleActualizarNoticia = async (e) => {
    e.preventDefault();
    
    if (!validarEditFormulario()) {
      return;
    }

    setEditando(true);
    try {
      const noticiaActualizada = {
        idNoticia: noticiaEdit.idNoticia,
        titulo: noticiaEdit.titulo,
        descripcion: noticiaEdit.descripcion
      };
      
      await actualizarNoticia(noticiaActualizada);
      showAlert('¡Noticia actualizada exitosamente!', 'success');
      resetEditForm();
      setShowEditModal(false);
      await cargarNoticias();
    } catch (err) {
      showAlert(err.message || 'Error al actualizar la noticia', 'error');
    } finally {
      setEditando(false);
    }
  };

  const resetForm = () => {
    setNuevaNoticia({
      titulo: "",
      descripcion: ""
    });
    setErroresForm({});
  };

  const resetEditForm = () => {
    setNoticiaEdit({
      idNoticia: null,
      titulo: "",
      descripcion: ""
    });
    setErroresEditForm({});
  };

  const abrirModal = () => {
    resetForm();
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    resetForm();
  };

  const cerrarEditModal = () => {
    setShowEditModal(false);
    resetEditForm();
  };

  // Filtrar noticias por estado (cliente-side)
  const noticiasFiltradas = noticias.filter(noticia => {
    if (filtroEstado === "activos") return noticia.estado === 1;
    if (filtroEstado === "inactivos") return noticia.estado === 0;
    return true;
  });

  const hayFiltrosActivos = fechaBusqueda || filtroEstado !== 'todos';
  const isLoading = loading || buscando;

  if (error && noticias.length === 0) {
    return (
      <div className="lista-avisos-page">
        <div className="lista-container">
          <div className="sin-resultados">
            <i className="fas fa-exclamation-triangle"></i>
            <p>Error al cargar las noticias</p>
            <button 
              className="btn-ver-todos"
              onClick={cargarNoticias}
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && noticias.length === 0) {
    return (
      <div className="lista-loading">
        <div className="loading-spinner"></div>
        <p>Cargando noticias...</p>
      </div>
    );
  }

  return (
    <div className="lista-avisos-page">
      {/* Alert personalizado */}
      {alert.show && (
        <Alert 
          message={alert.message} 
          type={alert.type} 
          onClose={handleCloseAlert}
          duration={3000}
        />
      )}

      {/* Modal para editar noticia */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-container" ref={editModalRef}>
            <div className="modal-header">
              <h2>
                <i className="fas fa-edit"></i>
                Editar Noticia
              </h2>
              <button className="modal-close" onClick={cerrarEditModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            {cargandoDetalle ? (
              <div className="modal-body text-center">
                <div className="loading-spinner-small"></div>
                <p>Cargando detalles...</p>
              </div>
            ) : (
              <form onSubmit={handleActualizarNoticia}>
                <div className="modal-body">
                  <div className="form-group">
                    <label htmlFor="edit-titulo">
                      <i className="fas fa-heading"></i>
                      Título *
                    </label>
                    <input
                      type="text"
                      id="edit-titulo"
                      name="titulo"
                      className={`form-input ${erroresEditForm.titulo ? 'error' : ''}`}
                      placeholder="Ingrese el título de la noticia"
                      value={noticiaEdit.titulo}
                      onChange={handleEditInputChange}
                      maxLength="100"
                      autoFocus
                    />
                    {erroresEditForm.titulo && (
                      <span className="error-message">{erroresEditForm.titulo}</span>
                    )}
                    <small className="char-counter">
                      {noticiaEdit.titulo.length}/100 caracteres
                    </small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-descripcion">
                      <i className="fas fa-align-left"></i>
                      Descripción *
                    </label>
                    <textarea
                      id="edit-descripcion"
                      name="descripcion"
                      className={`form-textarea ${erroresEditForm.descripcion ? 'error' : ''}`}
                      placeholder="Ingrese la descripción de la noticia"
                      value={noticiaEdit.descripcion}
                      onChange={handleEditInputChange}
                      rows="5"
                      maxLength="500"
                    />
                    {erroresEditForm.descripcion && (
                      <span className="error-message">{erroresEditForm.descripcion}</span>
                    )}
                    <small className="char-counter">
                      {noticiaEdit.descripcion.length}/500 caracteres
                    </small>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-cancelar" onClick={cerrarEditModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-guardar" disabled={editando}>
                    {editando ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save"></i>
                        Actualizar Noticia
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal para crear noticia */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container" ref={modalRef}>
            <div className="modal-header">
              <h2>
                <i className="fas fa-plus-circle"></i>
                Crear Nueva Noticia
              </h2>
              <button className="modal-close" onClick={cerrarModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleCrearNoticia}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="titulo">
                    <i className="fas fa-heading"></i>
                    Título *
                  </label>
                  <input
                    type="text"
                    id="titulo"
                    name="titulo"
                    className={`form-input ${erroresForm.titulo ? 'error' : ''}`}
                    placeholder="Ingrese el título de la noticia"
                    value={nuevaNoticia.titulo}
                    onChange={handleInputChange}
                    maxLength="100"
                    autoFocus
                  />
                  {erroresForm.titulo && (
                    <span className="error-message">{erroresForm.titulo}</span>
                  )}
                  <small className="char-counter">
                    {nuevaNoticia.titulo.length}/100 caracteres
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="descripcion">
                    <i className="fas fa-align-left"></i>
                    Descripción *
                  </label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    className={`form-textarea ${erroresForm.descripcion ? 'error' : ''}`}
                    placeholder="Ingrese la descripción de la noticia"
                    value={nuevaNoticia.descripcion}
                    onChange={handleInputChange}
                    rows="5"
                    maxLength="500"
                  />
                  {erroresForm.descripcion && (
                    <span className="error-message">{erroresForm.descripcion}</span>
                  )}
                  <small className="char-counter">
                    {nuevaNoticia.descripcion.length}/500 caracteres
                  </small>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancelar" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-guardar" disabled={creando}>
                  {creando ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Creando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Guardar Noticia
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Diálogo de confirmación para eliminar */}
      {showConfirmDialog && noticiaSeleccionada && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <div className="confirm-dialog-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3>¿Eliminar noticia?</h3>
            <p>¿Estás seguro de que deseas eliminar la noticia <strong>{noticiaSeleccionada.titulo}</strong>?</p>
            <p className="confirm-dialog-warning">Esta acción no se puede deshacer.</p>
            <div className="confirm-dialog-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowConfirmDialog(false);
                  setNoticiaSeleccionada(null);
                }}
                disabled={eliminando === noticiaSeleccionada.idNoticia}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleEliminarConfirmado}
                disabled={eliminando === noticiaSeleccionada.idNoticia}
              >
                {eliminando === noticiaSeleccionada.idNoticia ? (
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
            <h1>Noticias</h1>
            <p>Gestiona las noticias del sistema</p>
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
                {(filtroEstado !== 'todos' || fechaBusqueda) && !isLoading && (
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
                        <i className="fas fa-calendar-alt"></i>
                        Fecha de publicación:
                      </label>
                      <input
                        type="date"
                        className="search-input-modern"
                        value={fechaBusqueda}
                        onChange={(e) => setFechaBusqueda(e.target.value)}
                        placeholder="Seleccionar fecha"
                      />
                    </div>
                  </div>

                  <div className="filtro-acciones">
                    <button 
                      className="btn-aplicar" 
                      onClick={aplicarFiltros}
                      disabled={isLoading}
                    >
                      <i className="fas fa-search"></i>
                      {isLoading ? 'Aplicando...' : 'Aplicar filtros'}
                    </button>
                    <button 
                      className="btn-limpiar" 
                      onClick={limpiarFiltros}
                      disabled={isLoading}
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
              onClick={abrirModal}
              disabled={isLoading}
            >
              <i className="fas fa-plus"></i>
              <span>Agregar</span>
            </button>
          </div>
        </div>

        {/* Tabla de noticias */}
        <div className="tabla-container">
          {isLoading ? (
            <div className="cargando-resultados">
              <div className="loading-spinner-small"></div>
              <p>Realizando búsqueda...</p>
            </div>
          ) : noticiasFiltradas.length === 0 ? (
            <div className="sin-resultados">
              <i className="fas fa-newspaper"></i>
              <p>No se encontraron noticias</p>
              {hayFiltrosActivos && (
                <button 
                  className="btn-ver-todos"
                  onClick={limpiarFiltros}
                  disabled={isLoading}
                >
                  Ver todas las noticias
                </button>
              )}
            </div>
          ) : (
            <table className="tabla-noticias">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Título</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>Fecha Publicación</th>
                  <th>Hora</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {noticiasFiltradas.map((noticia) => (
                  <tr key={noticia.idNoticia}>
                    <td className="noticia-id">#{noticia.idNoticia}</td>
                    <td className="noticia-titulo">
                      <div className="noticia-info">
                        <div className="noticia-avatar">
                          <div className="avatar-initials">
                            {getInitials(noticia.titulo)}
                          </div>
                        </div>
                        <div className="noticia-nombre">
                          <strong>{noticia.titulo}</strong>
                        </div>
                      </div>
                    </td>
                    <td className="noticia-descripcion">
                      <div className="descripcion-texto">
                        {noticia.descripcion?.length > 50 
                          ? `${noticia.descripcion.substring(0, 50)}...` 
                          : noticia.descripcion || "Sin descripción"}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${noticia.estado === 1 ? 'badge-activo' : 'badge-inactivo'}`}>
                        <i className={`fas ${noticia.estado === 1 ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                        {noticia.estado === 1 ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>{formatearFecha(noticia.fechaPublicacion)}</td>
                    <td>
                      <span className="hora-badge">
                        <i className="fas fa-clock"></i>
                        {formatearHora(noticia.horaPublicacion)}
                      </span>
                    </td>
                    <td>
                      <div className="acciones">
                        <button 
                          className="btn-icon btn-editar"
                          onClick={() => handleEditar(noticia)}
                          title="Editar noticia"
                          disabled={isLoading || eliminando === noticia.idNoticia}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className="btn-icon btn-eliminar"
                          onClick={() => handleEliminarClick(noticia)}
                          title="Eliminar noticia"
                          disabled={isLoading || eliminando === noticia.idNoticia}
                        >
                          {eliminando === noticia.idNoticia ? (
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
        {!isLoading && noticiasFiltradas.length > 0 && (
          <div className="lista-resumen">
            <p>
              <i className="fas fa-newspaper"></i>
              Total de noticias: <strong>{noticiasFiltradas.length}</strong>
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

export default ListadoAvisos;