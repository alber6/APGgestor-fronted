import React, { useState, useEffect } from 'react';
import { 
  getJobs, 
  getOperators, 
  updateJob, 
  addJobDocument, 
  addJobPartida 
} from '../services/api';

const KANBAN_COLUMNS = [
  { id: 'Pendiente', title: '⏳ Pendiente', color: '#fef3c7' },
  { id: 'En proceso', title: '⚡ En Curso', color: '#dbeafe' },
  { id: 'Esperando Material', title: '📦 Esperando Material', color: '#fef9c3' },
  { id: 'Finalizado', title: '✅ Finalizado', color: '#d1fae5' }
];

const OfficeDashboard = () => {
  const [trabajos, setTrabajos] = useState([]);
  const [operariosDisponibles, setOperariosDisponibles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState(null);

  // Estado para el modal de detalle / edicion de obra
  const [obraSeleccionada, setObraSeleccionada] = useState(null);
  const [operariosAsignados, setOperariosAsignados] = useState([]);
  
  // Estado para subida de PDF
  const [nuevoDoc, setNuevoDoc] = useState({ nombre: '', url: '', tipo: 'plano_electrico' });
  const [mensajeDoc, setMensajeDoc] = useState('');

  // Estado para nuevas partidas de presupuesto
  const [nuevaPartida, setNuevaPartida] = useState({ concepto: '', cantidad: 1, precioUnitario: 0 });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [resTrabajos, resOperarios] = await Promise.all([
        getJobs(),
        getOperators()
      ]);
      setTrabajos(resTrabajos.data || []);
      setOperariosDisponibles(resOperarios.data || []);
      setCargando(false);
    } catch (err) {
      console.error("Error cargando dashboard oficina:", err);
      setError("No se pudieron cargar las órdenes de trabajo.");
      setCargando(false);
    }
  };

  // Cambio directo de estado desde la columna Kanban
  const handleCambiarEstado = async (jobId, nuevoEstado) => {
    try {
      await updateJob(jobId, { estado: nuevoEstado });
      setTrabajos(prev => prev.map(j => j._id === jobId ? { ...j, estado: nuevoEstado } : j));
    } catch (err) {
      alert("Error al actualizar el estado de la obra.");
    }
  };

  // Marcar una alerta de material como atendida
  const handleAtenderAlerta = async (jobId, alertaId) => {
    try {
      const trabajo = trabajos.find(t => t._id === jobId);
      if (!trabajo) return;
      
      const alertasActualizadas = trabajo.alertasMaterial.map(a => 
        (a._id === alertaId || a.texto === alertaId) ? { ...a, atendida: true } : a
      );

      await updateJob(jobId, { alertasMaterial: alertasActualizadas });
      setTrabajos(prev => prev.map(t => t._id === jobId ? { ...t, alertasMaterial: alertasActualizadas } : t));
    } catch (err) {
      alert("Error al marcar alerta como atendida.");
    }
  };

  // Abrir modal de detalle/edición de obra
  const abrirModalObra = (trabajo) => {
    setObraSeleccionada(trabajo);
    // Extraer IDs de operarios asignados
    const ids = (trabajo.operarios || []).map(op => typeof op === 'object' ? op._id : op);
    if (trabajo.operario && !ids.includes(typeof trabajo.operario === 'object' ? trabajo.operario._id : trabajo.operario)) {
      ids.push(typeof trabajo.operario === 'object' ? trabajo.operario._id : trabajo.operario);
    }
    setOperariosAsignados(ids);
    setNuevoDoc({ nombre: '', url: '', tipo: 'plano_electrico' });
    setMensajeDoc('');
  };

  // Alternar operario en la lista de asignación
  const toggleOperario = (opId) => {
    if (operariosAsignados.includes(opId)) {
      setOperariosAsignados(operariosAsignados.filter(id => id !== opId));
    } else {
      setOperariosAsignados([...operariosAsignados, opId]);
    }
  };

  // Guardar asignación de múltiples operarios
  const handleGuardarOperarios = async () => {
    if (!obraSeleccionada) return;
    try {
      const res = await updateJob(obraSeleccionada._id, { operarios: operariosAsignados });
      setTrabajos(prev => prev.map(j => j._id === obraSeleccionada._id ? res.data : j));
      setObraSeleccionada(res.data);
      alert("✅ Operarios actualizados correctamente.");
    } catch (err) {
      alert("Error al actualizar operarios.");
    }
  };

  // Subir / Adjuntar un documento PDF etiquetado
  const handleSubirDocumento = async (e) => {
    e.preventDefault();
    if (!nuevoDoc.nombre || !nuevoDoc.url) {
      setMensajeDoc("⚠️ Completa el nombre y la URL del documento PDF.");
      return;
    }

    try {
      const res = await addJobDocument(obraSeleccionada._id, nuevoDoc);
      setTrabajos(prev => prev.map(j => j._id === obraSeleccionada._id ? res.data : j));
      setObraSeleccionada(res.data);
      setNuevoDoc({ nombre: '', url: '', tipo: 'plano_electrico' });
      setMensajeDoc("✅ Documento subido y etiquetado con éxito.");
    } catch (err) {
      setMensajeDoc("❌ Error al adjuntar el documento.");
    }
  };

  // Añadir partida extra al presupuesto vivo
  const handleAgregarPartida = async (e) => {
    e.preventDefault();
    if (!nuevaPartida.concepto) return;
    const totalPartida = (Number(nuevaPartida.cantidad) || 1) * (Number(nuevaPartida.precioUnitario) || 0);

    try {
      const res = await addJobPartida(obraSeleccionada._id, {
        concepto: nuevaPartida.concepto,
        cantidad: Number(nuevaPartida.cantidad),
        precioUnitario: Number(nuevaPartida.precioUnitario),
        total: totalPartida
      });
      setTrabajos(prev => prev.map(j => j._id === obraSeleccionada._id ? res.data : j));
      setObraSeleccionada(res.data);
      setNuevaPartida({ concepto: '', cantidad: 1, precioUnitario: 0 });
    } catch (err) {
      alert("Error al añadir la partida de presupuesto.");
    }
  };

  // Filtrado multitarea
  const trabajosFiltrados = trabajos.filter((t) => {
    const term = busqueda.toLowerCase();
    const coincideCliente = t.cliente?.nombre?.toLowerCase().includes(term) ||
                            t.clienteFacturacion?.nombre?.toLowerCase().includes(term) ||
                            t.clienteUbicacion?.nombre?.toLowerCase().includes(term);
    const coincideInstalacion = t.tipo_instalacion?.toLowerCase().includes(term);
    const coincideId = String(t.id_trabajo).includes(term);
    return coincideCliente || coincideInstalacion || coincideId;
  });

  // Extraer todas las alertas de material pendientes de los operarios
  const todasAlertasMaterial = trabajos.flatMap(t => 
    (t.alertasMaterial || [])
      .filter(a => !a.atendida)
      .map(a => ({ ...a, jobId: t._id, idTrabajo: t.id_trabajo, tipoInstalacion: t.tipo_instalacion }))
  );

  if (cargando) return <div style={{ padding: '20px' }}>⏳ Cargando el Tablero Kanban y alertas de APGgestor...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red', fontWeight: 'bold' }}>❌ {error}</div>;

  return (
    <div className="vista-dashboard">
      <h2>🖥️ Control de la Oficina (Tablero Kanban)</h2>
      <p className="subtitulo-dashboard">Monitoreo y gestión en tiempo real de instalaciones eléctricas.</p>
      
      {/* 1. INTERFAZ DE ALERTAS DESTACADA (Peticiones de Material) */}
      {todasAlertasMaterial.length > 0 && (
        <div className="panel-alertas-material">
          <div className="panel-alertas-header">
            <span>🚨 NOTIFICACIONES DE MATERIALES PENDIENTES ({todasAlertasMaterial.length})</span>
          </div>
          <div className="lista-alertas-grid">
            {todasAlertasMaterial.map((alerta, idx) => (
              <div key={alerta._id || idx} className="tarjeta-alerta-item">
                <div>
                  <strong>Obra #{alerta.idTrabajo} ({alerta.tipoInstalacion})</strong>
                  <div className="tarjeta-alerta-texto">📦 "{alerta.texto}"</div>
                </div>
                <button 
                  onClick={() => handleAtenderAlerta(alerta.jobId, alerta._id || alerta.texto)}
                  className="boton-formulario"
                  style={{ margin: 0, padding: '6px 12px', fontSize: '12px', background: '#f59e0b' }}
                >
                  ✓ Marcar Atendida
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BUSCADOR */}
      <div className="contenedor-buscador">
        <input
          type="text"
          placeholder="🔍 Buscar obras por cliente B2B, tipo de instalación o #ID..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-buscador"
        />
      </div>

      {/* 2. TABLERO KANBAN VISUAL (4 Columnas) */}
      <div className="tablero-kanban">
        {KANBAN_COLUMNS.map(col => {
          // Filtrar las obras pertenecientes a esta columna
          const obrasColumna = trabajosFiltrados.filter(t => {
            const estadoNormalizado = (t.estado || 'Pendiente').toLowerCase();
            if (col.id === 'En proceso') {
              return estadoNormalizado === 'en proceso' || estadoNormalizado === 'en curso';
            }
            if (col.id === 'Finalizado') {
              return estadoNormalizado === 'finalizado' || estadoNormalizado === 'completado';
            }
            return (t.estado || 'Pendiente') === col.id;
          });

          return (
            <div key={col.id} className="columna-kanban">
              <div className="columna-header">
                <span className="columna-titulo">{col.title}</span>
                <span className="columna-contador">{obrasColumna.length}</span>
              </div>

              {obrasColumna.length === 0 ? (
                <p className="mensaje-vacio" style={{ fontSize: '13px' }}>Sin obras en este estado</p>
              ) : (
                obrasColumna.map(trabajo => {
                  const numAlertas = (trabajo.alertasMaterial || []).filter(a => !a.atendida).length;
                  
                  return (
                    <div 
                      key={trabajo._id} 
                      className="tarjeta-obra-hibrida"
                      onClick={() => abrirModalObra(trabajo)}
                    >
                      <div className="tarjeta-obra-header">
                        <span className="id-obra">#{trabajo.id_trabajo}</span>
                        {numAlertas > 0 && (
                          <span className="status-badge esperando-material">
                            🚨 {numAlertas} Alerta(s)
                          </span>
                        )}
                      </div>

                      <div className="tarjeta-obra-body">
                        <h4>{trabajo.tipo_instalacion}</h4>
                        
                        {/* Clientes B2B */}
                        {trabajo.clienteFacturacion ? (
                          <>
                            <p><strong>💳 Factura:</strong> {trabajo.clienteFacturacion.nombre || 'Coarsa'}</p>
                            <p><strong>📍 Ubicación:</strong> {trabajo.clienteUbicacion?.nombre || trabajo.cliente?.direccion || 'Ayuntamiento'}</p>
                          </>
                        ) : (
                          <p><strong>👤 Cliente:</strong> {trabajo.cliente?.nombre || 'Sin cliente'}</p>
                        )}

                        {/* Operarios Asignados */}
                        <div style={{ margin: '6px 0' }}>
                          <strong>👷 Operarios: </strong>
                          {trabajo.operarios && trabajo.operarios.length > 0 ? (
                            trabajo.operarios.map(op => (
                              <span key={op._id || op} className="operario-chip">
                                {typeof op === 'object' ? op.nombre : 'Operario'}
                              </span>
                            ))
                          ) : (
                            <span>{trabajo.operario?.nombre || 'Sin asignar'}</span>
                          )}
                        </div>

                        <p className="precio-obra">💰 Base: {trabajo.precio} €</p>

                        {/* Selector para cambiar estado rápido en Kanban */}
                        <div className="campo-selector-estado" onClick={(e) => e.stopPropagation()}>
                          <label className="label-pequena">Mover a estado:</label>
                          <select
                            value={trabajo.estado || 'Pendiente'}
                            onChange={(e) => handleCambiarEstado(trabajo._id, e.target.value)}
                            className="select-estado"
                          >
                            <option value="Pendiente">⏳ Pendiente</option>
                            <option value="En proceso">⚡ En Curso</option>
                            <option value="Esperando Material">📦 Esperando Material</option>
                            <option value="Finalizado">✅ Finalizado</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>

      {/* 3. MODAL DE DETALLE DE OBRA: Operarios Múltiples, Subida de PDFs y Presupuesto Vivo */}
      {obraSeleccionada && (
        <div className="modal-overlay" onClick={() => setObraSeleccionada(null)}>
          <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header">
              <h3>🔧 Detalle de Obra #{obraSeleccionada.id_trabajo} - {obraSeleccionada.tipo_instalacion}</h3>
              <button onClick={() => setObraSeleccionada(null)} className="boton-cerrar-modal">✖</button>
            </div>

            {/* A) Asignación de Operarios Múltiples */}
            <div className="campo-formulario" style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
              <label>👷 Asignar Operarios (Lista dinámica):</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '8px 0' }}>
                {operariosDisponibles.map(op => {
                  const seleccionado = operariosAsignados.includes(op._id);
                  return (
                    <button
                      key={op._id}
                      type="button"
                      onClick={() => toggleOperario(op._id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: '1px solid #3b82f6',
                        background: seleccionado ? '#3b82f6' : '#white',
                        color: seleccionado ? 'white' : '#1e293b',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '13px'
                      }}
                    >
                      {seleccionado ? '✓ ' : '+ '} {op.nombre} ({op.especialidad || 'Electricista'})
                    </button>
                  );
                })}
              </div>
              <button 
                onClick={handleGuardarOperarios} 
                className="boton-formulario"
                style={{ width: 'auto', padding: '8px 16px', fontSize: '13px' }}
              >
                💾 Guardar Asignación de Operarios
              </button>
            </div>

            {/* B) Subida y Gestión Documental (PDFs Etiquetados) */}
            <div className="campo-formulario" style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px', marginTop: '16px' }}>
              <label>📄 Subida de Archivos PDF (Gestión Documental):</label>
              
              {/* Documentos vigentes */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '8px 0' }}>
                {(obraSeleccionada.documentos || []).length === 0 ? (
                  <span style={{ fontSize: '13px', color: '#64748b' }}>No hay PDFs adjuntos.</span>
                ) : (
                  obraSeleccionada.documentos.map((doc, i) => (
                    <a 
                      key={i} 
                      href={doc.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={`tag-doc ${doc.tipo}`}
                    >
                      📄 {doc.nombre} ({doc.tipo.replace('_', ' ').toUpperCase()})
                    </a>
                  ))
                )}
              </div>

              {/* Formulario para añadir PDF */}
              <form onSubmit={handleSubirDocumento} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                <input 
                  type="text" 
                  placeholder="Nombre del documento (ej: Plano Planta 1)"
                  value={nuevoDoc.nombre}
                  onChange={(e) => setNuevoDoc({ ...nuevoDoc, nombre: e.target.value })}
                  style={{ padding: '8px' }}
                />
                <input 
                  type="text" 
                  placeholder="URL o enlace del PDF (ej: https://ejemplo.com/plano.pdf)"
                  value={nuevoDoc.url}
                  onChange={(e) => setNuevoDoc({ ...nuevoDoc, url: e.target.value })}
                  style={{ padding: '8px' }}
                />
                <select 
                  value={nuevoDoc.tipo}
                  onChange={(e) => setNuevoDoc({ ...nuevoDoc, tipo: e.target.value })}
                  style={{ padding: '8px' }}
                >
                  <option value="plano_electrico">📐 Plano Eléctrico (Visible para operarios)</option>
                  <option value="presupuesto">💰 Presupuesto (Sólo Admin)</option>
                  <option value="otros">📁 Otros Documentos (Sólo Admin)</option>
                </select>
                <button type="submit" className="boton-formulario" style={{ background: '#16a34a', width: 'auto', padding: '8px 16px', fontSize: '13px' }}>
                  📤 Adjuntar PDF Etiquetado
                </button>
                {mensajeDoc && <p style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>{mensajeDoc}</p>}
              </form>
            </div>

            {/* C) Presupuesto Vivo (Partidas Extras / Imprevistos) */}
            <div className="campo-formulario" style={{ background: '#fefce8', padding: '12px', borderRadius: '8px', marginTop: '16px' }}>
              <label>💰 Presupuesto Vivo (Base: {obraSeleccionada.precio} €):</label>
              
              <ul style={{ paddingLeft: '20px', fontSize: '13px', margin: '8px 0' }}>
                {(obraSeleccionada.partidasPresupuesto || []).map((partida, i) => (
                  <li key={i}>
                    <strong>{partida.concepto}</strong> - {partida.cantidad} x {partida.precioUnitario}€ = {partida.total || (partida.cantidad * partida.precioUnitario)}€
                  </li>
                ))}
              </ul>

              <form onSubmit={handleAgregarPartida} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  placeholder="Concepto (ej: Cableado extra)"
                  value={nuevaPartida.concepto}
                  onChange={(e) => setNuevaPartida({ ...nuevaPartida, concepto: e.target.value })}
                  style={{ flex: 2, padding: '6px' }}
                />
                <input 
                  type="number" 
                  placeholder="Cant."
                  value={nuevaPartida.cantidad}
                  onChange={(e) => setNuevaPartida({ ...nuevaPartida, cantidad: e.target.value })}
                  style={{ flex: 1, padding: '6px' }}
                />
                <input 
                  type="number" 
                  placeholder="Precio Unit."
                  value={nuevaPartida.precioUnitario}
                  onChange={(e) => setNuevaPartida({ ...nuevaPartida, precioUnitario: e.target.value })}
                  style={{ flex: 1, padding: '6px' }}
                />
                <button type="submit" className="boton-formulario" style={{ flex: 1, padding: '6px 12px', margin: 0, fontSize: '12px', background: '#ca8a04' }}>
                  + Partida Extra
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default OfficeDashboard;