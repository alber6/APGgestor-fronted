import React, { useState, useEffect } from 'react';
import { TIPOS_VIA } from './CustomerForm';

const JobForm = ({ 
  initialData, 
  clientes = [], 
  operarios = [], 
  onSubmit, 
  cargandoId = false, 
  buttonText = "Crear y Asignar Trabajo" 
}) => {
  const [formData, setFormData] = useState({
    id_trabajo: initialData?.id_trabajo || '',
    tipo_instalacion: initialData?.tipo_instalacion || 'Electricidad General',
    tipo_via_obra: initialData?.tipo_via_obra || 'CALLE',
    nombre_via_obra: initialData?.nombre_via_obra || '',
    numero_obra: initialData?.numero_obra || '',
    bloque_obra: initialData?.bloque_obra || '',
    portal_obra: initialData?.portal_obra || '',
    escalera_obra: initialData?.escalera_obra || '',
    piso_obra: initialData?.piso_obra || '',
    puerta_obra: initialData?.puerta_obra || '',
    localidad_obra: initialData?.localidad_obra || '',
    cp_obra: initialData?.cp_obra || '',
    provincia_obra: initialData?.provincia_obra || '',
    cliente: initialData?.cliente?._id || initialData?.cliente || (clientes[0]?._id || ''),
    operario: initialData?.operario?._id || initialData?.operario || (operarios[0]?._id || ''),
    precio: initialData?.precio || '',
    estado: initialData?.estado || 'Pendiente',
    notas: initialData?.notas || ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        tipo_via_obra: initialData.tipo_via_obra || 'CALLE',
        cliente: initialData.cliente?._id || initialData.cliente || (clientes[0]?._id || ''),
        operario: initialData.operario?._id || initialData.operario || (operarios[0]?._id || '')
      }));
    }
  }, [initialData, clientes, operarios]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const direccionCalculada = `${formData.tipo_via_obra || 'CALLE'} ${formData.nombre_via_obra || ''} ${formData.numero_obra || ''}`.trim();
    onSubmit({
      ...formData,
      direccion_obra: direccionCalculada
    });
  };

  return (
    <form onSubmit={handleSubmit} className="tarjeta-formulario-blanca">
      
      {formData.id_trabajo && (
        <div className="campo-formulario">
          <label>ID Trabajo (Automático):</label>
          <input 
            type="number" 
            name="id_trabajo" 
            value={formData.id_trabajo} 
            onChange={handleChange}
            disabled={true} 
            placeholder={cargandoId ? "Calculando ID..." : ""}
          />
        </div>
      )}

      {clientes.length > 0 && (
        <div className="campo-formulario">
          <label>Seleccionar Cliente Maestro:</label>
          <select name="cliente" value={formData.cliente} onChange={handleChange} required>
            <option value="">-- Seleccionar Cliente --</option>
            {clientes.map(c => (
              <option key={c._id} value={c._id}>
                {c.nombre} {c.apellido1 || ''} {c.apellido2 || ''} {c.nif ? ` - ${c.nif}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* SECCIÓN DATOS FÍSICOS DEL EMPLAZAMIENTO DE LA OBRA (DESGLOSADO) */}
      <h4 style={{ color: '#0f172a', marginTop: '16px', marginBottom: '8px' }}>📍 Emplazamiento de la Obra (Ubicación Física)</h4>

      {/* Fila 1: Tipo de Vía (30%) + Nombre de la Vía (70%) */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 7fr', gap: '10px' }}>
        <div className="campo-formulario">
          <label>Tipo de Vía:</label>
          <select name="tipo_via_obra" value={formData.tipo_via_obra} onChange={handleChange}>
            {TIPOS_VIA.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        <div className="campo-formulario">
          <label>Nombre de la Vía de la Obra:</label>
          <input 
            type="text" 
            name="nombre_via_obra" 
            value={formData.nombre_via_obra} 
            onChange={handleChange} 
            placeholder="Ej: Mayor" 
            required
          />
        </div>
      </div>

      {/* Fila 2: Número, Bloque, Portal, Escalera, Piso, Puerta */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
        <div className="campo-formulario">
          <label>Número:</label>
          <input type="text" name="numero_obra" value={formData.numero_obra} onChange={handleChange} placeholder="Ej: 12" />
        </div>
        <div className="campo-formulario">
          <label>Bloque:</label>
          <input type="text" name="bloque_obra" value={formData.bloque_obra} onChange={handleChange} placeholder="Ej: 1" />
        </div>
        <div className="campo-formulario">
          <label>Portal:</label>
          <input type="text" name="portal_obra" value={formData.portal_obra} onChange={handleChange} placeholder="Ej: A" />
        </div>
        <div className="campo-formulario">
          <label>Escalera:</label>
          <input type="text" name="escalera_obra" value={formData.escalera_obra} onChange={handleChange} placeholder="Ej: Izq" />
        </div>
        <div className="campo-formulario">
          <label>Piso:</label>
          <input type="text" name="piso_obra" value={formData.piso_obra} onChange={handleChange} placeholder="Ej: 3º" />
        </div>
        <div className="campo-formulario">
          <label>Puerta:</label>
          <input type="text" name="puerta_obra" value={formData.puerta_obra} onChange={handleChange} placeholder="Ej: B" />
        </div>
      </div>

      {/* Fila 3: Localidad, Provincia, Código Postal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        <div className="campo-formulario">
          <label>Localidad de la Obra:</label>
          <input 
            type="text" 
            name="localidad_obra" 
            value={formData.localidad_obra} 
            onChange={handleChange} 
            placeholder="Ej: Madrid" 
          />
        </div>

        <div className="campo-formulario">
          <label>Provincia de la Obra:</label>
          <input 
            type="text" 
            name="provincia_obra" 
            value={formData.provincia_obra} 
            onChange={handleChange} 
            placeholder="Ej: Madrid" 
          />
        </div>

        <div className="campo-formulario">
          <label>CP de la Obra:</label>
          <input 
            type="text" 
            name="cp_obra" 
            value={formData.cp_obra} 
            onChange={handleChange} 
            placeholder="Ej: 28001" 
          />
        </div>
      </div>

      {operarios.length > 0 && (
        <div className="campo-formulario" style={{ marginTop: '12px' }}>
          <label>Operario Asignado:</label>
          <select name="operario" value={formData.operario} onChange={handleChange}>
            {operarios.map(op => (
              <option key={op._id} value={op._id}>{op.nombre}</option>
            ))}
          </select>
        </div>
      )}

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

      {initialData?.estado && (
        <div className="campo-formulario">
          <label>Estado de la Obra:</label>
          <select name="estado" value={formData.estado} onChange={handleChange}>
            <option value="Pendiente">⏳ Pendiente</option>
            <option value="En proceso">⚡ En proceso</option>
            <option value="Esperando Material">📦 Esperando Material</option>
            <option value="Finalizado">✅ Finalizado</option>
          </select>
        </div>
      )}

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

      <button type="submit" className="boton-formulario" style={{ marginTop: '16px', width: '100%' }}>
        {buttonText}
      </button>
    </form>
  );
};

export default JobForm;
