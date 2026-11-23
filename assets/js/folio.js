(function () {
  'use strict';
  const find = selector => document.querySelector(selector);
  const list = selector => Array.from(document.querySelectorAll(selector));

  function bindDialog(buttonId, dialogId) {
    const trigger = document.getElementById(buttonId), dialog = document.getElementById(dialogId);
    if (!trigger || !dialog) return;
    trigger.addEventListener('click', () => {
      dialog.showModal();
      if (dialogId === 'film-dialog') find('#brandfilm').play().catch(() => {});
    });
    dialog.querySelector('.close-modal').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      if (dialogId === 'film-dialog') find('#brandfilm').pause();
      if (!dialog.dataset.jumped) trigger.focus({preventScroll:true});
      delete dialog.dataset.jumped;
    });
  }
  [['contents-open','contents-dialog'],['film-open','film-dialog'],['news-open','news-dialog'],['data-open','data-dialog'],['cases-open','cases-dialog']].forEach(pair => bindDialog(...pair));
  list('.contents-list a').forEach(link => link.addEventListener('click', () => {
    const dialog = find('#contents-dialog');
    dialog.dataset.jumped = 'true'; dialog.close();
    if (link.origin !== location.origin || link.pathname !== location.pathname || !link.hash) return;
    const target = document.getElementById(link.hash.slice(1));
    if (target) {target.tabIndex=-1;target.focus({preventScroll:true});}
  }));

  const bulletins = list('.bulletins a');
  let bulletinIndex = 0;
  function changeBulletin(step) {
    bulletinIndex = (bulletinIndex + step + bulletins.length) % bulletins.length;
    const original = bulletins[bulletinIndex], link = find('#news-link');
    find('#news-kind').textContent = original.querySelector('.news-type').textContent;
    link.textContent = original.querySelector('strong').textContent; link.href = original.href;
    find('#news-count').textContent = (bulletinIndex + 1) + ' / ' + bulletins.length;
  }
  find('#news-prev').addEventListener('click', () => changeBulletin(-1));
  find('#news-next').addEventListener('click', () => changeBulletin(1));

  const rotation = find('#param-stage'), front = find('#param-poster'), turn = find('#param-turn');
  const steps = 32, frames = new Map();
  let frame = 0, requested = 0, grabbed = null;
  function requestFrame(index) {
    const normalized = (index + steps) % steps;
    if (frames.has(normalized)) return frames.get(normalized);
    const img = new Image(); img.src = 'assets/turn/' + String(normalized).padStart(2,'0') + '.webp';
    const loaded = img.decode().then(() => img).catch(() => { frames.delete(normalized); return null; });
    frames.set(normalized,loaded); return loaded;
  }
  function showFrame(index) {
    frame = ((index % steps) + steps) % steps; const ticket = ++requested;
    if (frame === 0) { front.hidden=false;turn.hidden=true;return; }
    requestFrame(frame).then(img => {
      if (!img || ticket !== requested) return;
      turn.src = img.src; turn.hidden=false; front.hidden=true;
    });
    requestFrame(frame-1);requestFrame(frame+1);
  }
  rotation.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    grabbed = {id:event.pointerId,x:event.clientX,frame}; rotation.setPointerCapture(event.pointerId);
    requestFrame(frame+1);requestFrame(frame-1);
  });
  rotation.addEventListener('pointermove', event => {
    if (!grabbed || grabbed.id !== event.pointerId) return;
    const next=grabbed.frame+Math.round((event.clientX-grabbed.x)/Math.max(6,rotation.clientWidth/40));
    if (((next%steps)+steps)%steps !== frame) showFrame(next);
  });
  ['pointerup','pointercancel','lostpointercapture'].forEach(name=>rotation.addEventListener(name,()=>{grabbed=null;}));
  rotation.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','Home'].includes(event.key)) return;
    event.preventDefault(); showFrame(event.key==='Home'?0:frame+(event.key==='ArrowLeft'?-1:1));
  });
  list('[data-object]').forEach(button=>button.addEventListener('click',()=>{
    const protein=button.dataset.object==='protein';
    list('[data-object]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
    rotation.hidden=protein;find('#specimen-stage').hidden=!protein;find('.specimen-modes').hidden=!protein;
    find('#object-caption').textContent=protein?'人泛素 · PDB 1UBQ · A 链':'蓝银粒子沿扭转的参数曲面排列。';
  }));

  const method = {
    intel:'围绕研究目标，规划任务、调用工具，组织调研、计算与验证。',
    read:'检索文献与数据，梳理已有证据和仍待验证的问题。',
    compute:'调用专业模型与计算工具，推演假设可能产生的结果。',
    lab:'在真实实验中获得新的证据，与计算预测相互对照。'
  };
  list('[data-method]').forEach(button=>button.addEventListener('click',()=>{
    list('[data-method]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
    find('.method-result').textContent=method[button.dataset.method];
  }));
  list('.work-entry').forEach(entry=>entry.addEventListener('toggle',()=>{
    if (!entry.open) return;
    list('.work-entry').forEach(other=>{if(other!==entry)other.open=false;});
    const image = find('#work-photo');
    image.src = entry.dataset.plateSrc;
    image.alt = entry.dataset.plateAlt;
    image.dataset.source = entry.dataset.plateSource || '';
    find('#work-legend').textContent = entry.dataset.plateCaption;
  }));
})();
