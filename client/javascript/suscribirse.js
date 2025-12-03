document.addEventListener('DOMContentLoaded', function() {
    const subscriptionForm = document.getElementById('subscription-form');
    
    if (subscriptionForm) {
        subscriptionForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const emailInput = document.getElementById('email-suscripcion');
            const submitBtn = document.getElementById('botonSuscripcion');
            const email = emailInput.value.trim();
            
            // Validación básica de email
            if (!email) {
                Swal.fire({
                    title: 'Campo vacío',
                    text: 'Por favor ingresa tu correo electrónico',
                    icon: 'warning',
                    confirmButtonText: 'Entendido'
                });
                return;
            }
            
            if (!isValidEmail(email)) {
                Swal.fire({
                    title: 'Correo inválido',
                    text: 'Por favor ingresa un correo electrónico válido',
                    icon: 'error',
                    confirmButtonText: 'Entendido'
                });
                return;
            }
            
            // Mostrar loading
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Suscribiendo...';
            submitBtn.disabled = true;
            
            try {
                const response = await fetch('http://localhost:3000/api/correo/suscripcion', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: email })
                });
                
                const resultado = await response.json();
                
                if (response.ok) {
                    Swal.fire({
                        title: '¡Suscripción exitosa!',
                        text: resultado.mensaje || 'Te has suscrito correctamente a nuestro newsletter',
                        icon: 'success',
                        confirmButtonText: 'Continuar',
                        showClass: {
                            popup: 'animate__animated animate__zoomIn'
                        },
                        hideClass: {
                            popup: 'animate__animated animate__zoomOut'
                        }
                    });
                    
                    // Limpiar formulario
                    subscriptionForm.reset();
                } else {
                    Swal.fire({
                        title: 'Error en suscripción',
                        text: resultado.mensaje || 'Hubo un problema al procesar tu suscripción',
                        icon: 'error',
                        confirmButtonText: 'Intentar de nuevo',
                        showClass: {
                            popup: 'animate__animated animate__zoomIn'
                        },
                        hideClass: {
                            popup: 'animate__animated animate__zoomOut'
                        }
                    });
                }
                
            } catch (error) {
                console.error('Error al suscribirse:', error);
                Swal.fire({
                    title: 'Error de conexión',
                    text: 'No se pudo conectar con el servidor. Intenta más tarde.',
                    icon: 'error',
                    confirmButtonText: 'Entendido',
                    showClass: {
                        popup: 'animate__animated animate__zoomIn'
                    },
                    hideClass: {
                        popup: 'animate__animated animate__zoomOut'
                    }
                });
            } finally {
                // Restaurar botón
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});

// Función para validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Simple regex para validar formato de email
    return emailRegex.test(email); // Retorna true si es válido, false si no
}