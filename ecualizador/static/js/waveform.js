/**
 * static/js/waveform.js
 * Módulo: Animación de forma de onda (5 bandas)
 */

const WaveformModule = (() => {
  let canvas, ctx, phase = 0;
  let currentBands = new Array(5).fill(0);

  function init() {
    canvas = document.getElementById('waveCanvas');
    ctx    = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    animate();
  }

  function resize() {
    canvas.width  = canvas.offsetWidth  * devicePixelRatio;
    canvas.height = canvas.offsetHeight * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
  }

  function update(bands) { currentBands = [...bands]; }

  function animate() {
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    ctx.clearRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = '#15151f'; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    ctx.strokeStyle = '#1e1e2a';
    ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke();

    // Onda
    const ampSum  = currentBands.reduce((a,v) => a + v/12, 0) / 5;
    const baseAmp = 0.25 + Math.max(0, ampSum) * 0.4;
    const freqs   = [0.5, 1.5, 3, 5, 8];

    ctx.shadowColor = '#c8ff00'; ctx.shadowBlur = 12;
    const grad = ctx.createLinearGradient(0, H/2 - H*0.4, 0, H/2 + H*0.4);
    grad.addColorStop(0,   '#00e5ff');
    grad.addColorStop(0.4, '#c8ff00');
    grad.addColorStop(1,   '#ff4d6d44');
    ctx.strokeStyle = grad; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= W; x++) {
      const t = x / W;
      let y = 0;
      currentBands.forEach((db, i) => {
        y += Math.sin(t * Math.PI * 2 * freqs[i] * 3 + phase + i) * (db/12) * (H * 0.12);
      });
      y = H/2 + y * baseAmp + Math.sin(t * Math.PI * 6 + phase) * H * 0.05;
      x === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.stroke();

    ctx.shadowBlur = 0;
    const fill = ctx.createLinearGradient(0,0,0,H);
    fill.addColorStop(0,   'rgba(200,255,0,0.08)');
    fill.addColorStop(0.5, 'rgba(0,229,255,0.04)');
    fill.addColorStop(1,   'transparent');
    ctx.fillStyle = fill; ctx.fill();

    phase += 0.025;
    requestAnimationFrame(animate);
  }

  return { init, update };
})();
