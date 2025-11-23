document.getElementById("contactForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
        nombre: document.getElementById("nombre").value,
        email: document.getElementById("email").value,
        telefono: document.getElementById("telefono").value,
        asunto: document.getElementById("asunto").value,
        mensaje: document.getElementById("mensaje").value
    };

    try {
        const response = await fetch("http://localhost:3000/api/correo/contacto", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        document.getElementById("formMessage").innerText = result.message;

    } catch (error) {
        console.error("Error al enviar formulario:", error);
        document.getElementById("formMessage").innerText =
            "Error al enviar formulario ❌";
    }
});

