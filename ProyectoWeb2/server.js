// Carga las variables de entorno desde un archivo .env
require('dotenv').config({ quiet: true });

// Importa la app de Express y el pool de conexión a MySQL desde app.js
// `app` ya tiene configuradas las sesiones, vistas y rutas principales
const { app, pool } = require('./routes/app'); 

// Define el puerto donde escuchará el servidor
// Usa la variable de entorno PORT o 3000 por defecto
const PORT = process.env.PORT || 3000;



// RUTA DE LOGIN (POST /api/login)
app.post('/api/login', async (req, res) => {
  // Extrae username y password enviados desde el formulario
  const { username, password } = req.body;

  // Si faltan datos
  if (!username || !password) 
    return res.json({ ok: false, message: 'Completa usuario y contraseña' });

  try {
    // Busca en la base de datos un usuario con ese username
    // LIMIT 1 asegura que solo traiga un registro
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ? LIMIT 1', 
      [username]
    );

    // Si no se encuentra el usuario, responde con error
    if (!rows || rows.length === 0) 
      return res.json({ ok: false, message: 'Usuario o contraseña inválidos' });

    const user = rows[0]; // toma el primer (y único) usuario encontrado

    // Compara la contraseña ingresada con la de la base de datos
    if (password !== user.password) {
      return res.json({ ok: false, message: 'Usuario o contraseña inválidos' });
    }

    // Si la contraseña es correcta, guarda datos en la sesión
    req.session.userId = user.id;
    req.session.username = user.username;

    // Responde JSON indicando login correcto
    return res.json({ ok: true, message: 'Login correcto' });

  } catch (err) {
    // Captura errores en la consulta o conexión a la base de datos
    console.error('Error en login:', err);
    return res.status(500).json({ ok: false, message: 'Error en servidor' });
  }
});


// RUTA DE LOGOUT (POST /api/logout)
app.post('/api/logout', (req, res) => {
  // Destruye la sesión del usuario
  req.session.destroy(() => {
    // Responde JSON confirmando que la sesión se cerró
    res.json({ ok: true });
  });
});


// ENDPOINT OPCIONAL PARA CHECAR SESIÓN (GET /api/session)
app.get('/api/session', (req, res) => {
  // Si existe sesión activa, devuelve ok:true y el username
  if (req.session && req.session.userId) {
    return res.json({ ok: true, username: req.session.username });
  }

  // Si no hay sesión, devuelve ok:false
  return res.json({ ok: false });
});


// ARRANQUE DEL SERVIDOR
app.listen(PORT, () => {
  // Muestra en consola la URL donde corre el servidor
  console.log(`Servidor en http://localhost:${PORT}`);
});
