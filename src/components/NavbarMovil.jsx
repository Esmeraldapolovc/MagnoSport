import { useEffect, useState, useRef } from "react";
import "../assets/styles/NavbarLaptop.css";
import logoImage from "../assets/images/Logo.png";
import { useNavigate, useLocation } from "react-router-dom";
import apiClient from "../service/apiClient";
import { alumno, usuario } from "../features/usuario/service/UsuarioService";
import { useUser } from "../hooks/useUser";
import "../assets/styles/NavbarMovil.css";
import { FiBell, FiCalendar } from "react-icons/fi";
import { LuLogOut } from "react-icons/lu";
import useNotificacionesContador from "../hooks/useNotificacionesContador";

export default function NavbarMovil() {
  const { user, logout } = useUser();
  const { contador, obtenerNotificacionesHoy } = useNotificacionesContador();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const dataFetchedRef = useRef(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const BASE_URL = apiClient.defaults.baseURL;

  // Obtener contador de notificaciones al cargar
  useEffect(() => {
    if (user && (user.rol === 2 || user.rol === 3 || user.rol === 4)) {
      obtenerNotificacionesHoy();
    }
  }, [user]);

  // Actualizar contador cada 5 minutos (opcional)
  useEffect(() => {
    if (!user || (user.rol !== 2 && user.rol !== 3 && user.rol !== 4)) return;
    
    const interval = setInterval(() => {
      obtenerNotificacionesHoy();
    }, 5 * 60 * 1000); // Cada 5 minutos

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const obtenerUsuario = async () => {
      if (userData) {
        console.log("Datos de usuario ya cargados, omitiendo petición");
        return;
      }

      if (isLoading) {
        console.log("Ya hay una petición en curso, omitiendo");
        return;
      }

      if (dataFetchedRef.current) {
        console.log("Datos ya obtenidos en esta sesión, omitiendo");
        return;
      }

      if (!user) {
        console.log("No hay usuario, omitiendo petición");
        return;
      }

      
      setIsLoading(true);
      setError(null);

      try {
        let data;
        if (user.rol == 2) {
          data = await alumno(user.idUsuario);
        } else {
          data = await usuario(user.idUsuario);
        }
        
        setUserData(data);
        dataFetchedRef.current = true; 
      } catch (error) {
        console.error("Error obteniendo usuario", error);
        setError("Error al cargar los datos del usuario");
      } finally {
        setIsLoading(false);
      }
    };

    if (user && !dataFetchedRef.current) {
      obtenerUsuario();
    }

    return () => {
    };
  }, [user?.idUsuario]); 

  if (!user || user.rol === 1) {
    return null;
  }

  const handleLogout = () => {
    dataFetchedRef.current = false;
    logout();
    navigate("/login");
  };

  const handlePerfilClick = () => {
    navigate("/perfil");
  };

  const handleNotificacionesClick = () => {
    navigate("/avisosUsuarios");
  };

  const handleCalendarioClick = () => {
    navigate("/reserva");
  };

  const rutaFoto = userData?.foto
    ? `${BASE_URL}/static/fotos/${userData.foto}`
    : "https://via.placeholder.com/40x40/CF152D/FFFFFF?text=U";

  const getUserRole = () => {
    if (user.rol == 2) return "Alumno";
    if (user.rol == 3) return "Profesor";
    if (user.rol == 4) return "Personal";
    return "Usuario";
  };

  if (error) {
    console.error("Error en NavbarMovil:", error);
  }

  return (
    <nav className="navbar-laptop">
      <div className="nav-left">
        <img
          src={logoImage}
          alt="logo"
          className="nav-logo"
        />

        <div className="nav-icons">
          <button 
            className="icon-btn notificaciones-btn" 
            onClick={handleNotificacionesClick}
            title="Notificaciones"
            aria-label="Notificaciones"
          >
            <FiBell size={24}/>
            {contador > 0 && (
              <span className="notificaciones-badge">{contador > 99 ? '99+' : contador}</span>
            )}
          </button>
          <button 
            className="icon-btn" 
            onClick={handleCalendarioClick}
            title="Calendario"
            aria-label="Calendario"
          >
            <FiCalendar size={24} />
          </button>
        </div>
      </div>

      {/* Lado derecho */}
      <div className="nav-right">
        <div className="user-profile">
          <div className="user-info">
            <span className="user-name">{user.nombre}</span>
            <span className="user-role">{getUserRole()}</span>
          </div>

          <div
            className="avatar-circle clickable"
            onClick={handlePerfilClick}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === "Enter" && handlePerfilClick()}
            aria-label="Perfil de usuario"
          >
            {isLoading ? (
              <div className="avatar-loading">Cargando...</div>
            ) : (
              <img
                src={rutaFoto}
                alt="Avatar"
                className="avatar-img"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/40x40/CF152D/FFFFFF?text=U";
                }}
              />
            )}
          </div>
        </div>

        <button
          className="logout-btn"
          onClick={handleLogout}
          aria-label="Cerrar sesión"
        >
          <LuLogOut size={15}/>
          <span className="logout-text">Salir</span>
        </button>
      </div>
    </nav>
  );
}