// Carga las variables de entorno desde un archivo .env
require('dotenv').config({ quiet: true });

// Importa la instancia de Express desde el archivo routes/app.js
// Dentro de app.js también se importa la conexión a la base de datos (pool)
const { app } = require('./routes/app'); 

// Define el puerto donde correrá el servidor
// Si hay una variable de entorno PORT la usa, si no, usa 3000 por defecto
const PORT = process.env.PORT || 3000;

// Inicia el servidor escuchando en el puerto definido
app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
