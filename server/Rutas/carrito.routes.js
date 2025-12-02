const express = require('express');
const router = express.Router();
const carritoController = require('../Controladores/carrito.controller');

// POST /api/carrito/add - Añadir o actualizar item en carrito
router.post('/add', carritoController.addItem);
// GET /api/carrito/:usuario_id - Obtener items del carrito por usuario
router.get('/:usuario_id', carritoController.getItemsByUser);
// PUT /api/carrito/:id - Actualizar cantidad de un item
router.put('/:id', carritoController.updateItem);
// DELETE /api/carrito/:id - Eliminar un item
router.delete('/:id', carritoController.deleteItem);

module.exports = router;
