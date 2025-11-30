const express = require('express');
const router = express.Router();
const chatCtrl = require('../Controladores/chatControlador');

// Enviar mensaje
router.post('/enviar', chatCtrl.enviarMensaje);

// Obtener historial por usuario
router.get('/historial/:id', chatCtrl.historial);

module.exports = router;
