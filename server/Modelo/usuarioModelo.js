const pool = require("../DB/conexion");

async function crearUsuario(nombreCompleto, nombreUsuario, pais, contrasena) {
    const sql = `INSERT INTO usuarios (nombreCompleto, nombreUsuario, pais, contrasena)
        VALUES (?, ?, ?, ?)
    `;

    const [result] = await pool.query(sql, [
        nombreCompleto,
        nombreUsuario,
        pais,
        contrasena
    ]);

    return result.insertId;
}

async function getUsuarioPorNombre(nombreUsuario) {
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE nombreUsuario = ?",[nombreUsuario]);
    return rows[0];
}

module.exports = {
    crearUsuario,
    getUsuarioPorNombre
};
