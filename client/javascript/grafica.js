// URL de tu API - ajusta según tu configuración
const API_URL = 'http://localhost:3000/api/productos';

// Variable global para la instancia del chart
let salesChartInstance = null;

// Función para obtener datos reales de la API
async function fetchSalesData() {
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const productos = await response.json();
        
        // Mapear los datos para obtener título y ventas
        return productos.map(producto => ({
            nombre: producto.titulo,
            ventas: producto.vendidos || 0 // Usa 0 si vendidos es null/undefined
        }));
        
    } catch (error) {
        console.error('Error al obtener datos de la API:', error);
        throw error;
    }
}

// Función para actualizar la gráfica
function updateChart(data) {
    const ctx = document.getElementById('salesChart').getContext('2d');
    
    // Destruir gráfica anterior si existe
    if (salesChartInstance) {
        salesChartInstance.destroy();
    }
    
    // Filtrar productos con ventas > 0 y ordenar por ventas (de mayor a menor)
    const productosConVentas = data.filter(item => item.ventas > 0);
    const sortedData = productosConVentas.sort((a, b) => b.ventas - a.ventas);
    
    // Limitar a los 10 más vendidos para mejor visualización
    const topProducts = sortedData.slice(0, 10);
    
    // Extraer nombres y ventas
    const nombres = topProducts.map(item => item.nombre);
    const ventas = topProducts.map(item => item.ventas);
    
    // Crear nueva gráfica con colores acordes al tema
    salesChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: nombres,
            datasets: [{
                label: 'Ventas',
                data: ventas,
                backgroundColor: [
                    'rgba(255, 82, 82, 0.7)',
                    'rgba(255, 107, 107, 0.7)',
                    'rgba(255, 133, 133, 0.7)',
                    'rgba(255, 158, 158, 0.7)',
                    'rgba(255, 184, 184, 0.7)',
                    'rgba(255, 209, 209, 0.7)',
                    'rgba(224, 65, 65, 0.7)',
                    'rgba(204, 47, 47, 0.7)',
                    'rgba(179, 35, 35, 0.7)',
                    'rgba(153, 23, 23, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 82, 82, 1)',
                    'rgba(255, 107, 107, 1)',
                    'rgba(255, 133, 133, 1)',
                    'rgba(255, 158, 158, 1)',
                    'rgba(255, 184, 184, 1)',
                    'rgba(255, 209, 209, 1)',
                    'rgba(224, 65, 65, 1)',
                    'rgba(204, 47, 47, 1)',
                    'rgba(179, 35, 35, 1)',
                    'rgba(153, 23, 23, 1)'
                ],
                borderWidth: 1,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 26, 26, 0.9)',
                    titleColor: '#ff5252',
                    bodyColor: '#fff',
                    borderColor: '#ff5252',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `Ventas: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#ccc',
                        precision: 0
                    },
                    title: {
                        display: true,
                        text: 'Número de Ventas',
                        color: '#fff',
                        font: {
                            family: 'Playfair Display',
                            size: 14
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#ccc',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    title: {
                        display: true,
                        text: 'Discos',
                        color: '#fff',
                        font: {
                            family: 'Playfair Display',
                            size: 14
                        }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
    
    // Actualizar estadísticas
    updateStats(data);
}

// Función para actualizar las estadísticas
function updateStats(data) {
    const totalProducts = data.length;
    const totalSales = data.reduce((sum, product) => sum + (product.ventas || 0), 0);
    const productosConVentas = data.filter(item => item.ventas > 0);
    
    if (productosConVentas.length > 0) {
        const topSales = Math.max(...productosConVentas.map(product => product.ventas));
        const topProduct = productosConVentas.find(product => product.ventas === topSales);
        
        document.getElementById('total-products').textContent = totalProducts;
        document.getElementById('total-sales').textContent = totalSales;
        document.getElementById('top-sales').textContent = topSales;
        document.getElementById('top-product-name').textContent = topProduct.nombre;
    } else {
        document.getElementById('total-products').textContent = totalProducts;
        document.getElementById('total-sales').textContent = '0';
        document.getElementById('top-sales').textContent = '0';
        document.getElementById('top-product-name').textContent = 'Sin ventas';
    }
}

// Función para cargar y mostrar los datos
async function loadData() {
    try {
        // Mostrar indicador de carga
        Swal.fire({
            title: 'Cargando datos...',
            allowOutsideClick: false,
            background: '#1a1a1a',
            color: '#fff',
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Obtener datos de la API real
        const productsData = await fetchSalesData();
        
        // Actualizar gráfica
        updateChart(productsData);
        
        // Cerrar indicador de carga
        Swal.close();
        
        // Mostrar mensaje de éxito
        Swal.fire({
            icon: 'success',
            title: 'Datos cargados',
            text: `Se han cargado ${productsData.length} productos`,
            timer: 1500,
            showConfirmButton: false,
            background: '#1a1a1a',
            color: '#fff'
        });
    } catch (error) {
        console.error('Error al cargar datos:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudieron cargar los datos de la API. Verifica que el servidor esté ejecutándose.',
            background: '#1a1a1a',
            color: '#fff'
        });
    }
}

// Función para exportar la gráfica
function exportChart() {
    const chartCanvas = document.getElementById('salesChart');
    if (!chartCanvas) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se encontró la gráfica para exportar',
            background: '#1a1a1a',
            color: '#fff'
        });
        return;
    }
    
    const image = chartCanvas.toDataURL('image/png');
    
    const link = document.createElement('a');
    link.href = image;
    link.download = 'discos-mas-vendidos.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Inicializar eventos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Asignar event listeners a los botones
    const refreshBtn = document.getElementById('refreshChart');
    const exportBtn = document.getElementById('exportChart');
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadData);
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', exportChart);
    }
    
    // Cargar datos iniciales
    loadData();
    
    // Actualizar automáticamente cada 30 segundos
    setInterval(loadData, 30000);
});

// Hacer las funciones disponibles globalmente si es necesario
window.loadData = loadData;
window.exportChart = exportChart;