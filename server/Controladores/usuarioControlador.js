const bcrypt = require("bcryptjs");
const usuarioModelo = require("../Modelo/usuarioModelo");

async function registrarUsuario(req, res) {
    try {
        const { nombreCompleto, nombreUsuario, pais, contrasena} = req.body;

        if (!nombreCompleto || !nombreUsuario || !pais || !contrasena) {
            return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
        }

        const existe = await usuarioModelo.getUsuarioPorNombre(nombreUsuario);

        if (existe) {
            return res.status(409).json({ mensaje: "El nombre de usuario ya existe" });
        }

        const contra = await bcrypt.hash(contrasena, 10);

        const nuevoId = await usuarioModelo.crearUsuario(
            nombreCompleto,
            nombreUsuario,
            pais,
            contra
        );

        res.status(201).json({
            mensaje: "Usuario registrado correctamente",
            usuarioId: nuevoId
        });

    } catch (error) {
        console.error("Error al registrar usuario:", error);
        res.status(500).json({ mensaje: "Error en el servidor" });
    }
}

module.exports = {
    registrarUsuario
};
