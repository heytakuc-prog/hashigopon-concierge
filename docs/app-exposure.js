(() => {
  const HISTORY_KEY = "hashigopon_discovery_history_v2";
  const spotlight = document.querySelector("#discoverySpotlight");
  const spotlightCard = document.querySelector("#discoverySpotlightCard");

  function readHistory() {
    try {
      const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");
      return {
        recent: Array.isArray(value.recent) ? value.recent.slice(-100) : [],
        counts: value.counts && typeof value.counts === "object" ? value.counts : {}
      };
    } catch {
      return { recent: [], counts: {} };
    }
  }

  function saveHistory(history) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {}
  }

  function budgetCompatible(shop) {
    const budget = state.answers?.budget?.budget;
    if (!budget || budget === "no_limit") return true;
    if (budget === "low") return !shop.budgetMin || shop.budgetMin <= 2000;
    if (budget === "medium") return !shop.budgetMin || shop.budgetMin <= 4000;
    if (budget === "high") return !shop.budgetMin || shop.budgetMin <= 6500;
    return true;
  }

  function peopleCompatible(shop) {
    const people = state.answers?.people?.people;
    if (people === "large_group") {
      return shop.sizeTag !== "small_shop" || shop.welcomeTags.includes("large_group_welcome");
    }
    if (people === "solo") {
      const tags = new Set([...shop.peopleTags, ...shop.welcomeTags, ...shop.seatTags]);
      return tags.has("solo_welcome") || tags.has("counter") || shop.sizeTag !== "large_shop";
    }
    return true;
  }

  function weightedPick(items, history) {
    const recentThree = history.recent.slice(-3);
    let pool = items.filter(item => !recentThree.includes(item.shop.id));
    if (!pool.length) pool = items;
    const weights = pool.map(item => {
      const count = Number(history.counts[item.shop.id] || 0);
      const lastIndex = history.recent.lastIndexOf(item.shop.id);
      const ageBonus = lastIndex < 0 ? 4 : Math.min(3, (history.recent.length - lastIndex) / 8);
      return Math.max(0.25, 8 / (1 + count) + ageBonus);
    });
    let cursor = Math.random() * weights.reduce((sum, value) => sum + value, 0);
    for (let index = 0; index < pool.length; index += 1) {
      cursor -= weights[index];
      if (cursor <= 0) return pool[index];
    }
    return pool[pool.length - 1];
  }

  function candidates(topItems, rankedItems, mode) {
    const topIds = new Set(topItems.map(item => item.shop.id));
    let pool = rankedItems.filter(item => !topIds.has(item.shop.id))
      .filter(item => !item.shop.eventZone || item.shop.eventZone === ACTIVE_EVENT_ZONE)
      .filter(item => peopleCompatible(item.shop) && budgetCompatible(item.shop));
    if (mode === "now") {
      const open = pool.filter(item => item.status?.open);
      if (open.length) pool = open;
    }
    if (!pool.length) {
      pool = rankedItems.filter(item => !topIds.has(item.shop.id));
    }
    return pool;
  }

  function hideSpotlight() {
    if (spotlight) spotlight.hidden = true;
    if (spotlightCard) spotlightCard.innerHTML = "";
    if (window.hashigoponExposure) window.hashigoponExposure.currentDiscoveryShopId = "";
  }

  function showSpotlight(topItems, rankedItems, mode = "now") {
    if (!spotlight || !spotlightCard) return;
    const pool = candidates(topItems, rankedItems, mode);
    if (!pool.length) {
      hideSpotlight();
      return;
    }
    const history = readHistory();
    const selected = weightedPick(pool, history);
    const card = renderStoreCard(selected, 0);
    card.classList.add("discovery-card");
    const fit = card.querySelector(".fit-label");
    if (fit) fit.textContent = "新しい出会い";
    const heading = card.querySelector(".store-body h3");
    if (heading) heading.textContent = selected.shop.name;
    const score = card.querySelector(".compatibility-score");
    if (score) score.innerHTML = "<span>相性順位とは別枠の店舗紹介</span><strong>NEW</strong>";
    card.querySelectorAll("[data-shop-action]").forEach(link => {
      link.dataset.resultType = "discovery";
    });
    spotlightCard.innerHTML = "";
    spotlightCard.append(card);
    spotlight.hidden = false;
    if (window.hashigoponExposure) window.hashigoponExposure.currentDiscoveryShopId = selected.shop.id;
    history.recent.push(selected.shop.id);
    history.recent = history.recent.slice(-100);
    history.counts[selected.shop.id] = Number(history.counts[selected.shop.id] || 0) + 1;
    saveHistory(history);
    track("discovery_impression", {
      shop: selected.shop.id,
      result_type: "discovery",
      mode
    });
  }

  const originalShowResults = showResults;
  showResults = function showResultsWithDiscovery(alternate = false) {
    const result = originalShowResults(alternate);
    const topIds = new Set(state.currentPickIds || []);
    const topItems = (state.lastScores || []).filter(item => topIds.has(item.shop.id))
      .sort((left, right) => right.score - left.score);
    showSpotlight(topItems, state.lastScores || [], "now");
    return result;
  };

  window.addEventListener("hashigopon:event", event => {
    if (["start", "mode_home"].includes(event.detail?.name)) hideSpotlight();
  });

  window.hashigoponExposure = {
    showSpotlight,
    hideSpotlight,
    candidates,
    readHistory,
    currentDiscoveryShopId: ""
  };
})();
