// pages/Admin/EditarUsuario.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useActualizar } from '../../../hooks/useActualizar';
import apiClient from '../../../service/apiClient';
import Alert from '../../../components/Alert';
import '../../../assets/styles/EditarUsuario.css';

export default function ActualizacionUsuario() {
  const location = useLocation();
  const navigate = useNavigate();
  const { actualizarUsuario, eliminar, activar } = useActualizar();
  
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoVersion, setFotoVersion] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [activando, setActivando] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showActivarDialog, setShowActivarDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState({ show: false, tipo: '', texto: '' });

  // Mapeo de roles (texto a ID)
  const rolTextoToId = {
    'ADMINISTRADOR': 1,
    'administrador': 1,
    'ALUMNO': 2,
    'alumno': 2,
    'PROFESOR': 3,
    'profesor': 3,
    'PERSONAL': 4,
    'personal': 4
  };

  // Mapeo de roles (ID a texto)
  const rolIdToTexto = {
    1: 'ADMINISTRADOR',
    2: 'ALUMNO',
    3: 'PROFESOR',
    4: 'PERSONAL'
  };

  // Mapeo para mostrar en UI
  const rolesDisplay = {
    1: 'Administrador',
    2: 'Alumno',
    3: 'Profesor',
    4: 'Personal'
  };

  const [formData, setFormData] = useState({
    idUsuario: '',
    nombre: '',
    correo: '',
    contrasenia: '',
    rolId: '',
    rolTexto: '',
    foto: null
  });

  // Cargar datos del usuario desde el state de navegación
  useEffect(() => {
    if (location.state?.usuario) {
      const usuario = location.state.usuario;
      console.log('Datos del usuario recibidos:', usuario);
      
      // Convertir el rol texto a ID
      const rolId = rolTextoToId[usuario.rol?.toUpperCase()] || '';
      
      setFormData({
        idUsuario: usuario.idUsuario || '',
        nombre: usuario.nombre || '',
        correo: usuario.correo || '',
        contrasenia: '',
        rolId: rolId,
        rolTexto: usuario.rol || '',
        foto: null
      });
    } else {
      navigate('/personal');
    }
  }, [location.state, navigate]);

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

      const datosEnviar = {
        idUsuario: parseInt(formData.idUsuario),
        nombre: formData.nombre.trim(),
        correo: formData.correo.trim(),
        rolId: parseInt(formData.rolId),
        foto: formData.foto || undefined
      };
      
      if (formData.contrasenia && formData.contrasenia.trim() !== '') {
        datosEnviar.contrasenia = formData.contrasenia;
      }
      
      console.log('Datos a enviar:', datosEnviar);
      
      const response = await actualizarUsuario(datosEnviar);
      
      if (response) {
        console.log('Respuesta de actualización:', response);
        
        setFotoVersion(prev => prev + 1);
        
        showAlert(response.mensaje || 'Usuario actualizado correctamente', 'success');
        
        setTimeout(() => {
          navigate('/personal');
        }, 2000);
      }
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      
      let mensajeError = 'Error al actualizar el usuario';
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
        showAlert(response.mensaje || 'Usuario eliminado correctamente', 'success');
        
        setTimeout(() => {
          navigate('/personal');
        }, 2000);
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
      setEliminando(false);
    }
  };

  const handleActivar = async () => {
    setActivando(true);
    setShowActivarDialog(false);

    try {
      const response = await activar(formData.idUsuario);
      
      if (response) {
        showAlert(response.mensaje || 'Usuario activado correctamente', 'success');
        
        setTimeout(() => {
          navigate('/personal');
        }, 2000);
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
      setActivando(false);
    }
  };

  if (!location.state?.usuario) {
    return null;
  }

  const usuario = location.state.usuario;
  const fotoUrl = fotoPreview || (usuario.foto ? `${apiClient.defaults.baseURL}/static/fotos/${usuario.foto}?v=${fotoVersion}` : null);
  const estaInactivo = usuario.estatus === 0;

  return (
    <div className="editar-usuario-page">
      {alert.show && (
        <Alert 
          message={alert.texto} 
          type={alert.tipo} 
          onClose={() => setAlert({ show: false, tipo: '', texto: '' })}
        />
      )}

      {/* Diálogo de confirmación para eliminar */}
      {showConfirmDialog && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <div className="confirm-dialog-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3>¿Eliminar usuario?</h3>
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

      {/* Diálogo de confirmación para activar */}
      {showActivarDialog && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <div className="confirm-dialog-icon success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h3>¿Activar usuario?</h3>
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

      <div className="editar-usuario-container">
        <div className="editar-header">
          <button className="btn-volver" onClick={() => navigate('/personal')}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <div className="header-text">
            <h1>Editar Usuario</h1>
            <p>Modifica la información del usuario</p>
          </div>
        </div>

        <div className="editar-grid">
          {/* Sidebar con foto */}
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
                <span className="profile-role">{rolesDisplay[formData.rolId] || formData.rolTexto}</span>
              </div>

              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-label">ID Usuario</span>
                  <span className="stat-value">#{formData.idUsuario}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Estado</span>
                  <span className={`stat-badge ${usuario.estatus === 1 ? 'active' : 'inactive'}`}>
                    {usuario.estatus === 1 ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              <div className="profile-info">
                <div className="info-item">
                  <i className="fas fa-envelope"></i>
                  <div className="info-content">
                    <span className="info-label">Correo actual</span>
                    <span className="info-value">{usuario.correo}</span>
                  </div>
                </div>
              </div>

              <div className="profile-actions">
                {estaInactivo && (
                  <button 
                    className="action-btn activate-btn"
                    onClick={() => setShowActivarDialog(true)}
                    disabled={guardando || eliminando || activando}
                  >
                    <i className="fas fa-check-circle"></i>
                    Activar Usuario
                  </button>
                )}
                
                <button 
                  className="action-btn delete-btn"
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={guardando || eliminando || activando}
                >
                  <i className="fas fa-trash-alt"></i>
                  Eliminar Usuario
                </button>
              </div>
            </div>
          </div>

          {/* Formulario principal */}
          <div className="editar-main">
            <div className="form-header">
              <h2>Información del Usuario</h2>
            </div>

            <form onSubmit={handleSubmit} className="modern-form">
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
                      className="rol-select"
                    >
                      <option value="" disabled>Seleccionar rol</option>
                      <option value="1">Administrador</option>
                      <option value="2">Alumno</option>
                      <option value="3">Profesor</option>
                      <option value="4">Personal</option>
                    </select>
                    {formData.rolTexto && (
                      <div className="rol-actual-hint">
                        <i className="fas fa-info-circle"></i>
                        Rol actual: <strong>{formData.rolTexto}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>

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