(() => {
  const atlas = document.querySelector(".dpv2-atlas");
  const plate = atlas?.querySelector(".field-plate");
  if (!plate) return;
  const image = plate.querySelector("img");
  const caption = plate.querySelector("figcaption span");
  const fields = [...atlas.querySelectorAll(".dpv2-field")];
  const plates = {
    "ls-basic": {
      file: "basic",
      caption: "双波源干涉场 · 同频波叠加示意",
      alt: "两个点波源发出的圆形波相互叠加，形成交替明暗的干涉条纹。"
    },
    "ls-life": {
      file: "life",
      caption: "小鼠 IgG2a 抗体 · 据 PDB 1IGT 晶体结构绘制",
      alt: "小鼠完整抗体的蛋白质结构，两条重链用蓝色显示，两条轻链用银灰色显示。"
    },
    "ls-matter": {
      file: "matter",
      caption: "二维多晶模型 · 晶格取向与晶界示意",
      alt: "二维多晶模型中，不同晶粒的原子排列方向不同。蓝灰色点表示晶粒内的原子，金色标出晶界附近的原子。"
    },
    "ls-model": {
      file: "model",
      caption: "曲面插值 · 由离散采样点重建连续曲面",
      alt: "金色点标出原函数的采样位置。三角网格连接各点，浅色等高线描绘插值曲面的形状。"
    }
  };
  const file = plate => "assets/v3-field-" + plate.file + ".webp";
  const prefetched = new Set();
  function select(field) {
    const selected = plates[field?.id];
    if (!selected || image.getAttribute("src") === file(selected)) return;
    image.alt = selected.alt;
    image.dataset.source = field.id === "ls-life" ? "https://www.rcsb.org/structure/1IGT" : "";
    caption.textContent = selected.caption;
    image.src = file(selected);
  }
  function prime(field) {
    const src = file(plates[field.id]);
    if (prefetched.has(src) || image.getAttribute("src") === src) return;
    prefetched.add(src);
    const preview = new Image();
    preview.src = src;
  }
  for (const field of fields) {
    if (!plates[field.id]) continue;
    field.addEventListener("toggle", () => { if (field.open) select(field) });
    field.firstElementChild.addEventListener("pointerenter", () => prime(field), {once: true});
    field.firstElementChild.addEventListener("focus", () => prime(field), {once: true});
  }
  select(fields.find(field => field.open));
})();
