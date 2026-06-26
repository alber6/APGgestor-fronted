import { Outlet, useNavigate } from 'react-router-dom'


function App() {
  const navigate = useNavigate();
    // LOGOUT (Cerrar Sesión limpiando el dispositivo)
  const handleLogout = () => {
    localStorage.removeItem('usuario'); // Eliminamos la ficha del usuario del dispositivo
    localStorage.removeItem('token');   // Eliminamos el token de seguridad si existiera
    navigate('/login');                // Redirigimos al Login inmediatamente
  };


  return (
    <div className='layout-contenedor'>
      
      {/* Barra lateral exclusiva de la administración */}
      <aside className="barra-lateral">
        <h2 className="logo-empresa">⚡ APGgestor</h2>
        <nav className="menu-navegacion">
          <a href="/" className="enlace-menu">🖥️ Panel Principal</a>
          <a href="/clientes" className="enlace-menu">🙍 Clientes</a>
          <a href="/nuevo-cliente" className="enlace-menu">✍️ Nuevo Cliente</a>
          <a href="/nuevo-trabajo" className="enlace-menu">🛠️ Nueva obra</a>
          
        </nav>
        <button 
          onClick={handleLogout} 
          className="boton-logout"
        >
          🚪 Cerrar Sesión
        </button>
      </aside>

      {/* Aquí es donde React inyectará el Dashboard o el Nuevo Cliente */}
      <main className="contenido-principal">
        <Outlet />
      </main>

    </div>
  )
}

export default App