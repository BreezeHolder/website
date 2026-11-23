(() => {
  'use strict';

  const dialog = document.querySelector('#plate-dialog');
  const original = dialog.querySelector('img');
  const title = dialog.querySelector('h2');
  const viewport = dialog.querySelector('.plate-viewer-viewport');
  const source = dialog.querySelector('.plate-source');
  const sizing = dialog.querySelector('[data-actual-size]');
  const mobile = matchMedia('(max-width: 760px)');
  let trigger = null;

  function sizeImage(actual) {
    viewport.classList.toggle('actual-size', actual);
    sizing.setAttribute('aria-pressed', String(actual));
    if (!actual) viewport.scrollTo(0, 0);
  }

  function addViewer(figure) {
    const image = figure.querySelector('img');
    const caption = figure.querySelector('figcaption');
    const open = document.createElement('button');
    open.className = 'enlarge-plate';
    open.type = 'button';
    open.setAttribute('aria-haspopup', 'dialog');
    open.setAttribute('aria-label', '放大查看当前图版');
    const glyph = document.createElement('span');
    glyph.className = 'lens-glyph';
    glyph.setAttribute('aria-hidden', 'true');
    open.append(glyph, '放大查看');
    caption.append(open);

    function openImage() {
      trigger = open;
      const label = caption.cloneNode(true);
      label.querySelector('button')?.remove();
      title.textContent = label.textContent.trim() || image.alt;
      const sourceUrl = image.dataset.source;
      source.hidden = !sourceUrl;
      if (sourceUrl) source.href = sourceUrl;
      else source.removeAttribute('href');
      original.alt = image.alt;
      original.src = image.getAttribute('src');
      sizeImage(false);
      dialog.showModal();
    }

    open.addEventListener('click', openImage);
    image.addEventListener('click', openImage);
  }

  function placeAtSelection(figure, items) {
    const anchor = document.createComment('图版在桌面的起始位置');
    figure.before(anchor);
    function update() {
      const selected = Array.from(items).find(item => item.open);
      if (mobile.matches && selected) {
        const summary = selected.querySelector('summary');
        if (summary.nextElementSibling !== figure) summary.after(figure);
      } else if (anchor.nextSibling !== figure) {
        anchor.after(figure);
      }
    }
    mobile.addEventListener('change', update);
    items.forEach(item => item.addEventListener('toggle', update));
    update();
  }

  document.querySelectorAll('[data-detail-plate]').forEach(figure => {
    addViewer(figure);
    const section = figure.closest('section');
    const group = section.querySelectorAll('.work-entry, .dpv2-field');
    if (group.length) placeAtSelection(figure, group);
  });

  dialog.querySelector('.close-modal').addEventListener('click', () => dialog.close());
  sizing.addEventListener('click', () => sizeImage(!viewport.classList.contains('actual-size')));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    trigger?.focus({preventScroll:true});
    original.removeAttribute('src');
  });
})();
