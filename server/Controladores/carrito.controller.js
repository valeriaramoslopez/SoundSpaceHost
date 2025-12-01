const pool = require('../DB/conexion');

// Añadir item al carrito (insertar o actualizar cantidad)
async function addItem(req, res) {
    const { usuario_id, producto_id, cantidad, nombre_imagen } = req.body;
    if (!usuario_id || !producto_id || !cantidad) {
        return res.status(400).json({ success: false, message: 'usuario_id, producto_id y cantidad son requeridos' });
    }
    try {
        // Buscar si el producto ya existe en el carrito del usuario
        const [rows] = await pool.query('SELECT * FROM carrito WHERE usuario_id = ? AND producto_id = ?', [usuario_id, producto_id]);
        if (rows.length > 0) {
            // Actualizar cantidad y, si se proporciona, nombre_imagen
            let result;
            if (nombre_imagen !== undefined && nombre_imagen !== null) {
                [result] = await pool.query('UPDATE carrito SET cantidad = cantidad + ?, nombre_imagen = ? WHERE usuario_id = ? AND producto_id = ?', [Number(cantidad), nombre_imagen, usuario_id, producto_id]);
            } else {
                [result] = await pool.query('UPDATE carrito SET cantidad = cantidad + ? WHERE usuario_id = ? AND producto_id = ?', [Number(cantidad), usuario_id, producto_id]);
            }
            return res.json({ success: true, updated: result.affectedRows });
        }
        // Insertar nueva fila al carrito (usando nombre_imagen si se proporciona)
        const [result] = await pool.query('INSERT INTO carrito (usuario_id, producto_id, cantidad, nombre_imagen) VALUES (?, ?, ?, ?)', [usuario_id, producto_id, Number(cantidad), nombre_imagen || null]);
        return res.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Error en carrito.addItem:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

// Obtener items del carrito por usuario (con detalles del producto)
async function getItemsByUser(req, res) {
    const usuarioId = req.params.usuario_id;
    if (!usuarioId) {
        return res.status(400).json({ success: false, message: 'usuario_id es requerido' });
    }
    try {
        const [rows] = await pool.query(`
            SELECT c.id as carrito_id, c.usuario_id, c.producto_id, c.cantidad, c.nombre_imagen,
                   p.titulo, p.precio, p.imagen, p.artista, p.oferta, p.disponibilidad
            FROM carrito c
            JOIN productos p ON c.producto_id = p.id
            WHERE c.usuario_id = ?
        `, [usuarioId]);
        return res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error en carrito.getItemsByUser:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

// Actualizar cantidad de item del carrito por id (carrito.id)
async function updateItem(req, res) {
    const carritoId = req.params.id;
    const { cantidad } = req.body;
    if (!carritoId || cantidad === undefined) {
        return res.status(400).json({ success: false, message: 'id y cantidad son requeridos' });
    }
    try {
        const [result] = await pool.query('UPDATE carrito SET cantidad = ? WHERE id = ?', [Number(cantidad), carritoId]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Item no encontrado' });
        return res.json({ success: true, updated: result.affectedRows });
    } catch (error) {
        console.error('Error en carrito.updateItem:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

// Eliminar item del carrito por id
async function deleteItem(req, res) {
    const carritoId = req.params.id;
    if (!carritoId) {
        return res.status(400).json({ success: false, message: 'id es requerido' });
    }
    try {
        const [result] = await pool.query('DELETE FROM carrito WHERE id = ?', [carritoId]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Item no encontrado' });
        return res.json({ success: true, deleted: result.affectedRows });
    } catch (error) {
        console.error('Error en carrito.deleteItem:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

module.exports = {
    addItem,
    getItemsByUser,
    updateItem,
    deleteItem
};
