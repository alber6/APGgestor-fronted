import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJobs, updateJobStatus, addMaterialAlert } from '../services/api'; 

const OperatorView = () => {
  const [trabajos, setTrabajos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensajeOperacion, setMensajeOperacion] = useState(null);
  
  // Estado para controlar las notas que el operario está escribiendo de forma temporal
  const [notasTemporales, setNotasTemporales] = useState({});

  // Estado para el modal de Solicitar Material
  const [modalMaterialJobId, setModalMaterialJobId] = useState(null);
  const [textoMaterial, setTextoMaterial] = useState('');

  const navigate = useNavigate();

  // localstorage para dejar reconocer al usuario por el navegador
  const usuarioLogueado = JSON.parse(localStorage.getItem('usuario')) || null;
  const operarioNombre = usuarioLogueado?.nombre || 'Operario';
  const operarioRol = usuarioLogueado?.rol;

  useEffect(() => {
    // Protección de ruta: Si no hay sesión o el rol no es operario, bloqueamos la pantalla
    if (!usuarioLogueado || operarioRol?.toLowerCase().trim() !== 'operario') {
      setError("Acceso denegado. Esta pantalla es exclusiva para cuentas de operarios.");
      setCargando(false);
      return;
    }

    // Solicitamos las obras frescas al servidor
    getJobs()
      .then((response) => {
        const listaObras = response.data || [];
        const nombreOperarioSesion = operarioNombre.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // FILTRADO INTELIGENTE MULTI-OPERARIO:
        // Comprueba si el operario figura en job.operarios (array) o job.operario
        const misTrabajos = listaObras.filter(job => {
          // Verificar en array de operarios
          if (Array.isArray(job.operarios) && job.operarios.length > 0) {
            const coincideArray = job.operarios.some(op => {
              let opNom = typeof op === 'object' ? op.nombre : '';
              if (opNom) {
                opNom = opNom.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return opNom === nombreOperarioSesion || opNom.includes(nombreOperarioSesion);
              }
              return false;
            });
            if (coincideArray) return true;
          }

          // Verificar en campo operario único heredado
          if (job.operario) {
            let nombreObra = typeof job.operario === 'string' 
              ? job.operario.toLowerCase().trim() 
              : job.operario?.nombre?.toLowerCase().trim();
              
            if (nombreObra) {
              nombreObra = nombreObra.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              return nombreObra === nombreOperarioSesion || 
                     nombreOperarioSesion.includes(nombreObra) || 
                     nombreObra.includes(nombreOperarioSesion);
            }
          }

          // Si no está asignado o no coincide, no se muestra
          return false;
        });

        setTrabajos(misTrabajos);
        setCargando(false);
      })
      .catch((err) => {
        console.error("Error al cargar trabajos:", err);
        setError("Error al conectar con el servidor para obtener tus tareas.");
        setCargando(false);
      });
  }, [operarioNombre, operarioRol]);

  // logout
  const handleLogout = () => {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    navigate('/login');
  };

  // función para cambiar el estado de las obras
  const handleCambioEstado = async (trabajoId, nuevoEstado) => {
    try {
      await updateJobStatus(trabajoId, { estado: nuevoEstado });
      setTrabajos(prev => prev.map(job => job._id === trabajoId ? { ...job, estado: nuevoEstado } : job));

      setMensajeOperacion({ tipo: 'exito', texto: `¡Estado actualizado a "${nuevoEstado}"!` });
      setTimeout(() => setMensajeOperacion(null), 3000);
    } catch (err) {
      setMensajeOperacion({ tipo: 'error', texto: 'No se pudo cambiar el estado en el servidor.' });
    }
  };

  // enviar notas a la oficina
  const handleGuardarNotas = async (trabajoId) => {
    const textoNota = notasTemporales[trabajoId];
    if (textoNota === undefined || textoNota.trim() === "") return;

    try {
      await updateJobStatus(trabajoId, { notas: textoNota });
      setTrabajos(prev => prev.map(job => job._id === trabajoId ? { ...job, notas: textoNota } : job));
      
      setMensajeOperacion({ tipo: 'exito', texto: '📌 ¡Nota enviada a la oficina con éxito!' });
      setTimeout(() => setMensajeOperacion(null), 3000);
    } catch (err) {
      console.error("Error al guardar notas:", err);
      setMensajeOperacion({ tipo: 'error', texto: 'No se pudo registrar la nota.' });
    }
  };

  // TAREA 4: Enviar Solicitud de Material a la Oficina (actualiza alertasMaterial)
  const handleEnviarSolicitudMaterial = async (e) => {
    e.preventDefault();
    if (!modalMaterialJobId || !textoMaterial.trim()) return;

    try {
      const res = await addMaterialAlert(modalMaterialJobId, textoMaterial.trim());
      
      // Actualizar trabajo localmente
      setTrabajos(prev => prev.map(j => j._id === modalMaterialJobId ? res.data : j));
      
      setMensajeOperacion({ tipo: 'exito', texto: '🚨 ¡Solicitud de material enviada al Administrador!' });
      setTimeout(() => setMensajeOperacion(null), 4000);
      
      setModalMaterialJobId(null);
      setTextoMaterial('');
    } catch (err) {
      alert("Error al enviar la solicitud de material.");
    }
  };

  if (cargando) return <div className="vista-dashboard">⏳ Cargando tus órdenes asignadas...</div>;
  if (error) return <div className="alerta-sistema error" style={{ margin: '20px' }}>❌ {error}</div>;

  return (
    <div className="vista-dashboard">
      
      {/* HEADER DE OPERARIO */}
      <div className="header-dashboard">
        <div className="header-text-block">
          <h2>👷 Bienvenido, {operarioNombre}</h2>
          <p className="subtitulo-dashboard">
            Tienes <strong>{trabajos.length}</strong> obras activas en tu cuadrante.
          </p>
        </div>
        <button onClick={handleLogout} className="boton-logout">
          🚪 Salir
        </button>
      </div>

      {mensajeOperacion && (
        <div className={`alerta-sistema ${mensajeOperacion.tipo}`}>
          {mensajeOperacion.texto}
        </div>
      )}

      {/* LISTADO DE OBRAS ASIGNADAS */}
      <div className="contenedor-listado-obras">
        {trabajos.length === 0 ? (
          <p className="mensaje-vacio">🎉 ¡Felicidades! Has terminado todo tu cuadrante de trabajo.</p>
        ) : (
          trabajos.map((trabajo) => {
            const estadoClase = trabajo.estado ? trabajo.estado.toLowerCase().replace(/\s+/g, '-') : 'pendiente';
            // Los documentos recibidos por red SÓLO son planos eléctricos gracias al middleware/controlador backend
            const planosElectricos = trabajo.documentos || [];

            return (
              <div key={trabajo._id} className="tarjeta-obra-hibrida tarjeta-no-clickable">
                
                <div className="tarjeta-obra-header">
                  <span className="id-obra">#{trabajo.id_trabajo}</span>
                  <span className={`status-badge ${estadoClase}`}>{trabajo.estado || 'Pendiente'}</span>
                </div>

                <div className="tarjeta-obra-body">
                  <h4 className="tarjeta-titulo-instalacion">{trabajo.tipo_instalacion}</h4>
                  
                  {/* Información de Cliente B2B o Individual */}
                  {trabajo.clienteUbicacion ? (
                    <>
                      <p><strong>📍 Ubicación Obra:</strong> {trabajo.clienteUbicacion.nombre} ({trabajo.clienteUbicacion.direccion})</p>
                      <p><strong>💳 Facturación:</strong> {trabajo.clienteFacturacion?.nombre || 'Coarsa'}</p>
                    </>
                  ) : (
                    <>
                      <p><strong>👤 Cliente:</strong> {trabajo.cliente?.nombre || 'Sin nombre'}</p>
                      <p><strong>📞 Teléfono:</strong> <a href={`tel:${trabajo.cliente?.telefono}`} className="enlace-telefono">{trabajo.cliente?.telefono}</a></p>
                      <p><strong>📍 Dirección:</strong> {trabajo.cliente?.direccion || 'No especificada'}</p>
                    </>
                  )}

                  {/* TAREA 4: BOTÓN GRANDE "SOLICITAR MATERIAL" */}
                  <div style={{ marginTop: '14px', marginBottom: '14px' }}>
                    <button 
                      onClick={() => setModalMaterialJobId(trabajo._id)}
                      className="boton-formulario"
                      style={{ 
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
                        padding: '14px', 
                        fontSize: '15px', 
                        fontWeight: 'bold',
                        boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyIncontent: 'center',
                        gap: '8px'
                      }}
                    >
                      📦 SOLICITAR MATERIAL A OFICINA
                    </button>
                  </div>

                  {/* TAREA 4: SECCIÓN "DOCUMENTACIÓN DE OBRA" (Planos Eléctricos recibidos desde backend) */}
                  <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '12px', borderRadius: '8px', marginBottom: '14px' }}>
                    <strong style={{ color: '#0369a1', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                      📐 Documentación de Obra (Planos Eléctricos):
                    </strong>
                    
                    {planosElectricos.length === 0 ? (
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                        Sin planos eléctricos asignados por la oficina.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {planosElectricos.map((doc, idx) => (
                          <a 
                            key={idx} 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="tag-doc plano_electrico"
                            style={{ padding: '8px 12px', fontSize: '13px' }}
                          >
                            📐 Abrir Plano: <strong>{doc.nombre}</strong> ↗
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Visualización de notas vigentes */}
                  {(trabajo.notes || trabajo.notas) && (
                    <div className="bloque-notas-interno bloque-historial-notas">
                      📌 <strong>Historial de Notas:</strong> <em>{trabajo.notes || trabajo.notas}</em>
                    </div>
                  )}

                  {/* Cambiar estado de la obra */}
                  <div className="campo-formulario campo-selector-estado">
                    <label className="label-pequena">🔄 Cambiar Estado:</label>
                    <select
                      value={trabajo.estado || 'Pendiente'}
                      onChange={(e) => handleCambioEstado(trabajo._id, e.target.value)}
                      className="select-estado"
                    >
                      <option value="Pendiente">⏳ Pendiente</option>
                      <option value="En proceso">⚡ En proceso</option>
                      <option value="Esperando Material">📦 Esperando Material</option>
                      <option value="Finalizado">✅ Finalizado</option>
                    </select>
                  </div>

                  {/* Reporte rápido de campo */}
                  <div className="campo-formulario campo-selector-estado">
                    <label className="label-pequena">✍️ Añadir nota o reporte de campo:</label>
                    <div className="contenedor-input-reporte">
                      <input 
                        type="text" 
                        placeholder="Ej: Cliente solicitó modificación en cuadro..."
                        value={notasTemporales[trabajo._id] || ''}
                        onChange={(e) => setNotasTemporales({ ...notasTemporales, [trabajo._id]: e.target.value })}
                        className="input-reporte-texto"
                      />
                      <button 
                        onClick={() => handleGuardarNotas(trabajo._id)}
                        className="boton-formulario boton-enviar-reporte"
                      >
                        Enviar
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL PARA SOLICITAR MATERIAL */}
      {modalMaterialJobId && (
        <div className="modal-overlay" onClick={() => setModalMaterialJobId(null)}>
          <div className="modal-contenido" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>📦 Solicitar Material a Oficina</h3>
              <button onClick={() => setModalMaterialJobId(null)} className="boton-cerrar-modal">✖</button>
            </div>

            <form onSubmit={handleEnviarSolicitudMaterial}>
              <div className="campo-formulario">
                <label>Detalla el material necesario para la obra:</label>
                <textarea
                  rows="4"
                  placeholder="Ej: Necesitamos 15m de tubo corrugado de 25mm y 3 mecanismos Simon 82..."
                  value={textoMaterial}
                  onChange={(e) => setTextoMaterial(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="boton-formulario"
                style={{ background: '#f59e0b', color: 'white' }}
              >
                🚀 Enviar Alerta de Material a la Oficina
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default OperatorView;