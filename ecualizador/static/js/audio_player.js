/**
 * static/js/audio_player.js
 * Módulo: Reproductor de audio con Web Audio API
 * Aplica el EQ en tiempo real sobre el audio cargado
 *
 * Web Audio API funciona como una cadena de nodos:
 *   Fuente → Filtros EQ → Ganancia (volumen) → Salida (bocinas)
 */

const AudioModule = (() => {

  // ── Contexto de audio ──────────────────────────────────────────
  let ctx        = null;   // AudioContext — el motor de audio
  let source     = null;   // BufferSourceNode — el archivo cargado
  let gainNode   = null;   // GainNode — controla el volumen
  let filters    = [];     // BiquadFilterNode[] — uno por banda EQ
  let audioBuffer = null;  // AudioBuffer — el archivo decodificado
  let startTime  = 0;      // Cuándo empezó a reproducirse
  let pauseAt    = 0;      // En qué segundo estaba al pausar
  let isPlaying  = false;
  let duration   = 0;
  let rafId      = null;   // requestAnimationFrame para la barra de progreso

  // Frecuencias de cada filtro (deben coincidir con las bandas del EQ)
  const FREQ_BANDS = [60, 250, 1000, 4000, 8000];

  // ── Inicializar el contexto y los filtros ──────────────────────
  function initAudio() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Crear un filtro por cada banda de EQ
    // BiquadFilter tipo "peaking" = sube o baja una frecuencia específica
    filters = FREQ_BANDS.map(freq => {
      const f = ctx.createBiquadFilter();
      f.type      = "peaking";
      f.frequency.value = freq;
      f.Q.value   = 1.0;   // Ancho del filtro
      f.gain.value = 0;    // 0 dB = sin cambio
      return f;
    });

    // Nodo de volumen
    gainNode = ctx.createGain();
    gainNode.gain.value = 1.0;  // 1.0 = 100%

    // Conectar la cadena: filtro0 → filtro1 → ... → gain → destino
    filters.forEach((f, i) => {
      if (i < filters.length - 1) f.connect(filters[i + 1]);
    });
    filters[filters.length - 1].connect(gainNode);
    gainNode.connect(ctx.destination);
  }

  // ── Cargar archivo ────────────────────────────────────────────
  function loadFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!ctx) initAudio();

      // Detener lo que esté sonando
      stop();

      // Decodificar el archivo de audio a un buffer PCM crudo
      ctx.decodeAudioData(e.target.result, (buffer) => {
        audioBuffer = buffer;
        duration    = buffer.duration;
        pauseAt     = 0;

        // Actualizar UI
        const badge = document.getElementById('trackName');
        badge.textContent = file.name;
        badge.className   = 'source-badge playing';
        document.getElementById('timeTotal').textContent = formatTime(duration);
        document.getElementById('playerControls').style.display = 'flex';
        document.getElementById('dropZone').style.display       = 'none';

        // Reproducir automáticamente
        play();
      });
    };
    reader.readAsArrayBuffer(file);
  }

  // ── Reproducir ────────────────────────────────────────────────
  function play() {
    if (!audioBuffer || isPlaying) return;

    // Cada vez que se reproduce hay que crear un nuevo SourceNode
    source = ctx.createBufferSource();
    source.buffer = audioBuffer;

    // Conectar la fuente al primer filtro de la cadena
    source.connect(filters[0]);

    // Reproducir desde donde se pausó
    source.start(0, pauseAt);
    startTime = ctx.currentTime - pauseAt;
    isPlaying = true;

    document.getElementById('btnPlay').textContent = '⏸';
    document.getElementById('btnPlay').classList.add('playing');

    // Cuando termine la canción, resetear
    source.onended = () => {
      if (isPlaying) stop();
    };

    updateProgress();
  }

  // ── Pausar / Reanudar ─────────────────────────────────────────
  function togglePlay() {
    if (!audioBuffer) return;
    if (isPlaying) {
      pauseAt = ctx.currentTime - startTime;
      source.stop();
      isPlaying = false;
      cancelAnimationFrame(rafId);
      document.getElementById('btnPlay').textContent = '▶';
      document.getElementById('btnPlay').classList.remove('playing');
    } else {
      play();
    }
  }

  // ── Detener ───────────────────────────────────────────────────
  function stop() {
    if (source) { try { source.stop(); } catch(e) {} }
    isPlaying = false;
    pauseAt   = 0;
    cancelAnimationFrame(rafId);
    document.getElementById('btnPlay').textContent = '▶';
    document.getElementById('btnPlay').classList.remove('playing');
    document.getElementById('progressFill').style.width  = '0%';
    document.getElementById('timeCurrent').textContent = '0:00';
  }

  // ── Saltar a posición (click en barra de progreso) ────────────
  function seek(event) {
    if (!audioBuffer) return;
    const bar  = document.getElementById('progressBar');
    const rect = bar.getBoundingClientRect();
    const pct  = (event.clientX - rect.left) / rect.width;
    pauseAt = pct * duration;
    if (isPlaying) {
      source.stop();
      isPlaying = false;
      play();
    }
  }

  // ── Actualizar barra de progreso ──────────────────────────────
  function updateProgress() {
    if (!isPlaying) return;
    const elapsed = ctx.currentTime - startTime;
    const pct     = Math.min((elapsed / duration) * 100, 100);
    document.getElementById('progressFill').style.width  = pct + '%';
    document.getElementById('timeCurrent').textContent   = formatTime(elapsed);
    rafId = requestAnimationFrame(updateProgress);
  }

  // ── Aplicar valores de EQ a los filtros ──────────────────────
  // Llamada desde EQModule cada vez que cambia un slider
  function applyEQ(bands) {
    if (!filters.length) return;
    bands.forEach((db, i) => {
      if (filters[i]) filters[i].gain.value = db;
    });
  }

  // ── Aplicar volumen ───────────────────────────────────────────
  function applyVolume(pct) {
    if (!gainNode) return;
    gainNode.gain.value = pct / 100;
  }

  // ── Formato de tiempo mm:ss ───────────────────────────────────
  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // ── Drag & Drop ───────────────────────────────────────────────
  function initDropZone() {
    const zone  = document.getElementById('dropZone');
    const input = document.getElementById('fileInput');

    input.onchange = (e) => { if (e.target.files[0]) loadFile(e.target.files[0]); };

    zone.ondragover  = (e) => { e.preventDefault(); zone.classList.add('active'); };
    zone.ondragleave = ()  => { zone.classList.remove('active'); };
    zone.ondrop      = (e) => {
      e.preventDefault();
      zone.classList.remove('active');
      if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
    };
  }

  return { togglePlay, stop, seek, applyEQ, applyVolume, initDropZone };
})();

document.addEventListener('DOMContentLoaded', () => {
  AudioModule.initDropZone();
});
