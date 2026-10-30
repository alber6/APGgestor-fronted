import React, { useState, useEffect } from 'react';
import { createLeaveRequest, getMyLeaveRequests, cancelLeaveRequest } from '../services/api';

const LeaveRequestOperator = ({ onSolicitudActualizada }) => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // Formulario
  const [formData, setFormData] = useState({
    tipo: 'VACACIONES',
    fechaInicio: new Date().toISOString().substring(0, 10),
    fechaFin: new Date().toISOString().substring(0, 10),
    comentariosOperario: ''
  });

  const cargarSolicitudes = async () => {
    try {
      const res = await getMyLeaveRequests();
      setSolicitudes(res.data || []);
    } catch (err) {
      console.error('Error al cargar solicitudes de permisos:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const hoyStr = new Date().toISOString().substring(0, 10);
  const esPermisoRetroactivo = ['BAJA', 'OTROS'].includes(formData.tipo);

  const handleCrearSolicitud = async (e) => {
    e.preventDefault();
    if (formData.fechaInicio > formData.fechaFin) {
      alert('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }

    if (!esPermisoRetroactivo && formData.fechaInicio < hoyStr) {
      alert('No es posible solicitar vacaciones o asuntos propios con fecha anterior a hoy. Solo se permiten fechas pasadas para BAJA o permisos sobrevenidos (OTROS).');
      return;
    }

    setEnviando(true);
    setMensaje(null);

    try {
      const res = await createLeaveRequest(formData);
      setMensaje({ tipo: 'exito', texto: res.data.message });
      setModalAbierto(false);
      setFormData({
        tipo: 'VACACIONES',
        fechaInicio: new Date().toISOString().substring(0, 10),
        fechaFin: new Date().toISOString().substring(0, 10),
        comentariosOperario: ''
      });
      await cargarSolicitudes();
      if (onSolicitudActualizada) onSolicitudActualizada();
    } catch (err) {
      console.error('Error al enviar solicitud:', err);
      alert(err.response?.data?.message || 'Error al enviar la solicitud.');
    } finally {
      setEnviando(false);
      setTimeout(() => setMensaje(null), 5000);
    }
  };

  const handleCancelar = async (id) => {
    if (!window.confirm('¿Deseas cancelar esta solicitud de permiso?')) return;
    try {
      await cancelLeaveRequest(id);
      setMensaje({ tipo: 'exito', texto: 'Solicitud cancelada correctamente.' });
      await cargarSolicitudes();
      if (onSolicitudActualizada) onSolicitudActualizada();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al cancelar la solicitud.');
    }
  };

  const tiposBadge = {
    VACACIONES: { label: '🏖️ Vacaciones', color: '#0284c7', bg: '#e0f2fe' },
    ASUNTOS_PROPIOS: { label: '🏠 Asuntos Propios', color: '#7c3aed', bg: '#ede9fe' },
    BAJA: { label: '🏥 Baja Médica', color: '#dc2626', bg: '#fee2e2' },
    OTROS: { label: '📄 Otro Permiso', color: '#475569', bg: '#f1f5f9' }
  };

  const estadosBadge = {
    PENDIENTE: { label: '⏳ Pendiente', color: '#b45309', bg: '#fef3c7' },
    APROBADA: { label: '✅ Aprobada', color: '#166534', bg: '#dcfce7' },
    RECHAZADA: { label: '❌ Rechazada', color: '#991b1b', bg: '#fee2e2' }
  };

  return (
    <div className="seccion-vacaciones-operario">
      <div className="vacaciones-header">
        <div>
          <h4>🏖️ Solicitud de Vacaciones y Permisos</h4>
          <p className="subtitulo-permisos">
            Gestiona tus descansos justificados e intégralos con el control horario.
          </p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="boton-solicitar-vacaciones"
        >
          ➕ Solicitar Días
        </button>
      </div>

      {mensaje && (
        <div className={`alerta-intratime ${mensaje.tipo}`} style={{ marginTop: '10px' }}>
          {mensaje.texto}
        </div>
      )}

      {/* LISTADO DE SOLICITUDES */}
      <div className="lista-solicitudes-operario">
        {cargando ? (
          <p style={{ fontSize: '13px', color: '#64748b' }}>Cargando tus solicitudes...</p>
        ) : solicitudes.length === 0 ? (
          <p className="mensaje-vacio-solicitudes">
            No tienes solicitudes de permisos registradas. Pulsa en <strong>"Solicitar Días"</strong> cuando necesites planificar tus vacaciones.
          </p>
        ) : (
          solicitudes.map((sol) => {
            const tipoInfo = tiposBadge[sol.tipo] || { label: sol.tipo, color: '#334155', bg: '#f1f5f9' };
            const estadoInfo = estadosBadge[sol.estado] || { label: sol.estado, color: '#334155', bg: '#f1f5f9' };

            return (
              <div key={sol._id} className="tarjeta-solicitud-operario">
                <div className="solicitud-fila-principal">
                  <span
                    className="badge-tipo-permiso"
                    style={{ backgroundColor: tipoInfo.bg, color: tipoInfo.color }}
                  >
                    {tipoInfo.label}
                  </span>

                  <span
                    className="badge-estado-permiso"
                    style={{ backgroundColor: estadoInfo.bg, color: estadoInfo.color }}
                  >
                    {estadoInfo.label}
                  </span>
                </div>

                <div className="solicitud-fechas">
                  📅 Del <strong>{sol.fechaInicio}</strong> al <strong>{sol.fechaFin}</strong>
                </div>

                {sol.comentariosOperario && (
                  <p className="solicitud-comentario-op">
                    💬 <em>"{sol.comentariosOperario}"</em>
                  </p>
                )}

                {sol.comentariosAdmin && (
                  <div className="solicitud-respuesta-admin">
                    <strong>Respuesta de la empresa:</strong> {sol.comentariosAdmin}
                  </div>
                )}

                {sol.estado === 'PENDIENTE' && (
                  <div style={{ marginTop: '8px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleCancelar(sol._id)}
                      className="boton-cancelar-solicitud"
                    >
                      🗑️ Cancelar solicitud
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE SOLICITAR VACACIONES */}
      {modalAbierto && (
        <div className="modal-overlay" onClick={() => setModalAbierto(false)}>
          <div className="modal-contenido" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>🏖️ Nueva Solicitud de Permiso / Vacaciones</h3>
              <button onClick={() => setModalAbierto(false)} className="boton-cerrar-modal">✖</button>
            </div>

            <form onSubmit={handleCrearSolicitud} className="modal-form-crud">
              <label>Tipo de Permiso:</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              >
                <option value="VACACIONES">🏖️ Vacaciones anuales</option>
                <option value="ASUNTOS_PROPIOS">🏠 Asuntos propios / Convenio</option>
                <option value="BAJA">🏥 Baja Médica / Incapacidad Temporal</option>
                <option value="OTROS">📄 Otros permisos retribuidos</option>
              </select>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label>Fecha Inicio:</label>
                  <input
                    type="date"
                    value={formData.fechaInicio}
                    min={esPermisoRetroactivo ? undefined : hoyStr}
                    onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label>Fecha Fin:</label>
                  <input
                    type="date"
                    value={formData.fechaFin}
                    min={formData.fechaInicio || (esPermisoRetroactivo ? undefined : hoyStr)}
                    onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                    required
                  />
                </div>
              </div>

              {!esPermisoRetroactivo && (
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '-8px', marginBottom: '10px' }}>
                  ℹ️ Las vacaciones y asuntos propios deben planificarse con fecha igual o posterior a hoy.
                </div>
              )}

              <label>Motivo o comentarios (opcional):</label>
              <textarea
                rows="3"
                placeholder="Indica detalles si aplica (ej. Vacaciones de verano turno agosto)..."
                value={formData.comentariosOperario}
                onChange={(e) => setFormData({ ...formData, comentariosOperario: e.target.value })}
              />

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="boton-accion-secundario"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="boton-accion-primario"
                >
                  {enviando ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequestOperator;
