require('dotenv').config({ quiet: true });
const { app, pool } = require('./routes/app'); // importa el app que tiene sesiones
const PORT = process.env.PORT || 3000;

// Login (POST /api/login)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.json({ ok: false, message: 'Completa usuario y contraseña' });

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
    if (!rows || rows.length === 0) return res.json({ ok: false, message: 'Usuario o contraseña inválidos' });

    const user = rows[0];
    if (password !== user.password) {
      return res.json({ ok: false, message: 'Usuario o contraseña inválidos' });
    }
    
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


/* ---------- Arranque del servidor ---------- */
app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
