// admin_chat.js
console.log("[admin_chat.js] Iniciando script admin chat");

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {

        Swal.fire({
                        title: '¡Necesitas iniciar sesión como administrador!',
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

        window.location.href = "tienda.html";
        return;
    }

    const adminList = document.getElementById('adminList');

    async function cargarTodos() {
        console.log("[admin_chat.js] cargarTodos -> /api/chat-admin/todos");
        adminList.innerHTML = '<div class="loading">Cargando mensajes...</div>';
        try {
            const res = await fetch("http://localhost:3000/api/chat-admin/todos", {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const json = await res.json();
            console.log("[admin_chat.js] respuesta todos:", json);
            if (!res.ok) {
                adminList.innerHTML = `<div class="loading">Error: ${json.mensaje || 'no autorizado'}</div>`;
                return;
            }

            if (!json.data || json.data.length === 0) {
                adminList.innerHTML = '<div class="loading">No hay mensajes</div>';
                return;
            }

            adminList.innerHTML = '';
            json.data.forEach(m => {
                const div = document.createElement('div');
                div.className = 'admin-msg';
                div.innerHTML = `
                    <div class="info"><strong>#${m.id}</strong> - Usuario: ${m.nombreUsuario || 'N/A'} (${m.nombreCompleto || 'N/A'}) - Enviado: ${new Date(m.fechaMensaje).toLocaleString()}</div>
                    <div class="body"><strong>Mensaje:</strong> ${escapeHtml(m.mensaje)}</div>
                    <div class="response-area">
                        <textarea data-id="${m.id}" placeholder="Escribe respuesta...">${m.respuesta ? m.respuesta : ''}</textarea>
                        <div style="display:flex; gap:8px; margin-top:6px;">
                            <button class="small-btn" data-action="send" data-id="${m.id}">Guardar Respuesta</button>
                            <button class="small-btn" data-action="refresh" data-id="${m.id}">Refrescar</button>
                        </div>
                    </div>
                `;
                adminList.appendChild(div);
            });

            // listeners
            adminList.querySelectorAll('button[data-action="send"]').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.dataset.id;
                    const ta = adminList.querySelector(`textarea[data-id="${id}"]`);
                    const respuesta = ta.value.trim();
                    if (!respuesta) return Swal.fire({
                        title: 'Faltan datos',
                        text: 'Por favor, ingrese el mensaje',
                        icon: 'warning',
                        confirmButtonText: 'Continuar',
                        showClass: {
                        popup: 'animate__animated animate__zoomIn'
                    },
                    hideClass: {
                        popup: 'animate__animated animate__zoomOut'
                    }
                });
                    console.log("[admin_chat.js] Enviando respuesta id:", id, respuesta);

                    try {
                        const r = await fetch(`http://localhost:3000/api/chat-admin/responder/${id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + token
                            },
                            body: JSON.stringify({ respuesta })
                        });
                        const j = await r.json();
                        console.log("[admin_chat.js] respuesta guardar:", j);
                        if (!r.ok) {
                            Swal.fire({
                        title: '¡Mensaje no guardado!',
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
                        Swal.fire({
                        title: '¡Respuesta guardada!',
                        text: 'Se realizo la accion con exito',
                        icon: 'success',
                        confirmButtonText: 'Continuar',
                        showClass: {
                        popup: 'animate__animated animate__zoomIn'
                    },
                    hideClass: {
                        popup: 'animate__animated animate__zoomOut'
                    }
                });
                        cargarTodos();
                    } catch (err) {
                        console.error("[admin_chat.js] Error responder:", err);
                        Swal.fire({
                        title: 'Error',
                        text: 'No se pudo lograr la conexion',
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
            });

            adminList.querySelectorAll('button[data-action="refresh"]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    cargarTodos();
                });
            });

        } catch (err) {
            console.error("[admin_chat.js] Error cargarTodos:", err);
            adminList.innerHTML = '<div class="loading">Error conectando al servidor</div>';
        }
    }

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    cargarTodos();
});
