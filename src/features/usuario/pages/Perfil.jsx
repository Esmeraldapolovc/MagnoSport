import { useEffect, useState } from "react";
import apiClient from "../../../service/apiClient";
import "../../../assets/styles/Perfil.css";
import { useUser } from "../../../hooks/useUser";
import { useUsuarios } from "../../../hooks/useUsuarios.js";
import { useCatalogos } from "../../../hooks/useCatalogo";
import { useUsuarioPerfil } from "../../../hooks/useUsuarioPerfil";
import Alert from "../../../components/Alert.jsx"

export default function Perfil() {
  const [userData, setUserData] = useState(null);
  const [userRol, setUserRol] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoVersion, setFotoVersion] = useState(0);
  const [niveles, setNiveles] = useState([]);
  const [licenciaturas, setLicenciaturas] = useState([]);
  const [imageError, setImageError] = useState(false);
  
  // Estado para la alerta
  const [alert, setAlert] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    rolId: 0,
    nivelId: null,
    licenciaturaId: null,
    fechaInicio: null,
    fechaFin: null,
    foto: null
  });
  
  const [passwordData, setPasswordData] = useState({
    contraseniaActual: "",
    contraseniaNueva: "",
    confirmarContrasenia: ""
  });

  const { user } = useUser();
  const { actualizar, actualizarAlumnoHook, loading } = useUsuarios();
  const { obtenerNiveles, obtenerLicenciaturas } = useCatalogos();
  const { obtenerUsuarioPerfil } = useUsuarioPerfil();

  const BASE_URL = apiClient.defaults.baseURL;

  // Resetear imageError cuando cambia la foto
  useEffect(() => {
    setImageError(false);
  }, [fotoVersion, fotoPreview, userData?.foto]);

  // Función para mostrar alerta
  const showAlert = (message, type = 'success') => {
    setAlert({
      show: true,
      message,
      type
    });
  };

  const hideAlert = () => {
    setAlert({
      show: false,
      message: '',
      type: 'success'
    });
  };

  useEffect(() => {
    const obtenerDatos = async () => {
      if (!user) return;

      try {
        
        // Obtener datos del usuario
        const data = await obtenerUsuarioPerfil(user.idUsuario, user.rol);
        setUserData(data);

        // Obtener catálogos
        const nivelesData = await obtenerNiveles();
        const licenciaturasData = await obtenerLicenciaturas();
        
        setNiveles(nivelesData);
        setLicenciaturas(licenciaturasData);
      } catch (error) {
        console.error("Error obteniendo datos", error);
        showAlert(
          "Error al cargar los datos del perfil: " + (error.response?.data?.detail || error.message),
          'error'
        );
      }
    };

    const obtenerRol = () => {
      if (!user) return;

      if (user.rol == 1) setUserRol("Administrador");
      else if (user.rol == 2) setUserRol("Alumno");
      else if (user.rol == 3) setUserRol("Profesor");
      else if (user.rol == 4) setUserRol("Personal");
    };

    obtenerDatos();
    obtenerRol();
  }, [user, obtenerUsuarioPerfil, obtenerNiveles, obtenerLicenciaturas]);

  const activarEdicion = () => {
    setFormData({
      nombre: userData.nombre,
      correo: userData.correo,
      rolId: userData.rolId,
      nivelId: null,
      licenciaturaId: null,
      fechaInicio: userData.fechaInicio || null,
      fechaFin: userData.fechaFin || null,
      foto: null
    });
    setEditMode(true);
    setPasswordMode(false);
  };

  const cancelarEdicion = () => {
    setEditMode(false);
    setPasswordMode(false);
    setFotoPreview(null);
  };

  const activarCambioPassword = () => {
    setPasswordMode(true);
    setEditMode(false);
    setPasswordData({
      contraseniaActual: "",
      contraseniaNueva: "",
      confirmarContrasenia: ""
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Si es el campo nombre, convertir a mayúsculas
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

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    const numValue = value ? parseInt(value) : null;
    setFormData(prev => ({
      ...prev,
      [name]: numValue
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("Archivo seleccionado:", file.name, "Tamaño:", file.size, "Tipo:", file.type);
      
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        showAlert('Por favor selecciona una imagen válida', 'error');
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showAlert('La imagen no debe superar los 5MB', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setFotoPreview(event.target.result);
        console.log("Preview creado");
      };
      reader.readAsDataURL(file);
      
      setFormData(prev => ({
        ...prev,
        foto: file
      }));
    }
  };

  const getNivelNombre = (id) => {
    if (!id) return 'No especificado';
    const nivel = niveles.find(n => n.id === id);
    return nivel ? nivel.nombre : 'No especificado';
  };

  const getLicenciaturaNombre = (id) => {
    if (!id) return 'No especificada';
    const lic = licenciaturas.find(l => l.id === id);
    return lic ? lic.nombre : 'No especificada';
  };

  const guardarCambios = async () => {
    try {
      let response;
      
      if (user.rol == 2) {
        const nivelAGuardar = formData.nivelId !== null ? formData.nivelId : userData.nivel;
        const licenciaturaAGuardar = formData.licenciaturaId !== null ? formData.licenciaturaId : userData.licenciatura;
        
        if (!nivelAGuardar) {
          showAlert("Debes seleccionar un nivel", 'error');
          return;
        }
        if (!formData.fechaInicio && !userData.fechaInicio) {
          showAlert("La fecha de inicio es obligatoria", 'error');
          return;
        }

        response = await actualizarAlumnoHook({
          nombre: formData.nombre,
          correo: formData.correo,
          rolId: user.rol,
          nivelId: nivelAGuardar,
          licId: licenciaturaAGuardar,
          fechaInicio: formData.fechaInicio || userData.fechaInicio,
          fechaFin: formData.fechaFin || userData.fechaFin || undefined,
          foto: formData.foto || undefined,
          contrasenia: undefined,
          contraseniaActual: undefined
        });
      } else {
        response = await actualizar({
          nombre: formData.nombre,
          correo: formData.correo,
          rolId: user.rol,
          foto: formData.foto || undefined,
          contrasenia: undefined,
          contraseniaActual: undefined
        });
      }

      if (response) {
        console.log("Respuesta de actualización:", response);
        
        // Actualizar userData con la respuesta
        setUserData(prev => ({
          ...prev,
          nombre: formData.nombre,
          correo: formData.correo,
          foto: response.foto || prev.foto,
          ...(user.rol == 2 && {
            nivel: formData.nivelId !== null ? formData.nivelId : prev.nivel,
            licenciatura: formData.licenciaturaId !== null ? formData.licenciaturaId : prev.licenciatura,
            fechaInicio: formData.fechaInicio || prev.fechaInicio,
            fechaFin: formData.fechaFin || prev.fechaFin
          })
        }));
        
        // Incrementar versión para forzar recarga de la imagen
        setFotoVersion(prev => prev + 1);
        
        setEditMode(false);
        setFotoPreview(null);
        showAlert(response.mensaje || "¡Datos actualizados correctamente!", 'success');
      }
    } catch (error) {
      console.error("Error actualizando usuario:", error);
      
      let mensajeError = "Error al actualizar los datos";
      if (error.response?.data?.detail) {
        mensajeError = error.response.data.detail;
      } else if (error.message) {
        mensajeError = error.message;
      }
      
      showAlert(mensajeError, 'error');
    }
  };

  const guardarPassword = async () => {
    if (passwordData.contraseniaNueva !== passwordData.confirmarContrasenia) {
      showAlert("Las contraseñas nuevas no coinciden", 'error');
      return;
    }

    if (!passwordData.contraseniaActual) {
      showAlert("Debes ingresar tu contraseña actual", 'error');
      return;
    }

    if (!passwordData.contraseniaNueva) {
      showAlert("Debes ingresar una nueva contraseña", 'error');
      return;
    }

    if (passwordData.contraseniaNueva.length < 8) {
      showAlert("La contraseña debe tener al menos 8 caracteres", 'error');
      return;
    }

    try {
      let response;
      
      if (user.rol == 2) {
        response = await actualizarAlumnoHook({
          nombre: userData.nombre,
          correo: userData.correo,
          rolId: user.rol,
          nivelId: userData.nivel,
          licId: userData.licenciatura,
          fechaInicio: userData.fechaInicio,
          fechaFin: userData.fechaFin || undefined,
          contrasenia: passwordData.contraseniaNueva,
          contraseniaActual: passwordData.contraseniaActual,
          foto: undefined
        });
      } else {
        response = await actualizar({
          nombre: userData.nombre,
          correo: userData.correo,
          rolId: user.rol,
          contrasenia: passwordData.contraseniaNueva,
          contraseniaActual: passwordData.contraseniaActual,
          foto: undefined
        });
      }

      if (response) {
        setPasswordMode(false);
        showAlert(response.mensaje || "¡Contraseña cambiada correctamente!", 'success');
        setPasswordData({
          contraseniaActual: "",
          contraseniaNueva: "",
          confirmarContrasenia: ""
        });
      }
    } catch (error) {
      console.error("Error cambiando contraseña:", error);
      
      let mensajeError = "Error al cambiar la contraseña";
      if (error.response?.data?.detail) {
        mensajeError = error.response.data.detail;
      } else if (error.message) {
        mensajeError = error.message;
      }
      
      showAlert(mensajeError, 'error');
    }
  };

  if (!userData) {
    return (
      <div className="perfil-loading">
        <div className="loading-spinner"></div>
        <p>Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="perfil-page">
      {/* Alerta personalizada */}
      {alert.show && (
        <Alert 
          message={alert.message} 
          type={alert.type} 
          onClose={hideAlert}
        />
      )}

      <div className="perfil-container">
        <div className="perfil-header">
          <h1>Mi Perfil</h1>
          <p>Gestiona tu información personal</p>
        </div>

        <div className="perfil-grid">
          {/* Tarjeta de perfil - Versión corregida */}
          <div className="perfil-card">
            <div className="perfil-avatar">
              <div className="avatar-wrapper">
                {/* Lógica mejorada para mostrar imagen o placeholder */}
                {fotoPreview ? (
                  // Si hay preview (imagen recién seleccionada), mostrar preview
                  <img 
                    src={fotoPreview}
                    alt={`Preview de ${userData.nombre}`}
                    className="avatar-image"
                  />
                ) : userData.foto && !imageError ? (
                  // Si hay foto en userData y no hubo error, intentar cargar la imagen
                  <img 
                    key={`foto-${fotoVersion}`}
                    src={`${BASE_URL}/static/fotos/${userData.foto}?v=${fotoVersion}`}
                    alt={`Foto de ${userData.nombre}`}
                    className="avatar-image"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  // En cualquier otro caso, mostrar placeholder
                  <div className="avatar-placeholder">
                    {userData.nombre?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                
                {editMode && (
                  <div className="avatar-edit" onClick={() => document.getElementById('fotoInput').click()}>
                    <i className="fas fa-camera"></i>
                  </div>
                )}
                <input
                  type="file"
                  id="fotoInput"
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
              <h2>{userData.nombre}</h2>
              <span className="rol-badge">{userRol}</span>
            </div>

            <div className="info-section">
              <h3>Contacto</h3>
              <div className="info-item">
                <i className="fas fa-envelope"></i>
                <div>
                  <label>Correo electrónico</label>
                  <p>{userData.correo}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="perfil-main">
            <div className="perfil-tabs">
              <button 
                className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
                onClick={() => setActiveTab('general')}
              >
                Información General
              </button>
              {userRol === "Alumno" && (
                <button 
                  className={`tab-btn ${activeTab === 'academico' ? 'active' : ''}`}
                  onClick={() => setActiveTab('academico')}
                >
                  Datos Académicos
                </button>
              )}
            </div>

            {activeTab === 'general' && !passwordMode && (
              <div className="info-grid">
                <div className="info-block">
                  <h4>Datos Personales</h4>
                  
                  {editMode ? (
                    <>
                      <div className="form-group">
                        <label>Nombre completo</label>
                        <input
                          type="text"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleInputChange}
                          className="form-input"
                          style={{ textTransform: 'uppercase' }}
                          disabled={loading}
                        />
                      </div>
                      <div className="form-group">
                        <label>Correo electrónico</label>
                        <input
                          type="email"
                          name="correo"
                          value={formData.correo}
                          onChange={handleInputChange}
                          className="form-input"
                          disabled={loading}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="info-row">
                        <span className="label">Nombre completo</span>
                        <span className="value">{userData.nombre}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Correo</span>
                        <span className="value">{userData.correo}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="info-block">
                  <h4>Información de Cuenta</h4>
                  <div className="info-row">
                    <span className="label">Rol</span>
                    <span className="value">
                      <span className="role-tag">{userRol}</span>
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Estado</span>
                    <span className="value">
                      <span className="status-tag">Activo</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {passwordMode && (
              <div className="password-change-container">
                <h4>Cambiar Contraseña</h4>
                <div className="form-group">
                  <label>Contraseña Actual</label>
                  <input
                    type="password"
                    name="contraseniaActual"
                    value={passwordData.contraseniaActual}
                    onChange={handlePasswordChange}
                    className="form-input"
                    placeholder="Ingresa tu contraseña actual"
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label>Nueva Contraseña</label>
                  <input
                    type="password"
                    name="contraseniaNueva"
                    value={passwordData.contraseniaNueva}
                    onChange={handlePasswordChange}
                    className="form-input"
                    placeholder="Ingresa tu nueva contraseña (mínimo 8 caracteres)"
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label>Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    name="confirmarContrasenia"
                    value={passwordData.confirmarContrasenia}
                    onChange={handlePasswordChange}
                    className="form-input"
                    placeholder="Confirma tu nueva contraseña"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {activeTab === 'academico' && userRol === "Alumno" && (
              <div className="info-grid">
                <div className="info-block">
                  <h4>Información Académica</h4>
                  {editMode ? (
                    <>
                      <div className="form-group">
                        <label>Fecha inicio</label>
                        <input
                          type="date"
                          name="fechaInicio"
                          value={formData.fechaInicio || userData.fechaInicio?.split('T')[0] || ''}
                          onChange={handleInputChange}
                          className="form-input"
                          disabled={loading}
                        />
                      </div>
                      <div className="form-group">
                        <label>Fecha fin</label>
                        <input
                          type="date"
                          name="fechaFin"
                          value={formData.fechaFin || userData.fechaFin?.split('T')[0] || ''}
                          onChange={handleInputChange}
                          className="form-input"
                          min={formData.fechaInicio || userData.fechaInicio?.split('T')[0]}
                          disabled={loading}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="info-row">
                        <span className="label">Fecha inicio</span>
                        <span className="value">
                          {userData.fechaInicio ? new Date(userData.fechaInicio).toLocaleDateString('es-MX') : 'No especificada'}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="label">Fecha fin</span>
                        <span className="value">
                          {userData.fechaFin ? new Date(userData.fechaFin).toLocaleDateString('es-MX') : 'No especificada'}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="info-block">
                  <h4>Detalles de Estudio</h4>
                  {editMode ? (
                    <>
                      <div className="form-group">
                        <label>Nivel</label>
                        <select
                          name="nivelId"
                          value={formData.nivelId !== null ? formData.nivelId : userData.nivel || ''}
                          onChange={handleSelectChange}
                          className="form-input"
                          disabled={loading}
                        >
                          <option value="">Selecciona un nivel</option>
                          {niveles.map(nivel => (
                            <option key={nivel.id} value={nivel.id}>
                              {nivel.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Licenciatura</label>
                        <select
                          name="licenciaturaId"
                          value={formData.licenciaturaId !== null ? formData.licenciaturaId : userData.licenciatura || ''}
                          onChange={handleSelectChange}
                          className="form-input"
                          disabled={loading}
                        >
                          <option value="">Selecciona una licenciatura</option>
                          {licenciaturas.map(lic => (
                            <option key={lic.id} value={lic.id}>
                              {lic.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="info-row">
                        <span className="label">Nivel</span>
                        <span className="value">{getNivelNombre(userData.nivel)}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Licenciatura</span>
                        <span className="value">{getLicenciaturaNombre(userData.licenciatura)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="perfil-actions">
              {!editMode && !passwordMode ? (
                <>
                  <button 
                    className="btn btn-primary"
                    onClick={activarEdicion}
                    disabled={loading}
                  >
                    <i className="fas fa-edit"></i>
                    Editar Perfil
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={activarCambioPassword}
                    disabled={loading}
                  >
                    <i className="fas fa-lock"></i>
                    Cambiar Contraseña
                  </button>
                </>
              ) : editMode ? (
                <>
                  <button 
                    className="btn btn-primary"
                    onClick={guardarCambios}
                    disabled={loading}
                  >
                    <i className="fas fa-save"></i>
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={cancelarEdicion}
                    disabled={loading}
                  >
                    <i className="fas fa-times"></i>
                    Cancelar
                  </button>
                </>
              ) : passwordMode ? (
                <>
                  <button 
                    className="btn btn-primary"
                    onClick={guardarPassword}
                    disabled={loading}
                  >
                    <i className="fas fa-check"></i>
                    {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={cancelarEdicion}
                    disabled={loading}
                  >
                    <i className="fas fa-times"></i>
                    Cancelar
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}