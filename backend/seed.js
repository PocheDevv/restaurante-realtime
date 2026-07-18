const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Script para crear usuarios de prueba en MongoDB Atlas
const crearUsuarios = async () => {
    const client = new MongoClient(process.env.MONGO_URI);

    try {
        await client.connect();
        console.log('Conectado a MongoDB Atlas');

        const db = client.db('restaurante');
        const usuarios = db.collection('usuarios');

        // Elimina usuarios existentes para evitar duplicados
        await usuarios.deleteMany({});

        // Encripta las contraseñas antes de guardar
        const passwordMozo = await bcrypt.hash('mozo123', 10);
        const passwordCocinero = await bcrypt.hash('cocinero123', 10);

        // Inserta los usuarios de prueba
        await usuarios.insertMany([
            { nombre: 'Carlos', password: passwordMozo, rol: 'mozo' },
            { nombre: 'Ana', password: passwordMozo, rol: 'mozo' },
            { nombre: 'Chef Mario', password: passwordCocinero, rol: 'cocinero' },
            { nombre: 'Chef Luis', password: passwordCocinero, rol: 'cocinero' }
        ]);

        console.log(' Usuarios creados exitosamente:');
        console.log('   Mozos: Carlos / Ana  →  password: mozo123');
        console.log('   Cocineros: Chef Mario / Chef Luis  →  password: cocinero123');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
};

crearUsuarios();