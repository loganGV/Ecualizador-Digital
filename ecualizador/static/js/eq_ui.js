/**
 * static/js/eq_ui.js
 * Módulo: Interfaz del ecualizador (5 bandas + volumen)
 */

const EQModule = (() => {
  const BANDS = ['60Hz','250Hz','1KHz','4KHz','8KHz'];
  let currentValues = new Array(5).fill(0);
  let currentVolume = 100;

  // ── Sliders ───────────────────────────────────────────────────
  function buildSliders() {
    const row = document.getElementById('slidersRow');
    row.innerHTML = '';
    BANDS.forEach((freq, i) => {
      const band = document.createElement('div');
      band.className = 'band';
      band.innerHTML = `
        <div class="slider-wrap">
          <input type="range" class="vertical" id="sl${i}"
                 min="-12" max="12" step="1" value="${currentValues[i]}"
                 oninput="EQModule.onSlider(${i}, this.value)">
        </div>
        <div class="band-freq">${freq}</div>
        <div class="band-val" id="val${i}">${_fmt(currentValues[i])}</div>
      `;
      row.appendChild(band);
    });
  }

  function onSlider(index, raw) {
    const v = parseInt(raw);
    currentValues[index] = v;
    _updateLabel(index, v);
    WaveformModule.update(currentValues);
    updateMeters(currentValues);
    AudioModule.applyEQ(currentValues);
    if (window._socket) window._socket.emit('set_band', { band: index, value: v });
  }

  function onVolume(raw) {
    currentVolume = parseInt(raw);
    document.getElementById('volValue').textContent = currentVolume + '%';
    AudioModule.applyVolume(currentVolume);
    if (window._socket) window._socket.emit('set_master_gain', { gain: currentVolume });
  }

  // ── Actualizar desde servidor ─────────────────────────────────
  function applyUpdate(data) {
    if (data.bands) {
      currentValues = [...data.bands];
      BANDS.forEach((_, i) => {
        const sl = document.getElementById(`sl${i}`);
        if (sl) sl.value = currentValues[i];
        _updateLabel(i, currentValues[i]);
      });
      WaveformModule.update(currentValues);
      updateMeters(currentValues);
      AudioModule.applyEQ(currentValues);
    }
    if (data.volume !== undefined) {
      currentVolume = data.volume;
      const slVol = document.getElementById('slVol');
      if (slVol) slVol.value = currentVolume;
      document.getElementById('volValue').textContent = currentVolume + '%';
      AudioModule.applyVolume(currentVolume);
    }
    if (data.preset) {
      const sel = document.getElementById('presetSel');
      if (sel) sel.value = data.preset;
    }
  }

  // ── Medidores ─────────────────────────────────────────────────
  function buildMeters() {
    const row = document.getElementById('metersRow');
    row.innerHTML = '';
    BANDS.forEach((freq, i) => {
      const col = document.createElement('div');
      col.className = 'meter-col';
      col.innerHTML = `
        <span class="meter-label">${freq}</span>
        <div class="meter-bar"><div class="meter-fill" id="mf${i}" style="width:50%"></div></div>
      `;
      row.appendChild(col);
    });
  }

  function updateMeters(bands) {
    bands.forEach((db, i) => {
      const pct = ((db + 12) / 24) * 100;
      const el  = document.getElementById(`mf${i}`);
      if (el) el.style.width = pct + '%';
    });
  }

  function animateMeters() {
    BANDS.forEach((_, i) => {
      const base   = ((currentValues[i] + 12) / 24) * 100;
      const jitter = (Math.random() - 0.5) * 5;
      const pct    = Math.min(100, Math.max(0, base + jitter));
      const el     = document.getElementById(`mf${i}`);
      if (el) el.style.width = pct + '%';
    });
    setTimeout(animateMeters, 120);
  }

  // ── Tabla de pines ────────────────────────────────────────────
  function buildPinTable() {
    fetch('/api/state').then(r => r.json()).then(data => {
      const tbody = document.getElementById('pinTableBody');
      tbody.innerHTML = '';
      const pins = data.pins || {};
      Object.entries(pins).forEach(([idx, info]) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>Banda EQ ${parseInt(idx) + 1}</td>
          <td>${info.freq}</td>
          <td style="color:var(--accent2);font-family:'Share Tech Mono',monospace">${info.pin}</td>
          <td class="badge-ok">✓ LISTO</td>
        `;
        tbody.appendChild(tr);
      });
      // Fila de volumen
      const trVol = document.createElement('tr');
      trVol.innerHTML = `
        <td>Volumen Master</td>
        <td>—</td>
        <td style="color:var(--accent2);font-family:'Share Tech Mono',monospace">A5</td>
        <td class="badge-vol">✓ LISTO</td>
      `;
      tbody.appendChild(trVol);
    }).catch(() => {});
  }

  // ── Helpers ───────────────────────────────────────────────────
  function _fmt(v) { return v >= 0 ? `+${v}` : `${v}`; }

  function _updateLabel(i, v) {
    const el = document.getElementById(`val${i}`);
    if (!el) return;
    el.textContent = _fmt(v);
    el.className   = `band-val${v < 0 ? ' cut' : ''}`;
  }

  function getValues()  { return [...currentValues]; }
  function getVolume()  { return currentVolume; }

  return { buildSliders, buildMeters, buildPinTable, onSlider, onVolume,
           applyUpdate, updateMeters, animateMeters, getValues, getVolume };
})();

// ── Funciones globales ────────────────────────────────────────────
function applyPreset() {
  const name = document.getElementById('presetSel').value;
  if (!name) return;
  if (window._socket) window._socket.emit('apply_preset', { preset: name });
}

function resetAll() {
  if (window._socket) window._socket.emit('apply_preset', { preset: 'flat' });
  document.getElementById('slVol').value = 100;
  EQModule.onVolume(100);
}

function exportValues() {
  fetch('/api/state').then(r => r.json()).then(data => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'eq_preset.json';
    a.click();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  EQModule.buildSliders();
  EQModule.buildMeters();
  EQModule.buildPinTable();
  EQModule.animateMeters();
  WaveformModule.init();
});
