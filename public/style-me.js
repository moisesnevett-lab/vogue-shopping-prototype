(() => {
  "use strict";
  const version = new URLSearchParams(location.search).get("version") === "2" ? 2 : 1;
  const prefix = `v${version}`;
  const assets = "./New%20Style%20Me%20Prototypes/STYLEME/";
  const content = document.querySelector("#style-content");
  const bodyAsset = `${prefix}__scroll_body_only.png`;
  const motion = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
  document.title = `Vogue — Style Me ${version}.0`;
  content.setAttribute("aria-label", `Style Me ${version}.0 — Editorialised ${version === 1 ? "Grids" : "Carousels"}`);
  document.querySelector("#style-header-image").src = assets + `shared__${prefix}_top_header.png`;
  document.querySelector("#style-dock-image").src = assets + `shared__${prefix}_bottom_dock.png`;
  document.querySelector("#shopping-top").onclick = () => window.scrollTo({ top: 0, behavior: motion() });

  function element(tag, className, parent) {
    const node = document.createElement(tag);
    node.className = className;
    if (parent) parent.append(node);
    return node;
  }

  function image(file, parent, alt = "") {
    const img = element("img", "", parent);
    img.src = assets + file;
    img.alt = alt;
    img.draggable = false;
    return img;
  }

  // Window the ORIGINAL body export; no generated crops or overlaid static carousels.
  function slice(start, end, id, label = "") {
    const node = element("section", "image-slice image-region", content);
    node.style.aspectRatio = `1875 / ${end - start}`;
    if (id) node.id = id;
    const img = image(bodyAsset, node, label);
    img.style.top = `${-start / (end - start) * 100}%`;
    return node;
  }

  function jump(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: motion(), block: "start" });
  }

  function pagination(parent, names, select) {
    const nav = element("nav", "pagination", parent);
    nav.setAttribute("aria-label", "Choose carousel slide");
    const buttons = names.map((name, i) => {
      const button = element("button", "", nav);
      button.type = "button";
      button.setAttribute("aria-label", name);
      button.onclick = () => select(i);
      return button;
    });
    const update = index => buttons.forEach((b, i) => b.setAttribute("aria-current", String(i === index)));
    update(0);
    return update;
  }

  // Touch and wheel scrolling are entirely native. Keep the existing mouse drag
  // convenience without intercepting either axis of a touch/trackpad gesture.
  function draggable(track) {
    let mouse = null;
    track.addEventListener("pointerdown", e => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      mouse = { x: e.clientX, left: track.scrollLeft };
      track.classList.add("is-dragging");
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener("pointermove", e => {
      if (mouse) track.scrollLeft = mouse.left + mouse.x - e.clientX;
    });
    track.addEventListener("pointerup", e => {
      if (!mouse) return;
      mouse = null;
      track.classList.remove("is-dragging");
      if (track.classList.contains("slide-track")) {
        track.scrollTo({ left: Math.round(track.scrollLeft / track.clientWidth) * track.clientWidth, behavior: motion() });
      }
    });
    track.addEventListener("pointercancel", () => { mouse = null; track.classList.remove("is-dragging"); });
    track.tabIndex = 0;
  }

  function slides(kind, files, names) {
    const region = element("section", `image-region ${kind}`, content);
    region.id = kind;
    region.setAttribute("aria-label", kind === "promo" ? "Announcements" : "Stories of the Week");
    const track = element("div", "image-track slide-track", region);
    track.setAttribute("aria-roledescription", "carousel");
    track.setAttribute("aria-label", region.getAttribute("aria-label"));
    files.forEach((file, i) => {
      const slide = element("div", "image-slide", track);
      const img = image(file, slide, names[i]);
      if (kind === "promo" && i > 0) img.className = "inset-promo";
    });
    let active = 0;
    const select = i => track.scrollTo({ left: i * track.clientWidth, behavior: motion() });
    let update;
    if (kind === "promo") update = pagination(region, names, select);
    else {
      // Each story PNG already contains its own active bar and slide number.
      const tabs = element("div", "story-tabs", region);
      const buttons = names.map((name, i) => {
        const b = element("button", "", tabs);
        b.type = "button"; b.setAttribute("aria-label", name); b.onclick = () => select(i);
        return b;
      });
      update = index => buttons.forEach((b, i) => b.setAttribute("aria-current", String(index === i)));
      update(0);
    }
    track.addEventListener("scroll", () => {
      active = Math.round(track.scrollLeft / track.clientWidth);
      region.dataset.slide = active;
      update(active);
    }, { passive: true });
    track.addEventListener("keydown", e => {
      if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
      e.preventDefault(); select(Math.max(0, Math.min(files.length - 1, active + (e.key === "ArrowRight" ? 1 : -1))));
    });
    new ResizeObserver(() => track.scrollTo({ left: active * track.clientWidth, behavior: "instant" })).observe(region);
    draggable(track);
    return region;
  }

  function under300() {
    const names = ["The 90’s Comeback", "Winter Whites", "Chartreuse Calling"];
    const keys = ["90s", "winter_whites", "chartreuse"];
    const region = element("section", "image-region under-groups", content);
    region.id = "under-groups";
    region.setAttribute("aria-label", "Under $300 editorial groups");
    const track = element("div", "image-track under-products", region);
    track.setAttribute("aria-label", "Continuously scroll products in either direction");
    // Repeated, unchanged strips form ONE native scroller. Generous runway keeps
    // momentum away from physical ends; recycling happens only after input settles.
    const middleCycle = 4;
    for (let copy = 0; copy < 9; copy++) {
      keys.forEach((key, i) => {
        const img = image(`v2__under300__${key}__four_product_strip.png`, track, names[i] + " — four products");
        if (copy !== middleCycle) img.setAttribute("aria-hidden", "true");
      });
    }
    const label = element("div", "under-label", region);
    label.tabIndex = 0;
    label.setAttribute("role", "group");
    label.setAttribute("aria-label", "Swipe or use arrow keys to change editorial group");
    const labelImage = image("v2__under300__90s__editorial_pill.png", label, names[0]);
    const labelSources = keys.map(key => {
      const img = new Image();
      img.src = assets + `v2__under300__${key}__editorial_pill.png`;
      return img;
    });
    const status = element("span", "sr-only", region);
    status.setAttribute("aria-live", "polite");
    let active = -1, slot = middleCycle * keys.length, outgoing = null;
    let stripWidth = track.clientWidth * 3410 / 1875;
    let last = slot * stripWidth, touching = false, idleTimer;
    function setGroup(nextSlot, direction) {
      slot = nextSlot;
      const next = ((slot % keys.length) + keys.length) % keys.length;
      if (next === active) return;
      outgoing?.remove();
      labelImage.getAnimations().forEach(animation => animation.cancel());
      const animate = active !== -1 && !matchMedia("(prefers-reduced-motion: reduce)").matches;
      const previous = animate ? labelImage.cloneNode() : null;
      active = next;
      labelImage.src = labelSources[active].src;
      labelImage.alt = names[active];
      region.dataset.group = keys[active];
      status.textContent = `${names[active]}, group ${active + 1} of 3`;
      update(active);
      if (previous) {
        previous.className = "under-label-outgoing";
        previous.setAttribute("aria-hidden", "true");
        label.append(previous);
        outgoing = previous;
        const offset = (direction || 1) * 10;
        const timing = { duration: 180, easing: "ease-out" };
        previous.animate([{ opacity: 1, transform: "translateX(0)" },
          { opacity: 0, transform: `translateX(${-offset}px)` }], timing).onfinish = () => previous.remove();
        labelImage.animate([{ opacity: 0, transform: `translateX(${offset}px)` },
          { opacity: 1, transform: "translateX(0)" }], timing);
      }
    }
    function select(index, step = 0) {
      const next = (index + keys.length) % keys.length;
      const delta = step || ((next - active + 4) % keys.length - 1);
      setGroup(slot + delta, delta);
      // A direct label/dot selection is explicit navigation, independent of free scrolling.
      track.scrollTo({ left: slot * stripWidth, behavior: "instant" });
    }
    const update = pagination(region, names, select);
    setGroup(slot, 1);
    track.scrollLeft = last;
    draggable(track);
    function recycle() {
      if (touching || track.classList.contains("is-dragging")) return;
      const cycleWidth = stripWidth * keys.length;
      const withinCycle = ((track.scrollLeft % cycleWidth) + cycleWidth) % cycleWidth;
      last = middleCycle * cycleWidth + withinCycle;
      // The visible pixels are identical in every copy. Never rebase mid-gesture.
      track.scrollTo({ left: last, behavior: "instant" });
      slot = Math.floor((last + track.clientWidth / 2) / stripWidth);
    }
    function queueRecycle() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(recycle, 220);
    }
    track.addEventListener("scroll", () => {
      const left = track.scrollLeft;
      // The group occupying the viewport centre owns the label and pagination.
      setGroup(Math.floor((left + track.clientWidth / 2) / stripWidth), Math.sign(left - last));
      last = left;
      queueRecycle();
    }, { passive: true });
    track.addEventListener("scrollend", queueRecycle);
    track.addEventListener("touchstart", () => { touching = true; clearTimeout(idleTimer); }, { passive: true });
    ["touchend", "touchcancel"].forEach(type => track.addEventListener(type, () => {
      touching = false; queueRecycle();
    }, { passive: true }));
    track.addEventListener("pointerup", queueRecycle);
    new ResizeObserver(() => {
      const width = track.clientWidth * 3410 / 1875;
      if (width === stripWidth) return;
      last = track.scrollLeft / stripWidth * width;
      stripWidth = width;
      track.scrollTo({ left: last, behavior: "instant" });
    }).observe(track);
    let start = null;
    label.addEventListener("pointerdown", e => {
      start = { x: e.clientX, y: e.clientY };
      label.setPointerCapture(e.pointerId);
    });
    label.addEventListener("pointerup", e => {
      if (!start) return;
      const dx = start.x - e.clientX, dy = start.y - e.clientY;
      start = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.25) {
        const step = dx > 0 ? 1 : -1;
        select(active + step, step);
      }
    });
    label.addEventListener("pointercancel", () => { start = null; });
    label.addEventListener("wheel", e => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (!label.wheelBusy && Math.abs(e.deltaX) > 5) {
        const step = e.deltaX > 0 ? 1 : -1;
        select(active + step, step); label.wheelBusy = true;
      }
      clearTimeout(label.wheelTimer);
      label.wheelTimer = setTimeout(() => { label.wheelBusy = false; }, 220);
    }, { passive: false });
    label.addEventListener("keydown", e => {
      if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
      e.preventDefault();
      const step = e.key === "ArrowRight" ? 1 : -1;
      select(active + step, step);
    });
  }

  function wishlist() {
    const region = element("section", "image-region wishlist", content);
    region.setAttribute("aria-label", "Editor’s Wishlist");
    const track = element("div", "image-track slide-track", region);
    track.setAttribute("aria-label", "Swipe through four wishlist edits");
    track.setAttribute("aria-roledescription", "carousel");
    const states = [
      [],
      [["public/shopping/story-tailoring.png", "Tailored runway look"],
        ["laydowns/345 — Product Image.png", "Grey tailored trousers"],
        ["laydowns/248 — Image.png", "Gold flower earrings"],
        ["laydowns/234 — Image.png", "Cream slingback shoes"]],
      [["public/shopping/story-season.png", "Camel runway look"],
        ["laydowns/274 — Product Image.png", "Camel blazer"],
        ["laydowns/233 — Image.png", "Burgundy flats"],
        ["laydowns/244 — Image.png", "Pale yellow blouse"]],
      [["public/shopping/street-style-vote.png", "Layered street-style look"],
        ["laydowns/261 — image.png", "Layering pieces"],
        ["laydowns/299 — image 65.png", "Black knee-high boots"],
        ["laydowns/342 — Product Image.png", "Paris T-shirt"]]
    ];
    states.forEach((pictures, index) => {
      const slide = element("div", "image-slide", track);
      image("v2__editors_wishlist__static_content.png", slide, index === 0 ? "Chloe Malle’s wishlist" : "");
      if (!pictures.length) return;
      // Keep the original header, byline, CTA and exact grid geometry. Only these
      // four image windows change; all source artwork remains untouched.
      const grid = element("div", "wishlist-pictures", slide);
      pictures.forEach(([file, alt], i) => {
        const img = element("img", i === 0 ? "wishlist-look" : "", grid);
        img.src = "./" + file.split("/").map(encodeURIComponent).join("/");
        img.alt = alt;
        img.draggable = false;
      });
    });
    let active = 0;
    const update = pagination(region, ["Original wishlist", "Tailoring", "Cold weather", "Everyday pieces"],
      index => track.scrollTo({ left: index * track.clientWidth, behavior: motion() }));
    track.addEventListener("scroll", () => {
      active = Math.round(track.scrollLeft / track.clientWidth);
      region.dataset.slide = active;
      update(active);
    }, { passive: true });
    new ResizeObserver(() => track.scrollTo({ left: active * track.clientWidth, behavior: "instant" })).observe(region);
    draggable(track);
  }

  function editorialSnap(track) {
    // Source-image coordinates: only the two editorial cards are anchors.
    // Their original 80px inset is preserved by aligning the image offset itself.
    const anchors = [0, 8045];
    let active = false, snapping = false, direction = 0;
    let last = track.scrollLeft, wheelUntil = 0, timer, frame;
    function cancel() {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      snapping = false;
      last = track.scrollLeft;
    }
    function queue() {
      clearTimeout(timer);
      timer = setTimeout(settle, 180);
    }
    function settle() {
      clearTimeout(timer);
      if (active || snapping || !direction) return;
      if (performance.now() < wheelUntil) { queue(); return; }
      const from = track.scrollLeft;
      const scale = track.clientWidth / 1875;
      const target = anchors.map(x => x * scale).sort((a, b) => Math.abs(a - from) - Math.abs(b - from))[0];
      const distance = target - from;
      // A small, forward-only attraction: passing an anchor never pulls you back.
      if (Math.abs(distance) < 0.5 || Math.abs(distance) > 120 * scale || distance * direction < 0) return;
      direction = 0;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        track.scrollLeft = target;
        last = track.scrollLeft;
        return;
      }
      snapping = true;
      const started = performance.now();
      function step(now) {
        const progress = Math.min(1, (now - started) / 200);
        track.scrollLeft = from + distance * (1 - (1 - progress) ** 3);
        last = track.scrollLeft;
        if (progress < 1) frame = requestAnimationFrame(step);
        else { snapping = false; direction = 0; }
      }
      frame = requestAnimationFrame(step);
    }
    track.addEventListener("scroll", () => {
      const left = track.scrollLeft;
      if (!snapping && Math.abs(left - last) > 0.1) {
        direction = Math.sign(left - last);
        queue();
      }
      last = left;
    }, { passive: true });
    track.addEventListener("scrollend", settle);
    track.addEventListener("touchstart", () => { cancel(); active = true; direction = 0; }, { passive: true });
    track.addEventListener("touchend", () => { active = false; queue(); }, { passive: true });
    track.addEventListener("touchcancel", () => { active = false; cancel(); direction = 0; }, { passive: true });
    track.addEventListener("pointerdown", e => {
      if (e.pointerType === "mouse") { cancel(); active = true; direction = 0; }
    });
    track.addEventListener("pointerup", e => { if (e.pointerType === "mouse") { active = false; queue(); } });
    track.addEventListener("pointercancel", e => { if (e.pointerType === "mouse") { active = false; cancel(); direction = 0; } });
    track.addEventListener("wheel", () => { cancel(); wheelUntil = performance.now() + 180; queue(); }, { passive: true });
    track.addEventListener("keydown", cancel);
    new ResizeObserver(() => { cancel(); direction = 0; }).observe(track);
  }

  const categories = element("nav", "image-region category-nav", content);
  categories.setAttribute("aria-label", "Shopping categories");
  image(`shared__${prefix}_category_nav.png`, categories);
  [["New Arrivals", 80, 545, "under-300"], ["Clothing", 665, 420, "explore"],
    ["Bags", 1125, 270, "under-300"], ["Shoes", 1435, 310, "under-300"],
    ["More categories", 1785, 90, "explore"]].forEach(([name, left, width, target]) => {
    const button = element("button", "hotspot", categories);
    button.type = "button"; button.setAttribute("aria-label", name);
    button.style.left = `${left / 1875 * 100}%`; button.style.width = `${width / 1875 * 100}%`;
    button.onclick = () => jump(target);
  });
  slides("promo", ["01_current", "02_notify", "03_featured"].map(state => `${prefix}__promo_${state}.png`),
    ["Today’s Editor’s Pick", "Tomorrow, 6pm — Wardrobe Essentials", "Story of the Week — Buyer’s Rejoice"]);

  if (version === 1) {
    slice(1385, 20970, "under-300", "The Under $300 Edit, The Cold Weather Shop, and Editor’s Wishlist");
  } else {
    slice(1385, 1735, "under-300", "The Under $300 Edit");
    under300(); // Replaces body coordinates 1735–4265, including static pagination.
    slice(4265, 4735, "what-vogue-wears", "What Vogue Wears");
    const shop = element("section", "image-region", content);
    const track = element("div", "image-track shop-track", shop);
    track.setAttribute("aria-label", "What Vogue Wears — The Cold Weather Shop and Knitwear");
    image("v2__shop_in_shop__full_horizontal_strip.png", track, "The Cold Weather Shop and Knitwear, swipe to explore");
    draggable(track);
    editorialSnap(track);
    slice(6647, 7305, null, "Stories of the Week");
  }
  slides("stories", ["01_the_edit", "02_from_social", "03_style_notes"].map(state => `${prefix}__stories_${state}.png`),
    ["The Edit", "From Social", "Style Notes"]);
  if (version === 1) slice(23680, 24025, null, "Continue Exploring");
  else {
    slice(10015, 10305, "editors-wishlist", "Editor’s Wishlist");
    wishlist();
    slice(13720, 14080, null, "Continue Exploring");
  }

  const explore = element("section", "image-region", content);
  explore.id = "explore";
  const exploreTrack = element("div", "image-track explore-track", explore);
  exploreTrack.setAttribute("aria-label", "Continue Exploring — Dresses, Jackets, Tops");
  ["Dresses", "Jackets", "Tops"].forEach((name, i) => image(`${prefix}__explore__category_0${i + 1}.png`, exploreTrack, name));
  draggable(exploreTrack);
  slice(version === 1 ? 25145 : 15200, version === 1 ? 25275 : 15315);
})();
