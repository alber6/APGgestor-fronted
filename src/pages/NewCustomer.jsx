import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomers, createCustomerRequest } from '../services/api';
import CustomerForm, { TIPOS_VIA } from '../components/CustomerForm';

export { TIPOS_VIA };

const NewCustomer = () => {
  const [ initialData, setInitialData ] = useState({
    id_cliente: '',
    tipo_via: 'CALLE',
    rep_tipo_via: 'CALLE',
    es_empresa: false
  });

  const [ mensaje, setMensaje ] = useState(null);
  const [ cargandoId, setCargandoId ] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getCustomers()
      .then((response) => {
        const listaClientes = response.data;
        let idMasAlto = 101; 
        
        listaClientes.forEach(c => {
          if (c.id_cliente && c.id_cliente > idMasAlto) {
            idMasAlto = c.id_cliente;
          }
        });

        const siguienteId = idMasAlto + 1;
        setInitialData(prev => ({
          ...prev,
          id_cliente: String(siguienteId)
        }));
        setCargandoId(false);
      })
      .catch((err) => {
        console.error("Error calculando el siguiente ID:", err);
        setInitialData(prev => ({ ...prev, id_cliente: '102' }));
        setCargandoId(false);
      });
  }, []);

  const handleSubmit = async (data) => {
    try {
      await createCustomerRequest({
        ...data,
        id_cliente: Number(data.id_cliente)
      });

      setMensaje({ 
        tipo: 'exito', 
        texto: '¡Cliente registrado con éxito en APGgestor!' 
      });
      
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
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
      <p className="subtitulo-formulario">Introduce los datos fiscales desglosados del titular y su representación legal si aplica.</p>

      {mensaje && (
        <div className={`alerta-sistema ${mensaje.tipo === 'exito' ? 'exito' : 'error'}`}>
          {mensaje.texto}
        </div>
      )}

      <CustomerForm 
        initialData={initialData} 
        onSubmit={handleSubmit} 
        cargandoId={cargandoId}
        buttonText="Guardar Cliente" 
      />
    </div>
  );
};

export default NewCustomer;
