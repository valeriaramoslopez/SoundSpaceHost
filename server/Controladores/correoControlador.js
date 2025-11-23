const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

// ✅ TRANSPORTER CONFIG
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.CORREO_APP,
        pass: process.env.PASS_APP
    },
    tls: {
        rejectUnauthorized: false
    }
});

// ✅ CARGA DEL TEMPLATE HTML
const loadTemplate = () => {
    return fs.readFileSync(
        path.join(__dirname, "../email.html"), // asegúrate que email.html esté aquí
        "utf8"
    );
};

// ✅ SOLO CARGA LAS 5 IMÁGENES QUE QUIERES
const loadImages = () => {
    const imgDir = path.join(__dirname, "../uploads");

    const selectedImages = [
        "8e76aa009656f1878b593997e12ac82e.png",
        "99382194e9fb526827881d7412918060.png",
        "d3ad6d5706d88328a51ff404a2591a50.png", // cambia extensión si no es .png
        "dd7b59e793dcfe6e47f4cde80d34b0de.png",
        "f72ada15a47117d90a53ac9a45df476e.png"
    ];

    return selectedImages.map((file, index) => ({
        filename: file,
        path: path.join(imgDir, file),
        cid: `img${index}` // ✅ usado en HTML
    }));
};

// ✅ CONTROLADOR — CONTACTO
exports.enviarContacto = async (req, res) => {
    const { nombre, email, telefono, asunto, mensaje } = req.body;

    try {
        // 1️⃣ Cargar plantilla
        let html = loadTemplate();

        // 2️⃣ Reemplazar variables del template
        html = html
            .replace(/{{nombre}}/g, nombre)
            .replace(/{{email}}/g, email)
            .replace(/{{telefono}}/g, telefono)
            .replace(/{{asunto}}/g, asunto)
            .replace(/{{mensaje}}/g, mensaje);

        // 3️⃣ Enviar correo
        await transporter.sendMail({
            from: `"Mi Empresa" <${process.env.CORREO_APP}>`,
            to: email,
            subject: "En breve te atenderemos ✅",
            html,
            attachments: loadImages()
        });

        res.json({ message: "Correo enviado correctamente ✔" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error enviando correo ❌" });
    }
};
