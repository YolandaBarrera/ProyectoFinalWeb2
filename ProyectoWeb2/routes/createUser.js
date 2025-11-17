// routes/createUser.js
const bcrypt = require('bcrypt');
const pool = require('./db');

async function crearUsuario(username, plainPassword) {
  try {
    const hashed = await bcrypt.hash(plainPassword, 10);
    const [result] = await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashed]);
    console.log('Usuario creado:', username, 'id:', result.insertId);
  } catch (err) {
    console.error('Error al crear usuario:', err.message);
  }
}

// ejemplo: node routes/createUser.js
if (require.main === module) {
  (async () => {
    await crearUsuario('admin', 'admin123');
    process.exit(0);
  })();
}

module.exports = crearUsuario;
