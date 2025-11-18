const express = require("express");
const router = express.Router();
const usuarioControlador = require("../Controladores/usuarioControlador");

router.post("/registrar", usuarioControlador.registrarUsuario);

module.exports = router;