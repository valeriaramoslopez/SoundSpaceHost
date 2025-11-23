const express = require("express");
const router = express.Router();
const { enviarContacto } = require("../Controladores/correoControlador");

router.post("/contacto", enviarContacto);

module.exports = router;
