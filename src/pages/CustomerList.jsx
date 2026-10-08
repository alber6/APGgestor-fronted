import { useState, useEffect } from "react";
import { getCustomers } from "../services/api";
import CustomerDetails, { formatearDireccion } from "../components/CustomerDetails";

const CustomerList = () => {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  useEffect(() => {
    const cargarClientes = () => {
      getCustomers()
        .then((response) => {
          setClientes(response.data);
          setCargando(false);
        })
        .catch((error) => {
          console.error("Error al traer clientes:", error);
          setError("No se pudo conectar con el servidor para listar los clientes.");
          setCargando(false);
        });
    };

    cargarClientes();
    window.addEventListener('focus', cargarClientes);
    return () => window.removeEventListener('focus', cargarClientes);
  }, []);

  const clientesFiltrados = clientes.filter((cliente) => {
    const termino = busqueda.toLowerCase();
    return (
      cliente.nombre?.toLowerCase().includes(termino) ||
      cliente.nombre_referencia?.toLowerCase().includes(termino) ||
      cliente.apellido1?.toLowerCase().includes(termino) ||
      cliente.apellido2?.toLowerCase().includes(termino) ||
      cliente.nif?.toLowerCase().includes(termino) ||
      String(cliente.telefono || '').includes(termino)
    );
  });

  if (cargando) return <div style={{ padding: '20px' }}>⏳ Cargando clientes...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red', fontWeight: 'bold' }}>❌ {error}</div>;

  return (
    <div className="vista-clientes">
      <h2>👥 Maestro de Clientes Registrados</h2>
      <p className="subtitulo-dashboard">
        Base de datos global de la empresa. Haz clic en cualquier cliente para ver sus datos granulares y del representante. Total clientes: <strong>{clientes.length}</strong>
      </p>

      <div className="contenedor-buscador" style={{ maxWidth: '400px' }}>
        <input
          type="text"
          placeholder="🔍 Buscar por nombre, referencia, NIF o teléfono..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-buscador"
        />
      </div>

      <div className="contenedor-lista-clientes">
        {clientesFiltrados.length === 0 ? (
          <p className="mensaje-vacio">🔍 No se encontró ningún cliente que coincida con la búsqueda.</p>
        ) : (
          clientesFiltrados.map((cliente) => {
            const direccionFormateada = formatearDireccion(cliente);
            return (
              <div
                key={cliente._id}
                className="tarjeta-cliente"
                onClick={() => setClienteSeleccionado(cliente)}
                style={{ cursor: 'pointer', transition: 'transform 0.2s', borderLeft: cliente.es_empresa ? '4px solid #0284c7' : '4px solid #10b981' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: '0 0 6px 0' }}>
                    {`${cliente.nombre || ''} ${cliente.apellido1 || ''} ${cliente.apellido2 || ''}`.trim()}
                  </h3>
                  {cliente.es_empresa && (
                    <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                      🏢 Empresa
                    </span>
                  )}
                </div>

                {cliente.nombre_referencia && (
                  <p style={{ margin: '2px 0 6px 0', color: '#0284c7', fontWeight: 'bold', fontSize: '13px' }}>
                    🏷️ Ref: {cliente.nombre_referencia}
                  </p>
                )}

                <p><strong>📄 NIF/CIF:</strong> {cliente.nif || '---'}</p>
                <p><strong>🆔 ID Cliente:</strong> #{cliente.id_cliente}</p>

                {/* DIRECCIÓN FISCAL DESGLOSADA Y FORMATEADA */}
                <p style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: '4px', margin: '6px 0' }}>
                  <strong>🏛️ Dirección Fiscal:</strong> {direccionFormateada}
                </p>

                {/* RENDERIZADO CONDICIONAL DE REPRESENTANTE LEGAL EN VISTA RESUMIDA */}
                {cliente.es_empresa && (
                  <p style={{ background: '#f0f9ff', padding: '6px 8px', borderRadius: '4px', borderLeft: '3px solid #0284c7', color: '#0369a1', margin: '6px 0' }}>
                    <strong>👤 Rep. Legal:</strong> {cliente.representante_nombre} {cliente.representante_apellido1} ({cliente.representante_nif || 'Sin NIF'})
                  </p>
                )}

                <p><strong>📞 Teléfono:</strong> {cliente.telefono || '---'}</p>
                <p><strong>📧 Correo:</strong> {cliente.email || '---'}</p>

                <button
                  type="button"
                  className="btn-accion-mini btn-editar"
                  style={{ marginTop: '10px', width: '100%', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setClienteSeleccionado(cliente);
                  }}
                >
                  👁️ Ver Detalle Completo
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE DETALLES DEL CLIENTE */}
      {clienteSeleccionado && (
        <CustomerDetails
          cliente={clienteSeleccionado}
          onClose={() => setClienteSeleccionado(null)}
        />
      )}
    </div>
  );
};

export default CustomerList;
