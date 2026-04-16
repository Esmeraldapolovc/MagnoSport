import { BrowserRouter, Routes, Route, Navigate, Router } from "react-router-dom";
import Login from "../features/auth/pages/Login";
import Dashboard from "../features/Dashboard/pages/Dashboard";
import NavbarLaptop from "../components/NavbarLaptop";
import Perfil from "../features/usuario/pages/Perfil";
import NavbarMovil from "../components/NavbarMovil";
import Reserva from "../features/Reserva/page/Reserva";
import ListaAlumnos from "../features/Usuarios/pages/ListaAlumnos";
import Actualizacion from "../features/Usuarios/pages/Actualizacion";
import ListaUsuario from "../features/Usuarios/pages/ListaUsuario";
import ActualizacionUsuario from "../features/Usuarios/pages/ActualizacionUsuario";
import Agregar from "../features/Usuarios/pages/Agregar";
import { ProtectedRoute } from '../components/ProtectedRoute';
import AuthErrorHandler from "../components/AuthErrorHandler";
import ListaHorario from "../features/Horarios/pages/ListaHorarios";
import ListadoAsistenciayReservas from "../features/AsistenciasyReservas/pages/ListadoAsistenciayReservas";
import ListadoAvisos from "../features/Avisos/page/ListadoAvisos";
import ListadoGeneralEquipo from "../features/Equipo/page/ListadoGeneralEquipo";
import ListadoEquipo from "../features/Equipo/page/ListadoEquipo";
import ListadoAvisosUsuarios from "../features/AvisoUsuarios/page/ListadoAvisosUsuarios";


export default function AppRoutes(){
    return(
        <BrowserRouter>
           <AuthErrorHandler /> 
          <NavbarLaptop />
          <NavbarMovil/>
          <Routes>
           {/* Redirreccion inicial*/}
            <Route path="/" element = {<Navigate to="/login"/>}/>

            <Route path="/login" element={<Login />}/>

            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}/>

            <Route path="/perfil" element={<ProtectedRoute><Perfil/> </ProtectedRoute>} />

            <Route path="/reserva" element={<ProtectedRoute><Reserva/></ProtectedRoute>} />
            
            <Route path ="/usuarios" element ={<ProtectedRoute><ListaAlumnos/></ProtectedRoute>} />

            <Route path="/actualizar" element={<ProtectedRoute><Actualizacion /></ProtectedRoute>} />
            
            <Route path="/personal" element={<ProtectedRoute><ListaUsuario/></ProtectedRoute>} />

            <Route path="/actualizacionUsuario" element = {<ProtectedRoute><ActualizacionUsuario/></ProtectedRoute>} />

            <Route path="/crearUsuario" element = {<ProtectedRoute><Agregar/></ProtectedRoute>} />

            <Route path="/horario" element = {<ProtectedRoute><ListaHorario/></ProtectedRoute>} />

            <Route path="/asistenciasYReservas" element ={<ProtectedRoute><ListadoAsistenciayReservas/></ProtectedRoute>}/>


            <Route path="/Avisos" element = {<ProtectedRoute><ListadoAvisos/></ProtectedRoute>} />

            <Route path="/Equipo" element ={<ProtectedRoute><ListadoGeneralEquipo/></ProtectedRoute>} />

            <Route path="/equipos/:nombreEquipo" element={<ProtectedRoute><ListadoEquipo /></ProtectedRoute>} />
           
           <Route path="/avisosUsuarios" element={<ProtectedRoute><ListadoAvisosUsuarios/></ProtectedRoute>} />
            </Routes>
        </BrowserRouter>
    );
}