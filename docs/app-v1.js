const HASHIGOPON_IMAGES = {
  normal: "./assets/hashigopon-normal.png",
  good: "./assets/hashigopon-good.png",
  surprise: "./assets/hashigopon-surprise.png",
  tired: "./assets/hashigopon-tired.png",
  bad: "./assets/hashigopon-bad.png",
  satisfied: "./assets/hashigopon-satisfied.png",
  recommend: "./assets/hashigopon-recommend.png"
};

const SHOP_CSV_URL = "./shop-data.csv";
const MAX_QUESTIONS = 10;

const state = {
  shops: [],
  answers: {},
  answeredQuestionIds: [],
  requestText: "",
  requestCaptured: false,
  lastScores: []
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
  conversation: document.querySelector("#conversation"),
  answers: document.querySelector("#answers"),
  progress: document.querySelector("#progress"),
  dots: document.querySelector("#dots"),
  typing: document.querySelector("#typing"),
  questionArea: document.querySelector("#questionArea"),
  thinking: document.querySelector("#thinking"),
  results: document.querySelector("#results"),
  diagnosisTitle: document.querySelector("#diagnosisTitle"),
  diagnosisText: document.querySelector("#diagnosisText"),
  storeGrid: document.querySelector("#storeGrid"),
  toast: document.querySelector("#toast")
};

