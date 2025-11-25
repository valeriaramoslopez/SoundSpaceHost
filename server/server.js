const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const baseRutas = require('./Rutas/dbProductoRutas');
const usuarioRutas = require("./Rutas/usuarioRutas");
const correoRutas = require("./Rutas/correoRutas");
const captchaRutas = require('./Rutas/captchaRutas'); 
const pool = require('./DB/conexion');
const fs = require("fs");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Carpeta pública para imágenes del email
app.use("/public", express.static(path.join(__dirname, "public")));

// Carpeta donde subes fotos
const carpeta = path.join(__dirname, "uploads");
app.use("/uploads", express.static(carpeta));

app.get("/imagenes", (req, res) => {
  try {
    const archivos = fs.readdirSync(carpeta);
    res.json(archivos);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al leer carpeta de imágenes" });
  }
});

// Rutas principales
app.get('/', (req, res) => {
  res.send('API funcionando correctamente 🚀');
});

app.use('/api/productos', baseRutas);
app.use('/api/usuarios', usuarioRutas);
app.use('/api/correo', correoRutas);  
app.use('/api/captcha', captchaRutas);

// Probar conexión a BD
async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    console.log(' Conexión a BD OK, resultado:', rows[0].result);
  } catch (error) {
    console.error(' Error en conexión BD:', error.message);
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
  testConnection();
});
