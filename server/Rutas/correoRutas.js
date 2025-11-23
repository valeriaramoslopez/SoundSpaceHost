const express = require("express");
const router = express.Router();

// Importa ambos controladores
const { enviarContacto, enviarSuscripcion } = require("../Controladores/correoControlador");

router.post("/contacto", enviarContacto);
router.post("/suscripcion", enviarSuscripcion);

module.exports = router;
