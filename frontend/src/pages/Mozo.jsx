import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'

const socket = io('https://restaurante-realtime.onrender.com')

const PLATOS = [
    { nombre: 'Hamburguesa', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=80' },
    { nombre: 'Ensalada César', img: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=200&q=80' },
    { nombre: 'Pizza Margherita', img: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=200&q=80' },
    { nombre: 'Pasta Carbonara', img: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=200&q=80' },
    { nombre: 'Coca Cola', img: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200&q=80' },
    { nombre: 'Agua mineral', img: 'https://images.unsplash.com/photo-1638688569176-5b6db19f9d2a?w=200&q=80' },
    { nombre: 'Alitas a la BBQ', img: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=200&q=80' },
    { nombre: 'Ramen', img: 'https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=200&q=80' },
    { nombre: 'Papas Fritas', img: 'https://plus.unsplash.com/premium_photo-1683121324474-83460636b0ed?w=200&q=80' },
    { nombre: 'Milksahed', img: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=200&q=80' },
    { nombre: 'Brownie', img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=200&q=80' },
    { nombre: 'Jugo de naranja', img: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200&q=80' },
    { nombre: 'Café americano', img: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=200&q=80' },
    { nombre: 'Tallarines Rojos', img: 'https://images.unsplash.com/photo-1516100882582-96c3a05fe590?w=200&q=80' },
    { nombre: 'Iced Tea', img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&q=80' },
]

const MESAS = ['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Mesa 5']

// Calcula cuánto tiempo pasó desde una fecha
const tiempoTranscurrido = (timestamp) => {
    const ahora = new Date()
    const inicio = new Date(timestamp)
    const diffMin = Math.floor((ahora - inicio) / 60000)
    if (diffMin < 1) return 'justo ahora'
    if (diffMin === 1) return 'hace 1 min'
    return `hace ${diffMin} min`
}

// Color de alerta según tiempo transcurrido
const colorTiempo = (timestamp) => {
    const diffMin = Math.floor((new Date() - new Date(timestamp)) / 60000)
    if (diffMin >= 15) return '#ef4444'
    if (diffMin >= 8) return '#f59e0b'
    return '#10b981'
}

export default function Mozo() {
    const [mesa, setMesa] = useState('')
    const [platosSeleccionados, setPlatosSeleccionados] = useState([])
    const [misPedidos, setMisPedidos] = useState([])
    const [notificacion, setNotificacion] = useState('')
    const [tick, setTick] = useState(0)
    const navigate = useNavigate()

    const usuario = JSON.parse(localStorage.getItem('usuario'))

    useEffect(() => {
        socket.on('pedidos_actuales', (pedidos) => {
            const misPedidosFiltrados = pedidos.filter(p => p.mozo === usuario.nombre)
            setMisPedidos(misPedidosFiltrados)
        })

        socket.on('estado_actualizado', ({ pedidoId, estado }) => {
            setMisPedidos(prev => prev.map(p =>
                p.id === pedidoId ? { ...p, estado } : p
            ))
            if (estado === 'listo') {
                setNotificacion('🔔 ¡Un pedido está listo para servir!')
                setTimeout(() => setNotificacion(''), 4000)
            }
        })

        socket.on('pedido_recibido', (pedido) => {
            if (pedido.mozo === usuario.nombre) {
                setMisPedidos(prev => [...prev, pedido])
            }
        })

        // Actualiza el timer cada 30 segundos
        const interval = setInterval(() => setTick(t => t + 1), 30000)

        return () => {
            socket.off('pedidos_actuales')
            socket.off('estado_actualizado')
            socket.off('pedido_recibido')
            clearInterval(interval)
        }
    }, [])

    const togglePlato = (plato) => {
        setPlatosSeleccionados(prev =>
            prev.includes(plato)
                ? prev.filter(p => p !== plato)
                : [...prev, plato]
        )
    }

    const enviarPedido = () => {
        if (!mesa || platosSeleccionados.length === 0) {
            alert('Selecciona una mesa y al menos un plato')
            return
        }
        socket.emit('nuevo_pedido', {
            mesa,
            platos: platosSeleccionados,
            mozo: usuario.nombre
        })
        setMesa('')
        setPlatosSeleccionados([])
    }

    // Elimina el pedido del dashboard una vez servido
    const marcarServido = (pedidoId) => {
        setMisPedidos(prev => prev.filter(p => p.id !== pedidoId))
    }

    const cerrarSesion = () => {
        localStorage.removeItem('usuario')
        socket.disconnect()
        navigate('/')
    }

    const colorEstado = (estado) => {
        if (estado === 'pendiente') return '#f59e0b'
        if (estado === 'preparando') return '#3b82f6'
        if (estado === 'listo') return '#10b981'
        return '#6b7280'
    }

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <h1>🧑‍🍳 Panel del Mozo</h1>
                <div>
                    <span>Hola, {usuario.nombre}</span>
                    <button onClick={cerrarSesion} className="btn-logout">Cerrar sesión</button>
                </div>
            </header>

            {notificacion && <div className="notificacion">{notificacion}</div>}

            <div className="dashboard-content">
                {/* Formulario para crear pedido */}
                <div className="card">
                    <h2>Nuevo Pedido</h2>

                    <div className="form-group">
                        <label>Seleccionar Mesa</label>
                        <select value={mesa} onChange={(e) => setMesa(e.target.value)}>
                            <option value="">-- Selecciona una mesa --</option>
                            {MESAS.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Seleccionar Platos</label>
                        <div className="platos-grid">
                            {PLATOS.map(plato => (
                                <button
                                    key={plato.nombre}
                                    className={`plato-btn ${platosSeleccionados.includes(plato.nombre) ? 'selected' : ''}`}
                                    onClick={() => togglePlato(plato.nombre)}
                                >
                                    <img src={plato.img} alt={plato.nombre} className="plato-img" />
                                    <span>{plato.nombre}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {platosSeleccionados.length > 0 && (
                        <div className="seleccion-resumen">
                            <strong>Seleccionados:</strong> {platosSeleccionados.join(', ')}
                        </div>
                    )}

                    <button className="btn-primary" onClick={enviarPedido}>
                        Enviar Pedido a Cocina 🚀
                    </button>
                </div>

                {/* Lista de pedidos del mozo */}
                <div className="card">
                    <h2>Mis Pedidos</h2>
                    {misPedidos.length === 0 ? (
                        <p className="empty-msg">No tienes pedidos aún</p>
                    ) : (
                        <div className="pedidos-lista">
                            {misPedidos.map(pedido => (
                                <div key={pedido.id} className="pedido-item">
                                    <div className="pedido-info">
                                        <strong>{pedido.mesa}</strong>
                                        <span>{pedido.platos.join(', ')}</span>
                                        <span
                                            className="timer-badge"
                                            style={{ color: colorTiempo(pedido.timestamp) }}
                                        >
                                            ⏱️ {tiempoTranscurrido(pedido.timestamp)}
                                            {Math.floor((new Date() - new Date(pedido.timestamp)) / 60000) >= 15 && (
                                                <span className="urgente-tag"> ⚠️ DEMORADO</span>
                                            )}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                        <span
                                            className="estado-badge"
                                            style={{ backgroundColor: colorEstado(pedido.estado) }}
                                        >
                                            {pedido.estado === 'pendiente' && '⏳ Pendiente'}
                                            {pedido.estado === 'preparando' && '👨‍🍳 En Preparación'}
                                            {pedido.estado === 'listo' && '✅ Listo para Servir'}
                                        </span>
                                        {/* Botón servido solo aparece cuando el pedido está listo */}
                                        {pedido.estado === 'listo' && (
                                            <button
                                                className="btn-servido"
                                                onClick={() => marcarServido(pedido.id)}
                                            >
                                                Marcar como Servido 🍽️
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}