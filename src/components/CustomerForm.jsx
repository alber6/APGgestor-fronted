import React, { useState, useEffect } from 'react';

export const TIPOS_VIA = [
  "CALLE", "ACCESO", "ACUEDUCTO", "AERODROMO", "AEROPUERTO", "ALAMEDA", "ALMACEN",
  "ALTO", "APARTAMENTO", "ARROYO", "AUTOVIA", "AVENIDA", "BAJADA", "BARRANCO",
  "BARRIADA", "BARRIO", "BASILICA", "BLOQUE", "BULEVAR", "CALLEJA", "CALLEJON",
  "CAMINO", "CAMPAMENTO", "CANAL", "CANTON", "CAÑADA", "CARRERA", "CARRETERA",
  "CARRIL", "CERRO", "COLONIA", "COSTANILLA", "CUESTA", "DEHESA", "FINCA",
  "GLORIETA", "GRAN VIA", "PARAJE", "PARCELA", "PARQUE", "PASADIZO", "PASAJE",
  "PASEO", "PLAZA", "PLAZUELA", "POBLADO", "POLIGONO", "RINCON", "RINCONADA",
  "RONDA", "ROTONDA", "SECTOR", "SENDA", "TRASERA", "TRAVESIA", "URBANIZACION", "VEREDA"
];

export const TIPOS_VIVIENDA = [
  "AUTOCONSUMO",
  "LOCALES HÚMEDOS",
  "LOCALES POLVORIENTOS",
  "LOCALES CON RIESGO DE CORROSIÓN",
  "BOMBAS DE EXTRACCIÓN O ELEVACIÓN DE AGUA",
  "LOCAL MOJADO",
  "GENERACION SOLAR FOTOVOLTAICA",
  "GENERACION SOLAR TERMOELÉCTRICA",
  "AEROGENERADORES",
  "GENERACION GRUPOS ELECTRÓGENOS FIJOS",
  "GRUPOS ELECTRÓGENOS PORTÁTILES",
  "COGENERACIÓN",
  "CONVERTIDORES",
  "CONDUCTORES AISLADOS PARA CALDEO",
  "TEMP. ALIMENTA MAQUINA OBRAS CONSTRUCCIÓN",
  "TEMP. EN LOCALES O EMPLAZAMIENTOS ABIERTOS",
  "VIVIENDA",
  "LOCAL/OFICINA (NO LPC)",
  "INSTALACIONES DE ENLACE",
  "INSTALACIONES COMUNES",
  "GARAJE VENTILACIÓN FORZADA",
  "GARAJE VENTILACIÓN NATURAL",
  "LPC - CINES",
  "LPC- TEATROS",
  "LPC- AUDITORIOS",
  "LPC- PLAZAS DE TOROS",
  "LPC- HIPÓDROMOS",
  "LPC- PARQUES DE ATRACCIONES",
  "LPC- SALAS DE FIESTA",
  "LPC- DISCOTECAS",
  "LPC- SALAS DE JUEGOS DE AZAR",
  "LPC- ESTADIOS Y PABELLONES DEPORTIVOS",
  "LPC- CANODROMOS",
  "LPC- PARQUES ACUATICOS",
  "LPC- FERIAS FIJAS",
  "LPC- BINGOS",
  "LPC- CIRCOS",
  "LPC- OTROS",
  "LPC- TEMPLOS",
  "LPC- MUSEOS",
  "LPC- SALAS DE CONFERENCIAS Y CONGRESOS",
  "LPC- CASINOS",
  "LPC- HOTELES",
  "LPC- HOSTALES",
  "LPC- BARES, RESTAURANTES O SIMILARES",
  "LPC- ASILOS",
  "LPC- GUARDERÍAS",
  "LPC- HOSPITALES, CLÍNICAS, AMBUL., CENTROS SALUD",
  "LPC- ESTACIONES DE VIAJEROS",
  "LPC- ESTACIONAMIENTOS SUBTERRÁNEOS",
  "LPC- ESTABLECIMIENTOS COMERCIALES",
  "LPC- AGRUP. ESTAB. EN CENTROS COMERCIALES",
  "LPC- AEROPUERTOS",
  "LPC- BIBLIOTECAS",
  "LPC- CLUBES SOCIALES Y DEPORTIVOS",
  "LPC- CENTROS DE ENSEÑANZA",
  "LPC- CONSULTORIOS MÉDICOS",
  "LPC- OFICINAS CON PRESENCIA DE PÚBLICO",
  "LPC- RESIDENCIAS DE ESTUDIANTES",
  "LPC- GIMNASIOS",
  "LPC- SALAS DE EXPOSICIONES",
  "LPC- CENTROS CULTURALES",
  "LPC-OTROS LOCALES BD2/BD3/BD4",
  "LPC- OTROS (OCUPACIÓN > 100)",
  "MÁQUINAS DE ELEVACIÓN Y TRANSPORTE",
  "INSTALACIONES QUE UTILICEN TENSIONES ESPECIALES",
  "DESTINADAS A RÓTULOS LUMINOSOS",
  "CERCAS ELÉCTRICAS",
  "ALUMBRADO EXTERIOR PÚBLICO",
  "ALUMBRADO EXTERIOR PRIVADO",
  "MOBILIARIO URBANO",
  "LOCAL CON RIESGO INCENDIO O EXPLOSIÓN, NO GARAJE",
  "QUIROFANOS Y SALAS DE INTERVENCION",
  "PISCINAS",
  "FUENTES",
  "INFRAESTRUCTURA DE RECARGA VEHICULO ELECTRICO",
  "INDUSTRIAS Y OTROS ESTABLECIMIENTOS INDUSTRIALES",
  "OTRAS NO CONTEMPLADAS"
];

