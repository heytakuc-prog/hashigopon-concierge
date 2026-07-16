(() => {
  state.seenPickIds = [];

  const originalStartApp = startApp;
  startApp = async function startAppWithRotationReset() {
    state.seenPickIds = [];
    return originalStartApp();
  };

  const originalSelectRecommendations = selectRecommendations;
  selectRecommendations = function selectRecommendationsWithRotation(alternate = false) {
    if (!alternate) {
      const picks = originalSelectRecommendations(false);
      state.seenPickIds = [...new Set([...(state.seenPickIds || []), ...picks.map(item => item.shop.id)])];
      return picks;
    }

    let ranked = getScores();
    if (state.answers.people?.people === "large_group") {
      const groupReady = ranked.filter(item => item.shop.sizeTag !== "small_shop");
      if (groupReady.length >= 3) ranked = groupReady;
    }

    const currentIds = state.currentPickIds || [];
    const seenIds = state.seenPickIds || [];
    let candidates = ranked.filter(item => !currentIds.includes(item.shop.id) && !seenIds.includes(item.shop.id));

    if (candidates.length < 3) {
      candidates = ranked.filter(item => !currentIds.includes(item.shop.id));
      state.seenPickIds = [...currentIds];
    }
    if (candidates.length < 3) candidates = ranked;

    const picks = shuffle(candidates).slice(0, Math.min(3, candidates.length));
    picks.sort((a, b) => b.score - a.score);
    state.currentPickIds = picks.map(item => item.shop.id);
    state.seenPickIds = [...new Set([...state.seenPickIds, ...state.currentPickIds])];
    return picks;
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
    track("refine", { text: requestText });
    setPonImage("good");

    const reaction = document.createElement("div");
    reaction.className = "refine-reaction";
    reaction.setAttribute("role", "status");
    reaction.innerHTML = `
      <img src="${HASHIGOPON_IMAGES.good}" alt="反応するはしごポン">
      <p>なるほど。その条件も入れてみる。ちょっと待て、選び直すぞ。</p>
    `;
    els.refineArea.prepend(reaction);

    await wait(900);
    state.currentPickIds = [];
    showResults(false);
  }, true);
})();
