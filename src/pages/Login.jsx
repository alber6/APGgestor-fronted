import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
// Importamos la función que dispara la petición HTTP al Backend
import { loginRequest } from '../services/api';
// Traemos el contexto global de autenticación
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  // 1. ESTADOS LOCALES DEL FORMULARIO
  // Sustituimos el estado 'email' por 'nombre' para alinearlo con el nuevo CSV
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  // Traemos la función del contexto para almacenar el estado de sesión global
  const { loginAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  // 2. CONTROLADOR DEL ENVÍO DEL FORMULARIO
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Limpiamos alertas visuales de errores previos

    try {
      // ENVIAMOS LOS DATOS MODIFICADOS AL BACKEND
      // Ahora enviamos el 'nombre' en lugar del correo electrónico
      const response = await loginRequest({ nombre, password });
      
      // Si el Backend da el visto bueno, extraemos la ficha del usuario y su Token
      const { user, token } = response.data;

      // Guardamos la sesión en el estado global del Contexto
      loginAuth(user, token);
      
      // PERSISTENCIA LOCAL DE SEGURIDAD
      // Forzamos el guardado de la ficha del usuario en formato JSON String.
      // Esto permite que 'OperatorView.jsx' extraiga el nombre real del operario al cambiar de pantalla.
      localStorage.setItem('usuario', JSON.stringify(user));

      // 3. ENRUTADO INTELIGENTE SEGÚN EL ROL DEL CSV
      if (user.rol === 'admin') {
        navigate('/'); // Si es tu padre o tú, vais directos al Panel de Oficina (Escritorio)
      } else if (user.rol === 'operario') {
        navigate('/operario'); // Si es Carlos, Manuel, etc., van directos a la App Móvil
      }

    } catch (err) {
      // Capturamos cualquier error del servidor (Contraseña mal, usuario no existe, 401, etc.)
      console.error("Error en el proceso de Login:", err);
      // Mostramos un mensaje amigable en pantalla. Si el backend trae un mensaje lo usa, si no, uno por defecto
      setError(err.response?.data?.message || 'Nombre o contraseña incorrectos. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="vista-login-pantalla-completa">
      <div className="tarjeta-formulario-blanca login-compacto">
        <h2 className="login-titulo">⚡ APGgestor</h2>
        <p className="subtitulo-formulario">Introduce tus credenciales de la empresa</p>
        
        {/* BANNER DE ERROR DINÁMICO: Solo se dibuja si el estado 'error' tiene texto */}
        {error && (
          <div className="alerta-sistema error">
            {error}
          </div>
        )}

        {/* FORMULARIO DE ACCESO */}
        <form onSubmit={handleSubmit}>
          
          {/* CAMPO: NOMBRE COMPLETO (Antes era Email) */}
          <div className="campo-formulario">
            <label>Nombre de Usuario:</label>
            <input 
              type="text" 
              placeholder="Ej: Carlos Gómez"
              value={nombre} 
              // Actualizamos el estado del nombre en tiempo real mientras escriben
              onChange={(e) => setNombre(e.target.value)} 
              required 
            />
          </div>
          
          {/* CAMPO: CONTRASEÑA BÁSICA */}
          <div className="campo-formulario">
            <label>Contraseña:</label>
            <input 
              type="password" 
              placeholder="Contraseña de 4 dígitos"
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required 
            />
          </div>
          
          {/* BOTÓN DE ACCIÓN */}
          <button type="submit" className="boton-formulario">
            Ingresar al Sistema
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;