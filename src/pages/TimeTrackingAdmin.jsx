import React, { useState, useEffect } from 'react';
import {
  getAllTimeRecords,
  createManualTimeRecord,
  updateTimeRecord,
  exportTimeRecordsCSV,
  exportTimeRecordsPDF,
  getUsers,
  getAllLeaveRequests,
  updateLeaveRequestStatus
} from '../services/api';

const TimeTrackingAdmin = () => {
  // Pestaña Activa
  const [tabActiva, setTabActiva] = useState('fichajes'); // 'fichajes' | 'vacaciones'

  // Filtros
  const [mesSeleccionado, setMesSeleccionado] = useState(
    new Date().toISOString().substring(0, 7)
  );
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('todos');
  const [usuarios, setUsuarios] = useState([]);
  const [filtroEstadoPermiso, setFiltroEstadoPermiso] = useState('TODOS');

  // Datos Fichajes
  const [registros, setRegistros] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [permisosAprobados, setPermisosAprobados] = useState([]);

  // Datos Vacaciones / Permisos
  const [solicitudesPermiso, setSolicitudesPermiso] = useState([]);
  const [cargandoPermisos, setCargandoPermisos] = useState(false);
  const [procesandoPermiso, setProcesandoPermiso] = useState(false);

  const [cargando, setCargando] = useState(true);
  const [descargando, setDescargando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // Modales
  const [modalManualAbierto, setModalManualAbierto] = useState(false);
  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false);
  const [modalAuditAbierto, setModalAuditAbierto] = useState(false);
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);

  // Formulario Manual
  const [formManual, setFormManual] = useState({
    usuarioId: '',
    tipo: 'ENTRADA',
    fecha: new Date().toISOString().substring(0, 10),
    hora: '08:00',
    observaciones: '',
    motivo: ''
  });

  // Formulario Edición
  const [formEdicion, setFormEdicion] = useState({
    id: '',
    tipo: 'ENTRADA',
    fecha: '',
    hora: '',
    observaciones: '',
    motivo: ''
  });

  // Cargar lista de operarios y usuarios
  useEffect(() => {
    getUsers()
      .then((res) => {
        setUsuarios(res.data || []);
      })
      .catch((err) => console.error('Error al cargar usuarios:', err));
  }, []);

  // Cargar registros de fichajes con filtros
  const cargarRegistros = async () => {
    setCargando(true);
    try {
      const params = {
        mes: mesSeleccionado
      };
      if (usuarioSeleccionado !== 'todos') {
        params.usuarioId = usuarioSeleccionado;
      }

      const res = await getAllTimeRecords(params);
      setRegistros(res.data.registros || []);
      setResumen(res.data.resumen || null);
      setPermisosAprobados(res.data.permisosAprobados || []);
    } catch (err) {
      console.error('Error al cargar registros horarios:', err);
      setMensaje({ tipo: 'error', texto: 'No se pudieron cargar los registros de control horario.' });
    } finally {
      setCargando(false);
    }
  };

  // Cargar solicitudes de vacaciones y permisos
  const cargarPermisos = async () => {
    setCargandoPermisos(true);
    try {
      const params = {};
      if (usuarioSeleccionado !== 'todos') {
        params.usuarioId = usuarioSeleccionado;
      }
      if (filtroEstadoPermiso !== 'TODOS') {
        params.estado = filtroEstadoPermiso;
      }
      const res = await getAllLeaveRequests(params);
      setSolicitudesPermiso(res.data || []);
    } catch (err) {
      console.error('Error al cargar permisos:', err);
    } finally {
      setCargandoPermisos(false);
    }
  };

  // Acción rápida 1 clic: Aprobar o Rechazar solicitud
  const handleCambiarEstadoPermiso = async (id, nuevoEstado) => {
    if (procesandoPermiso) return;
    setProcesandoPermiso(true);

    try {
      let comentariosAdmin = '';
      if (nuevoEstado === 'RECHAZADA') {
        comentariosAdmin = prompt('Indica el motivo del rechazo para conocimiento del operario (opcional):') || '';
      }

      const res = await updateLeaveRequestStatus(id, {
        estado: nuevoEstado,
        comentariosAdmin
      });

      setMensaje({ tipo: 'exito', texto: res.data.message });
      setTimeout(() => setMensaje(null), 4000);

      // Recargar ambas listas para que el control horario se actualice automáticamente
      await cargarPermisos();
      await cargarRegistros();
    } catch (err) {
      console.error('Error al actualizar solicitud de permiso:', err);
      alert(err.response?.data?.message || 'Error al actualizar el estado de la solicitud.');
    } finally {
      setProcesandoPermiso(false);
    }
  };

  useEffect(() => {
    cargarRegistros();
    cargarPermisos();
  }, [mesSeleccionado, usuarioSeleccionado, filtroEstadoPermiso]);

  // DESCARGA RÁPIDA PDF PARA INSPECCIÓN DE TRABAJO
  const handleDescargarPDF = async () => {
    setDescargando(true);
    try {
      const params = { mes: mesSeleccionado };
      if (usuarioSeleccionado !== 'todos') {
        params.usuarioId = usuarioSeleccionado;
      }

      const res = await exportTimeRecordsPDF(params);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Inspeccion_Trabajo_Registro_Jornada_${mesSeleccionado}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMensaje({ tipo: 'exito', texto: '📄 Informe Oficial para Inspección de Trabajo descargado con éxito.' });
      setTimeout(() => setMensaje(null), 4000);
    } catch (err) {
      console.error('Error descargando PDF:', err);
      setMensaje({ tipo: 'error', texto: 'Error al generar el PDF de registro horario.' });
    } finally {
      setDescargando(false);
    }
  };

  // EXPORTAR CSV / EXCEL
  const handleDescargarCSV = async () => {
    setDescargando(true);
    try {
      const params = { mes: mesSeleccionado };
      if (usuarioSeleccionado !== 'todos') {
        params.usuarioId = usuarioSeleccionado;
      }

      const res = await exportTimeRecordsCSV(params);
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Registro_Horario_${mesSeleccionado}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMensaje({ tipo: 'exito', texto: '📊 Archivo CSV para Excel descargado con éxito.' });
      setTimeout(() => setMensaje(null), 4000);
    } catch (err) {
      console.error('Error descargando CSV:', err);
      setMensaje({ tipo: 'error', texto: 'Error al generar el archivo CSV.' });
    } finally {
      setDescargando(false);
    }
  };

  // ENVIAR ALTA MANUAL DE FICHAJE
  const handleGuardarManual = async (e) => {
    e.preventDefault();
    if (!formManual.motivo.trim()) {
      alert('Por exigencia legal (RD-ley 8/2019), debe especificar el motivo justificado del fichaje manual.');
      return;
    }

    try {
      const fechaHoraISO = `${formManual.fecha}T${formManual.hora}:00`;
      const payload = {
        usuarioId: formManual.usuarioId,
        tipo: formManual.tipo,
        timestamp: new Date(fechaHoraISO),
        fecha: formManual.fecha,
        observaciones: formManual.observaciones,
        motivo: formManual.motivo
      };

      await createManualTimeRecord(payload);
      setModalManualAbierto(false);
      setFormManual({
        usuarioId: '',
        tipo: 'ENTRADA',
        fecha: new Date().toISOString().substring(0, 10),
        hora: '08:00',
        observaciones: '',
        motivo: ''
      });
      setMensaje({ tipo: 'exito', texto: '✅ Fichaje manual creado y auditado conforme a la ley.' });
      setTimeout(() => setMensaje(null), 4000);
      cargarRegistros();
    } catch (err) {
      console.error('Error al guardar manual:', err);
      alert(err.response?.data?.message || 'Error al guardar el fichaje manual');
    }
  };

  // ABRIR MODAL EDICIÓN AUDITADA
  const abrirEdicion = (reg) => {
    const d = new Date(reg.timestamp);
    const horaFormato = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });

    setFormEdicion({
      id: reg._id,
      tipo: reg.tipo,
      fecha: reg.fecha,
      hora: horaFormato,
      observaciones: reg.observaciones || '',
      motivo: ''
    });
    setModalEdicionAbierto(true);
  };

  // ENVIAR EDICIÓN AUDITADA
  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!formEdicion.motivo.trim()) {
      alert('Por exigencia legal (RD-ley 8/2019), debe detallar el motivo justificado de la modificación.');
      return;
    }

    try {
      const fechaHoraISO = `${formEdicion.fecha}T${formEdicion.hora}:00`;
      const payload = {
        tipo: formEdicion.tipo,
        timestamp: new Date(fechaHoraISO),
        fecha: formEdicion.fecha,
        observaciones: formEdicion.observaciones,
        motivo: formEdicion.motivo
      };

      await updateTimeRecord(formEdicion.id, payload);
      setModalEdicionAbierto(false);
      setMensaje({ tipo: 'exito', texto: '✅ Registro horario corregido con trazabilidad y pista de auditoría guardada.' });
      setTimeout(() => setMensaje(null), 4000);
      cargarRegistros();
    } catch (err) {
      console.error('Error al actualizar fichaje:', err);
      alert(err.response?.data?.message || 'Error al actualizar el registro');
    }
  };

  // ABRIR MODAL DE AUDITORÍA (AUDIT TRAIL)
  const verAuditoria = (reg) => {
    setRegistroSeleccionado(reg);
    setModalAuditAbierto(true);
  };

  const formatearHora = (date) => {
    if (!date) return '--:--';
    return new Date(date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const tiposBadge = {
    ENTRADA: { label: 'Entrada', bg: '#d1fae5', color: '#065f46', icon: '🟢' },
    PAUSA_INICIO: { label: 'Pausa (Inicio)', bg: '#fef3c7', color: '#92400e', icon: '⏸️' },
    PAUSA_FIN: { label: 'Pausa (Fin)', bg: '#dbeafe', color: '#1e40af', icon: '▶️' },
    SALIDA: { label: 'Salida', bg: '#fee2e2', color: '#991b1b', icon: '🔴' }
  };

  return (
    <div className="vista-dashboard">
      
      {/* CABECERA PRINCIPAL */}
      <div className="header-dashboard">
        <div className="header-text-block">
          <h2>⏰ Auditoría y Control Horario (RD-ley 8/2019)</h2>
          <p className="subtitulo-dashboard">
            Supervisión legal de jornada laboral, trazabilidad inalterable y generación de informes oficiales para la Inspección de Trabajo.
          </p>
        </div>

        {/* BOTÓN RÁPIDO INSPECCIÓN DE TRABAJO */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={handleDescargarPDF}
            disabled={descargando}
            className="boton-inspeccion-trabajo"
          >
            🚨 {descargando ? 'Generando PDF...' : 'DESCARGA INSPECCIÓN DE TRABAJO (PDF)'}
          </button>
          
          <button
            onClick={handleDescargarCSV}
            disabled={descargando}
            className="boton-accion-secundario"
          >
            📊 Exportar Excel / CSV
          </button>

          <button
            onClick={() => setModalManualAbierto(true)}
            className="boton-accion-primario"
          >
            ➕ Fichaje Manual
          </button>
        </div>
      </div>

      {/* MENSAJE DE ESTADO */}
      {mensaje && (
        <div className={`alerta-sistema ${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      {/* SELECTOR DE PESTAÑAS: CONTROL HORARIO VS GESTIÓN DE VACACIONES */}
      <div className="pestanas-admin-horario">
        <button
          onClick={() => setTabActiva('fichajes')}
          className={`boton-pestana-admin ${tabActiva === 'fichajes' ? 'activa' : ''}`}
        >
          ⏰ Registro Horario y Fichajes
        </button>
        <button
          onClick={() => setTabActiva('vacaciones')}
          className={`boton-pestana-admin ${tabActiva === 'vacaciones' ? 'activa' : ''}`}
        >
          🏖️ Solicitudes de Vacaciones y Permisos
          {solicitudesPermiso.filter(s => s.estado === 'PENDIENTE').length > 0 && (
            <span className="badge-contador-pendientes">
              {solicitudesPermiso.filter(s => s.estado === 'PENDIENTE').length} pendientes
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: CONTROL HORARIO Y FICHAJES (RD-LEY 8/2019) */}
      {/* ========================================================================= */}
      {tabActiva === 'fichajes' && (
        <>
          {/* BARRA DE FILTROS */}
          <div className="barra-filtros-horario">
            <div className="filtro-item">
              <label>📅 Mes de Liquidación:</label>
              <input
                type="month"
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(e.target.value)}
                className="input-filtro"
              />
            </div>

            <div className="filtro-item">
              <label>👤 Filtrar por Trabajador:</label>
              <select
                value={usuarioSeleccionado}
                onChange={(e) => setUsuarioSeleccionado(e.target.value)}
                className="select-filtro"
              >
                <option value="todos">👥 Todos los empleados</option>
                {usuarios.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.nombre} ({u.dni || 'Sin DNI'}) - {u.rol}
                  </option>
                ))}
              </select>
            </div>

            <button onClick={cargarRegistros} className="boton-recargar-filtro">
              🔄 Actualizar
            </button>
          </div>

          {/* TARJETAS DE MÉTRICAS / KPIS DEL PERÍODO */}
          <div className="kpi-grid-horario">
            <div className="tarjeta-kpi-horario">
              <span className="kpi-titulo">Total Fichajes Registrados</span>
              <strong className="kpi-valor">{registros.length}</strong>
              <span className="kpi-sub">En el período seleccionado</span>
            </div>

            <div className="tarjeta-kpi-horario">
              <span className="kpi-titulo">Horas Ordinarias</span>
              <strong className="kpi-valor" style={{ color: '#0284c7' }}>
                {resumen ? resumen.totalHorasOrdinarias.toFixed(2) : '0.00'} h
              </strong>
              <span className="kpi-sub">Jornada ordinaria (máx. 8h/día)</span>
            </div>

            <div className="tarjeta-kpi-horario">
              <span className="kpi-titulo">Horas Extraordinarias</span>
              <strong
                className="kpi-valor"
                style={{ color: (resumen?.totalHorasExtra || 0) > 0 ? '#dc2626' : '#16a34a' }}
              >
                {resumen ? resumen.totalHorasExtra.toFixed(2) : '0.00'} h
              </strong>
              <span className="kpi-sub">Excesos sujetos a compensación</span>
            </div>

            <div className="tarjeta-kpi-horario">
              <span className="kpi-titulo">Tiempo Total Efectivo</span>
              <strong className="kpi-valor" style={{ color: '#0f172a' }}>
                {resumen ? resumen.totalHorasTrabajadas.toFixed(2) : '0.00'} h
              </strong>
              <span className="kpi-sub">Horas netas computables</span>
            </div>
          </div>

          {/* AVISO DE VACACIONES / PERMISOS APROBADOS EN EL MES */}
          {permisosAprobados.length > 0 && (
            <div className="banner-permisos-aprobados-info">
              <span className="icono-banner-permisos">🏖️</span>
              <div>
                <strong>Ausencias Justificadas en el Mes ({permisosAprobados.length}):</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                  Los siguientes empleados tienen vacaciones o permisos aprobados en este período, por lo que sus ausencias no computan como falta de jornada:
                </p>
                <div className="chips-permisos-contenedor">
                  {permisosAprobados.map((p) => (
                    <span key={p._id} className="chip-permiso-aprobado">
                      👤 {p.usuario?.nombre}: <strong>{p.tipo.replace('_', ' ')}</strong> ({p.fechaInicio} al {p.fechaFin})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TABLA PRINCIPAL DE AUDITORÍA Y REGISTROS */}
          <div className="tabla-contenedor-horario">
            <div className="tabla-header-info">
              <h3>📋 Registro Detallado de Fichajes y Trazabilidad</h3>
              <span className="badge-legal-info">Inalterabilidad protegida por RD-ley 8/2019</span>
            </div>

        {cargando ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            ⏳ Consultando base de datos de control horario...
          </div>
        ) : registros.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            📭 No hay fichajes registrados para los filtros seleccionados ({mesSeleccionado}).
          </div>
        ) : (
          <div className="tabla-scroll-responsive">
            <table className="tabla-horario">
              <thead>
                <tr>
                  <th>TRABAJADOR</th>
                  <th>TIPO</th>
                  <th>FECHA Y HORA</th>
                  <th>GEOLOCALIZACIÓN GPS</th>
                  <th>ORIGEN / AUDITORÍA</th>
                  <th>OBSERVACIONES</th>
                  <th style={{ textAlign: 'center' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((reg) => {
                  const itemTipo = tiposBadge[reg.tipo] || { label: reg.tipo, bg: '#e2e8f0', color: '#334155', icon: '📍' };
                  const tieneAudit = reg.auditTrail && reg.auditTrail.length > 0;
                  const esManual = reg.origen === 'manual_admin';

                  return (
                    <tr key={reg._id}>
                      {/* Trabajador */}
                      <td>
                        <strong>{reg.usuario?.nombre || 'Desconocido'}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          DNI: {reg.usuario?.dni || 'Sin DNI'}
                        </div>
                      </td>

                      {/* Tipo */}
                      <td>
                        <span
                          className="badge-tipo-fichaje"
                          style={{ backgroundColor: itemTipo.bg, color: itemTipo.color }}
                        >
                          {itemTipo.icon} {itemTipo.label}
                        </span>
                      </td>

                      {/* Fecha y Hora Exacta */}
                      <td>
                        <strong>{formatearHora(reg.timestamp)}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{reg.fecha}</div>
                      </td>

                      {/* Geolocalización GPS */}
                      <td>
                        {reg.geolocalizacion?.capturada ? (
                          <div>
                            <a
                              href={`https://www.google.com/maps?q=${reg.geolocalizacion.latitud},${reg.geolocalizacion.longitud}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="enlace-gps-maps"
                              title="Ver en Google Maps"
                            >
                              🛰️ {reg.geolocalizacion.latitud.toFixed(4)}, {reg.geolocalizacion.longitud.toFixed(4)} ↗
                            </a>
                            <div style={{ fontSize: '10px', color: '#059669' }}>
                              Precisión: ±{Math.round(reg.geolocalizacion.precision || 0)}m
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {reg.geolocalizacion?.direccionAprox || 'Sin GPS'}
                          </span>
                        )}
                      </td>

                      {/* Origen y Auditoría */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {esManual && (
                            <span className="badge-audit badge-manual">
                              ✍️ Manual Admin
                            </span>
                          )}
                          {tieneAudit ? (
                            <button
                              onClick={() => verAuditoria(reg)}
                              className="boton-ver-auditoria"
                            >
                              ⚠️ Modificado ({reg.auditTrail.length} cambio{reg.auditTrail.length > 1 ? 's' : ''})
                            </button>
                          ) : (
                            <span className="badge-audit badge-original">
                              🔒 Original Inalterado
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Observaciones */}
                      <td>
                        <span style={{ fontSize: '12px', color: '#475569' }}>
                          {reg.observaciones || '-'}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => abrirEdicion(reg)}
                          className="boton-accion-editar-fichaje"
                          title="Corregir fichaje con justificación legal obligatoria"
                        >
                          ✏️ Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: GESTIÓN DE SOLICITUDES DE VACACIONES Y PERMISOS */}
      {/* ========================================================================= */}
      {tabActiva === 'vacaciones' && (
        <div className="seccion-admin-vacaciones">
          
          {/* BARRA DE FILTROS PARA VACACIONES */}
          <div className="barra-filtros-horario">
            <div className="filtro-item">
              <label>🔍 Filtrar por Estado:</label>
              <select
                value={filtroEstadoPermiso}
                onChange={(e) => setFiltroEstadoPermiso(e.target.value)}
                className="select-filtro"
              >
                <option value="TODOS">📋 Todas las solicitudes</option>
                <option value="PENDIENTE">🟡 Pendientes de Aprobación</option>
                <option value="APROBADA">✅ Aprobadas</option>
                <option value="RECHAZADA">❌ Rechazadas</option>
              </select>
            </div>

            <div className="filtro-item">
              <label>👤 Filtrar por Trabajador:</label>
              <select
                value={usuarioSeleccionado}
                onChange={(e) => setUsuarioSeleccionado(e.target.value)}
                className="select-filtro"
              >
                <option value="todos">👥 Todos los empleados</option>
                {usuarios.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.nombre} ({u.dni || 'Sin DNI'}) - {u.rol}
                  </option>
                ))}
              </select>
            </div>

            <button onClick={cargarPermisos} className="boton-recargar-filtro">
              🔄 Actualizar Solicitudes
            </button>
          </div>

          {/* KPIS DE VACACIONES Y PERMISOS */}
          <div className="kpi-grid-horario">
            <div className="tarjeta-kpi-horario">
              <span className="kpi-titulo">Total Solicitudes</span>
              <strong className="kpi-valor">{solicitudesPermiso.length}</strong>
              <span className="kpi-sub">Histórico registrado</span>
            </div>

            <div className="tarjeta-kpi-horario">
              <span className="kpi-titulo">Pendientes de Aprobación</span>
              <strong
                className="kpi-valor"
                style={{
                  color: solicitudesPermiso.filter((s) => s.estado === 'PENDIENTE').length > 0 ? '#b45309' : '#16a34a'
                }}
              >
                {solicitudesPermiso.filter((s) => s.estado === 'PENDIENTE').length}
              </strong>
              <span className="kpi-sub">Requieren respuesta administrativa</span>
            </div>

            <div className="tarjeta-kpi-horario">
              <span className="kpi-titulo">Permisos Aprobados</span>
              <strong className="kpi-valor" style={{ color: '#16a34a' }}>
                {solicitudesPermiso.filter((s) => s.estado === 'APROBADA').length}
              </strong>
              <span className="kpi-sub">Justifican jornada automáticamente</span>
            </div>

            <div className="tarjeta-kpi-horario">
              <span className="kpi-titulo">Solicitudes Rechazadas</span>
              <strong className="kpi-valor" style={{ color: '#dc2626' }}>
                {solicitudesPermiso.filter((s) => s.estado === 'RECHAZADA').length}
              </strong>
              <span className="kpi-sub">Denegadas por la empresa</span>
            </div>
          </div>

          {/* TABLA DE GESTIÓN DE SOLICITUDES */}
          <div className="tabla-contenedor-horario">
            <div className="tabla-header-info">
              <h3>📋 Panel de Aprobación de Vacaciones y Permisos</h3>
              <span className="badge-legal-info">Conexión automatizada con Control Horario</span>
            </div>

            {cargandoPermisos ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                ⏳ Cargando solicitudes de permisos...
              </div>
            ) : solicitudesPermiso.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                🎉 No hay solicitudes de vacaciones o permisos en este criterio de búsqueda.
              </div>
            ) : (
              <div className="tabla-scroll-responsive">
                <table className="tabla-horario">
                  <thead>
                    <tr>
                      <th>EMPLEADO</th>
                      <th>TIPO DE PERMISO</th>
                      <th>PERÍODO SOLICITADO</th>
                      <th>DETALLES / COMENTARIOS</th>
                      <th>ESTADO</th>
                      <th style={{ textAlign: 'center' }}>GESTIÓN (1 CLIC)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {solicitudesPermiso.map((sol) => {
                      const tiposLabels = {
                        VACACIONES: { label: '🏖️ Vacaciones', bg: '#e0f2fe', color: '#0369a1' },
                        ASUNTOS_PROPIOS: { label: '🏠 Asuntos Propios', bg: '#ede9fe', color: '#6d28d9' },
                        BAJA: { label: '🏥 Baja Médica', bg: '#fee2e2', color: '#b91c1c' },
                        OTROS: { label: '📄 Otro Permiso', bg: '#f1f5f9', color: '#334155' }
                      };
                      const tipoBadge = tiposLabels[sol.tipo] || { label: sol.tipo, bg: '#f1f5f9', color: '#334155' };

                      return (
                        <tr key={sol._id}>
                          {/* Empleado */}
                          <td>
                            <strong>{sol.usuario?.nombre || 'Desconocido'}</strong>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              DNI: {sol.usuario?.dni || 'Sin DNI'} | {sol.usuario?.rol}
                            </div>
                          </td>

                          {/* Tipo */}
                          <td>
                            <span
                              className="badge-tipo-fichaje"
                              style={{ backgroundColor: tipoBadge.bg, color: tipoBadge.color }}
                            >
                              {tipoBadge.label}
                            </span>
                          </td>

                          {/* Período */}
                          <td>
                            <strong>{sol.fechaInicio}</strong> al <strong>{sol.fechaFin}</strong>
                          </td>

                          {/* Comentarios */}
                          <td>
                            <div style={{ fontSize: '12px', color: '#334155' }}>
                              {sol.comentariosOperario ? `"${sol.comentariosOperario}"` : '-'}
                            </div>
                            {sol.comentariosAdmin && (
                              <div style={{ fontSize: '11px', color: '#b45309', marginTop: '2px' }}>
                                <em>Resp. Admin: {sol.comentariosAdmin}</em>
                              </div>
                            )}
                          </td>

                          {/* Estado */}
                          <td>
                            {sol.estado === 'PENDIENTE' && (
                              <span className="badge-audit badge-manual">
                                🟡 Pendiente
                              </span>
                            )}
                            {sol.estado === 'APROBADA' && (
                              <span className="badge-audit" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                                ✅ Aprobada
                              </span>
                            )}
                            {sol.estado === 'RECHAZADA' && (
                              <span className="badge-audit" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
                                ❌ Rechazada
                              </span>
                            )}
                          </td>

                          {/* Acciones de 1 Clic */}
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              {sol.estado === 'PENDIENTE' ? (
                                <>
                                  <button
                                    onClick={() => handleCambiarEstadoPermiso(sol._id, 'APROBADA')}
                                    disabled={procesandoPermiso}
                                    className="boton-aprobar-permiso"
                                    title="Aprobar inmediatamente y justificar en control horario"
                                  >
                                    ✅ Aprobar
                                  </button>
                                  <button
                                    onClick={() => handleCambiarEstadoPermiso(sol._id, 'RECHAZADA')}
                                    disabled={procesandoPermiso}
                                    className="boton-rechazar-permiso"
                                    title="Rechazar solicitud"
                                  >
                                    ❌ Rechazar
                                  </button>
                                </>
                              ) : sol.estado === 'APROBADA' ? (
                                <button
                                  onClick={() => handleCambiarEstadoPermiso(sol._id, 'RECHAZADA')}
                                  disabled={procesandoPermiso}
                                  className="boton-accion-secundario"
                                  style={{ padding: '4px 8px', fontSize: '11px' }}
                                  title="Revocar aprobación"
                                >
                                  Desactivar
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleCambiarEstadoPermiso(sol._id, 'APROBADA')}
                                  disabled={procesandoPermiso}
                                  className="boton-aprobar-permiso"
                                  style={{ padding: '4px 8px', fontSize: '11px' }}
                                  title="Reconsiderar y aprobar"
                                >
                                  Aprobar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* MODAL 1: AÑADIR FICHAJE MANUAL (CON MOTIVO OBLIGATORIO) */}
      {modalManualAbierto && (
        <div className="modal-overlay" onClick={() => setModalManualAbierto(false)}>
          <div className="modal-contenido" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>➕ Añadir Fichaje Manual (Auditoría Legal)</h3>
              <button onClick={() => setModalManualAbierto(false)} className="boton-cerrar-modal">✖</button>
            </div>

            <form onSubmit={handleGuardarManual} className="modal-form-crud">
              <label>Trabajador:</label>
              <select
                value={formManual.usuarioId}
                onChange={(e) => setFormManual({ ...formManual, usuarioId: e.target.value })}
                required
              >
                <option value="">Selecciona un operario...</option>
                {usuarios.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.nombre} ({u.dni || 'Sin DNI'}) - {u.rol}
                  </option>
                ))}
              </select>

              <label>Tipo de Acción:</label>
              <select
                value={formManual.tipo}
                onChange={(e) => setFormManual({ ...formManual, tipo: e.target.value })}
              >
                <option value="ENTRADA">🟢 Entrada</option>
                <option value="PAUSA_INICIO">⏸️ Pausa (Inicio)</option>
                <option value="PAUSA_FIN">▶️ Pausa (Fin / Reanudación)</option>
                <option value="SALIDA">🔴 Salida</option>
              </select>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label>Fecha:</label>
                  <input
                    type="date"
                    value={formManual.fecha}
                    onChange={(e) => setFormManual({ ...formManual, fecha: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label>Hora:</label>
                  <input
                    type="time"
                    value={formManual.hora}
                    onChange={(e) => setFormManual({ ...formManual, hora: e.target.value })}
                    required
                  />
                </div>
              </div>

              <label>Observaciones (opcional):</label>
              <input
                type="text"
                placeholder="Ej: Olvido de fichaje al llegar al taller"
                value={formManual.observaciones}
                onChange={(e) => setFormManual({ ...formManual, observaciones: e.target.value })}
              />

              <div className="caja-alerta-legal">
                <label style={{ color: '#b45309', fontWeight: 'bold' }}>
                  ⚖️ MOTIVO JUSTIFICADO DE LA CREACIÓN MANUAL (OBLIGATORIO):
                </label>
                <textarea
                  rows="3"
                  placeholder="Detalla la justificación exigida por la Inspección de Trabajo (ej. Error en dispositivo móvil del operario confirmado telefónicamente a las 08:05)..."
                  value={formManual.motivo}
                  onChange={(e) => setFormManual({ ...formManual, motivo: e.target.value })}
                  required
                />
                <small style={{ color: '#78350f', fontSize: '11px' }}>
                  Este motivo quedará grabado de forma permanente en la pista de auditoría inalterable del sistema.
                </small>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setModalManualAbierto(false)}
                  className="boton-accion-secundario"
                >
                  Cancelar
                </button>
                <button type="submit" className="boton-accion-primario">
                  Guardar Fichaje y Registrar Auditoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDICIÓN AUDITADA DE FICHAJE EXISTENTE */}
      {modalEdicionAbierto && (
        <div className="modal-overlay" onClick={() => setModalEdicionAbierto(false)}>
          <div className="modal-contenido" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>✏️ Rectificación de Fichaje (Audit Trail)</h3>
              <button onClick={() => setModalEdicionAbierto(false)} className="boton-cerrar-modal">✖</button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="modal-form-crud">
              <label>Tipo de Fichaje:</label>
              <select
                value={formEdicion.tipo}
                onChange={(e) => setFormEdicion({ ...formEdicion, tipo: e.target.value })}
              >
                <option value="ENTRADA">🟢 Entrada</option>
                <option value="PAUSA_INICIO">⏸️ Pausa (Inicio)</option>
                <option value="PAUSA_FIN">▶️ Pausa (Fin / Reanudación)</option>
                <option value="SALIDA">🔴 Salida</option>
              </select>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label>Fecha:</label>
                  <input
                    type="date"
                    value={formEdicion.fecha}
                    onChange={(e) => setFormEdicion({ ...formEdicion, fecha: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label>Hora:</label>
                  <input
                    type="time"
                    value={formEdicion.hora}
                    onChange={(e) => setFormEdicion({ ...formEdicion, hora: e.target.value })}
                    required
                  />
                </div>
              </div>

              <label>Observaciones:</label>
              <input
                type="text"
                value={formEdicion.observaciones}
                onChange={(e) => setFormEdicion({ ...formEdicion, observaciones: e.target.value })}
              />

              <div className="caja-alerta-legal">
                <label style={{ color: '#b45309', fontWeight: 'bold' }}>
                  ⚖️ MOTIVO JUSTIFICADO DE LA MODIFICACIÓN (OBLIGATORIO):
                </label>
                <textarea
                  rows="3"
                  placeholder="Justificación requerida por el Estatuto de los Trabajadores art. 34.9 para cualquier rectificación de jornada..."
                  value={formEdicion.motivo}
                  onChange={(e) => setFormEdicion({ ...formEdicion, motivo: e.target.value })}
                  required
                />
                <small style={{ color: '#78350f', fontSize: '11px' }}>
                  Los datos originales se preservarán intactos en la traza de auditoría con la firma del administrador.
                </small>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setModalEdicionAbierto(false)}
                  className="boton-accion-secundario"
                >
                  Cancelar
                </button>
                <button type="submit" className="boton-accion-primario">
                  Aplicar Modificación y Grabar Auditoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONSULTAR HISTORIAL DE AUDITORÍA (AUDIT TRAIL) */}
      {modalAuditAbierto && registroSeleccionado && (
        <div className="modal-overlay" onClick={() => setModalAuditAbierto(false)}>
          <div className="modal-contenido" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>📜 Trazabilidad y Pista de Auditoría Legal</h3>
              <button onClick={() => setModalAuditAbierto(false)} className="boton-cerrar-modal">✖</button>
            </div>

            <div style={{ padding: '8px 0' }}>
              <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
                Historial de modificaciones del fichaje para el operario{' '}
                <strong>{registroSeleccionado.usuario?.nombre}</strong> del día{' '}
                <strong>{registroSeleccionado.fecha}</strong>.
              </p>

              <div className="historial-audit-lista">
                {registroSeleccionado.auditTrail.map((audit, idx) => (
                  <div key={idx} className="tarjeta-audit-item">
                    <div className="audit-item-header">
                      <strong>👤 Modificado por: {audit.nombreModificador || audit.modificadoPor?.nombre || 'Administrador'}</strong>
                      <span className="audit-fecha">
                        {new Date(audit.fechaModificacion).toLocaleString('es-ES')}
                      </span>
                    </div>

                    <div className="audit-motivo-bloque">
                      <span className="audit-motivo-label">Motivo Justificado:</span>
                      <p className="audit-motivo-texto">"{audit.motivo}"</p>
                    </div>

                    {audit.valoresAnteriores && (
                      <div className="audit-diff-grid">
                        <div className="diff-col diff-anterior">
                          <span>Valores Anteriores:</span>
                          <code>{JSON.stringify(audit.valoresAnteriores, null, 2)}</code>
                        </div>
                        <div className="diff-col diff-nuevo">
                          <span>Nuevos Valores:</span>
                          <code>{JSON.stringify(audit.valoresNuevos, null, 2)}</code>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button
                  onClick={() => setModalAuditAbierto(false)}
                  className="boton-accion-secundario"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TimeTrackingAdmin;
