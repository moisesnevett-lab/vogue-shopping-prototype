(() => {
  const shoppingApp = document.querySelector("#shopping-app");
  const todayView = document.querySelector("#today-view");
  const collapsedStories = todayView.querySelector("[data-collapsed-stories]");
  const expandedStories = todayView.querySelector("[data-expanded-stories]");
  const toggleButton = todayView.querySelector("[data-today-toggle]");
  const toggleImage = toggleButton.querySelector("img");
  let expanded = new URLSearchParams(window.location.search).get("today") === "expanded";

  function setExpanded(expanded, updateUrl = true) {
    const scrollTop = todayView.scrollTop;
    collapsedStories.hidden = expanded;
    expandedStories.hidden = !expanded;
    toggleButton.setAttribute("aria-expanded", String(expanded));
    toggleImage.src = expanded
      ? "./ui%20elements/show%20less.png"
      : "./ui%20elements/EXPAND%20TOP%20STORIES.png";
    toggleImage.alt = expanded ? "Show less" : "Expand top stories";
    window.requestAnimationFrame(() => {
      todayView.scrollTop = scrollTop;
    });

    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", "today");
      if (expanded) {
        url.searchParams.set("today", "expanded");
      } else {
        url.searchParams.delete("today");
      }
      window.history.replaceState({}, "", url);
    }
    return expanded;
  }

  function setTab(tab, updateUrl = true) {
    const showToday = tab === "today";
    todayView.hidden = !showToday;
    todayView.setAttribute("aria-hidden", String(!showToday));
    shoppingApp.inert = showToday;

    if (updateUrl) {
      const url = new URL(window.location.href);
      if (showToday) {
        url.searchParams.set("tab", "today");
      } else {
        url.searchParams.delete("tab");
        url.searchParams.delete("today");
      }
      window.history.replaceState({}, "", url);
    }
  }

  setExpanded(expanded, false);
  setTab(new URLSearchParams(window.location.search).get("tab") === "today" ? "today" : "shopping", false);

  document.addEventListener("click", (event) => {
    const tabButton = event.target.closest("[data-app-view]");
    if (!tabButton) return;
    event.preventDefault();
    event.stopPropagation();
    setTab(tabButton.dataset.appView);
  }, true);

  toggleButton.addEventListener("click", () => {
    expanded = setExpanded(!expanded);
  });
})();