const QUESTIONS = [
  {
    id: "mood",
    fixed: true,
    text: "じゃあ、今どんな気分？",
    options: [
      ["まだまだ盛り上がりたい", { endFlow: true }, "good", ["そうか！", "それではイベントを楽しんでくれ。"]],
      ["落ち着いて飲みたい", { mood: "calm", tags: ["calm", "quiet_drink"] }, "normal", ["今日はしっとり寄りだな。", "会話しやすい店を探そう。"]],
      ["いい雰囲気のお店をさがしてる", { mood: "romantic", tags: ["romantic", "stylish", "pair_welcome"] }, "bad", ["へえ、そういう夜か。", "雰囲気のいい店も見ておく。"]],
      ["とにかくお腹が空いた", { mood: "hungry", tags: ["hungry", "full_meal"] }, "good", ["腹ペコ認定。", "飲みより食事重視でいくぞ。"]],
      ["もう一軒だけ行きたい", { mood: "second_round", round: "second_round", tags: ["second_round", "light_drink"] }, "normal", ["その“一軒だけ”は信用しすぎないでおく。", "軽く寄れる店を見よう。"]],
      ["まだ決めてない", { tags: [] }, "surprise", ["決めてない時ほど、いい夜になることがある。", "少しずつ絞ろう。"]]
    ]
  },
  {
    id: "people",
    fixed: true,
    text: "今日は何人？",
    options: [
      ["1人", { people: "solo", tags: ["solo", "solo_welcome"] }, "normal", ["ひとり酒、悪くない。", "入りやすい店を見ておく。"]],
      ["2人", { people: "pair", tags: ["pair", "pair_welcome"] }, "bad", ["2人だな。", "話しやすさも大事にするぞ。"]],
      ["3〜4人", { people: "small_group", tags: ["small_group", "group_welcome"] }, "good", ["ちょうど動きやすい人数だ。", "選択肢が広いぞ。"]],
      ["5〜8人", { people: "medium_group", tags: ["medium_group", "large_group_welcome"] }, "surprise", ["なかなかの一団だ。", "グループ歓迎の店を強めに見る。"]],
      ["9人以上", { people: "large_group", tags: ["large_group", "large_group_welcome"] }, "surprise", ["多いな。", "広さと入りやすさ重視だ。"]],
      ["まだ分からない", { tags: [] }, "normal", ["人数は流動的、と。", "まずは幅広く見る。"]]
    ]
  },
  {
    id: "round",
    fixed: true,
    text: "今、何軒目？",
    options: [
      ["まだ1軒目", { round: "first_round", tags: ["first_round", "full_meal"] }, "normal", ["スタート地点だな。", "食事もできる店が合いそうだ。"]],
      ["2軒目", { round: "second_round", tags: ["second_round", "second_round_welcome"] }, "good", ["ここからが本番ってやつだ。", "軽さと楽しさを両方見る。"]],
      ["3軒目", { round: "third_round", tags: ["third_round", "late_round_welcome"] }, "surprise", ["元気だな。", "営業時間もちゃんと見るぞ。"]],
      ["4軒目以上", { round: "late_round", tags: ["late_round", "late_round_welcome", "closing"] }, "tired", ["まだ行くのか。", "水もはさみつつ、無理のない店にしよう。"]],
      ["イベント会場からそのまま", { round: "event_after", tags: ["second_round", "first_visit"] }, "good", ["それではいざはしご酒へ！"]],
      ["分からない", { tags: [] }, "normal", ["まあ、夜は数え間違えることもある。", "大丈夫、こっちで調整する。"]]
    ]
  },
  {
    id: "budget",
    fixed: true,
    text: "予算はどのくらい？",
    options: [
      ["1,500円くらいまで", { budget: "low", tags: ["budget_low"] }, "normal", ["堅実だな。", "軽く寄れる店を強めにする。"]],
      ["3,000円くらい", { budget: "medium", tags: ["budget_medium"] }, "good", ["いちばん動きやすい予算感だ。", "候補が増えるぞ。"]],
      ["5,000円くらい", { budget: "high", tags: ["budget_high"] }, "good", ["今日は少し本気だな。", "雰囲気のある店も入れよう。"]],
      ["ちょっと贅沢したい", { budget: "premium", tags: ["budget_high", "stylish"] }, "satisfied", ["いい夜にする気だ。", "雰囲気重視で見ておく。"]],
      ["今日は気にしない", { budget: "no_limit", tags: [] }, "bad", ["強気だな。", "明日の自分とも相談してくれ。"]],
      ["まだ決めてない", { tags: [] }, "normal", ["予算はゆるめ、と。", "他の条件を優先する。"]]
    ]
  },
  {
    id: "atmosphere",
    text: "どんな雰囲気がいい？",
    options: [
      ["にぎやかで楽しい", { atmosphere: "lively", tags: ["lively"] }, "good", ["今日は静かすぎる店じゃないな。", "わいわい系を上げる。"]],
      ["落ち着いている", { atmosphere: "calm", tags: ["calm", "quiet_drink"] }, "normal", ["しっとり寄り、了解。", "話しやすさを重視する。"]],
      ["おしゃれ", { atmosphere: "stylish", tags: ["stylish"] }, "bad", ["見た目も気分も大事だ。", "ちょっと洒落た候補を見る。"]],
      ["昔ながらで渋い", { atmosphere: "traditional", tags: ["traditional"] }, "normal", ["渋いところに行きたい夜、ある。", "松戸らしい店を見よう。"]],
      ["アットホーム", { atmosphere: "homey", tags: ["homey", "talk_owner"] }, "satisfied", ["距離の近さがいいんだな。", "店の人と話せそうな店も見る。"]],
      ["こだわらない", { tags: [] }, "normal", ["雰囲気はおまかせだな。", "相性優先でいく。"]]
    ]
  },
  {
    id: "foodDrink",
    text: "今日は食べたい？ 飲みたい？",
    options: [
      ["とにかく飲みたい", { purpose: "drink", tags: ["light_drink"] }, "good", ["飲み中心だな。", "ただし水もたまに入れていこう。"]],
      ["ご飯もしっかり食べたい", { purpose: "food", tags: ["full_meal"] }, "good", ["ちゃんと食べるのは正解だ。", "食事強めで見る。"]],
      ["軽くつまみながら飲みたい", { purpose: "snack", tags: ["light_drink", "snacks"] }, "normal", ["2軒目っぽくていい。", "つまみのある店を上げる。"]],
      ["締めを食べたい", { purpose: "closing", tags: ["closing", "noodles"] }, "satisfied", ["締めまで行く気だな。", "炭水化物の気配を探す。"]],
      ["どっちも大事", { purpose: "both", tags: ["full_meal", "light_drink"] }, "good", ["欲張りだな。", "でもそのくらいが楽しい。"]],
      ["まだ分からない", { tags: [] }, "normal", ["決めきれない夜もある。", "店の幅で選ぼう。"]]
    ]
  },
  {
    id: "drink",
    text: "飲むなら何がいい？",
    options: [
      ["ビール・クラフトビール", { drink: "beer", tags: ["beer", "craft_beer"] }, "good", ["フェス帰りらしい流れだ。", "ビールに強い店を見よう。"]],
      ["日本酒・焼酎", { drink: "sake", tags: ["sake", "shochu"] }, "normal", ["渋く来たな。", "小料理と合う店がよさそうだ。"]],
      ["ハイボール・サワー", { drink: "highball", tags: ["highball", "sour"] }, "good", ["軽快でいい。", "大衆系も合いそうだ。"]],
      ["ワイン・カクテル", { drink: "cocktail", tags: ["wine", "cocktail", "stylish"] }, "bad", ["少し雰囲気を作りたい夜だな。", "バー系を見ておく。"]],
      ["ノンアルでもいい", { drink: "non_alcohol", tags: ["quiet_drink"] }, "satisfied", ["それも立派な選び方だ。", "無理なく過ごせる店を探そう。"]],
      ["なんでもいい", { tags: [] }, "normal", ["幅広いな。", "店の空気で合わせるぞ。"]]
    ]
  },
  {
    id: "food",
    text: "食べるなら何系？",
    options: [
      ["肉・串・揚げ物", { food: "meat", tags: ["meat", "yakitori", "fries"] }, "good", ["勢いのある選択だ。", "グループにも合いやすい。"]],
      ["魚・和食", { food: "japanese", tags: ["seafood", "japanese", "sake"] }, "normal", ["落ち着いたいい流れだ。", "日本酒系も相性よさそうだ。"]],
      ["ラーメン・締め飯", { food: "noodles", tags: ["noodles", "rice", "closing"] }, "satisfied", ["締めの鐘が聞こえた。", "腹を満たす店を見よう。"]],
      ["軽いつまみ", { food: "snacks", tags: ["snacks", "light_drink"] }, "normal", ["まだ歩ける夜だ。", "つまみでつなげる店にしよう。"]],
      ["何でもいい", { tags: [] }, "normal", ["食は幅広め、と。", "全体の相性で見る。"]]
    ]
  },
  {
    id: "style",
    text: "どんな過ごし方がよさそう？",
    options: [
      ["みんなで盛り上がる", { style: "group_fun", tags: ["group_fun", "lively"] }, "good", ["そのテンションなら広さも大事だ。", "盛り上がれる店を上げる。"]],
      ["店主やスタッフと話したい", { style: "talk_owner", tags: ["talk_owner", "homey"] }, "satisfied", ["街の店を楽しむ感じでいいな。", "距離の近い店を探す。"]],
      ["さっと寄って帰りたい", { style: "quick_finish", tags: ["quick_finish", "closing"] }, "normal", ["潔い。", "長居しなくても楽しめる店にする。"]],
      ["ゆっくり話したい", { style: "slow_talk", tags: ["slow_talk", "quiet_drink"] }, "bad", ["会話優先だな。", "落ち着いた席の店を見よう。"]],
      ["まだ分からない", { tags: [] }, "normal", ["最後は店に決めてもらうのもありだ。", "候補を広めに残す。"]]
    ]
  },
  {
    id: "seat",
    text: "席はどんな感じがいい？",
    options: [
      ["カウンター", { seat: "counter", tags: ["counter", "solo_welcome"] }, "normal", ["カウンター、いい選択だ。", "一人でも二人でも入りやすい。"]],
      ["テーブル", { seat: "table", tags: ["table", "group_welcome"] }, "good", ["人数がいても安心だな。", "テーブルありを重視する。"]],
      ["半個室っぽい席", { seat: "semi_private", tags: ["semi_private", "calm"] }, "bad", ["話し込みたい夜だな。", "落ち着ける店を探す。"]],
      ["こだわらない", { tags: [] }, "normal", ["席はおまかせ、と。", "相性で決めるぞ。"]]
    ]
  }
];

