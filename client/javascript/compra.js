document.addEventListener('DOMContentLoaded', () => {

    // --------------------- MOSTRAR FORMULARIOS DE PAGO ---------------------
    const paymentOptions = document.querySelectorAll('input[name="payment-method"]');
    const formContainers = {
        'card': document.getElementById('card-form'),
        'transfer': document.getElementById('transfer-form'),
        'oxxo': document.getElementById('oxxo-form')
    };

    function showPaymentForm(method) {
        Object.values(formContainers).forEach(form => {
            form.classList.remove('active');
            form.classList.add('hidden');
        });

        const activeForm = formContainers[method];
        if (activeForm) {
            activeForm.classList.add('active');
            activeForm.classList.remove('hidden');
        }
    }

    showPaymentForm('card'); // Default

    paymentOptions.forEach(option => {
        option.addEventListener('change', (e) => {
            showPaymentForm(e.target.value);
        });
    });

    // --------------------- HABILITAR BOTÓN SI ENVÍO ESTÁ COMPLETO ---------------------
    const shippingInputs = document.querySelectorAll('#shipping-form input[required], #shipping-form select[required]');
    const finalizarCompraBtn = document.querySelector('.btn-finalizar-pago');

    function checkShippingForm() {
        let isComplete = true;
        shippingInputs.forEach(input => {
            if (!input.value.trim()) {
                isComplete = false;
            }
        });

        finalizarCompraBtn.disabled = !isComplete;
        finalizarCompraBtn.textContent = isComplete ? 'Terminar Compra' : 'Rellena los campos de Envío';
    }

    shippingInputs.forEach(input => {
        input.addEventListener('input', checkShippingForm);
    });

    checkShippingForm();


    // --------------------- FINALIZAR COMPRA ---------------------
    finalizarCompraBtn.addEventListener('click', async () => {

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

        // Obtener cupón de localStorage
        const cupon = JSON.parse(localStorage.getItem("cupon")) || {};

        // Crear rutas correctas
        const apiOrigin = (location.protocol === 'file:') ? 'http://localhost:3000' : `${location.protocol}//${location.host}`;
        const primary = `${apiOrigin}/api/nota/compra`;
        const fallback = 'http://localhost:3000/api/nota/compra';

        try {
            // ----- PETICIÓN PRINCIPAL -----
            let resp = await fetch(primary, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usuario_id: usuario.id,
                    cupon_codigo: cupon.codigo || null,
                    cupon_descuento: cupon.descuento || 0
                })
            });

            // ----- FALLBACK -----
            if (!resp.ok) {
                console.warn(`POST nota sending failed (${resp.status}), fallback → ${fallback}`);

                resp = await fetch(fallback, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        usuario_id: usuario.id,
                        cupon_codigo: cupon.codigo || null,
                        cupon_descuento: cupon.descuento || 0
                    })
                });
            }

            if (!resp.ok) {
                const text = await resp.text();
                throw new Error(`HTTP ${resp.status} ➜ ${text}`);
            }

            const json = await resp.json();

            if (json && json.success) {
                Swal.fire('Enviado', 'La nota de compra ha sido enviada a tu correo', 'success');

                // Limpiar cupón
                localStorage.removeItem("cupon");

                // Redirigir a tienda
                setTimeout(() => { 
                    window.location.href = 'tienda.html'; 
                }, 1300);

            } else {
                Swal.fire('Error', json.message || 'Ocurrió un error', 'error');
            }

        } catch (err) {
            console.error("Error al finalizar compra:", err);
            Swal.fire('Error', 'No se pudo enviar la nota de compra. Revisa la consola.', 'error');
        }

    });

});
