import { useState, useCallback, useEffect } from "react";
import { listadoNoticia } from "../features/AvisoUsuarios/Service/avisosUsuariosService";

const useNotificacionesContador = () => {
  const [contador, setContador] = useState(0);
  const [loading, setLoading] = useState(false);

  // Función para obtener la fecha local en formato YYYY-MM-DD
  const obtenerFechaLocal = () => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const obtenerNotificacionesHoy = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listadoNoticia();
      console.log("Datos obtenidos de listadoNoticia:", data);
      
      // Usar fecha local en lugar de UTC
      const fechaActual = obtenerFechaLocal();
      console.log("Fecha actual (YYYY-MM-DD):", fechaActual);
      
      // Filtrar noticias donde fechaPublicacion sea igual a la fecha actual
      const noticiasHoy = data.filter(noticia => {
        const esDeHoy = noticia.fechaPublicacion === fechaActual;
        console.log(`Noticia: ${noticia.titulo}, Fecha: ${noticia.fechaPublicacion}, Es de hoy: ${esDeHoy}`);
        return esDeHoy;
      });
      
      console.log("Noticias de hoy:", noticiasHoy.length);
      setContador(noticiasHoy.length);
    } catch (error) {
      console.error("Error al obtener contador de notificaciones:", error);
      setContador(0);
    } finally {
      setLoading(false);
    }
  }, []);

  return { contador, loading, obtenerNotificacionesHoy };
};

export default useNotificacionesContador;