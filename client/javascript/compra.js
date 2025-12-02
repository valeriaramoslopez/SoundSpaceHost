document.addEventListener('DOMContentLoaded', () => {
    // Lógica para mostrar/ocultar formularios de pago
    const paymentOptions = document.querySelectorAll('input[name="payment-method"]');
    const formContainers = {
        'card': document.getElementById('card-form'),
        'transfer': document.getElementById('transfer-form'),
        'oxxo': document.getElementById('oxxo-form')
    };

    function showPaymentForm(method) {
        // Ocultar todos los formularios
        Object.values(formContainers).forEach(form => {
            form.classList.remove('active');
            form.classList.add('hidden');
        });

        // Mostrar el formulario seleccionado
        const activeForm = formContainers[method];
        if (activeForm) {
            activeForm.classList.add('active');
            activeForm.classList.remove('hidden');
        }
    }

    // Inicializar con la forma de pago por defecto (Tarjeta)
    showPaymentForm('card');

    // Escuchar cambios en los métodos de pago
    paymentOptions.forEach(option => {
        option.addEventListener('change', (e) => {
            showPaymentForm(e.target.value);
        });
    });

    // --- Lógica de Habilitar Botón de Compra (Simulación) ---
    // Revisa si los campos requeridos de envío tienen contenido
    const shippingInputs = document.querySelectorAll('#shipping-form input[required], #shipping-form select[required]');
    const finalizarCompraBtn = document.querySelector('.btn-finalizar-pago');

    function checkShippingForm() {
        let isComplete = true;
        shippingInputs.forEach(input => {
            if (!input.value.trim()) {
                isComplete = false;
            }
        });
        
        // Simulación: el botón se habilita si el formulario de envío está lleno
        finalizarCompraBtn.disabled = !isComplete;
        finalizarCompraBtn.textContent = isComplete ? 'Terminar Compra' : 'Rellena los campos de Envío';
    }

    // Escuchar eventos en los campos del formulario de envío
    shippingInputs.forEach(input => {
        input.addEventListener('input', checkShippingForm);
    });

    // Revisar al cargar
    checkShippingForm();
});

// Funcionalidad de enviar la nota de compra en PDF al correo
btnPDF.addEventListener("click", async () => {
    const confirmResult = await Swal.fire({
        title: '¿Terminar Compra?',
        text: '¿Deseas finalizar tu compra?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, enviar nota de compra',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33'
    });

    if (!confirmResult.isConfirmed) {
        return; // El usuario canceló
    }

    // Enviar solicitud al servidor para generar y enviar el PDF
    try {
        const response = await fetch('/api/enviar-nota-compra', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ carritoId: carritoId }) // Asumiendo que tienes el ID del carrito
        });
    } catch (error) {
        console.error('Error al enviar la nota de compra:', error);
        Swal.fire('Error', 'Hubo un problema al enviar la nota de compra. Inténtalo de nuevo.', 'error');
        return;
    }
});