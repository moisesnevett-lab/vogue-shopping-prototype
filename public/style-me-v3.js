(() => {
  "use strict";
  const root = "./Style%20Me%203.0/STYLE%20ME%203.0/";
  const content = document.querySelector("#style-content");
  const header = document.querySelector("#v3-header");
  const dock = document.querySelector("#v3-dock");
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const unit = () => document.documentElement.clientWidth / 1875;
  const bodyFile = "v3__scroll_body_only__starts_after_header.png";
  const loads = new Map();
  const scrolling = new WeakMap();

  function node(tag, className, parent) {
    const el = document.createElement(tag);
    el.className = className;
    parent?.append(el);
    return el;
  }
  function artwork(file, parent, alt = "") {
    const img = node("img", "", parent);
    img.src = root + file;
    img.alt = alt;
    img.draggable = false;
    return img;
  }
  function preload(file) {
    if (!loads.has(file)) {
      const img = new Image();
      img.src = root + file;
      loads.set(file, img.decode());
    }
    return loads.get(file);
  }
  function block(file, height, parent = content, alt = "") {
    const el = node("div", "v3-block", parent);
    el.style.aspectRatio = `1875 / ${height}`;
    artwork(file, el, alt);
    return el;
  }
  function crop(file, start, end, parent = content) {
    const el = node("div", "v3-crop", parent);
    el.style.aspectRatio = `1875 / ${end - start}`;
    artwork(file, el).style.top = `${-start / (end - start) * 100}%`;
    return el;
  }
  function gap(height, parent = content) {
    node("div", "", parent).style.height = `calc(${height} * var(--u))`;
  }
  function hotspot(parent, label, rect, action) {
    const button = node("button", "hotspot", parent);
    button.type = "button";
    button.setAttribute("aria-label", label);
    if (rect) {
      const [x, y, w, h] = rect;
      Object.assign(button.style, {
        left: `calc(${x} * var(--u))`, top: `calc(${y} * var(--u))`,
        width: `calc(${w} * var(--u))`, height: `calc(${h} * var(--u))`
      });
    }
    button.addEventListener("click", action);
    return button;
  }
  function dots(parent, names, select) {
    const nav = node("nav", "pagination", parent);
    nav.setAttribute("aria-label", "Choose opening story");
    const buttons = names.map((name, i) => hotspot(nav, name, null, () => select(i)));
    buttons.forEach(button => button.classList.remove("hotspot"));
    const update = index => buttons.forEach((button, i) => button.setAttribute("aria-current", String(index === i)));
    update(0);
    return update;
  }

  // Short, cancellable movement for explicit navigation only. Free rails retain
  // native touch/wheel momentum. New input always cancels an in-progress tween.
  function stopScroll(target) { scrolling.get(target)?.(); }
  const easeInOutCubic = t => t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
  function scrollTo(target, value, vertical = false, duration = 240, ease = t => 1 - (1 - t) ** 3) {
    stopScroll(target);
    const read = () => target === window ? window.scrollY : target.scrollLeft;
    const write = position => target.scrollTo({ [vertical ? "top" : "left"]: position, behavior: "instant" });
    if (reduced() || Math.abs(read() - value) < .5) { write(value); return Promise.resolve(true); }
    return new Promise(resolve => {
      const from = read(), started = performance.now();
      let frame;
      target.classList?.add("v3-programmatic");
      const finish = complete => {
        cancelAnimationFrame(frame);
        scrolling.delete(target);
        target.classList?.remove("v3-programmatic");
        resolve(complete);
      };
      scrolling.set(target, () => finish(false));
      function step(now) {
        const t = Math.min(1, (now - started) / duration);
        write(from + (value - from) * ease(t));
        if (t < 1) frame = requestAnimationFrame(step);
        else finish(true);
      }
      frame = requestAnimationFrame(step);
    });
  }
  function centerCard(track, card, duration = 280) {
    const left = card.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;
    const target = left + (card.offsetWidth - track.clientWidth) / 2;
    return scrollTo(track, Math.max(0, Math.min(track.scrollWidth - track.clientWidth, target)), false, duration, easeInOutCubic);
  }
  ["wheel", "touchstart", "pointerdown"].forEach(type => window.addEventListener(type, () => stopScroll(window), { passive: true }));
  function rail(track, snap = false) {
    let drag = null, suppressClick = false;
    track.tabIndex = 0;
    ["wheel", "touchstart"].forEach(type => track.addEventListener(type, () => stopScroll(track), { passive: true }));
    track.addEventListener("pointerdown", event => {
      stopScroll(track);
      suppressClick = false;
      if (event.pointerType === "mouse" && event.button === 0) drag = { x: event.clientX, left: track.scrollLeft, moved: false };
    });
    track.addEventListener("pointermove", event => {
      if (!drag) return;
      if (Math.abs(event.clientX - drag.x) > 6) {
        drag.moved = true;
        track.classList.add("is-dragging");
        track.setPointerCapture(event.pointerId);
      }
      if (drag.moved) track.scrollLeft = drag.left + drag.x - event.clientX;
    });
    function release() {
      if (!drag) return;
      suppressClick = drag.moved;
      drag = null;
      track.classList.remove("is-dragging");
      if (snap && suppressClick) scrollTo(track, Math.round(track.scrollLeft / track.clientWidth) * track.clientWidth);
    }
    track.addEventListener("pointerup", release);
    track.addEventListener("pointercancel", release);
    track.addEventListener("click", event => {
      if (suppressClick) { event.preventDefault(); event.stopImmediatePropagation(); suppressClick = false; }
    }, true);
    if (snap) track.addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const index = Math.round(track.scrollLeft / track.clientWidth) + (event.key === "ArrowRight" ? 1 : -1);
      scrollTo(track, Math.max(0, Math.min(track.scrollWidth - track.clientWidth, index * track.clientWidth)));
    });
  }

  const dotGroups = new Map();
  const dotObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting || entry.target.dataset.played) return;
    // Loop copies share one attention cue and stay in phase across the wrap.
    const group = dotGroups.get(entry.target.dataset.cue) || [entry.target];
    group.forEach(dot => {
      dot.dataset.played = "true";
      if (!reduced()) dot.classList.add("played");
      dotObserver.unobserve(dot);
    });
  }), { threshold: .9, rootMargin: `${-header.offsetHeight}px 0px ${-dock.offsetHeight}px 0px` });
  function redDot(parent, x, y, cue) {
    const dot = artwork("v3__red_indicator__6px_transparent.png", parent);
    dot.className = "v3-red-dot";
    dot.style.left = `calc(${x * 5} * var(--u))`;
    dot.style.top = `calc(${y * 5} * var(--u))`;
    dot.setAttribute("aria-hidden", "true");
    if (cue) {
      dot.dataset.cue = cue;
      if (!dotGroups.has(cue)) dotGroups.set(cue, []);
      dotGroups.get(cue).push(dot);
    }
    dot.addEventListener("animationend", () => dot.classList.remove("played"), { once: true });
    dotObserver.observe(dot);
  }

  function hero() {
    const section = node("section", "v3-hero", content);
    section.setAttribute("aria-label", "Opening editorial carousel");
    const track = node("div", "image-track slide-track", section);
    [2, 0, 1, 2, 0].forEach((i, position) => {
      const slide = node("div", "image-slide", track);
      slide.dataset.story = String(i);
      if (position === 0 || position === 4) slide.setAttribute("aria-hidden", "true");
      artwork(`v3__hero_slide_0${i + 1}_banner_only.png`, slide, ["Today’s Editor’s Pick", "The denim story", "Wardrobe essentials"][i]);
      redDot(slide, 16, i === 1 ? 82 : 89, `hero-${i}`);
    });
    let touching = false, timer;
    const current = () => (Math.round(track.scrollLeft / track.clientWidth) + 2) % 3;
    function normalize() {
      if (touching || scrolling.has(track)) return;
      const position = track.scrollLeft / track.clientWidth;
      if (Math.abs(position - Math.round(position)) > .005) return;
      if (position > .005 && position < 3.995) return;
      track.classList.add("v3-programmatic");
      track.scrollLeft = (position < 1 ? 3 : 1) * track.clientWidth;
      requestAnimationFrame(() => track.classList.remove("v3-programmatic"));
    }
    const update = dots(section, ["Editor’s pick", "Denim story", "Wardrobe essentials"], index => {
      normalize();
      let delta = index - current();
      if (delta > 1) delta -= 3;
      if (delta < -1) delta += 3;
      scrollTo(track, (Math.round(track.scrollLeft / track.clientWidth) + delta) * track.clientWidth).then(normalize);
    });
    track.addEventListener("scroll", () => {
      update(current());
      clearTimeout(timer);
      timer = setTimeout(normalize, 120);
    }, { passive: true });
    track.addEventListener("scrollend", normalize);
    track.addEventListener("pointerdown", event => { if (event.pointerType === "mouse") touching = true; });
    ["pointerup", "pointercancel", "touchend", "touchcancel"].forEach(type => track.addEventListener(type, event => {
      if (type.startsWith("pointer") && event.pointerType !== "mouse") return;
      touching = false;
      clearTimeout(timer);
      timer = setTimeout(normalize, 120);
    }));
    track.addEventListener("touchstart", () => { touching = true; }, { passive: true });
    rail(track, true);
    track.scrollLeft = track.clientWidth;
  }

  function editorial(letter, states, headingHeight, initialRailOffset, afterGap) {
    const section = node("section", "v3-section", content);
    section.id = `edit-${letter.toLowerCase()}`;
    section.setAttribute("aria-label", `Editorial section ${letter}`);
    const stage = node("div", "v3-edit-stage", section);
    let active = 0, busy = false;
    const views = states.map((state, index) => {
      const view = node("div", "v3-edit-view");
      artwork(state.file, view, state.name);
      if (state.red) redDot(view, 16, 78);
      hotspot(view, `Explore ${state.name}`, [80, state.cta, 1715, 235], openPLP);
      if (letter === "A" || index === 0) hotspot(view, `Shop ${state.name}`, [1300, 2550, 495, 170], openPLP);
      if (state.topShop) hotspot(view, `Shop ${state.name} now`, [1400, 320, 395, 140], openPLP);
      return view;
    });
    stage.style.height = `calc(${states[0].height} * var(--u))`;
    stage.append(views[0]);
    section.dataset.active = "0";
    // The default section and its divider share three export pixels.
    crop(`v3__discover${letter}__section_heading_and_divider.png`, 3, headingHeight, section);
    const track = node("div", "image-track v3-discover v3-proximity", section);
    track.setAttribute("aria-label", `Discover More Edits — section ${letter}`);
    const cards = states.map((state, index) => {
      const card = node("div", "v3-edit-card", track);
      card.dataset.selected = String(index === 0);
      artwork(state.card, card, state.name);
      if (state.cardDot) redDot(card, ...state.cardDot);
      const upper = hotspot(card, `Show ${state.name}`, null, () => select(index));
      upper.classList.add("v3-card-upper");
      const lower = hotspot(card, `Browse ${state.name} products`, null, openPLP);
      lower.classList.add("v3-card-lower");
      return card;
    });
    rail(track);
    // Extra end padding lets the first and last cards centre too; compensate
    // here to preserve the original opening view of the card rail.
    requestAnimationFrame(() => { track.scrollLeft = (initialRailOffset + 220) * unit(); });
    async function select(index) {
      if (index === active || busy) return;
      busy = true;
      section.setAttribute("aria-busy", "true");
      try {
        await preload(states[index].file);
        const top = Math.max(0, section.getBoundingClientRect().top + window.scrollY - header.offsetHeight);
        const old = views[active], next = views[index];
        const from = stage.getBoundingClientRect().height;
        stage.append(next);
        old.inert = true;
        active = index;
        section.dataset.active = String(index);
        cards.forEach((card, i) => card.dataset.selected = String(i === index));
        stage.style.height = `calc(${states[index].height} * var(--u))`;
        const animations = [];
        if (!reduced()) {
          const timing = { duration: 500, easing: "cubic-bezier(.65, 0, .35, 1)", fill: "both" };
          animations.push(
            old.animate([{ opacity: 1 }, { opacity: 0, offset: .85 }, { opacity: 0 }], timing),
            next.animate([{ opacity: 0 }, { opacity: 1, offset: .85 }, { opacity: 1 }], timing),
            stage.animate([{ height: `${from}px` }, { height: `${states[index].height * unit()}px` }], timing)
          );
        }
        const arrived = await scrollTo(window, top, true, 500, easeInOutCubic);
        await Promise.all(animations.map(animation => animation.finished));
        old.remove();
        old.inert = false;
        animations.forEach(animation => animation.cancel());
        old.querySelectorAll(".v3-red-dot.played").forEach(dot => dot.classList.remove("played"));
        // This rail is now below the viewport; prepare the next suggestion
        // without moving the page or interfering with an interrupted scroll.
        if (arrived) centerCard(track, cards[(index + 1) % cards.length]);
      } finally { busy = false; section.setAttribute("aria-busy", "false"); }
    }
    gap(afterGap, section);
    // Views are already loading; decoded promises are shared by later selections.
    states.forEach(state => preload(state.file).catch(() => {}));
  }

  // The two-anchor, forward-only settling used by Style Me 2.0. It runs after
  // native momentum ends and never attracts the viewport back past an anchor.
  function magnetic(track, anchors) {
    let active = false, direction = 0, last = track.scrollLeft, timer, wheelUntil = 0;
    const queue = () => { clearTimeout(timer); timer = setTimeout(settle, 180); };
    function settle() {
      clearTimeout(timer);
      if (active || !direction || scrolling.has(track)) return;
      if (performance.now() < wheelUntil) { queue(); return; }
      const from = track.scrollLeft;
      const target = anchors.map(value => value * unit()).sort((a, b) => Math.abs(a - from) - Math.abs(b - from))[0];
      const delta = target - from;
      if (Math.abs(delta) < .5 || Math.abs(delta) > 120 * unit() || delta * direction < 0) return;
      direction = 0;
      scrollTo(track, target, false, 200).then(() => { direction = 0; last = track.scrollLeft; });
    }
    track.addEventListener("scroll", () => {
      if (!scrolling.has(track) && Math.abs(track.scrollLeft - last) > .1) {
        direction = Math.sign(track.scrollLeft - last); queue();
      }
      last = track.scrollLeft;
    }, { passive: true });
    track.addEventListener("scrollend", settle);
    track.addEventListener("pointerdown", () => { active = true; direction = 0; clearTimeout(timer); });
    ["pointerup", "pointercancel"].forEach(type => track.addEventListener(type, () => { active = false; queue(); }));
    track.addEventListener("touchstart", () => { active = true; clearTimeout(timer); }, { passive: true });
    ["touchend", "touchcancel"].forEach(type => track.addEventListener(type, () => { active = false; queue(); }, { passive: true }));
    track.addEventListener("wheel", () => { wheelUntil = performance.now() + 180; queue(); }, { passive: true });
  }

  function wishlist() {
    const section = node("section", "v3-section", content);
    section.id = "v3-wishlist";
    crop(bodyFile, 21090, 21650, section);
    const tabs = node("div", "image-track v3-editor-tabs", section);
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "Choose wishlist editor");
    // Four destinations reuse the two approved editor exports, as requested.
    const anchors = [0, 7035, 14069, 21104];
    let navigating = false, activeEditor = 0;
    const buttons = ["Chloe Malle", "Chioma Nnadi", "Chloe Malle", "Chioma Nnadi"].map((name, index) => {
      const tab = node("button", "v3-editor-tab", tabs);
      tab.type = "button"; tab.setAttribute("role", "tab"); tab.setAttribute("aria-label", index < 2 ? name : `${name} — repeat`);
      tab.setAttribute("aria-selected", String(index === 0));
      artwork(`v3__wishlist__tab_editor_0${index % 2 + 1}.png`, tab);
      tab.addEventListener("click", async () => {
        navigating = true;
        update(index);
        await scrollTo(track, anchors[index] * unit());
        navigating = false;
        updateCurrent();
      });
      return tab;
    });
    rail(tabs);
    gap(40, section);
    const track = node("div", "image-track v3-panorama", section);
    track.setAttribute("aria-label", "Editor’s Wishlist — four sections using Chloe Malle and Chioma Nnadi’s selections");
    for (let copy = 0; copy < 2; copy++) {
      const art = node("div", "v3-panorama-art", track);
      artwork("v3__editors_wishlist__full_free_scroll_strip.png", art, "Chloe Malle and Chioma Nnadi’s wishlists");
      [[270, 14], [525, 10], [819, 10]].forEach(position => redDot(art, ...position));
    }
    const update = index => {
      buttons.forEach((button, i) => button.setAttribute("aria-selected", String(i === index)));
      if (index === activeEditor) return;
      activeEditor = index;
      centerCard(tabs, buttons[index]);
    };
    const updateCurrent = () => update(anchors.reduce((active, anchor, index) =>
      track.scrollLeft + track.clientWidth / 2 >= anchor * unit() ? index : active, 0));
    track.addEventListener("scroll", () => { if (!navigating) updateCurrent(); }, { passive: true });
    rail(track);
    magnetic(track, anchors);
    gap(63, section);
  }

  function replaceLayer(img, file) {
    if (img.getAttribute("src") === root + file) return;
    const previous = img.cloneNode();
    img.src = root + file;
    if (reduced()) return;
    previous.className = "v3-layer-outgoing";
    previous.setAttribute("aria-hidden", "true");
    img.after(previous);
    previous.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: "ease-out" }).onfinish = () => previous.remove();
  }
  function whatToWear() {
    block("v3__what_to_wear__heading.png", 290);
    block("v3__what_to_wear__subheading.png", 270);
    const section = node("section", "v3-wear v3-section", content);
    section.id = "what-to-wear";
    section.setAttribute("aria-label", "What to Wear");
    const track = node("div", "image-track slide-track", section);
    const states = ["01_ideas", "02_celebrity", "03_street_style"];
    const file = (index, type) => `v3__what_to_wear__${states[index]}__${type}.png`;
    states.forEach((state, index) => {
      const slide = node("div", "image-slide", track);
      artwork(file(index, "FULL_506px_visual_no_nav"), slide, ["Ideas — expert tips on denim", "Celebrity style", "Street styles"][index]);
      ["TRANSPARENT_nav_overlay", "footer_sticky"].forEach(type => preload(file(index, type)).catch(() => {}));
    });
    const nav = node("nav", "v3-wear-nav", section);
    nav.setAttribute("aria-label", "What to Wear stories");
    const navImage = artwork(file(0, "TRANSPARENT_nav_overlay"), nav);
    const buttons = ["Ideas", "Celebrity", "Street Styles"].map((name, i) => {
      const button = hotspot(nav, name, null, () => scrollTo(track, i * track.clientWidth));
      button.style.left = `${i * 100 / 3}%`;
      button.setAttribute("aria-current", String(i === 0));
      return button;
    });
    const footer = node("div", "v3-wear-footer", section);
    const footerImage = artwork(file(0, "footer_sticky"), footer, "01 / 03 — Read & Shop");
    let active = 0;
    track.addEventListener("scroll", () => {
      const next = Math.max(0, Math.min(2, Math.round(track.scrollLeft / track.clientWidth)));
      if (next === active) return;
      active = next;
      section.dataset.active = String(active);
      replaceLayer(navImage, file(active, "TRANSPARENT_nav_overlay"));
      replaceLayer(footerImage, file(active, "footer_sticky"));
      footerImage.alt = `0${active + 1} / 03 — Read & Shop`;
      buttons.forEach((button, i) => button.setAttribute("aria-current", String(i === active)));
    }, { passive: true });
    rail(track, true);
    gap(62);
  }

  // Same sheet + transparent dismissal runway + independent 38% backdrop as
  // Today’s Article Detail overlay. The runway is gated by a NEW end gesture.
  const overlay = document.querySelector("#plp-overlay");
  const sheet = document.querySelector("#plp-sheet");
  const backHeader = document.querySelector("#plp-header");
  const backdrop = document.querySelector("#plp-backdrop");
  let savedY = 0, savedBodyStyle = "", opener = null, closing = false;
  function openPLP(event) {
    if (!overlay.hidden) return;
    stopScroll(window);
    savedY = window.scrollY;
    savedBodyStyle = document.body.getAttribute("style") || "";
    opener = event?.currentTarget || document.activeElement;
    Object.assign(document.body.style, { position: "fixed", top: `${-savedY}px`, left: "0", right: "0", width: "100%" });
    document.body.classList.add("plp-open");
    [content, header, dock].forEach(el => el.inert = true);
    overlay.hidden = backdrop.hidden = false;
    overlay.classList.remove("dismiss-armed");
    touch = null;
    overlay.scrollTop = 0;
    backHeader.style.transform = "";
    backdrop.style.opacity = ".38";
    document.querySelector("#plp-back").focus({ preventScroll: true });
    if (!reduced()) overlay.animate([{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 180, easing: "ease-out" });
  }
  async function closePLP(fromScroll = false) {
    if (closing || overlay.hidden) return;
    closing = true;
    if (!fromScroll && !reduced()) {
      backdrop.animate([{ opacity: getComputedStyle(backdrop).opacity }, { opacity: 0 }], { duration: 160 });
      await overlay.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160 }).finished;
    }
    overlay.hidden = backdrop.hidden = true;
    overlay.classList.remove("dismiss-armed");
    document.body.classList.remove("plp-open", "plp-revealing");
    document.body.setAttribute("style", savedBodyStyle);
    [content, header, dock].forEach(el => el.inert = false);
    window.scrollTo({ top: savedY, behavior: "instant" });
    opener?.focus({ preventScroll: true });
    closing = false;
  }
  const end = () => Math.max(0, sheet.offsetHeight - overlay.clientHeight);
  const atEnd = () => overlay.scrollTop >= end() - 2;
  const arm = () => overlay.classList.add("dismiss-armed");
  let touch = null;
  overlay.addEventListener("touchstart", event => {
    touch = event.touches.length === 1 ? {
      x: event.touches[0].clientX, y: event.touches[0].clientY,
      top: overlay.scrollTop, end: atEnd(), axis: null
    } : null;
  }, { passive: true });
  overlay.addEventListener("touchmove", event => {
    if (!touch?.end || event.touches.length !== 1) return;
    const dy = touch.y - event.touches[0].clientY, dx = touch.x - event.touches[0].clientX;
    if (!touch.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
      touch.axis = dy > Math.abs(dx) * 1.25 ? "dismiss" : "native";
    }
    if (touch.axis !== "dismiss" || !event.cancelable) return;
    // A swipe starting at the real vertical boundary owns only the dismissal
    // distance. This also works over the nested horizontal category scroller.
    event.preventDefault();
    arm();
    overlay.scrollTop = Math.max(end(), touch.top + dy);
  }, { passive: false });
  ["touchend", "touchcancel"].forEach(type => overlay.addEventListener(type, () => { touch = null; }, { passive: true }));
  overlay.addEventListener("wheel", event => {
    if (event.deltaY <= Math.abs(event.deltaX) * 1.25 || !atEnd()) return;
    // Read the actual vertical boundary on every event, not once at the start
    // of a wheel session. Reaching the bottom alone never adds the runway.
    arm();
    if (!event.cancelable) return;
    event.preventDefault();
    const amount = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? overlay.clientHeight : 1);
    overlay.scrollTop += amount;
  }, { passive: false });
  overlay.addEventListener("keydown", event => {
    if (event.key === "Escape") { event.preventDefault(); closePLP(); }
    if (!event.repeat && atEnd() && ["ArrowDown", "PageDown", "End", " "].includes(event.key)) arm();
    if (event.key === "Tab") {
      const targets = [...overlay.querySelectorAll('button, [tabindex="0"]')];
      const first = targets[0], last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  overlay.addEventListener("scroll", () => {
    const distance = Math.max(0, overlay.scrollTop - end());
    const progress = Math.min(1, distance / Math.max(1, overlay.clientHeight));
    backdrop.style.opacity = String(.38 * (1 - progress));
    backHeader.style.transform = `translateY(${-distance}px)`;
    document.body.classList.toggle("plp-revealing", progress > 0);
    if (overlay.scrollTop < end() - 4) overlay.classList.remove("dismiss-armed");
    if (overlay.scrollTop >= sheet.offsetHeight - 1) closePLP(true);
  }, { passive: true });
  document.querySelector("#plp-back").addEventListener("click", () => closePLP());
  const plpContent = document.querySelector("#plp-content");
  const plpFile = "v3__PLP__body_scroll_without_top_back_arrow.png";
  // The body export starts 125px inside the header crop and retains an arrow tip.
  crop(plpFile, 125, 14925, plpContent);
  const plpCategories = node("div", "image-track v3-plp-categories", plpContent);
  plpCategories.setAttribute("aria-label", "Dresses, Jackets, Tops, Knitwear, Denim, Shoes");
  artwork("v3__PLP__six_category_horizontal_strip.png", plpCategories, "Dresses, Jackets, Tops, Knitwear, Denim, Shoes");
  rail(plpCategories);
  crop(plpFile, 16045, 16445, plpContent);

  // Coordinates below are in the unchanged 5× exports, not reconstructed UI.
  hero();
  editorial("A", [
    { name: "The Under $300 Edit", file: "v3__editA__state_01_under300_default.png", height: 7868, cta: 7515, red: true, card: "v3__discoverA__card_under300__normal.png" },
    { name: "The Cold Weather Shop", file: "v3__editA__state_02_cold_weather.png", height: 6900, cta: 6665, red: true, card: "v3__discoverA__card_cold_weather__normal.png", cardDot: [9, 23] },
    { name: "Knitwear", file: "v3__editA__state_03_knitwear.png", height: 6900, cta: 6665, topShop: true, card: "v3__discoverA__card_knitwear__normal.png" }
  ], 175, 1115, 130);
  editorial("B", [
    { name: "Fall Must Haves", file: "v3__editB__state_01_fall_must_haves_default.png", height: 7868, cta: 7515, red: true, card: "v3__discoverB__card_fall_must_haves__normal.png" },
    { name: "New In", file: "v3__editB__state_02_new_in.png", height: 4868, cta: 4515, red: true, card: "v3__discoverB__card_new_in__normal.png", cardDot: [11, 23] },
    { name: "Trending Now", file: "v3__editB__state_03_trending_now.png", height: 4868, cta: 4515, topShop: true, card: "v3__discoverB__card_trending_now__normal.png" },
    { name: "Wardrobe Essentials", file: "v3__editB__state_04_wardrobe_essentials.png", height: 4868, cta: 4515, red: true, card: "v3__discoverB__card_wardrobe_essentials__normal.png" }
  ], 210, 1105, 65);
  wishlist();
  whatToWear();
  crop("v3__continue_exploring__viewport.png", 0, 283);
  const explore = node("div", "image-track v3-explore v3-proximity", content);
  explore.setAttribute("aria-label", "Continue Exploring — Dresses, Jackets, Tops, Knitwear, Denim, Shoes, Bags");
  ["dresses", "jackets", "tops", "knitwear", "denim", "shoes"].forEach((name, i) => artwork(`v3__category_0${i + 1}_${name}.png`, explore, name));
  // The seventh tile reuses the original prototype's Gucci product photograph.
  const bags = node("figure", "v3-category-bags", explore);
  const bagImage = node("img", "", bags);
  bagImage.src = "./laydowns/183%20%E2%80%94%20Gucci%20Jackie%201961/183%20%E2%80%94%20Gucci%20Jackie%201961/black%20leather%20product%20laydown.png";
  bagImage.alt = "Black leather shoulder bag";
  artwork("v3__sticky_category_nav.png", node("figcaption", "", bags), "Bags");
  rail(explore);
  gap(210);
  [["New Arrivals", 80, 545], ["Clothing", 665, 420], ["Bags", 1125, 270], ["Shoes", 1435, 310], ["More categories", 1785, 90]]
    .forEach(([name, x, width]) => hotspot(document.querySelector("#v3-categories"), name, [x, 35, width, 160], openPLP));
  document.querySelector("#shopping-top").addEventListener("click", () => scrollTo(window, 0, true));
})();
