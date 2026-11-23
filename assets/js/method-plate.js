(() => {
  'use strict';
  const plate = document.querySelector('.research-plate');
  if (!plate) return;
  const buttons = Array.from(plate.querySelectorAll('[data-method]'));
  const branches = Array.from(plate.querySelectorAll('.research-figure'));
  const canvas = plate.querySelector('.research-connections');
  const context = canvas.getContext('2d');

  function traceConnections() {
    const { width, height, left } = canvas.getBoundingClientRect();
    if (!context || !width || !height) return;
    const density = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
    context.scale(density, density);
    const origin = width / 2;
    branches.forEach((branch, i) => {
      const rect = branch.getBoundingClientRect();
      const dest = rect.left + rect.width / 2 - left;
      const active = plate.dataset.selected === 'intel' || plate.dataset.selected === branch.dataset.method;
      const direction = i === 1 ? 0 : Math.sign(dest - origin);
      const spread = 3 * direction;
      const end = height - 3;
      const strands = i === 1 ? 1 : 3;
      for (let j = 0; j < strands; j++) {
        const delta = (j - (strands - 1) / 2);
        const start = origin + direction * 7 + delta * spread;
        const bend = height * (.5 + .11 * delta);
        context.beginPath();
        context.moveTo(start, 0);
        context.bezierCurveTo(start, bend, dest - direction * width * .042, bend, dest + delta * spread, end);
        context.strokeStyle = j === 1 || strands === 1
          ? (active ? 'rgba(231,244,255,.76)' : 'rgba(207,223,255,.32)')
          : (active ? 'rgba(207,226,255,.36)' : 'rgba(202,222,255,.16)');
        context.lineWidth = .85;
        context.stroke();
      }
      context.beginPath();
      context.arc(dest, end, 2, 0, Math.PI*2);
      context.fillStyle = active ? '#d9ebff' : '#89a7e9';
      context.fill();
    });
  }

  buttons.forEach((button, i) => {
    button.addEventListener('click', () => {
      const choice = button.dataset.method;
      if (choice !== 'intel' && plate.dataset.selected === choice) {
        buttons[0].click();
        return;
      }
      plate.dataset.selected = choice;
      traceConnections();
    });
    button.addEventListener('keydown', event => {
      const step = {ArrowDown:1, ArrowRight:1, ArrowUp:-1, ArrowLeft:-1}[event.key];
      if (!step) return;
      event.preventDefault();
      const next = buttons[(i + step + buttons.length) % buttons.length];
      next.focus();
      next.click();
    });
  });
  if ('ResizeObserver' in window) new ResizeObserver(traceConnections).observe(canvas);
  window.addEventListener('resize', traceConnections, { passive:true });
  traceConnections();
})();
