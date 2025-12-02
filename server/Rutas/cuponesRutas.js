const express = require("express");
const router = express.Router();

// Importar controlador
const { crearCupon, obtenerCupones, validarCupon, eliminarCupon } = require("../Controladores/cuponesControlador");

// Rutas
router.post("/crear", crearCupon);       // Crear cupón
router.get("/lista", obtenerCupones);    // Ver todos los cupones
router.post("/validar", validarCupon);   // Validar cupón en checkout
router.delete("/eliminar/:id", eliminarCupon); // Eliminar cupón

module.exports = router;
