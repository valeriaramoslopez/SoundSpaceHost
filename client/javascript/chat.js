document.addEventListener('DOMContentLoaded', () => {
  console.log('[chat] DOM listo');

  // Elementos UI
  const chatToggle = document.getElementById('chatToggle');
  const chatPanel = document.getElementById('chatPanel');
  const closeChat = document.getElementById('closeChat');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendChat = document.getElementById('sendChat');

  if (!chatToggle || !chatPanel || !chatMessages || !chatInput || !sendChat) {
    console.warn('[chat] Elementos del DOM del chat faltan. Verifica IDs en HTML.');
    return;
  }

  // Estado
  let usuario = null;
  try {
    usuario = JSON.parse(localStorage.getItem('usuario'));
  } catch (err) {
    console.warn('[chat] No se pudo parsear localStorage.usuario', err);
  }

  const token = localStorage.getItem('token') || null;
  console.log('[chat] usuario/token cargados desde localStorage:', { usuario, token });

  // Mostrar/ocultar panel
  chatToggle.addEventListener('click', () => {
    const isOpen = chatPanel.style.display === 'flex';
    chatPanel.style.display = isOpen ? 'none' : 'flex';
    console.log('[chat] toggle panel ->', { isOpen: !isOpen });
    if (!isOpen) {
      // Si abrimos panel, cargar historial (si hay usuario)
      if (usuario && usuario.id) {
        cargarHistorial(usuario.id).catch(e => console.error('[chat] error cargarHistorial', e));
      } else {
        console.log('[chat] usuario no detectado, no se carga historial (invitado).');
        // limpiar mensajes o mantener
        if (chatMessages.children.length === 0) {
          appendSystemMessage('Bienvenido al soporte. Inicia sesión para ver tu historial.');
        }
      }
    }
  });

  // Botón cerrar
  closeChat.addEventListener('click', () => {
    chatPanel.style.display = 'none';
    console.log('[chat] panel cerrado por usuario');
  });

  // Envío por botón y Enter
  sendChat.addEventListener('click', enviarMensaje);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      enviarMensaje();
    }
  });

  // Función para cargar historial (GET /api/chat/historial/:id)
  async function cargarHistorial(idUsuario) {
    console.log('[chat] cargarHistorial idUsuario=', idUsuario);
    try {
      appendSystemMessage('Cargando historial...');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const resp = await fetch(`http://localhost:3000/api/chat/historial/${idUsuario}`, {
        method: 'GET',
        headers
      });

      if (!resp.ok) {
        console.warn('[chat] respuesta no OK al obtener historial', resp.status);
        replaceSystemMessage('No se pudo cargar historial.');
        return;
      }

      const data = await resp.json();
      console.log('[chat] historial recibido:', data);

      // Si la ruta devuelve { success: true, mensajes } o un array simple:
      const mensajes = Array.isArray(data) ? data : (data.mensajes || data);
      chatMessages.innerHTML = ''; // limpiar
      if (!mensajes || mensajes.length === 0) {
        appendSystemMessage('No tienes historial de chat.');
        return;
      }

      mensajes.forEach(m => {
        appendMessageFromHistory(m);
      });
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (err) {
      console.error('[chat] error fetch historial:', err);
      replaceSystemMessage('Error cargando historial (ver consola).');
    }
  }

  // Enviar mensaje al endpoint /api/chat/enviar
  async function enviarMensaje() {
    try {
      const texto = chatInput.value.trim();
      if (!texto) {
        console.log('[chat] texto vacío - no se envía');
        return;
      }

      // Preparar payload
      const idUsuario = usuario?.id || null; // si es null se aceptará como invitado
      const payload = { idUsuario, mensaje: texto };

      console.log('[chat] enviarMensaje payload ->', payload);
      appendOwnMessage(texto); // mostrar inmediatamente en UI
      chatInput.value = '';
      chatInput.disabled = true;
      sendChat.disabled = true;

      // headers (agregar token si existe)
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const resp = await fetch('http://localhost:3000/api/chat/enviar', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        console.error('[chat] /api/chat/enviar returned not ok', resp.status);
        appendSystemMessage('No se pudo enviar el mensaje (error del servidor).');
        return;
      }

      const data = await resp.json();
      console.log('[chat] respuesta /api/chat/enviar:', data);

      // data.respuesta es la respuesta automática del bot
      if (data && data.respuesta !== undefined) {
        appendBotMessage(data.respuesta);
      } else {
        appendSystemMessage('Respuesta no válida del servidor.');
        console.warn('[chat] data.respuesta indefinida', data);
      }
    } catch (err) {
      console.error('[chat] Error en enviarMensaje:', err);
      appendSystemMessage('Error enviando mensaje (ver consola).');
    } finally {
      chatInput.disabled = false;
      sendChat.disabled = false;
      chatInput.focus();
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  // ────────── Helpers de UI ──────────

  function appendSystemMessage(text) {
    // Reemplaza último mensaje de sistema si existe
    const last = chatMessages.querySelector('.system-message');
    if (last) {
      last.textContent = text;
      return;
    }
    const p = document.createElement('div');
    p.className = 'system-message';
    p.style.color = '#ddd';
    p.style.padding = '8px';
    p.style.fontSize = '0.95rem';
    p.textContent = text;
    chatMessages.appendChild(p);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function replaceSystemMessage(text) {
    const last = chatMessages.querySelector('.system-message');
    if (last) last.textContent = text;
    else appendSystemMessage(text);
  }

  function appendOwnMessage(text) {
    console.log('[chat] appendOwnMessage:', text);
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-message me';
    wrapper.style.display = 'flex';
    wrapper.style.justifyContent = 'flex-end';
    wrapper.style.margin = '8px';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;
    bubble.style.background = '#ff5252';
    bubble.style.color = '#fff';
    bubble.style.padding = '8px 12px';
    bubble.style.borderRadius = '12px';
    bubble.style.maxWidth = '75%';
    bubble.style.wordBreak = 'break-word';

    wrapper.appendChild(bubble);
    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function appendBotMessage(text) {
    console.log('[chat] appendBotMessage:', text);
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-message bot';
    wrapper.style.display = 'flex';
    wrapper.style.justifyContent = 'flex-start';
    wrapper.style.margin = '8px';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;
    bubble.style.background = '#222';
    bubble.style.color = '#fff';
    bubble.style.padding = '8px 12px';
    bubble.style.borderRadius = '12px';
    bubble.style.maxWidth = '75%';
    bubble.style.wordBreak = 'break-word';

    wrapper.appendChild(bubble);
    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function appendMessageFromHistory(m) {
    // m: { id, idUsuario, mensaje, respuesta, fechaMensaje, fechaRespuesta }
    console.log('[chat] appendMessageFromHistory m=', m);
    // Mostrar el mensaje del usuario
    if (m.mensaje) {
      const wrapper = document.createElement('div');
      wrapper.className = 'chat-message hist mensaje';
      wrapper.style.margin = '6px';
      wrapper.innerHTML = `
        <div style="font-size:0.85rem;color:#aaa;margin-bottom:3px;">Tú • ${formatFecha(m.fechaMensaje)}</div>
        <div style="background:#ff5252;color:#fff;padding:8px;border-radius:10px;max-width:75%;">${escapeHtml(m.mensaje)}</div>
      `;
      chatMessages.appendChild(wrapper);
    }
    // Mostrar la respuesta (si existe)
    if (m.respuesta) {
      const wrapper2 = document.createElement('div');
      wrapper2.className = 'chat-message hist respuesta';
      wrapper2.style.margin = '6px';
      wrapper2.innerHTML = `
        <div style="font-size:0.85rem;color:#aaa;margin-bottom:3px;">Soporte • ${formatFecha(m.fechaRespuesta)}</div>
        <div style="background:#222;color:#fff;padding:8px;border-radius:10px;max-width:75%;">${escapeHtml(m.respuesta)}</div>
      `;
      chatMessages.appendChild(wrapper2);
    }
  }

  // Utility: formato fecha simple
  function formatFecha(dbDate) {
    if (!dbDate) return '';
    const d = new Date(dbDate);
    if (isNaN(d)) return dbDate;
    return d.toLocaleString();
  }

  // Utility: escapar HTML para seguridad
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

});
