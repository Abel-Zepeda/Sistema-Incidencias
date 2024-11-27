const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const session = require('express-session');

const app = express();
const port = 3000;

// Conexión a la base de datos
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'sistema_incidencias',
});

connection.connect((err) => {
  if (err) {
    console.error('Error de conexión: ' + err.stack);
    return;
  }
  console.log('Conectado a la base de datos como id ' + connection.threadId);
});

// Middleware para procesar datos del formulario y JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuración de sesión
app.use(
  session({
    secret: 'mi_secreto',
    resave: false,
    saveUninitialized: true,
  })
);

// Configurar EJS como motor de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal: Login
app.get('/', (req, res) => {
  res.render('login', { error: null });
});

// Ruta para procesar el login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const query = 'SELECT * FROM usuarios WHERE username = ? AND password = ?';
  connection.execute(query, [username, password], (err, results) => {
    if (err) {
      console.error('Error en la consulta: ' + err.stack);
      return res.status(500).send('Error en el servidor');
    }

    if (results.length > 0) {
      req.session.user = results[0];
      res.redirect('/dashboard');
    } else {
      res.render('login', { error: 'Usuario o contraseña incorrectos' });
    }
  });
});

// Middleware para proteger rutas
function isAuthenticated(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/');
  }
  next();
}

// Ruta: Dashboard
app.get('/dashboard', isAuthenticated, (req, res) => {
  connection.query('SELECT * FROM incidencias', (err, results) => {
    if (err) {
      console.error('Error al obtener incidencias:', err);
      return res.status(500).send('Error al obtener incidencias.');
    }
    res.render('dashboard', { incidencias: results });
  });
});

// Ruta para la página de técnicos
app.get('/tecnicos', isAuthenticated, (req, res) => {
  connection.query('SELECT * FROM tecnicos', (err, results) => {
    if (err) {
      console.error('Error al obtener técnicos:', err);
      res.status(500).send('Error al obtener los técnicos.');
    } else {
      res.render('tecnicos', { tecnicos: results });
    }
  });
});

// Ruta para mostrar la página de ubicaciones
app.get('/ubicaciones', isAuthenticated, (req, res) => {
  const queryEdificios = 'SELECT DISTINCT edificio FROM ubicaciones ORDER BY edificio ASC';
  const queryUbicaciones = 'SELECT * FROM ubicaciones';

  connection.query(queryEdificios, (err, edificios) => {
    if (err) {
      console.error('Error al obtener edificios:', err);
      return res.status(500).send('Error al obtener edificios.');
    }

    connection.query(queryUbicaciones, (err, ubicaciones) => {
      if (err) {
        console.error('Error al obtener ubicaciones:', err);
        return res.status(500).send('Error al obtener ubicaciones.');
      }

      res.render('ubicaciones', { edificios, ubicaciones });
    });
  });
});

app.post('/ubicaciones', isAuthenticated, (req, res) => {
  const { edificio, aula } = req.body;

  const query = 'INSERT INTO ubicaciones (edificio, aula) VALUES (?, ?)';
  connection.query(query, [edificio, aula], (err, result) => {
    if (err) {
      console.error('Error al registrar la ubicación:', err);
      return res.status(500).send('Error al registrar la ubicación.');
    }

    console.log('Ubicación registrada:', { edificio, aula });
    res.redirect('/ubicaciones');
  });
});

// Ruta: Dispositivos
app.get('/dispositivos', isAuthenticated, (req, res) => {
  connection.query('SELECT * FROM dispositivos', (err, results) => {
    if (err) {
      console.error('Error al obtener dispositivos:', err);
      return res.status(500).send('Error al obtener los dispositivos.');
    }
    res.render('dispositivos', { dispositivos: results });
  });
});

// Ruta para procesar el registro de dispositivos
app.post('/dispositivos', isAuthenticated, (req, res) => {
  const { numero_serie, categoria, marca, procesador, ram, capacidad_almacenamiento, tarjeta_grafica, sistema_operativo, version_sistema, fecha_adquisicion } = req.body;

  const query = `
    INSERT INTO dispositivos (numero_serie, categoria, marca, procesador, ram, capacidad_almacenamiento, tarjeta_grafica, sistema_operativo, version_sistema, fecha_adquisicion) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  connection.execute(query, [numero_serie, categoria, marca, procesador, ram, capacidad_almacenamiento, tarjeta_grafica, sistema_operativo, version_sistema, fecha_adquisicion], (err, results) => {
    if (err) {
      console.error('Error al registrar dispositivo:', err);
      return res.status(500).send('Error al registrar el dispositivo.');
    }
    res.redirect('/dispositivos');
  });
});

// Ruta para obtener aulas según el edificio seleccionado
app.get('/aulas', isAuthenticated, async (req, res) => {
  const edificio = req.query.edificio;

  if (!edificio) {
    return res.status(400).json({ error: 'Edificio no especificado' });
  }

  try {
    const [rows] = await connection.execute(
      'SELECT aulas.nombre AS aula FROM aulas JOIN ubicaciones ON ubicaciones.aula = aulas.nombre WHERE ubicaciones.edificio = ?',
      [edificio]
    );
    res.json(rows); // Devuelve las aulas como JSON
  } catch (error) {
    console.error('Error al obtener aulas:', error); // Muestra el error exacto en la consola
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.get('/aulas/:edificio', isAuthenticated, (req, res) => {
  const edificio = req.params.edificio;
  console.log(`Edificio recibido: ${edificio}`); // Verifica qué valor se recibe

  const query = `
    SELECT aula 
    FROM ubicaciones 
    WHERE edificio = ? 
    ORDER BY aula
  `;

  connection.query(query, [edificio], (err, result) => {
    if (err) {
      console.error('Error al obtener aulas:', err);
      return res.status(500).send('Error al obtener aulas.');
    }
    console.log(`Aulas encontradas: ${JSON.stringify(result)}`); // Verifica los resultados obtenidos
    res.json(result);
  });
});


// Ruta para mostrar la página de incidencias
app.get('/incidencias', isAuthenticated, (req, res) => {
  const queryEdificios = 'SELECT DISTINCT edificio FROM ubicaciones';
  const queryTiposIncidencia = 'SELECT DISTINCT tipo_incidencia FROM tipos_incidencia';
  const queryIncidencias = 'SELECT * FROM incidencias';

  // Obtener edificios
  connection.query(queryEdificios, (err, edificios) => {
    if (err) {
      console.error('Error al obtener edificios:', err);
      return res.status(500).send('Error al obtener edificios.');
    }

    // Obtener tipos de incidencia
    connection.query(queryTiposIncidencia, (err, tiposIncidencia) => {
      if (err) {
        console.error('Error al obtener tipos de incidencia:', err);
        return res.status(500).send('Error al obtener tipos de incidencia.');
      }

      // Obtener incidencias registradas
      connection.query(queryIncidencias, (err, incidencias) => {
        if (err) {
          console.error('Error al obtener incidencias:', err);
          return res.status(500).send('Error al obtener incidencias.');
        }

        // Renderizar la vista pasando los datos necesarios
        res.render('incidencias', {
          edificios: edificios,
          tiposIncidencia: tiposIncidencia,
          incidencias: incidencias,
        });
      });
    });
  });
});



// Ruta para obtener los tipos de incidencia
app.get('/tipos_incidencia', isAuthenticated, (req, res) => {
  const query = 'SELECT DISTINCT tipo_incidencia FROM incidencias';

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener tipos de incidencia:', err);
      return res.status(500).send('Error al obtener tipos de incidencia.');
    }

    res.json(results);  // Devuelve los tipos de incidencia en formato JSON
  });
});



// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
