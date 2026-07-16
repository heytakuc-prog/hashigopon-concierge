const HASHIGOPON_IMAGES = {
  normal: "./assets/hashigopon-normal.png",
  good: "./assets/hashigopon-good.png",
  surprise: "./assets/hashigopon-surprise.png",
  thinking: "./assets/hashigopon-tired.png",
  recommend: "./assets/hashigopon-recommend.png",
  bad: "./assets/hashigopon-bad.png",
  tsukkomi: "./assets/hashigopon-bad.png",
  tired: "./assets/hashigopon-tired.png",
  satisfied: "./assets/hashigopon-satisfied.png"
};

const SHOP_CSV_URL = "./shop-data.csv";
const ACTIVE_EVENT_ZONE = document.documentElement.dataset.eventZone || "matsudo_station";
const MAX_QUESTIONS = 8;

const state = {
  shops: [],
  answers: {},
  answeredQuestionIds: [],
  requestText: "",
  lastScores: [],
  currentPickIds: []
};

const REQUEST_KEYWORDS = [
  { words: ["静か", "落ち着", "ゆっくり", "話したい", "会話"], tags: ["calm", "quiet_drink", "slow_talk"] },
  { words: ["にぎやか", "盛り上", "わいわい", "楽しい", "テンション"], tags: ["lively", "party", "group_fun"] },
  { words: ["おしゃれ", "雰囲気", "デート", "いい感じ"], tags: ["stylish", "romantic", "pair_welcome"] },
  { words: ["一人", "ひとり", "カウンター"], tags: ["solo", "solo_welcome", "counter"] },
  { words: ["大人数", "みんな", "グループ", "団体"], tags: ["group_welcome", "large_group_welcome", "table"] },
  { words: ["お腹", "腹", "ご飯", "食べ", "しっかり"], tags: ["hungry", "full_meal"] },
  { words: ["軽く", "一杯", "サクッ", "つまみ"], tags: ["light_drink", "snacks"] },
  { words: ["締め", "〆", "ラーメン", "麺"], tags: ["closing", "noodles"] },
  { words: ["ビール", "クラフト"], tags: ["beer", "craft_beer"] },
  { words: ["日本酒", "焼酎"], tags: ["sake", "shochu"] },
  { words: ["店主", "スタッフ", "話せる", "会える"], tags: ["talk_owner", "homey"] },
  { words: ["知らない", "初めて", "開拓", "穴場"], tags: ["first_visit", "hidden"] }
];

const els = {
  ponImage: document.querySelector("#ponImage"),
  profile: document.querySelector("#profile"),
  conversation: document.querySelector("#conversation"),
  answers: document.querySelector("#answers"),
  progress: document.querySelector("#progress"),
  dots: document.querySelector("#dots"),
  typing: document.querySelector("#typing"),
  thinking: document.querySelector("#thinking"),
  results: document.querySelector("#results"),
  diagnosisImage: document.querySelector("#diagnosisImage"),
  diagnosisTitle: document.querySelector("#diagnosisTitle"),
  diagnosisText: document.querySelector("#diagnosisText"),
  storeGrid: document.querySelector("#storeGrid"),
  feedbackImage: document.querySelector("#feedbackImage"),
  refineButton: document.querySelector("#refineButton"),
  refineArea: document.querySelector("#refineArea"),
  toast: document.querySelector("#toast")
};

