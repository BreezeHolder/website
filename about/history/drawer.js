(() => {
  'use strict';

  const themes = [
    ['科研突破', [1, 7, 14, 18, 24, 57, 66, 111, 132, 151, 155, 156, 159]],
    ['科研产品', [11, 37, 52, 134, 138, 139, 141, 122]],
    ['科研智能体与专业助手', [85, 92, 112, 118, 148, 149, 153]],
    ['自动化实验', [76, 91, 103, 105, 125]],
    ['开源与科研生态', [2, 19, 29, 45, 78]],
    ['产业合作与应用', [15, 47, 84, 131, 143, 150]],
    ['公司发展与荣誉', [3, 28, 35, 94, 123, 157]],
  ];
  const byNumber = new Map(themes.flatMap(([theme, ids]) => ids.map(id => [id, theme])));
  const symbol = {
    back: '<path d="M16 4 8 12l8 8"/>',
    right: '<path d="m9 5 7 7-7 7"/>',
    x: '<path d="m5 5 14 14m0-14L5 19"/>',
    zoom: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6m-14-11h6m-3-3v6"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    external: '<path d="M7 17 18 6m-9 0h9v9"/>',
    play: '<path d="m8 4 11 8-11 8z" fill="currentColor" stroke="none"/>',
  };
  function icon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' + symbol[name] + '</svg>';
  }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[ch]);
  }
  const norm = value => String(value || '').toLocaleLowerCase().replace(/\s+/g, '');
  const imagePath = id => 'assets/a' + String(id).padStart(2, '0') + '.webp';
  function publicLink(link) {
    if (!link || !/^https:\/\//.test(link.url || '')) return '';
    return '<a class="hd-link" href="' + esc(link.url) + '" target="_blank" rel="noopener noreferrer">' +
      esc(link.label) + icon('external') + '</a>';
  }

  let panel, backButton, scroller, catalog, data;
  let records = [], phases = new Map(), events = new Map(), images = new Map(), videos = new Map();
  let externalOpener, eventId, mode, listScroll = 0, detailScroll = 0;
  let filters = { phase: 'all', theme: 'all', query: '' };
  let restoreLock = false;

  function setup() {
    if (panel) return true;
    data = window.HISTORY_DATA;
    if (!data || !Array.isArray(data.phases)) return false;
    phases = new Map(data.phases.map(phase => [phase.id, phase]));
    records = data.phases.flatMap(phase => phase.events.map(value => {
      const theme = byNumber.get(Number(value.id.slice(3))) || value.category;
      const haystack = norm([value.date, value.tag, theme, value.title, value.body].join(' '));
      return { ...value, phase: phase.id, theme, haystack };
    }));
    events = new Map(records.map(record => [record.id, record]));
    images = new Map((data.images || []).map(img => [img.id, img]));
    videos = new Map((data.videos || []).map(video => [video.id, video]));
    panel = document.createElement('dialog');
    panel.className = 'hd-dialog';
    panel.setAttribute('aria-label', '深势科技发展历程档案');
    panel.innerHTML = '<div class="hd-shell"><div class="hd-topbar"><button type="button" class="hd-back" data-hd="back"></button><span class="hd-context">发展历程</span><button type="button" class="hd-close" data-hd="close" aria-label="关闭事件档案">' + icon('x') + '</button></div><div class="hd-scroll"></div></div>';
    document.body.append(panel);
    backButton = panel.querySelector('.hd-back');
    scroller = panel.querySelector('.hd-scroll');

    panel.addEventListener('click', e => {
      if (e.target === panel) { panel.close(); return; }
      const button = e.target.closest('[data-hd]');
      if (!button) return;
      switch (button.dataset.hd) {
        case 'close': panel.close(); break;
        case 'back':
          if (mode === 'image' || mode === 'movie') renderDetail(eventId, true);
          else if (mode === 'detail') renderList(true);
          break;
        case 'record':
          listScroll = scroller.scrollTop;
          renderDetail(button.dataset.id);
          break;
        case 'picture':
          detailScroll = scroller.scrollTop;
          renderPicture(Number(button.dataset.id));
          break;
        case 'movie':
          detailScroll = scroller.scrollTop;
          renderMovie(button.dataset.id);
          break;
        case 'size':
          button.setAttribute('aria-pressed', button.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
          panel.querySelector('.hd-zoomstage').classList.toggle('hd-actual');
          button.textContent = button.getAttribute('aria-pressed') === 'true' ? '适应宽度' : '查看大图';
          break;
        case 'reset':
          filters = {phase:'all',theme:'all',query:''};
          listScroll = 0;
          renderList(false);
          break;
      }
    });
    panel.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !e.isComposing) {
        e.preventDefault();
        e.stopPropagation();
        panel.close();
      }
    }, true);
    panel.addEventListener('input', e => {
      if (e.target.matches('.hd-search input')) {
        filters.query = e.target.value;
        listScroll = 0;
        drawResults();
      }
    });
    panel.addEventListener('change', e => {
      if (!e.target.matches('select[data-filter]')) return;
      filters[e.target.dataset.filter] = e.target.value;
      listScroll = 0;
      drawResults();
    });
    panel.addEventListener('close', () => {
      stopVideo();
      if (restoreLock) document.documentElement.classList.remove('hd-page-locked');
      const trigger = externalOpener;
      if (trigger && trigger.isConnected && trigger !== document.body) trigger.focus({ preventScroll:true });
    });
    return true;
  }

  function openPanel() {
    if (panel.open) return;
    externalOpener = document.activeElement;
    restoreLock = !document.documentElement.classList.contains('hd-page-locked');
    document.documentElement.classList.add('hd-page-locked');
    panel.showModal();
  }
  function stopVideo() {
    const player = panel.querySelector('video');
    if (!player) return;
    player.pause();
    player.removeAttribute('src');
    player.load();
  }
  function updateMode(next, back) {
    stopVideo();
    mode = next;
    panel.dataset.view = next;
    backButton.hidden = !back;
    backButton.innerHTML = back ? icon('back') + '<span>' + esc(back) + '</span>' : '';
    scroller.scrollTop = 0;
  }
  function position(scroll, target) {
    // scroll restoration must happen after page controls have been inserted and laid out.
    scroller.scrollTop = scroll;
    if (target) target.focus({preventScroll:true});
  }
  function opts(options, selected) {
    return options.map(([value,label]) => '<option value="' + esc(value) + '"' +
      (value===selected ? ' selected' : '') + '>' + esc(label) + '</option>').join('');
  }
  function renderList(returning) {
    updateMode('catalog', '');
    const ph = [['all', '全部时期'], ...data.phases.map(p=>[p.id,p.years])];
    const th = [['all', '全部主题'], ...themes.map(([name])=>[name,name])];
    scroller.innerHTML = '<div class="hd-inner"><h2 class="hd-head" tabindex="-1">事件档案</h2>' +
      '<div class="hd-controls"><label class="hd-search">' + icon('search') +
      '<input type="search" autocomplete="off" placeholder="搜索事件、产品或研究机构" aria-label="搜索事件、产品或研究机构" value="' + esc(filters.query) + '"></label>' +
      '<div class="hd-selects"><label><span>时期</span><select data-filter="phase">' + opts(ph,filters.phase) +
      '</select></label><label><span>主题</span><select data-filter="theme">' + opts(th,filters.theme) +
      '</select></label></div></div><div class="hd-results-info"><span role="status" aria-live="polite" class="hd-count"></span>' +
      '<button type="button" class="hd-reset" data-hd="reset">清除筛选</button></div><div class="hd-results"></div></div>';
    catalog = scroller.querySelector('.hd-results');
    drawResults();
    const previous = returning && eventId ? [...catalog.querySelectorAll('[data-hd="record"]')].find(el=>el.dataset.id===eventId) : null;
    position(returning ? listScroll : 0, previous || scroller.querySelector('h2'));
  }
  function drawResults() {
    const needle = norm(filters.query);
    const found = records.filter(item => (filters.phase==='all' || item.phase === filters.phase) &&
      (filters.theme==='all' || item.theme===filters.theme) && (!needle || item.haystack.includes(needle)));
    panel.querySelector('.hd-count').textContent = found.length + ' 项事件';
    panel.querySelector('.hd-reset').hidden = filters.phase==='all' && filters.theme==='all' && !filters.query;
    if (!found.length) {
      catalog.innerHTML='<p class="hd-empty">没有匹配的事件。可以换个关键词，或清除筛选查看全部事件。</p>';
      return;
    }
    catalog.innerHTML = data.phases.map(phase => {
      const items = found.filter(item=>item.phase===phase.id);
      if (!items.length) return '';
      return '<section class="hd-group"><h3>' + esc(phase.years) + '</h3><ol>' + items.map(item =>
        '<li><button type="button" data-hd="record" data-id="' + esc(item.id) + '"><time>' + esc(item.date) +
        '</time><span class="hd-rowmain"><span class="hd-rowtitle">' + esc(item.title) +
        '</span><span class="hd-tag">' + esc(item.theme) + '</span></span>' + icon('right') +
        '</button></li>').join('') + '</ol></section>';
    }).join('');
  }
  function renderDetail(id, returning=false) {
    const e=events.get(id);
    if (!e) return renderList(false);
    eventId=id;
    updateMode('detail','返回档案');
    const figures=(e.images || []).map(n=>{
      const img=images.get(n);
      if (!img) return '';
      return '<figure class="hd-figure"><button type="button" data-hd="picture" data-id="'+n+'" aria-label="放大'+esc(img.alt)+'"><img loading="lazy" src="'+imagePath(n)+'" alt="'+esc(img.alt)+'"><span>'+icon('zoom')+'</span></button><figcaption>'+esc(img.caption)+'</figcaption></figure>';
    }).join('');
    const v=videos.get(e.video);
    const play = v ? '<button type="button" class="hd-film" data-hd="movie" data-id="'+esc(v.id)+'">'+icon('play')+'<span>'+esc(v.title)+'</span><small>'+esc(v.duration)+'</small></button>' : '';
    scroller.innerHTML='<article class="hd-inner hd-article"><div class="hd-meta"><time>'+esc(e.date)+'</time><span>'+esc(e.theme)+'</span></div>' +
      '<h2 class="hd-story-title" tabindex="-1">'+esc(e.title)+'</h2><p class="hd-copy">'+esc(e.body)+'</p>' + figures + play +
      '<div class="hd-sources"><h3>相关资料</h3><div>'+e.links.map(publicLink).join('')+'</div></div></article>';
    position(returning ? detailScroll : 0,scroller.querySelector('h2'));
  }
  function renderPicture(n) {
    const img=images.get(n);
    if (!img) return;
    updateMode('image','返回事件');
    scroller.innerHTML='<div class="hd-inner hd-media"><div class="hd-mediahead"><h2 tabindex="-1">'+esc(img.alt)+'</h2><button type="button" class="hd-size" data-hd="size" aria-pressed="false">查看大图</button></div>' +
      '<div class="hd-zoomstage"><img src="'+imagePath(n)+'" alt="'+esc(img.alt)+'"></div><p class="hd-caption">'+esc(img.caption)+'</p>'+publicLink(img.source)+'</div>';
    position(0,scroller.querySelector('h2'));
  }
  function renderMovie(id) {
    const movie=videos.get(id);
    if (!movie) return;
    updateMode('movie','返回事件');
    scroller.innerHTML='<div class="hd-inner hd-media"><div class="hd-mediahead"><h2 tabindex="-1">'+esc(movie.title)+'</h2></div>' +
      '<video controls playsinline preload="metadata" src="assets/'+encodeURIComponent(movie.file)+'" aria-label="'+esc(movie.title)+'"></video>' +
      '<p class="hd-caption">深势科技 · '+esc(movie.duration)+'<br>'+esc(movie.note)+'</p></div>';
    position(0,scroller.querySelector('h2'));
    const attempt=scroller.querySelector('video').play();
    if (attempt) attempt.catch(()=>{});
  }

  window.openHistoryArchive = function(phaseId='all', theme='all') {
    if (!setup()) return false;
    openPanel();
    filters={phase:phases.has(phaseId)?phaseId:'all',theme:themes.some(([name])=>name===theme)?theme:'all',query:''};
    listScroll=0;
    eventId=null;
    renderList(false);
    return true;
  };
  window.openHistoryEvent=function(dpId) {
    if (!setup() || !events.has(dpId)) return false;
    openPanel();
    filters={phase:events.get(dpId).phase,theme:'all',query:''};
    listScroll=0;
    renderDetail(dpId);
    return true;
  };
})();
