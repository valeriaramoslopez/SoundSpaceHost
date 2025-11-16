//Funcionalidad para Preguntas Frecuentes (que se desplieguen)
document.addEventListener('DOMContentLoaded', function() {
    // Acordeón de preguntas
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            const icon = this.querySelector('i');
            
            // Cerrar otras respuestas
            document.querySelectorAll('.faq-answer').forEach(otherAnswer => {
                if (otherAnswer !== answer) {
                    otherAnswer.classList.remove('active');
                    otherAnswer.previousElementSibling.querySelector('i').style.transform = 'rotate(0deg)';
                }
            });
            
            // Alternar respuesta actual
            answer.classList.toggle('active');
            icon.style.transform = answer.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
        });
    });

    //Filtrado por categorías
    const categoryButtons = document.querySelectorAll('.category-btn');
    const faqCategories = document.querySelectorAll('.faq-category');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Actualizar botones activos
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Mostrar/ocultar categorías
            faqCategories.forEach(cat => {
                if (category === 'all' || cat.getAttribute('data-category') === category) {
                    cat.style.display = 'block';
                } else {
                    cat.style.display = 'none';
                }
            });
        });
    });

    //Búsqueda en preguntas frecuentes
    window.buscarFAQ = function() {
        const searchTerm = document.getElementById('faq-search').value.toLowerCase();
        const faqItems = document.querySelectorAll('.faq-item');
        let foundResults = false;
        
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question h3').textContent.toLowerCase();
            const answer = item.querySelector('.faq-answer').textContent.toLowerCase();
            
            if (question.includes(searchTerm) || answer.includes(searchTerm)) {
                item.style.display = 'block';
                foundResults = true;
                
                // Resaltar término buscado
                if (searchTerm) {
                    const questionElement = item.querySelector('.faq-question h3');
                    const answerElement = item.querySelector('.faq-answer');
                    
                    const highlightedQuestion = questionElement.textContent.replace(
                        new RegExp(searchTerm, 'gi'),
                        match => `<span class="highlight">${match}</span>`
                    );
                    
                    const highlightedAnswer = answerElement.innerHTML.replace(
                        new RegExp(searchTerm, 'gi'),
                        match => `<span class="highlight">${match}</span>`
                    );
                    
                    questionElement.innerHTML = highlightedQuestion;
                    answerElement.innerHTML = highlightedAnswer;
                }
            } else {
                item.style.display = 'none';
            }
        });
        
        //Mostrar mensaje si no hay resultados
        const noResults = document.getElementById('no-results') || document.createElement('div');
        if (!foundResults && searchTerm) {
            noResults.id = 'no-results';
            noResults.innerHTML = `<p style="text-align: center; color: #ff5252; margin: 40px 0;">No se encontraron resultados para "${searchTerm}"</p>`;
            document.querySelector('.faq-content .container').appendChild(noResults);
        } else if (noResults.parentNode) {
            noResults.parentNode.removeChild(noResults);
        }
    };

    //Permitir búsqueda con Enter
    document.getElementById('faq-search').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            buscarFAQ();
        }
    });
});

// Funcionalidad para el modal de productos
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del modal
    const modal = document.getElementById("modalProducto");
    const closeModal = document.querySelector(".close");
    const cantidadValue = document.getElementById("cantidadValue");
    const decreaseBtn = document.getElementById("decreaseQty");
    const increaseBtn = document.getElementById("increaseQty");
    const addToCartBtn = document.querySelector(".btn-agregar-carrito");

    // Variables para controlar la cantidad
    let cantidad = 1;

    // Abrir modal con datos del producto
    document.querySelectorAll(".btn-ver").forEach(btn => {
        btn.addEventListener("click", () => {
            // Resetear cantidad a 1 cada vez que se abre un producto
            cantidad = 1;
            cantidadValue.textContent = cantidad;
            
            // Cargar datos del producto
            document.getElementById('modalImagen').src = `http://localhost:3000/uploads/${this.dataset.imagen}`;
            document.getElementById("modalNombre").textContent = btn.dataset.nombre;
            document.getElementById("modalDescripcion").textContent = btn.dataset.descripcion;
            document.getElementById("modalPrecio").textContent = btn.dataset.precio;
            document.getElementById("modalDisponibilidad").textContent = btn.dataset.disponibilidad;
            document.getElementById("modalCategoria").textContent = btn.dataset.categoria;
            
            // Mostrar modal
            modal.style.display = "block";
            document.body.style.overflow = "hidden"; // Prevenir scroll
        });
    });

    // Controladores de cantidad
    decreaseBtn.addEventListener("click", () => {
        if (cantidad > 1) {
            cantidad--;
            cantidadValue.textContent = cantidad;
        }
    });

    increaseBtn.addEventListener("click", () => {
        cantidad++;
        cantidadValue.textContent = cantidad;
    });

    // Añadir al carrito
    addToCartBtn.addEventListener("click", function() {
        const producto = {
            nombre: document.getElementById("modalNombre").textContent,
            precio: document.getElementById("modalPrecio").textContent,
            cantidad: cantidad,
            imagen: document.getElementById("modalImagen").src
        };
        
        // Aquí puedes agregar la lógica para añadir al carrito
        console.log("Producto añadido al carrito:", producto);
        
        // Mostrar mensaje de confirmación
        const originalText = this.innerHTML;
        this.innerHTML = '<i class="fas fa-check"></i> Añadido al Carrito';
        this.style.background = '#4CAF50';
        
        setTimeout(() => {
            this.innerHTML = originalText;
            this.style.background = '#ff5252';
        }, 2000);
        
        // Cerrar modal después de añadir (opcional)
        // setTimeout(() => modal.style.display = "none", 2000);
    });

    // Cerrar modal
    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
        document.body.style.overflow = "auto"; // Restaurar scroll
    });
    
    window.addEventListener("click", e => { 
        if (e.target === modal) {
            modal.style.display = "none";
            document.body.style.overflow = "auto"; // Restaurar scroll
        }
    });

    // Cerrar modal con tecla ESC
    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && modal.style.display === "block") {
            modal.style.display = "none";
            document.body.style.overflow = "auto"; // Restaurar scroll
        }
    });
});

