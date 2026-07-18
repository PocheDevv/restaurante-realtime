import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Mozo from './pages/Mozo'
import Cocinero from './pages/Cocinero'

// Componente que protege rutas según el rol del usuario
const RutaProtegida = ({ children, rolRequerido }) => {
  const usuario = JSON.parse(localStorage.getItem('usuario'))

  // Si no hay usuario logueado, redirige al login
  if (!usuario) return <Navigate to="/" />

  // Si el rol no coincide, redirige al login
  if (usuario.rol !== rolRequerido) return <Navigate to="/" />

  return children
}

export default function App() {
  return (
    <Routes>
      {/* Ruta pública - Login */}
      <Route path="/" element={<Login />} />

      {/* Ruta protegida para mozos */}
      <Route path="/mozo" element={
        <RutaProtegida rolRequerido="mozo">
          <Mozo />
        </RutaProtegida>
      } />

      {/* Ruta protegida para cocineros */}
      <Route path="/cocinero" element={
        <RutaProtegida rolRequerido="cocinero">
          <Cocinero />
        </RutaProtegida>
      } />
    </Routes>
  )
}