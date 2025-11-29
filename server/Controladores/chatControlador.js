const chatModelo = require('../Modelo/chatModelo');

module.exports = {

    async enviarMensaje(req, res) {
        try {
            const { idUsuario, mensaje } = req.body;

            if (!idUsuario || !mensaje) {
                return res.status(400).json({ mensaje: "Faltan datos" });
            }

            await chatModelo.guardarMensaje(idUsuario, mensaje);

            return res.json({
                mensaje: "Mensaje procesado"
            });

        } catch (error) {
            console.log("Error en enviarMensaje:", error);
            res.status(500).json({ mensaje: "Error en el servidor" });
        }
    },

    async historial(req, res) {
        try {
            const idUsuario = req.params.id;

            const historial = await chatModelo.obtenerHistorial(idUsuario);

            return res.json(historial);

        } catch (error) {
            console.log("Error en historial:", error);
            res.status(500).json({ mensaje: "Error en el servidor" });
        }
    }
};
