import { useState, useEffect } from "react";
import { useDashboard } from "../hook/useDashboard";
import "../../../assets/styles/Dashboard.css";

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [tipoVista, setTipoVista] = useState('dia');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  const { 
    dataZona, 
    dataHora, 
    dataZonaMes,
    dataHoraMes,
    dataZonaRango,
    dataHoraRango,
    dataReservasZona,
    dataReservasHora,
    loading, 
    error, 
    fetchDashboard,
    fetchZonaMes,
    fetchHoraMes,
    fetchZonaRango,
    fetchHoraRango,
    fetchEstadisticas,
    fetchReservasZona,
    fetchReservasHora
  } = useDashboard();

  // Determinar qué datos mostrar según la vista
  const datosZona = tipoVista === 'dia' ? dataZona : 
                    tipoVista === 'mes' ? dataZonaMes : 
                    dataZonaRango;
                    
  const datosHora = tipoVista === 'dia' ? dataHora : 
                    tipoVista === 'mes' ? dataHoraMes : 
                    dataHoraRango;

  const datosAsistenciaZona = dataReservasZona;
  const datosAsistenciaHora = dataReservasHora;

  useEffect(() => {
    if (tipoVista === 'dia') {
      fetchDashboard(selectedDate);
      fetchReservasZona(selectedDate, false);
      fetchReservasHora(selectedDate, false);
    } else if (tipoVista === 'mes') {
      fetchZonaMes(selectedDate);
      fetchHoraMes(selectedDate);
      fetchEstadisticas(selectedDate);
      fetchReservasZona(selectedDate, true);
      fetchReservasHora(selectedDate, true);
    }
  }, [selectedDate, tipoVista]);

  useEffect(() => {
    if (tipoVista === 'rango' && fechaInicio && fechaFin) {
      fetchZonaRango(fechaInicio, fechaFin);
      fetchHoraRango(fechaInicio, fechaFin);
    }
  }, [tipoVista, fechaInicio, fechaFin]);

  // Calcular totales según la estructura de datos
  let totalReservas = 0;
  let totalAsistencias = 0;
  let zonaMasActiva = { zona: 'Ninguna', asistencia: 0 };
  let zonaMasAsistencia = { zona: 'Ninguna', asistio: 0 };

  if (tipoVista === 'mes') {
    if (Array.isArray(datosZona) && datosZona.length > 0) {
      totalReservas = datosZona.reduce((sum, item) => sum + (item.total_mes || 0), 0);
      zonaMasActiva = datosZona.reduce((max, item) => 
        (item.total_mes || 0) > (max.asistencia || 0) ? { zona: item.zona, asistencia: item.total_mes } : max, 
        { zona: 'Ninguna', asistencia: 0 }
      );
    }
    
    if (Array.isArray(datosAsistenciaZona) && datosAsistenciaZona.length > 0) {
      totalAsistencias = datosAsistenciaZona.reduce((sum, item) => sum + (item.total_mes || 0), 0);
      zonaMasAsistencia = datosAsistenciaZona.reduce((max, item) => 
        (item.total_mes || 0) > (max.asistio || 0) ? { zona: item.zona, asistio: item.total_mes } : max, 
        { zona: 'Ninguna', asistio: 0 }
      );
    }
  } else {
    totalReservas = Array.isArray(datosZona) ? datosZona.reduce((sum, item) => sum + (item.asistencia || 0), 0) : 0;
    totalAsistencias = Array.isArray(datosAsistenciaZona) ? datosAsistenciaZona.reduce((sum, item) => sum + (item.asistio || 0), 0) : 0;
    
    zonaMasActiva = Array.isArray(datosZona) ? datosZona.reduce((max, item) => 
      (item.asistencia || 0) > (max.asistencia || 0) ? item : max, 
      { zona: 'Ninguna', asistencia: 0 }
    ) : { zona: 'Ninguna', asistencia: 0 };
    
    zonaMasAsistencia = Array.isArray(datosAsistenciaZona) ? datosAsistenciaZona.reduce((max, item) => 
      (item.asistio || 0) > (max.asistio || 0) ? item : max, 
      { zona: 'Ninguna', asistio: 0 }
    ) : { zona: 'Ninguna', asistio: 0 };
  }

  const porcentajeAsistencia = totalReservas > 0 ? ((totalAsistencias / totalReservas) * 100).toFixed(1) : 0;

  const getFechaTexto = () => {
    if (tipoVista === 'dia') {
      const [year, month, day] = selectedDate.split('-');
      const fecha = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return fecha.toLocaleDateString('es-MX', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    if (tipoVista === 'mes') {
      const [year, month] = selectedDate.split('-');
      const fecha = new Date(parseInt(year), parseInt(month) - 1, 1);
      return fecha.toLocaleDateString('es-MX', { 
        year: 'numeric', 
        month: 'long' 
      });
    }
    if (tipoVista === 'rango' && fechaInicio && fechaFin) {
      const [yearI, monthI, dayI] = fechaInicio.split('-');
      const [yearF, monthF, dayF] = fechaFin.split('-');
      const fechaInicioObj = new Date(parseInt(yearI), parseInt(monthI) - 1, parseInt(dayI));
      const fechaFinObj = new Date(parseInt(yearF), parseInt(monthF) - 1, parseInt(dayF));
      const inicio = fechaInicioObj.toLocaleDateString('es-MX');
      const fin = fechaFinObj.toLocaleDateString('es-MX');
      return `${inicio} - ${fin}`;
    }
    return 'Seleccione una fecha';
  };

  const getFechaCorta = () => {
    if (tipoVista === 'dia') {
      const [year, month, day] = selectedDate.split('-');
      return `${day}/${month}/${year}`;
    }
    if (tipoVista === 'mes') {
      const [year, month] = selectedDate.split('-');
      const fecha = new Date(parseInt(year), parseInt(month) - 1, 1);
      return fecha.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
    }
    if (tipoVista === 'rango' && fechaInicio && fechaFin) {
      const [yearI, monthI, dayI] = fechaInicio.split('-');
      const [yearF, monthF, dayF] = fechaFin.split('-');
      return `${dayI}/${monthI}/${yearI} - ${dayF}/${monthF}/${yearF}`;
    }
    return '';
  };

  const handleCambiarVista = (vista) => {
    setTipoVista(vista);
  };

  const handleAplicarRango = () => {
    if (fechaInicio && fechaFin) {
      fetchZonaRango(fechaInicio, fechaFin);
      fetchHoraRango(fechaInicio, fechaFin);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Cargando datos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h3>Error al cargar el dashboard</h3>
        <p>{error.message || error}</p>
        <button onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-title">
          <h1><i className="fas fa-chart-line" style={{ color: '#3b82f6' }}></i> Dashboard de Reservas</h1>
          <p className="header-date"><i className="fas fa-calendar-alt" style={{ color: '#6b7280' }}></i> {getFechaTexto()}</p>
        </div>
        <div className="header-controls">
          <div className="view-selector">
            <button className={`view-btn ${tipoVista === 'dia' ? 'active' : ''}`} onClick={() => handleCambiarVista('dia')}>
              <i className="fas fa-sun" style={{ color: '#f59e0b' }}></i> Día
            </button>
            <button className={`view-btn ${tipoVista === 'mes' ? 'active' : ''}`} onClick={() => handleCambiarVista('mes')}>
              <i className="fas fa-calendar-week" style={{ color: '#8b5cf6' }}></i> Mes
            </button>
            <button className={`view-btn ${tipoVista === 'rango' ? 'active' : ''}`} onClick={() => handleCambiarVista('rango')}>
              <i className="fas fa-chart-bar" style={{ color: '#10b981' }}></i> Rango
            </button>
          </div>

          {tipoVista !== 'rango' ? (
            <div className="date-picker">
              <i className="fas fa-calendar-day" style={{ color: '#6b7280' }}></i>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="date-input" />
            </div>
          ) : (
            <div className="date-picker-rango">
              <div className="date-range-group">
                <i className="fas fa-calendar-alt" style={{ color: '#6b7280' }}></i>
                <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} placeholder="Desde" className="date-input" />
              </div>
              <div className="date-range-group">
                <i className="fas fa-calendar-check" style={{ color: '#10b981' }}></i>
                <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} placeholder="Hasta" className="date-input" />
              </div>
              <button onClick={handleAplicarRango} className="btn-aplicar">
                <i className="fas fa-check" style={{ color: '#ffffff' }}></i> Aplicar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-chart-simple" style={{ color: '#3b82f6' }}></i></div>
          <div className="stat-info">
            <div className="stat-value">{totalReservas}</div>
            <div className="stat-label">Total Reservas</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-check-circle" style={{ color: '#10b981' }}></i></div>
          <div className="stat-info">
            <div className="stat-value">{totalAsistencias}</div>
            <div className="stat-label">Total Asistencias</div>
            <div className="stat-sub">{porcentajeAsistencia}% asistencia</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-trophy" style={{ color: '#f59e0b' }}></i></div>
          <div className="stat-info">
            <div className="stat-value">{zonaMasActiva.zona}</div>
            <div className="stat-label">Zona más activa</div>
            <div className="stat-sub">{zonaMasActiva.asistencia} reservas</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-star" style={{ color: '#ef4444' }}></i></div>
          <div className="stat-info">
            <div className="stat-value">{zonaMasAsistencia.zona}</div>
            <div className="stat-label">Mayor asistencia</div>
            <div className="stat-sub">{zonaMasAsistencia.asistio} personas</div>
          </div>
        </div>
      </div>

      {/* Tablas */}
      <div className="tables-grid">
        {/* Tabla 1 - Reservas por zona */}
        <div className="table-card">
          <div className="table-title">
            <div>
              <i className="fas fa-chart-pie" style={{ color: '#3b82f6' }}></i>
              <span>Reservas por zona</span>
            </div>
            <div className="table-date">{getFechaCorta()}</div>
          </div>
          <div className="table-subtitle">
            <span>Total: {totalReservas} reservas | Asistieron: {totalAsistencias} personas</span>
          </div>
          
          {tipoVista === 'mes' ? (
            <div className="table-scroll">
              <table className="compact-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Zona</th>
                    <th className="num-col">Lun</th>
                    <th className="num-col">Mar</th>
                    <th className="num-col">Mié</th>
                    <th className="num-col">Jue</th>
                    <th className="num-col">Vie</th>
                    <th className="num-col">Sáb</th>
                    <th className="num-col">Total</th>
                    <th className="num-col">Asist.</th>
                  </tr>
                </thead>
                <tbody>
                  {datosZona.map((item, i) => {
                    const asist = datosAsistenciaZona.find(a => a.zona === item.zona);
                    return (
                      <tr key={i}>
                        <td className="rank-cell">{i+1}</td>
                        <td className="zona-name">{item.zona}</td>
                        <td className="num">{item.dias?.Lunes || 0}</td>
                        <td className="num">{item.dias?.Martes || 0}</td>
                        <td className="num">{item.dias?.Miércoles || 0}</td>
                        <td className="num">{item.dias?.Jueves || 0}</td>
                        <td className="num">{item.dias?.Viernes || 0}</td>
                        <td className="num">{item.dias?.Sábado || 0}</td>
                        <td className="num total-col">{item.total_mes || 0}</td>
                        <td className="num">{asist?.total_mes || 0}</td>
                      </tr>
                    );
                  })}
                  {datosZona.length === 0 && (
                    <tr><td colSpan="10" className="empty-row">Sin datos</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <table className="compact-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Zona</th>
                  <th className="num-col">Reservas</th>
                  <th className="num-col">Asist.</th>
                </tr>
              </thead>
              <tbody>
                {datosZona.map((item, i) => {
                  const asist = datosAsistenciaZona.find(a => a.zona === item.zona)?.asistio || 0;
                  return (
                    <tr key={i}>
                      <td className="rank-cell">{i+1}</td>
                      <td className="zona-name">{item.zona}</td>
                      <td className="num">{item.asistencia}</td>
                      <td className="num">{asist}</td>
                    </tr>
                  );
                })}
                {datosZona.length === 0 && (
                  <tr><td colSpan="4" className="empty-row">Sin datos</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Tabla 2 - Reservas por hora - CORREGIDA */}
        <div className="table-card">
          <div className="table-title">
            <div>
              <i className="fas fa-clock" style={{ color: '#6b7280' }}></i>
              <span>Reservas por hora</span>
            </div>
            <div className="table-date">{getFechaCorta()}</div>
          </div>
          <div className="table-subtitle">
            <span>Total: {totalReservas} reservas | Asistieron: {totalAsistencias} personas | Horario: 06:00 - 19:00</span>
          </div>
          
          {tipoVista === 'mes' ? (
            <div className="table-scroll">
              <table className="compact-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Hora</th>
                    <th className="num-col">Lun</th>
                    <th className="num-col">Mar</th>
                    <th className="num-col">Mié</th>
                    <th className="num-col">Jue</th>
                    <th className="num-col">Vie</th>
                    <th className="num-col">Sáb</th>
                    <th className="num-col">Total</th>
                    <th className="num-col">Asist.</th>
                  </tr>
                </thead>
                <tbody>
                  {datosHora.map((item, i) => {
                    // Buscar asistencias para esta hora
                    const asistenciaHora = datosAsistenciaHora.find(a => a.hora === item.hora);
                    
                    // Calcular total de asistencias sumando los días o usando el campo total
                    let totalAsistenciasHora = 0;
                    if (asistenciaHora) {
                      if (asistenciaHora.dias) {
                        // Sumar todos los días de la semana
                        totalAsistenciasHora = Object.values(asistenciaHora.dias).reduce((a, b) => a + b, 0);
                      } else {
                        // Usar campo total o asistio
                        totalAsistenciasHora = asistenciaHora.total || asistenciaHora.asistio || 0;
                      }
                    }
                    
                    const maxTotal = datosHora.length > 0 ? Math.max(...datosHora.map(h => h.total || 0)) : 0;
                    const isPeak = (item.total || 0) === maxTotal && maxTotal > 0;
                    
                    return (
                      <tr key={i} className={isPeak ? 'peak-row' : ''}>
                        <td className="rank-cell">{i+1}</td>
                        <td className="hour-name">
                          {item.hora}
                          {isPeak && <span className="peak-badge">🔥 Pico</span>}
                        </td>
                        <td className="num">{item.dias?.Lunes || 0}</td>
                        <td className="num">{item.dias?.Martes || 0}</td>
                        <td className="num">{item.dias?.Miércoles || 0}</td>
                        <td className="num">{item.dias?.Jueves || 0}</td>
                        <td className="num">{item.dias?.Viernes || 0}</td>
                        <td className="num">{item.dias?.Sábado || 0}</td>
                        <td className="num total-col">{item.total || 0}</td>
                        <td className="num">{totalAsistenciasHora}</td>
                      </tr>
                    );
                  })}
                  {datosHora.length === 0 && (
                    <tr><td colSpan="10" className="empty-row">Sin datos</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="compact-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Hora</th>
                    <th className="num-col">Reservas</th>
                    <th className="num-col">Asist.</th>
                  </tr>
                </thead>
                <tbody>
                  {datosHora.map((item, i) => {
                    const asist = datosAsistenciaHora.find(a => a.hora === item.hora)?.asistio || 0;
                    const maxReservas = datosHora.length > 0 ? Math.max(...datosHora.map(h => h.asistencia)) : 0;
                    const isPeak = item.asistencia === maxReservas && maxReservas > 0;
                    return (
                      <tr key={i} className={isPeak ? 'peak-row' : ''}>
                        <td className="rank-cell">{i+1}</td>
                        <td className="hour-name">
                          {item.hora}
                          {isPeak && <span className="peak-badge">🔥 Pico</span>}
                        </td>
                        <td className="num">{item.asistencia}</td>
                        <td className="num">{asist}</td>
                      </tr>
                    );
                  })}
                  {datosHora.length === 0 && (
                    <tr><td colSpan="4" className="empty-row">Sin datos</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}