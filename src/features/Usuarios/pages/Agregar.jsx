// pages/Admin/Agregar.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActualizar } from '../../../hooks/useActualizar';
import { useCatalogos } from '../../../hooks/useCatalogo';
import Alert from '../../../components/Alert';
import '../../../assets/styles/Agregar.css';

export default function Agregar() {
  const navigate = useNavigate();
  const { registrarUsuario, registrarAlumno, loading, error } = useActualizar();
  const { obtenerNiveles, obtenerLicenciaturas } = useCatalogos();
  
  // Estados para catálogos
  const [niveles, setNiveles] = useState([]);
  const [licenciaturas, setLicenciaturas] = useState([]);
  
  // Estado para la foto
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);
  
  // Estado para mostrar/ocultar contraseña
  const [showPassword, setShowPassword] = useState(false);
  
  // Estado para alertas
  const [alert, setAlert] = useState({ show: false, tipo: '', texto: '' });
  
  // Roles disponibles
  const roles = [
    { id: 2, nombre: 'Alumno' },
    { id: 3, nombre: 'Profesor' },
    { id: 4, nombre: 'Personal' }
  ];
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    contrasenia: '',
    rolId: '',
    nivelId: '',
    licId: '',
    fechaInicio: '',
    fechaFin: ''
  });

  // Función showAlert declarada ANTES de los useEffect que la usan
  const showAlert = (texto, tipo = 'success') => {
    setAlert({ show: true, tipo, texto });
    setTimeout(() => {
      setAlert({ show: false, tipo: '', texto: '' });
    }, 3000);
  };

  // useEffect para mostrar errores del hook
  useEffect(() => {
    if (error) {
      showAlert(error, 'error');
    }
  }, [error]);

  // Cargar catálogos al montar el componente
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
        showAlert('Error al cargar catálogos', 'error');
      }
    };
    cargarCatalogos();
  }, [obtenerNiveles, obtenerLicenciaturas]);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Convertir nombre a mayúsculas
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
    
    // Limpiar campos de alumno si se cambia a otro rol
    if (name === 'rolId' && value !== '2') {
      setFormData(prev => ({
        ...prev,
        nivelId: '',
        licId: '',
        fechaInicio: '',
        fechaFin: ''
      }));
    }
  };

  // Manejar cambio de foto
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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

      // Crear preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setFotoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
      
      setFotoFile(file);
    }
  };

  // Validar formulario
  const validarFormulario = () => {
    if (!formData.nombre.trim()) {
      showAlert('El nombre es obligatorio', 'error');
      return false;
    }

    if (!formData.correo.trim()) {
      showAlert('El correo es obligatorio', 'error');
      return false;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.correo)) {
      showAlert('Ingresa un correo electrónico válido', 'error');
      return false;
    }

    if (!formData.rolId) {
      showAlert('Debes seleccionar un rol', 'error');
      return false;
    }

    if (!formData.contrasenia) {
      showAlert('La contraseña es obligatoria', 'error');
      return false;
    }

    // Validar contraseña (mínimo 8 caracteres)
    if (formData.contrasenia.length < 8) {
      showAlert('La contraseña debe tener al menos 8 caracteres', 'error');
      return false;
    }

    // Validaciones específicas para alumnos
    if (parseInt(formData.rolId) === 2) {
      if (!formData.nivelId) {
        showAlert('El nivel es obligatorio para alumnos', 'error');
        return false;
      }

      if (!formData.fechaInicio) {
        showAlert('La fecha de inicio es obligatoria para alumnos', 'error');
        return false;
      }

      // Validar que fechaFin sea posterior a fechaInicio si existe
      if (formData.fechaFin && formData.fechaInicio) {
        if (new Date(formData.fechaFin) <= new Date(formData.fechaInicio)) {
          showAlert('La fecha de fin debe ser posterior a la fecha de inicio', 'error');
          return false;
        }
      }
    }

    return true;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    try {
      const datosEnviar = {
        nombre: formData.nombre.trim(),
        correo: formData.correo.trim(),
        contrasenia: formData.contrasenia,
        rolId: parseInt(formData.rolId)
      };

      // Agregar foto si existe
      if (fotoFile) {
        datosEnviar.foto = fotoFile;
      }

      let response;

      if (parseInt(formData.rolId) === 2) {
        // Es alumno - agregar campos específicos
        datosEnviar.nivelId = parseInt(formData.nivelId);
        datosEnviar.fechaInicio = formData.fechaInicio;
        
        if (formData.licId) {
          datosEnviar.licId = parseInt(formData.licId);
        }
        
        if (formData.fechaFin) {
          datosEnviar.fechaFin = formData.fechaFin;
        }

        response = await registrarAlumno(datosEnviar);
      } else {
        // Es profesor o personal
        response = await registrarUsuario(datosEnviar);
      }

      if (response) {
        console.log('Respuesta del registro:', response);
        showAlert(
          response.mensaje || 'Registro exitoso', 
          'success'
        );
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          navigate('/usuarios');
        }, 2000);
      }
    } catch (error) {
      console.error('Error en registro:', error);
      showAlert(
        error.message || 'Error al registrar usuario', 
        'error'
      );
    }
  };

  const esAlumno = parseInt(formData.rolId) === 2;

  return (
    <div className="agregar-page">
      {alert.show && (
        <Alert 
          message={alert.texto} 
          type={alert.tipo} 
          onClose={() => setAlert({ show: false, tipo: '', texto: '' })}
        />
      )}

      <div className="agregar-container">
        {/* Header */}
        <div className="agregar-header">
          <button className="btn-volver" onClick={() => navigate('/usuarios')}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <div className="header-text">
            <h1>Agregar Nuevo Usuario</h1>
            <p>Completa la información para registrar un nuevo usuario</p>
          </div>
        </div>

        <div className="agregar-grid">
          {/* Sidebar con foto */}
          <div className="agregar-sidebar">
            <div className="profile-card">
              <div className="profile-avatar">
                <div className="avatar-wrapper">
                  {fotoPreview ? (
                    <img 
                      src={fotoPreview} 
                      alt="Vista previa"
                      className="avatar-image"
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {formData.nombre?.charAt(0).toUpperCase() || '+'}
                    </div>
                  )}
                  
                  <div className="avatar-edit-overlay" onClick={() => document.getElementById('fotoInput').click()}>
                    <i className="fas fa-camera"></i>
                    <span>Subir foto</span>
                  </div>
                  <input
                    type="file"
                    id="fotoInput"
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
                <h3 className="profile-name">{formData.nombre || 'Nuevo Usuario'}</h3>
                <span className="profile-role">
                  {roles.find(r => r.id === parseInt(formData.rolId))?.nombre || 'Selecciona un rol'}
                </span>
              </div>

              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-label">Estado</span>
                  <span className="stat-badge active">Nuevo</span>
                </div>
              </div>

              <div className="profile-info">
                <div className="info-item">
                  <i className="fas fa-info-circle"></i>
                  <div className="info-content">
                    <span className="info-label">Información</span>
                    <span className="info-value">Completa todos los campos</span>
                  </div>
                </div>
                
                {esAlumno && (
                  <>
                    <div className="info-item">
                      <i className="fas fa-layer-group"></i>
                      <div className="info-content">
                        <span className="info-label">Nivel seleccionado</span>
                        <span className="info-value">
                          {niveles.find(n => n.id === parseInt(formData.nivelId))?.nombre || 'No seleccionado'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="info-item">
                      <i className="fas fa-graduation-cap"></i>
                      <div className="info-content">
                        <span className="info-label">Licenciatura</span>
                        <span className="info-value">
                          {licenciaturas.find(l => l.id === parseInt(formData.licId))?.nombre || 'No seleccionada'}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="profile-actions">
                <div className="info-ayuda">
                  <h4>Información importante</h4>
                  <ul>
                    <li>
                      <i className="fas fa-check-circle"></i>
                      Los campos marcados con * son obligatorios
                    </li>
                    <li>
                      <i className="fas fa-check-circle"></i>
                      La contraseña debe tener al menos 8 caracteres
                    </li>
                    {esAlumno && (
                      <>
                        <li>
                          <i className="fas fa-check-circle"></i>
                          Los alumnos requieren nivel y fecha de inicio
                        </li>
                        <li>
                          <i className="fas fa-check-circle"></i>
                          La licenciatura es opcional para alumnos
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario principal  */}
          <div className="agregar-main">
            <div className="form-header">
              <h2>Información del Usuario</h2>
            </div>

            <form onSubmit={handleSubmit} className="modern-form">
              {/* Datos Personales */}
              <div className="form-card">
                <div className="form-card-header">
                  <i className="fas fa-user-circle"></i>
                  <h3>Datos Personales</h3>
                </div>
                
                <div className="form-grid">
                  <div className="form-field full-width">
                    <label htmlFor="nombre">
                      <i className="fas fa-user"></i>
                      Nombre completo <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      placeholder="Ingresa el nombre completo"
                      disabled={loading}
                      className="uppercase-input"
                      autoComplete="off"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="correo">
                      <i className="fas fa-envelope"></i>
                      Correo electrónico <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      id="correo"
                      name="correo"
                      value={formData.correo}
                      onChange={handleChange}
                      placeholder="ejemplo@correo.com"
                      disabled={loading}
                      autoComplete="off"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="rolId">
                      <i className="fas fa-user-tag"></i>
                      Rol <span className="required">*</span>
                    </label>
                    <select
                      id="rolId"
                      name="rolId"
                      value={formData.rolId}
                      onChange={handleChange}
                      required
                      disabled={loading}
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
                  <h3>Contraseña</h3>
                  <span className="badge required-badge">Obligatorio</span>
                </div>
                
                <div className="form-field full-width">
                  <label htmlFor="contrasenia">
                    <i className="fas fa-key"></i>
                    Contraseña <span className="required">*</span>
                  </label>
                  <div className="password-field">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="contrasenia"
                      name="contrasenia"
                      value={formData.contrasenia}
                      onChange={handleChange}
                      placeholder="Mínimo 8 caracteres"
                      disabled={loading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
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

              {/* Datos Académicos - Solo para alumnos */}
              {esAlumno && (
                <div className="form-card">
                  <div className="form-card-header">
                    <i className="fas fa-graduation-cap"></i>
                    <h3>Datos Académicos</h3>
                    <span className="badge alumno-badge">Alumno</span>
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
                        disabled={loading}
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
                      <label htmlFor="licId">
                        <i className="fas fa-graduation-cap"></i>
                        Licenciatura
                      </label>
                      <select
                        id="licId"
                        name="licId"
                        value={formData.licId}
                        onChange={handleChange}
                        disabled={loading}
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
                        Fecha de inicio <span className="required">*</span>
                      </label>
                      <input
                        type="date"
                        id="fechaInicio"
                        name="fechaInicio"
                        value={formData.fechaInicio}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="fechaFin">
                        <i className="fas fa-calendar-times"></i>
                        Fecha de fin
                      </label>
                      <input
                        type="date"
                        id="fechaFin"
                        name="fechaFin"
                        value={formData.fechaFin}
                        onChange={handleChange}
                        min={formData.fechaInicio}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => navigate('/usuarios')}
                  disabled={loading}
                >
                  <i className="fas fa-times"></i>
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-save"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Registrando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Registrar {esAlumno ? 'Alumno' : 'Usuario'}
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