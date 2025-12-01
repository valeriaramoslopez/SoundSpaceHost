/* carrito.js
   - Carga y muestra los items del carrito para el usuario actual
   - Actualiza cantidad (PUT) y elimina items (DELETE)
*/

(function() {
    const apiOrigin = (location.protocol === 'file:') ? 'http://localhost:3000' : `${location.protocol}//${location.host}`;
    const primaryBase = `${apiOrigin}/api/carrito`;
    const fallbackBase = 'http://localhost:3000/api/carrito';

    document.addEventListener('DOMContentLoaded', () => {
        initCartPage();
    });

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
                // Para usar el flujo de compra, redirigir a compra.html
                window.location.href = 'compra.html';
            });
        }
    }

    function showMessage(text) {
        const container = document.querySelector('.cart-items-container');
        if (!container) return;
        // Remove existing sample items except header
        const header = container.querySelector('.cart-header-row');
        container.innerHTML = '';
        if (header) container.appendChild(header);
        const msg = document.createElement('p');
        msg.className = 'no-productos';
        msg.textContent = text;
        container.appendChild(msg);
    }

    async function loadCartItems(usuarioId) {
        const url = `${primaryBase}/${usuarioId}`;
        try {
            let resp = await fetch(url);
            if (!resp.ok) {
                // try fallback
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

    // Render the items into the cart UI
    function renderCartItems(items) {
        const container = document.querySelector('.cart-items-container');
        if (!container) return;
        const header = container.querySelector('.cart-header-row');
        // Remove existing cart items (elements with class 'cart-item')
        container.querySelectorAll('.cart-item').forEach(el => el.remove());

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
        
            cartItemEl.innerHTML = `
                <div class="cart-col product-col">
                    <img src="imagenes/${item.nombre_imagen}" alt="${item.titulo}" class="cart-item-img">
                    <div class="item-info">
                        <h3>${item.titulo}</h3>
                        <p>Categoría: ${item.artista}</p>
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

            // Insert after header if header exists, else append
            if (header) container.insertBefore(cartItemEl, header.nextSibling);
            else container.appendChild(cartItemEl);
        });

        attachCartListeners();
        updateSummary(subtotal);
    }

    function attachCartListeners() {
        document.querySelectorAll('.quantity-btn.decrement').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.dataset.carritoId;
                const input = document.querySelector(`.item-quantity[data-carrito-id="${id}"]`);
                let qty = Number(input.value) || 1;
                if (qty <= 1) return; qty -= 1; input.value = qty;
                await updateItemQuantity(id, qty);
            });
        });

        document.querySelectorAll('.quantity-btn.increment').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.dataset.carritoId;
                const input = document.querySelector(`.item-quantity[data-carrito-id="${id}"]`);
                let qty = Number(input.value) || 1; qty += 1; input.value = qty;
                await updateItemQuantity(id, qty);
            });
        });

        document.querySelectorAll('.item-quantity').forEach(input => {
            input.addEventListener('change', async function() {
                let qty = Number(this.value);
                if (!qty || qty < 1) { qty = 1; this.value = 1; }
                const id = this.dataset.carritoId;
                await updateItemQuantity(id, qty);
            });
        });

        document.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.dataset.carritoId;
                await removeItem(id);
            });
        });
    }

    async function updateItemQuantity(carritoId, cantidad) {
        const url = `${primaryBase}/${carritoId}`;
        try {
            let resp = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cantidad }) });
            if (!resp.ok) {
                resp = await fetch(`${fallbackBase}/${carritoId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cantidad }) });
            }
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            // On success, refresh cart item subtotal and total
            const itemRow = document.querySelector(`.cart-item[data-carrito-id="${carritoId}"]`);
            if (itemRow) {
                const priceEl = itemRow.querySelector('.price-col');
                const price = Number(priceEl.dataset.price) || 0;
                const newSubtotal = price * cantidad;
                itemRow.querySelector('.subtotal-col').textContent = `$${newSubtotal.toFixed(2)}`;
                itemRow.querySelector('.subtotal-col').dataset.subtotal = newSubtotal.toFixed(2);
            }
            recalcTotals();
        } catch (err) {
            console.error('Error updating item quantity:', err);
            // Optionally show an error toast
        }
    }

    async function removeItem(carritoId) {
        const url = `${primaryBase}/${carritoId}`;
        try {
            let resp = await fetch(url, { method: 'DELETE' });
            if (!resp.ok) {
                resp = await fetch(`${fallbackBase}/${carritoId}`, { method: 'DELETE' });
            }
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            // On success remove row
            const itemRow = document.querySelector(`.cart-item[data-carrito-id="${carritoId}"]`);
            if (itemRow) itemRow.remove();
            recalcTotals();
        } catch (err) {
            console.error('Error removing cart item:', err);
        }
    }

    function recalcTotals() {
        const subtotalEls = document.querySelectorAll('.subtotal-col');
        let sum = 0;
        subtotalEls.forEach(el => { sum += Number(el.dataset.subtotal) || 0; });
        updateSummary(sum);
    }

    function updateSummary(subtotal) {
        // Subtotal
        const elSubtotal = document.getElementById('summary-subtotal');
        if (elSubtotal) elSubtotal.textContent = `$${subtotal.toFixed(2)}`;

        // For simplicity: coupon discount = 0, tax = 0.16, shipping fixed $15
        const couponDiscount = 0; // add coupon logic as needed
        const tax = subtotal * 0.16;
        const shipping = subtotal > 0 ? 15.00 : 0.00;
        const total = subtotal - couponDiscount + tax + shipping;

        const elDiscount = document.getElementById('summary-discount');
        const elTax = document.getElementById('summary-tax');
        const elShipping = document.getElementById('summary-shipping');
        const elTotal = document.getElementById('summary-total-amount');

        if (elDiscount) elDiscount.textContent = `-${couponDiscount === 0 ? '$0.00' : `$${couponDiscount.toFixed(2)}`}`;
        if (elTax) elTax.textContent = `$${tax.toFixed(2)}`;
        if (elShipping) elShipping.textContent = `$${shipping.toFixed(2)}`;
        if (elTotal) elTotal.textContent = `$${total.toFixed(2)}`;
    }

})();