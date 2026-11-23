const menu = document.getElementById('contents-dialog');
const toggle = document.getElementById('contents-open');
toggle.addEventListener('click', () => menu.showModal());
menu.querySelector('.close-modal').addEventListener('click', () => menu.close());
menu.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (link) {
    menu.close();
    const section = document.getElementById(link.hash.slice(1));
    if (section) {
      section.setAttribute('tabindex', '-1');
      section.focus({preventScroll:true});
    }
  }
  if (event.target === menu) {
    const r = menu.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) menu.close();
  }
});
const chapters = [...document.querySelectorAll('.chapter-links a')];
const sections = chapters.map(link => document.getElementById(link.hash.slice(1)));
const chapterStrip = document.querySelector('.chapter-links');
let currentChapter = null;
let scheduled = false;
function markChapter() {
  scheduled = false;
  const boundary = document.querySelector('.chapter-bar').getBoundingClientRect().bottom + 40;
  let current = null;
  for (const section of sections) {
    if (section && section.getBoundingClientRect().top <= boundary) current = section.id;
  }
  if (current === currentChapter) return;
  currentChapter = current;
  const selected = chapters.find(link => link.hash === '#' + current);
  if (selected && chapterStrip.scrollWidth > chapterStrip.clientWidth) {
    const tab = selected.getBoundingClientRect();
    const strip = chapterStrip.getBoundingClientRect();
    if (tab.right > strip.right - 16) chapterStrip.scrollLeft += tab.right - strip.right + 16;
    else if (tab.left < strip.left + 16) chapterStrip.scrollLeft += tab.left - strip.left - 16;
  }
  chapters.forEach(link => {
    if (link.hash === '#' + current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
function schedule() {
  if (!scheduled) {
    scheduled = true;
    requestAnimationFrame(markChapter);
  }
}
window.addEventListener('scroll', schedule, {passive:true});
window.addEventListener('resize', schedule);
document.querySelector('.long-intro').addEventListener('toggle', schedule);
markChapter();

const historyFilm = document.getElementById('history-film');
const filmButton = document.querySelector('.film-begin');
if (historyFilm && filmButton) {
  historyFilm.controls = false;
  filmButton.hidden = false;
  filmButton.addEventListener('click', async () => {
    historyFilm.controls = true;
    filmButton.hidden = true;
    try {
      if (historyFilm.ended) historyFilm.currentTime = 0;
      await historyFilm.play();
      historyFilm.focus({preventScroll:true});
    } catch {
      historyFilm.controls = true;
      filmButton.hidden = false;
    }
  });
  historyFilm.addEventListener('ended', () => {
    historyFilm.controls = false;
    filmButton.querySelector('span').textContent = '重播短片';
    filmButton.hidden = false;
  });
}
