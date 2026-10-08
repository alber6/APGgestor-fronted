import React, { useState, useEffect } from 'react';
import { 
  getJobs, 
  updateJob, 
  deleteJob, 
  getCustomers, 
  updateCustomer, 
  deleteCustomer, 
  getOperators, 
  createOperator, 
  updateOperator, 
  deleteOperator,
  addJobDocument,
  addJobPartida,
  generateJobDocs
} from '../services/api';
import CustomerForm from '../components/CustomerForm';
import CustomerDetails, { formatearDireccion } from '../components/CustomerDetails';

const KANBAN_COLUMNS = [
  { id: 'Pendiente', title: '⏳ Pendiente', color: '#fef3c7' },
  { id: 'En proceso', title: '⚡ En Curso', color: '#dbeafe' },
  { id: 'Esperando Material', title: '📦 Esperando Material', color: '#fef9c3' },
  { id: 'Finalizado', title: '✅ Finalizado', color: '#d1fae5' }
];

const TIPOS_VIA = [
  "CALLE", "ACCESO", "ACUEDUCTO", "AERODROMO", "AEROPUERTO", "ALAMEDA", "ALMACEN", 
  "ALTO", "APARTAMENTO", "ARROYO", "AUTOVIA", "AVENIDA", "BAJADA", "BARRANCO", 
  "BARRIADA", "BARRIO", "BASILICA", "BLOQUE", "BULEVAR", "CALLEJA", "CALLEJON", 
  "CAMINO", "CAMPAMENTO", "CANAL", "CANTON", "CAÑADA", "CARRERA", "CARRETERA", 
  "CARRIL", "CERRO", "COLONIA", "COSTANILLA", "CUESTA", "DEHESA", "FINCA", 
  "GLORIETA", "GRAN VIA", "PARAJE", "PARCELA", "PARQUE", "PASADIZO", "PASAJE", 
  "PASEO", "PLAZA", "PLAZUELA", "POBLADO", "POLIGONO", "RINCON", "RINCONADA", 
  "RONDA", "ROTONDA", "SECTOR", "SENDA", "TRASERA", "TRAVESIA", "URBANIZACION", "VEREDA"
];