function setPonImage(type = "normal") {
  els.ponImage.src = HASHIGOPON_IMAGES[type] || HASHIGOPON_IMAGES.normal;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function showTyping(show) {
  els.typing.classList.toggle("show", show);
}

function scrollConversation() {
  els.conversation.scrollTop = els.conversation.scrollHeight;
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
    await wait(360);
    showTyping(false);
    addPonMessage(line, image);
    await wait(140);
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
  const text = await response.text();
  return parseCsv(text).map(normalizeShop);
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
    ownerComment: row.owner_comment,
    ownerCommentTags: splitTags(row.owner_comment_tags),
    hours,
    imageUrl: row.image_url,
    mapUrl: row.map_url || "https://maps.google.com/",
    instagramUrl: row.instagram_url || "https://www.instagram.com/",
    eventBenefit: row.event_benefit || "イベント特典は店舗で確認",
    colorA: row.color_a || "#283650",
    colorB: row.color_b || "#cc3f49"
  };
}

function splitTags(value) {
  return String(value || "")
    .split(",")
    .map(tag => tag.trim())
    .filter(Boolean);
}

function currentQuestion() {
  const answered = state.answeredQuestionIds.length;
  if (answered >= MAX_QUESTIONS) return null;

  const fixedQuestion = QUESTIONS.filter(question => question.fixed)[answered];
  if (fixedQuestion) return fixedQuestion;

  const remaining = QUESTIONS.filter(question => !state.answeredQuestionIds.includes(question.id));
  if (!remaining.length) return null;

  const scores = getScores();
  const topShops = scores.slice(0, 4).map(item => item.shop);
  const tagSets = {
    drink: topShops.flatMap(shop => shop.drinkTags),
    food: topShops.flatMap(shop => shop.foodTags),
    seat: topShops.flatMap(shop => shop.seatTags),
    style: topShops.flatMap(shop => shop.styleTags),
    atmosphere: topShops.flatMap(shop => shop.atmosphereTags)
  };

  const spread = id => new Set(tagSets[id] || []).size;
  return remaining
    .map(question => ({ question, spread: spread(question.id) }))
    .sort((a, b) => b.spread - a.spread)[0].question;
}

