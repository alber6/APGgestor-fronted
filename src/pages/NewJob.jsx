import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCustomers, getOperators, getJobs, createJobRequest } from "../services/api";
import JobForm from "../components/JobForm";

const NewJob = () => {
    const [initialData, setInitialData] = useState({
        id_trabajo: '',
        tipo_instalacion: 'Electricidad General',
        tipo_via_obra: 'CALLE',
        estado: 'Pendiente'
    });

    const [clientes, setClientes] = useState([]);
    const [operarios, setOperarios] = useState([]);
    const [mensaje, setMensaje] = useState(null);
    const [cargando, setCargando] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([getCustomers(), getOperators(), getJobs()]).then(([resClientes, resOperarios, resJobs]) => {
            setClientes(resClientes.data);
            setOperarios(resOperarios.data);

            let idMasAlto = 101;
            resJobs.data.forEach(job => {
                if (job.id_trabajo && job.id_trabajo > idMasAlto){
                    idMasAlto = job.id_trabajo;
                }
            });

            setInitialData(prev => ({
                ...prev,
                id_trabajo: String(idMasAlto + 1),
                cliente: resClientes.data[0]?._id || '',
                operario: resOperarios.data[0]?._id || ''
            }));

            setCargando(false);
        })
        .catch((error) => {
            console.error("Error al cargar los datos del formulario:", error);
            setMensaje({tipo: 'error', texto: 'Error al conectar con la base de datos.'});
            setCargando(false);
        });
    }, []);

    const handleSubmit = async (data) => {
      try {
        await createJobRequest({
          ...data,
          id_trabajo: Number(data.id_trabajo),
          precio: Number(data.precio)
        });

        setMensaje({ tipo: 'exito', texto: `¡Orden de trabajo #${data.id_trabajo} creada con éxito!` });
        
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
        <p className="subtitulo-formulario">Completa la ubicación física desglosada de la obra y asigna un cliente maestro a un operario.</p>

        {mensaje && (
          <div className={`alerta-sistema ${mensaje.tipo === 'exito' ? 'exito' : 'error'}`}>
            {mensaje.texto}
          </div>
        )}

        <JobForm 
          initialData={initialData}
          clientes={clientes}
          operarios={operarios}
          onSubmit={handleSubmit}
          cargandoId={cargando}
          buttonText="Crear y Asignar Trabajo"
        />
      </div>
    );
};

export default NewJob;
