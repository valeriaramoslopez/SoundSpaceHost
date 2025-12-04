document.addEventListener('DOMContentLoaded', () => {

    // ---------------------- REFERENCIAS ----------------------
    const finalizarCompraBtn = document.querySelector('.btn-finalizar-pago');
    const paymentOptions = document.querySelectorAll('input[name="payment-method"]');

    const formContainers = {
        'card': document.getElementById('card-form'),
        'transfer': document.getElementById('transfer-form'),
        'oxxo': document.getElementById('oxxo-form')
    };

    const shippingInputs = document.querySelectorAll('#shipping-form input[required], #shipping-form select[required]');
    const cardInputs = document.querySelectorAll('#card-form input[required]');
    const transferInputs = document.querySelectorAll('#transfer-form input[required]');
    const oxxoInputs = document.querySelectorAll('#oxxo-form input[required]');

    let selectedMethod = "card";

    // ---------------------- MARCAR INPUT ----------------------
    function markInput(input, valid, message = "") {
        let errorMsg = input.parentElement.querySelector(".error-msg");

        if (!errorMsg) {
            errorMsg = document.createElement("div");
            errorMsg.classList.add("error-msg");
            input.parentElement.appendChild(errorMsg);
        }

        if (valid) {
            input.classList.remove("input-error");
            input.classList.add("input-valid");
            errorMsg.classList.remove("active");
        } else {
            input.classList.add("input-error");
            input.classList.remove("input-valid");
            errorMsg.textContent = message;
            errorMsg.classList.add("active");
        }
    }

    // ---------------------- VALIDACIONES ----------------------
    function validateEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    function validateCardNumber(value) {
        return /^\d{16}$/.test(value);
    }

    function validateCVV(value) {
        return /^\d{3,4}$/.test(value);
    }

    function validateNotEmpty(value) {
        return value.trim().length > 0;
    }

    function validateNumeric(value) {
        return /^\d+$/.test(value);
    }

    // ---------------------- VALIDACIÓN GLOBAL ----------------------
    function validateAll() {
        let formValid = true;

        // Validar envío
        shippingInputs.forEach(input => {
            const valid = validateNotEmpty(input.value);
            markInput(input, valid, "Este campo es obligatorio");
            if (!valid) formValid = false;
        });

        // Validar método de pago
        if (selectedMethod === "card") {
            cardInputs.forEach(input => {
                let valid = validateNotEmpty(input.value);
                let message = "Este campo es obligatorio";

                if (input.id === "card-number") {
                    valid = validateCardNumber(input.value);
                    message = "La tarjeta debe tener 16 dígitos";
                }

                if (input.id === "card-cvv") {
                    valid = validateCVV(input.value);
                    message = "CVV inválido";
                }

                if (input.id === "card-email") {
                    valid = validateEmail(input.value);
                    message = "Email inválido";
                }

                markInput(input, valid, message);
                if (!valid) formValid = false;
            });
        }

        if (selectedMethod === "transfer") {
            transferInputs.forEach(input => {
                const valid = validateNotEmpty(input.value);
                markInput(input, valid, "Este campo es obligatorio");
                if (!valid) formValid = false;
            });
        }

        if (selectedMethod === "oxxo") {
            oxxoInputs.forEach(input => {
                const valid = validateNotEmpty(input.value);
                markInput(input, valid, "Este campo es obligatorio");
                if (!valid) formValid = false;
            });
        }

        // Activar/desactivar botón
        finalizarCompraBtn.disabled = !formValid;
        finalizarCompraBtn.textContent = formValid
            ? "Terminar Compra"
            : "Completa los datos para continuar";

        return formValid;
    }

    // Disparar validación con cada input
    document.querySelectorAll("input, select").forEach(el => {
        el.addEventListener("input", validateAll);
    });

    validateAll();


    // ---------------------- CAMBIO DE MÉTODO ----------------------
    function showPaymentForm(method) {
        selectedMethod = method;

        Object.values(formContainers).forEach(form => {
            form.classList.add("hidden");
            form.classList.remove("active");
        });

        formContainers[method].classList.add("active");
        formContainers[method].classList.remove("hidden");

        validateAll();
    }

    paymentOptions.forEach(opt => {
        opt.addEventListener("change", e => showPaymentForm(e.target.value));
    });

    showPaymentForm("card");


    // ---------------------- FINALIZAR COMPRA ----------------------
    finalizarCompraBtn.addEventListener('click', async () => {

        if (!validateAll()) {
            Swal.fire("Datos incompletos", "Revisa los campos marcados.", "warning");
            return;
        }

        const usuario = JSON.parse(localStorage.getItem("usuario"));

        if (!usuario || !usuario.id) {
            Swal.fire("Inicia sesión", "Debes iniciar sesión para continuar", "warning");
            return;
        }

        const confirm = await Swal.fire({
            title: "¿Confirmar compra?",
            text: "Se enviará la nota de compra a tu correo",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí",
            cancelButtonText: "Cancelar"
        });

        if (!confirm.isConfirmed) return;

        const cupon = JSON.parse(localStorage.getItem("cupon")) || {};

        const url = `http://localhost:3000/api/nota/compra`;
        
        try {

            // AQUI LEEMOS EL PAÍS 
            const pais = document.getElementById("pais") ? document.getElementById("pais").value : "México";

            const resp = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    usuario_id: usuario.id,
                    cupon_codigo: cupon.codigo || null,
                    cupon_descuento: cupon.descuento || 0,
                    pais: pais 
                })
            });

            const json = await resp.json();

            if (json.success) {
                Swal.fire("Éxito", "Nota enviada a tu correo", "success");
                localStorage.removeItem("cupon");
                setTimeout(() => location.href = "tienda.html", 1200);
            }

        } catch (err) {
            console.error(err);
            Swal.fire("Error", "No se pudo completar la compra", "error");
        }

    });

});
