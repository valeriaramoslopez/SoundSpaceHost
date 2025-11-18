const express = require('express'); //Servidor
const dotenv = require('dotenv'); //Variables de entorno
const cors = require('cors'); //Permisos
const baseRutas = require('./Rutas/dbProductoRutas'); //Rutas
const usuarioRutas = require("./Rutas/usuarioRutas"); // Ruta de registro
const pool = require('./DB/conexion'); //Conexion
const fs = require("fs");
const path = require("path");

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); //Habilita cors para permitir peticiones de otros dominios

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

////////////////////////////// IMAGENES ////////////////////////////

// Carpeta donde están las imágenes
const carpeta = path.join(__dirname, "uploads");

// Hacer pública la carpeta /uploads para que se puedan ver las imágenes
app.use("/uploads", express.static(carpeta));

// Endpoint para obtener la lista de imágenes disponibles
app.get("/imagenes", (req, res) => {
  try {
    const archivos = fs.readdirSync(carpeta);
    res.json(archivos);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al leer carpeta de imágenes" });
  }
});

//////////////////////////// BASE DE DATOS ////////////////////////////

app.get('/', (req, res) => {
  res.send('Api DataBase funcionando correctamente :D');
});

//Rutas API de productos
app.use('/api/productos', baseRutas);
app.use("/api/usuarios", usuarioRutas);

// Probar conexión a BD (opcional)
async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    console.log(' Conexión a la base de datos establecida. Resultado:', rows[0].result);
  } catch (error) {
    console.error(' Error al conectar con la base de datos:', error.message);
  }
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  testConnection();
});
