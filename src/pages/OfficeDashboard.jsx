import React, { useState, useEffect } from 'react';
import { 
  getJobs, 
  createJob, 
  updateJob, 
  deleteJob, 
  getCustomers, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer, 
  getOperators, 
  createOperator, 
  updateOperator, 
  deleteOperator,
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
  // Pestaña activa ('obras', 'clientes', 'operarios')
  const [pestañaActiva, setPestañaActiva] = useState('obras');

  // Estados principales de datos
  const [trabajos, setTrabajos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [operarios, setOperarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  // ----------------------------------------------------
  // ESTADOS PARA MODALES DE ALTA USABILIDAD (CRUD)
  // ----------------------------------------------------
  // Modal Obra (Creación / Edición)
  const [modalObra, setModalObra] = useState({ abierto: false, modo: 'crear', datos: null });
  const [formObra, setFormObra] = useState({
    id_trabajo: '',
    tipo_instalacion: 'Placas Solares',
    cliente: '',
    clienteFacturacion: '',
    clienteUbicacion: '',
    operarios: [],
    precio: '',
    estado: 'Pendiente',
    notas: ''
  });

  // Modal Cliente (Creación / Edición)
  const [modalCliente, setModalCliente] = useState({ abierto: false, modo: 'crear', datos: null });
  const [formCliente, setFormCliente] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    tipo_vivienda: 'Chalet'
  });

  // Modal Operario (Creación / Edición)
  const [modalOperario, setModalOperario] = useState({ abierto: false, modo: 'crear', datos: null });
  const [formOperario, setFormOperario] = useState({
    nombre: '',
    especialidad: 'Electricidad General',
    password: '',
    disponibilidad: true
  });

  // Subida de PDF y Partidas dentro del detalle de obra
  const [nuevoDoc, setNuevoDoc] = useState({ nombre: '', url: '', tipo: 'plano_electrico' });
  const [nuevaPartida, setNuevaPartida] = useState({ concepto: '', cantidad: 1, precioUnitario: 0 });

  useEffect(() => {
    cargarTodosLosDatos();
  }, []);

  const cargarTodosLosDatos = async () => {
    try {
      setCargando(true);
      const [resTrabajos, resClientes, resOperarios] = await Promise.all([
        getJobs(),
        getCustomers(),
        getOperators()
      ]);
      setTrabajos(resTrabajos.data || []);
      setClientes(resClientes.data || []);
      setOperarios(resOperarios.data || []);
      setCargando(false);
    } catch (err) {
      console.error("Error al cargar datos en panel Admin:", err);
      setError("No se pudieron cargar los datos del servidor.");
      setCargando(false);
    }
  };

  // =========================================================================
  // 📋 GESTIÓN DE OBRAS (JOBS)
  // =========================================================================
  const abrirModalCrearObra = () => {
    setFormObra({
      id_trabajo: '',
      tipo_instalacion: 'Placas Solares',
      cliente: clientes[0]?._id || '',
      clienteFacturacion: '',
      clienteUbicacion: '',
      operarios: [],
      precio: '',
      estado: 'Pendiente',
      notas: ''
    });
    setModalObra({ abierto: true, modo: 'crear', datos: null });
  };

  const abrirModalEditarObra = (trabajo) => {
    const idsOp = (trabajo.operarios || []).map(op => typeof op === 'object' ? op._id : op);
    setFormObra({
      id_trabajo: trabajo.id_trabajo,
      tipo_instalacion: trabajo.tipo_instalacion || 'Placas Solares',
      cliente: typeof trabajo.cliente === 'object' ? trabajo.cliente?._id : (trabajo.cliente || ''),
      clienteFacturacion: typeof trabajo.clienteFacturacion === 'object' ? trabajo.clienteFacturacion?._id : (trabajo.clienteFacturacion || ''),
      clienteUbicacion: typeof trabajo.clienteUbicacion === 'object' ? trabajo.clienteUbicacion?._id : (trabajo.clienteUbicacion || ''),
      operarios: idsOp,
      precio: trabajo.precio || 0,
      estado: trabajo.estado || 'Pendiente',
      notas: trabajo.notas || ''
    });
    setModalObra({ abierto: true, modo: 'editar', datos: trabajo });
  };

  const handleGuardarObra = async (e) => {
    e.preventDefault();
    try {
      if (modalObra.modo === 'crear') {
        const payload = { ...formObra, precio: Number(formObra.precio) || 0 };
        if (!payload.cliente) delete payload.cliente;
        if (!payload.clienteFacturacion) delete payload.clienteFacturacion;
        if (!payload.clienteUbicacion) delete payload.clienteUbicacion;

        const res = await createJob(payload);
        setTrabajos([res.data.job || res.data, ...trabajos]);
        alert("✅ Obra creada con éxito.");
      } else {
        const res = await updateJob(modalObra.datos._id, {
          ...formObra,
          precio: Number(formObra.precio) || 0
        });
        setTrabajos(trabajos.map(j => j._id === modalObra.datos._id ? res.data : j));
        alert("✅ Obra actualizada con éxito.");
      }
      setModalObra({ abierto: false, modo: 'crear', datos: null });
      cargarTodosLosDatos();
    } catch (err) {
      alert("❌ Error al guardar la obra.");
    }
  };

  const handleEliminarObra = async (id, idTrabajo) => {
    if (!window.confirm(`⚠️ ¿Estás seguro de eliminar la Obra #${idTrabajo}? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteJob(id);
      setTrabajos(trabajos.filter(j => j._id !== id));
      if (modalObra.datos?._id === id) setModalObra({ abierto: false, modo: 'crear', datos: null });
      alert("🗑️ Obra eliminada correctamente.");
    } catch (err) {
      alert("❌ Error al eliminar la obra.");
    }
  };

  const handleCambiarEstadoKanban = async (jobId, nuevoEstado) => {
    try {
      await updateJob(jobId, { estado: nuevoEstado });
      setTrabajos(prev => prev.map(j => j._id === jobId ? { ...j, estado: nuevoEstado } : j));
    } catch (err) {
      alert("Error al mover el estado de la obra.");
    }
  };

  // Adjuntar PDF en modal de obra
  const handleSubirDocumento = async (e) => {
    e.preventDefault();
    if (!nuevoDoc.nombre || !nuevoDoc.url || !modalObra.datos) return;
    try {
      const res = await addJobDocument(modalObra.datos._id, nuevoDoc);
      setTrabajos(trabajos.map(j => j._id === modalObra.datos._id ? res.data : j));
      setModalObra({ ...modalObra, datos: res.data });
      setNuevoDoc({ nombre: '', url: '', tipo: 'plano_electrico' });
      alert("📄 Documento PDF adjuntado correctamente.");
    } catch (err) {
      alert("Error al adjuntar documento.");
    }
  };

  // Añadir partida viva en modal de obra
  const handleAgregarPartida = async (e) => {
    e.preventDefault();
    if (!nuevaPartida.concepto || !modalObra.datos) return;
    const total = (Number(nuevaPartida.cantidad) || 1) * (Number(nuevaPartida.precioUnitario) || 0);
    try {
      const res = await addJobPartida(modalObra.datos._id, { ...nuevaPartida, total });
      setTrabajos(trabajos.map(j => j._id === modalObra.datos._id ? res.data : j));
      setModalObra({ ...modalObra, datos: res.data });
      setNuevaPartida({ concepto: '', cantidad: 1, precioUnitario: 0 });
    } catch (err) {
      alert("Error al añadir partida.");
    }
  };

  // =========================================================================
  // 👥 GESTIÓN DE CLIENTES (CUSTOMERS)
  // =========================================================================
  const abrirModalCrearCliente = () => {
    setFormCliente({ nombre: '', telefono: '', email: '', direccion: '', tipo_vivienda: 'Chalet' });
    setModalCliente({ abierto: true, modo: 'crear', datos: null });
  };

  const abrirModalEditarCliente = (cliente) => {
    setFormCliente({
      nombre: cliente.nombre || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
      tipo_vivienda: cliente.tipo_vivienda || 'Chalet'
    });
    setModalCliente({ abierto: true, modo: 'editar', datos: cliente });
  };

  const handleGuardarCliente = async (e) => {
    e.preventDefault();
    try {
      if (modalCliente.modo === 'crear') {
        const res = await createCustomer(formCliente);
        setClientes([...clientes, res.data]);
        alert("✅ Cliente registrado con éxito.");
      } else {
        const res = await updateCustomer(modalCliente.datos._id, formCliente);
        setClientes(clientes.map(c => c._id === modalCliente.datos._id ? res.data : c));
        alert("✅ Cliente actualizado con éxito.");
      }
      setModalCliente({ abierto: false, modo: 'crear', datos: null });
    } catch (err) {
      alert("❌ Error al guardar cliente.");
    }
  };

  const handleEliminarCliente = async (id, nombre) => {
    if (!window.confirm(`⚠️ ¿Deseas dar de baja/borrar al cliente "${nombre}"?`)) return;
    try {
      await deleteCustomer(id);
      setClientes(clientes.filter(c => c._id !== id));
      alert("🗑️ Cliente eliminado correctamente.");
    } catch (err) {
      alert("❌ Error al eliminar cliente.");
    }
  };

  // =========================================================================
  // 👷 GESTIÓN DE OPERARIOS (OPERATORS)
  // =========================================================================
  const abrirModalCrearOperario = () => {
    setFormOperario({ nombre: '', especialidad: 'Electricidad General', password: '1234', disponibilidad: true });
    setModalOperario({ abierto: true, modo: 'crear', datos: null });
  };

  const abrirModalEditarOperario = (op) => {
    setFormOperario({
      nombre: op.nombre || '',
      especialidad: op.especialidad || 'Electricidad General',
      password: '',
      disponibilidad: op.disponibilidad !== undefined ? op.disponibilidad : true
    });
    setModalOperario({ abierto: true, modo: 'editar', datos: op });
  };

  const handleGuardarOperario = async (e) => {
    e.preventDefault();
    try {
      if (modalOperario.modo === 'crear') {
        const res = await createOperator(formOperario);
        setOperarios([...operarios, res.data.operator || res.data]);
        alert("✅ Operario y clave de acceso creados correctamente.");
      } else {
        const res = await updateOperator(modalOperario.datos._id, formOperario);
        setOperarios(operarios.map(o => o._id === modalOperario.datos._id ? res.data : o));
        alert("✅ Datos del operario actualizados correctamente.");
      }
      setModalOperario({ abierto: false, modo: 'crear', datos: null });
    } catch (err) {
      alert("❌ Error al guardar operario.");
    }
  };

  const handleEliminarOperario = async (id, nombre) => {
    if (!window.confirm(`⚠️ ¿Estás seguro de eliminar al trabajador "${nombre}" y revocar sus credenciales?`)) return;
    try {
      await deleteOperator(id);
      setOperarios(operarios.filter(o => o._id !== id));
      alert("🗑️ Operario dado de baja con éxito.");
    } catch (err) {
      alert("❌ Error al eliminar operario.");
    }
  };

  // =========================================================================
  // FILTROS DE BÚSQUEDA
  // =========================================================================
  const term = busqueda.toLowerCase();
  const trabajosFiltrados = trabajos.filter(t => 
    t.cliente?.nombre?.toLowerCase().includes(term) ||
    t.tipo_instalacion?.toLowerCase().includes(term) ||
    String(t.id_trabajo).includes(term)
  );

  const clientesFiltrados = clientes.filter(c =>
    c.nombre?.toLowerCase().includes(term) ||
    c.telefono?.includes(term) ||
    c.direccion?.toLowerCase().includes(term)
  );

  const operariosFiltrados = operarios.filter(o =>
    o.nombre?.toLowerCase().includes(term) ||
    o.especialidad?.toLowerCase().includes(term)
  );

  const todasAlertasMaterial = trabajos.flatMap(t => 
    (t.alertasMaterial || []).filter(a => !a.atendida).map(a => ({ ...a, jobId: t._id, idTrabajo: t.id_trabajo }))
  );

  if (cargando) return <div style={{ padding: '24px', fontSize: '18px', fontWeight: 'bold' }}>⏳ Cargando datos de APGgestor...</div>;
  if (error) return <div className="alerta-sistema error" style={{ margin: '20px' }}>❌ {error}</div>;

  return (
    <div className="vista-dashboard">
      
      {/* CABECERA PRINCIPAL Y PESTAÑAS DE ALTA USABILIDAD */}
      <div className="header-seccion-admin">
        <div>
          <h2 style={{ fontSize: '26px', color: '#0f172a' }}>🖥️ Panel de Administración APGgestor</h2>
          <p className="subtitulo-dashboard">Gestión dinámica total de Obras, Clientes B2B y Equipo de Operarios.</p>
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN SUPERIORES (GRANDES Y VISIBLES) */}
      <div className="pestanas-admin">
        <button 
          onClick={() => setPestañaActiva('obras')}
          className={`pestana-btn ${pestañaActiva === 'obras' ? 'activa' : ''}`}
        >
          📋 Tablero de Obras (Kanban)
        </button>

        <button 
          onClick={() => setPestañaActiva('clientes')}
          className={`pestana-btn ${pestañaActiva === 'clientes' ? 'activa' : ''}`}
        >
          👥 Directorio de Clientes ({clientes.length})
        </button>

        <button 
          onClick={() => setPestañaActiva('operarios')}
          className={`pestana-btn ${pestañaActiva === 'operarios' ? 'activa' : ''}`}
        >
          👷 Gestión del Equipo ({operarios.length})
        </button>
      </div>

      {/* BUSCADOR GENERAL */}
      <div className="contenedor-buscador">
        <input
          type="text"
          placeholder="🔍 Buscar..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-buscador"
          style={{ fontSize: '16px', padding: '14px' }}
        />
      </div>

      {/* =====================================================================
          SECCIÓN 1: TABLERO DE OBRAS (KANBAN)
          ===================================================================== */}
      {pestañaActiva === 'obras' && (
        <div>
          <div className="header-seccion-admin">
            <h3 style={{ fontSize: '20px', color: '#1e293b' }}>Cuadrante de Instalaciones en Tiempo Real</h3>
            <button onClick={abrirModalCrearObra} className="btn-crear-destacado">
              ➕ Añadir Nueva Obra
            </button>
          </div>

          {/* Alertas de Material pendientes */}
          {todasAlertasMaterial.length > 0 && (
            <div className="panel-alertas-material">
              <div className="panel-alertas-header">
                🚨 PETICIONES DE MATERIAL DESDE OBRAS ({todasAlertasMaterial.length})
              </div>
              <div className="lista-alertas-grid">
                {todasAlertasMaterial.map((alerta, i) => (
                  <div key={alerta._id || i} className="tarjeta-alerta-item">
                    <strong>Obra #{alerta.idTrabajo}</strong>
                    <div className="tarjeta-alerta-texto">📦 "{alerta.texto}"</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* KANBAN */}
          <div className="tablero-kanban">
            {KANBAN_COLUMNS.map(col => {
              const obrasCol = trabajosFiltrados.filter(t => {
                const est = (t.estado || 'Pendiente').toLowerCase();
                if (col.id === 'En proceso') return est === 'en proceso' || est === 'en curso';
                if (col.id === 'Finalizado') return est === 'finalizado' || est === 'completado';
                return (t.estado || 'Pendiente') === col.id;
              });

              return (
                <div key={col.id} className="columna-kanban">
                  <div className="columna-header">
                    <span className="columna-titulo">{col.title}</span>
                    <span className="columna-contador">{obrasCol.length}</span>
                  </div>

                  {obrasCol.map(trabajo => (
                    <div key={trabajo._id} className="tarjeta-obra-hibrida">
                      <div className="tarjeta-obra-header">
                        <span className="id-obra">#{trabajo.id_trabajo}</span>
                        <span className={`status-badge ${trabajo.estado?.toLowerCase().replace(/\s+/g, '-')}`}>
                          {trabajo.estado}
                        </span>
                      </div>

                      <div className="tarjeta-obra-body">
                        <h4>{trabajo.tipo_instalacion}</h4>
                        <p><strong>👤 Cliente:</strong> {trabajo.cliente?.nombre || trabajo.clienteFacturacion?.nombre || 'Sin cliente'}</p>
                        <p><strong>📍 Dirección:</strong> {trabajo.clienteUbicacion?.nombre || trabajo.cliente?.direccion || '---'}</p>
                        <p className="precio-obra">💰 {trabajo.precio} €</p>

                        <div className="campo-selector-estado">
                          <label className="label-pequena">Mover estado:</label>
                          <select
                            value={trabajo.estado || 'Pendiente'}
                            onChange={(e) => handleCambiarEstadoKanban(trabajo._id, e.target.value)}
                            className="select-estado"
                          >
                            <option value="Pendiente">⏳ Pendiente</option>
                            <option value="En proceso">⚡ En Curso</option>
                            <option value="Esperando Material">📦 Esperando Material</option>
                            <option value="Finalizado">✅ Finalizado</option>
                          </select>
                        </div>
                      </div>

                      {/* ACCIONES DE OBRA (EDITAR Y ELIMINAR) */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                        <button onClick={() => abrirModalEditarObra(trabajo)} className="btn-accion-mini btn-editar" style={{ flex: 1 }}>
                          ✏️ Editar / Detalle
                        </button>
                        <button onClick={() => handleEliminarObra(trabajo._id, trabajo.id_trabajo)} className="btn-accion-mini btn-eliminar">
                          🗑️
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          SECCIÓN 2: DIRECTORIO DE CLIENTES
          ===================================================================== */}
      {pestañaActiva === 'clientes' && (
        <div>
          <div className="header-seccion-admin">
            <h3 style={{ fontSize: '20px', color: '#1e293b' }}>Directorio de Clientes B2B y Particulares</h3>
            <button onClick={abrirModalCrearCliente} className="btn-crear-destacado">
              ➕ Registrar Nuevo Cliente
            </button>
          </div>

          <div className="contenedor-tabla-clientes">
            <table className="tabla-clientes">
              <thead>
                <tr>
                  <th>#ID</th>
                  <th>Nombre / Razón Social</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Dirección</th>
                  <th>Tipo Vivienda/Propiedad</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                      No hay clientes registrados que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  clientesFiltrados.map(cliente => (
                    <tr key={cliente._id}>
                      <td><strong>#{cliente.id_cliente}</strong></td>
                      <td style={{ fontWeight: 'bold' }}>{cliente.nombre}</td>
                      <td>{cliente.telefono}</td>
                      <td>{cliente.email || '---'}</td>
                      <td>{cliente.direccion}</td>
                      <td><span className="badge-propiedad">{cliente.tipo_vivienda}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => abrirModalEditarCliente(cliente)} className="btn-accion-mini btn-editar">
                            ✏️ Editar
                          </button>
                          <button onClick={() => handleEliminarCliente(cliente._id, cliente.nombre)} className="btn-accion-mini btn-eliminar">
                            🗑️ Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          SECCIÓN 3: GESTIÓN DE EQUIPO (OPERARIOS)
          ===================================================================== */}
      {pestañaActiva === 'operarios' && (
        <div>
          <div className="header-seccion-admin">
            <h3 style={{ fontSize: '20px', color: '#1e293b' }}>Cuadrante del Equipo de Trabajadores</h3>
            <button onClick={abrirModalCrearOperario} className="btn-crear-destacado">
              ➕ Dar de Alta Nuevo Operario
            </button>
          </div>

          <div className="grid-operarios">
            {operariosFiltrados.length === 0 ? (
              <p className="mensaje-vacio">No hay operarios registrados.</p>
            ) : (
              operariosFiltrados.map(op => (
                <div key={op._id} className="tarjeta-operario">
                  <div>
                    <div className="tarjeta-operario-header">
                      <span className="id-obra">Operario #{op.id_operario}</span>
                      <span className={op.disponibilidad ? 'badge-disponible' : 'badge-ocupado'}>
                        {op.disponibilidad ? '🟢 Disponible' : '🟡 En Obra'}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '18px', margin: '10px 0 4px 0', color: '#0f172a' }}>{op.nombre}</h3>
                    <p style={{ fontSize: '14px', color: '#3b82f6', fontWeight: 'bold' }}>⚡ {op.especialidad}</p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button onClick={() => abrirModalEditarOperario(op)} className="btn-accion-mini btn-editar" style={{ flex: 1 }}>
                      ✏️ Editar Datos / Clave
                    </button>
                    <button onClick={() => handleEliminarOperario(op._id, op.nombre)} className="btn-accion-mini btn-eliminar">
                      🗑️ Dar de Baja
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 1: FORMULARIO OBRA (CREAR / EDITAR)
          ===================================================================== */}
      {modalObra.abierto && (
        <div className="modal-overlay" onClick={() => setModalObra({ abierto: false, modo: 'crear', datos: null })}>
          <div className="modal-contenido modal-form-crud" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalObra.modo === 'crear' ? '➕ Registrar Nueva Obra' : `✏️ Editar Obra #${formObra.id_trabajo}`}</h3>
              <button onClick={() => setModalObra({ abierto: false, modo: 'crear', datos: null })} className="boton-cerrar-modal">✖</button>
            </div>

            <form onSubmit={handleGuardarObra}>
              <label>Tipo de Instalación:</label>
              <select 
                value={formObra.tipo_instalacion} 
                onChange={(e) => setFormObra({ ...formObra, tipo_instalacion: e.target.value })}
              >
                <option value="Placas Solares">☀️ Placas Solares</option>
                <option value="Cargador Coche">🚗 Cargador Coche</option>
                <option value="Avería">🚨 Avería</option>
                <option value="Electricidad General">⚡ Electricidad General</option>
                <option value="Domótica">🏠 Domótica</option>
              </select>

              <label>Cliente General / Principal:</label>
              <select 
                value={formObra.cliente} 
                onChange={(e) => setFormObra({ ...formObra, cliente: e.target.value })}
              >
                <option value="">-- Seleccionar Cliente --</option>
                {clientes.map(c => (
                  <option key={c._id} value={c._id}>{c.nombre} ({c.direccion})</option>
                ))}
              </select>

              <label>Precio Base / Presupuesto (€):</label>
              <input 
                type="number" 
                value={formObra.precio} 
                onChange={(e) => setFormObra({ ...formObra, precio: e.target.value })}
                placeholder="Ej: 4500" 
                required 
              />

              <label>Estado de la Obra:</label>
              <select 
                value={formObra.estado} 
                onChange={(e) => setFormObra({ ...formObra, estado: e.target.value })}
              >
                <option value="Pendiente">⏳ Pendiente</option>
                <option value="En proceso">⚡ En proceso</option>
                <option value="Esperando Material">📦 Esperando Material</option>
                <option value="Finalizado">✅ Finalizado</option>
              </select>

              <label>Notas Internas de Obra:</label>
              <textarea 
                rows="3"
                value={formObra.notas} 
                onChange={(e) => setFormObra({ ...formObra, notas: e.target.value })}
                placeholder="Indicaciones para los operarios..."
              />

              <button type="submit" className="btn-crear-destacado" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                💾 Guardar Obra
              </button>
            </form>

            {/* SECCIÓN ADICIONAL EN EDICIÓN: Subida de PDFs y Partidas Extras */}
            {modalObra.modo === 'editar' && modalObra.datos && (
              <div style={{ marginTop: '20px', borderTop: '2px solid #e2e8f0', paddingTop: '16px' }}>
                <h4 style={{ color: '#0f172a', marginBottom: '8px' }}>📄 Subir Documento PDF Etiquetado</h4>
                <form onSubmit={handleSubirDocumento} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Nombre del documento (ej: Plano Eléctrico)" 
                    value={nuevoDoc.nombre} 
                    onChange={(e) => setNuevoDoc({ ...nuevoDoc, nombre: e.target.value })}
                  />
                  <input 
                    type="text" 
                    placeholder="URL del PDF" 
                    value={nuevoDoc.url} 
                    onChange={(e) => setNuevoDoc({ ...nuevoDoc, url: e.target.value })}
                  />
                  <select 
                    value={nuevoDoc.tipo} 
                    onChange={(e) => setNuevoDoc({ ...nuevoDoc, tipo: e.target.value })}
                  >
                    <option value="plano_electrico">📐 Plano Eléctrico (Visible para operarios)</option>
                    <option value="presupuesto">💰 Presupuesto (Sólo Admin)</option>
                    <option value="otros">📁 Otros Documentos (Sólo Admin)</option>
                  </select>
                  <button type="submit" className="btn-accion-mini btn-editar" style={{ padding: '10px' }}>
                    📤 Adjuntar PDF
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: FORMULARIO CLIENTE (CREAR / EDITAR)
          ===================================================================== */}
      {modalCliente.abierto && (
        <div className="modal-overlay" onClick={() => setModalCliente({ abierto: false, modo: 'crear', datos: null })}>
          <div className="modal-contenido modal-form-crud" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>{modalCliente.modo === 'crear' ? '➕ Añadir Nuevo Cliente' : `✏️ Editar Cliente`}</h3>
              <button onClick={() => setModalCliente({ abierto: false, modo: 'crear', datos: null })} className="boton-cerrar-modal">✖</button>
            </div>

            <form onSubmit={handleGuardarCliente}>
              <label>Nombre o Razón Social:</label>
              <input 
                type="text" 
                value={formCliente.nombre} 
                onChange={(e) => setFormCliente({ ...formCliente, nombre: e.target.value })}
                placeholder="Ej: Coarsa S.L. o Juan Pérez" 
                required 
              />

              <label>Teléfono de Contacto:</label>
              <input 
                type="text" 
                value={formCliente.telefono} 
                onChange={(e) => setFormCliente({ ...formCliente, telefono: e.target.value })}
                placeholder="Ej: 611222333" 
                required 
              />

              <label>Correo Electrónico (Email):</label>
              <input 
                type="email" 
                value={formCliente.email} 
                onChange={(e) => setFormCliente({ ...formCliente, email: e.target.value })}
                placeholder="ejemplo@email.com" 
              />

              <label>Dirección Completa:</label>
              <input 
                type="text" 
                value={formCliente.direccion} 
                onChange={(e) => setFormCliente({ ...formCliente, direccion: e.target.value })}
                placeholder="Ej: Av. de la Ilustración 14, Madrid" 
                required 
              />

              <label>Tipo de Vivienda / Instalación:</label>
              <select 
                value={formCliente.tipo_vivienda} 
                onChange={(e) => setFormCliente({ ...formCliente, tipo_vivienda: e.target.value })}
              >
                <option value="Chalet">🏡 Chalet</option>
                <option value="Piso">🏢 Piso</option>
                <option value="Industrial / Nave">🏭 Industrial / Nave</option>
                <option value="Oficina / Local">🏪 Oficina / Local</option>
              </select>

              <button type="submit" className="btn-crear-destacado" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                💾 Guardar Cliente
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: FORMULARIO OPERARIO (CREAR / EDITAR)
          ===================================================================== */}
      {modalOperario.abierto && (
        <div className="modal-overlay" onClick={() => setModalOperario({ abierto: false, modo: 'crear', datos: null })}>
          <div className="modal-contenido modal-form-crud" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>{modalOperario.modo === 'crear' ? '➕ Dar de Alta Nuevo Operario' : `✏️ Editar Datos de Operario`}</h3>
              <button onClick={() => setModalOperario({ abierto: false, modo: 'crear', datos: null })} className="boton-cerrar-modal">✖</button>
            </div>

            <form onSubmit={handleGuardarOperario}>
              <label>Nombre Completo del Trabajador:</label>
              <input 
                type="text" 
                value={formOperario.nombre} 
                onChange={(e) => setFormOperario({ ...formOperario, nombre: e.target.value })}
                placeholder="Ej: Carlos Gómez" 
                required 
              />

              <label>Especialidad Principal:</label>
              <select 
                value={formOperario.especialidad} 
                onChange={(e) => setFormOperario({ ...formOperario, especialidad: e.target.value })}
              >
                <option value="Electricidad General">⚡ Electricidad General</option>
                <option value="Solar">☀️ Placas Solares</option>
                <option value="Cargadores">🚗 Cargadores de Coche</option>
                <option value="Domótica">🏠 Domótica</option>
                <option value="Averías">🚨 Reparación de Averías</option>
              </select>

              <label>Contraseña de Acceso (App Móvil):</label>
              <input 
                type="text" 
                value={formOperario.password} 
                onChange={(e) => setFormOperario({ ...formOperario, password: e.target.value })}
                placeholder={modalOperario.modo === 'crear' ? 'Ej: 1234' : 'Dejar en blanco para no modificar'} 
                required={modalOperario.modo === 'crear'}
              />

              <label>Estado de Disponibilidad:</label>
              <select 
                value={formOperario.disponibilidad ? 'true' : 'false'} 
                onChange={(e) => setFormOperario({ ...formOperario, disponibilidad: e.target.value === 'true' })}
              >
                <option value="true">🟢 Disponible para nuevas obras</option>
                <option value="false">🟡 Asignado / En Obra</option>
              </select>

              <button type="submit" className="btn-crear-destacado" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                💾 Guardar Operario
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default OfficeDashboard;
