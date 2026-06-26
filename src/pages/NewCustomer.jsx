import React, { use, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomers, createCustomerRequest } from '../services/api';

const NewCustomer = () => {
  const [ formData, setFormData ] = useState({
    id_cliente: '',
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    tipo_vivienda: 'Chalet' //sale por defecto
  });

  //para pintar los mensajes en verde de éxito o rojo de error
  const [ mensaje, setMensaje ] = useState(null)
  const [cargandoId, setCargandoId] = useState(true); // Para mostrar un "Calculando..."
  // mandar al usuario a otra página
  const navigate = useNavigate();

  // Al cargar la pantalla, consultamos la base de datos para calcular el ID correlativo
  useEffect(() => {
    getCustomers()
      .then((response) => {
        const listaClientes = response.data;
        
        // Buscamos el ID numérico más alto que haya en la base de datos
        // Si por algún motivo está vacía, empezamos en el 102 por el histórico del CSV
        let idMasAlto = 101; 
        
        listaClientes.forEach(c => {
          if (c.id_cliente && c.id_cliente > idMasAlto) {
            idMasAlto = c.id_cliente;
          }
        });

        // El siguiente ID disponible será el más alto + 1
        const siguienteId = idMasAlto + 1;

        setFormData(prev => ({
          ...prev,
          id_cliente: String(siguienteId) // Lo guardamos en el estado
        }));
        setCargandoId(false);
      })
      .catch((err) => {
        console.error("Error calculando el siguiente ID:", err);
        // Si falla la red, ponemos el 102 por defecto por seguridad
        setFormData(prev => ({ ...prev, id_cliente: '102' }));
        setCargandoId(false);
      });
  }, []);

  // esta función se activa cuando se pulse una tecla en cualquier input y se actualizará el valor en el estado formData sin borrar los demás
  const handleChange = (e) => {
    setFormData({
      ...formData, //copiar los datos que teniamos para no perderlos
      [e.target.name]: e.target.value //actualizar solo el campo modificado
    });
  };

  // enivar el formulario que se ejecuta al pulsar el botón de guardar
  const handleSubmit = async (e) => {
    e.preventDefault(); // Evita que la página se recargue 
    
    try {
      // Enviamos el objeto al backend a través de nuestra API centralizada con axios.
      // Como el input de HTML guarda el texto como string, usamos Number() para id_cliente
      await createCustomerRequest({
        ...formData,
        id_cliente: Number(formData.id_cliente)
      });

      // Si el backend responde con un OK, aviso verde
      setMensaje({ 
        tipo: 'exito', 
        texto: '¡Cliente registrado con éxito en la nube de APGgestor!' 
      });
      
      // esperar 2 segundos para ver que ha tenido éxito y automáticamente de vuelta al panel principal.
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      // Si el servidor falla
      console.error("Error al crear cliente en el servidor:", error);
      setMensaje({ 
        tipo: 'error', 
        texto: 'Hubo un fallo al registrar al cliente. Revisa los datos.' 
      });
    }
  };

return (
  <div className="vista-formulario">
    <h2>✍️ Registrar Nuevo Cliente</h2>
    <p className="subtitulo-formulario">Introduce los datos para dar de alta al cliente en el sistema.</p>

    {/* ALERTAS SEMÁNTICAS CENTRALIZADAS */}
    {mensaje && (
      <div className={`alerta-sistema ${mensaje.tipo === 'exito' ? 'exito' : 'error'}`}>
        {mensaje.texto}
      </div>
    )}

    {/* EL FORMULARIO INTEGRADO */}
    <form onSubmit={handleSubmit} className="tarjeta-formulario-blanca">
      
      <div className="campo-formulario">
        <label>ID Cliente (Asignado Automáticamente):</label>
        <input 
          type="number" 
          name="id_cliente" 
          value={formData.id_cliente} 
          onChange={handleChange} 
          disabled={true} 
          placeholder={cargandoId ? "Calculando siguiente ID..." : ""}
        />
        <small className="texto-ayuda-formulario">
          {cargandoId ? "⏳ Consultando base de datos..." : `✅ ID correlativo óptimo calculado basado en la base de datos.`}
        </small>
      </div>

      <div className="campo-formulario">
        <label>Nombre Completo / Empresa:</label>
        <input 
          type="text" 
          name="nombre" 
          value={formData.nombre} 
          onChange={handleChange} 
          required 
          placeholder="Ej: Talleres Martínez" 
        />
      </div>

      <div className="campo-formulario">
        <label>Teléfono de Contacto:</label>
        <input 
          type="tel" 
          name="telefono" 
          value={formData.telefono} 
          onChange={handleChange} 
          required 
          placeholder="Ej: 600123456" 
        />
      </div>

      <div className="campo-formulario">
        <label>Correo Electrónico:</label>
        <input 
          type="email" 
          name="email" 
          value={formData.email} 
          onChange={handleChange} 
          required 
          placeholder="Ej: contacto@cliente.com" 
        />
      </div>

      <div className="campo-formulario">
        <label>Dirección Postal de la Obra:</label>
        <input 
          type="text" 
          name="direccion" 
          value={formData.direccion} 
          onChange={handleChange} 
          required 
          placeholder="Ej: Calle Gran Vía 45, 3ºB" 
        />
      </div>

      <div className="campo-formulario">
        <label>Tipo de Vivienda / Local:</label>
        <select 
          name="tipo_vivienda" 
          value={formData.tipo_vivienda} 
          onChange={handleChange} 
        >
          <option value="Chalet">Chalet</option>
          <option value="Piso">Piso</option>
          <option value="Industrial / Nave">Industrial / Nave</option>
          <option value="Oficina / Local">Oficina / Local</option>
        </select>
      </div>

      <button type="submit" className="boton-formulario">
        Guardar Cliente
      </button>
    </form>
  </div>
)};

export default NewCustomer;
