const express = require('express');
const router = express.Router();
const productoModelo = require('../Modelo/productoModelo.js');

// Ruta POST /api/admin/inventario
// body: { titulo, artista, descripcion, precio, disponibilidad, genero, ventas?, imagen, oferta? }
router.post('/inventario', async (req, res) => {
	const { titulo, artista, descripcion, precio, disponibilidad, genero, ventas, imagen, oferta } = req.body;
	// Validar que los campos obligatorios estén presentes (ventas/oferta opcionales)
	if (!titulo || !artista || !descripcion || !precio || !disponibilidad || !genero || !imagen) {
		return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
	}
	try {
		const id = await productoModelo.createProducto(
			titulo,
			artista,
			descripcion,
			Number(precio) || 0,
			Number(disponibilidad) || 0,
			genero,
			Number(ventas) || 0,
			imagen,
			Number(oferta) || 0
		);
		res.json({ success: true, id });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// GET /api/admin/inventario - devuelve todos los productos (lista para inventario)
router.get('/inventario', async (req, res) => {
	try {
		const productos = await productoModelo.getAllProductos();
		res.json(productos);
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// GET /api/admin/totalventas - devuelve la suma monetaria total de ventas (precio * ventas)
router.get('/totalventas', async (req, res) => {
	try {
		const productos = await productoModelo.getAllProductos();
		const totalVentas = productos.reduce((acc, p) => {
			const precio = Number(p.precio || p.Precio || 0);
			const ventas = Number(p.ventas || p.Ventas || 0);
			return acc + (precio * ventas);
		}, 0);
		res.json({ success: true, total: totalVentas });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// PUT /api/admin/inventario/:id - Actualizar un producto completo
router.put('/inventario/:id', async (req, res) => {
	const { id } = req.params;
	const { titulo, artista, descripcion, precio, disponibilidad, genero, ventas, imagen, oferta } = req.body;
	if (!id) return res.status(400).json({ success: false, message: 'ID requerido' });
	try {
		// Obtener producto existente para usar valores por defecto cuando body no los incluya
		const existing = await productoModelo.getProductoById(Number(id));
		if (!existing) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
		const updated = await productoModelo.updateProducto(
			Number(id),
			titulo ?? existing.titulo,
			artista ?? existing.artista,
			descripcion ?? existing.descripcion,
			Number(precio ?? existing.precio) || 0,
			Number(disponibilidad ?? existing.disponibilidad) || 0,
			genero ?? existing.genero,
			Number(ventas ?? existing.ventas) || 0,
			imagen ?? existing.imagen,
			Number(oferta ?? existing.oferta) || 0
		);
		res.json({ success: true, updated });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

// DELETE /api/admin/inventario/:id - Eliminar producto por id
router.delete('/inventario/:id', async (req, res) => {
	const { id } = req.params;
	if (!id) return res.status(400).json({ success: false, message: 'ID requerido' });
	try {
		const affected = await productoModelo.deleteProducto(Number(id));
		if (affected > 0) {
			res.json({ success: true, deleted: affected });
		} else {
			res.status(404).json({ success: false, message: 'Producto no encontrado' });
		}
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
});

module.exports = router;
