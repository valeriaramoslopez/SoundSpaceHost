document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const forms = {
        'add': document.getElementById('add-product-form'),
        'modify': document.getElementById('modify-product-section')
    };

    // Manejo de pestañas (Alta / Modificar)
    // - Cambia las clases para activar la vista correspondiente
    tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // 1. Desactivar todos los botones y formularios
            tabButtons.forEach(btn => btn.classList.remove('active'));
            Object.values(forms).forEach(form => form.classList.remove('active'));
            Object.values(forms).forEach(form => form.classList.add('hidden'));

            // 2. Activar el botón y el formulario correspondiente
            const targetTab = e.target.dataset.tab;
            e.target.classList.add('active');
            
            const activeForm = forms[targetTab];
            if (activeForm) {
                activeForm.classList.add('active');
                activeForm.classList.remove('hidden');
            }
        });
    });

    // Asegurar que la pestaña de Alta esté activa al inicio (carga por defecto)
    document.querySelector('.tab-btn[data-tab="add"]').click();
    
    // Variables para cache y API
    // - `cachedProducts` almacena los productos cargados desde la API para búsquedas y render
    // - `apiOrigin` y `API_URL` determinan el origen de la API según cómo se sirva la página (file:// vs http)
    let cachedProducts = [];
    const apiOrigin = (location.protocol === 'file:') ? 'http://localhost:3000' : `${location.protocol}//${location.host}`;
    // Inventario ahora via admin
    const API_URL = `${apiOrigin}/api/admin/inventario`;
    const FALLBACK_API_URL = 'http://localhost:3000/api/admin/inventario';
    // Endpoint para ventas totales (suma monetaria)
    const TOTALSALES_API_URL = `${apiOrigin}/api/admin/totalventas`;
    const FALLBACK_TOTALSALES_API_URL = 'http://localhost:3000/api/admin/totalventas';

    console.info('API origin:', apiOrigin, 'API_URL:', API_URL, 'FALLBACK_API_URL:', FALLBACK_API_URL); // Debug info

    // Cargar productos desde la API y actualizar tabla
    // - Hace fetch a `API_URL`. Si falla (por ejemplo, si la página está siendo servida
    //   por un servidor de desarrollo distinto a la API), intenta `FALLBACK_API_URL`.
    // - Soporta respuestas donde la API devuelve un array directo, o un objeto { success, count, data }.
    async function loadProducts() {
        const tbody = document.getElementById('inventory-body');
        if (!tbody) return;
        // Mostrar fila de carga mientras se obtiene la información
        tbody.innerHTML = '<tr class="loading-row"><td colspan="8">Cargando productos...</td></tr>';
        try {
            let resp = await fetch(API_URL);
            let data;
            if (!resp.ok) {
                // Si la respuesta falla (ej. 404 desde Live Server), intentar la URL de respaldo
                console.warn(`API respondió con ${resp.status} desde ${API_URL}, intentando fallback ${FALLBACK_API_URL}`);
                // Intentar fallback al backend en :3000
                resp = await fetch(FALLBACK_API_URL);
            }
            if(!resp.ok) throw new Error(`HTTP ${resp.status}`);
            data = await resp.json();
            // La API puede devolver un array de productos, o un objeto con `data`.
            if (!Array.isArray(data)) {
                console.warn('Respuesta inesperada de productos:', data);
                cachedProducts = data.data || [];
            } else {
                cachedProducts = data;
            }
            renderProductos(cachedProducts);
            updateMetrics(cachedProducts);
            // Obtener ventas totales desde backend, preferir endpoint de admin
            fetchTotalSales();
        } catch (err) {
            console.error('Error cargando productos:', err);
            tbody.innerHTML = '<tr><td colspan="8">Error cargando productos. Ver consola para detalles.</td></tr>';
        }
    }

    async function fetchTotalSales() {
        const totalSalesEl = document.getElementById("total-sales");
        if (!totalSalesEl) return;
        try {
            let resp = await fetch(TOTALSALES_API_URL);
            if (!resp.ok) resp = await fetch(FALLBACK_TOTALSALES_API_URL);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            if (data && data.success && data.total !== undefined) {
                totalSalesEl.textContent = `$${Number(data.total).toLocaleString('es-MX', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
            } else {
                totalSalesEl.textContent = '$0.00';
            }
        } catch (err) {
            console.error('Error obteniendo ventas totales:', err);
            totalSalesEl.textContent = '$0.00';
        }
    }


    // renderProductos: Dibuja filas <tr> y celdas <td> en la tabla de inventario
    // - Se espera una lista de objetos producto con campos: id, titulo, artista, genero, precio, disponibilidad, ventas, imagen
    // - Normaliza los nombres por si hay variantes en mayúsculas/minúsculas
    function renderProductos(productos) {
        const tbody = document.getElementById('inventory-body');
        if (!tbody) return;
        if (!productos || productos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8">No se encontraron productos.</td></tr>';
            return;
        }
        tbody.innerHTML = '';
        productos.forEach(producto => {
            const tr = document.createElement('tr');
            tr.dataset.id = producto.id || producto.ID || '';

            // Normalizar precio y formatear como string monetario
            const priceValue = Number(producto.precio || producto.Precio || 0);
            const priceText = isNaN(priceValue) ? producto.precio : `$${priceValue.toFixed(2)}`;

            // Normalizar valores de ventas y stock para evitar undefined
            const ventas = producto.ventas ?? producto.Ventas ?? 0;
            const stock = producto.disponibilidad ?? producto.Disponibilidad ?? 0;
            // Normalizar oferta (descuento %)
            const oferta = producto.oferta ?? producto.Oferta ?? 0;

            // Determinar clase CSS según el nivel de stock (alto, bajo, crítico)
            const stockClass = getStockClass(Number(stock));

            tr.innerHTML = `
                <td>${producto.id ?? producto.ID ?? ''}</td>
                <td>${producto.titulo ?? producto.Titulo ?? ''}</td>
                <td>${producto.artista ?? producto.Artista ?? ''}</td>
                <td>${producto.genero ?? producto.Genero ?? ''}</td>
                <td>${priceText}</td>
                <td data-sales="${ventas}" class="sales-value">${ventas}</td>
                <td data-stock="${stock}" class="${stockClass}">${stock}</td>
                <td>${renderImageCell(producto.imagen || producto.Imagen || '')}</td>
                <td>${oferta > 0 ? oferta + '%' : '-'}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // renderImageCell: retorna el HTML para la celda de imagen
    // - Intenta cargar la imagen desde el origen actual y si falla, intenta cargarla desde el backend en localhost:3000
    function renderImageCell(imgName) {
        if (!imgName) return '';
        // Se asume que las imágenes se sirven desde /uploads
        const src = `${apiOrigin}/uploads/${imgName}`;
        // Devuelve una etiqueta <img> con tamaño reducido como vista previa; si falla se intenta cargar desde el backend
        const fallbackSrc = `http://localhost:3000/uploads/${imgName}`;
        return `<img src="${src}" alt="${imgName}" style="max-width:48px; height:auto;" onerror="this.onerror=null; this.src='${fallbackSrc}'"> ${imgName}`;
    }

    // getStockClass: devuelve la clase CSS que marca visualmente el nivel de stock
    function getStockClass(stock) {
        if (isNaN(stock)) return '';
        if (stock <= 5) return 'stock-critical';
        if (stock <= 50) return 'stock-low';
        return 'stock-high';
    }

    // updateMetrics: actualiza los paneles de métricas (ventas totales e inventario total)
    // - total-inventory: suma de la disponibilidad de todos los productos
    // - total-sales: suma precio*ventas (valor monetario acumulado)
    function updateMetrics(productos) {
        const totalInventoryEl = document.getElementById('total-inventory');
        const totalSalesEl = document.getElementById('total-sales');
        if (totalInventoryEl) {
            const totalStock = productos.reduce((acc, p) => acc + Number(p.disponibilidad ?? p.Disponibilidad ?? 0), 0);
            totalInventoryEl.textContent = totalStock;
        }
        if (totalSalesEl) {
            // Sumar ventas*precio para mostrar ventas totales en $ (valor monetario acumulado)
            const salesAmount = productos.reduce((acc, p) => {
                const precio = Number(p.precio ?? p.precio ?? p.Precio ?? 0) || 0;
                const ventas = Number(p.ventas || 0) || 0;
                return acc + (precio * ventas);
            }, 0);
            totalSalesEl.textContent = `$${salesAmount.toFixed(2)}`;
        }
    }

    // Buscar en `cachedProducts` por título o ID
    // Al pulsar el botón se filtran los productos en cache y se muestra el primer resultado
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const query = document.getElementById('search-product').value.trim().toLowerCase();
            const searchResults = document.getElementById('search-results');
            const noResultsMessage = document.querySelector('.no-results-message');

            if (!query) {
                searchResults.classList.add('hidden');
                noResultsMessage.classList.remove('hidden');
                return;
            }

            // Priorizar búsqueda por ID exacto
            let results = [];
            // Buscar por ID exacto primero
            results = cachedProducts.filter(p => {
                const idStr = String(p.id ?? p.ID ?? '');
                return idStr === query;
            });
            // Si no hay resultados por ID, buscar por título
            if (results.length === 0) {
                results = cachedProducts.filter(p => {
                    const title = (p.titulo ?? p.Titulo ?? '').toString().toLowerCase();
                    return title.includes(query);
                });
            }

            if (results.length > 0) {
                // Renderizar el primer resultado en el área de resultados
                const resultItem = searchResults.querySelector('.result-item');
                if (resultItem) {
                    const p = results[0];
                    // Guardar el ID del producto en el dataset para acciones futuras (modificar/eliminar)
                    resultItem.dataset.id = p.id ?? p.ID ?? '';
                    console.info('search matched:', p.id ?? p.ID, p.titulo ?? p.Titulo);
                    resultItem.querySelector('.product-title-display').textContent = `Modificar: ${p.titulo || p.Titulo || ''}`;
                    resultItem.querySelector('.product-metadata').innerHTML = `ID: ${p.id || p.ID || ''} | Ventas Acumuladas: <span class="sales-value-display">${p.ventas ?? 0}</span>`;
                    resultItem.querySelector('#m-title').value = p.titulo || '';
                    resultItem.querySelector('#m-artist').value = p.artista || '';
                    resultItem.querySelector('#m-description').value = p.descripcion || '';
                    resultItem.querySelector('#m-price').value = p.precio || '';
                    resultItem.querySelector('#m-stock').value = p.disponibilidad || '';
                    resultItem.querySelector('#m-image').value = p.imagen || '';
                    // Seleccionar género si existe
                    const genreEl = resultItem.querySelector('#m-genre');
                    if (genreEl) genreEl.value = p.genero || '';
                }
                searchResults.classList.remove('hidden');
                noResultsMessage.classList.add('hidden');
            } else {
                searchResults.classList.add('hidden');
                noResultsMessage.classList.remove('hidden');
            }
        });
    }

    // Cargar los productos desde la API cuando la página termine de inicializarse
    // Esto llenará la tabla y las métricas automáticamente
    loadProducts();

    // Simulación de acciones de CRUD 
    // - `btn-add-product`: actualmente solo muestra una alerta; deberías llamar a POST /api/productos
    // - `btn-update-product`: actualmente solo muestra una alerta; deberías llamar a PUT /api/productos/:id
    // - `btn-delete-product`: actualmente solo muestra una alerta; deberías llamar a DELETE /api/productos/:id
    const addBtn = document.querySelector('.btn-add-product');
    if (addBtn) {
        addBtn.addEventListener('click', (e) => {
        console.info('btn-add-product clicked');
        e.preventDefault();

        // Obtener los valores del formulario de alta
        const form = document.getElementById('add-product-form');
        if (!form) {
            console.error('Formulario de alta no encontrado (id: add-product-form)');
            return;
        }

        // 1. Crear el objeto FormData que encapsula el formulario y los archivos
        const formData = new FormData();
        
        // Obtener la referencia al input type="file"
        const imageFileEl = form.querySelector('#p-image-file'); // Asegúrate de usar el ID correcto
        const imageFile = imageFileEl ? imageFileEl.files[0] : null;

        // Usar los IDs reales del HTML (p- prefix)
        const titulo = form.querySelector('#p-title') ? form.querySelector('#p-title').value.trim() : '';
        const artista = form.querySelector('#p-artist') ? form.querySelector('#p-artist').value.trim() : '';
        const descripcion = form.querySelector('#p-description') ? form.querySelector('#p-description').value.trim() : '';
        const precio = form.querySelector('#p-price') ? form.querySelector('#p-price').value.trim() : '';
        const disponibilidad = form.querySelector('#p-stock') ? form.querySelector('#p-stock').value.trim() : '';
        const genero = form.querySelector('#p-genre') ? form.querySelector('#p-genre').value.trim() : '';
        // `ventas` no está presente en el formulario de alta; usar 0 por defecto
        const ventas = 0;
        const imagen = form.querySelector('#p-image') ? form.querySelector('#p-image').value.trim() : '';
        const oferta = form.querySelector('#p-offer') ? form.querySelector('#p-offer').value.trim() : '';

        const hasImage = imageFile || imagen; // Verifica si existe el archivo O si se llenó el campo de texto (legacy)

        // Validar que los campos de texto estén llenos, y que exista una imagen (sea archivo o URL de texto)
        if (!titulo || !artista || !descripcion || !precio || !disponibilidad || !genero || !hasImage) {
            Swal.fire({
                    title: 'Datos incompletos',
                    text: 'Por favor, completa todos los campos antes de añadir el producto',
                    icon: 'warning',
                    confirmButtonText: 'Continuar',
                    showClass: {
                        popup: 'animate__animated animate__zoomIn'
                    },
                    hideClass: {
                        popup: 'animate__animated animate__zoomOut'
                    }
                });
            return;
        }

        // 2. Añadir todos los campos, incluyendo el archivo, al FormData
        formData.append('title', titulo); // Nota: Multer puede usar los nombres del form
        formData.append('titulo', titulo);
        formData.append('artista', artista);
        formData.append('descripcion', descripcion);
        formData.append('precio', precio);
        formData.append('disponibilidad', disponibilidad);
        formData.append('genero', genero);
        formData.append('oferta', oferta);
        formData.append('ventas', 0); // Fijo a 0 en alta

        // ¡Añadir el archivo con el nombre que espera Multer!
        // El nombre 'imageFile' debe coincidir con el .single('imageFile') en la ruta del backend
        formData.append('imageFile', imageFile);
        // Si el usuario completó el campo de texto con el nombre de la imagen,
        // incluirlo para que el backend lo use como nombre final de archivo
        if (imagen) formData.append('imagen', imagen);

        // Construir payload y URLs
        const fallbackAdminUrl = `http://localhost:3000/api/admin/inventario`;

        // 3. Llamar a la nueva función de fetch con FormData
        addProductFormDataFetch(`${apiOrigin}/api/admin/inventario`, fallbackAdminUrl, formData);        
        });
    }

    // Manejar submit del formulario (tecla Enter) fuera del click para evitar listeners duplicados
    const addForm = document.getElementById('add-product-form');
    if (addForm) {
        addForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const addBtnEl = document.querySelector('.btn-add-product');
            if (addBtnEl) addBtnEl.click();
        });
    }

    const updateBtn = document.querySelector('.btn-update-product');
    if (updateBtn) {
        updateBtn.addEventListener('click', async () => {
            const resultItem = document.querySelector('#search-results .result-item');
            const id = resultItem?.dataset.id;
            if (!id) {
                Swal.fire({
                    title: 'No se encontró el ID del producto para modificar',
                    text: 'Realiza una búsqueda primero',
                    icon: 'warning',
                    confirmButtonText: 'Continuar',
                    showClass: {
                        popup: 'animate__animated animate__zoomIn'
                    },
                    hideClass: {
                        popup: 'animate__animated animate__zoomOut'
                    }
                    });
                return;
            }
            const form = resultItem.querySelector('.update-form');
            if (!form) {
                Swal.fire({
                    title: 'Formulario de modificación no encontrado',
                    text: 'Por favor, intentelo de nuevo',
                    icon: 'warning',
                    confirmButtonText: 'Continuar',
                    showClass: {
                        popup: 'animate__animated animate__zoomIn'
                    },
                    hideClass: {
                        popup: 'animate__animated animate__zoomOut'
                    }
                    });
                return;
            }
            const tituloVal = (form.querySelector('#m-title')?.value ?? '').trim();
            const artistaVal = (form.querySelector('#m-artist')?.value ?? '').trim();
            const descripcionVal = (form.querySelector('#m-description')?.value ?? '').trim();
            const precioVal = (form.querySelector('#m-price')?.value ?? '').trim();
            const disponibilidadVal = (form.querySelector('#m-stock')?.value ?? '').trim();
            const generoVal = (form.querySelector('#m-genre')?.value ?? '').trim();
            const imagenVal = (form.querySelector('#m-image')?.value ?? '').trim();
            const ofertaVal = (form.querySelector('#m-offer')?.value ?? '').trim();
            // Ventas (si existe en el DOM como input o span, preferir input)
            const ventasEl = form.querySelector('#m-sales') || form.querySelector('.sales-value-display');
            const ventas = ventasEl ? Number(ventasEl.value ?? ventasEl.textContent ?? 0) : 0;

            // Validar que haya algún campo para actualizar (al menos titulo o precio por ejemplo)
            if (!tituloVal && !artistaVal && !descripcionVal && !precioVal && !disponibilidadVal && !generoVal && !imagenVal && !ofertaVal) {
                Swal.fire({
                    title: 'Modificación vacía',
                    text: 'Por favor, intentelo de nuevo',
                    icon: 'warning',
                    confirmButtonText: 'Continuar',
                    showClass: {
                        popup: 'animate__animated animate__zoomIn'
                    },
                    hideClass: {
                        popup: 'animate__animated animate__zoomOut'
                    }
                    });
                return;
            }

            const payload = {
                titulo: tituloVal === '' ? undefined : tituloVal,
                artista: artistaVal === '' ? undefined : artistaVal,
                descripcion: descripcionVal === '' ? undefined : descripcionVal,
                precio: precioVal === '' ? undefined : Number(precioVal),
                disponibilidad: disponibilidadVal === '' ? undefined : Number(disponibilidadVal),
                genero: generoVal === '' ? undefined : generoVal,
                ventas: Number(ventas) || undefined,
                imagen: imagenVal === '' ? undefined : imagenVal,
                oferta: ofertaVal === '' ? undefined : Number(ofertaVal)
            };

            const primary = `${apiOrigin}/api/admin/inventario/${id}`;
            const fallback = `http://localhost:3000/api/admin/inventario/${id}`;
            try {
                // Si se seleccionó un archivo, enviamos FormData (para permitir subir nueva imagen)
                const imageFileEl = form.querySelector('#m-image-file');
                const imageFile = imageFileEl ? imageFileEl.files[0] : null;
                let resp;
                if (imageFile) {
                    console.info('Actualizando producto con imagen (FormData)', id, payload);
                    const formData = new FormData();
                    // Añadir solo los campos definidos para no sobrescribir con undefined
                    Object.keys(payload).forEach(k => {
                        const v = payload[k];
                        if (typeof v !== 'undefined') formData.append(k, v);
                    });
                    formData.append('imageFile', imageFile);
                    resp = await fetch(primary, { method: 'PUT', body: formData });
                    if (!resp.ok) {
                        console.warn(`PUT (FormData) respondió ${resp.status} en primary, intentando fallback`);
                        resp = await fetch(fallback, { method: 'PUT', body: formData });
                    }
                } else {
                    console.info('Actualizando producto (JSON)', id, payload);
                    resp = await fetch(primary, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (!resp.ok) {
                        console.warn(`PUT respondió ${resp.status} en primary, intentando fallback`);
                        resp = await fetch(fallback, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    }
                }
                if (!resp.ok) {
                    const text = await resp.text();
                    throw new Error(`HTTP ${resp.status} - ${text}`);
                }
                const data = await resp.json();
                if (data && data.success) {
                    Swal.fire({
                    title: 'Producto modificado',
                    text: 'Se realizo la accion exitosamente',
                    icon: 'success',
                    confirmButtonText: 'Continuar',
                    showClass: {
                        popup: 'animate__animated animate__zoomIn'
                    },
                    hideClass: {
                        popup: 'animate__animated animate__zoomOut'
                    }
                    });
                    loadProducts();
                    document.getElementById('search-results').classList.add('hidden');
                } else {
                    Swal.fire({
                    title: 'No se pudo modificar el producto',
                    text: 'Por favor, intentelo de nuevo',
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
            } catch (err) {
                console.error('Error modificando producto:', err);
                Swal.fire({
                    title: 'No se pudo modificar el producto',
                    text: 'Por favor, intentelo de nuevo',
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
    }

    // DELETE product handler: envia DELETE al backend con fallback y actualiza tabla
    const deleteBtn = document.querySelector('.btn-delete-product');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (!confirm('¿Estás seguro de que deseas dar de baja este producto?')) return;
            const resultItem = document.querySelector('#search-results .result-item');
            const id = resultItem?.dataset.id;
            if (!id) {
                Swal.fire({
                    title: 'No se encontró el ID del producto para eliminar',
                    text: 'Por favor, intentelo de nuevo',
                    icon: 'error',
                    confirmButtonText: 'Continuar',
                    showClass: {
                        popup: 'animate__animated animate__zoomIn'
                    },
                    hideClass: {
                        popup: 'animate__animated animate__zoomOut'
                    }
                });
                
                return;
            }
            const primary = `${apiOrigin}/api/admin/inventario/${id}`;
            const fallback = `http://localhost:3000/api/admin/inventario/${id}`;
            try {
                let resp = await fetch(primary, { method: 'DELETE' });
                if (!resp.ok) {
                    console.warn(`DELETE respondió ${resp.status} en primary, intentando fallback`);
                    resp = await fetch(fallback, { method: 'DELETE' });
                }
                if (!resp.ok) {
                    const text = await resp.text();
                    throw new Error(`HTTP ${resp.status} - ${text}`);
                }
                const data = await resp.json();
                if (data && data.success) {
                    Swal.fire({
                    title: 'Producto eliminado',
                    text: 'Se realizo la accion correctamente',
                    icon: 'success',
                    confirmButtonText: 'Continuar',
                    showClass: {
                        popup: 'animate__animated animate__zoomIn'
                    },
                    hideClass: {
                        popup: 'animate__animated animate__zoomOut'
                    }
                });
                    document.getElementById('search-results').classList.add('hidden');
                    loadProducts();
                } else {
                    Swal.fire({
                    title: 'No se pudo eliminar el producto',
                    text: 'Por favor, intentelo de nuevo',
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
            } catch (err) {
                console.error('Error eliminando producto:', err);
                Swal.fire({
                    title: 'No se pudo eliminar el producto',
                    text: 'Por favor, intentelo de nuevo',
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
    }

    // Nueva función para enviar FormData (archivos)
    async function addProductFormDataFetch(primary, fallback, formData) {
        try {
            console.info('Intentando añadir producto (FormData) en:', primary);
            
            let resp = await fetch(primary, {
                method: 'POST',
                // NO se establece Content-Type para FormData. El navegador lo hace automáticamente.
                body: formData 
            });

            if (!resp.ok) {
                console.warn(`Respuesta ${resp.status} desde ${primary}, intentando fallback ${fallback}`);
                resp = await fetch(fallback, {
                    method: 'POST',
                    body: formData
                });
            }
            if (!resp.ok) {
                const text = await resp.text();
                throw new Error(`HTTP ${resp.status} - ${text}`);
            }

            let data;
            try {
                data = await resp.json();
            } catch (parseErr) {
                const rawText = await resp.text();
                throw new Error(`La respuesta no es JSON válido: ${parseErr.message}. Contenido: ${rawText}`);
            }

            if (data && data.success) {
                alert('Producto añadido correctamente.');
                loadProducts();
                document.getElementById('add-product-form').reset(); // Limpiar el formulario
            } else {
                alert('Error al añadir el producto: ' + (data.message || 'Respuesta inesperada.'));
            }
        } catch (err) {
            console.error('Error al añadir producto:', err);
            alert('Error al añadir el producto. Ver consola para detalles.');
        }
    }
});