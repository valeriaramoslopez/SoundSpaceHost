/* carrito.js
   - Carga y muestra los items del carrito para el usuario actual
   - Actualiza cantidad (PUT) y elimina items (DELETE)
   - Maneja la validación y aplicación de cupones de descuento
*/

(function() {
    const apiOrigin = (location.protocol === 'file:') ? 'http://localhost:3000' : `${location.protocol}//${location.host}`;
    const primaryBase = `${apiOrigin}/api/carrito`;
    const fallbackBase = 'http://localhost:3000/api/carrito';
    const cuponBase = `${apiOrigin}/api/cupones`;
    const cuponFallback = 'http://localhost:3000/api/cupones';

    // Variables para almacenar el cupón actual
    let cuponActual = null;
    let descuentoAplicado = 0;

    document.addEventListener('DOMContentLoaded', () => {
        initCartPage();
        initCouponEvents();
    });

    // Inicializar eventos del cupón
    function initCouponEvents() {
        const btnAplicar = document.querySelector('.btn-apply-coupon');
        const inputCupon = document.getElementById('coupon-code');
        const messageContainer = document.querySelector('.coupon-message');

        if (btnAplicar) {
            btnAplicar.addEventListener('click', aplicarCupon);
        }

        if (inputCupon) {
            inputCupon.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    aplicarCupon();
                }
            });
        }
    }

    // Función para aplicar un cupón
    async function aplicarCupon() {
        const inputCupon = document.getElementById('coupon-code');
        const messageContainer = document.querySelector('.coupon-message');
        
        if (!inputCupon || !messageContainer) return;

        const codigo = inputCupon.value.trim();
        if (!codigo) {
            showCouponMessage('Ingresa un código de cupón', 'error');
            return;
        }

        // Limpiar mensajes anteriores
        messageContainer.className = 'coupon-message';
        messageContainer.innerHTML = '';

        try {
            // Validar cupón con la API
            const url = `${cuponBase}/validar`;
            let resp = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ codigo })
            });

            // Intentar con fallback si falla
            if (!resp.ok) {
                resp = await fetch(`${cuponFallback}/validar`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ codigo })
                });
            }

            const data = await resp.json();

            if (!resp.ok) {
                showCouponMessage(data.message || 'Error al validar cupón', 'error');
                cuponActual = null;
                descuentoAplicado = 0;
                recalcTotals();
                return;
            }

            // Cupón válido - almacenar datos
            cuponActual = {
                codigo: codigo,
                descuento: data.descuento,
                descuentoMonto: 0 // Se calculará en updateSummary
            };
            descuentoAplicado = data.descuento;

            // Mostrar mensaje de éxito con icono
            showCouponMessage(`<i class="fas fa-check-circle"></i> Cupón "${codigo}" aplicado (${data.descuento}% de descuento)`, 'success');
            
            // Recalcular totales con el descuento
            recalcTotals();

        } catch (error) {
            console.error('Error al aplicar cupón:', error);
            showCouponMessage('<i class="fas fa-exclamation-circle"></i> Error al conectar con el servidor', 'error');
            cuponActual = null;
            descuentoAplicado = 0;
            recalcTotals();
        }
    }

    // Mostrar mensajes del cupón
    function showCouponMessage(message, type = 'info') {
        const messageContainer = document.querySelector('.coupon-message');
        if (!messageContainer) return;

        messageContainer.innerHTML = message;
        messageContainer.className = 'coupon-message';
        messageContainer.style.display = 'block';
        
        if (type === 'success') {
            messageContainer.classList.add('success-message');
        } else if (type === 'error') {
            messageContainer.classList.add('error-message');
        } else {
            messageContainer.classList.add('info-message');
        }
    }

    // Inicializar página del carrito
    async function initCartPage() {
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        if (!usuario || !usuario.id) {
            showMessage('Debes iniciar sesión para ver tu carrito.');
            return;
        }

        const usuarioId = usuario.id;
        await loadCartItems(usuarioId);

        const btnFinalizar = document.getElementById('btn-finalizar-pago');
        if (btnFinalizar) {
            btnFinalizar.addEventListener('click', () => {
                // Guardar el cupón en localStorage para usarlo en la página de compra
                if (cuponActual) {
                    localStorage.setItem('cuponAplicado', JSON.stringify({
                        codigo: cuponActual.codigo,
                        descuento: cuponActual.descuento
                    }));
                } else {
                    // Limpiar cupón anterior si existe
                    localStorage.removeItem('cuponAplicado');
                }
                window.location.href = 'compra.html';
            });
        }
    }

    // Mostrar mensaje general
    function showMessage(text) {
        const container = document.querySelector('.cart-items-container');
        if (!container) return;
        
        // Remover items de ejemplo excepto el header
        const header = container.querySelector('.cart-header-row');
        container.innerHTML = '';
        if (header) container.appendChild(header);
        
        const msg = document.createElement('p');
        msg.className = 'no-productos';
        msg.textContent = text;
        container.appendChild(msg);
    }

    // Cargar items del carrito
    async function loadCartItems(usuarioId) {
        const url = `${primaryBase}/${usuarioId}`;
        try {
            let resp = await fetch(url);
            if (!resp.ok) {
                // intentar con fallback
                resp = await fetch(`${fallbackBase}/${usuarioId}`);
            }
            if (!resp.ok) {
                const text = await resp.text();
                throw new Error(`HTTP ${resp.status} - ${text}`);
            }
            const data = await resp.json();
            if (!data.success) {
                showMessage('No se pudo cargar el carrito.');
                return;
            }
            renderCartItems(data.data);
        } catch (err) {
            console.error('Error loading cart items:', err);
            showMessage('No se pudieron cargar los items del carrito.');
        }
    }

    // Renderizar items del carrito en la UI
    function renderCartItems(items) {
        const container = document.querySelector('.cart-items-container');
        if (!container) return;
        const header = container.querySelector('.cart-header-row');
        
        // Remover items existentes del carrito
        container.querySelectorAll('.cart-item').forEach(el => el.remove());

        // Remover el mensaje "no productos" si existe
        const noProductos = container.querySelector('.no-productos');
        if (noProductos) noProductos.remove();

        if (!items || items.length === 0) {
            showMessage('El carrito está vacío');
            updateSummary(0);
            return;
        }

        let subtotal = 0;

        items.forEach(item => {
            const precio = Number(item.precio) || 0;
            const oferta = Number(item.oferta) || 0;
            const precioUnitario = oferta > 0 ? precio * (1 - oferta / 100) : precio;
            const cantidad = Number(item.cantidad) || 1;
            const itemSubtotal = precioUnitario * cantidad;
            subtotal += itemSubtotal;

            const cartItemEl = document.createElement('div');
            cartItemEl.className = 'cart-item';
            cartItemEl.dataset.carritoId = item.carrito_id;
            cartItemEl.dataset.nombreImagen = item.nombre_imagen || item.imagen || '';

            cartItemEl.innerHTML = `
                <div class="cart-col product-col">
                    <img src="${apiOrigin}/uploads/${item.nombre_imagen}" alt="${item.titulo}" class="cart-item-img" onerror="this.onerror=null; this.src='http://localhost:3000/uploads/${item.nombre_imagen}'">
                    <div class="item-info">
                        <h4>${item.titulo}</h4>
                        <p>${item.artista}</p>
                    </div>
                </div>
                <span class="cart-col price-col" data-price="${precioUnitario.toFixed(2)}">$${precioUnitario.toFixed(2)}</span>
                <div class="cart-col quantity-col">
                    <div class="quantity-control">
                        <button class="quantity-btn decrement" data-carrito-id="${item.carrito_id}">-</button>
                        <input type="number" value="${cantidad}" min="1" class="item-quantity" data-carrito-id="${item.carrito_id}">
                        <button class="quantity-btn increment" data-carrito-id="${item.carrito_id}">+</button>
                    </div>
                </div>
                <span class="cart-col subtotal-col" data-subtotal="${itemSubtotal.toFixed(2)}">$${itemSubtotal.toFixed(2)}</span>
                <div class="cart-col actions-col">
                    <button class="btn-remove" data-carrito-id="${item.carrito_id}"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;

            // Insertar después del header si existe, si no, añadir al final
            if (header) container.insertBefore(cartItemEl, header.nextSibling);
            else container.appendChild(cartItemEl);
        });

        attachCartListeners();
        updateSummary(subtotal);
    }

    // Adjuntar listeners a los controles del carrito
    function attachCartListeners() {
        // Botones de decrementar
        document.querySelectorAll('.quantity-btn.decrement').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.dataset.carritoId;
                const input = document.querySelector(`.item-quantity[data-carrito-id="${id}"]`);
                let qty = Number(input.value) || 1;
                if (qty <= 1) return;
                qty -= 1;
                input.value = qty;
                await updateItemQuantity(id, qty);
            });
        });

        // Botones de incrementar
        document.querySelectorAll('.quantity-btn.increment').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.dataset.carritoId;
                const input = document.querySelector(`.item-quantity[data-carrito-id="${id}"]`);
                let qty = Number(input.value) || 1;
                qty += 1;
                input.value = qty;
                await updateItemQuantity(id, qty);
            });
        });

        // Cambios manuales en la cantidad
        document.querySelectorAll('.item-quantity').forEach(input => {
            input.addEventListener('change', async function() {
                let qty = Number(this.value);
                if (!qty || qty < 1) {
                    qty = 1;
                    this.value = 1;
                }
                const id = this.dataset.carritoId;
                await updateItemQuantity(id, qty);
            });
        });

        // Botones de eliminar
        document.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.dataset.carritoId;
                if (confirm('¿Estás seguro de que quieres eliminar este producto del carrito?')) {
                    await removeItem(id);
                }
            });
        });
    }

    // Actualizar cantidad de un item
    async function updateItemQuantity(carritoId, cantidad) {
        const url = `${primaryBase}/${carritoId}`;
        try {
            // Incluir nombre_imagen si está presente en la fila
            const cartRow = document.querySelector(`.cart-item[data-carrito-id="${carritoId}"]`);
            const nombre_imagen = cartRow ? cartRow.dataset.nombreImagen : undefined;
            let body = { cantidad };
            
            if (typeof nombre_imagen !== 'undefined' && nombre_imagen !== null && nombre_imagen !== '') {
                body.nombre_imagen = nombre_imagen;
            }
            
            let resp = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            
            if (!resp.ok) {
                resp = await fetch(`${fallbackBase}/${carritoId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
            }
            
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            
            // Actualizar subtotal del item y totales
            const itemRow = document.querySelector(`.cart-item[data-carrito-id="${carritoId}"]`);
            if (itemRow) {
                const priceEl = itemRow.querySelector('.price-col');
                const price = Number(priceEl.dataset.price) || 0;
                const newSubtotal = price * cantidad;
                const subtotalEl = itemRow.querySelector('.subtotal-col');
                subtotalEl.textContent = `$${newSubtotal.toFixed(2)}`;
                subtotalEl.dataset.subtotal = newSubtotal.toFixed(2);
            }
            
            recalcTotals();
            
        } catch (err) {
            console.error('Error updating item quantity:', err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo actualizar la cantidad'
            });
        }
    }

    // Eliminar item del carrito
    async function removeItem(carritoId) {
        const url = `${primaryBase}/${carritoId}`;
        try {
            let resp = await fetch(url, { method: 'DELETE' });
            if (!resp.ok) {
                resp = await fetch(`${fallbackBase}/${carritoId}`, { method: 'DELETE' });
            }
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            
            // Eliminar fila del DOM
            const itemRow = document.querySelector(`.cart-item[data-carrito-id="${carritoId}"]`);
            if (itemRow) itemRow.remove();
            
            // Verificar si el carrito quedó vacío
            const items = document.querySelectorAll('.cart-item');
            if (items.length === 0) {
                showMessage('El carrito está vacío');
            }
            
            recalcTotals();
            
            Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: 'Producto eliminado del carrito',
                timer: 1500,
                showConfirmButton: false
            });
            
        } catch (err) {
            console.error('Error removing cart item:', err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar el producto'
            });
        }
    }

    // Recalcular totales del carrito
    function recalcTotals() {
        const subtotalEls = document.querySelectorAll('.subtotal-col');
        let sum = 0;
        subtotalEls.forEach(el => {
            sum += Number(el.dataset.subtotal) || 0;
        });
        updateSummary(sum);
    }

    // Actualizar resumen con descuento de cupón
    function updateSummary(subtotal) {
        // Actualizar subtotal
        const elSubtotal = document.getElementById('summary-subtotal');
        if (elSubtotal) elSubtotal.textContent = `$${subtotal.toFixed(2)}`;

        // Calcular descuento del cupón si existe
        let descuentoMonto = 0;
        if (cuponActual && descuentoAplicado > 0) {
            descuentoMonto = (subtotal * descuentoAplicado) / 100;
            cuponActual.descuentoMonto = descuentoMonto;
        }

        // Calcular impuestos sobre el subtotal menos el descuento
        const baseImponible = subtotal - descuentoMonto;
        const tax = baseImponible * 0.16;
        const shipping = subtotal > 0 ? 15.00 : 0.00;
        const total = baseImponible + tax + shipping;

        // Actualizar elementos del DOM
        const elDiscount = document.getElementById('summary-discount');
        const elTax = document.getElementById('summary-tax');
        const elShipping = document.getElementById('summary-shipping');
        const elTotal = document.getElementById('summary-total-amount');

        // Actualizar descuento
        if (elDiscount) {
            if (descuentoMonto > 0) {
                elDiscount.textContent = `-$${descuentoMonto.toFixed(2)}`;
                elDiscount.style.color = '#4CAF50';
                elDiscount.style.fontWeight = 'bold';
            } else {
                elDiscount.textContent = '$0.00';
                elDiscount.style.color = '';
                elDiscount.style.fontWeight = '';
            }
        }

        // Actualizar impuestos
        if (elTax) {
            elTax.textContent = `$${tax.toFixed(2)}`;
        }

        // Actualizar envío
        if (elShipping) {
            elShipping.textContent = subtotal > 0 ? `$${shipping.toFixed(2)}` : '$0.00';
        }

        // Actualizar total
        if (elTotal) {
            elTotal.textContent = `$${total.toFixed(2)}`;
        }

        // Si no hay productos, limpiar cupón
        if (subtotal === 0 && cuponActual) {
            const inputCupon = document.getElementById('coupon-code');
            const messageContainer = document.querySelector('.coupon-message');
            
            if (inputCupon) inputCupon.value = '';
            if (messageContainer) {
                messageContainer.style.display = 'none';
                messageContainer.className = 'coupon-message';
                messageContainer.innerHTML = '';
            }
            
            cuponActual = null;
            descuentoAplicado = 0;
        }
    }

    // Función para limpiar cupón (opcional, si quieres agregar un botón "Quitar cupón")
    function limpiarCupon() {
        const inputCupon = document.getElementById('coupon-code');
        const messageContainer = document.querySelector('.coupon-message');
        
        if (inputCupon) inputCupon.value = '';
        if (messageContainer) {
            messageContainer.style.display = 'none';
            messageContainer.className = 'coupon-message';
            messageContainer.innerHTML = '';
        }
        
        cuponActual = null;
        descuentoAplicado = 0;
        recalcTotals();
        
        Swal.fire({
            icon: 'info',
            title: 'Cupón removido',
            text: 'El descuento ha sido eliminado',
            timer: 1500,
            showConfirmButton: false
        });
    }

    // Hacer funciones disponibles globalmente si es necesario
    window.limpiarCupon = limpiarCupon;

})();