const CustomerForm = ({ initialData, onSubmit, cargandoId = false, buttonText = "Guardar Cliente" }) => {
  const [formData, setFormData] = useState({
    id_cliente: initialData?.id_cliente || '',
    nif: initialData?.nif || '',
    nombre: initialData?.nombre || '',
    nombre_referencia: initialData?.nombre_referencia || '',
    apellido1: initialData?.apellido1 || '',
    apellido2: initialData?.apellido2 || '',
    telefono: initialData?.telefono || '',
    email: initialData?.email || '',
    tipo_via: initialData?.tipo_via || 'CALLE',
    nombre_via: initialData?.nombre_via || '',
    numero: initialData?.numero || '',
    bloque: initialData?.bloque || '',
    portal: initialData?.portal || '',
    escalera: initialData?.escalera || '',
    piso: initialData?.piso || '',
    puerta: initialData?.puerta || '',
    localidad: initialData?.localidad || '',
    provincia: initialData?.provincia || '',
    cp: initialData?.cp || '',
    tipo_vivienda: initialData?.tipo_vivienda || 'Piso',
    es_empresa: initialData?.es_empresa || false,
    representante_nombre: initialData?.representante_nombre || '',
    representante_apellido1: initialData?.representante_apellido1 || '',
    representante_apellido2: initialData?.representante_apellido2 || '',
    representante_nif: initialData?.representante_nif || '',
    rep_correo: initialData?.rep_correo || '',
    rep_tipo_via: initialData?.rep_tipo_via || 'CALLE',
    rep_nombre_via: initialData?.rep_nombre_via || '',
    rep_numero: initialData?.rep_numero || '',
    rep_bloque: initialData?.rep_bloque || '',
    rep_portal: initialData?.rep_portal || '',
    rep_escalera: initialData?.rep_escalera || '',
    rep_piso: initialData?.rep_piso || '',
    rep_puerta: initialData?.rep_puerta || '',
    rep_localidad: initialData?.rep_localidad || '',
    rep_provincia: initialData?.rep_provincia || '',
    rep_cp: initialData?.rep_cp || '',
    rep_tel_fijo: initialData?.rep_tel_fijo || '',
    rep_tel_movil: initialData?.rep_tel_movil || ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        nombre_referencia: initialData.nombre_referencia || '',
        tipo_via: initialData.tipo_via || 'CALLE',
        rep_tipo_via: initialData.rep_tipo_via || 'CALLE',
        tipo_vivienda: initialData.tipo_vivienda || 'Piso'
      }));
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const direccionCalculada = `${formData.tipo_via || 'CALLE'} ${formData.nombre_via || ''} ${formData.numero || ''}`.trim();
    onSubmit({
      ...formData,
      direccion_fiscal: direccionCalculada
    });
  };

  return (
    <form onSubmit={handleSubmit} className="tarjeta-formulario-blanca">

      {formData.id_cliente && (
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
      )}

      {/* CHECKBOX EMPRESA / PERSONA JURÍDICA */}
      <div className="campo-formulario" style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold', margin: 0 }}>
          <input
            type="checkbox"
            name="es_empresa"
            checked={formData.es_empresa}
            onChange={handleChange}
            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
          />
          🏢 ¿El cliente es una empresa o entidad jurídica?
        </label>
        <small style={{ color: '#64748b', display: 'block', marginTop: '6px' }}>
          Marca esta casilla si el titular es una empresa, ayuntamiento o sociedad que requiere datos de Representante Legal.
        </small>
      </div>

      {/* DESPLIEGUE CONDICIONAL DE CAMPOS DE REPRESENTANTE LEGAL */}
      {formData.es_empresa && (
        <div style={{ background: '#f0f9ff', padding: '16px', borderRadius: '8px', border: '1px solid #bae6fd', marginBottom: '20px' }}>
          <h4 style={{ color: '#0369a1', margin: '0 0 12px 0' }}>👤 Datos del Representante Legal</h4>

          <div className="campo-formulario">
            <label>Nombre del Representante:</label>
            <input
              type="text"
              name="representante_nombre"
              value={formData.representante_nombre}
              onChange={handleChange}
              required={formData.es_empresa}
              placeholder="Ej: Manuel"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="campo-formulario">
              <label>Primer Apellido:</label>
              <input
                type="text"
                name="representante_apellido1"
                value={formData.representante_apellido1}
                onChange={handleChange}
                required={formData.es_empresa}
                placeholder="Ej: García"
              />
            </div>

            <div className="campo-formulario">
              <label>Segundo Apellido:</label>
              <input
                type="text"
                name="representante_apellido2"
                value={formData.representante_apellido2}
                onChange={handleChange}
                placeholder="Ej: López"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="campo-formulario">
              <label>NIF / DNI del Representante:</label>
              <input
                type="text"
                name="representante_nif"
                value={formData.representante_nif}
                onChange={handleChange}
                required={formData.es_empresa}
                placeholder="Ej: 87654321X"
              />
            </div>

            <div className="campo-formulario">
              <label>Correo Electrónico (Representante):</label>
              <input
                type="email"
                name="rep_correo"
                value={formData.rep_correo}
                onChange={handleChange}
                placeholder="Ej: representante@empresa.com"
              />
            </div>
          </div>

          {/* DIRECCIÓN DE NOTIFICACIÓN DEL REPRESENTANTE */}
          <h5 style={{ color: '#0284c7', margin: '14px 0 8px 0' }}>📍 Domicilio del Representante</h5>

          {/* Fila 1: Tipo de Vía (30%) + Nombre de la Vía (70%) */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 7fr', gap: '10px' }}>
            <div className="campo-formulario">
              <label>Tipo de Vía:</label>
              <select name="rep_tipo_via" value={formData.rep_tipo_via} onChange={handleChange}>
                {TIPOS_VIA.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div className="campo-formulario">
              <label>Nombre de la Vía:</label>
              <input
                type="text"
                name="rep_nombre_via"
                value={formData.rep_nombre_via}
                onChange={handleChange}
                placeholder="Ej: Gran Vía"
              />
            </div>
          </div>

          {/* Fila 2: Número, Bloque, Portal, Escalera, Piso, Puerta */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
            <div className="campo-formulario">
              <label>Número:</label>
              <input type="text" name="rep_numero" value={formData.rep_numero} onChange={handleChange} placeholder="Ej: 24" />
            </div>
            <div className="campo-formulario">
              <label>Bloque:</label>
              <input type="text" name="rep_bloque" value={formData.rep_bloque} onChange={handleChange} placeholder="Ej: 1" />
            </div>
            <div className="campo-formulario">
              <label>Portal:</label>
              <input type="text" name="rep_portal" value={formData.rep_portal} onChange={handleChange} placeholder="Ej: A" />
            </div>
            <div className="campo-formulario">
              <label>Escalera:</label>
              <input type="text" name="rep_escalera" value={formData.rep_escalera} onChange={handleChange} placeholder="Ej: Izq" />
            </div>
            <div className="campo-formulario">
              <label>Piso:</label>
              <input type="text" name="rep_piso" value={formData.rep_piso} onChange={handleChange} placeholder="Ej: 3º" />
            </div>
            <div className="campo-formulario">
              <label>Puerta:</label>
              <input type="text" name="rep_puerta" value={formData.rep_puerta} onChange={handleChange} placeholder="Ej: B" />
            </div>
          </div>

          {/* Fila 3: Localidad, Provincia, Código Postal */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div className="campo-formulario">
              <label>Localidad:</label>
              <input type="text" name="rep_localidad" value={formData.rep_localidad} onChange={handleChange} placeholder="Ej: Madrid" />
            </div>
            <div className="campo-formulario">
              <label>Provincia:</label>
              <input type="text" name="rep_provincia" value={formData.rep_provincia} onChange={handleChange} placeholder="Ej: Madrid" />
            </div>
            <div className="campo-formulario">
              <label>Código Postal:</label>
              <input type="text" name="rep_cp" value={formData.rep_cp} onChange={handleChange} placeholder="Ej: 28001" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="campo-formulario">
              <label>Teléfono Fijo:</label>
              <input type="tel" name="rep_tel_fijo" value={formData.rep_tel_fijo} onChange={handleChange} placeholder="Ej: 912345678" />
            </div>
            <div className="campo-formulario">
              <label>Teléfono Móvil:</label>
              <input type="tel" name="rep_tel_movil" value={formData.rep_tel_movil} onChange={handleChange} placeholder="Ej: 600111222" />
            </div>
          </div>
        </div>
      )}

      {/* DATOS FISCALES DEL TITULAR */}
      <h3 style={{ color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px', marginBottom: '14px' }}>📋 Datos Fiscales del Titular</h3>

      <div className="campo-formulario">
        <label>NIF / CIF Titular (Requerido):</label>
        <input
          type="text"
          name="nif"
          value={formData.nif}
          onChange={handleChange}
          required
          placeholder="Ej: B12345678 o 12345678Z"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div className="campo-formulario">
          <label>Nombre / Razón Social (Requerido):</label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            placeholder="Ej: Juan o Constructora del Norte S.L."
          />
        </div>

        <div className="campo-formulario">
          <label>Ref. Obra / Cliente (Nombre Referencia):</label>
          <input
            type="text"
            name="nombre_referencia"
            value={formData.nombre_referencia}
            onChange={handleChange}
            placeholder="Ej: Reforma Local Centro, Casa Campo..."
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div className="campo-formulario">
          <label>Primer Apellido (Titular):</label>
          <input
            type="text"
            name="apellido1"
            value={formData.apellido1}
            onChange={handleChange}
            placeholder="Ej: Pérez"
          />
        </div>

        <div className="campo-formulario">
          <label>Segundo Apellido (Titular):</label>
          <input
            type="text"
            name="apellido2"
            value={formData.apellido2}
            onChange={handleChange}
            placeholder="Ej: Gómez"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div className="campo-formulario">
          <label>Teléfono de Contacto:</label>
          <input
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
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
            placeholder="Ej: contacto@cliente.com"
          />
        </div>
      </div>

      {/* DESGLOSE GRANULAR DIRECCIÓN FISCAL DEL TITULAR */}
      <h4 style={{ color: '#0f172a', marginTop: '16px', marginBottom: '8px' }}>📍 Domicilio Fiscal del Titular</h4>

      {/* Fila 1: Tipo de Vía (Select 30%) + Nombre de la Vía (Text 70%) */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 7fr', gap: '10px' }}>
        <div className="campo-formulario">
          <label>Tipo de Vía:</label>
          <select name="tipo_via" value={formData.tipo_via} onChange={handleChange}>
            {TIPOS_VIA.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        <div className="campo-formulario">
          <label>Nombre de la Vía:</label>
          <input
            type="text"
            name="nombre_via"
            value={formData.nombre_via}
            onChange={handleChange}
            placeholder="Ej: Gran Vía"
          />
        </div>
      </div>

      {/* Fila 2: Número, Bloque, Portal, Escalera, Piso, Puerta */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
        <div className="campo-formulario">
          <label>Número:</label>
          <input type="text" name="numero" value={formData.numero} onChange={handleChange} placeholder="Ej: 12" />
        </div>
        <div className="campo-formulario">
          <label>Bloque:</label>
          <input type="text" name="bloque" value={formData.bloque} onChange={handleChange} placeholder="Ej: 1" />
        </div>
        <div className="campo-formulario">
          <label>Portal:</label>
          <input type="text" name="portal" value={formData.portal} onChange={handleChange} placeholder="Ej: A" />
        </div>
        <div className="campo-formulario">
          <label>Escalera:</label>
          <input type="text" name="escalera" value={formData.escalera} onChange={handleChange} placeholder="Ej: Izq" />
        </div>
        <div className="campo-formulario">
          <label>Piso:</label>
          <input type="text" name="piso" value={formData.piso} onChange={handleChange} placeholder="Ej: 3º" />
        </div>
        <div className="campo-formulario">
          <label>Puerta:</label>
          <input type="text" name="puerta" value={formData.puerta} onChange={handleChange} placeholder="Ej: B" />
        </div>
      </div>

      {/* Fila 3: Localidad, Provincia, Código Postal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        <div className="campo-formulario">
          <label>Localidad:</label>
          <input type="text" name="localidad" value={formData.localidad} onChange={handleChange} placeholder="Ej: Madrid" />
        </div>
        <div className="campo-formulario">
          <label>Provincia:</label>
          <input type="text" name="provincia" value={formData.provincia} onChange={handleChange} placeholder="Ej: Madrid" />
        </div>
        <div className="campo-formulario">
          <label>Código Postal:</label>
          <input type="text" name="cp" value={formData.cp} onChange={handleChange} placeholder="Ej: 28001" />
        </div>
      </div>

      <div className="campo-formulario" style={{ marginTop: '12px' }}>
        <label>Tipo de vivienda/local:</label>
        <select
          name="tipo_vivienda"
          value={formData.tipo_vivienda}
          onChange={handleChange}
        >
          {TIPOS_VIVIENDA.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <button type="submit" className="boton-formulario" style={{ marginTop: '16px', width: '100%' }}>
        {buttonText}
      </button>
    </form>
  );
};

export default CustomerForm;
