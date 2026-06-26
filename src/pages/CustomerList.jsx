import { useState, useEffect } from "react";
import { getCustomers } from "../services/api";

const CustomerList = () => {
    const [clientes, setClientes] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    // al montar la página nos traemos todos los clientes que están guardados en mongo
    useEffect(() => {
        getCustomers()
        .then((response) => {
            setClientes(response.data);
            setCargando(false)
        })
        .catch((error) => {
            console.error("Error al traer clientes:", error);
            setError("No se puedo conectar con el servidor para listar los clientes.");
            setCargando(false);
        });
    }, []);

    // filtrar clientes
    const clientesFiltrados = clientes.filter((cliente) => {
        const termino = busqueda.toLowerCase();
        return (
            // convertir el telefono en string para que no pete
            cliente.nombre?.toLowerCase().startsWith(termino) || String(cliente.telefono).includes(termino)
        );
    });

    if (cargando) return <div style={{ padding: '20px' }}>⏳ Cargando clientes...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red', fontWeight: 'bold' }}>❌ {error}</div>;

return (
  <div className="vista-clientes">
    <h2>👥 Maestro de Clientes Registrados</h2>
    <p className="subtitulo-dashboard">
      Base de datos global de la empresa. Total clientes: <strong>{clientes.length}</strong>
    </p>

    {/* BARRA DE BÚSQUEDA REUTILIZANDO LA CLASE DEL DASHBOARD */}
    <div className="contenedor-buscador" style={{ maxWidth: '400px' }}>
      <input
        type="text"
        placeholder="🔍 Buscar por nombre o teléfono..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="input-buscador"
      />
    </div>

    {/* SECCIÓN DE TARJETA DE CLIENTES RESPONSIVAS */}
    <div className="contenedor-lista-clientes">
      {clientesFiltrados.length === 0 ? (
        <p className="mensaje-vacio">🔍 No se encontró ningún cliente que coincida con la búsqueda.</p>
      ) : (
        clientesFiltrados.map((cliente) => (
          <div key={cliente._id} className="tarjeta-cliente">
            <h3>{cliente.nombre}</h3>
            <p><strong>🆔 ID Cliente:</strong> #{cliente.id_cliente}</p>
            <p><strong>📞 Teléfono:</strong> {cliente.telefono}</p>
            <p><strong>📧 Correo:</strong> {cliente.email || '---'}</p>
            <p><strong>📍 Dirección:</strong> {cliente.direccion || '---'}</p>
            
            {/* Tipo de propiedad con diseño de badge neutro y limpio */}
            <p style={{ marginTop: '12px' }}>
              <span className="badge-propiedad">
                🏠 {cliente.tipo_vivienda || 'No especificado'}
              </span>
            </p>
          </div>
        ))
      )}
    </div>
  </div>
)};

export default CustomerList;

