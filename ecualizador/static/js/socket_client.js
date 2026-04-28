/**
 * static/js/socket_client.js
 * Módulo: Conexión WebSocket con el servidor Python
 * Recibe datos en tiempo real del Arduino
 */

document.addEventListener('DOMContentLoaded', () => {
  const socket = io();
  window._socket = socket;

  const dot   = document.getElementById('statusDot');
  const label = document.getElementById('connLabel');
  const badge = document.getElementById('sourceBadge');

  // ── Eventos de conexión ──────────────────────────────────────

  socket.on('connect', () => {
    dot.className   = 'status-dot on';
    label.className = 'conn-label connected';
    label.textContent = 'CONECTADO';
  });

  socket.on('disconnect', () => {
    dot.className   = 'status-dot';
    label.className = 'conn-label';
    label.textContent = 'DESCONECTADO';
    badge.textContent = '—';
    badge.className = 'source-badge';
  });

  // ── Actualización del EQ ─────────────────────────────────────

  socket.on('eq_update', (data) => {
    if (data.bands && Array.isArray(data.bands)) {
      EQModule.applyUpdate(data.bands);
    }

    // Indicador de fuente
    if (data.source === 'arduino') {
      badge.textContent = 'ARDUINO';
      badge.className   = 'source-badge arduino';
    } else if (data.source === 'demo') {
      badge.textContent = 'DEMO';
      badge.className   = 'source-badge demo';
      dot.className     = 'status-dot demo';
      label.className   = 'conn-label demo';
      label.textContent = 'MODO DEMO';
    }

    // Sincronizar selector de preset
    if (data.preset) {
      const sel = document.getElementById('presetSel');
      if (sel) sel.value = data.preset;
    }
  });

  socket.on('gain_update', (data) => {
    const mg = document.getElementById('masterGain');
    const gv = document.getElementById('gainVal');
    if (mg) mg.value = data.gain;
    if (gv) gv.textContent = data.gain + '%';
  });
});
