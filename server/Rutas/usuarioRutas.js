const express = require("express");
const router = express.Router();
const usuarioControlador = require("../Controladores/usuarioControlador");
const verificarToken = require("../Middleware/verificarToken");

router.post("/registrar", usuarioControlador.registrarUsuario);
router.post("/login", usuarioControlador.loginUsuario);
router.post("/logout", verificarToken, usuarioControlador.logoutUsuario);

module.exports = router;