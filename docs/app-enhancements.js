(() => {
  const EXTRA_REQUEST_KEYWORDS = [
    { words: ["繧ｯ繝ｩ繝輔ヨ繝薙・繝ｫ", "繧ｯ繝ｩ繝輔ヨ", "蝨ｰ繝薙・繝ｫ", "繝ｭ繝ｼ繧ｫ繝ｫ繝薙・繝ｫ", "繧ｫ繝翫ム繝薙・繝ｫ", "繧ｿ繝・・繝薙・繝ｫ"], tags: ["craft_beer", "beer"] },
    { words: ["譚ｾ謌ｸ繝薙・繝ｫ", "譚ｾ謌ｸ縺ｮ繝薙・繝ｫ"], tags: ["local_beer", "craft_beer", "beer"] },
    { words: ["譌･譛ｬ驟・, "蝨ｰ驟・], tags: ["sake"] },
    { words: ["辟ｼ驟・], tags: ["shochu"] },
    { words: ["繝ｯ繧､繝ｳ", "闡｡關・・"], tags: ["wine"] },
    { words: ["繧ｫ繧ｯ繝・Ν"], tags: ["cocktail"] },
    { words: ["繧ｦ繧､繧ｹ繧ｭ繝ｼ", "繝上う繝懊・繝ｫ"], tags: ["whisky", "highball"] },
    { words: ["繧ｵ繝ｯ繝ｼ", "驟弱ワ繧､"], tags: ["sour"] },
    { words: ["辟ｼ縺埼ｳ･", "辟ｼ魑･", "荳ｲ辟ｼ縺・, "荳ｲ繧ゅ・"], tags: ["yakitori", "meat"] },
    { words: ["繧ｸ繝薙お", "鮖ｿ閧・, "迪ｪ閧・], tags: ["game_meat", "meat"] },
    { words: ["閧画侭逅・, "縺願ｉ", "閧峨′鬟溘∋縺溘＞"], tags: ["meat", "full_meal"] },
    { words: ["鬢・ｭ・, "繧ｮ繝ｧ繝ｼ繧ｶ"], tags: ["gyoza", "chinese"] },
    { words: ["荳ｭ闖ｯ", "荳ｭ蝗ｽ譁咏炊"], tags: ["chinese", "full_meal"] },
    { words: ["繝ｩ繝ｼ繝｡繝ｳ", "諡・・ｺｺ", "鮗ｺ縺ｧ邱繧・, "鮗ｺ鬘・], tags: ["noodles", "closing"] },
    { words: ["繝斐じ", "繝斐ャ繝・ぃ", "遏ｳ遯ｯ"], tags: ["pizza", "italian"] },
    { words: ["繝代せ繧ｿ", "繧､繧ｿ繝ｪ繧｢繝ｳ"], tags: ["pasta", "italian"] },
    { words: ["鬲壽侭逅・, "豬ｷ魄ｮ", "蛻ｺ霄ｫ", "鬲壹′鬟溘∋縺溘＞"], tags: ["seafood", "full_meal"] },
    { words: ["驥手除", "譛画ｩ滄㍽闖・, "繧ｪ繝ｼ繧ｬ繝九ャ繧ｯ"], tags: ["vegetables"] },
    { words: ["繧ｫ繝ｬ繝ｼ"], tags: ["curry", "international"] },
    { words: ["逡ｰ蝗ｽ譁咏炊", "螟壼嵜邀・, "荳也阜縺ｮ譁咏炊", "豬ｷ螟匁侭逅・], tags: ["international", "curious"] },
    { words: ["繝上Ρ繧､", "繝上Ρ繧､繧｢繝ｳ"], tags: ["hawaiian"] },
    { words: ["繧｢繝｡繝ｪ繧ｫ繝ｳ", "繧ｵ繝ｳ繝峨う繝・メ"], tags: ["american", "sandwich"] },
    { words: ["繝薙せ繝医Ο"], tags: ["bistro"] },
    { words: ["繧ｳ繝ｼ繝偵・", "迴育栖", "繧ｫ繝輔ぉ"], tags: ["coffee"] },
    { words: ["繝・じ繝ｼ繝・, "逕倥＞繧ゅ・", "繧ｹ繧､繝ｼ繝・], tags: ["dessert"] },
    { words: ["繝・Λ繧ｹ", "螟夜｣ｲ縺ｿ", "螟悶・蟶ｭ"], tags: ["open_air"] },
    { words: ["蠎嶺ｸｻ縺ｨ隧ｱ", "繧ｹ繧ｿ繝・ヵ縺ｨ隧ｱ", "蠎怜藤縺ｨ隧ｱ"], tags: ["talk_owner", "homey"] },
    { words: ["蛻昴ａ縺ｦ", "蜈･繧翫ｄ縺吶＞", "荳隕九〒繧・], tags: ["first_visit", "casual"] },
    { words: ["遨ｴ蝣ｴ", "髫繧悟ｮｶ"], tags: ["hidden"] },
    { words: ["髱吶°", "關ｽ縺｡逹縺・※", "繧・▲縺上ｊ隧ｱ"], tags: ["calm", "quiet_drink", "slow_talk"] },
    { words: ["縺ｫ縺弱ｄ縺・, "雉代ｄ縺・, "繝ｯ繧､繝ｯ繧､", "逶帙ｊ荳翫′繧・], tags: ["lively", "party", "group_fun"] }
  ];

  const GENERIC_REQUEST_WORDS = [
    "縺翫☆縺吶ａ", "縺雁ｺ・, "蠎励ｒ", "蠎励′", "縺ｨ縺薙ｍ", "謗｢縺励※", "驕ｸ繧薙〒", "陦後″縺溘＞", "縺ゅｊ縺ｾ縺吶°",
    "縺ゅｋ縺九↑", "鬟ｲ縺ｿ縺溘＞", "鬟溘∋縺溘＞", "縺励◆縺・, "縺後＞縺・, "諢溘§", "蟶梧悍", "譚｡莉ｶ", "縺企｡倥＞"
  ];

  function normalizeSearchText(value) {
    return String(value || "")
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[縺・繧望/g, char => String.fromCharCode(char.charCodeAt(0) + 0x60))
      .replace(/[^\p{L}\p{N}]/gu, "");
  }

  function usefulRequestText(value) {
    let normalized = normalizeSearchText(value);
    GENERIC_REQUEST_WORDS.forEach(word => {
      normalized = normalized.replaceAll(normalizeSearchText(word), "");
    });
    return normalized;
  }

  function longestCommonSubstringLength(left, right) {
    if (!left || !right) return 0;
    const previous = new Uint16Array(right.length + 1);
    let maximum = 0;
    for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
      const current = new Uint16Array(right.length + 1);
      for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
        if (left[leftIndex - 1] === right[rightIndex - 1]) {
          current[rightIndex] = previous[rightIndex - 1] + 1;
          maximum = Math.max(maximum, current[rightIndex]);
        }
      }
      previous.set(current);
    }
    return maximum;
  }

  function allShopTags(shop) {
    return [...new Set([
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
    ])];
  }

  const originalRequestTags = requestTags;
  requestTags = function requestTagsWithStoreVocabulary(text) {
    const source = normalizeSearchText(text);
    const tags = new Set(originalRequestTags(text));
    if (!source) return [];

    EXTRA_REQUEST_KEYWORDS.forEach(item => {
      if (item.words.some(word => source.includes(normalizeSearchText(word)))) {
        item.tags.forEach(tag => tags.add(tag));
      }
    });

    state.shops.flatMap(allShopTags).forEach(tag => {
      const label = normalizeSearchText(tagLabel(tag));
      if (label.length >= 2 && source.includes(label)) tags.add(tag);
    });

    return [...tags];
  };

  function nameTokens(name) {
    const ignored = new Set(["譚ｾ謌ｸ", "譚ｾ謌ｸ蠎・, "蠎苓・", "繧ｫ繝輔ぉ", "繝舌・"]);
    return String(name || "")
      .split(/[\s繝ｻ&・・・・)・茨ｼ峨舌曽+/)
      .map(normalizeSearchText)
      .filter(token => token.length >= 3 && !ignored.has(token));
  }

  function shopRequestMatch(shop) {
    const request = usefulRequestText(state.requestText);
    if (request.length < 2) return { bonus: 0, tags: [], evidence: "" };

    let bonus = 0;
    let evidence = "";
    const matchedTags = [];
    const rawRequest = normalizeSearchText(state.requestText);
    const fullName = normalizeSearchText(shop.name);
    const directNameMatch = fullName.length >= 3 && rawRequest.includes(fullName);
    const tokenNameMatch = nameTokens(shop.name).some(token => rawRequest.includes(token));

    if (directNameMatch || tokenNameMatch) {
      bonus += 44;
      evidence = "蠎怜錐";
    }

    const fields = [
      { label: "繧ｸ繝｣繝ｳ繝ｫ", value: shop.genre, cap: 28 },
      { label: shop.surveyConfirmed ? "蠎苓・繧｢繝ｳ繧ｱ繝ｼ繝・ : "蠎苓・邏ｹ莉・, value: shop.ownerComment, cap: 36 },
      { label: "蠎苓・邏ｹ莉・, value: shop.publicSummary, cap: 32 },
      { label: "縺ｯ縺励＃繝昴Φ縺ｮ邏ｹ莉・, value: shop.ponComment, cap: 24 },
      { label: "繧ｨ繝ｪ繧｢諠・ｱ", value: `${shop.area || ""} ${shop.accessNote || ""}`, cap: 18 }
    ];

    let bestTextMatch = 0;
    fields.forEach(field => {
      const commonLength = longestCommonSubstringLength(request, normalizeSearchText(field.value));
      if (commonLength < 3) return;
      const fieldBonus = Math.min(field.cap, 6 + (commonLength - 3) * 5);
      if (fieldBonus > bestTextMatch) {
        bestTextMatch = fieldBonus;
        if (!evidence || evidence !== "蠎怜錐") evidence = field.label;
      }
    });
    bonus += bestTextMatch;

    const shopTags = allShopTags(shop);
    allShopTags(shop).forEach(tag => {
      const label = normalizeSearchText(tagLabel(tag));
      if (label.length >= 2 && rawRequest.includes(label)) matchedTags.push(tag);
    });
    const relatedTagHits = requestTags(state.requestText).filter(tag => shopTags.includes(tag));
    matchedTags.push(...relatedTagHits);
    if (relatedTagHits.length && !evidence) evidence = "蠎苓・諠・ｱ";
    bonus += Math.min(42, [...new Set(matchedTags)].length * 9);

    return { bonus, tags: [...new Set(matchedTags)], evidence };
  }

  function craftBeerRequested() {
    return state.answers.preference?.preference === "craft_beer"
      || requestTags(state.requestText).includes("craft_beer");
  }

  function shopHasCraftBeer(shop) {
    return shop.drinkTags.includes("craft_beer");
  }

  const originalScoreShop = scoreShop;
  scoreShop = function scoreShopWithTextAndCraftPriority(shop, status) {
    const result = originalScoreShop(shop, status);
    const requestMatch = shopRequestMatch(shop);
    let score = result.score + requestMatch.bonus;
    let percentAdjustment = Math.min(6, Math.floor(requestMatch.bonus / 8));
    const matchedTags = new Set([...result.matchedTags, ...requestMatch.tags]);

    if (craftBeerRequested()) {
      if (shopHasCraftBeer(shop)) {
        score += 42;
        percentAdjustment += 6;
        matchedTags.add("craft_beer");
        if (shop.drinkTags.includes("local_beer")) {
          score += 7;
          matchedTags.add("local_beer");
        }
      } else {
        score -= 24;
        percentAdjustment -= 6;
      }
    }

    return {
      ...result,
      score,
      compatibilityPercent: Math.min(98, Math.max(52, result.compatibilityPercent + percentAdjustment)),
      matchedTags: [...matchedTags]
    };
  };

  const originalRecommendReason = recommendReason;
  recommendReason = function recommendReasonWithEvidence(shop, status, tags) {
    const lead = [];
    if (craftBeerRequested() && shopHasCraftBeer(shop)) {
      lead.push("繧ｯ繝ｩ繝輔ヨ繝薙・繝ｫ蜿匁桶蠎励→縺励※蜆ｪ蜈・);
    }
    const requestMatch = shopRequestMatch(shop);
    if (requestMatch.bonus >= 8 && requestMatch.evidence) {
      lead.push(`${requestMatch.evidence}縺ｨ霑ｽ蜉譚｡莉ｶ縺瑚ｿ代＞`);
    }
    const base = originalRecommendReason(shop, status, tags);
    return lead.length ? `${lead.join("縲・)}縲・{base}` : base;
  };

  state.seenPickIds = [];

  const originalStartApp = startApp;
  startApp = async function startAppWithRotationReset() {
    state.seenPickIds = [];
    return originalStartApp();
  };

  function rememberPicks(picks) {
    state.currentPickIds = picks.map(item => item.shop.id);
    state.seenPickIds = [...new Set([...(state.seenPickIds || []), ...state.currentPickIds])];
    return picks;
  }

  function chooseFromRanked(candidates, count = 3) {
    if (candidates.length <= count) return [...candidates];
    const window = candidates.slice(0, Math.min(6, candidates.length));
    return shuffle(window).slice(0, count).sort((left, right) => right.score - left.score);
  }

  function rankedForBestThree() {
    let ranked = getScores();
    const openNow = ranked.filter(item => item.status.open);
    if (openNow.length >= 3) ranked = openNow;

    if (state.answers.people?.people === "large_group") {
      const groupReady = ranked.filter(item => item.shop.sizeTag !== "small_shop");
      if (groupReady.length >= 3) ranked = groupReady;
    }

    return ranked;
  }

  function recommendationNeedsMoreDetail(ranked) {
    if ((state.requestText || "").trim() || ranked.length <= 3) return false;

    const third = ranked[2];
    const fourth = ranked[3];
    if (!third || !fourth) return false;

    const preference = state.answers.preference?.preference;
    const broadPreference = !preference || ["any", "anything", "either"].includes(preference);
    const boundaryGap = third.score - fourth.score;
    return boundaryGap < (broadPreference ? 12 : 7);
  }

  function renderRequiredRefine() {
    els.progress.textContent = "縺ゅ→1縺､・亥ｿ・茨ｼ・;
    els.answers.innerHTML = `
      <div class="request-box required-refine-box">
        <label for="requiredRefineInput">蛟呵｣懊′諡ｮ謚励＠縺ｦ繧九ゅ≠縺ｨ荳險縺縺第擅莉ｶ繧呈蕗縺医※・亥ｿ・茨ｼ・/label>
        <p>譁咏炊繝ｻ縺企・繝ｻ蠎励・髮ｰ蝗ｲ豌励↑縺ｩ縲√＞縺｡縺ｰ繧灘､悶○縺ｪ縺・擅莉ｶ繧貞・繧後※縲・/p>
        <textarea id="requiredRefineInput" class="request-input" rows="3" maxlength="100" required
          placeholder="萓具ｼ壹け繝ｩ繝輔ヨ繝薙・繝ｫ・上ず繝薙お・城撕縺九↓隧ｱ縺帙ｋ蠎・></textarea>
        <button id="requiredRefineSubmit" class="answer-button primary" type="button">縺薙・譚｡莉ｶ縺ｧ繝吶せ繝・繧貞・縺・/button>
      </div>
    `;

    const input = els.answers.querySelector("#requiredRefineInput");
    const button = els.answers.querySelector("#requiredRefineSubmit");
    input?.focus({ preventScroll: true });

    button?.addEventListener("click", async () => {
      const requestText = input?.value.trim() || "";
      if (!requestText) {
        toast("縺薙％縺ｯ蠢・医ゅ＞縺｡縺ｰ繧灘､悶○縺ｪ縺・擅莉ｶ繧剃ｸ險蜈･繧後※縲・);
        input?.focus();
        return;
      }

      button.disabled = true;
      state.requestText = requestText;
      addUserMessage(requestText);
      track("required_refine", { text: requestText, tags: requestTags(requestText) });
      await ponSay("繧医＠縲ゅ◎縺ｮ譚｡莉ｶ縺ｾ縺ｧ蜈･繧後※縲∵悽蠖薙↓逶ｸ諤ｧ縺後＞縺・・繧ｹ繝・繧貞・縺吶・, "good");
      els.answers.innerHTML = "";
      showResults(false);
    });
  }

  const originalShowThinkingAndResults = showThinkingAndResults;
  showThinkingAndResults = async function showThinkingAndResultsWithRequiredRefine() {
    const ranked = rankedForBestThree();
    if (!recommendationNeedsMoreDetail(ranked)) {
      return originalShowThinkingAndResults();
    }

    els.answers.innerHTML = "";
    els.thinking.classList.add("show");
    setPonImage("thinking");
    await wait(1100);
    els.thinking.classList.remove("show");
    await ponSay(["蛟呵｣懊′縺九↑繧頑彊謚励＠縺ｦ繧九・, "驕ｩ蠖薙↓3霆貞・縺吶・縺ｯ驕輔≧縺ｪ縲ゅ≠縺ｨ荳險縺縺第擅莉ｶ繧定ｶｳ縺励※縲・], "thinking");
    renderRequiredRefine();
  };

  selectRecommendations = function selectRecommendationsWithPriorityRotation(alternate = false) {
    let ranked = alternate ? getScores() : rankedForBestThree();
    if (state.answers.people?.people === "large_group") {
      const groupReady = ranked.filter(item => item.shop.sizeTag !== "small_shop");
      if (groupReady.length >= 3) ranked = groupReady;
    }

    if (!alternate) {
      return rememberPicks(ranked.slice(0, 3));
    }

    const currentIds = state.currentPickIds || [];
    const seenIds = state.seenPickIds || [];
    let candidates = ranked.filter(item => !currentIds.includes(item.shop.id) && !seenIds.includes(item.shop.id));

    if (candidates.length > 0 && candidates.length < 3) {
      const mandatoryIds = new Set(candidates.map(item => item.shop.id));
      const fillers = ranked.filter(item => !currentIds.includes(item.shop.id) && !mandatoryIds.has(item.shop.id));
      const picks = [...candidates, ...fillers.slice(0, 3 - candidates.length)];
      return rememberPicks(picks.sort((left, right) => right.score - left.score));
    }
    if (!candidates.length) {
      candidates = ranked.filter(item => !currentIds.includes(item.shop.id));
      state.seenPickIds = [...currentIds];
    }
    if (candidates.length < 3) candidates = ranked;

    let picks = [];
    if (craftBeerRequested()) {
      const craftCandidates = candidates.filter(item => shopHasCraftBeer(item.shop));
      picks = chooseFromRanked(craftCandidates, Math.min(3, craftCandidates.length));
      if (picks.length < 3) {
        const pickedIds = new Set(picks.map(item => item.shop.id));
        const others = candidates.filter(item => !pickedIds.has(item.shop.id) && !shopHasCraftBeer(item.shop));
        picks.push(...chooseFromRanked(others, 3 - picks.length));
      }
    } else {
      picks = chooseFromRanked(candidates, Math.min(3, candidates.length));
    }
    return rememberPicks(picks.sort((left, right) => right.score - left.score));
  };

  document.addEventListener("click", async event => {
    const submitButton = event.target.closest?.("#refineSubmit");
    if (!submitButton) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const input = els.refineArea.querySelector("#refineInput");
    const requestText = input?.value.trim() || "";
    if (!requestText) {
      toast("譚｡莉ｶ繧剃ｸ險蜈･繧後※縺上ｌ");
      return;
    }

    submitButton.disabled = true;
    state.requestText = requestText;
    addUserMessage(requestText);
    track("refine", { text: requestText, tags: requestTags(requestText) });
    setPonImage("good");

    const reaction = document.createElement("div");
    reaction.className = "refine-reaction";
    reaction.setAttribute("role", "status");
    reaction.innerHTML = `
      <img src="${HASHIGOPON_IMAGES.good}" alt="蜿榊ｿ懊☆繧九・縺励＃繝昴Φ">
      <p>縺ｪ繧九⊇縺ｩ縲ゅ◎縺ｮ譚｡莉ｶ繧ょ・繧後※縺ｿ繧九ょｺ苓・縺ｮ邏ｹ莉九ｄ繧｢繝ｳ繧ｱ繝ｼ繝医∪縺ｧ隕九※縲・∈縺ｳ逶ｴ縺吶◇縲・/p>
    `;
    els.refineArea.prepend(reaction);

    await wait(900);
    state.currentPickIds = [];
    showResults(false);
  }, true);

  window.hashigoponEnhancements = {
    normalizeSearchText,
    requestTags: text => requestTags(text),
    shopRequestMatch,
    craftBeerRequested,
    shopHasCraftBeer,
    rankedForBestThree,
    recommendationNeedsMoreDetail
  };
})();

