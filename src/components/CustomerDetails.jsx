import React from 'react';

export const formatearDireccion = (c) => {
  if (!c) return '---';

  const partes = [];
  const via = c.tipo_via || '';
  const nombreVia = c.nombre_via || '';

  if (via || nombreVia) {
    partes.push(`${via} ${nombreVia}`.trim());
  }

  if (c.numero) partes.push(`Nº ${c.numero}`);
  if (c.bloque) partes.push(`Bloque ${c.bloque}`);
  if (c.portal) partes.push(`Portal ${c.portal}`);
  if (c.escalera) partes.push(`Escalera ${c.escalera}`);
  if (c.piso) partes.push(`Piso ${c.piso}`);
  if (c.puerta) partes.push(`Puerta ${c.puerta}`);

  if (partes.length > 0) {
    return partes.join(', ');
  }

  return c.direccion_fiscal || c.direccion || '---';
};

export const formatearDireccionRepresentante = (c) => {
  if (!c || !c.es_empresa) return '';
  const partes = [];
  if (c.rep_tipo_via || c.rep_nombre_via) {
    partes.push(`${c.rep_tipo_via || ''} ${c.rep_nombre_via || ''}`.trim());
  }
  if (c.rep_numero) partes.push(`Nº ${c.rep_numero}`);
  if (c.rep_bloque) partes.push(`Bloque ${c.rep_bloque}`);
  if (c.rep_portal) partes.push(`Portal ${c.rep_portal}`);
  if (c.rep_escalera) partes.push(`Escalera ${c.rep_escalera}`);
  if (c.rep_piso) partes.push(`Piso ${c.rep_piso}`);
  if (c.rep_puerta) partes.push(`Puerta ${c.rep_puerta}`);

  const direccStr = partes.join(', ');
  const ubicaStr = [c.rep_localidad, c.rep_provincia, c.rep_cp ? `(${c.rep_cp})` : ''].filter(Boolean).join(' ');

  if (direccStr && ubicaStr) return `${direccStr} - ${ubicaStr}`;
  return direccStr || ubicaStr || 'No especificado';
};

const CustomerDetails = ({ cliente, onClose }) => {
  if (!cliente) return null;

  const nombreCompletoTitular = `${cliente.nombre || ''} ${cliente.apellido1 || ''} ${cliente.apellido2 || ''}`.trim();
  const direccionFormateada = formatearDireccion(cliente);
  const direccionRepFormateada = formatearDireccionRepresentante(cliente);

  const contenido = (
    <div className="tarjeta-detalle-cliente" style={{ background: '#ffffff', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            👤 {nombreCompletoTitular}
            {cliente.es_empresa && (
              <span style={{ fontSize: '12px', background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                🏢 Entidad Jurídica / Empresa
              </span>
            )}
          </h3>
          <small style={{ color: '#64748b' }}>ID Cliente: #{cliente.id_cliente || 'N/A'}</small>
        </div>
        {onClose && (
          <button onClick={onClose} className="boton-cerrar-modal" style={{ fontSize: '18px', cursor: 'pointer', background: 'none', border: 'none' }}>✖</button>
        )}
      </div>

      {/* RENDERIZADO CONDICIONAL DE DATOS DEL REPRESENTANTE LEGAL */}
      {cliente.es_empresa && (
        <div style={{ background: '#f0f9ff', padding: '16px', borderRadius: '8px', border: '1px solid #bae6fd', marginBottom: '20px' }}>
          <h4 style={{ color: '#0369a1', margin: '0 0 10px 0', fontSize: '16px', borderBottom: '1px solid #bae6fd', paddingBottom: '6px' }}>
            👤 Datos del Representante Legal
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
            <p style={{ margin: 0 }}>
              <strong>Nombre Completo:</strong> {`${cliente.representante_nombre || ''} ${cliente.representante_apellido1 || ''} ${cliente.representante_apellido2 || ''}`.trim() || '---'}
            </p>
            <p style={{ margin: 0 }}>
              <strong>NIF / DNI:</strong> <code>{cliente.representante_nif || '---'}</code>
            </p>
            <p style={{ margin: 0 }}>
              <strong>Correo Representante:</strong> {cliente.rep_correo || '---'}
            </p>
            <p style={{ margin: 0 }}>
              <strong>Teléfonos:</strong> Fijo: {cliente.rep_tel_fijo || '---'} | Móvil: {cliente.rep_tel_movil || '---'}
            </p>
          </div>
          <div style={{ marginTop: '10px', fontSize: '14px', paddingTop: '8px', borderTop: '1px dashed #bae6fd' }}>
            <p style={{ margin: 0 }}>
              <strong>📍 Domicilio del Representante:</strong> {direccionRepFormateada}
            </p>
          </div>
        </div>
      )}

      {/* SECCIÓN INFORMACIÓN FISCAL Y DIRECCIÓN DEL TITULAR */}
      <h4 style={{ color: '#0f172a', margin: '0 0 12px 0', fontSize: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
        📋 Información Fiscal y Domicilio del Titular
      </h4>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px', marginBottom: '14px' }}>
        <p style={{ margin: 0 }}>
          <strong>📄 NIF / CIF:</strong> <code>{cliente.nif || '---'}</code>
        </p>
        <p style={{ margin: 0 }}>
          <strong>🏷️ Ref. Obra/Cliente:</strong> <span style={{ color: '#0284c7', fontWeight: 'bold' }}>{cliente.nombre_referencia || '---'}</span>
        </p>
        <p style={{ margin: 0 }}>
          <strong>📞 Teléfono Contacto:</strong> {cliente.telefono || '---'}
        </p>
        <p style={{ margin: 0 }}>
          <strong>📧 Correo Electrónico:</strong> {cliente.email || '---'}
        </p>
        <p style={{ margin: 0 }}>
          <strong>🏠 Tipo Inmueble:</strong> {cliente.tipo_vivienda || '---'}
        </p>
      </div>

      <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }}>
        <p style={{ margin: '0 0 6px 0', color: '#1e293b' }}>
          <strong>🏛️ Dirección Fiscal:</strong> {direccionFormateada}
        </p>
        {(cliente.localidad || cliente.provincia || cliente.cp) && (
          <p style={{ margin: 0, color: '#64748b' }}>
            <strong>📍 Ubicación:</strong> {[cliente.localidad, cliente.provincia, cliente.cp ? `(${cliente.cp})` : ''].filter(Boolean).join(' ')}
          </p>
        )}
      </div>
    </div>
  );

  if (onClose) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-contenido" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', padding: '0', border: 'none', background: 'transparent' }}>
          {contenido}
        </div>
      </div>
    );
  }

  return contenido;
};

export default CustomerDetails;
