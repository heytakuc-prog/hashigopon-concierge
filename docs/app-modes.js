(() => {
  const FAVORITES_KEY = "hashigopon_favorites_v1";
  const IMPRESSIONS_KEY = "hashigopon_impressions_v1";
  const modeHome = document.querySelector("#modeHome");
  const questionArea = document.querySelector("#questionArea");
  const modeBackButton = document.querySelector("#modeBackButton");
  const favoriteSummary = document.querySelector("#favoriteSummary");
  const originalRenderStoreCard = renderStoreCard;
  let activeMode = "home";
  let affinityStep = 0;
  let affinityAnswers = [];
  let affinitySeenIds = [];

  const AFFINITY_QUESTIONS = [
    {
      text: "初めての店、ひとりでも入れる？",
      options: [
        ["わりと平気", ["solo_welcome", "first_visit", "counter"]],
        ["入りやすさは大事", ["casual", "first_visit", "pair_welcome"]]
      ]
    },
    {
      text: "店の人との距離感は？",
      axis: "social",
      options: [
        ["話したい", ["talk_owner", "homey", "new_encounter"], 5],
        ["自分の時間を楽しみたい", ["solo_time", "quiet_drink", "counter"], 1]
      ]
    },
    {
      text: "店の空気はどっちが落ち着く？",
      options: [
        ["静かで落ち着く", ["calm", "quiet_drink", "slow_talk"]],
        ["にぎやかで楽しい", ["lively", "group_fun", "party"]]
      ]
    },
    {
      text: "店選びは王道派？ 開拓派？",
      axis: "individuality",
      options: [
        ["安心できる王道", ["traditional", "casual", "first_visit"], 1],
        ["知らない店を開拓", ["hidden", "curious", "new_encounter"], 5]
      ]
    },
    {
      text: "一軒で過ごす時間は？",
      axis: "stay",
      options: [
        ["サクッと短め", ["quick_finish", "light_drink", "second_round_welcome"], 1],
        ["ゆっくり長め", ["slow_talk", "food_pairing", "full_meal"], 5]
      ]
    },
    {
      text: "店では何を主役にしたい？",
      axis: "purpose",
      options: [
        ["お酒と会話", ["light_drink", "talk_owner", "quiet_drink"], 5],
        ["料理もしっかり", ["full_meal", "food_pairing", "hungry"], 1]
      ]
    },
    {
      text: "店の専門性はどっちが好み？",
      axis: "specialty",
      options: [
        ["幅広く気軽に", ["casual", "first_visit", "group_welcome"], 1],
        ["専門店を深く楽しむ", ["curious", "food_pairing", "new_encounter"], 5]
      ]
    }
  ];

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  function favoriteIds() {
    return readJson(FAVORITES_KEY, []);
  }

  function isFavorite(shopId) {
    return favoriteIds().includes(shopId);
  }

  function toggleFavorite(shopId) {
    const ids = favoriteIds();
    const next = ids.includes(shopId) ? ids.filter(id => id !== shopId) : [...ids, shopId];
    writeJson(FAVORITES_KEY, next);
    refreshFavoriteButtons();
    renderFavoriteSummary();
    track("favorite", { shop: shopId, saved: next.includes(shopId), mode: activeMode });
    toast(next.includes(shopId) ? "気になる店に保存したぞ" : "保存から外したぞ");
  }

  function refreshFavoriteButtons() {
    document.querySelectorAll("[data-favorite-shop]").forEach(button => {
      const saved = isFavorite(button.dataset.favoriteShop);
      button.setAttribute("aria-pressed", String(saved));
      button.textContent = saved ? "♥ 気になる保存済み" : "♡ 気になる";
    });
  }

  function renderFavoriteSummary() {
    if (!favoriteSummary) return;
    const ids = favoriteIds();
    const shops = (state.shops || []).filter(shop => ids.includes(shop.id));
    if (!shops.length) {
      favoriteSummary.innerHTML = "<p>まだ保存した店はないぞ。店カードの「♡ 気になる」から残せる。</p>";
      return;
    }
    favoriteSummary.innerHTML = `
      <p><strong>${shops.length}軒</strong> 気になる店に保存中</p>
      <div class="favorite-chips">
        ${shops.map(shop => `<span>${escapeHtml(shop.name)}</span>`).join("")}
      </div>
    `;
  }

  renderStoreCard = function renderStoreCardWithFavorite(item, index) {
    const card = originalRenderStoreCard(item, index);
    const actions = card.querySelector(".card-actions");
    if (actions) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "favorite-button";
      button.dataset.favoriteShop = item.shop.id;
      button.setAttribute("aria-pressed", String(isFavorite(item.shop.id)));
      button.textContent = isFavorite(item.shop.id) ? "♥ 気になる保存済み" : "♡ 気になる";
      actions.prepend(button);
    }
    return card;
  };

  async function ensureShops() {
    if (!state.shops.length) state.shops = await loadShopData();
    renderFavoriteSummary();
  }

  function resetResultArea() {
    els.results.classList.remove("show");
    els.storeGrid.innerHTML = "";
    els.conversation.innerHTML = "";
    els.answers.innerHTML = "";
    els.refineArea.hidden = true;
  }

  function showModeHome() {
    activeMode = "home";
    resetResultArea();
    modeHome.hidden = false;
    questionArea.hidden = true;
    modeBackButton.hidden = true;
    setPonImage("normal");
    renderFavoriteSummary();
    modeHome.scrollIntoView({ behavior: "smooth", block: "start" });
    track("mode_home");
  }

  async function startNowMode() {
    activeMode = "now";
    modeHome.hidden = true;
    questionArea.hidden = false;
    modeBackButton.hidden = false;
    document.querySelector("#randomButton").textContent = "別の3軒を見る";
    document.querySelector("#retryButton").textContent = "もう一回やる";
    document.querySelector("#refineButton").hidden = false;
    await startApp();
    track("mode_start", { mode: activeMode });
  }

  function shopTags(shop) {
    return new Set([
      ...shop.peopleTags,
      ...shop.moodTags,
      ...shop.roundTags,
      ...shop.atmosphereTags,
      ...shop.welcomeTags,
      ...shop.drinkTags,
      ...shop.foodTags,
      ...shop.styleTags,
      ...shop.seatTags,
      ...shop.ownerCommentTags
    ]);
  }

  function profileEvidence(shop) {
    const directProfileCount = Object.values(shop.profileScores || {}).filter(value => Number(value) >= 1).length;
    if (shop.surveyConfirmed && directProfileCount === 5) {
      return {
        confidence: 0.94,
        compatibilityCap: 98,
        label: "店舗アンケート（5軸）＋公開情報"
      };
    }
    if (shop.surveyConfirmed) {
      return {
        confidence: 0.82,
        compatibilityCap: 96,
        label: "店舗アンケート＋公開情報"
      };
    }
    return {
      confidence: 0.60,
      compatibilityCap: 88,
      label: "公開情報から推定"
    };
  }

  function affinityScore(shop) {
    const tags = shopTags(shop);
    const evidence = profileEvidence(shop);
    let points = 0;
    let maximum = 0;
    const matched = [];
    affinityAnswers.forEach(answer => {
      const answerTags = answer.tags;
      maximum += 16;
      const hits = answerTags.filter(tag => tags.has(tag));
      if (hits.length) {
        points += Math.min(16, 10 + (hits.length - 1) * 3);
        matched.push(...hits);
      }
      const shopAxisScore = Number(shop.profileScores?.[answer.axis] || 0);
      if (answer.axis && answer.target && shopAxisScore >= 1 && shopAxisScore <= 5) {
        maximum += 8;
        points += Math.max(0, 1 - Math.abs(shopAxisScore - answer.target) / 4) * 8;
      }
    });
    const ratio = maximum ? points / maximum : 0;
    const rankingConfidence = 0.88 + evidence.confidence * 0.12;
    return {
      shop,
      status: getOpenStatus(shop, new Date()),
      score: ratio * 100 * rankingConfidence,
      compatibilityPercent: Math.round(Math.min(evidence.compatibilityCap, Math.max(50, 50 + ratio * 48))),
      profileEvidence: evidence,
      matchedTags: [...new Set(matched)]
    };
  }

  function addProfileEvidence(card, item) {
    const evidence = item.profileEvidence || profileEvidence(item.shop);
    const score = card.querySelector(".compatibility-score");
    if (!score) return;
    const note = document.createElement("p");
    note.className = "profile-evidence";
    note.textContent = `判定データ: ${evidence.label}（信頼度 ${Math.round(evidence.confidence * 100)}%）`;
    score.insertAdjacentElement("afterend", note);
  }

  function renderAffinityQuestion() {
    const question = AFFINITY_QUESTIONS[affinityStep];
    els.answers.innerHTML = "";
    els.progress.textContent = `${affinityStep} / ${AFFINITY_QUESTIONS.length}`;
    els.dots.innerHTML = AFFINITY_QUESTIONS.map((_, index) => `<span class="dot${index < affinityStep ? " active" : ""}"></span>`).join("");
    if (!question) {
      showAffinityResults(false);
      return;
    }
    addPonMessage(question.text, "normal");
    question.options.forEach(([label, tags, target]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "answer-button";
      button.textContent = label;
      button.addEventListener("click", () => {
        addUserMessage(label);
        affinityAnswers.push({ tags, axis: question.axis || "", target: target || 0 });
        affinityStep += 1;
        track("affinity_answer", { step: affinityStep, value: label });
        renderAffinityQuestion();
      });
      els.answers.append(button);
    });
  }

  async function startAffinityMode() {
    activeMode = "affinity";
    await ensureShops();
    resetResultArea();
    modeHome.hidden = true;
    questionArea.hidden = false;
    modeBackButton.hidden = false;
    affinityStep = 0;
    affinityAnswers = [];
    affinitySeenIds = [];
    state.answers = {};
    state.requestText = "";
    setPonImage("recommend");
    addPonMessage("営業時間は気にせず、おまえと店の性格だけを見る。7問でいくぞ。店舗の5軸回答も使う。", "recommend");
    renderAffinityQuestion();
    track("mode_start", { mode: activeMode });
  }

  function showAffinityResults(alternate) {
    const ranked = state.shops
      .filter(shop => !shop.eventZone || shop.eventZone === ACTIVE_EVENT_ZONE)
      .map(affinityScore)
      .sort((left, right) => right.score - left.score);
    let candidates = alternate ? ranked.filter(item => !affinitySeenIds.includes(item.shop.id)) : ranked;
    if (candidates.length < 3) {
      affinitySeenIds = [];
      candidates = ranked;
    }
    const picks = candidates.slice(0, 3);
    affinitySeenIds = [...new Set([...affinitySeenIds, ...picks.map(item => item.shop.id)])];
    questionArea.hidden = true;
    els.results.classList.add("show");
    els.diagnosisTitle.textContent = "性格が合いそうな3軒";
    els.diagnosisText.textContent = `本命は相性${picks[0]?.compatibilityPercent || "--"}％。営業時間ではなく、店との過ごし方や距離感から出した数字だぞ。`;
    els.storeGrid.innerHTML = "";
    picks.forEach((item, index) => {
      const card = renderStoreCard(item, index);
      const label = card.querySelector(".compatibility-score span");
      if (label) label.textContent = "あなたと店の相性";
      card.querySelector(".fit-label").textContent = ["本命マッチ", "相性マッチ", "意外なマッチ"][index];
      addProfileEvidence(card, item);
      els.storeGrid.append(card);
    });
    document.querySelector("#randomButton").textContent = "別の相性を見る";
    document.querySelector("#refineButton").hidden = true;
    track("results", { mode: activeMode, shops: picks.map(item => item.shop.id) });
    els.results.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function weightedDiscoveryPick(shops, count) {
    const impressions = readJson(IMPRESSIONS_KEY, {});
    const favorites = new Set(favoriteIds());
    const available = [...shops];
    const picks = [];
    while (available.length && picks.length < count) {
      const weights = available.map(shop => {
        const seen = impressions[shop.id] || { count: 0, lastSeen: 0 };
        const daysSince = seen.lastSeen ? (Date.now() - seen.lastSeen) / 86400000 : 30;
        return Math.max(1, 12 - seen.count * 3 + Math.min(8, daysSince) + (favorites.has(shop.id) ? -3 : 2));
      });
      let cursor = Math.random() * weights.reduce((sum, value) => sum + value, 0);
      let selectedIndex = 0;
      for (let index = 0; index < weights.length; index += 1) {
        cursor -= weights[index];
        if (cursor <= 0) {
          selectedIndex = index;
          break;
        }
      }
      picks.push(available.splice(selectedIndex, 1)[0]);
    }
    picks.forEach(shop => {
      const previous = impressions[shop.id] || { count: 0 };
      impressions[shop.id] = { count: previous.count + 1, lastSeen: Date.now() };
    });
    writeJson(IMPRESSIONS_KEY, impressions);
    return picks;
  }

  async function showDiscoveryResults() {
    activeMode = "discovery";
    await ensureShops();
    modeHome.hidden = true;
    questionArea.hidden = true;
    modeBackButton.hidden = false;
    const shops = state.shops.filter(shop => !shop.eventZone || shop.eventZone === ACTIVE_EVENT_ZONE);
    const picks = weightedDiscoveryPick(shops, 3).map(shop => ({
      shop,
      status: getOpenStatus(shop, new Date()),
      score: 0,
      compatibilityPercent: 0,
      matchedTags: fallbackTags(shop).slice(0, 3)
    }));
    els.results.classList.add("show");
    els.diagnosisTitle.textContent = "今日は、この3軒を紹介する";
    els.diagnosisText.textContent = "相性順じゃない。まだ見ていない店を優先して、松戸の店との新しい出会いを作ったぞ。";
    els.storeGrid.innerHTML = "";
    picks.forEach((item, index) => {
      const card = renderStoreCard(item, index);
      card.querySelector(".fit-label").textContent = ["今日の紹介", "新しい発見", "のぞいてみる"][index];
      const score = card.querySelector(".compatibility-score");
      if (score) score.innerHTML = "<span>相性判定なしの店舗紹介</span><strong>NEW</strong>";
      els.storeGrid.append(card);
    });
    document.querySelector("#randomButton").textContent = "別の店と出会う";
    document.querySelector("#refineButton").hidden = true;
    track("results", { mode: activeMode, shops: picks.map(item => item.shop.id) });
    els.results.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  modeHome?.addEventListener("click", event => {
    const button = event.target.closest("[data-mode]");
    if (!button) return;
    const mode = button.dataset.mode;
    if (mode === "now") startNowMode().catch(console.error);
    if (mode === "affinity") startAffinityMode().catch(console.error);
    if (mode === "discovery") showDiscoveryResults().catch(console.error);
  });

  document.addEventListener("click", event => {
    const favoriteButton = event.target.closest("[data-favorite-shop]");
    if (!favoriteButton) return;
    toggleFavorite(favoriteButton.dataset.favoriteShop);
  });

  document.querySelector("#randomButton")?.addEventListener("click", event => {
    if (activeMode === "now") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (activeMode === "affinity") showAffinityResults(true);
    if (activeMode === "discovery") showDiscoveryResults().catch(console.error);
  }, true);

  document.querySelector("#retryButton")?.addEventListener("click", event => {
    if (activeMode === "now") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (activeMode === "affinity") startAffinityMode().catch(console.error);
    if (activeMode === "discovery") showModeHome();
  }, true);

  modeBackButton?.addEventListener("click", showModeHome);
  ensureShops().catch(() => {});
  showModeHome();

  window.hashigoponModes = {
    showModeHome,
    startNowMode,
    startAffinityMode,
    showDiscoveryResults,
    affinityScore,
    weightedDiscoveryPick,
    profileEvidence,
    favoriteIds
  };
})();
