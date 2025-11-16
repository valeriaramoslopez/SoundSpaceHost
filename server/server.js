const express = require('express'); //Servidor
const dotenv = require('dotenv'); //Variables de entorno
const cors = require('cors'); //Permisos
const baseRutas = require('./Rutas/dbProductoRutas'); //Rutas
const pool = require('./DB/conexion'); //Conexion

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());//Habilita cors para permitir peticiones de otros dominios

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

////////////////////////////  BASE DE DATOS //////////////////////////// 
app.get('/', (req, res) => {
  res.send('Api DataBase funcionando correctamente :D');
});

//Rutas
app.use('/api/productos', baseRutas);

async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result'); //Le pide a MySQL que sume 1 + 1, y le ponga el alias result al valor obtenido
    console.log(' Conexión a la base de datos establecida. Resultado:', rows[0].result);
  } catch (error) {
    console.error(' Error al conectar con la base de datos:', error.message);
  }
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📝 Endpoint de login: POST http://localhost:${PORT}/api/auth/login`);
});