function renderDots() {
  els.dots.innerHTML = "";
  const shown = Math.min(MAX_QUESTIONS, QUESTIONS.length);
  for (let index = 0; index < shown; index += 1) {
    const dot = document.createElement("span");
    dot.className = `dot${index < state.answeredQuestionIds.length ? " active" : ""}`;
    els.dots.append(dot);
  }
  els.progress.textContent = `${state.answeredQuestionIds.length}/${MAX_QUESTIONS} 問`;
}

async function renderQuestion() {
  renderDots();

  if (state.answeredQuestionIds.length >= 4 && !state.requestCaptured) {
    await renderRequestForm();
    return;
  }

  const offer = canOfferMidway();
  if (offer) {
    await ponSay([
      "このへんで、もうかなり見えてきた。",
      "今の条件なら、相性よさそうな3軒を出せるぞ。どうする？"
    ], "recommend");
    renderOfferButtons();
    return;
  }

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

function renderOfferButtons() {
  els.answers.innerHTML = "";
  const see = document.createElement("button");
  see.type = "button";
  see.className = "answer-button primary";
  see.textContent = "この3軒を見る";
  see.addEventListener("click", showThinkingAndResults);

  const more = document.createElement("button");
  more.type = "button";
  more.className = "answer-button";
  more.textContent = "もう少し詳しく探す";
  more.addEventListener("click", async () => {
    addUserMessage("もう少し詳しく探す");
    await renderQuestionWithoutOffer();
  });

  els.answers.append(see, more);
}

async function renderRequestForm() {
  state.requestCaptured = true;
  els.answers.innerHTML = "";
  renderDots();
  await ponSay([
    "最後に、要望があれば一言くれ。",
    "店主コメントや店の傾向と照らし合わせて、もう少し寄せて選ぶ。"
  ], "recommend");

  const box = document.createElement("div");
  box.className = "request-box";
  box.innerHTML = `
    <textarea class="request-input" id="requestInput" maxlength="120" placeholder="例：静かに話せる店がいい / 日本酒が飲みたい / 締めにラーメン / 店主と話せるところ"></textarea>
    <div class="request-actions">
      <button type="button" class="answer-button primary" id="requestSubmit">この内容で探す</button>
      <button type="button" class="answer-button" id="requestSkip">特になし</button>
    </div>
  `;
  els.answers.append(box);

  const input = box.querySelector("#requestInput");
  box.querySelector("#requestSubmit").addEventListener("click", async () => {
    state.requestText = input.value.trim();
    addUserMessage(state.requestText || "特になし");
    els.answers.innerHTML = "";
    await ponSay(state.requestText ? "よし、その要望も加えて選ぶぞ。" : "了解。選択した条件だけで選ぶぞ。", "good");
    await showThinkingAndResults({ skipRequest: true });
  });

  box.querySelector("#requestSkip").addEventListener("click", async () => {
    state.requestText = "";
    addUserMessage("特になし");
    els.answers.innerHTML = "";
    await ponSay("了解。選択した条件だけで選ぶぞ。", "normal");
    await showThinkingAndResults({ skipRequest: true });
  });
}

async function renderQuestionWithoutOffer() {
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
  if (!state.answeredQuestionIds.includes(question.id)) {
    state.answeredQuestionIds.push(question.id);
  }

  els.answers.innerHTML = "";
  await ponSay(reactions, image);
  if (payload.endFlow) {
    renderEndButtons();
    return;
  }
  await renderQuestion();
}

function renderEndButtons() {
  renderDots();
  els.progress.textContent = "終了";
  els.answers.innerHTML = "";

  const retry = document.createElement("button");
  retry.type = "button";
  retry.className = "answer-button primary";
  retry.textContent = "もう一回やる";
  retry.addEventListener("click", () => {
    startApp().catch(error => {
      console.error(error);
      toast("もう一度読み込み直してください");
    });
  });

  els.answers.append(retry);
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
    if (item.words.some(word => source.includes(word.toLowerCase()))) {
      tags.push(...item.tags);
    }
  });
  return [...new Set(tags)];
}

