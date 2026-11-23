(() => {
  "use strict";
  const picker = document.querySelector(".dpv2-record-picker");
  if (!picker) return;
  const tabs = [...picker.querySelectorAll("a[href^='#']")];
  const panels = tabs.map(tab => document.getElementById(tab.hash.slice(1)));
  if (panels.some(panel => !panel)) return;

  function selectRecord(index, focus = false) {
    tabs.forEach((tab, current) => {
      tab.setAttribute("aria-selected", String(index === current));
      tab.tabIndex = index === current ? 0 : -1;
      panels[current].hidden = index !== current;
    });
    if (focus) tabs[index].focus();
  }

  picker.setAttribute("role","tablist");
  tabs.forEach((tab, index) => {
    tab.id = "exhibit-tab-" + panels[index].id;
    tab.setAttribute("role","tab");
    tab.setAttribute("aria-controls",panels[index].id);
    panels[index].setAttribute("role","tabpanel");
    panels[index].setAttribute("aria-labelledby",tab.id);
    panels[index].tabIndex = 0;
    tab.addEventListener("click",event => {
      event.preventDefault();
      selectRecord(index);
    });
    tab.addEventListener("keydown",event => {
      const keys = {ArrowLeft:(index - 1 + tabs.length) % tabs.length, ArrowRight:(index + 1) % tabs.length, Home:0, End:tabs.length-1};
      if (!(event.key in keys)) return;
      event.preventDefault();
      selectRecord(keys[event.key],true);
    });
  });

  function readLocation() {
    const index = tabs.findIndex(tab => tab.hash === location.hash);
    if (index >= 0) selectRecord(index);
    const detail = location.hash && document.getElementById(location.hash.slice(1));
    if (detail instanceof HTMLDetailsElement) detail.open = true;
  }
  selectRecord(0);
  readLocation();
  addEventListener("hashchange",readLocation);
})();
