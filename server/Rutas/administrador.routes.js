const express = require('express');
const router = express.Router();
const productoModelo = require('../Modelo/productoModelo');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer to store files in server/uploads
// We will save files using the original filename (sanitized) so
// the DB and uploads reflect only the original name (no prefixes)
const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
	filename: (req, file, cb) => {
		// Sanitize the original filename: remove problematic characters and spaces
		// Use path.basename for extra safety against directory traversal
		const original = path.basename(file.originalname);
		const safe = original.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');
		cb(null, safe);
	}
});
const upload = multer({ storage });

// Ruta POST /api/admin/inventario
// body: { titulo, artista, descripcion, precio, disponibilidad, genero, ventas?, imagen, oferta? }
router.post('/inventario', upload.single('imageFile'), async (req, res) => {
	const { titulo, artista, descripcion, precio, disponibilidad, genero, ventas, imagen, oferta } = req.body;
	// imagenFilename: if an uploaded file exists, multer sets req.file.filename as sanitized name
	// Otherwise, if a user provides an 'imagen' string, sanitize it using path.basename
	let imagenFilename = req.file ? req.file.filename : (imagen ? path.basename(imagen).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '') : null);
	// Si se subió archivo y el usuario envió un `imagen` en el body (nombre deseado), renombrar el archivo guardado
	if (req.file && imagen) {
		try {
			const uploadsDir = path.join(__dirname, '..', 'uploads');
			// sanitize desired name
			let desiredName = path.basename(imagen).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');
			// If the provided name has no extension, use the uploaded file's extension
			const uploadedExt = path.extname(req.file.filename);
			if (!path.extname(desiredName)) desiredName = desiredName + uploadedExt;

			let targetPath = path.join(uploadsDir, desiredName);
			const currentPath = path.join(uploadsDir, req.file.filename);
			let finalName = desiredName;

			// If target equals current file name, nothing to do
			if (req.file.filename !== desiredName) {
				// If target exists, try a non-numeric alternative with -copy, -copy2, etc.
				let copyIndex = 1;
				while (fs.existsSync(targetPath)) {
					const base = path.basename(desiredName, path.extname(desiredName));
					const ext = path.extname(desiredName);
					const suffix = copyIndex === 1 ? '-copy' : `-copy${copyIndex}`;
					finalName = `${base}${suffix}${ext}`;
					targetPath = path.join(uploadsDir, finalName);
					copyIndex++;
				}
				// Rename the file to the finalName
				await fs.promises.rename(currentPath, targetPath);
				imagenFilename = finalName;
			}
		} catch (err) {
			console.error('Error renombrando archivo según campo imagen:', err.message);
			// Si renombrar falla, conservamos `req.file.filename` original y seguimos
		}
	}
	// Validar que los campos obligatorios estén presentes (ventas/oferta opcionales)
	if (!titulo || !artista || !descripcion || !precio || !disponibilidad || !genero || !imagenFilename) {
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
			imagenFilename,
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
router.put('/inventario/:id', upload.single('imageFile'), async (req, res) => {
	const { id } = req.params;
	const { titulo, artista, descripcion, precio, disponibilidad, genero, ventas, imagen, oferta } = req.body;
	let imagenFilename = req.file ? req.file.filename : (imagen ? path.basename(imagen).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '') : undefined);
	if (req.file && imagen) {
		try {
			const uploadsDir = path.join(__dirname, '..', 'uploads');
			let desiredName = path.basename(imagen).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');
			const uploadedExt = path.extname(req.file.filename);
			if (!path.extname(desiredName)) desiredName = desiredName + uploadedExt;
			let targetPath = path.join(uploadsDir, desiredName);
			const currentPath = path.join(uploadsDir, req.file.filename);
			let finalName = desiredName;
			if (req.file.filename !== desiredName) {
				let copyIndex = 1;
				while (fs.existsSync(targetPath)) {
					const base = path.basename(desiredName, path.extname(desiredName));
					const ext = path.extname(desiredName);
					const suffix = copyIndex === 1 ? '-copy' : `-copy${copyIndex}`;
					finalName = `${base}${suffix}${ext}`;
					targetPath = path.join(uploadsDir, finalName);
					copyIndex++;
				}
				await fs.promises.rename(currentPath, targetPath);
				imagenFilename = finalName;
			}
		} catch (err) {
			console.error('Error renombrando archivo según campo imagen (PUT):', err.message);
		}
	}
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
			(imagenFilename ?? imagen ?? existing.imagen),
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
