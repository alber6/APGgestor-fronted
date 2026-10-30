import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthContext from './context/AuthContext.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import './style.css' 

// Importamos los Layouts/Marcos
import App from './App.jsx' // Este será el Layout de la Oficina

// Importamos las páginas reales
import OfficeDashboard from './pages/OfficeDashboard.jsx'
import NewCustomer from './pages/NewCustomer.jsx'
import OperatorView from './pages/OperatorView.jsx'
import Login from './pages/Login.jsx'
import CustomersList from './pages/CustomerList.jsx'
import NewJob from './pages/NewJob.jsx'
import TimeTrackingAdmin from './pages/TimeTrackingAdmin.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename='/'>
      <AuthContext> {/* necesario para que se vea login  */}
        <Routes>
          
          {/* LOGIN: Pantalla limpia para loguearse */}
          <Route path='/login' element={<Login />} />

          {/* RUTAS DE LA OFICINA: Protegidas solo para el rol 'admin' */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path='/' element={<App />}>
              <Route index element={<OfficeDashboard />} />
              <Route path='/control-horario' element={<TimeTrackingAdmin />} />
              <Route path='/clientes' element={<CustomersList />} />
              <Route path='/nuevo-cliente' element={<NewCustomer />} />
              <Route path='/nuevo-trabajo' element={<NewJob />} />
            </Route>
          </Route>

          {/* RUTAS DEL MÓVIL: Protegidas solo para el rol 'operario' */}
          <Route element={<ProtectedRoute allowedRoles={['operario']} />}>
            <Route path='/operario' element={<OperatorView />} />
          </Route>

        </Routes>
      </AuthContext> 
    </BrowserRouter>
  </StrictMode>
)