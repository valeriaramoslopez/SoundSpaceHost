const express = require('express');
const router = express.Router();
const notaController = require('../Controladores/nota.controller');

// POST /api/nota/compra - generar PDF y enviar nota de compra
router.post('/compra', notaController.enviarNotaCompra);

module.exports = router;