const OfficeDashboard = () => {
  const [pestañaActiva, setPestañaActiva] = useState('obras');

  const [trabajos, setTrabajos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [operarios, setOperarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [descargandoDoc, setDescargandoDoc] = useState(null);

  // Modal Detalle / Edición Obra
  const [modalObra, setModalObra] = useState({ abierto: false, datos: null });
  const [formObra, setFormObra] = useState({
    id_trabajo: '',
    tipo_instalacion: 'Placas Solares',
    tipo_via_obra: 'CALLE',
    nombre_via_obra: '',
    numero_obra: '',
    bloque_obra: '',
    portal_obra: '',
    escalera_obra: '',
    piso_obra: '',
    puerta_obra: '',
    direccion_obra: '',
    localidad_obra: '',
    cp_obra: '',
    provincia_obra: '',
    cliente: '',
    operarios: [],
    precio: '',
    estado: 'Pendiente',
    notas: ''
  });

  // Modal Editar Cliente
  const [modalCliente, setModalCliente] = useState({ abierto: false, datos: null });
  const [formCliente, setFormCliente] = useState({
    nif: '',
    nombre: '',
    apellido1: '',
    apellido2: '',
    telefono: '',
    email: '',
    direccion_fiscal: '',
    localidad: '',
    provincia: '',
    cp: '',
    tipo_vivienda: 'Chalet',
    es_empresa: false,
    representante_nombre: '',
    representante_apellido1: '',
    representante_apellido2: '',
    representante_nif: '',
    rep_correo: '',
    rep_tipo_via: 'Calle',
    rep_nombre_via: '',
    rep_numero: '',
    rep_bloque: '',
    rep_portal: '',
    rep_escalera: '',
    rep_piso: '',
    rep_puerta: '',
    rep_localidad: '',
    rep_provincia: '',
    rep_cp: '',
    rep_tel_fijo: '',
    rep_tel_movil: ''
  });

  // Modal Operario (Creación / Edición)
  const [modalOperario, setModalOperario] = useState({ abierto: false, modo: 'crear', datos: null });
  const [formOperario, setFormOperario] = useState({
    nombre: '',
    password: '',
    rol: 'operario'
  });

  const [nuevoDoc, setNuevoDoc] = useState({ nombre: '', url: '', tipo: 'plano_electrico' });
  const [nuevaPartida, setNuevaPartida] = useState({ concepto: '', cantidad: 1, precioUnitario: 0 });

  useEffect(() => {
    cargarTodosLosDatos();
  }, [pestañaActiva]);

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
  // 📄 DESCARGA AUTOMÁTICA DE DOCUMENTACIÓN (DOCX)
  // =========================================================================
  const handleGenerarDocumentacion = async (jobId, idTrabajo) => {
    try {
      setDescargandoDoc(jobId);
      const response = await generateJobDocs(jobId);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Documentacion_Obra_${idTrabajo || jobId}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setDescargandoDoc(null);
    } catch (err) {
      console.error("Error al generar la documentación:", err);
      alert("❌ Error al generar y descargar la documentación de la obra.");
      setDescargandoDoc(null);
    }
  };

  // =========================================================================
  // 📋 GESTIÓN Y DETALLE DE OBRAS
  // =========================================================================
  const abrirModalEditarObra = (trabajo) => {
    const idsOp = (trabajo.operarios || []).map(op => typeof op === 'object' ? op._id : op);
    setFormObra({
      id_trabajo: trabajo.id_trabajo,
      tipo_instalacion: trabajo.tipo_instalacion || 'Placas Solares',
      tipo_via_obra: trabajo.tipo_via_obra || 'CALLE',
      nombre_via_obra: trabajo.nombre_via_obra || '',
      numero_obra: trabajo.numero_obra || '',
      bloque_obra: trabajo.bloque_obra || '',
      portal_obra: trabajo.portal_obra || '',
      escalera_obra: trabajo.escalera_obra || '',
      piso_obra: trabajo.piso_obra || '',
      puerta_obra: trabajo.puerta_obra || '',
      direccion_obra: trabajo.direccion_obra || '',
      localidad_obra: trabajo.localidad_obra || '',
      cp_obra: trabajo.cp_obra || '',
      provincia_obra: trabajo.provincia_obra || '',
      cliente: typeof trabajo.cliente === 'object' ? trabajo.cliente?._id : (trabajo.cliente || ''),
      operarios: idsOp,
      precio: trabajo.precio || 0,
      estado: trabajo.estado || 'Pendiente',
      notas: trabajo.notas || ''
    });
    setModalObra({ abierto: true, datos: trabajo });
  };

  const handleGuardarObra = async (e) => {
    e.preventDefault();
    try {
      const res = await updateJob(modalObra.datos._id, {
        ...formObra,
        precio: Number(formObra.precio) || 0
      });
      setTrabajos(trabajos.map(j => j._id === modalObra.datos._id ? res.data : j));
      alert("✅ Obra actualizada con éxito.");
      setModalObra({ abierto: false, datos: null });
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
      if (modalObra.datos?._id === id) setModalObra({ abierto: false, datos: null });
      alert("🗑️ Obra eliminada correctamente.");
    } catch (err) {
      alert("❌ Error al eliminar la obra.");
    }
  };

  const handleCambiarEstadoKanban = async (jobId, nuevoEstado) => {
    try {
      await updateJob(jobId, { estado: nuevoEstado });
      setTrabajos(prev => prev.map(j => j._id === jobId ? { ...j, estado: nuevoEstado } : j));
      const resClientes = await getCustomers();
      setClientes(resClientes.data || []);
    } catch (err) {
      alert("Error al mover el estado de la obra.");
    }
  };

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

  // =========================================================================
  // 👥 GESTIÓN DE CLIENTES
  // =========================================================================
  const abrirModalEditarCliente = (cliente) => {
    setFormCliente({
      id_cliente: cliente.id_cliente || '',
      nif: cliente.nif || '',
      nombre: cliente.nombre || '',
      nombre_referencia: cliente.nombre_referencia || '',
      apellido1: cliente.apellido1 || '',
      apellido2: cliente.apellido2 || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      tipo_via: cliente.tipo_via || 'CALLE',
      nombre_via: cliente.nombre_via || '',
      numero: cliente.numero || '',
      bloque: cliente.bloque || '',
      portal: cliente.portal || '',
      escalera: cliente.escalera || '',
      piso: cliente.piso || '',
      puerta: cliente.puerta || '',
      direccion_fiscal: cliente.direccion_fiscal || cliente.direccion || '',
      localidad: cliente.localidad || '',
      provincia: cliente.provincia || '',
      cp: cliente.cp || '',
      tipo_vivienda: cliente.tipo_vivienda || 'Piso',
      es_empresa: Boolean(cliente.es_empresa),
      representante_nombre: cliente.representante_nombre || '',
      representante_apellido1: cliente.representante_apellido1 || '',
      representante_apellido2: cliente.representante_apellido2 || '',
      representante_nif: cliente.representante_nif || '',
      rep_correo: cliente.rep_correo || '',
      rep_tipo_via: cliente.rep_tipo_via || 'CALLE',
      rep_nombre_via: cliente.rep_nombre_via || '',
      rep_numero: cliente.rep_numero || '',
      rep_bloque: cliente.rep_bloque || '',
      rep_portal: cliente.rep_portal || '',
      rep_escalera: cliente.rep_escalera || '',
      rep_piso: cliente.rep_piso || '',
      rep_puerta: cliente.rep_puerta || '',
      rep_localidad: cliente.rep_localidad || '',
      rep_provincia: cliente.rep_provincia || '',
      rep_cp: cliente.rep_cp || '',
      rep_tel_fijo: cliente.rep_tel_fijo || '',
      rep_tel_movil: cliente.rep_tel_movil || ''
    });
    setModalCliente({ abierto: true, datos: cliente });
  };

  const handleGuardarCliente = async (datosSubmit) => {
    const datosFinales = (datosSubmit && datosSubmit.nif) ? datosSubmit : formCliente;
    try {
      const res = await updateCustomer(modalCliente.datos._id, datosFinales);
      setClientes(prev => prev.map(c => c._id === modalCliente.datos._id ? res.data : c));
      alert("✅ Cliente actualizado con éxito.");
      setModalCliente({ abierto: false, datos: null });
      await cargarTodosLosDatos();
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
  // 👷 GESTIÓN DE OPERARIOS
  // =========================================================================
  const abrirModalCrearOperario = () => {
    setFormOperario({ nombre: '', password: '1234', rol: 'operario' });
    setModalOperario({ abierto: true, modo: 'crear', datos: null });
  };

  const abrirModalEditarOperario = (op) => {
    setFormOperario({
      nombre: op.nombre || '',
      password: '',
      rol: op.rol || 'operario'
    });
    setModalOperario({ abierto: true, modo: 'editar', datos: op });
  };

  const handleGuardarOperario = async (e) => {
    e.preventDefault();
    try {
      if (modalOperario.modo === 'crear') {
        const res = await createOperator(formOperario);
        const nuevoOp = res.data.user || res.data;
        setOperarios([...operarios, nuevoOp]);
        alert("✅ Usuario de operario creado correctamente.");
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
    if (!window.confirm(`⚠️ ¿Estás seguro de eliminar al operario "${nombre}"?`)) return;
    try {
      await deleteOperator(id);
      setOperarios(operarios.filter(o => o._id !== id));
      alert("🗑️ Operario eliminado con éxito.");
    } catch (err) {
      alert("❌ Error al eliminar operario.");
    }
  };

  // =========================================================================
  // FILTROS
  // =========================================================================
  const term = busqueda.toLowerCase();
  const trabajosFiltrados = trabajos.filter(t => 
    t.cliente?.nombre?.toLowerCase().includes(term) ||
    t.tipo_instalacion?.toLowerCase().includes(term) ||
    t.direccion_obra?.toLowerCase().includes(term) ||
    String(t.id_trabajo).includes(term)
  );

  const clientesFiltrados = clientes.filter(c =>
    c.nombre?.toLowerCase().includes(term) ||
    c.nombre_referencia?.toLowerCase().includes(term) ||
    c.apellido1?.toLowerCase().includes(term) ||
    c.apellido2?.toLowerCase().includes(term) ||
    c.nif?.toLowerCase().includes(term) ||
    c.telefono?.includes(term)
  );

  const operariosFiltrados = operarios.filter(o =>
    o.nombre?.toLowerCase().includes(term) ||
    o.rol?.toLowerCase().includes(term)
  );

  const todasAlertasMaterial = trabajos.flatMap(t => 
    (t.alertasMaterial || []).filter(a => !a.atendida).map(a => ({ ...a, jobId: t._id, idTrabajo: t.id_trabajo }))
  );

  if (cargando) return <div style={{ padding: '24px', fontSize: '18px', fontWeight: 'bold' }}>⏳ Cargando datos de APGgestor...</div>;
  if (error) return <div className="alerta-sistema error" style={{ margin: '20px' }}>❌ {error}</div>;

  return (
    <div className="vista-dashboard">
      
      {/* CABECERA PRINCIPAL */}
      <div className="header-seccion-admin">
        <div>
          <h2 style={{ fontSize: '26px', color: '#0f172a' }}>🖥️ Panel de Administración APGgestor</h2>
          <p className="subtitulo-dashboard">Gestión dinámica de Obras, Clientes y Generación Documental Oficial.</p>
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN */}
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
          placeholder="🔍 Buscar por cliente, instalación, dirección..."
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
                        <p><strong>👤 Cliente:</strong> {trabajo.cliente?.nombre || 'Sin cliente'}</p>
                        <p><strong>📍 Emplazamiento:</strong> {trabajo.direccion_obra || trabajo.cliente?.direccion || '---'}</p>
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

                      {/* BOTÓN DESTACADO: GENERAR DOCUMENTACIÓN */}
                      <button 
                        onClick={() => handleGenerarDocumentacion(trabajo._id, trabajo.id_trabajo)}
                        disabled={descargandoDoc === trabajo._id}
                        className="boton-formulario"
                        style={{ 
                          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
                          color: '#ffffff',
                          marginTop: '10px',
                          padding: '10px',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        {descargandoDoc === trabajo._id ? '⏳ Generando...' : '📄 Generar Documentación'}
                      </button>

                      {/* ACCIONES DE OBRA (EDITAR Y ELIMINAR) */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                        <button onClick={() => abrirModalEditarObra(trabajo)} className="btn-accion-mini btn-editar" style={{ flex: 1 }}>
                          ✏️ Detalle / Editar
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
            <h3 style={{ fontSize: '20px', color: '#1e293b' }}>Directorio de Clientes Registrados</h3>
          </div>

          <div className="contenedor-tabla-clientes">
            <table className="tabla-clientes">
              <thead>
                <tr>
                  <th>#ID</th>
                  <th>NIF / CIF</th>
                  <th>Nombre / Razón Social</th>
                  <th>Ref. Obra/Cliente</th>
                  <th>Estado Obra</th>
                  <th>Teléfono</th>
                  <th>Dirección Fiscal</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                      No hay clientes registrados que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  clientesFiltrados.map(cliente => (
                    <tr key={cliente._id}>
                      <td><strong>#{cliente.id_cliente}</strong></td>
                      <td><code>{cliente.nif || '---'}</code></td>
                      <td style={{ fontWeight: 'bold' }}>{cliente.nombre}</td>
                      <td><span style={{ color: '#0284c7', fontWeight: '500' }}>{cliente.nombre_referencia || '---'}</span></td>
                      <td>
                        {cliente.obras_asociadas > 0 ? (
                          <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            🟢 Obra en curso ({cliente.obras_asociadas})
                          </span>
                        ) : (
                          <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '12px', fontSize: '12px' }}>
                            ⚪ Sin obra activa
                          </span>
                        )}
                      </td>
                      <td>{cliente.telefono || '---'}</td>
                      <td>{formatearDireccion(cliente)}</td>
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
                      <span className="id-obra">ID: {op._id ? op._id.slice(-6) : '---'}</span>
                      <span className="badge-disponible">
                        ⚡ {op.rol || 'operario'}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '18px', margin: '10px 0 4px 0', color: '#0f172a' }}>{op.nombre}</h3>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button onClick={() => abrirModalEditarOperario(op)} className="btn-accion-mini btn-editar" style={{ flex: 1 }}>
                      ✏️ Editar Datos / Clave
                    </button>
                    <button onClick={() => handleEliminarOperario(op._id, op.nombre)} className="btn-accion-mini btn-eliminar">
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: DETALLES / EDICIÓN DE OBRA
          ===================================================================== */}
      {modalObra.abierto && modalObra.datos && (
        <div className="modal-overlay" onClick={() => setModalObra({ abierto: false, datos: null })}>
          <div className="modal-contenido modal-form-crud" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Detalle y Edición de Obra #{formObra.id_trabajo}</h3>
              <button onClick={() => setModalObra({ abierto: false, datos: null })} className="boton-cerrar-modal">✖</button>
            </div>

            {/* BOTÓN DESTACADO DENTRO DEL MODAL PARA GENERAR DOCUMENTACIÓN */}
            <div style={{ marginBottom: '18px', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px', borderRadius: '8px' }}>
              <button 
                type="button"
                onClick={() => handleGenerarDocumentacion(modalObra.datos._id, modalObra.datos.id_trabajo)}
                disabled={descargandoDoc === modalObra.datos._id}
                className="boton-formulario"
                style={{ 
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)', 
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {descargandoDoc === modalObra.datos._id ? '⏳ Generando documento Word...' : '📄 Generar Documentación Oficial (.docx)'}
              </button>
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

              <h4 style={{ color: '#0f172a', margin: '12px 0 6px 0' }}>📍 Emplazamiento de la Obra (Ubicación Física)</h4>

              <div style={{ display: 'grid', gridTemplateColumns: '3fr 7fr', gap: '8px' }}>
                <div>
                  <label>Tipo Vía Obra:</label>
                  <select 
                    value={formObra.tipo_via_obra} 
                    onChange={(e) => setFormObra({ ...formObra, tipo_via_obra: e.target.value })}
                  >
                    {TIPOS_VIA.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Nombre Vía Obra:</label>
                  <input 
                    type="text" 
                    value={formObra.nombre_via_obra} 
                    onChange={(e) => setFormObra({ ...formObra, nombre_via_obra: e.target.value })}
                    placeholder="Ej: Gran Vía" 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                <div>
                  <label>Nº:</label>
                  <input type="text" value={formObra.numero_obra} onChange={(e) => setFormObra({ ...formObra, numero_obra: e.target.value })} placeholder="12" />
                </div>
                <div>
                  <label>Bloque:</label>
                  <input type="text" value={formObra.bloque_obra} onChange={(e) => setFormObra({ ...formObra, bloque_obra: e.target.value })} />
                </div>
                <div>
                  <label>Portal:</label>
                  <input type="text" value={formObra.portal_obra} onChange={(e) => setFormObra({ ...formObra, portal_obra: e.target.value })} />
                </div>
                <div>
                  <label>Escalera:</label>
                  <input type="text" value={formObra.escalera_obra} onChange={(e) => setFormObra({ ...formObra, escalera_obra: e.target.value })} />
                </div>
                <div>
                  <label>Piso:</label>
                  <input type="text" value={formObra.piso_obra} onChange={(e) => setFormObra({ ...formObra, piso_obra: e.target.value })} />
                </div>
                <div>
                  <label>Puerta:</label>
                  <input type="text" value={formObra.puerta_obra} onChange={(e) => setFormObra({ ...formObra, puerta_obra: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label>Localidad Obra:</label>
                  <input 
                    type="text" 
                    value={formObra.localidad_obra} 
                    onChange={(e) => setFormObra({ ...formObra, localidad_obra: e.target.value })}
                  />
                </div>
                <div>
                  <label>CP Obra:</label>
                  <input 
                    type="text" 
                    value={formObra.cp_obra} 
                    onChange={(e) => setFormObra({ ...formObra, cp_obra: e.target.value })}
                  />
                </div>
                <div>
                  <label>Provincia Obra:</label>
                  <input 
                    type="text" 
                    value={formObra.provincia_obra} 
                    onChange={(e) => setFormObra({ ...formObra, provincia_obra: e.target.value })}
                  />
                </div>
              </div>

              <label>Cliente Asociado:</label>
              <select 
                value={formObra.cliente} 
                onChange={(e) => setFormObra({ ...formObra, cliente: e.target.value })}
              >
                <option value="">-- Seleccionar Cliente --</option>
                {clientes.map(c => (
                  <option key={c._id} value={c._id}>{c.nombre}{c.nif ? ` - ${c.nif}` : ''}</option>
                ))}
              </select>

              <label>Precio Base (€):</label>
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
                💾 Guardar Cambios
              </button>
            </form>

            {/* Subida de PDFs */}
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

          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: EDITAR CLIENTE
          ===================================================================== */}
      {modalCliente.abierto && modalCliente.datos && (
        <div className="modal-overlay" onClick={() => setModalCliente({ abierto: false, datos: null })}>
          <div className="modal-contenido modal-form-crud" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>✏️ Editar Datos Fiscales de Cliente #{formCliente.id_cliente}</h3>
              <button onClick={() => setModalCliente({ abierto: false, datos: null })} className="boton-cerrar-modal">✖</button>
            </div>

            <CustomerForm 
              initialData={formCliente} 
              onSubmit={handleGuardarCliente} 
              buttonText="💾 Guardar Cambios" 
            />
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: OPERARIO (CREAR / EDITAR)
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

              <label>Rol de Usuario:</label>
              <select 
                value={formOperario.rol} 
                onChange={(e) => setFormOperario({ ...formOperario, rol: e.target.value })}
              >
                <option value="operario">👷 Operario</option>
                <option value="admin">👑 Administrador</option>
              </select>

              <label>Contraseña de Acceso:</label>
              <input 
                type="text" 
                value={formOperario.password} 
                onChange={(e) => setFormOperario({ ...formOperario, password: e.target.value })}
                placeholder={modalOperario.modo === 'crear' ? 'Ej: 1234' : 'Dejar en blanco para no modificar'} 
                required={modalOperario.modo === 'crear'}
              />

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