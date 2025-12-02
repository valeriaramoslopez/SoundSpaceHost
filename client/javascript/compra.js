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
    // Acción al clicar Finalizar Compra
    finalizarCompraBtn.addEventListener('click', async () => {
        // Asegurarse de que el botón esté habilitado
        if (finalizarCompraBtn.disabled) return;
        const usuario = JSON.parse(localStorage.getItem('usuario')) || null;
        if (!usuario || !usuario.id) {
            Swal.fire('Debes iniciar sesión', 'Debes iniciar sesión para finalizar la compra', 'warning');
            return;
        }

        const confirmResult = await Swal.fire({
            title: '¿Terminar Compra?',
            text: 'Se enviará la nota de compra a tu correo electrónico',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, enviar nota',
            cancelButtonText: 'Cancelar'
        });

        if (!confirmResult.isConfirmed) return;

            // Opcional: incluir datos de dirección para incluirlos en el PDF
            const shippingForm = document.getElementById('shipping-form');
            const formData = { usuario_id: usuario.id };
            const apiOrigin = (location.protocol === 'file:') ? 'http://localhost:3000' : `${location.protocol}//${location.host}`;
            const primary = `${apiOrigin}/api/nota/compra`;
            const fallback = 'http://localhost:3000/api/nota/compra';
        // Podríamos extraer más campos si es necesario

        try {
            let resp = await fetch(primary, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (!resp.ok) {
                console.warn(`POST nota comp failed (${resp.status}) at primary, falling back to ${fallback}`);
                resp = await fetch(fallback, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
            }
            if (!resp.ok) {
                const text = await resp.text();
                throw new Error(`HTTP ${resp.status} - ${text}`);
            }
            const json = await resp.json();
            if (json && json.success) {
                Swal.fire('Enviado', 'La nota de compra ha sido enviada a tu correo', 'success');
            } else {
                Swal.fire('Error', json.message || 'Ocurrió un error', 'error');
            }
        } catch (err) {
            console.error('Error al finalizar compra:', err);
            Swal.fire('Error', 'No se pudo enviar la nota de compra. Ver consola para detalles', 'error');
        }
    });
});

// Nota: el listener anterior para btnPDF antiguo ha sido reemplazado por el botón
// .btn-finalizar-pago y el listener agregado arriba para enviar /api/nota/compra.