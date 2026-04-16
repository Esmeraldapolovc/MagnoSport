import { useEffect, useState } from "react";
import "../assets/styles/NavbarLaptop.css";
import logoImage from "../assets/images/Logo.png";
import { useNavigate, useLocation } from "react-router-dom";
import apiClient from "../service/apiClient";
import { usuario } from "../features/usuario/service/UsuarioService";
import { useUser } from "../hooks/useUser";
import { LuLogOut } from "react-icons/lu";

export default function NavbarLaptop() {

  const { user, logout } = useUser();

  const [menuOpen, setMenuOpen] = useState(false);
  const [userData, setUserData] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const BASE_URL = apiClient.defaults.baseURL;

  useEffect(() => {

    const obtenerUsuario = async () => {

      if (!user) return;

      try {

        const data = await usuario(user.idUsuario);

        setUserData(data);

      } catch (error) {
        console.error("Error obteniendo usuario", error);
      }

    };

    obtenerUsuario();

  }, [location.pathname, user]); // se ejecuta cuando cambia la ruta o el usuario

  if (!user || user.rol !== 1) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handlePerfilClick = () => {
    navigate("/perfil");
  };

  const rutaFoto = userData?.foto
    ? `${BASE_URL}/static/fotos/${userData.foto}`
    : "https://via.placeholder.com/40x40/CF152D/FFFFFF?text=U";

  return (
    <nav className="navbar-laptop">

      {/* Lado izquierdo */}
      <div className="nav-left">

        <button
          className="menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="hamburger-icon">☰</span>
        </button>

        <img
          src={logoImage}
          alt="logo"
          className="nav-logo"
        />

      </div>

      {/* Lado derecho */}
      <div className="nav-right">

        <div className="user-profile">

          <div className="user-info">
            <span className="user-name">{user.nombre}</span>
            <span className="user-role">Administrador</span>
          </div>

          <div
            className="avatar-circle clickable"
            onClick={handlePerfilClick}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === "Enter" && handlePerfilClick()}
          >

            <img
              src={rutaFoto}
              alt="Avatar"
              className="avatar-img"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/40x40/CF152D/FFFFFF?text=U";
              }}
            />

          </div>

        </div>

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          <LuLogOut size={15} />
          <span className="logout-text">Salir</span>
        </button>

      </div>

      {/* Menú desplegable */}
      {menuOpen && (
        <div className="dropdown-menu">

          <div className="menu-item active" onClick={() => navigate("/dashboard")}>
            <span className="menu-icon"><i className="fa-solid fa-chart-line"></i></span>
            <span className="menu-text">Dashboard</span>
          </div>

          <div className="menu-item" onClick={() => navigate("/usuarios")}>
            <span className="menu-icon"><i className="fa-solid fa-users"></i></span>
            <span className="menu-text">Usuarios</span>
          </div>

          <div className="menu-item" onClick={() => navigate("/Avisos")}>
            <span className="menu-icon"><i className="fa-solid fa-bell"></i></span>
            <span className="menu-text">Avisos</span>
          </div>

          <div className="menu-item" onClick={() => navigate("/horario")}>
            <span className="menu-icon"><i className="fa-solid fa-calendar-days"></i></span>
            <span className="menu-text">Horarios</span>
          </div>

          <div className="menu-item" onClick={() => navigate("/asistenciasYReservas")}>
            <span className="menu-icon"><i className="fa-solid fa-calendar-check"></i></span>
            <span className="menu-text">Asistencias y Reservas</span>
          </div>

          <div className="menu-item" onClick={() => navigate("/Equipo")}>
            <span className="menu-icon"><i className="fa-solid fa-dumbbell"></i></span>
            <span className="menu-text">Equipo</span>
          </div>

          <div className="menu-divider"></div>

          

          <div className="menu-footer">
            <p>Universidad</p>
            <small>Magno</small>
          </div>

        </div>
      )}

    </nav>
  );
}