// Carga variables de entorno desde un archivo .env
require('dotenv').config({ quiet: true });

// Importa la librería mysql2 en su modo Promise, para poder usar async/await
// Esto permite trabajar con consultas asíncronas sin usar callbacks, usando el pool.query()
const mysql = require('mysql2/promise');

// Crear un pool de conexiones a la base de datos MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',         
  user: process.env.DB_USER || 'root',               
  password: process.env.DB_PASSWORD || '12345',     
  database: process.env.DB_NAME || 'sistema',       
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306, 
  waitForConnections: true,  // Si no hay conexiones disponibles, esperar en cola en lugar de dar error
  connectionLimit: 10,       // Número máximo de conexiones simultáneas en el pool
  queueLimit: 0,             // Sin límite de solicitudes en cola
  charset: 'utf8mb4'         // Codificación de caracteres (soporta emojis y caracteres especiales)
});

// Exporta el pool para usarlo en cualquier archivo
module.exports = pool;