function getScores() {
  const tags = allAnswerTags();
  const now = new Date();
  const scores = state.shops.map(shop => {
    const status = getOpenStatus(shop, now);
    const detail = scoreShop(shop, tags, status);
    return { shop, status, ...detail };
  }).sort((a, b) => b.score - a.score);

  state.lastScores = scores;
  return scores;
}

function scoreShop(shop, tags, status) {
  let score = 36;
  const matched = [];

  const groups = [
    [shop.ownerCommentTags, 11],
    [shop.welcomeTags, 10],
    [shop.roundTags, 8],
    [shop.peopleTags, 7],
    [shop.moodTags, 7],
    [shop.atmosphereTags, 6],
    [shop.drinkTags, 5],
    [shop.foodTags, 5],
    [shop.styleTags, 4],
    [shop.seatTags, 4]
  ];

  groups.forEach(([shopTags, weight]) => {
    tags.forEach(tag => {
      if (shopTags.includes(tag)) {
        score += weight;
        matched.push(tag);
      }
    });
  });

  const requestedTags = requestTags(state.requestText);
  if (requestedTags.length) {
    const ownerHits = requestedTags.filter(tag => shop.ownerCommentTags.includes(tag)).length;
    const welcomeHits = requestedTags.filter(tag => shop.welcomeTags.includes(tag)).length;
    score += ownerHits * 8 + welcomeHits * 5;
  }

  const round = state.answers.round?.round || state.answers.mood?.round;
  if (round && ["second_round", "third_round", "late_round", "event_after"].includes(round)) {
    if (shop.welcomeTags.includes("second_round_welcome")) score += 8;
    if (shop.welcomeTags.includes("late_round_welcome")) score += 10;
    if (status.open) score += 9;
  }

  if (state.answers.people?.people === "large_group" && shop.sizeTag === "large_shop") score += 12;
  if (state.answers.people?.people === "solo" && shop.seatTags.includes("counter")) score += 8;
  if (state.answers.mood?.mood === "hungry" && shop.welcomeTags.includes("full_meal")) score += 10;

  if (status.open) score += 12;
  if (status.state === "soon") score -= 10;
  if (status.state === "closed") score -= 22;

  const budget = state.answers.budget?.budget;
  if (budget === "low" && shop.budgetMin <= 1800) score += 8;
  if (budget === "medium" && shop.budgetMin <= 3000 && shop.budgetMax <= 4500) score += 7;
  if ((budget === "high" || budget === "premium") && shop.budgetMax >= 4000) score += 6;

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    matchedTags: [...new Set(matched)]
  };
}

function canOfferMidway() {
  if (state.answeredQuestionIds.length < 4) return false;
  if (state.answeredQuestionIds.length >= MAX_QUESTIONS) return false;

  const top = getScores().slice(0, 3);
  const enoughScore = top.length === 3 && top.every(item => item.score >= 80);
  const completeness = Math.min(1, state.answeredQuestionIds.length / 7);
  return enoughScore && completeness >= 0.6;
}

function selectRecommendations(forceRandom = false) {
  if (forceRandom) {
    return [...state.shops]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(shop => ({
        shop,
        status: getOpenStatus(shop, new Date()),
        score: 78 + Math.floor(Math.random() * 16),
        matchedTags: []
      }));
  }
  return getScores().slice(0, 3);
}

