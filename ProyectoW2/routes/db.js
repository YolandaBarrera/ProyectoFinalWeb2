require('dotenv').config({ quiet: true });
const mysql = require('mysql2/promise'); //Importa la librería mysql2 en su modo promise, lo que permite usar async/await

// Creación del pool de conexiones:
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.DB_NAME || 'sistema',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

module.exports = pool; // Export DB (esta es la línea al final que exporta)
