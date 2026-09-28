import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCustomers, getOperators, getJobs, createJobRequest } from "../services/api";

const NewJob = () => {
    const [formData, setFormData] = useState({
        id_trabajo: '',
        tipo_instalacion: 'Instalacion Eléctrica General', //por defecto
        cliente: '', // se guarda el id de mongo del cliente
        operario: '', //se guarda el id de mongo del operario
        precio: '',
        estado: 'Pendiente' // toda obra empieza en pendiente
    });

    const [clientes, setClientes] = useState([]);
    const [operarios, setOperarios] = useState([]);
    const [mensaje, setMensaje] = useState(null);
    const [cargando, setCargando] = useState(true);
    const navigate = useNavigate();

    // al cargar la pantalla cargaremos los clientes, operarios y calculamos el id del trabajo
    useEffect(() => {
        //lanzar 3 peticiones en paralelo para que vaya rápido
        Promise.all([getCustomers(), getOperators(), getJobs()]).then(([resClientes, resOperarios, resJobs]) => {
            setClientes(resClientes.data);
            setOperarios(resOperarios.data);

            //calculamos el id correlativo del trabajo basado en el csv
            let idMasAlto = 101;
            resJobs.data.forEach(job => {
                if (job.id_trabajo && job.id_trabajo > idMasAlto){
                    idMasAlto = job.id_trabajo;
                }
            });

            setFormData(prev => ({
                ...prev,
                id_trabajo: String(idMasAlto + 1),
                cliente: resClientes.data[0]?._id || '', //preseleccionar el primer cliente si existe
                operario: resOperarios.data[0]?._id || '' //preselecciona el primer operario si existe
            }));

            setCargando(false);
        })
        .catch((error) => {
            console.error("Error al cargar los datos del formulario:", error);
            setMensaje({tipo: 'error', texto: 'Error al conectar con la base de datos.'});
            setCargando(false);
        })
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };
    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Enviamos la orden de trabajo transformando ID y precio a números
      await createJobRequest({
        ...formData,
        id_trabajo: Number(formData.id_trabajo),
        precio: Number(formData.precio)
      });

      setMensaje({ tipo: 'exito', texto: `¡Orden de trabajo #${formData.id_trabajo} creada con éxito!` });
      
      // Tras 2 segundos, volvemos al Panel Principal para ver la obra en la tabla
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error("Error al crear la orden de trabajo:", error);
      setMensaje({ tipo: 'error', texto: 'Hubo un fallo al guardar la orden de trabajo.' });
    }
  };

  if (cargando) return <div style={{ padding: '20px' }}>⏳ Preparando entorno de trabajo inteligente...</div>;

return (
  <div className="vista-formulario">
    <h2>📝 Nueva Orden de Trabajo</h2>
    <p className="subtitulo-formulario">Asigna un cliente de la base de datos a un operario disponible.</p>

    {/* ALERTAS SEMÁNTICAS REUTILIZABLES */}
    {mensaje && (
      <div className={`alerta-sistema ${mensaje.tipo === 'exito' ? 'exito' : 'error'}`}>
        {mensaje.texto}
      </div>
    )}

    {/* FORMULARIO ESTILIZADO CON EL SISTEMA INTEGRADO */}
    <form onSubmit={handleSubmit} className="tarjeta-formulario-blanca">
      
      <div className="campo-formulario">
        <label>ID Trabajo (Automático):</label>
        <input 
          type="number" 
          name="id_trabajo" 
          value={formData.id_trabajo} 
          disabled={true} 
        />
      </div>

      <div className="campo-formulario">
        <label>Seleccionar Cliente Maestro:</label>
        <select name="cliente" value={formData.cliente} onChange={handleChange}>
          {clientes.map(c => (
            <option key={c._id} value={c._id}>#{c.id_cliente} - {c.nombre}</option>
          ))}
        </select>
      </div>

      <div className="campo-formulario">
        <label>Operario Asignado:</label>
        <select name="operario" value={formData.operario} onChange={handleChange}>
          {operarios.map(op => (
            <option key={op._id} value={op._id}>{op.nombre}</option>
          ))}
        </select>
      </div>

      <div className="campo-formulario">
        <label>Tipo de Tarea / Instalación:</label>
        <select name="tipo_instalacion" value={formData.tipo_instalacion} onChange={handleChange}>
          <option value="Electricidad General">Electricidad General</option>
          <option value="Placas Solares">Placas Solares</option>
          <option value="Cargador Coche">Cargador Coche</option>
          <option value="Domótica">Domótica</option>
          <option value="Avería">Avería</option>
        </select>
      </div>

      <div className="campo-formulario">
        <label>Precio del Presupuesto (€):</label>
        <input 
          type="number" 
          name="precio" 
          value={formData.precio} 
          onChange={handleChange} 
          required 
          placeholder="Ej: 1200" 
          min="0" 
        />
      </div>

      {/* 📌 NUEVO CAMPO: Agregamos el área de texto para las notas iniciales de la obra */}
      <div className="campo-formulario">
        <label>Notas / Instrucciones Especiales:</label>
        <textarea
          name="notas"
          value={formData.notas || ''}
          onChange={handleChange}
          placeholder="Ej: El inversor está en el garaje. Llevar escalera de extensión..."
          rows="3"
        />
      </div>

      <button type="submit" className="boton-formulario">
        Crear y Asignar Trabajo
      </button>
    </form>
  </div>
)};

export default NewJob;