function dayKey(date) {
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][date.getDay()];
}

function timeToMinutes(value) {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function getOpenStatus(shop, date) {
  const today = shop.hours[dayKey(date)] || {};
  const open = timeToMinutes(today.open);
  const close = timeToMinutes(today.close);
  const now = date.getHours() * 60 + date.getMinutes();

  if (open == null || close == null) {
    return { open: false, state: "closed", label: "本日休み", detail: "本日の営業時間は未設定" };
  }

  const display = `${today.open}-${today.close}`;
  const adjustedNow = close > 1440 && now < open ? now + 1440 : now;

  if (adjustedNow >= open && adjustedNow <= close) {
    const untilClose = close - adjustedNow;
    if (untilClose <= 60) {
      return { open: true, state: "soon", label: "まもなく閉店", detail: `本日 ${display}` };
    }
    return { open: true, state: "open", label: "営業中", detail: `本日 ${display}` };
  }

  if (now < open) {
    return { open: true, state: "before", label: "営業時間前", detail: `本日 ${display}` };
  }

  return { open: false, state: "closed", label: "営業終了", detail: `本日 ${display}` };
}

async function showThinkingAndResults(event) {
  if (!event?.skipRequest && !state.requestCaptured) {
    await renderRequestForm();
    return;
  }
  if (event?.target?.textContent === "この3軒を見る") addUserMessage("この3軒を見る");
  els.answers.innerHTML = "";
  els.thinking.classList.add("show");
  setPonImage("recommend");
  await wait(720);
  els.thinking.classList.remove("show");
  showResults();
}

function showResults(forceRandom = false) {
  const picks = selectRecommendations(forceRandom);
  const top = picks[0];
  els.results.classList.add("show");
  els.diagnosisTitle.textContent = diagnosisTitle();
  els.diagnosisText.textContent = top
    ? `相性トップは${top.shop.name}。今の気分なら「正解を当てる」より、会話が弾みそうな店を選ぶのがよさそうだ。`
    : "今日は候補が少なめだ。無理せず、近くで休める場所も選択肢に入れてくれ。";

  els.storeGrid.innerHTML = "";
  picks.forEach((item, index) => {
    els.storeGrid.append(renderStoreCard(item, index));
  });
  els.results.scrollIntoView({ behavior: "smooth", block: "start" });
}

function diagnosisTitle() {
  const mood = state.answers.mood?.mood;
  if (mood === "hungry") return "今日は食欲が主役です";
  if (mood === "calm" || mood === "romantic") return "落ち着いて飲みたい大人モード";
  if (mood === "party") return "まだ夜は終われないタイプ";
  if (state.answers.round?.round === "late_round") return "最後は無理なく締める作戦";
  return "今のあなたにおすすめ";
}

function renderStoreCard(item, index) {
  const { shop, score, status, matchedTags } = item;
  const card = document.createElement("article");
  card.className = "store-card";
  const tags = matchedTags.length ? matchedTags.slice(0, 4) : fallbackTags(shop).slice(0, 4);
  const imageStyle = shop.imageUrl
    ? `background-image: linear-gradient(rgba(0,0,0,.18), rgba(0,0,0,.18)), url('${shop.imageUrl}')`
    : `background: linear-gradient(135deg, ${shop.colorA}, ${shop.colorB})`;

  card.innerHTML = `
    <div class="store-photo" style="${imageStyle}">
      <span class="genre">${escapeHtml(shop.genre)}</span>
      <span class="score">${score}%</span>
    </div>
    <div class="store-body">
      <h3>${index + 1}. ${escapeHtml(shop.name)}</h3>
      <span class="recommend-type">${escapeHtml(recommendType(shop, status))}</span>
      <p class="reason">${escapeHtml(recommendReason(shop, status, tags))}</p>
      <p class="owner-comment">${escapeHtml(shop.ownerComment)}</p>
      <div class="facts">
        <span>距離: イベント会場から徒歩圏想定</span>
        <span>営業時間: ${escapeHtml(status.detail)}</span>
        <span>現在: ${escapeHtml(status.label)}</span>
        <span>予算: ${shop.budgetMin.toLocaleString()}〜${shop.budgetMax.toLocaleString()}円</span>
        <span>特典: ${escapeHtml(shop.eventBenefit)}</span>
      </div>
      <div class="tags">${tags.map(tag => `<span class="tag">${escapeHtml(tagLabel(tag))}</span>`).join("")}</div>
      <div class="card-actions">
        <a href="${shop.mapUrl}" target="_blank" rel="noreferrer">地図を見る</a>
        <a class="instagram" href="${shop.instagramUrl}" target="_blank" rel="noreferrer">Instagram</a>
      </div>
    </div>
  `;
  return card;
}

function recommendType(shop, status) {
  if (shop.welcomeTags.includes("closing")) return "締めにおすすめ";
  if (shop.welcomeTags.includes("large_group_welcome")) return "グループ向き";
  if (shop.welcomeTags.includes("quiet_drink")) return "静かに飲む向き";
  if (status.state === "soon") return "急ぎめ候補";
  return "今の気分に合いそう";
}

function recommendReason(shop, status, tags) {
  const parts = [];
  if (tags.length) parts.push(`${tags.map(tagLabel).join("・")}に反応した`);
  if (state.requestText && requestTags(state.requestText).some(tag => shop.ownerCommentTags.includes(tag) || shop.welcomeTags.includes(tag))) {
    parts.push("最後の要望と店のコメント傾向が近い");
  }
  if (status.open) parts.push("営業時間的にも寄りやすい");
  if (shop.ownerCommentTags.some(tag => tags.includes(tag))) parts.push("店主コメントとの相性が強い");
  return `${parts.join("うえで、")}から選んだ候補。迷ったらまずここを見てみよう。`;
}

function fallbackTags(shop) {
  return [...shop.welcomeTags, ...shop.moodTags, ...shop.foodTags, ...shop.drinkTags];
}

function tagLabel(tag) {
  const labels = {
    party: "盛り上がり",
    lively: "にぎやか",
    calm: "落ち着き",
    quiet_drink: "静かに一杯",
    hungry: "食事重視",
    full_meal: "しっかり食事",
    light_drink: "軽く飲む",
    second_round: "2軒目",
    second_round_welcome: "2軒目歓迎",
    late_round_welcome: "遅め歓迎",
    group_welcome: "グループ歓迎",
    large_group_welcome: "大人数歓迎",
    solo_welcome: "一人歓迎",
    solo: "一人",
    pair: "二人",
    small_group: "少人数",
    medium_group: "グループ",
    large_group: "大人数",
    pair_welcome: "二人向き",
    craft_beer: "クラフトビール",
    beer: "ビール",
    sake: "日本酒",
    noodles: "締め",
    closing: "締め",
    snacks: "つまみ",
    counter: "カウンター",
    table: "テーブル",
    talk_owner: "店主と会話",
    first_visit: "初訪問向き",
    hidden: "穴場",
    romantic: "雰囲気重視",
    stylish: "おしゃれ",
    homey: "アットホーム",
    party: "盛り上がり"
  };
  return labels[tag] || tag;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => els.toast.classList.remove("show"), 2200);
}

