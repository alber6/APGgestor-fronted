import React, { useState, useEffect } from 'react';
import { getJobs } from '../services/api';

const OfficeDashboard = () => {
  const [trabajos, setTrabajos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Llamamos a la API para traer los trabajos de MongoDB Atlas
    getJobs()
      .then((response) => {
        setTrabajos(response.data);
        setCargando(false);
      })
      .catch((err) => {
        console.error("Error cargando trabajos:", err);
        setError("No se pudieron cargar las órdenes de trabajo.");
        setCargando(false);
      });
  }, []);

  // Filtro multitarea en tiempo real
  const trabajosFiltrados = trabajos.filter((trabajo) => {
    const termino = busqueda.toLowerCase();
    
    // Al usar el operador ?. nos aseguramos de que si un campo viene vacío no rompa la app
    const coincideCliente = trabajo.cliente?.nombre?.toLowerCase().includes(termino);
    const coincideOperario = trabajo.operario?.nombre?.toLowerCase().includes(termino);
    const coincideInstalacion = trabajo.tipo_instalacion?.toLowerCase().includes(termino);
    const coincideId = String(trabajo.id_trabajo).includes(termino);
    const coincideNotas = trabajo.notas?.toLowerCase().includes(termino);

    // Si coincide cualquiera de las condiciones, el trabajo pasa el filtro
    return coincideCliente || coincideOperario || coincideInstalacion || coincideId || coincideNotas;
  });

  if (cargando) return <div style={{ padding: '20px' }}>⏳ Cargando las órdenes de trabajo de APGgestor...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red', fontWeight: 'bold' }}>❌ {error}</div>;

return (
  <div className="vista-dashboard">
    <h2>🖥️ Control de la Oficina</h2>
    <p className="subtitulo-dashboard">Monitoreo de instalaciones en tiempo real.</p>
    
    {/* BUSCADOR LIMPIO */}
    <div className="contenedor-buscador">
      <input
        type="text"
        placeholder="🔍 Buscar por cliente, operario, avería o notas..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="input-buscador"
      />
    </div>

    {/* CONTENEDOR FLEXIBLE / RESPONSIVO */}
    <div className="contenedor-listado-obras">
      {trabajosFiltrados.length === 0 ? (
        <p className="mensaje-vacio">🔍 No se encontraron órdenes de trabajo.</p>
      ) : (
        trabajosFiltrados.map((trabajo) => {
          const estadoClase = trabajo.estado ? trabajo.estado.toLowerCase().replace(/\s+/g, '-') : 'pendiente';
          
          return (
            <div key={trabajo._id} className="tarjeta-obra-hibrida">
              <div className="tarjeta-obra-header">
                <span className="id-obra">#{trabajo.id_trabajo}</span>
                <span className={`status-badge ${estadoClase}`}>{trabajo.estado || 'Pendiente'}</span>
              </div>

              <div className="tarjeta-obra-body">
                <h4>{trabajo.tipo_instalacion}</h4>
                <p><strong>👤 Cliente:</strong> {trabajo.cliente?.nombre || 'Sin Cliente'}</p>
                <p><strong>📍 Dirección:</strong> {trabajo.cliente?.direccion || '---'}</p>
                <p><strong>👷 Operario:</strong> {trabajo.operario?.nombre || 'No Asignado'}</p>
                <p className="precio-obra"><strong>💰 Precio:</strong> {trabajo.precio} €</p>
                
                {/* NOTAS INTERNAS */}
                {(trabajo.notes || trabajo.notas) && (
                  <div className="bloque-notas-interno">
                    📌 <strong>Notas de obra:</strong> <em>{trabajo.notes || trabajo.notas}</em>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
)};

export default OfficeDashboard;