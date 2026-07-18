import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../index.css'

export default function Login() {
    const [nombre, setNombre] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        setCargando(true)
        setError('')

        try {
            // Llama al endpoint de login del backend
            const res = await fetch('https://restaurante-realtime.onrender.com/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, password })
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.mensaje)
                return
            }

            // Guarda el usuario en localStorage para mantener la sesión
            localStorage.setItem('usuario', JSON.stringify(data.usuario))

            // Redirige según el rol del usuario
            if (data.usuario.rol === 'mozo') {
                navigate('/mozo')
            } else {
                navigate('/cocinero')
            }

        } catch (err) {
            setError('Error al conectar con el servidor')
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>🍽️ RestauranteApp</h1>
                <h2>Iniciar Sesión</h2>
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Usuario</label>
                        <input
                            type="text"
                            placeholder="Tu nombre de usuario"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            placeholder="Tu contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className="error-msg">{error}</p>}
                    <button type="submit" disabled={cargando}>
                        {cargando ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>
            </div>
        </div>
    )
}