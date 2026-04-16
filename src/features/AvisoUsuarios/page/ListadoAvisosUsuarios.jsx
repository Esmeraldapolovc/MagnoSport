import React, { useEffect, useState, useRef } from "react";
import useAvisosUsuarios from "../hook/useAvisosUsuarios";
import "../../../assets/styles/ListadoAvisosUsuarios.css";

const ListadoAvisosUsuarios = () => {
  const { noticias, detalle, loading, error, obtenerNoticias, obtenerDetalleNoticia } = useAvisosUsuarios();
  const [noticiaSeleccionada, setNoticiaSeleccionada] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modoVista, setModoVista] = useState("grid");
  const modalRef = useRef(null);

  useEffect(() => {
    obtenerNoticias();
  }, [obtenerNoticias]);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleVerDetalle = async (noticia) => {
    await obtenerDetalleNoticia(noticia.idNoticia);
    setNoticiaSeleccionada(noticia);
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setNoticiaSeleccionada(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        cerrarModal();
      }
    };

    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showModal]);

  // Función para ordenar noticias por fecha más reciente
  const ordenarNoticias = (noticiasArray) => {
    if (!noticiasArray || noticiasArray.length === 0) return [];
    
    return [...noticiasArray].sort((a, b) => {
      // Primero comparar por fecha
      const fechaA = new Date(a.fechaPublicacion);
      const fechaB = new Date(b.fechaPublicacion);
      
      if (fechaA > fechaB) return -1;
      if (fechaA < fechaB) return 1;
      
      // Si la fecha es igual, comparar por hora
      if (a.horaPublicacion && b.horaPublicacion) {
        const horaA = a.horaPublicacion;
        const horaB = b.horaPublicacion;
        if (horaA > horaB) return -1;
        if (horaA < horaB) return 1;
      }
      
      return 0;
    });
  };

  // Función corregida para formatear fecha sin problemas de zona horaria
  const formatearFecha = (fecha) => {
    if (!fecha) return "Fecha no disponible";
    
    const [year, month, day] = fecha.split('-');
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    
    return `${parseInt(day)} de ${meses[parseInt(month) - 1]} de ${year}`;
  };

  const formatearHora = (hora) => {
    if (!hora) return "";
    return hora.substring(0, 5);
  };

  const getInitials = (titulo) => {
    return titulo?.charAt(0).toUpperCase() || 'N';
  };

  // Ordenar las noticias de más reciente a más antigua
  const noticiasOrdenadas = ordenarNoticias(noticias);

  if (loading && noticias.length === 0) {
    return (
      <div className="avisos-loading">
        <div className="loading-spinner"></div>
        <p>Cargando avisos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="avisos-error">
        <div className="error-icon">
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <h3>Error</h3>
        <p>{error.message || "Ocurrió un error al cargar los avisos"}</p>
        <button onClick={obtenerNoticias} className="btn-retry">
          <i className="fas fa-sync-alt"></i> Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="avisos-usuarios-page">
      <div className="avisos-container">
        <div className="avisos-header">
          <div className="header-content">
            <div className="header-icon">
              <i className="fas fa-bullhorn"></i>
            </div>
            <div className="header-text">
              <h1>Avisos y Noticias</h1>
              <p>Mantente informado sobre las últimas novedades</p>
            </div>
          </div>
          
          {!isMobile && (
            <div className="view-toggle">
              <button 
                className={`view-btn ${modoVista === 'grid' ? 'active' : ''}`}
                onClick={() => setModoVista('grid')}
                title="Vista en cuadrícula"
              >
                <i className="fas fa-th-large"></i>
              </button>
              <button 
                className={`view-btn ${modoVista === 'list' ? 'active' : ''}`}
                onClick={() => setModoVista('list')}
                title="Vista en lista"
              >
                <i className="fas fa-list"></i>
              </button>
            </div>
          )}
        </div>

        <div className="avisos-counter">
          <i className="fas fa-newspaper"></i>
          <span>{noticiasOrdenadas.length} avisos disponibles</span>
        </div>

        {noticiasOrdenadas.length === 0 ? (
          <div className="avisos-empty">
            <div className="empty-icon">
              <i className="fas fa-inbox"></i>
            </div>
            <h3>No hay avisos disponibles</h3>
            <p>En este momento no hay noticias para mostrar</p>
          </div>
        ) : (
          <div className={`avisos-${modoVista}`}>
            {noticiasOrdenadas.map((noticia, index) => (
              <div 
                key={noticia.idNoticia} 
                className={`aviso-card ${modoVista === 'list' ? 'aviso-list' : ''}`}
                onClick={() => handleVerDetalle(noticia)}
              >
                {/* Indicador de noticia nueva (opcional) */}
                {index === 0 && (
                  <div className="novedad-indicador">
                    <span>¡Nuevo!</span>
                  </div>
                )}
                <div className="aviso-avatar">
                  <div className="avatar-initials">
                    {getInitials(noticia.titulo)}
                  </div>
                </div>
                <div className="aviso-content">
                  <div className="aviso-header">
                    <h3 className="aviso-titulo">{noticia.titulo}</h3>
                    <div className="aviso-fecha">
                      <i className="fas fa-calendar-alt"></i>
                      <span>{formatearFecha(noticia.fechaPublicacion)}</span>
                      {noticia.horaPublicacion && (
                        <>
                          <i className="fas fa-clock"></i>
                          <span>{formatearHora(noticia.horaPublicacion)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="aviso-descripcion">
                    {noticia.descripcion?.length > (isMobile ? 80 : 120)
                      ? `${noticia.descripcion.substring(0, isMobile ? 80 : 120)}...`
                      : noticia.descripcion}
                  </p>
                  <div className="aviso-footer">
                    <span className="leer-mas">
                      Leer más <i className="fas fa-arrow-right"></i>
                    </span>
                    
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && detalle && (
          <div className="modal-overlay">
            <div className="modal-container" ref={modalRef}>
              <div className="modal-header">
                <div className="modal-header-content">
                  <div className="modal-avatar">
                    <div className="avatar-initials large">
                      {getInitials(detalle.titulo)}
                    </div>
                  </div>
                  <div className="modal-title">
                    <h2>{detalle.titulo}</h2>
                    <div className="modal-fecha">
                      <i className="fas fa-calendar-alt"></i>
                      <span>{formatearFecha(detalle.fechaPublicacion)}</span>
                      {detalle.horaPublicacion && (
                        <>
                          <i className="fas fa-clock"></i>
                          <span>{formatearHora(detalle.horaPublicacion)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button className="modal-close" onClick={cerrarModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <div className="modal-content">
                  <p className="modal-descripcion">{detalle.descripcion}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cerrar" onClick={cerrarModal}>
                  <i className="fas fa-check"></i> Entendido
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListadoAvisosUsuarios;