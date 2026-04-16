import { useState, useEffect } from "react";
import { login } from "../service/authService";
import "../../../assets/styles/LoginSty.css";
import loginImage from "../../../assets/images/Login.jpg";
import logoImage from "../../../assets/images/Logo.png"; 
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useUser } from "../../../hooks/useUser";

export default function Login() {
  const [correo, setCorreo] = useState("");
  const [contrasenia, setContrasenia] = useState("");
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // Estado para el mensaje de error
  const navigate = useNavigate();
  const { login: contextLogin } = useUser();

  // Precargar la imagen del login
  useEffect(() => {
    const img = new Image();
    img.src = loginImage;
    img.onload = () => {
      setImageLoaded(true);
      console.log("Imagen de login precargada");
    };
  }, []);

  // Activar animación del logo después de un pequeño delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setLogoAnimated(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    setIsLoading(true);
    setErrorMessage(""); // Limpiar error al intentar nuevo login

    try {
      const data = await login(correo, contrasenia);
      contextLogin(data.token);
      const decoded = jwtDecode(data.token);
      
      if (decoded.rol === 1) {
        navigate("/dashboard");
      } else {
        navigate("/reserva");
      }
    } catch (error) {
      console.error("Error al iniciar sesión", error);
      
      // Capturar el mensaje de error de la API
      if (error.response?.data?.detail) {
        setErrorMessage(error.response.data.detail);
      } else if (error.response?.data) {
        // Si la respuesta es un string directamente
        setErrorMessage(error.response.data);
      } else if (error.message) {
        setErrorMessage("Error de conexión. Intenta de nuevo.");
      } else {
        setErrorMessage("Error al iniciar sesión");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Splash screen con animación de 4 segundos
  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 3500);

    const transitionTimer = setTimeout(() => {
      setShowSplash(false);
    }, 4000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(transitionTimer);
    };
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (showSplash) {
    return (
      <div className={`splash-screen ${fadeOut ? "fade-exit" : ""}`}>
        <div className="splash-content">
          <img 
            src={logoImage} 
            alt="Logo" 
            className={`splash-logo ${logoAnimated ? 'animate' : ''}`} 
          />
          <div className="splash-loader">
            <div className="splash-loader-bar"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="card">
          <div className="form-side">
            <div className="logo-container">
              <img src={logoImage} alt="Logo" className="logo" />
            </div>
            <div className="form-container">
              <p className="subtitle">Accede a tu cuenta de reservas</p>
              
              {/* Mensaje de error */}
              {errorMessage && (
                <div className="error-message">
                  <svg className="error-icon" viewBox="0 0 24 24" width="20" height="20">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <circle cx="12" cy="16" r="0.5" fill="currentColor" />
                  </svg>
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="form">
                <div className="input-group">
                  <label>Correo universitario</label>
                  <input
                    type="email"
                    placeholder="tu@universidad.edu"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    required
                    disabled={isLoading}
                    className={errorMessage ? 'input-error' : ''}
                  />
                </div>
                
                <div className="input-group">
                  <label>Contraseña</label>
                  <div className="password-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={contrasenia}
                      onChange={(e) => setContrasenia(e.target.value)}
                      required
                      disabled={isLoading}
                      className={`password-input ${errorMessage ? 'input-error' : ''}`}
                    />
                    <button 
                      type="button" 
                      className="password-toggle-btn" 
                      onClick={togglePasswordVisibility}
                      tabIndex="-1"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <svg className="eye-icon" viewBox="0 0 24 24" width="20" height="20">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg className="eye-icon" viewBox="0 0 24 24" width="20" height="20">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                </button>
              </form>
            </div>
          </div>
          <div className="image-side">
            <div className="image-content">
              {!imageLoaded && (
                <div className="image-placeholder">
                  <div className="image-placeholder-spinner"></div>
                </div>
              )}
              <img 
                src={loginImage} 
                alt="Estudiantes" 
                className={`illustration ${imageLoaded ? 'loaded' : 'loading'}`}
                loading="eager"
                onLoad={() => setImageLoaded(true)}
              />
              <h3 className="image-title">Reserva tu espacio</h3>
              <p className="image-text">Gimnasio, TRX, Cardio y canchas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}