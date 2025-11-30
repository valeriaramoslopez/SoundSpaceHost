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

        Swal.fire({
            title: result.message,
            text: 'Gracias por sus comentarios',
            icon: 'success',
            confirmButtonText: 'Continuar',
            showClass: {
            popup: 'animate__animated animate__zoomIn'
        },
        hideClass: {
            popup: 'animate__animated animate__zoomOut'
        }
    });
    } catch (error) {
        console.error("Error al enviar formulario:", error);
        Swal.fire({
            title: result.message,
            text: 'Error al enviar el formulario',
            icon: 'error',
            confirmButtonText: 'Continuar',
            showClass: {
            popup: 'animate__animated animate__zoomIn'
        },
        hideClass: {
            popup: 'animate__animated animate__zoomOut'
        }
    });
    }
});

