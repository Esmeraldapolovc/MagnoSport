import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCatalogos } from '../../../hooks/useCatalogo';
import { useActualizar } from '../../../hooks/useActualizar';
import apiClient from '../../../service/apiClient';
import Alert from '../../../components/Alert';
import '../../../assets/styles/EditarAlumno.css';

export default function Actualizacion() {
  const location = useLocation();
  const navigate = useNavigate();
  const { obtenerNiveles, obtenerLicenciaturas } = useCatalogos();
  const { actualizarAlumno, eliminar, activar, loading } = useActualizar();
  
  const [niveles, setNiveles] = useState([]);
  const [licenciaturas, setLicenciaturas] = useState([]);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoVersion, setFotoVersion] = useState(0);
  
  const roles = [
    { id: 1, nombre: 'Administrador' },
    { id: 2, nombre: 'Alumno' },
    { id: 3, nombre: 'Profesor' },
    { id: 4, nombre: 'Personal' }
  ];
  
  const [formData, setFormData] = useState({
    idUsuario: '',
    nombre: '',
    correo: '',
    contrasenia: '',
    nivelId: '',
    licenciaturaId: '',
    rolId: '',
    fechaInicio: '',
    fechaFin: '',
    estado: 1,
    foto: null
  });
  
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [activando, setActivando] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showActivarDialog, setShowActivarDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState({ show: false, tipo: '', texto: '' });

  // Función para mapear nombre de nivel a ID
  const mapearNivelAId = (nombreNivel) => {
    if (!nombreNivel || !niveles.length) return '';
    const nivel = niveles.find(n => n.nombre.toLowerCase() === nombreNivel.toLowerCase());
    return nivel ? nivel.id.toString() : '';
  };

  const mapearLicenciaturaAId = (nombreLicenciatura) => {
    if (!nombreLicenciatura || !licenciaturas.length) return '';
    const lic = licenciaturas.find(l => l.nombre.toLowerCase() === nombreLicenciatura.toLowerCase());
    return lic ? lic.id.toString() : '';
  };

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [nivelesData, licenciaturasData] = await Promise.all([
          obtenerNiveles(),
          obtenerLicenciaturas()
        ]);
        setNiveles(nivelesData);
        setLicenciaturas(licenciaturasData);
      } catch (error) {
        console.error("Error cargando catálogos:", error);
      }
    };
    cargarCatalogos();
  }, [obtenerNiveles, obtenerLicenciaturas]);

  useEffect(() => {
    if (location.state?.alumno && niveles.length > 0 && licenciaturas.length > 0) {
      const alumno = location.state.alumno;
      console.log('Datos del alumno recibidos:', alumno);
      
      setFormData({
        idUsuario: alumno.idUsuario || '',
        nombre: alumno.nombre || '',
        correo: alumno.correo || '',
        contrasenia: '',
        nivelId: mapearNivelAId(alumno.nivel),
        licenciaturaId: mapearLicenciaturaAId(alumno.licenciatura),
        rolId: alumno.rolId?.toString() || (alumno.rol === 'ALUMNO' ? '2' : ''),
        fechaInicio: alumno.fechaInicio ? alumno.fechaInicio.split('T')[0] : '',
        fechaFin: alumno.fechaFin ? alumno.fechaFin.split('T')[0] : '',
        estado: alumno.estatus !== undefined ? alumno.estatus : 1,
        foto: null
      });
    } else if (!location.state?.alumno) {
      navigate('/usuarios');
    }
  }, [location.state, navigate, niveles, licenciaturas]);

  const showAlert = (texto, tipo = 'success') => {
    setAlert({ show: true, tipo, texto });
    setTimeout(() => {
      setAlert({ show: false, tipo: '', texto: '' });
    }, 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'nombre') {
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showAlert('Por favor selecciona una imagen válida', 'error');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        showAlert('La imagen no debe superar los 5MB', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setFotoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
      
      setFormData(prev => ({ ...prev, foto: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      if (!formData.nombre.trim()) {
        showAlert('El nombre es obligatorio', 'error');
        setGuardando(false);
        return;
      }

      if (!formData.correo.trim()) {
        showAlert('El correo es obligatorio', 'error');
        setGuardando(false);
        return;
      }

      if (!formData.rolId) {
        showAlert('Debes seleccionar un rol', 'error');
        setGuardando(false);
        return;
      }


      if (!formData.fechaInicio) {
        showAlert('La fecha de inicio es obligatoria para alumnos', 'error');
        setGuardando(false);
        return;
      }

      if (!formData.nivelId) {
        showAlert('El nivel es obligatorio para alumnos', 'error');
        setGuardando(false);
        return;
      }

      const datosEnviar = {
        idUsuario: parseInt(formData.idUsuario),
        nombre: formData.nombre.trim(),
        correo: formData.correo.trim(),
        rolId: parseInt(formData.rolId),
        nivelId: parseInt(formData.nivelId),
        fechaInicio: formData.fechaInicio,
        licId: formData.licenciaturaId ? parseInt(formData.licenciaturaId) : null,
        fechaFin: formData.fechaFin || null,
        foto: formData.foto || undefined
      };
      
      if (formData.contrasenia && formData.contrasenia.trim() !== '') {
        datosEnviar.contrasenia = formData.contrasenia;
      }
      
      console.log('Datos a enviar:', datosEnviar);
      
      const response = await actualizarAlumno(datosEnviar);
      
      if (response) {
        console.log('Respuesta de actualización:', response);
        
        setFotoVersion(prev => prev + 1);
        
        showAlert(response.mensaje || 'Alumno actualizado correctamente', 'success');
        
        setTimeout(() => {
          navigate('/usuarios');
        }, 2000);
      }
    } catch (error) {
      console.error('Error actualizando alumno:', error);
      
      let mensajeError = 'Error al actualizar el alumno';
      if (error.response?.data?.detail) {
        mensajeError = error.response.data.detail;
      } else if (error.message) {
        mensajeError = error.message;
      }
      
      showAlert(mensajeError, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    setEliminando(true);
    setShowConfirmDialog(false);

    try {
      const response = await eliminar(formData.idUsuario);
      
      if (response) {
        console.log('Respuesta de eliminación:', response);
        
        showAlert(response.mensaje || 'Alumno eliminado correctamente', 'success');
        
        setTimeout(() => {
          navigate('/usuarios');
        }, 2000);
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
      setEliminando(false);
    }
  };

  const handleActivar = async () => {
    setActivando(true);
    setShowActivarDialog(false);

    try {
      const response = await activar(formData.idUsuario);
      
      if (response) {
        console.log('Respuesta de activación:', response);
        
        setFormData(prev => ({
          ...prev,
          estado: 1
        }));
        
        showAlert(response.mensaje || 'Alumno activado correctamente', 'success');
      }
    } catch (error) {
      console.error('Error activando alumno:', error);
      
      let mensajeError = 'Error al activar el alumno';
      if (error.response?.data?.detail) {
        mensajeError = error.response.data.detail;
      } else if (error.message) {
        mensajeError = error.message;
      }
      
      showAlert(mensajeError, 'error');
    } finally {
      setActivando(false);
    }
  };

  if (!location.state?.alumno) {
    return null;
  }

  const alumno = location.state.alumno;
  const fotoUrl = fotoPreview || (alumno.foto ? `${apiClient.defaults.baseURL}/static/fotos/${alumno.foto}?v=${fotoVersion}` : null);
  const estaInactivo = formData.estado === 0 || formData.estado === '0';

  return (
    <div className="editar-alumno-page">
      {alert.show && (
        <Alert 
          message={alert.texto} 
          type={alert.tipo} 
          onClose={() => setAlert({ show: false, tipo: '', texto: '' })}
        />
      )}

      {showConfirmDialog && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <div className="confirm-dialog-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3>¿Eliminar alumno?</h3>
            <p>¿Estás seguro de que deseas eliminar a <strong>{formData.nombre}</strong>?</p>
            <p className="confirm-dialog-warning">Esta acción no se puede deshacer.</p>
            <div className="confirm-dialog-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowConfirmDialog(false)}
                disabled={eliminando}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleEliminar}
                disabled={eliminando}
              >
                {eliminando ? (
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

      {showActivarDialog && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <div className="confirm-dialog-icon success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h3>¿Activar alumno?</h3>
            <p>¿Estás seguro de que deseas activar a <strong>{formData.nombre}</strong>?</p>
            <p>El usuario podrá acceder al sistema nuevamente.</p>
            <div className="confirm-dialog-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowActivarDialog(false)}
                disabled={activando}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-success"
                onClick={handleActivar}
                disabled={activando}
              >
                {activando ? (
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

      <div className="editar-alumno-container">
        <div className="editar-header">
          <button className="btn-volver" onClick={() => navigate('/usuarios')}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <div className="header-text">
            <h1>Editar Alumno</h1>
            <p>Modifica la información del alumno</p>
          </div>
        </div>

        <div className="editar-grid">
          {/* Sidebar con foto - Versión mejorada */}
          <div className="editar-sidebar">
            <div className="profile-card">
              <div className="profile-avatar">
                <div className="avatar-wrapper">
                  {fotoUrl ? (
                    <img 
                      src={fotoUrl} 
                      alt={`Foto de ${formData.nombre}`}
                      className="avatar-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.innerHTML += '<div class="avatar-placeholder">' + formData.nombre.charAt(0).toUpperCase() + '</div>';
                      }}
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {formData.nombre?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  
                  <div className="avatar-edit-overlay" onClick={() => document.getElementById('fotoInput').click()}>
                    <i className="fas fa-camera"></i>
                    <span>Cambiar foto</span>
                  </div>
                  <input
                    type="file"
                    id="fotoInput"
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
                <h3 className="profile-name">{formData.nombre}</h3>
                <span className="profile-role">{alumno.rol}</span>
              </div>

              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-label">ID Usuario</span>
                  <span className="stat-value">#{formData.idUsuario}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Estado</span>
                  <span className={`stat-badge ${estaInactivo ? 'inactive' : 'active'}`}>
                    {estaInactivo ? 'Inactivo' : 'Activo'}
                  </span>
                </div>
              </div>

              <div className="profile-info">
                {alumno.nivel && (
                  <div className="info-item">
                    <i className="fas fa-layer-group"></i>
                    <div className="info-content">
                      <span className="info-label">Nivel actual</span>
                      <span className="info-value">{alumno.nivel}</span>
                    </div>
                  </div>
                )}
                
                {alumno.licenciatura && (
                  <div className="info-item">
                    <i className="fas fa-graduation-cap"></i>
                    <div className="info-content">
                      <span className="info-label">Licenciatura actual</span>
                      <span className="info-value">{alumno.licenciatura}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="profile-actions">
                {estaInactivo && (
                  <button 
                    className="action-btn activate-btn"
                    onClick={() => setShowActivarDialog(true)}
                    disabled={guardando || eliminando || activando}
                  >
                    <i className="fas fa-check-circle"></i>
                    Activar Alumno
                  </button>
                )}
                
                <button 
                  className="action-btn delete-btn"
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={guardando || eliminando || activando}
                >
                  <i className="fas fa-trash-alt"></i>
                  Eliminar Alumno
                </button>
              </div>
            </div>
          </div>

          {/* Formulario principal - Versión mejorada */}
          <div className="editar-main">
            <div className="form-header">
              <h2>Información del Alumno</h2>
            </div>

            <form onSubmit={handleSubmit} className="modern-form">
              {/* Datos Personales */}
              <div className="form-card">
                <div className="form-card-header">
                  <i className="fas fa-user-circle"></i>
                  <h3>Datos Personales</h3>
                </div>
                
                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor="nombre">
                      <i className="fas fa-user"></i>
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      required
                      placeholder="Ingresa el nombre completo"
                      disabled={guardando}
                      className="uppercase-input"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="correo">
                      <i className="fas fa-envelope"></i>
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      id="correo"
                      name="correo"
                      value={formData.correo}
                      onChange={handleChange}
                      required
                      placeholder="correo@ejemplo.com"
                      disabled={guardando}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="rolId">
                      <i className="fas fa-user-tag"></i>
                      Rol
                    </label>
                    <select
                      id="rolId"
                      name="rolId"
                      value={formData.rolId}
                      onChange={handleChange}
                      required
                      disabled={guardando}
                    >
                      <option value="">Seleccionar rol</option>
                      {roles.map(rol => (
                        <option key={rol.id} value={rol.id}>
                          {rol.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Contraseña */}
              <div className="form-card">
                <div className="form-card-header">
                  <i className="fas fa-lock"></i>
                  <h3>Cambiar Contraseña</h3>
                  <span className="badge optional">Opcional</span>
                </div>
                
                <div className="form-field full-width">
                  <label htmlFor="contrasenia">
                    <i className="fas fa-key"></i>
                    Nueva contraseña
                  </label>
                  <div className="password-field">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="contrasenia"
                      name="contrasenia"
                      value={formData.contrasenia}
                      onChange={handleChange}
                      placeholder="Ingresa nueva contraseña"
                      disabled={guardando}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={guardando}
                    >
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  <div className="field-hint">
                    <i className="fas fa-info-circle"></i>
                    Mínimo 8 caracteres, incluye mayúsculas, minúsculas y números
                  </div>
                </div>
              </div>

              {/* Datos Académicos */}
              <div className="form-card">
                <div className="form-card-header">
                  <i className="fas fa-graduation-cap"></i>
                  <h3>Datos Académicos</h3>
                </div>
                
                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor="nivelId">
                      <i className="fas fa-layer-group"></i>
                      Nivel <span className="required">*</span>
                    </label>
                    <select
                      id="nivelId"
                      name="nivelId"
                      value={formData.nivelId}
                      onChange={handleChange}
                      required
                      disabled={guardando}
                    >
                      <option value="">Seleccionar nivel</option>
                      {niveles.map(nivel => (
                        <option key={nivel.id} value={nivel.id}>
                          {nivel.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label htmlFor="licenciaturaId">
                      <i className="fas fa-graduation-cap"></i>
                      Licenciatura
                    </label>
                    <select
                      id="licenciaturaId"
                      name="licenciaturaId"
                      value={formData.licenciaturaId}
                      onChange={handleChange}
                      disabled={guardando}
                    >
                      <option value="">Seleccionar licenciatura</option>
                      {licenciaturas.map(lic => (
                        <option key={lic.id} value={lic.id}>
                          {lic.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label htmlFor="fechaInicio">
                      <i className="fas fa-calendar-alt"></i>
                      Fecha inicio <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      id="fechaInicio"
                      name="fechaInicio"
                      value={formData.fechaInicio}
                      onChange={handleChange}
                      required
                      disabled={guardando}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="fechaFin">
                      <i className="fas fa-calendar-times"></i>
                      Fecha fin
                    </label>
                    <input
                      type="date"
                      id="fechaFin"
                      name="fechaFin"
                      value={formData.fechaFin}
                      onChange={handleChange}
                      disabled={guardando}
                    />
                  </div>
                </div>
              </div>

              {/* Estado */}
              <div className="form-card">
                <div className="form-card-header">
                  <i className="fas fa-toggle-on"></i>
                  <h3>Estado del Alumno</h3>
                </div>
                
                <div className="status-options">
                  <label className={`status-option ${formData.estado == 1 ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="estado"
                      value="1"
                      checked={formData.estado == 1}
                      onChange={handleChange}
                      disabled={guardando}
                    />
                    <div className="status-content">
                      <i className="fas fa-check-circle"></i>
                      <div>
                        <strong>Activo</strong>
                        <span>El alumno puede acceder al sistema</span>
                      </div>
                    </div>
                  </label>
                  
                  <label className={`status-option ${formData.estado == 0 ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="estado"
                      value="0"
                      checked={formData.estado == 0}
                      onChange={handleChange}
                      disabled={guardando}
                    />
                    <div className="status-content">
                      <i className="fas fa-times-circle"></i>
                      <div>
                        <strong>Inactivo</strong>
                        <span>El alumno no puede acceder al sistema</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => navigate('/usuarios')}
                  disabled={guardando}
                >
                  <i className="fas fa-times"></i>
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-save"
                  disabled={guardando}
                >
                  {guardando ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Guardar cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}