// server.js (raíz)
require('dotenv').config();
const bcrypt = require('bcrypt');
const { app, pool } = require('./routes/app'); // importa el app que tiene sesiones
const PORT = process.env.PORT || 3000;

/* ---------- Auth routes (API) ---------- */

// Login (POST /api/login)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.json({ ok: false, message: 'Completa usuario y contraseña' });

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
    if (!rows || rows.length === 0) return res.json({ ok: false, message: 'Usuario o contraseña inválidos' });

    const user = rows[0];
    // compara hash; si en tu tabla guardaste password plano (temporal), en vez de bcrypt.compare usa ===
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ ok: false, message: 'Usuario o contraseña inválidos' });

    // Guarda sesión
    req.session.userId = user.id;
    req.session.username = user.username;
    return res.json({ ok: true, message: 'Login correcto' });
  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({ ok: false, message: 'Error en servidor' });
  }
});

// Logout (POST /api/logout)
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// endpoint para checar sesión (opcional)
app.get('/api/session', (req, res) => {
  if (req.session && req.session.userId) return res.json({ ok: true, username: req.session.username });
  return res.json({ ok: false });
});

/* ---------- Arranque del servidor ---------- */
app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
