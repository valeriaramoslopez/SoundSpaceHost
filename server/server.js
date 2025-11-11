const express = require('express');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📝 Endpoint de login: POST http://localhost:${PORT}/api/auth/login`);
});