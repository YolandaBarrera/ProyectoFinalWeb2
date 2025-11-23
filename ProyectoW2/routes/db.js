// Cargamos variables de entorno desde un archivo .env
require('dotenv').config({ quiet: true });

const mysql = require('mysql2'); // Importamos la librería mysql2, que permite conectarse a MySQL

//  CREACIÓN DEL POOL
// Un "pool" es un conjunto de conexiones que se reutilizan para
// evitar abrir y cerrar conexiones cada vez que se hace una consulta
const pool = mysql.createPool({

  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.DB_NAME || 'sistema',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  // Permite que la conexión espere si no hay conexiones disponibles
  waitForConnections: true,
  // Número máximo de conexiones simultáneas en el pool
  connectionLimit: 10,
  // Límite de la cola de solicitudes pendientes (0 = sin límite)
  queueLimit: 0,
  charset: 'utf8mb4'
});

// Exportamos el pool para poder usarlo en otros archivos
module.exports = pool;
