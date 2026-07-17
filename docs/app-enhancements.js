(() => {
  const EXTRA_REQUEST_KEYWORDS = [
    { words: ["クラフトビール", "クラフト", "地ビール", "ローカルビール", "カナダビール", "タップビール"], tags: ["craft_beer", "beer"] },
    { words: ["松戸ビール", "松戸のビール"], tags: ["local_beer", "craft_beer", "beer"] },
    { words: ["日本酒", "地酒"], tags: ["sake"] },
    { words: ["焼酎"], tags: ["shochu"] },
    { words: ["ワイン", "葡萄酒"], tags: ["wine"] },
    { words: ["カクテル"], tags: ["cocktail"] },
    { words: ["ウイスキー", "ハイボール"], tags: ["whisky", "highball"] },
    { words: ["サワー", "酎ハイ"], tags: ["sour"] },
    { words: ["焼き鳥", "焼鳥", "串焼き", "串もの"], tags: ["yakitori", "meat"] },
    { words: ["ジビエ", "鹿肉", "猪肉"], tags: ["game_meat", "meat"] },
    { words: ["肉料理", "お肉", "肉が食べたい"], tags: ["meat", "full_meal"] },
    { words: ["餃子", "ギョーザ"], tags: ["gyoza", "chinese"] },
    { words: ["中華", "中国料理"], tags: ["chinese", "full_meal"] },
    { words: ["ラーメン", "担々麺", "麺で締め", "麺類"], tags: ["noodles", "closing"] },
    { words: ["ピザ", "ピッツァ", "石窯"], tags: ["pizza", "italian"] },
    { words: ["パスタ", "イタリアン"], tags: ["pasta", "italian"] },
    { words: ["魚料理", "海鮮", "刺身", "魚が食べたい"], tags: ["seafood", "full_meal"] },
    { words: ["野菜", "有機野菜", "オーガニック"], tags: ["vegetables"] },
    { words: ["カレー"], tags: ["curry", "international"] },
    { words: ["異国料理", "多国籍", "世界の料理", "海外料理"], tags: ["international", "curious"] },
    { words: ["ハワイ", "ハワイアン"], tags: ["hawaiian"] },
    { words: ["アメリカン", "サンドイッチ"], tags: ["american", "sandwich"] },
    { words: ["ビストロ"], tags: ["bistro"] },
    { words: ["コーヒー", "珈琲", "カフェ"], tags: ["coffee"] },
    { words: ["デザート", "甘いもの", "スイーツ"], tags: ["dessert"] },
    { words: ["テラス", "外飲み", "外の席"], tags: ["open_air"] },
    { words: ["店主と話", "スタッフと話", "店員と話"], tags: ["talk_owner", "homey"] },
    { words: ["初めて", "入りやすい", "一見でも"], tags: ["first_visit", "casual"] },
    { words: ["穴場", "隠れ家"], tags: ["hidden"] },
    { words: ["静か", "落ち着いて", "ゆっくり話"], tags: ["calm", "quiet_drink", "slow_talk"] },
    { words: ["にぎやか", "賑やか", "ワイワイ", "盛り上がり"], tags: ["lively", "party", "group_fun"] }
  ];

  const GENERIC_REQUEST_WORDS = [
    "おすすめ", "お店", "店を", "店が", "ところ", "探して", "選んで", "行きたい", "ありますか",
    "あるかな", "飲みたい", "食べたい", "したい", "がいい", "感じ", "希望", "条件", "お願い"
  ];

  function normalizeSearchText(value) {
    return String(value || "")
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[ぁ-ゖ]/g, char => String.fromCharCode(char.charCodeAt(0) + 0x60))
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
    const ignored = new Set(["松戸", "松戸店", "店舗", "カフェ", "バー"]);
    return String(name || "")
      .split(/[\s・&＆/／()（）【】]+/)
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
      evidence = "店名";
    }

    const fields = [
      { label: "ジャンル", value: shop.genre, cap: 28 },
      { label: shop.surveyConfirmed ? "店舗アンケート" : "店舗紹介", value: shop.ownerComment, cap: 36 },
      { label: "店舗紹介", value: shop.publicSummary, cap: 32 },
      { label: "はしごポンの紹介", value: shop.ponComment, cap: 24 },
      { label: "エリア情報", value: `${shop.area || ""} ${shop.accessNote || ""}`, cap: 18 }
    ];

    let bestTextMatch = 0;
    fields.forEach(field => {
      const commonLength = longestCommonSubstringLength(request, normalizeSearchText(field.value));
      if (commonLength < 3) return;
      const fieldBonus = Math.min(field.cap, 6 + (commonLength - 3) * 5);
      if (fieldBonus > bestTextMatch) {
        bestTextMatch = fieldBonus;
        if (!evidence || evidence !== "店名") evidence = field.label;
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
    if (relatedTagHits.length && !evidence) evidence = "店舗情報";
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
      lead.push("クラフトビール取扱店として優先");
    }
    const requestMatch = shopRequestMatch(shop);
    if (requestMatch.bonus >= 8 && requestMatch.evidence) {
      lead.push(`${requestMatch.evidence}と追加条件が近い`);
    }
    const base = originalRecommendReason(shop, status, tags);
    return lead.length ? `${lead.join("。")}。${base}` : base;
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
    els.progress.textContent = "あと1つ（必須）";
    els.answers.innerHTML = `
      <div class="request-box required-refine-box">
        <label for="requiredRefineInput">候補が拮抗してる。あと一言だけ条件を教えて（必須）</label>
        <p>料理・お酒・店の雰囲気など、いちばん外せない条件を入れて。</p>
        <textarea id="requiredRefineInput" class="request-input" rows="3" maxlength="100" required
          placeholder="例：クラフトビール／ジビエ／静かに話せる店"></textarea>
        <button id="requiredRefineSubmit" class="answer-button primary" type="button">この条件でベスト3を出す</button>
      </div>
    `;

    const input = els.answers.querySelector("#requiredRefineInput");
    const button = els.answers.querySelector("#requiredRefineSubmit");
    input?.focus({ preventScroll: true });

    button?.addEventListener("click", async () => {
      const requestText = input?.value.trim() || "";
      if (!requestText) {
        toast("ここは必須。いちばん外せない条件を一言入れて。");
        input?.focus();
        return;
      }

      button.disabled = true;
      state.requestText = requestText;
      addUserMessage(requestText);
      track("required_refine", { text: requestText, tags: requestTags(requestText) });
      await ponSay("よし。その条件まで入れて、本当に相性がいいベスト3を出す。", "good");
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
    await ponSay(["候補がかなり拮抗してる。", "適当に3軒出すのは違うな。あと一言だけ条件を足して。"], "thinking");
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
      toast("条件を一言入れてくれ");
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
      <img src="${HASHIGOPON_IMAGES.good}" alt="反応するはしごポン">
      <p>なるほど。その条件も入れてみる。店舗の紹介やアンケートまで見て、選び直すぞ。</p>
    `;
    els.refineArea.prepend(reaction);

    await wait(900);
    state.currentPickIds = [];
    showResults(false);
  }, true);

  const optionalSurvey = document.querySelector("#optionalSurvey");
  const surveyThanks = document.querySelector("#surveyThanks");
  const surveySkipButton = document.querySelector("#surveySkipButton");
  const surveyStorageKey = "hashigopon_optional_survey";

  function loadSurveyAnswers() {
    try {
      return JSON.parse(sessionStorage.getItem(surveyStorageKey) || "{}");
    } catch {
      return {};
    }
  }

  const surveyAnswers = loadSurveyAnswers();

  function surveyQuestionElement(question) {
    return optionalSurvey?.querySelector(`[data-survey-question="${question}"]`) || null;
  }

  function renderSurveyAnswer(question, value) {
    const questionElement = surveyQuestionElement(question);
    if (!questionElement) return;
    questionElement.querySelectorAll(".survey-option").forEach(button => {
      const selected = button.dataset.surveyValue === value;
      button.setAttribute("aria-pressed", String(selected));
      button.disabled = true;
    });
  }

  function updateSurveyMessage() {
    const answeredCount = ["age_group", "gender"].filter(question => surveyAnswers[question]).length;
    if (surveySkipButton) surveySkipButton.hidden = answeredCount === 2;
    if (!surveyThanks) return;
    surveyThanks.textContent = answeredCount === 2
      ? "協力ありがと。次はおすすめをもっとマシにする。"
      : answeredCount === 1 ? "ありがとう。もう1問は答えても答えなくてもいいぞ。" : "";
  }

  function saveSurveyAnswer(question, value, sendLog = true) {
    if (!question || !value || surveyAnswers[question]) return;
    surveyAnswers[question] = value;
    try {
      sessionStorage.setItem(surveyStorageKey, JSON.stringify(surveyAnswers));
    } catch {}
    renderSurveyAnswer(question, value);
    if (sendLog) track("answer", { question, value });
    updateSurveyMessage();
  }

  optionalSurvey?.addEventListener("click", event => {
    const button = event.target.closest?.(".survey-option");
    if (!button) return;
    const question = button.closest("[data-survey-question]")?.dataset.surveyQuestion;
    saveSurveyAnswer(question, button.dataset.surveyValue);
  });

  surveySkipButton?.addEventListener("click", () => {
    saveSurveyAnswer("age_group", "回答しない");
    saveSurveyAnswer("gender", "回答しない");
  });

  Object.entries(surveyAnswers).forEach(([question, value]) => renderSurveyAnswer(question, value));
  updateSurveyMessage();

  let diagnosisSummaryLogged = false;

  function selectedAnswerLabel(question) {
    const selectedPayload = state.answers[question.id];
    if (!selectedPayload) return "";
    return question.options.find(([, payload]) => payload === selectedPayload)?.[0] || "";
  }

  window.addEventListener("hashigopon:event", event => {
    const detail = event.detail || {};
    if (detail.name === "start") {
      diagnosisSummaryLogged = false;
      return;
    }
    if (detail.name !== "results" || diagnosisSummaryLogged) return;

    diagnosisSummaryLogged = true;
    const answerPattern = QUESTIONS.map(selectedAnswerLabel).join("|||");
    track("diagnosis_summary", {
      question: "diagnosis_summary",
      value: answerPattern,
      shops: detail.shops || [],
      compatibility: detail.compatibility || [],
      tags: requestTags(state.requestText)
    });
  });

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

