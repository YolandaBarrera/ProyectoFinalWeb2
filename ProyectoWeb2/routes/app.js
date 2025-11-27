// El archivo de rutas
require('dotenv').config({ quiet: true }); // Carga variables de entorno desde un archivo .env 

// Importa librerías necesarias
const express = require('express');        // Framework web
const session = require('express-session'); // Para manejo de sesiones
const bodyParser = require('body-parser');  // Para parsear datos de formularios JSON/urlencoded
const path = require('path');               // Para manejo de rutas
const pool = require('./db');               // Pool de conexiones a MySQL usando mysql2/promise

// Crear la app de Express
const app = express();

// Ruta raíz del proyecto
const rootPath = path.join(__dirname, '..'); // rootPath apunta a la raíz del proyecto 


// CONFIGURACIÓN DEL MOTOR DE VISTAS (EJS)

// Ubicación de las vistas (archivos .ejs)
app.set('views', path.join(rootPath, 'views'));
// Motor de plantillas
app.set('view engine', 'ejs');

// MIDDLEWARES GLOBALES

app.use(bodyParser.json()); // Parseo de JSON peticiones que envían JSON
app.use(bodyParser.urlencoded({ extended: true })); // Parseo de formularios HTML
app.use(express.static(path.join(rootPath, 'public'))); // Para archivos estáticos desde /public

// SESION //
app.use(session({
  secret: process.env.SESSION_SECRET || 'secreto', // Clave para firmar la cookie
  resave: false,                                    // No guardar sesión si no hubo cambios
  saveUninitialized: false,                         // No crear sesión si no se inicializó
  cookie: { maxAge: 60 * 60 * 1000 }               // Duración cookie: 1 hora
}));


// Función para que solo usuarios que accedan al Login puedan acceder a la tabla "vista"

// authRequired: protege rutas que necesitan autenticación
// Añade authRequired como middleware en rutas que deben quedar privadas
function authRequired(req, res, next) {
  if (req.session && req.session.userId) return next(); // Usuario autenticado, continuar

  // Si es petición XHR o JSON, responder con 401
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(401).json({ ok: false, message: 'No autenticado' });
  }

  // Si no, redirigir al login
  return res.redirect('/login');
}


//  RUTAS CRUD 

// LISTAR usuarios (GET /) 
// Protegido por authRequired, sólo accesible si está logueado
app.get('/', authRequired, async (req, res) => {
  try {
    // Consulta la lista de usuarios 
    const [rows] = await pool.query('SELECT id, name, email FROM vista ORDER BY id DESC');
    const lista = rows.map(r => ({ id: r.id, nombre: r.name, correo: r.email })); // Mapear columnas DB
    
    // Renderiza la vista con la lista y usuario de sesión
    res.render('index', { lista, editId: null, username: req.session.username });
  } catch (err) {
    console.error('Error al listar users:', err);
    // En caso de error, renderiza igual pero con lista vacía
    res.render('index', { lista: [], editId: null, username: req.session.username });
  }
});

// AGREGAR usuario (POST /add)
// Recibe datos desde un formulario que apunta a /add 
app.post('/add', authRequired, async (req, res) => {
  const nombre = req.body.name ?? req.body.nombre;
  const correo = req.body.email ?? req.body.correo;

   // Validación en servidor
  if (!nombre || !correo) return res.send('Faltan campos (name/email)');

  try {
    await pool.query('INSERT INTO vista (name, email) VALUES (?, ?)', [nombre, correo]);
    return res.redirect('/'); // Redirige a la lista
  } catch (err) {
    console.error('Error al agregar usuario:', err);
    return res.send('Error al agregar usuario');
  }
});

// ACTUALIZAR usuario (POST /update/:id)
app.post('/update/:id', authRequired, async (req, res) => {
  const id = Number(req.params.id);
  const name = req.body.name ?? req.body.nombre;
  const email = req.body.email ?? req.body.correo;

  // Detectar si el cliente espera JSON
  const wantsJson = req.xhr || req.is('application/json') || (req.get && req.get('Accept')?.includes('application/json'));

  console.log(`[UPDATE] id=${id} body=`, req.body, 'wantsJson=', wantsJson);
   // Validaciones
  if (!id || !name || !email) {
    if (wantsJson) return res.status(400).json({ ok: false, message: 'Faltan campos' });
    return res.status(400).send('Faltan campos');
  }

  try {
    // UPDATE 
    const [result] = await pool.query('UPDATE vista SET name = ?, email = ? WHERE id = ?', [name, email, id]);
    console.log('[UPDATE] resultado:', result);

    if (wantsJson) return res.json({ ok: true });
    return res.redirect('/'); // 
  } catch (err) {
    console.error('Error al actualizar:', err);
    if (wantsJson) return res.status(500).json({ ok: false, message: 'Error al actualizar' });
    return res.status(500).send('Error al actualizar');
  }
});

// ELIMINAR usuario (GET /delete/:id)
app.get('/delete/:id', authRequired, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.send('Id inválido');

  try {
    await pool.query('DELETE FROM vista WHERE id = ?', [id]);
    return res.redirect('/');
  } catch (err) {
    console.error('Error al eliminar:', err);
    return res.send('Error al eliminar');
  }
});

// LOGIN (GET /login)
app.get('/login', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/'); // Si ya está logueado, va al index
  }
  // Renderiza login.ejs
  res.render('login', { error: null });
});

// -------------------- EXPORT -------------------- //
// Exporta la app, el pool y la función authRequired
module.exports = { app, pool, authRequired };
