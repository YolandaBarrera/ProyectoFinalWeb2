// routes/app.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const pool = require('./db'); // mysql2/promise pool

const app = express();
const rootPath = path.join(__dirname, '..');

// View engine
app.set('views', path.join(rootPath, 'views'));
app.set('view engine', 'ejs');

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(rootPath, 'public')));

// Session — debe estar aquí para que server.js pueda usar req.session después del login
app.use(session({
  secret: process.env.SESSION_SECRET || 'secreto',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 * 1000 }
}));

// simple logger para depuración
app.use((req, res, next) => {
  console.log(`[HTTP] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Helper: proteger rutas
function authRequired(req, res, next) {
  if (req.session && req.session.userId) return next();
  // si es petición XHR/json respondemos 401, si no redirigimos a /login
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(401).json({ ok: false, message: 'No autenticado' });
  }
  return res.redirect('/login');
}

/* ---------- RUTAS SERVER-SIDE (CRUD sobre tabla users) ---------- */

// Lista (renderiza index.ejs)
app.get('/', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email FROM vista ORDER BY id DESC');
    const lista = rows.map(r => ({ id: r.id, nombre: r.name, correo: r.email }));    
    res.render('index', { lista, editId: null, username: req.session.username });
  } catch (err) {
    console.error('Error al listar users:', err);
    res.render('index', { lista: [], editId: null, username: req.session.username });
  }
});

// Agregar (POST /add)
app.post('/add', authRequired, async (req, res) => {
  const nombre = req.body.name ?? req.body.nombre;
  const correo = req.body.email ?? req.body.correo;
  if (!nombre || !correo) return res.send('Faltan campos (name/email)');
  try {
    await pool.query('INSERT INTO vista (name, email) VALUES (?, ?)', [nombre, correo]);
    return res.redirect('/');
  } catch (err) {
    console.error('Error al agregar usuario:', err);
    return res.send('Error al agregar usuario');
  }
});


// Actualizar (POST /update/:id)
app.post('/update/:id', authRequired, async (req, res) => {
  const id = Number(req.params.id);
  const name = req.body.name ?? req.body.nombre;
  const email = req.body.email ?? req.body.correo;

  // para detectar peticiones XHR/JSON
  const wantsJson = req.xhr || req.is('application/json') || (req.get && req.get('Accept')?.includes('application/json'));

  console.log(`[UPDATE] id=${id} body=`, req.body, 'wantsJson=', wantsJson);

  if (!id || !name || !email) {
    if (wantsJson) return res.status(400).json({ ok: false, message: 'Faltan campos' });
    return res.status(400).send('Faltan campos');
  }

  try {
    const [result] = await pool.query('UPDATE vista SET name = ?, email = ? WHERE id = ?', [name, email, id]);
    console.log('[UPDATE] resultado:', result);

    if (wantsJson) return res.json({ ok: true });
    return res.redirect('/');
  } catch (err) {
    console.error('Error al actualizar:', err);
    if (wantsJson) return res.status(500).json({ ok: false, message: 'Error al actualizar' });
    return res.status(500).send('Error al actualizar');
  }
});


// Eliminar (GET /delete/:id)
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

// Render login page (GET /login)
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Export
module.exports = { app, pool, authRequired };
