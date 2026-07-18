const { MongoClient } = require('mongodb');
require('dotenv').config();

// Cliente de MongoDB usando la URI del archivo .env
const client = new MongoClient(process.env.MONGO_URI);

let db;

// Función para conectar a MongoDB Atlas
const conectarDB = async () => {
    try {
        await client.connect();
        db = client.db('restaurante');
        console.log('Conectado a MongoDB Atlas');
    } catch (error) {
        console.error('Error conectando a MongoDB:', error);
        process.exit(1);
    }
};

// Función para obtener la base de datos desde cualquier archivo
const getDB = () => {
    if (!db) throw new Error('Base de datos no conectada');
    return db;
};

module.exports = { conectarDB, getDB };