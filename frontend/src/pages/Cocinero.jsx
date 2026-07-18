import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000')

// Calcula cuánto tiempo pasó desde que se creó el pedido
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

export default function Cocinero() {
    const [pedidos, setPedidos] = useState([])
    const [tick, setTick] = useState(0)
    const [sonidoHabilitado, setSonidoHabilitado] = useState(true)
    const navigate = useNavigate()

    const usuario = JSON.parse(localStorage.getItem('usuario'))

    // Crea un sonido de notificación usando la Web Audio API
    const reproducirSonido = () => {
        if (!sonidoHabilitado) return
        try {
            const contexto = new (window.AudioContext || window.webkitAudioContext)()
            const oscilador = contexto.createOscillator()
            const ganancia = contexto.createGain()

            oscilador.connect(ganancia)
            ganancia.connect(contexto.destination)

            oscilador.frequency.setValueAtTime(880, contexto.currentTime)
            oscilador.frequency.setValueAtTime(660, contexto.currentTime + 0.1)
            oscilador.frequency.setValueAtTime(880, contexto.currentTime + 0.2)

            ganancia.gain.setValueAtTime(0.3, contexto.currentTime)
            ganancia.gain.exponentialRampToValueAtTime(0.001, contexto.currentTime + 0.4)

            oscilador.start(contexto.currentTime)
            oscilador.stop(contexto.currentTime + 0.4)
        } catch (e) {
            console.log('Error de audio:', e)
        }
    }

    useEffect(() => {
        socket.on('pedidos_actuales', (pedidosActuales) => {
            setPedidos(pedidosActuales)
        })

        socket.on('pedido_recibido', (pedido) => {
            setPedidos(prev => [...prev, pedido])
            reproducirSonido()
        })

        socket.on('estado_actualizado', ({ pedidoId, estado }) => {
            setPedidos(prev => prev.map(p =>
                p.id === pedidoId ? { ...p, estado } : p
            ))
        })

        // Actualiza el timer cada 30 segundos
        const interval = setInterval(() => setTick(t => t + 1), 30000)

        return () => {
            socket.off('pedidos_actuales')
            socket.off('pedido_recibido')
            socket.off('estado_actualizado')
            clearInterval(interval)
        }
    }, [sonidoHabilitado])

    const actualizarEstado = (pedidoId, estado) => {
        socket.emit('actualizar_estado', { pedidoId, estado })
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

    const pedidosPendientes = pedidos.filter(p => p.estado !== 'listo')
    const pedidosListos = pedidos.filter(p => p.estado === 'listo')

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <h1>👨‍🍳 Panel del Cocinero</h1>
                <div className="header-right">
                    {pedidosPendientes.length > 0 && (
                        <span className="contador-badge">
                            {pedidosPendientes.length} pedido{pedidosPendientes.length > 1 ? 's' : ''} pendiente{pedidosPendientes.length > 1 ? 's' : ''}
                        </span>
                    )}
                    <button
                        onClick={() => setSonidoHabilitado(!sonidoHabilitado)}
                        className="btn-sonido"
                    >
                        {sonidoHabilitado ? '🔔 Sonido ON' : '🔕 Sonido OFF'}
                    </button>
                    <span>Hola, {usuario.nombre}</span>
                    <button onClick={cerrarSesion} className="btn-logout">Cerrar sesión</button>
                </div>
            </header>

            <div className="dashboard-content">
                {/* Pedidos activos */}
                <div className="card">
                    <h2>Pedidos Activos ({pedidosPendientes.length})</h2>
                    {pedidosPendientes.length === 0 ? (
                        <p className="empty-msg">No hay pedidos pendientes 🎉</p>
                    ) : (
                        <div className="pedidos-lista">
                            {pedidosPendientes.map(pedido => (
                                <div key={pedido.id} className={`pedido-item cocinero ${Math.floor((new Date() - new Date(pedido.timestamp)) / 60000) >= 15 ? 'urgente' : ''}`}>
                                    <div className="pedido-header-row">
                                        <strong>{pedido.mesa}</strong>
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
                                    <span>Mozo: {pedido.mozo}</span>
                                    <ul className="platos-list">
                                        {pedido.platos.map((plato, i) => (
                                            <li key={i}>🍽️ {plato}</li>
                                        ))}
                                    </ul>
                                    <div className="pedido-acciones">
                                        <span
                                            className="estado-badge"
                                            style={{ backgroundColor: colorEstado(pedido.estado) }}
                                        >
                                            {pedido.estado === 'pendiente' && '⏳ Pendiente'}
                                            {pedido.estado === 'preparando' && '👨‍🍳 En Preparación'}
                                        </span>
                                        {pedido.estado === 'pendiente' && (
                                            <button
                                                className="btn-preparando"
                                                onClick={() => actualizarEstado(pedido.id, 'preparando')}
                                            >
                                                Aceptar / Preparar
                                            </button>
                                        )}
                                        {pedido.estado === 'preparando' && (
                                            <button
                                                className="btn-listo"
                                                onClick={() => actualizarEstado(pedido.id, 'listo')}
                                            >
                                                Marcar como Listo ✅
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pedidos listos */}
                <div className="card">
                    <h2>Pedidos Listos ({pedidosListos.length})</h2>
                    {pedidosListos.length === 0 ? (
                        <p className="empty-msg">Aún no hay pedidos listos</p>
                    ) : (
                        <div className="pedidos-lista">
                            {pedidosListos.map(pedido => (
                                <div key={pedido.id} className="pedido-item listo">
                                    <div className="pedido-info">
                                        <strong>{pedido.mesa}</strong>
                                        <span>Mozo: {pedido.mozo}</span>
                                        <span>{pedido.platos.join(', ')}</span>
                                        <span className="timer-badge" style={{ color: '#10b981' }}>
                                            ⏱️ {tiempoTranscurrido(pedido.timestamp)}
                                        </span>
                                    </div>
                                    <span className="estado-badge" style={{ backgroundColor: '#10b981' }}>
                                        ✅ Listo para Servir
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}