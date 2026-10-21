(() => {
  const app = document.querySelector("#shopping-app");
  const arrival = app.querySelector(".arrival");
  const editorialMessage = arrival.querySelector("[data-editorial-message]");
  const messageLabel = editorialMessage.querySelector(".message-label");
  const messageBody = editorialMessage.querySelector(".message-body");
  const messageCta = editorialMessage.querySelector(".text-link");
  const messageCtaLabel = editorialMessage.querySelector(".message-cta-label");
  const pdp = document.querySelector("#product-detail");
  const backButton = pdp.querySelector(".pdp-back");
  const pdpScroll = pdp.querySelector(".pdp-scroll");
  const pdpHeroImage = pdp.querySelector(".pdp-image > img");
  const pdpBrandName = pdp.querySelector(".brand-name");
  const pdpProductTitle = pdp.querySelector(".product-title-row p");
  const pdpDescription = pdp.querySelector(".pdp-description");
  const pdpVogueKnows = pdp.querySelector(".vogue-knows");
  const pdpFeaturedIn = pdp.querySelector(".pdp-featured-in");
  const originalPdpImage = pdpHeroImage.src;
  const originalPdpTitle = pdpProductTitle.textContent;
  const saveButton = pdp.querySelector(".save-button");
  const saveLabel = saveButton.querySelector(".save-label");
  const guideOverlay = document.querySelector("#denim-guide-overlay");
  const guideBack = guideOverlay.querySelector("[data-close-guide]");
  const guideScroll = guideOverlay.querySelector(".style-guide-scroll");
  const preferenceFeedback = pdp.querySelector("[data-preference-feedback]");
  const wardrobeActions = pdp.querySelector(".wardrobe-actions");
  let lastProductTrigger = null;
  let guideReturnTrigger = null;
  let productReturnOverlay = null;
  let pdpTouchGesture = null;
  let pdpDismissState = "idle";
  let pdpDismissTimer = 0;

  const editorialDestinations = {
    under300: { section: "under-300", page: 0 },
    story: { section: "stories", story: 1 },
    tailoring: { section: "stories", story: 1 },
    vote: { section: "vote" },
    denimGuide: { overlay: "denim-guide" }
  };
  const continueDestinations = {
    dresses: { section: "under-300", page: 0 },
    jackets: { section: "under-300", page: 2 },
    tops: { section: "under-300", page: 3 }
  };
  const editorialMessages = [
    {
      label: "UNDER $300 · NEW EDIT",
      body: "Funnel-neck knits and brushed textures are the standout finds in this week's under-$300 edit.",
      cta: "Shop the edit",
      destination: "under300"
    },
    {
      label: "STORY OF THE WEEK · LONG SILHOUETTES",
      body: "The silhouette of the season is getting longer. Our new Story of the Week explores why.",
      cta: "Explore the story",
      destination: "story"
    },
    {
      label: "READ & SHOP · THE EASE OF TAILORING",
      body: "Tailoring is taking on a new ease: a little structure, an entirely different attitude.",
      cta: "Discover the new tailoring",
      destination: "tailoring"
    },
    {
      label: "COMMUNITY · LIVE VOTE",
      body: "What should we wear to work now? The community is voting on the looks that work.",
      cta: "Cast your vote",
      destination: "vote"
    },
    {
      label: "STYLE GUIDE · WIDE-LEG DENIM",
      body: "Wide-leg denim is made for in-between weather. Our new guide helps get the proportions right.",
      cta: "Find your combination",
      destination: "denimGuide"
    }
  ];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let messageIndex = 0;
  let messageVisible = true;
  let messageFocused = false;
  let pointerInsideMessage = false;
  let rotationTimer = null;
  let fadeTimer = null;
  let entranceDuration = 0;

  function clearRotationTimers() {
    window.clearTimeout(rotationTimer);
    window.clearTimeout(fadeTimer);
    rotationTimer = null;
    fadeTimer = null;
  }

  function canRotateMessages() {
    return !reduceMotion.matches &&
      messageVisible &&
      !messageFocused &&
      !pointerInsideMessage &&
      !app.inert &&
      document.visibilityState === "visible";
  }

  function renderEditorialMessage(index, animate = true) {
    const message = editorialMessages[index];
    const destination = editorialDestinations[message.destination];
    if (!destination ||
        (destination.section && !document.getElementById(destination.section)) ||
        (destination.overlay === "denim-guide" && !guideOverlay)) {
      throw new Error(`Missing Shopping destination for editorial message: ${message.destination}`);
    }

    messageLabel.textContent = message.label;
    messageBody.setAttribute("aria-label", message.body);
    messageCtaLabel.textContent = message.cta;
    if (destination.overlay) {
      delete messageCta.dataset.jump;
      delete messageCta.dataset.pageTarget;
      delete messageCta.dataset.storyTarget;
      messageCta.dataset.openDenimGuide = "true";
    } else {
      delete messageCta.dataset.openDenimGuide;
      messageCta.dataset.jump = destination.section;
      if (destination.page === undefined) {
        delete messageCta.dataset.pageTarget;
      } else {
        messageCta.dataset.pageTarget = String(destination.page);
      }
      if (destination.story === undefined) {
        delete messageCta.dataset.storyTarget;
      } else {
        messageCta.dataset.storyTarget = String(destination.story);
      }
    }
    editorialMessage.classList.remove("is-entering", "is-visible");

    if (animate && !reduceMotion.matches) {
      const characters = [...message.body];
      const stagger = 18;
      const labelDuration = 450;
      const characterDuration = 380;
      messageBody.replaceChildren(...characters.map((character, characterIndex) => {
        const span = document.createElement("span");
        span.textContent = character;
        span.style.setProperty("--message-delay", `${labelDuration + characterIndex * stagger}ms`);
        return span;
      }));
      const ctaDelay = labelDuration +
        Math.max(0, (characters.length - 1) * stagger) +
        characterDuration +
        120;
      messageCta.style.setProperty("--cta-delay", `${ctaDelay}ms`);
      entranceDuration = ctaDelay + 450;
      editorialMessage.classList.add("is-entering");
      window.requestAnimationFrame(() => {
        editorialMessage.classList.remove("is-fading");
        editorialMessage.classList.add("is-visible");
      });
      return;
    }

    messageBody.textContent = message.body;
    messageCta.style.removeProperty("--cta-delay");
    entranceDuration = 0;
    editorialMessage.classList.remove("is-fading");
  }

  function scheduleEditorialRotation(delay = entranceDuration + 7000) {
    clearRotationTimers();
    if (!canRotateMessages()) return;
    rotationTimer = window.setTimeout(() => {
      if (!canRotateMessages()) return;
      editorialMessage.classList.add("is-fading");
      fadeTimer = window.setTimeout(() => {
        if (!canRotateMessages()) return;
        messageIndex = (messageIndex + 1) % editorialMessages.length;
        renderEditorialMessage(messageIndex);
        scheduleEditorialRotation();
      }, 500);
    }, delay);
  }

  function updateEditorialRotation() {
    if (!canRotateMessages()) {
      clearRotationTimers();
      editorialMessage.classList.remove("is-fading");
      return;
    }
    scheduleEditorialRotation();
  }

  renderEditorialMessage(0);
  if ("IntersectionObserver" in window) {
    const messageObserver = new IntersectionObserver(([entry]) => {
      messageVisible = entry.isIntersecting && entry.intersectionRatio >= 0.2;
      updateEditorialRotation();
    }, { threshold: [0, 0.2] });
    messageObserver.observe(arrival);
  } else {
    updateEditorialRotation();
  }

  editorialMessage.addEventListener("pointerenter", () => {
    pointerInsideMessage = true;
    updateEditorialRotation();
  });
  editorialMessage.addEventListener("pointerleave", () => {
    pointerInsideMessage = false;
    updateEditorialRotation();
  });
  editorialMessage.addEventListener("focusin", () => {
    messageFocused = true;
    updateEditorialRotation();
  });
  editorialMessage.addEventListener("focusout", (event) => {
    messageFocused = editorialMessage.contains(event.relatedTarget);
    updateEditorialRotation();
  });
  document.addEventListener("visibilitychange", updateEditorialRotation);
  reduceMotion.addEventListener("change", () => {
    clearRotationTimers();
    if (reduceMotion.matches) {
      renderEditorialMessage(messageIndex, false);
      return;
    }
    renderEditorialMessage(messageIndex);
    updateEditorialRotation();
  });

  function jumpTo(id) {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const underSection = app.querySelector(".under-section");
  const underPages = app.querySelector(".under-pages");
  const underProgress = app.querySelectorAll(".under-progress [data-page-target]");
  const voteSection = app.querySelector(".vote-section");
  const dailyCovetView = voteSection.querySelector(".daily-covet-view");
  const voteProgress = voteSection.querySelectorAll("[data-vote-slide]");
  const storiesSection = app.querySelector("#stories");
  const storyRail = storiesSection.querySelector(".story-rail");
  const storyProgress = Array.from(storiesSection.querySelectorAll("[data-story-slide]"));
  let underPageIndex = 0;
  let voteSlideIndex = 0;
  let storyProgressFrame = 0;

  function setUnderPage(index) {
    underPageIndex = Math.max(0, Math.min(underPages.children.length - 1, index));
    Array.from(underPages.children).forEach((page, pageIndex) => {
      page.classList.toggle("is-active", pageIndex === underPageIndex);
      page.style.setProperty("--slide-offset", `${(pageIndex - underPageIndex) * 100}%`);
    });
    underProgress.forEach((button, pageIndex) => {
      const isActive = pageIndex === underPageIndex;
      button.classList.toggle("active", isActive);
      if (isActive) {
        button.setAttribute("aria-current", "step");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  }

  function showUnderPage(index) {
    jumpTo("under-300");
    setUnderPage(index);
  }

  function showStory(index) {
    storyRail.scrollTo({
      left: index * storyRail.clientWidth,
      behavior: "smooth"
    });
  }

  function updateStoryProgress() {
    if (!storyRail.clientWidth) return;
    const activeIndex = Math.round(storyRail.scrollLeft / storyRail.clientWidth);
    storyProgress.forEach((button, index) => {
      const isActive = index === activeIndex;
      button.classList.toggle("active", isActive);
      if (isActive) {
        button.setAttribute("aria-current", "step");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  }

  storyRail.addEventListener("scroll", () => {
    if (storyProgressFrame) return;
    storyProgressFrame = requestAnimationFrame(() => {
      storyProgressFrame = 0;
      updateStoryProgress();
    });
  }, { passive: true });
  window.addEventListener("resize", updateStoryProgress);

  function setVoteSlide(index) {
    voteSlideIndex = Math.max(0, Math.min(1, index));
    const showCovet = voteSlideIndex === 1;
    voteSection.classList.toggle("is-covet", showCovet);
    dailyCovetView.hidden = !showCovet;
    voteSection.dataset.activeSlide = String(voteSlideIndex);
    voteProgress.forEach((button, pageIndex) => {
      const isActive = pageIndex === voteSlideIndex;
      button.classList.toggle("active", isActive);
      if (isActive) {
        button.setAttribute("aria-current", "step");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  }

  function bindTapAdvance(root, getIndex, setIndex, pageCount) {
    root.addEventListener("click", (event) => {
      if (event.defaultPrevented ||
          event.target.closest("button, a, input, select, textarea, summary, [role='button'], [tabindex], [data-no-slide-nav], img:not(.vote-image)")) {
        return;
      }

      const bounds = root.getBoundingClientRect();
      const horizontalPosition = (event.clientX - bounds.left) / bounds.width;
      const currentIndex = getIndex();
      if (horizontalPosition < 0.35 && currentIndex > 0) {
        setIndex(currentIndex - 1);
      } else if (horizontalPosition > 0.65 && currentIndex < pageCount - 1) {
        setIndex(currentIndex + 1);
      }
    });
  }

  function configureFreeHorizontalScroll(selector) {
    app.querySelectorAll(selector).forEach((element) => {
      element.classList.add("free-horizontal-scroll");
      element.dataset.horizontalNavigation = "free";
    });
  }

  configureFreeHorizontalScroll(".editorial-carousel, .story-rail");
  updateStoryProgress();
  setUnderPage(0);
  bindTapAdvance(underSection, () => underPageIndex, setUnderPage, underPages.children.length);
  bindTapAdvance(voteSection, () => voteSlideIndex, setVoteSlide, 2);

  const editorOptions = Array.from(app.querySelectorAll(".editor-option"));
  const productColumns = Array.from(app.querySelectorAll(".product-columns .product-column"));
  const productTiles = Array.from(app.querySelectorAll(".product-columns .product-tile"));
  const productMoreCard = app.querySelector(".product-more-card");
  const editorialIntro = app.querySelector(".editorial-intro");
  const editorPhoto = editorialIntro.querySelector(".editor-photo");
  const editorByline = editorialIntro.querySelector(".editor-byline");
  const editorEdition = editorialIntro.querySelector(".editor-edition");
  const introTitle = editorialIntro.querySelector(".intro-title");
  const introDek = editorialIntro.querySelector(".intro-dek");
  const enterEdit = editorialIntro.querySelector(".enter-edit");
  const editorProfiles = [
    {
      name: "Sarah Mower",
      photo: "./public/shopping/sarah-mower.png",
      edition: "THE WINTER EDIT",
      source: "#ideas .product-columns .product-tile",
      pageTarget: 0
    },
    {
      name: "Chloe Malle",
      photo: "./public/shopping/chloe-malle.png",
      edition: "UNDER $300",
      source: ".under-edit-page .under-product-grid .product-tile",
      pageTarget: 0
    },
    {
      name: "Nicole Phelps",
      photo: "./public/shopping/nicole-phelps.png",
      edition: "WARDROBE ESSENTIALS",
      source: ".wardrobe-essentials .story-product-grid .product-tile",
      pageTarget: 3
    }
  ].map((profile) => {
    const sourceTiles = document.querySelectorAll(profile.source);
    if (!sourceTiles.length) {
      throw new Error(`Missing product curation for ${profile.name}`);
    }
    return {
      ...profile,
      products: Array.from(sourceTiles, (tile) => {
        const image = tile.querySelector("img");
        const saveCount = tile.querySelector(".save-count");
        if (!image) throw new Error(`Missing product image in ${profile.name} curation`);
        return {
          src: image.getAttribute("src"),
          alt: image.alt,
          label: tile.getAttribute("aria-label") || image.alt,
          saveCount: saveCount?.textContent.trim() || "",
          opensProduct: tile.hasAttribute("data-open-pdp")
        };
      })
    };
  });

  function selectEditor(index) {
    const profile = editorProfiles[index];
    if (!profile || profile.products.length > productTiles.length) {
      throw new Error(`Invalid editor selection: ${index}`);
    }

    editorOptions.forEach((option, optionIndex) => {
      option.setAttribute("aria-pressed", String(optionIndex === index));
    });

    productTiles.forEach((tile, tileIndex) => {
      const product = profile.products[tileIndex];
      tile.hidden = !product;
      if (!product) return;

      const image = tile.querySelector("img");
      image.src = product.src;
      image.alt = product.alt;
      tile.setAttribute("aria-label", product.label);
      tile.toggleAttribute("data-open-pdp", product.opensProduct);

      const saveCount = tile.querySelector(".save-count");
      if (saveCount) {
        saveCount.hidden = !product.saveCount;
        if (product.saveCount) {
          const countText = Array.from(saveCount.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
          if (countText) {
            countText.nodeValue = product.saveCount;
          } else {
            saveCount.append(document.createTextNode(product.saveCount));
          }
        }
      }
    });

    productColumns.forEach((column) => {
      column.hidden = !column.querySelector(".product-tile:not([hidden])");
    });
    productMoreCard.hidden = index !== 0;
    editorPhoto.src = profile.photo;
    editorPhoto.alt = profile.name;
    editorByline.textContent = `BY ${profile.name.toUpperCase()}`;
    editorEdition.textContent = profile.edition;
    introTitle.hidden = index !== 0;
    introDek.hidden = index !== 0;
    enterEdit.dataset.pageTarget = String(profile.pageTarget);
    editorialIntro.closest(".editorial-carousel").setAttribute(
      "aria-label",
      `${profile.name} — ${profile.edition}`
    );
  }

  editorOptions.forEach((option) => {
    option.addEventListener("click", () => {
      selectEditor(Number(option.dataset.editorIndex));
    });
  });

  selectEditor(0);

  function showVoteResults() {
    voteSection.querySelector("[data-vote-results]").hidden = false;
    voteSection.querySelector(".vote-story").classList.add("has-results");
  }

  function openDenimGuide(trigger) {
    guideReturnTrigger = trigger;
    guideScroll.scrollTop = 0;
    guideOverlay.hidden = false;
    guideOverlay.inert = false;
    app.inert = true;
    updateEditorialRotation();
    guideBack.focus();
  }

  function closeDenimGuide() {
    guideOverlay.hidden = true;
    guideOverlay.inert = false;
    app.inert = false;
    guideReturnTrigger?.focus({ preventScroll: true });
    updateEditorialRotation();
  }

  function openProduct(trigger) {
    const image = trigger.querySelector("img");
    if (!image) throw new Error("Product trigger is missing its image");

    const label = (trigger.getAttribute("aria-label") || image.alt).replace(/^View\s+/i, "").trim();
    if (!label) throw new Error("Product trigger is missing its label");

    const imageSource = image.currentSrc || image.src;
    const isJackieBag = imageSource === originalPdpImage;
    lastProductTrigger = trigger;
    productReturnOverlay = trigger.closest("#denim-guide-overlay");
    pdpDismissState = "idle";
    pdpTouchGesture = null;
    window.clearTimeout(pdpDismissTimer);
    pdp.classList.remove("is-dragging");
    pdp.style.removeProperty("--pdp-dismiss-offset");
    pdpHeroImage.src = imageSource;
    pdpHeroImage.alt = image.alt || label;
    pdpBrandName.textContent = isJackieBag ? "GUCCI" : (trigger.dataset.brand || "");
    pdpBrandName.hidden = !pdpBrandName.textContent;
    pdpProductTitle.textContent = isJackieBag ? originalPdpTitle : label;
    pdpDescription.hidden = !isJackieBag;
    pdpVogueKnows.hidden = !isJackieBag;
    pdpFeaturedIn.hidden = !isJackieBag;
    pdp.classList.toggle("pdp-generic-product", !isJackieBag);
    pdp.setAttribute("aria-label", `${label} product details`);
    pdp.hidden = false;
    app.inert = true;
    if (productReturnOverlay) productReturnOverlay.inert = true;
    pdpScroll.scrollTop = 0;
    updateEditorialRotation();
    backButton.focus();
  }

  function finishProductClose() {
    window.clearTimeout(pdpDismissTimer);
    pdpDismissTimer = 0;
    pdpDismissState = "idle";
    pdpTouchGesture = null;
    pdp.classList.remove("is-dragging");
    pdp.style.removeProperty("--pdp-dismiss-offset");
    pdp.hidden = true;
    if (productReturnOverlay) {
      productReturnOverlay.inert = false;
    } else {
      app.inert = false;
    }
    lastProductTrigger?.focus({ preventScroll: true });
    productReturnOverlay = null;
    updateEditorialRotation();
  }

  function closeProduct() {
    finishProductClose();
  }

  function resetPdpDismissOffset() {
    pdpDismissState = "returning";
    pdp.classList.remove("is-dragging");
    pdp.style.setProperty("--pdp-dismiss-offset", "0px");
    window.clearTimeout(pdpDismissTimer);
    pdpDismissTimer = window.setTimeout(() => {
      if (pdpDismissState !== "returning") return;
      pdpDismissState = "idle";
      pdp.style.removeProperty("--pdp-dismiss-offset");
      pdpDismissTimer = 0;
    }, 350);
  }

  function dismissProductFromScroll() {
    pdpDismissState = "closing";
    pdp.classList.remove("is-dragging");
    pdp.style.setProperty("--pdp-dismiss-offset", `-${window.innerHeight}px`);
    window.clearTimeout(pdpDismissTimer);
    pdpDismissTimer = window.setTimeout(() => {
      if (pdpDismissState === "closing") finishProductClose();
    }, 350);
  }

  pdp.addEventListener("transitionend", (event) => {
    if (event.target !== pdp || event.propertyName !== "transform") return;
    if (pdpDismissState === "closing") {
      finishProductClose();
    } else if (pdpDismissState === "returning") {
      window.clearTimeout(pdpDismissTimer);
      pdpDismissTimer = 0;
      pdpDismissState = "idle";
      pdp.style.removeProperty("--pdp-dismiss-offset");
    }
  });

  pdpScroll.addEventListener("touchstart", (event) => {
    if (pdp.hidden || pdpDismissState !== "idle" || event.touches.length !== 1) {
      pdpTouchGesture = null;
      return;
    }

    const touch = event.touches[0];
    const maxScrollTop = Math.max(0, pdpScroll.scrollHeight - pdpScroll.clientHeight);
    pdpTouchGesture = {
      startX: touch.clientX,
      startY: touch.clientY,
      availableScroll: Math.max(0, maxScrollTop - pdpScroll.scrollTop),
      distance: 0,
      active: false
    };
  }, { passive: true });

  pdpScroll.addEventListener("touchmove", (event) => {
    const gesture = pdpTouchGesture;
    if (!gesture || event.touches.length !== 1) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - gesture.startX;
    const deltaY = gesture.startY - touch.clientY;
    if (!gesture.active && Math.abs(deltaX) > Math.abs(deltaY)) {
      pdpTouchGesture = null;
      return;
    }

    const dismissDistance = Math.max(0, deltaY - gesture.availableScroll);
    if (!gesture.active && dismissDistance === 0) return;

    event.preventDefault();
    if (dismissDistance === 0) {
      pdpScroll.scrollTop = pdpScroll.scrollHeight;
      pdpTouchGesture = null;
      resetPdpDismissOffset();
      return;
    }

    if (!gesture.active) {
      gesture.active = true;
      pdpDismissState = "dragging";
      pdp.classList.add("is-dragging");
      pdpScroll.scrollTop = pdpScroll.scrollHeight;
    }

    gesture.distance = dismissDistance;
    pdp.style.setProperty("--pdp-dismiss-offset", `-${dismissDistance}px`);
  }, { passive: false });

  pdpScroll.addEventListener("touchend", () => {
    const gesture = pdpTouchGesture;
    pdpTouchGesture = null;
    if (!gesture?.active) return;

    const dismissThreshold = Math.max(180, window.innerHeight * 0.24);
    if (gesture.distance >= dismissThreshold) {
      dismissProductFromScroll();
    } else {
      resetPdpDismissOffset();
    }
  }, { passive: true });

  pdpScroll.addEventListener("touchcancel", () => {
    const wasDragging = pdpTouchGesture?.active;
    pdpTouchGesture = null;
    if (wasDragging) resetPdpDismissOffset();
  }, { passive: true });

  app.addEventListener("click", (event) => {
    const guideLink = event.target.closest("[data-open-denim-guide]");
    if (guideLink) {
      openDenimGuide(guideLink);
      return;
    }

    const exploreCategory = event.target.closest("[data-explore-category]");
    if (exploreCategory) {
      event.preventDefault();
      const destination = continueDestinations[exploreCategory.dataset.exploreCategory];
      if (!destination || !document.getElementById(destination.section)) {
        throw new Error(`Missing Continue Exploring destination: ${exploreCategory.dataset.exploreCategory}`);
      }
      showUnderPage(destination.page);
      return;
    }

    const voteSlide = event.target.closest("[data-vote-slide]");
    if (voteSlide) {
      setVoteSlide(Number(voteSlide.dataset.voteSlide));
      return;
    }

    const pageTarget = event.target.closest("[data-page-target]");
    if (pageTarget) {
      showUnderPage(Number(pageTarget.dataset.pageTarget));
      return;
    }

    const storySlide = event.target.closest("[data-story-slide]");
    if (storySlide) {
      showStory(Number(storySlide.dataset.storySlide));
      return;
    }

    const storyTarget = event.target.closest("[data-story-target]");
    if (storyTarget) {
      jumpTo("stories");
      showStory(Number(storyTarget.dataset.storyTarget));
      return;
    }

    const jump = event.target.closest("[data-jump]");
    if (jump) {
      jumpTo(jump.dataset.jump);
      return;
    }

    const product = event.target.closest("[data-open-pdp], .product-tile");
    if (product) openProduct(product);
  });

  guideBack.addEventListener("click", closeDenimGuide);
  guideOverlay.addEventListener("click", (event) => {
    const product = event.target.closest("[data-open-pdp]");
    if (product) openProduct(product);
  });

  guideOverlay.querySelectorAll("[data-denim-option]").forEach((button) => {
    button.addEventListener("click", () => {
      guideOverlay.querySelectorAll("[data-denim-option]").forEach((option) => {
        option.setAttribute("aria-pressed", String(option === button));
      });
    });
  });

  backButton.addEventListener("click", closeProduct);
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!pdp.hidden) {
      closeProduct();
    } else if (!guideOverlay.hidden) {
      closeDenimGuide();
    }
  });

  saveButton.addEventListener("click", () => {
    const isSaved = saveButton.getAttribute("aria-pressed") !== "true";
    saveButton.setAttribute("aria-pressed", String(isSaved));
    saveLabel.textContent = isSaved ? "SAVED" : "SAVE";
  });

  pdp.querySelectorAll("[data-style-preference]").forEach((button) => {
    button.addEventListener("click", () => {
      const preference = button.dataset.stylePreference;
      const statement = preference === "more" ? "MORE" : "FEWER";
      preferenceFeedback.querySelector("p").textContent =
        `GOT IT. ${statement} STYLES LIKE THIS WILL NOW BE SHOWN TO YOU.`;
      wardrobeActions.hidden = true;
      preferenceFeedback.hidden = false;
    });
  });

  pdp.querySelector("[data-undo-preference]").addEventListener("click", () => {
    preferenceFeedback.hidden = true;
    wardrobeActions.hidden = false;
  });

  app.querySelectorAll("[data-vote]").forEach((button) => {
    button.addEventListener("click", () => {
      app.querySelectorAll("[data-vote]").forEach((option) => {
        option.setAttribute("aria-pressed", String(option === button));
      });
      showVoteResults();
    });
  });

})();
