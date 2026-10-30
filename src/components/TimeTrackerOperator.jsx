import React, { useState, useEffect } from 'react';
import { punchTimeRecord, getCurrentTimeState } from '../services/api';
import LeaveRequestOperator from './LeaveRequestOperator';

const TimeTrackerOperator = () => {
  const [estadoActual, setEstadoActual] = useState('FUERA'); // 'TRABAJANDO', 'EN_PAUSA', 'FUERA', 'VACACIONES'
  const [ultimoRegistro, setUltimoRegistro] = useState(null);
  const [registrosHoy, setRegistrosHoy] = useState([]);
  const [minutosHoy, setMinutosHoy] = useState(0);
  const [permisoHoy, setPermisoHoy] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [procesandoFichaje, setProcesandoFichaje] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [horaActual, setHoraActual] = useState(new Date());
  const [gpsStatus, setGpsStatus] = useState({ disponible: false, mensaje: 'Buscando GPS...' });

  // Reloj en tiempo real
  useEffect(() => {
    const timer = setInterval(() => setHoraActual(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Comprobar disponibilidad de geolocalización
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsStatus({
            disponible: true,
            mensaje: `GPS Activo (±${Math.round(pos.coords.accuracy)}m)`,
            coords: { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy }
          });
        },
        (err) => {
          setGpsStatus({
            disponible: false,
            mensaje: 'GPS sin permisos o desactivado (se registrará sin coordenadas)'
          });
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setGpsStatus({ disponible: false, mensaje: 'Navegador no soporta GPS' });
    }
  }, []);

  // Cargar estado inicial desde backend
  const cargarEstado = async () => {
    try {
      const res = await getCurrentTimeState();
      setEstadoActual(res.data.estado || 'FUERA');
      setUltimoRegistro(res.data.ultimoRegistro || null);
      setRegistrosHoy(res.data.registrosHoy || []);
      setMinutosHoy(res.data.minutosTrabajadosHoy || 0);
      setPermisoHoy(res.data.permisoHoy || null);
    } catch (err) {
      console.error('Error al cargar estado de fichaje:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEstado();
  }, []);

  // Obtener coordenadas GPS actuales antes del fichaje
  const obtenerCoordenadas = () => {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        return resolve(null);
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitud: pos.coords.latitude,
            longitud: pos.coords.longitude,
            precision: pos.coords.accuracy,
            capturada: true
          });
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
      );
    });
  };

  // Acción de Fichar (Entrada, Pausa, Reanudar, Salida)
  const ejecutarFichaje = async (tipoAccion, motivoPausa = '') => {
    if (procesandoFichaje) return;
    setProcesandoFichaje(true);
    setMensaje(null);

    try {
      const coords = await obtenerCoordenadas();

      const payload = {
        tipo: tipoAccion,
        geolocalizacion: coords || { capturada: false, direccionAprox: 'Sin GPS directo' },
        observaciones: motivoPausa || ''
      };

      const res = await punchTimeRecord(payload);

      const nombresAcciones = {
        ENTRADA: '¡Entrada registrada correctamente! Que tengas una buena jornada ⚡',
        PAUSA_INICIO: 'Pausa iniciada. Tómate tu descanso ☕',
        PAUSA_FIN: 'Jornada reanudada. ¡A por ello! 🚀',
        SALIDA: '¡Salida registrada con éxito! Descansa, nos vemos mañana 👋'
      };

      setMensaje({
        tipo: 'exito',
        texto: nombresAcciones[tipoAccion] || res.data.message
      });

      // Recargar estado fresco
      await cargarEstado();
    } catch (err) {
      console.error('Error al fichar:', err);
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.message || 'Error al conectar con el servidor para registrar el fichaje.'
      });
    } finally {
      setProcesandoFichaje(false);
      setTimeout(() => setMensaje(null), 6000);
    }
  };

  const formatearHora = (fecha) => {
    if (!fecha) return '--:--';
    return new Date(fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const horas = Math.floor(minutosHoy / 60);
  const minutos = minutosHoy % 60;
  const tiempoFormateado = `${horas}h ${minutos < 10 ? '0' : ''}${minutos}m`;

  return (
    <div className="tarjeta-intratime">
      {/* CABECERA DEL PANEL INTRATIME */}
      <div className="intratime-header">
        <div>
          <span className="intratime-subtitulo">REGISTRO DE JORNADA (RD-ley 8/2019)</span>
          <h3 className="intratime-titulo">⏰ Control Horario Laboral</h3>
        </div>
        <div className="intratime-reloj">
          <span className="reloj-digital">
            {horaActual.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className="reloj-fecha">
            {horaActual.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>

      {/* ESTADO ACTUAL Y GPS */}
      <div className="intratime-estado-barra">
        <div className="estado-indicador">
          <span className="estado-etiqueta">Estado actual:</span>
          {estadoActual === 'TRABAJANDO' && (
            <span className="badge-estado badge-trabajando">
              <span className="punto-pulso verde"></span> TRABAJANDO (Desde {formatearHora(ultimoRegistro?.timestamp)})
            </span>
          )}
          {estadoActual === 'EN_PAUSA' && (
            <span className="badge-estado badge-pausa">
              <span className="punto-pulso amarillo"></span> EN PAUSA (Desde {formatearHora(ultimoRegistro?.timestamp)})
            </span>
          )}
          {estadoActual === 'FUERA' && (
            <span className="badge-estado badge-fuera">
              <span className="punto-pulso gris"></span> FUERA DE JORNADA
            </span>
          )}
          {estadoActual === 'VACACIONES' && (
            <span className="badge-estado badge-vacaciones">
              <span className="punto-pulso azul"></span> VACACIONES / PERMISO
            </span>
          )}
        </div>

        <div className="tiempo-acumulado">
          <span>Tiempo trabajado hoy:</span>
          <strong>{tiempoFormateado}</strong>
        </div>
      </div>

      {/* AVISO INTELIGENTE DE VACACIONES / PERMISO AUTORIZADO */}
      {permisoHoy && (
        <div className="alerta-permiso-autorizado">
          <div className="icono-permiso-banner">🏖️</div>
          <div className="texto-permiso-banner">
            <strong>DÍA DE {permisoHoy.tipo.replace('_', ' ')} AUTORIZADO</strong>
            <p>
              Tienes una ausencia justificada del <strong>{permisoHoy.fechaInicio}</strong> al <strong>{permisoHoy.fechaFin}</strong> autorizada por la administración.
              Hoy no se requieren fichajes obligatorios ni se computa absentismo laboral.
            </p>
          </div>
        </div>
      )}

      {/* INDICADOR GPS */}
      <div className={`intratime-gps-badge ${gpsStatus.disponible ? 'gps-ok' : 'gps-warn'}`}>
        <span>🛰️ {gpsStatus.mensaje}</span>
      </div>

      {/* ALERTA DE MENSAJES */}
      {mensaje && (
        <div className={`alerta-intratime ${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      {/* LOS 3 BOTONES CLAROS Y ERGONÓMICOS TIPO INTRATIME */}
      <div className="intratime-botones-grid">
        
        {/* 1. BOTÓN ENTRADA */}
        <button
          onClick={() => ejecutarFichaje('ENTRADA')}
          disabled={procesandoFichaje || estadoActual === 'TRABAJANDO'}
          className={`boton-intratime boton-entrada ${estadoActual === 'TRABAJANDO' ? 'deshabilitado' : ''}`}
        >
          <div className="icono-boton-intratime">🟢</div>
          <div className="texto-boton-intratime">
            <strong>ENTRADA</strong>
            <small>{estadoActual === 'TRABAJANDO' ? 'Jornada en curso' : 'Iniciar Jornada'}</small>
          </div>
        </button>

        {/* 2. BOTÓN PAUSA / REANUDAR */}
        {estadoActual === 'EN_PAUSA' ? (
          <button
            onClick={() => ejecutarFichaje('PAUSA_FIN')}
            disabled={procesandoFichaje}
            className="boton-intratime boton-reanudar"
          >
            <div className="icono-boton-intratime">▶️</div>
            <div className="texto-boton-intratime">
              <strong>REANUDAR</strong>
              <small>Volver al Trabajo</small>
            </div>
          </button>
        ) : (
          <button
            onClick={() => ejecutarFichaje('PAUSA_INICIO')}
            disabled={procesandoFichaje || estadoActual === 'FUERA'}
            className={`boton-intratime boton-pausa ${estadoActual === 'FUERA' ? 'deshabilitado' : ''}`}
          >
            <div className="icono-boton-intratime">⏸️</div>
            <div className="texto-boton-intratime">
              <strong>PAUSA</strong>
              <small>{estadoActual === 'FUERA' ? 'Requiere Entrada' : 'Descanso / Comida'}</small>
            </div>
          </button>
        )}

        {/* 3. BOTÓN SALIDA */}
        <button
          onClick={() => ejecutarFichaje('SALIDA')}
          disabled={procesandoFichaje || estadoActual === 'FUERA'}
          className={`boton-intratime boton-salida ${estadoActual === 'FUERA' ? 'deshabilitado' : ''}`}
        >
          <div className="icono-boton-intratime">🔴</div>
          <div className="texto-boton-intratime">
            <strong>SALIDA</strong>
            <small>{estadoActual === 'FUERA' ? 'Jornada cerrada' : 'Fin de Jornada'}</small>
          </div>
        </button>

      </div>

      {/* HISTORIAL RÁPIDO DE HOY */}
      {registrosHoy.length > 0 && (
        <div className="intratime-historial-hoy">
          <div className="historial-hoy-header">
            <h4>📋 Fichajes registrados hoy ({registrosHoy.length})</h4>
          </div>
          <div className="linea-tiempo-fichajes">
            {registrosHoy.map((reg, index) => {
              const tiposLabels = {
                ENTRADA: { label: 'Entrada', color: '#10b981', icon: '🟢' },
                PAUSA_INICIO: { label: 'Pausa (Inicio)', color: '#f59e0b', icon: '⏸️' },
                PAUSA_FIN: { label: 'Pausa (Fin / Reanudación)', color: '#3b82f6', icon: '▶️' },
                SALIDA: { label: 'Salida', color: '#ef4444', icon: '🔴' }
              };
              const item = tiposLabels[reg.tipo] || { label: reg.tipo, color: '#64748b', icon: '📍' };

              return (
                <div key={reg._id || index} className="fichaje-nodo">
                  <span className="nodo-icono">{item.icon}</span>
                  <div className="nodo-info">
                    <strong style={{ color: item.color }}>{item.label}</strong>
                    <span className="nodo-hora">{formatearHora(reg.timestamp)}</span>
                    {reg.geolocalizacion?.capturada && (
                      <span className="nodo-gps" title="Geolocalización GPS certificada">
                        📍 GPS
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* GESTIÓN DE VACACIONES Y PERMISOS DEL OPERARIO */}
      <LeaveRequestOperator onSolicitudActualizada={cargarEstado} />

    </div>
  );
};

export default TimeTrackerOperator;