const QUESTIONS = [
  {
    id: "mood",
    text: "で、今どんな気分？ 正直に言えよ。",
    options: [
      ["かなり酔ってる", { safeExit: true, mood: "too_drunk", tags: [] }, "tsukkomi", ["もう家に帰れ！", "店を探す前に水を飲め。今日は無理するな。"]],
      ["まだまだ飲める", { mood: "more", tags: ["second_round", "light_drink"] }, "good", ["元気だな。", "その自信、あとで後悔するなよ。"]],
      ["盛り上がってる", { mood: "party", tags: ["party", "lively", "group_fun", "group_welcome"] }, "good", ["そのテンションなら静かな店は無理だな。", "ノリのいい店を探す。店の迷惑はかけるなよ。"]],
      ["落ち着いて飲みたい", { mood: "calm", tags: ["calm", "quiet_drink", "slow_talk"] }, "normal", ["やっと大人になったか。", "今日は騒がず、話しやすい店にする。"]],
      ["いいムードになりたい", { mood: "romantic", tags: ["romantic", "stylish", "pair_welcome"] }, "bad", ["へえ。そういう夜か。", "邪魔されにくそうな店を探してやるよ。"]],
      ["腹が減った", { mood: "hungry", tags: ["hungry", "full_meal"] }, "good", ["酒より先に飯だな。", "ちゃんと食える店を強めに見る。"]],
      ["もう一軒だけ", { mood: "second_round", tags: ["second_round", "light_drink", "quick_finish", "second_round_welcome"] }, "bad", ["その“一軒だけ”は信用してない。", "まあ、軽く寄れる店を見てやる。"]]
    ]
  },
  {
    id: "people",
    text: "で、何人？",
    options: [
      ["1人", { people: "solo", tags: ["solo", "solo_welcome", "counter", "solo_time"] }, "normal", ["ひとりか。俺もいつも一人酒だぜ。", "気楽に入れる店を見ておく。"]],
      ["2人", { people: "pair", tags: ["pair", "pair_welcome", "slow_talk"] }, "bad", ["2人？ へえ。", "詳しくは聞かないでおく。空気は読んでやるよ。"]],
      ["3〜4人", { people: "small_group", tags: ["small_group", "small_group_welcome", "group_welcome"] }, "good", ["ちょうどいい人数じゃん。", "店も選びやすい。"]],
      ["5人以上", { people: "large_group", tags: ["large_group", "large_group_welcome", "group_welcome", "table"] }, "surprise", ["人数多いな。先に言えよ。", "席のある店を強めに探す。"]]
    ]
  },
  {
    id: "round",
    text: "今、何軒目？ ここはごまかすなよ。",
    options: [
      ["これから1軒目", { round: "first", tags: ["first_round", "full_meal"] }, "good", ["まだ真っ白な状態か。", "最初からちゃんと楽しめる店を見る。"]],
      ["2軒目", { round: "second", tags: ["second_round", "second_round_welcome", "light_drink"] }, "bad", ["はいはい、エンジンかかってるね。", "二軒目歓迎の店を強めに見る。"]],
      ["3軒目以降", { round: "late", tags: ["third_round", "late_round_welcome", "closing", "quick_finish"] }, "surprise", ["まだ行くの？ 元気だな。", "締めや遅めでも寄りやすい店を見る。無理はするなよ。"]],
      ["もう覚えてない", { safeExit: true, round: "unknown", tags: [] }, "tsukkomi", ["じゃあ店を探してる場合じゃない。", "水を飲んで帰れ。今日は終了。"]]
    ]
  },
  {
    id: "budget",
    text: "予算はどのくらい？",
    options: [
      ["1,500円くらいまで", { budget: "low", tags: ["budget_low"] }, "normal", ["堅実だな。", "ちゃんと財布を見てるじゃん。"]],
      ["3,000円くらい", { budget: "medium", tags: ["budget_medium"] }, "good", ["まあ、そのくらいが現実的。", "候補も多そうだ。"]],
      ["5,000円くらい", { budget: "high", tags: ["budget_high"] }, "good", ["今日はちょっと本気じゃん。", "いい店も混ぜて見る。"]],
      ["今日は気にしない", { budget: "no_limit", tags: [] }, "bad", ["強気だな。", "明日の自分とは相談した？"]]
    ]
  },
  {
    id: "atmosphere",
    text: "どんな雰囲気の店がいい？",
    options: [
      ["にぎやか", { atmosphere: "lively", tags: ["lively", "group_fun"] }, "good", ["その調子なら静かすぎる店は違うな。", "にぎやか寄りで見る。"]],
      ["落ち着いている", { atmosphere: "calm", tags: ["calm", "quiet_drink", "slow_talk"] }, "normal", ["しっとり寄りね。", "会話しやすさを重視する。"]],
      ["おしゃれ・いいムード", { atmosphere: "stylish", tags: ["stylish", "romantic"] }, "bad", ["見た目も気分も大事、と。", "ちょっと洒落た店を見る。"]],
      ["昔ながら・アットホーム", { atmosphere: "homey", tags: ["traditional", "homey"] }, "normal", ["渋くて距離の近い店ね。", "昔ながらの空気を探す。"]],
      ["初めてでも入りやすい", { atmosphere: "first_visit", tags: ["first_visit", "casual"] }, "good", ["初見の扉はちょっと重いからな。", "入りやすさを優先する。"]],
      ["店主やスタッフと話しやすい", { atmosphere: "talk_owner", tags: ["talk_owner", "homey"] }, "satisfied", ["店の人と話したいんだな。", "距離の近そうな店を見ておく。"]]
    ]
  },
  {
    id: "foodDrink",
    text: "食べたい？ 飲みたい？",
    options: [
      ["とにかく飲みたい", { purpose: "drink", tags: ["light_drink"] }, "good", ["飲み中心だな。", "ただし水もたまに入れろよ。"]],
      ["ご飯もしっかり", { purpose: "food", tags: ["full_meal"] }, "good", ["ちゃんと食べるのは正解。", "食事が強い店で見る。"]],
      ["軽くつまみながら", { purpose: "snack", tags: ["light_drink", "snacks"] }, "normal", ["二軒目っぽくていい。", "つまみのある店を上げる。"]],
      ["締めを食べたい", { purpose: "closing", tags: ["closing", "noodles"] }, "satisfied", ["締めまで行く気だな。", "炭水化物の気配を探す。"]],
      ["どっちも大事", { purpose: "both", tags: ["full_meal", "light_drink"] }, "bad", ["欲張りだな。", "まあ、そのくらいが楽しい。"]]
    ]
  },
  {
    id: "preference",
    text: "で、何が気になる？ 一番近いやつを選べ。",
    options: [
      ["クラフトビール", { preference: "craft_beer", tags: ["craft_beer", "beer", "local_beer"] }, "good", ["そこは外せない、と。", "ビールに強い店を上げる。"]],
      ["ワイン・カクテル", { preference: "wine_cocktail", tags: ["wine", "cocktail"] }, "bad", ["ちょっと洒落たいんだな。", "酒と雰囲気、両方見る。"]],
      ["日本酒・ウイスキー", { preference: "sake_whisky", tags: ["sake", "whisky", "shochu"] }, "normal", ["じっくり飲む方ね。", "その辺に強い店を探す。"]],
      ["肉・串焼き", { preference: "meat", tags: ["meat", "yakitori", "game_meat"] }, "good", ["わかりやすくて助かる。", "肉の気配が濃い店を見る。"]],
      ["ピザ・パスタ", { preference: "italian", tags: ["pizza", "pasta", "italian"] }, "satisfied", ["みんなで囲むなら強いな。", "イタリアン寄りを見ておく。"]],
      ["中華・餃子・麺", { preference: "chinese", tags: ["chinese", "gyoza", "noodles"] }, "good", ["腹が決まってるじゃん。", "中華と締めの候補を上げる。"]],
      ["魚・野菜・軽いもの", { preference: "light_food", tags: ["seafood", "vegetables", "snacks"] }, "normal", ["重すぎない方がいい、と。", "つまみや料理の相性を見る。"]],
      ["なんでもいい", { preference: "any", tags: [] }, "tired", ["一番困る答えだな。", "まあ、店側との相性で決めてやる。"]]
    ]
  },
  {
    id: "distance",
    text: "最後。どこまで行ける？",
    options: [
      ["駅から近い方がいい", { distance: "near", allZones: false, tags: [] }, "normal", ["歩きたくない顔してるな。", "松戸駅の近場を優先する。"]],
      ["10分くらいなら歩く", { distance: "walk", allZones: false, tags: [] }, "good", ["そのくらい動けるなら十分。", "松戸駅周辺を広めに見る。"]],
      ["遠くても良い店なら行く", { distance: "explore", allZones: true, tags: ["new_encounter", "first_visit"] }, "surprise", ["お、行動力あるじゃん。", "矢切まで候補を広げる。遠いって文句はなしな。"]]
    ]
  }
];

