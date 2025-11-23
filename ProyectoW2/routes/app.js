// LISTAR USUARIOS (GET /)

// Ruta raíz que lista los usuarios
// `authRequired` es un middleware que asegura que el usuario esté logueado
app.get('/', authRequired, (req, res) => {
  // Consulta SQL para obtener id, nombre y correo de todos los usuarios
  pool.query('SELECT id, name, email FROM vista ORDER BY id DESC', (err, rows) => {
    if (err) {
      console.error('Error al listar users:', err);
      return res.render('index', { lista: [], editId: null, username: req.session.username });
    }

    // Transformamos cada fila a un objeto 
    const lista = rows.map(r => ({ id: r.id, nombre: r.name, correo: r.email }));

    // Renderizamos la vista 'index.ejs', pasando la lista de usuarios,
    // editId nulo (ningún usuario en edición) y el nombre del usuario logueado
    res.render('index', { lista, editId: null, username: req.session.username });
  });
});

// AGREGAR USUARIO (POST /add)
app.post('/add', authRequired, (req, res) => {
  // Obtenemos los datos del formulario
  const nombre = req.body.name ?? req.body.nombre;
  const correo = req.body.email ?? req.body.correo;

  // Validación básica: si falta algún campo, retornamos mensaje
  if (!nombre || !correo) return res.send('Faltan campos (name/email)');

  // Consulta SQL para insertar el nuevo usuario en la tabla 'vista'
  pool.query('INSERT INTO vista (name, email) VALUES (?, ?)', [nombre, correo], (err, result) => {
    if (err) {
      console.error('Error al agregar usuario:', err);
      return res.send('Error al agregar usuario');
    }

    // Redirigimos a la página principal
    res.redirect('/');
  });
});

// ACTUALIZAR USUARIO (POST /update/:id)
app.post('/update/:id', authRequired, (req, res) => {
  const id = Number(req.params.id); // ID del usuario a actualizar
  const name = req.body.name ?? req.body.nombre; 
  const email = req.body.email ?? req.body.correo;

  // Validación básica: si falta alguno de los campos requeridos
  if (!id || !name || !email) {
    return res.status(400).json({ ok: false, message: 'Faltan campos' });
  }

  // Consulta SQL para actualizar los datos del usuario
  pool.query('UPDATE vista SET name = ?, email = ? WHERE id = ?', [name, email, id], (err, result) => {
    if (err) {
      console.error('Error al actualizar:', err);
      return res.status(500).json({ ok: false, message: 'Error al actualizar' });
    }

    return res.json({ ok: true });
  });
});


// ELIMINAR USUARIO (GET /delete/:id)
app.get('/delete/:id', authRequired, (req, res) => {
  const id = Number(req.params.id); // ID del usuario a eliminar
  if (!id) return res.send('Id inválido');

  // Consulta SQL para eliminar usuario
  pool.query('DELETE FROM vista WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error al eliminar:', err);
      return res.send('Error al eliminar');
    }

    // Redirigimos a la página principal
    res.redirect('/');
  });
});

// LOGIN (POST /api/login)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Validación básica: usuario y contraseña requeridos
  if (!username || !password) return res.json({ ok: false, message: 'Completa usuario y contraseña' });

  // Consultamos la tabla 'users' para verificar credenciales
  pool.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username], (err, rows) => {
    if (err) {
      console.error('Error en login:', err);
      return res.status(500).json({ ok: false, message: 'Error en servidor' });
    }

    // Si no encontramos el usuario, error
    if (!rows || rows.length === 0) 
      return res.json({ ok: false, message: 'Usuario o contraseña inválidos' });

    const user = rows[0];

    // Comparamos la contraseña ingresada con la almacenada
    if (password !== user.password) 
      return res.json({ ok: false, message: 'Usuario o contraseña inválidos' });

    // Guardamos datos del usuario en sesión
    req.session.userId = user.id;
    req.session.username = user.username;

    // Login exitoso
    return res.json({ ok: true, message: 'Login correcto' });
  });
});
