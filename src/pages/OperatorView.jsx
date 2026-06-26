import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Importamos los servicios necesarios (Asegúrate de tener implementado updateJob en tu api.js)
import { getJobs, updateJobStatus } from '../services/api'; 

const OperatorView = () => {
  const [trabajos, setTrabajos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensajeOperacion, setMensajeOperacion] = useState(null);
  
  // Estado para controlar las notas que el operario está escribiendo de forma temporal antes de guardar
  const [notasTemporales, setNotasTemporales] = useState({});

  const navigate = useNavigate();

  // localstorage para dejar reconocer al usuario por el navegador
  const usuarioLogueado = JSON.parse(localStorage.getItem('usuario')) || null;
  const operarioNombre = usuarioLogueado?.nombre || 'Operario';
  const operarioRol = usuarioLogueado?.rol;

  // filtrar rutas
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
        
        // Pasamos el nombre del operario logueado a minúsculas para un cruce limpio
        const nombreFiltroActivo = operarioNombre.toLowerCase().trim();

        // FILTRADO INTELIGENTE MULTI-OPERARIO: Funciona para Carlos, Manuel, Javier, etc.
        const misTrabajos = listaObras.filter(job => {
          if (!job.operario) return false;

        // Extraemos y limpiamos el nombre de la obra (pasamos a minúsculas y quitamos acentos)
        let nombreObra = typeof job.operario === 'string' 
          ? job.operario.toLowerCase().trim() 
          : job.operario?.nombre?.toLowerCase().trim();
          
        if (nombreObra) {
          nombreObra = nombreObra.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }

        // Limpiamos el nombre del operario en sesión (quitamos acentos)
        let nombreOperarioSesion = operarioNombre.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        if (!nombreObra || !nombreOperarioSesion) return false;
        
        // Filtramos de forma inteligente sin importar acentos
        return nombreObra === nombreOperarioSesion || 
                nombreOperarioSesion.includes(nombreObra) || 
                nombreObra.includes(nombreOperarioSesion);
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
    localStorage.removeItem('usuario'); // Eliminamos la ficha del usuario del dispositivo
    localStorage.removeItem('token');   // Eliminamos el token de seguridad si existiera
    navigate('/login');                // Redirigimos al Login inmediatamente
  };

  // función para cambiar el estado de las obras si están en pendiente, en proceso o finalizadas 
  const handleCambioEstado = async (trabajoId, nuevoEstado) => {
    try {
      // Disparamos la petición PUT/PATCH al Backend para impactar en Mongo Atlas
      await updateJobStatus(trabajoId, { estado: nuevoEstado });
      
      // Actualizamos el estado local para que cambie de color en el móvil al instante
      setTrabajos(prev => prev.map(job => job._id === trabajoId ? { ...job, estado: nuevoEstado } : job));

      setMensajeOperacion({ tipo: 'exito', texto: `¡Estado actualizado a "${nuevoEstado}"!` });
      setTimeout(() => setMensajeOperacion(null), 3000);
    } catch (err) {
      setMensajeOperacion({ tipo: 'error', texto: 'No se pudo cambiar el estado en el servidor.' });
    }
  };

  // funcion para enviar notas por parte del operario para que el admin sepa al instante lo que se necesita en esa obra
  const handleGuardarNotas = async (trabajoId) => {
    const textoNota = notasTemporales[trabajoId];
    if (textoNota === undefined || textoNota.trim() === "") return;

    try {
      // Enviamos la actualización de la nota al Backend (Sincronización total con el Admin)
      await updateJobStatus(trabajoId, { notas: textoNota });

      // Consolidamos la nota en el estado local de React
      setTrabajos(prev => prev.map(job => job._id === trabajoId ? { ...job, notas: textoNota } : job));
      
      setMensajeOperacion({ tipo: 'exito', texto: '📌 ¡Nota enviada a la oficina con éxito!' });
      setTimeout(() => setMensajeOperacion(null), 3000);
    } catch (err) {
      console.error("Error al guardar notas:", err);
      setMensajeOperacion({ tipo: 'error', texto: 'No se pudo registrar la nota.' });
    }
  };

  // Controladores de carga y pantallas bloqueantes
  if (cargando) return <div className="vista-dashboard">⏳ Cargando tus órdenes asignadas...</div>;
  if (error) return <div className="alerta-sistema error" style={{ margin: '20px' }}>❌ {error}</div>;

 return (
    <div className="vista-dashboard">
      
      {/* parte principal del operario */}
      <div className="header-dashboard">
        <div className="header-text-block">
          <h2>👷 Bienvenido, {operarioNombre}</h2>
          <p className="subtitulo-dashboard">
            Tienes <strong>{trabajos.length}</strong> obras activas en tu cuadrante.
          </p>
        </div>
        {/* logout */}
        <button onClick={handleLogout} className="boton-logout">
          🚪 Salir
        </button>
      </div>

      {mensajeOperacion && (
        <div className={`alerta-sistema ${mensajeOperacion.tipo}`}>
          {mensajeOperacion.texto}
        </div>
      )}

      {/* renderizado tarjetas de las obras del operario */}
      <div className="contenedor-listado-obras">
        {trabajos.length === 0 ? (
          <p className="mensaje-vacio">🎉 ¡Felicidades! Has terminado todo tu cuadrante de trabajo.</p>
        ) : (
          trabajos.map((trabajo) => {
            const estadoClase = trabajo.estado ? trabajo.estado.toLowerCase().replace(/\s+/g, '-') : 'pendiente';

            return (
              <div key={trabajo._id} className="tarjeta-obra-hibrida tarjeta-no-clickable">
                
                <div className="tarjeta-obra-header">
                  <span className="id-obra">#{trabajo.id_trabajo}</span>
                  <span className={`status-badge ${estadoClase}`}>{trabajo.estado || 'Pendiente'}</span>
                </div>

                <div className="tarjeta-obra-body">
                  <h4 className="tarjeta-titulo-instalacion">{trabajo.tipo_instalacion}</h4>
                  <p><strong>👤 Cliente:</strong> {trabajo.cliente?.nombre || 'Sin nombre'}</p>
                  <p><strong>📞 Teléfono:</strong> <a href={`tel:${trabajo.cliente?.telefono}`} className="enlace-telefono">{trabajo.cliente?.telefono}</a></p>
                  <p><strong>📍 Dirección:</strong> {trabajo.cliente?.direccion || 'No especificada'}</p>
                  
                  {/* Visualización de notas vigentes creadas por la oficina o el propio operario */}
                  {(trabajo.notes || trabajo.notas) && (
                    <div className="bloque-notas-interno bloque-historial-notas">
                      📌 <strong>Historial de Notas:</strong> <em>{trabajo.notes || trabajo.notas}</em>
                    </div>
                  )}

                  {/* para cambiar el estado de la obra */}
                  <div className="campo-formulario campo-selector-estado">
                    <label className="label-pequena">🔄 Cambiar Estado:</label>
                    <select
                      value={trabajo.estado || 'Pendiente'}
                      onChange={(e) => handleCambioEstado(trabajo._id, e.target.value)}
                      className="select-estado"
                    >
                      <option value="Pendiente">⏳ Pendiente</option>
                      <option value="En proceso">⚡ En proceso</option>
                      <option value="Finalizado">✅ Finalizado</option>
                    </select>
                  </div>

                  {/* enviar notas en directo a la pantalla del administrador */}
                  <div className="campo-formulario campo-selector-estado">
                    <label className="label-pequena">✍️ Añadir nota o reporte de campo:</label>
                    <div className="contenedor-input-reporte">
                      <input 
                        type="text" 
                        placeholder="Ej: Falta material, cliente no estaba..."
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
    </div>
  );
};

export default OperatorView;