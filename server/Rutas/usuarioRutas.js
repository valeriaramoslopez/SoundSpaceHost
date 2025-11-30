const express = require("express");
const router = express.Router();
const usuarioControlador = require("../Controladores/usuarioControlador");

router.post("/registrar", usuarioControlador.registrarUsuario);
router.post("/login", usuarioControlador.loginUsuario);
router.post("/recuperar", usuarioControlador.recuperarContrasena);

module.exports = router;