// Función para copiar cupón (ya existente)
function copiarCupon() {
    const cupon = "ROCK25";
    navigator.clipboard.writeText(cupon).then(() => {
        alert("Cupón copiado: " + cupon);
    }).catch(err => {
        console.error('Error al copiar: ', err);
    });
}

//Estilo para resaltar búsqueda
const style = document.createElement('style');
style.textContent = `
    .highlight {
        background-color: #ff5252;
        color: white;
        padding: 2px 4px;
        border-radius: 3px;
    }
`;

// API para obtener productos
const productosAPI = {
    async getProductos() {
        try {
            const response = await fetch("http://localhost:3000/api/productos", {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            const data = await response.json();
            console.log("✅ Productos cargados:", data);

            if (response.ok) {
                return data;
            } else {
                console.error("Error al obtener productos:", data.mensaje);
                return [];
            }
        } catch (error) {
            console.error("❌ Error de conexión:", error);
            return [];
        }
    },

    async getProductosByGenero(genero) {
        try {
            const response = await fetch(`http://localhost:3000/api/productos/genero/${genero}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });

            const data = await response.json();
            
            if (response.ok && data.success) {
                return data.data;
            } else {
                return [];
            }
        } catch (error) {
            console.error("❌ Error de conexión:", error);
            return [];
        }
    }
};

// Cargar productos cuando la página esté lista
document.addEventListener('DOMContentLoaded', function() {
    cargarProductos();
    configurarFiltros();
    inicializarModal();
});

// Función principal para cargar productos
async function cargarProductos() {
    try {
        const productos = await productosAPI.getProductos();
        
        if (productos && productos.length > 0) {
            // Mostrar primeros 4 productos en "más vendidos"
            mostrarProductos(productos.slice(0, 4), 'productos-mas-vendidos');
            
            // Mostrar siguientes 4 productos en "ofertas especiales"
            if (productos.length > 4) {
                mostrarProductos(productos.slice(4, 8), 'ofertas-especiales');
            } else {
                // Si hay menos de 4 productos, mostrar los mismos en ambas secciones
                mostrarProductos(productos, 'ofertas-especiales');
            }
        } else {
            // Si no hay productos de la API, mostrar mensaje
            console.log("No se pudieron cargar los productos desde la API");
            mostrarMensajeSinProductos();
        }
    } catch (error) {
        console.error("Error al cargar productos:", error);
        mostrarMensajeSinProductos();
    }
}

function mostrarMensajeSinProductos() {
    const mensaje = '<p class="no-productos">⚠️ No hay productos disponibles en este momento</p>';
    
    const contenedorVendidos = document.getElementById('productos-mas-vendidos');
    const contenedorOfertas = document.getElementById('ofertas-especiales');
    
    if (contenedorVendidos) contenedorVendidos.innerHTML = mensaje;
    if (contenedorOfertas) contenedorOfertas.innerHTML = mensaje;
}

// Mostrar productos en un contenedor específico
function mostrarProductos(productos, contenedorId) {
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;

    if (productos.length === 0) {
        contenedor.innerHTML = '<p class="no-productos">No hay productos disponibles</p>';
        return;
    }

    contenedor.innerHTML = productos.map(producto => `
        <div class="producto-card">
            ${producto.ventas > 10 ? '<span class="producto-badge">Popular</span>' : ''}
            <img src="http://localhost:3000/uploads/${producto.imagen}" 
                 alt="${producto.titulo}" 
                 class="producto-img"
                onerror="this.src='http://localhost:3000/uploads/${producto.imagen}'"
            <div class="producto-info">
                <h3>${producto.titulo}</h3>
                <p class="producto-artista">${producto.artista}</p>
                <p class="producto-descripcion">${producto.descripcion ? producto.descripcion.substring(0, 60) + '...' : 'Descripción no disponible'}</p>
                <div class="producto-precio">
                    $${producto.precio}
                    <span class="producto-stock ${producto.disponibilidad > 0 ? 'en-stock' : 'agotado'}">
                        ${producto.disponibilidad > 0 ? 'En stock' : 'Agotado'}
                    </span>
                </div>
                <button class="btn-ver"
                    data-nombre="${producto.titulo}"
                    data-descripcion="${producto.descripcion || 'Descripción no disponible'}"
                    data-precio="$${producto.precio}"
                    data-disponibilidad="${producto.disponibilidad > 0 ? 'En stock' : 'Agotado'}"
                    data-categoria="${producto.genero}"
                    data-imagen="${producto.imagen}"
                    data-artista="${producto.artista}">
                    Ver Detalles
                </button>
            </div>
        </div>
    `).join('');

    // Configurar botones "Ver" después de cargar los productos
    configurarBotonesVer();
}

// Configurar filtros por categoría
function configurarFiltros() {
    const categorias = document.querySelectorAll('.categoria-card');
    
    categorias.forEach(categoria => {
        categoria.addEventListener('click', async function() {
            const genero = this.querySelector('h3').textContent.toLowerCase();
            
            // Remover activo de todas las categorías
            categorias.forEach(c => c.classList.remove('active'));
            // Agregar activo a la categoría clickeada
            this.classList.add('active');
            
            let productosFiltrados = [];
            
            if (genero === 'rock' || genero === 'clasico' || genero === 'corrido') {
                productosFiltrados = await productosAPI.getProductosByGenero(genero);
            } else {
                productosFiltrados = await productosAPI.getProductos();
            }
            
            if (productosFiltrados.length > 0) {
                mostrarProductos(productosFiltrados.slice(0, 4), 'productos-mas-vendidos');
                mostrarProductos(productosFiltrados.slice(4, 8), 'ofertas-especiales');
            }
        });
    });
}

// Configurar botones "Ver" para el modal
function configurarBotonesVer() {
    document.querySelectorAll('.btn-ver').forEach(btn => {
        btn.addEventListener('click', function() {
            abrirModalProducto(
                this.dataset.nombre,
                this.dataset.descripcion,
                this.dataset.precio,
                this.dataset.disponibilidad,
                this.dataset.categoria,
                this.dataset.imagen,
                this.dataset.artista
            );
        });
    });
}

// Función para abrir el modal con datos del producto
function abrirModalProducto(nombre, descripcion, precio, disponibilidad, categoria, imagen, artista) {
    document.getElementById('modalNombre').textContent = nombre;
    document.getElementById('modalDescripcion').textContent = descripcion;
    document.getElementById('modalPrecio').textContent = precio;
    document.getElementById('modalDisponibilidad').textContent = disponibilidad;
    document.getElementById('modalCategoria').textContent = categoria;
    document.getElementById('modalImagen').src = `http://localhost:3000/uploads/${imagen}`;
    
    const modal = document.getElementById('modalProducto');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Inicializar funcionalidad del modal
function inicializarModal() {
    const modal = document.getElementById('modalProducto');
    const closeBtn = document.querySelector('.close');
    let cantidad = 1;

    // Botones de cantidad
    document.getElementById('decreaseQty')?.addEventListener('click', () => {
        if (cantidad > 1) {
            cantidad--;
            document.getElementById('cantidadValue').textContent = cantidad;
        }
    });

    document.getElementById('increaseQty')?.addEventListener('click', () => {
        cantidad++;
        document.getElementById('cantidadValue').textContent = cantidad;
    });

    // Cerrar modal
    closeBtn?.addEventListener('click', () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        cantidad = 1;
        document.getElementById('cantidadValue').textContent = cantidad;
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            cantidad = 1;
            document.getElementById('cantidadValue').textContent = cantidad;
        }
    });

    // Cerrar con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            cantidad = 1;
            document.getElementById('cantidadValue').textContent = cantidad;
        }
    });
}

// Función de copiar cupón
function copiarCupon() {
    const cupon = "ROCK25";
    navigator.clipboard.writeText(cupon).then(() => {
        alert("Cupón copiado: " + cupon);
    }).catch(err => {
        console.error('Error al copiar: ', err);
    });
}

document.head.appendChild(style);