function setPonImage(type = "normal") {
  const resolvedType = HASHIGOPON_IMAGES[type] ? type : "normal";
  els.ponImage.src = HASHIGOPON_IMAGES[resolvedType];
  els.ponImage.dataset.expression = resolvedType;
  els.ponImage.classList.remove("is-animating");
  void els.ponImage.offsetWidth;
  els.ponImage.classList.add("is-animating");
}

function wait(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

function showTyping(show) {
  els.typing.classList.toggle("show", show);
}

function scrollConversation() {
  const lastMessage = els.conversation.lastElementChild;
  lastMessage?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function addPonMessage(text, image = "normal") {
  const row = document.createElement("div");
  row.className = "pon-message";
  row.innerHTML = `
    <img class="pon-face" src="${HASHIGOPON_IMAGES[image] || HASHIGOPON_IMAGES.normal}" alt="はしごポン">
    <div class="pon-bubble">${escapeHtml(text)}</div>
  `;
  els.conversation.append(row);
  scrollConversation();
}

function addUserMessage(text) {
  const row = document.createElement("div");
  row.className = "user-message";
  row.innerHTML = `<div class="user-bubble">${escapeHtml(text)}</div>`;
  els.conversation.append(row);
  scrollConversation();
}

async function ponSay(lines, image = "normal") {
  const list = Array.isArray(lines) ? lines : [lines];
  setPonImage(image);
  for (const line of list) {
    showTyping(true);
    await wait(260);
    showTyping(false);
    addPonMessage(line, image);
    await wait(90);
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some(value => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some(value => value.trim() !== "")) rows.push(row);
  const headers = rows.shift().map(header => header.trim());
  return rows.map(values => Object.fromEntries(headers.map((header, index) => [header, (values[index] || "").trim()])));
}

async function loadShopData() {
  const response = await fetch(SHOP_CSV_URL, { cache: "no-store" });
  if (!response.ok) throw new Error("店舗CSVを読み込めませんでした");
  const rows = parseCsv(await response.text()).map(normalizeShop);
  const eventShops = rows.filter(shop => !shop.eventZone || shop.eventZone === ACTIVE_EVENT_ZONE);
  if (!eventShops.length) throw new Error(`対象エリア ${ACTIVE_EVENT_ZONE} の店舗がありません`);
  return rows;
}

function normalizeShop(row) {
  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const hours = Object.fromEntries(days.map(day => [day, {
    open: row[`${day}_open`],
    close: row[`${day}_close`]
  }]));

  return {
    id: row.shop_id,
    name: row.name,
    genre: row.genre,
    budgetMin: Number(row.budget_min || 0),
    budgetMax: Number(row.budget_max || 0),
    peopleTags: splitTags(row.people_tags),
    moodTags: splitTags(row.mood_tags),
    roundTags: splitTags(row.round_tags),
    atmosphereTags: splitTags(row.atmosphere_tags),
    welcomeTags: splitTags(row.welcome_tags),
    drinkTags: splitTags(row.drink_tags),
    foodTags: splitTags(row.food_tags),
    styleTags: splitTags(row.style_tags),
    seatTags: splitTags(row.seat_tags),
    sizeTag: row.size_tag,
    ownerComment: row.owner_comment || row.public_summary,
    publicSummary: row.public_summary,
    ponComment: row.pon_comment,
    ownerCommentTags: splitTags(row.owner_comment_tags),
    hours,
    imageUrl: row.image_url,
    mapUrl: row.map_url,
    instagramUrl: row.instagram_url,
    officialUrl: row.official_url,
    reservationUrl: row.reservation_url,
    eventBenefit: row.event_benefit || "イベント特典は店舗で確認",
    colorA: row.color_a || "#283650",
    colorB: row.color_b || "#cc3f49",
    eventZone: row.event_zone,
    area: row.area,
    walkMinutes: Number(row.walk_minutes || 0),
    accessNote: row.access_note,
    surveyConfirmed: String(row.survey_confirmed).toLowerCase() === "true",
    dataStatus: row.data_status,
    hoursStatus: row.hours_status,
    hoursText: row.hours_text,
    dataSource: String(row.survey_confirmed).toLowerCase() === "true" ? "survey" : "public"
  };
}

function splitTags(value) {
  return String(value || "").split(",").map(tag => tag.trim()).filter(Boolean);
}

function currentQuestion() {
  return QUESTIONS[state.answeredQuestionIds.length] || null;
}

function renderDots() {
  els.dots.innerHTML = "";
  for (let index = 0; index < MAX_QUESTIONS; index += 1) {
    const dot = document.createElement("span");
    dot.className = `dot${index < state.answeredQuestionIds.length ? " active" : ""}`;
    els.dots.append(dot);
  }
  const answered = Math.min(state.answeredQuestionIds.length, MAX_QUESTIONS);
  els.progress.textContent = `${answered} / ${MAX_QUESTIONS}`;
}

async function renderQuestion() {
  renderDots();
  const question = currentQuestion();
  if (!question) {
    await showThinkingAndResults();
    return;
  }

  await ponSay(question.text, "normal");
  els.answers.innerHTML = "";
  question.options.forEach(([label], index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-button";
    button.textContent = label;
    button.addEventListener("click", () => chooseAnswer(question, index));
    els.answers.append(button);
  });
}

async function chooseAnswer(question, optionIndex) {
  const [label, payload, image, reactions] = question.options[optionIndex];
  addUserMessage(label);
  state.answers[question.id] = payload;
  if (!state.answeredQuestionIds.includes(question.id)) state.answeredQuestionIds.push(question.id);
  track("answer", { question: question.id, value: label });

  els.answers.innerHTML = "";
  renderDots();
  await ponSay(reactions, image);
  if (payload.safeExit) {
    renderSafetyExit();
    return;
  }
  await renderQuestion();
}

function renderSafetyExit() {
  els.progress.textContent = "安全優先";
  els.answers.innerHTML = `
    <div class="safety-panel">
      <strong>今日はここで終了。</strong>
      <p>水分をとって、座って休んでから安全に帰ろう。ひとりで動けないときは、近くの人やスタッフに声をかけてください。</p>
      <a href="https://www.google.com/maps/search/?api=1&query=%E6%9D%BE%E6%88%B8%E9%A7%85" target="_blank" rel="noreferrer">松戸駅を地図で見る</a>
      <button type="button" class="answer-button" id="safeRetry">最初からやり直す</button>
    </div>
  `;
  els.answers.querySelector("#safeRetry").addEventListener("click", startAppSafely);
  track("safety_exit");
}

function allAnswerTags() {
  return [
    ...Object.values(state.answers).flatMap(answer => answer.tags || []),
    ...requestTags(state.requestText)
  ];
}

function requestTags(text) {
  const source = String(text || "").toLowerCase();
  if (!source) return [];
  const tags = [];
  REQUEST_KEYWORDS.forEach(item => {
    if (item.words.some(word => source.includes(word.toLowerCase()))) tags.push(...item.tags);
  });
  return [...new Set(tags)];
}

function getScores() {
  const now = new Date();
  const allowAllZones = Boolean(state.answers.distance?.allZones);
  const candidates = allowAllZones
    ? state.shops
    : state.shops.filter(shop => !shop.eventZone || shop.eventZone === ACTIVE_EVENT_ZONE);
  const scores = candidates.map(shop => {
    const status = getOpenStatus(shop, now);
    return { shop, status, ...scoreShop(shop, status) };
  }).sort((a, b) => b.score - a.score);
  state.lastScores = scores;
  return scores;
}

function scoreShop(shop, status) {
  let score = 0;
  const matched = [];
  const answerGroups = [
    [state.answers.people?.tags || [], [...shop.peopleTags, ...shop.welcomeTags, ...shop.seatTags], 24],
    [state.answers.atmosphere?.tags || [], [...shop.atmosphereTags, ...shop.welcomeTags, ...shop.styleTags], 20],
    [state.answers.foodDrink?.tags || [], [...shop.foodTags, ...shop.welcomeTags, ...shop.styleTags], 18],
    [state.answers.mood?.tags || [], [...shop.moodTags, ...shop.roundTags, ...shop.welcomeTags], 16],
    [state.answers.round?.tags || [], [...shop.roundTags, ...shop.welcomeTags, ...shop.styleTags], 16],
    [state.answers.preference?.tags || [], [...shop.drinkTags, ...shop.foodTags, ...shop.styleTags], 22]
  ];

  answerGroups.forEach(([answerTags, shopTags, weight]) => {
    const hits = answerTags.filter(tag => shopTags.includes(tag));
    if (hits.length) {
      score += weight;
      matched.push(...hits);
    }
  });

  const allTags = allAnswerTags();
  const welcomeHits = [...new Set(allTags.filter(tag => shop.welcomeTags.includes(tag) || shop.ownerCommentTags.includes(tag)))];
  score += welcomeHits.length * (shop.surveyConfirmed ? 6 : 3);
  matched.push(...welcomeHits);

  const people = state.answers.people?.people;
  if (people === "large_group" && (shop.sizeTag === "large_shop" || shop.welcomeTags.includes("large_group_welcome"))) score += 8;
  if (people === "solo" && (shop.seatTags.includes("counter") || shop.welcomeTags.includes("solo_welcome"))) score += 6;

  if (status.open) score += 10;
  if (status.state === "soon") score -= 12;
  if (shop.hoursStatus === "needs_confirmation") score -= 5;

  const budget = state.answers.budget?.budget;
  if (budget === "low" && shop.budgetMin <= 1800) score += 12;
  if (budget === "medium" && shop.budgetMin <= 3000 && shop.budgetMax <= 4500) score += 12;
  if (budget === "high" && shop.budgetMax >= 4000) score += 12;
  if (budget === "no_limit") score += 12;

  const distance = state.answers.distance?.distance;
  if (distance === "near") {
    if (shop.walkMinutes > 0 && shop.walkMinutes <= 3) score += 16;
    else if (shop.walkMinutes > 0 && shop.walkMinutes <= 5) score += 9;
    else if (shop.walkMinutes > 5) score -= 7;
  }
  if (distance === "walk" && shop.eventZone === ACTIVE_EVENT_ZONE) {
    score += shop.walkMinutes > 0 && shop.walkMinutes <= 10 ? 10 : 4;
  }
  if (distance === "explore") {
    score += shop.eventZone && shop.eventZone !== ACTIVE_EVENT_ZONE ? 14 : 2;
  }

  return { score, matchedTags: [...new Set(matched)] };
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function selectRecommendations(alternate = false) {
  const allRanked = getScores();
  let ranked = allRanked.filter(item => item.status.open || item.shop.hoursStatus === "needs_confirmation");
  if (state.answers.people?.people === "large_group") {
    const groupReady = ranked.filter(item => item.shop.sizeTag !== "small_shop");
    if (groupReady.length >= 3) ranked = groupReady;
  }
  if (!ranked.length) return [];
  const pool = ranked.slice(0, Math.min(5, ranked.length));
  let picks;
  if (alternate) {
    let candidates = pool.filter(item => !state.currentPickIds.includes(item.shop.id));
    if (candidates.length < 3) candidates = pool;
    picks = shuffle(candidates).slice(0, Math.min(3, candidates.length));
  } else {
    picks = [pool[0], ...shuffle(pool.slice(1)).slice(0, Math.min(2, pool.length - 1))];
  }
  picks.sort((a, b) => b.score - a.score);
  state.currentPickIds = picks.map(item => item.shop.id);
  return picks;
}

function dayKey(date) {
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][date.getDay()];
}

function previousDay(date) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - 1);
  return copy;
}

function timeToMinutes(value) {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function openWindow(hours) {
  const open = timeToMinutes(hours?.open);
  let close = timeToMinutes(hours?.close);
  if (open == null || close == null) return null;
  if (close <= open) close += 1440;
  return { open, close, display: `${hours.open}-${hours.close}` };
}

function getOpenStatus(shop, date) {
  const now = date.getHours() * 60 + date.getMinutes();
  const previous = openWindow(shop.hours[dayKey(previousDay(date))]);
  if (previous && previous.close > 1440) {
    const previousNow = now + 1440;
    if (previousNow >= previous.open && previousNow <= previous.close) {
      return openStatus(previous.close - previousNow, `前日 ${previous.display}`);
    }
  }

  const today = openWindow(shop.hours[dayKey(date)]);
  if (!today) return { open: false, state: "holiday", label: "本日休み", detail: "本日の営業時間は未設定" };
  if (now >= today.open && now <= today.close) return openStatus(today.close - now, `本日 ${today.display}`);
  if (now < today.open) return { open: false, state: "before", label: "営業時間前", detail: `本日 ${today.display}` };
  return { open: false, state: "closed", label: "営業終了", detail: `本日 ${today.display}` };
}

function openStatus(untilClose, detail) {
  if (untilClose <= 60) return { open: true, state: "soon", label: "まもなく閉店", detail };
  return { open: true, state: "open", label: "営業中", detail };
}

async function showThinkingAndResults() {
  els.answers.innerHTML = "";
  els.thinking.classList.add("show");
  els.thinking.textContent = ["条件多いな。今まとめてる。", "ちょっと待て。ちゃんと考えてる。", "急かすな。店を選んでる。"][Math.floor(Math.random() * 3)];
  setPonImage("thinking");
  await wait(1350);
  els.thinking.classList.remove("show");
  showResults();
}

function showResults(alternate = false) {
  const picks = selectRecommendations(alternate);
  setPonImage("recommend");
  els.diagnosisImage.src = HASHIGOPON_IMAGES.recommend;
  els.results.classList.add("show");
  els.diagnosisTitle.textContent = diagnosisTitle();
  els.diagnosisText.textContent = picks.length
    ? `はい、選んだ。この${picks.length}軒。今の気分と営業時間を見て選んだぞ。`
    : "今営業中の候補が見つからなかった。営業時間を確認して、無理せず帰れ。";
  els.storeGrid.innerHTML = "";
  picks.forEach((item, index) => els.storeGrid.append(renderStoreCard(item, index)));
  els.refineArea.hidden = true;
  track("results", { shops: picks.map(item => item.shop.id) });
  els.results.scrollIntoView({ behavior: "smooth", block: "start" });
}

function diagnosisTitle() {
  const mood = state.answers.mood?.mood;
  if (mood === "hungry") return "今日は食欲が主役";
  if (mood === "calm") return "静かに飲みたい大人モード";
  if (mood === "romantic") return "はいはい、いいムードね";
  if (mood === "party") return "まだ夜は終われないタイプ";
  return "今のあんたには、この3軒";
}

function renderStoreCard(item, index) {
  const { shop, status, matchedTags } = item;
  const card = document.createElement("article");
  card.className = "store-card";
  const tags = matchedTags.length ? matchedTags.slice(0, 3) : fallbackTags(shop).slice(0, 3);
  const imageStyle = shop.imageUrl
    ? `background-image: linear-gradient(rgba(0,0,0,.16), rgba(0,0,0,.22)), url('${escapeAttribute(shop.imageUrl)}')`
    : `background-color: ${safeColor(shop.colorA, "#283650")}`;
  const mapAction = validExternalUrl(shop.mapUrl, "map")
    ? `<a href="${escapeAttribute(shop.mapUrl)}" target="_blank" rel="noreferrer" data-shop-action="map" data-shop-id="${escapeAttribute(shop.id)}">地図を見る</a>`
    : `<span class="action-disabled">地図準備中</span>`;
  const instagramAction = validExternalUrl(shop.instagramUrl, "instagram")
    ? `<a class="instagram" href="${escapeAttribute(shop.instagramUrl)}" target="_blank" rel="noreferrer" data-shop-action="instagram" data-shop-id="${escapeAttribute(shop.id)}">Instagram</a>`
    : "";
  const officialAction = validHttpUrl(shop.officialUrl)
    ? `<a href="${escapeAttribute(shop.officialUrl)}" target="_blank" rel="noreferrer" data-shop-action="official" data-shop-id="${escapeAttribute(shop.id)}">公式情報</a>`
    : "";
  const reservationAction = validHttpUrl(shop.reservationUrl)
    ? `<a class="reservation" href="${escapeAttribute(shop.reservationUrl)}" target="_blank" rel="noreferrer" data-shop-action="reservation" data-shop-id="${escapeAttribute(shop.id)}">予約</a>`
    : "";
  const benefit = shop.eventBenefit && shop.eventBenefit !== "未確認"
    ? `<span>特典: ${escapeHtml(shop.eventBenefit)}</span>`
    : "";

  card.innerHTML = `
    <div class="store-photo" style="${imageStyle}">
      <span class="genre">${escapeHtml(shop.genre)}</span>
      <span class="fit-label">${fitLabel(index)}</span>
    </div>
    <div class="store-body">
      <h3>${index + 1}. ${escapeHtml(shop.name)}</h3>
      ${shop.ponComment ? `<p class="pon-comment">${escapeHtml(shop.ponComment)}</p>` : ""}
      <span class="recommend-type">${escapeHtml(recommendType(shop, status))}</span>
      <p class="reason">${escapeHtml(recommendReason(shop, status, tags))}</p>
      ${shop.ownerComment ? `<p class="owner-comment"><strong>${escapeHtml(sourceLabel(shop.dataSource))}</strong>${escapeHtml(shop.ownerComment)}</p>` : ""}
      <div class="facts">
        <span>距離: ${escapeHtml(distanceLabel(shop))}</span>
        <span>営業時間: ${escapeHtml(hoursDetail(shop, status))}</span>
        <span>現在: ${escapeHtml(currentStatusLabel(shop, status))}</span>
        <span>予算: ${budgetLabel(shop)}</span>
        ${benefit}
      </div>
      <div class="tags">${tags.map(tag => `<span class="tag">${escapeHtml(tagLabel(tag))}</span>`).join("")}</div>
      <div class="card-actions">${mapAction}${officialAction}${instagramAction}${reservationAction}</div>
    </div>
  `;
  card.querySelectorAll("[data-shop-action]").forEach(link => {
    link.addEventListener("click", () => track("shop_click", { shop: link.dataset.shopId, action: link.dataset.shopAction }));
  });
  return card;
}

function fitLabel(index) {
  return ["本命", "かなり合いそう", "意外とアリ"][index] || "候補";
}

function sourceLabel(source) {
  if (source === "survey") return "お店からのひとこと";
  if (source === "public") return "公開情報からの特徴";
  if (source === "demo") return "デモ情報";
  return "お店の特徴";
}

function distanceLabel(shop) {
  if (shop.eventZone && shop.eventZone !== ACTIVE_EVENT_ZONE) {
    return `${shop.area || "別エリア"}・松戸駅周辺から移動あり`;
  }
  if (shop.area && shop.walkMinutes > 0) return `${shop.area}・会場から徒歩${shop.walkMinutes}分`;
  if (shop.walkMinutes > 0) return `会場から徒歩${shop.walkMinutes}分`;
  return shop.accessNote || shop.area || "距離情報を確認中";
}

function hoursDetail(shop, status) {
  if (shop.hoursStatus === "needs_confirmation") return "最新の公式情報で確認";
  return status.detail;
}

function currentStatusLabel(shop, status) {
  if (shop.hoursStatus === "needs_confirmation") return "営業時間は要確認";
  return status.label;
}

function budgetLabel(shop) {
  if (!shop.budgetMin && !shop.budgetMax) return "店舗で確認";
  if (!shop.budgetMax) return `${shop.budgetMin.toLocaleString()}円〜`;
  return `${shop.budgetMin.toLocaleString()}〜${shop.budgetMax.toLocaleString()}円`;
}

function validExternalUrl(value, kind) {
  try {
    const url = new URL(value);
    const pathIsUseful = url.pathname && url.pathname !== "/";
    const queryIsUseful = Boolean(url.search);
    const isMap = url.hostname === "maps.app.goo.gl"
      || url.hostname.includes("google.")
      || url.hostname.includes("maps.google.");
    const isInstagram = url.hostname === "instagram.com" || url.hostname.endsWith(".instagram.com");
    const expectedDomain = kind === "map" ? isMap : isInstagram;
    return url.protocol === "https:" && expectedDomain && (pathIsUseful || queryIsUseful);
  } catch {
    return false;
  }
}

function validHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function recommendType(shop, status) {
  if (state.answers.people?.people === "large_group" && shop.sizeTag === "small_shop") return "事前確認が必要";
  if (shop.eventZone && shop.eventZone !== ACTIVE_EVENT_ZONE) return "足を延ばす候補";
  if (!status.open) return "営業時間は要確認";
  if (shop.welcomeTags.includes("closing")) return "締めにおすすめ";
  if (shop.welcomeTags.includes("large_group_welcome")) return "グループ向き";
  if (shop.welcomeTags.includes("quiet_drink")) return "静かに飲む向き";
  if (status.state === "soon") return "閉店時間に注意";
  return "今の気分に合いそう";
}

function recommendReason(shop, status, tags) {
  const labels = tags.map(tagLabel).filter(Boolean);
  const parts = [];
  if (labels.length) parts.push(`${labels.join("・")}が今の条件に近い`);
  if (shop.ownerCommentTags.some(tag => tags.includes(tag))) parts.push("店側の歓迎したい客層とも合っている");
  if (shop.eventZone && shop.eventZone !== ACTIVE_EVENT_ZONE) parts.push("遠くてもOKなら足を延ばす価値がある");
  if (status.open) parts.push("今の時間も寄りやすい");
  if (!parts.length) return "知らない店を開拓したいならアリ。";
  return `${parts.join("。")}。まあ、悪くないと思うぞ。`;
}

function fallbackTags(shop) {
  return [...shop.welcomeTags, ...shop.moodTags, ...shop.atmosphereTags, ...shop.foodTags, ...shop.drinkTags];
}

function tagLabel(tag) {
  const labels = {
    party: "盛り上がり",
    lively: "にぎやか",
    group_fun: "ワイワイ",
    calm: "落ち着き",
    quiet_drink: "静かに一杯",
    slow_talk: "ゆっくり会話",
    hungry: "食事重視",
    full_meal: "しっかり食事",
    light_drink: "軽く飲む",
    first_round: "1軒目",
    second_round: "2軒目",
    third_round: "3軒目以降",
    second_round_welcome: "2軒目歓迎",
    late_round_welcome: "遅め歓迎",
    group_welcome: "グループ歓迎",
    small_group_welcome: "少人数歓迎",
    large_group_welcome: "大人数歓迎",
    solo_welcome: "一人歓迎",
    solo: "一人",
    pair: "二人",
    small_group: "少人数",
    large_group: "大人数",
    pair_welcome: "二人向き",
    craft_beer: "クラフトビール",
    beer: "ビール",
    local_beer: "地元ビール",
    sake: "日本酒",
    whisky: "ウイスキー",
    shochu: "焼酎",
    wine: "ワイン",
    cocktail: "カクテル",
    meat: "肉料理",
    yakitori: "串焼き",
    game_meat: "ジビエ",
    pizza: "ピザ",
    pasta: "パスタ",
    italian: "イタリアン",
    chinese: "中華",
    gyoza: "餃子",
    seafood: "魚料理",
    vegetables: "野菜料理",
    noodles: "締め",
    closing: "締め",
    snacks: "つまみ",
    counter: "カウンター",
    table: "テーブル",
    talk_owner: "店主と会話",
    first_visit: "初訪問向き",
    quick_finish: "サクッと",
    new_encounter: "新規開拓",
    solo_time: "一人時間",
    hidden: "穴場",
    romantic: "雰囲気重視",
    stylish: "おしゃれ",
    traditional: "昔ながら",
    homey: "アットホーム",
    casual: "入りやすい"
  };
  return labels[tag] || tag;
}

function safeColor(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(String(value || "")) ? value : fallback;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function track(name, detail = {}) {
  window.dataLayer?.push({ event: `hashigopon_${name}`, ...detail });
  window.dispatchEvent(new CustomEvent("hashigopon:event", { detail: { name, ...detail } }));
}

async function startApp() {
  els.conversation.innerHTML = "";
  els.answers.innerHTML = "";
  els.results.classList.remove("show");
  els.storeGrid.innerHTML = "";
  els.refineArea.hidden = true;
  state.answers = {};
  state.answeredQuestionIds = [];
  state.requestText = "";
  state.lastScores = [];
  state.currentPickIds = [];
  renderDots();
  setPonImage("normal");

  if (!state.shops.length) state.shops = await loadShopData();
  track("start");
  await ponSay("よう。俺ははしごポン。店探しなら任せろ。8問だけ付き合え。ちゃんと相性を見る。", "normal");
  await renderQuestion();
}

function startAppSafely() {
  startApp().catch(error => {
    console.error(error);
    toast("もう一度読み込み直してください");
  });
}

function renderRefineForm() {
  els.refineArea.hidden = false;
  els.refineArea.innerHTML = `
    <label for="refineInput">条件を一言足す（任意）</label>
    <textarea id="refineInput" class="request-input" maxlength="120" placeholder="例：静かに話せる店 / 日本酒 / 締めにラーメン"></textarea>
    <button type="button" class="answer-button primary" id="refineSubmit">条件を足して選び直す</button>
  `;
  els.refineArea.querySelector("#refineSubmit").addEventListener("click", () => {
    state.requestText = els.refineArea.querySelector("#refineInput").value.trim();
    if (!state.requestText) {
      toast("条件を一言入れてくれ");
      return;
    }
    addUserMessage(state.requestText);
    track("refine", { text: state.requestText });
    state.currentPickIds = [];
    showResults(false);
  });
  els.refineArea.querySelector("#refineInput").focus();
}

document.querySelector("#retryButton")?.addEventListener("click", startAppSafely);

document.querySelector("#randomButton")?.addEventListener("click", () => {
  showResults(true);
  toast("別の候補を出したぞ");
});

els.refineButton?.addEventListener("click", renderRefineForm);

document.querySelectorAll("[data-feedback]").forEach(button => {
  button.addEventListener("click", () => {
    const good = button.dataset.feedback === "good";
    setPonImage(good ? "satisfied" : "tired");
    els.feedbackImage.src = HASHIGOPON_IMAGES[good ? "satisfied" : "tired"];
    track("feedback", { value: good ? "good" : "bad" });
    toast(good ? "だろ？ 楽しんでこい。" : "わがままだな。条件を足してみろ。");
  });
});

if (els.profile && window.matchMedia("(min-width: 861px)").matches) els.profile.open = true;

startApp().catch(error => {
  console.error(error);
  addPonMessage("店舗データの読み込みでつまずいた。公開用サーバーから開き直してくれ。", "tired");
});

