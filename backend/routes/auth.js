const express = require('express');
const bcrypt = require('bcryptjs');
const { getDB } = require('../db/conexion');

const router = express.Router();

// Ruta de registro de usuarios
router.post('/registro', async (req, res) => {
    try {
        const { nombre, password, rol } = req.body;
        const db = getDB();
        const usuarios = db.collection('usuarios');

        // Verifica si el usuario ya existe
        const usuarioExistente = await usuarios.findOne({ nombre });
        if (usuarioExistente) {
            return res.status(400).json({ mensaje: 'El usuario ya existe' });
        }

        // Encripta la contraseña antes de guardar
        const passwordEncriptado = await bcrypt.hash(password, 10);

        // Guarda el nuevo usuario en MongoDB
        await usuarios.insertOne({
            nombre,
            password: passwordEncriptado,
            rol // 'mozo' o 'cocinero'
        });

        res.status(201).json({ mensaje: 'Usuario registrado correctamente' });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
});

// Ruta de login
router.post('/login', async (req, res) => {
    try {
        const { nombre, password } = req.body;
        const db = getDB();
        const usuarios = db.collection('usuarios');

        // Busca el usuario en la base de datos
        const usuario = await usuarios.findOne({ nombre });
        if (!usuario) {
            return res.status(400).json({ mensaje: 'Usuario no encontrado' });
        }

        // Compara la contraseña ingresada con la encriptada
        const passwordValido = await bcrypt.compare(password, usuario.password);
        if (!passwordValido) {
            return res.status(400).json({ mensaje: 'Contraseña incorrecta' });
        }

        // Devuelve el nombre y rol del usuario para que el frontend lo use
        res.json({
            mensaje: 'Login exitoso',
            usuario: {
                nombre: usuario.nombre,
                rol: usuario.rol
            }
        });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
});

module.exports = router;