async function startApp() {
  els.conversation.innerHTML = "";
  els.answers.innerHTML = "";
  els.results.classList.remove("show");
  els.storeGrid.innerHTML = "";
  state.answers = {};
  state.answeredQuestionIds = [];
  state.requestText = "";
  state.requestCaptured = false;
  state.lastScores = [];
  renderDots();
  setPonImage("normal");

  if (!state.shops.length) {
    state.shops = await loadShopData();
  }

  await ponSay([
    "よう。俺ははしごポン。",
    "店探しなら任せてくれ。"
  ], "normal");
  await renderQuestion();
}

document.querySelector("#retryButton")?.addEventListener("click", () => {
  startApp().catch(error => {
    console.error(error);
    toast("もう一度読み込み直してください");
  });
});

document.querySelector("#randomButton")?.addEventListener("click", () => {
  showResults(true);
});

document.querySelectorAll("[data-feedback]").forEach(button => {
  button.addEventListener("click", () => {
    const good = button.dataset.feedback === "good";
    setPonImage(good ? "satisfied" : "surprise");
    toast(good ? "いい夜になりますように。" : "次はもう少し違う角度で探そう。");
  });
});

startApp().catch(error => {
  console.error(error);
  addPonMessage("店舗データの読み込みでつまずいた。サーバーを起動してから、もう一度開いてくれ。", "tired");
});
