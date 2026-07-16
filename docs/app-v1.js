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
  { words: ["髱吶°", "關ｽ縺｡逹", "繧・▲縺上ｊ", "隧ｱ縺励◆縺・, "莨夊ｩｱ"], tags: ["calm", "quiet_drink", "slow_talk"] },
  { words: ["縺ｫ縺弱ｄ縺・, "逶帙ｊ荳・, "繧上＞繧上＞", "讌ｽ縺励＞", "繝・Φ繧ｷ繝ｧ繝ｳ"], tags: ["lively", "party", "group_fun"] },
  { words: ["縺翫＠繧・ｌ", "髮ｰ蝗ｲ豌・, "繝・・繝・, "縺・＞諢溘§"], tags: ["stylish", "romantic", "pair_welcome"] },
  { words: ["荳莠ｺ", "縺ｲ縺ｨ繧・, "繧ｫ繧ｦ繝ｳ繧ｿ繝ｼ"], tags: ["solo", "solo_welcome", "counter"] },
  { words: ["螟ｧ莠ｺ謨ｰ", "縺ｿ繧薙↑", "繧ｰ繝ｫ繝ｼ繝・, "蝗｣菴・], tags: ["group_welcome", "large_group_welcome", "table"] },
  { words: ["縺願・", "閻ｹ", "縺秘｣ｯ", "鬟溘∋", "縺励▲縺九ｊ"], tags: ["hungry", "full_meal"] },
  { words: ["霆ｽ縺・, "荳譚ｯ", "繧ｵ繧ｯ繝・, "縺､縺ｾ縺ｿ"], tags: ["light_drink", "snacks"] },
  { words: ["邱繧・, "縲・, "繝ｩ繝ｼ繝｡繝ｳ", "鮗ｺ"], tags: ["closing", "noodles"] },
  { words: ["繝薙・繝ｫ", "繧ｯ繝ｩ繝輔ヨ"], tags: ["beer", "craft_beer"] },
  { words: ["譌･譛ｬ驟・, "辟ｼ驟・], tags: ["sake", "shochu"] },
  { words: ["蠎嶺ｸｻ", "繧ｹ繧ｿ繝・ヵ", "隧ｱ縺帙ｋ", "莨壹∴繧・], tags: ["talk_owner", "homey"] },
  { words: ["遏･繧峨↑縺・, "蛻昴ａ縺ｦ", "髢区挙", "遨ｴ蝣ｴ"], tags: ["first_visit", "hidden"] }
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
    text: "縺ｧ縲∽ｻ翫←繧薙↑豌怜・・・豁｣逶ｴ縺ｫ險縺医ｈ縲・,
    options: [
      ["縺九↑繧企・縺｣縺ｦ繧・, { safeExit: true, mood: "too_drunk", tags: [] }, "tsukkomi", ["繧ゅ≧螳ｶ縺ｫ蟶ｰ繧鯉ｼ・, "蠎励ｒ謗｢縺吝燕縺ｫ豌ｴ繧帝｣ｲ繧√ゆｻ頑律縺ｯ辟｡逅・☆繧九↑縲・]],
      ["縺ｾ縺縺ｾ縺鬟ｲ繧√ｋ", { mood: "more", tags: ["second_round", "light_drink"] }, "good", ["蜈・ｰ励□縺ｪ縲・, "縺昴・閾ｪ菫｡縲√≠縺ｨ縺ｧ蠕梧ｔ縺吶ｋ縺ｪ繧医・]],
      ["逶帙ｊ荳翫′縺｣縺ｦ繧・, { mood: "party", tags: ["party", "lively", "group_fun", "group_welcome"] }, "good", ["縺昴・繝・Φ繧ｷ繝ｧ繝ｳ縺ｪ繧蛾撕縺九↑蠎励・辟｡逅・□縺ｪ縲・, "繝弱Μ縺ｮ縺・＞蠎励ｒ謗｢縺吶ょｺ励・霑ｷ諠代・縺九￠繧九↑繧医・]],
      ["關ｽ縺｡逹縺・※鬟ｲ縺ｿ縺溘＞", { mood: "calm", tags: ["calm", "quiet_drink", "slow_talk"] }, "normal", ["繧・▲縺ｨ螟ｧ莠ｺ縺ｫ縺ｪ縺｣縺溘°縲・, "莉頑律縺ｯ鬨偵′縺壹∬ｩｱ縺励ｄ縺吶＞蠎励↓縺吶ｋ縲・]],
      ["縺・＞繝繝ｼ繝峨↓縺ｪ繧翫◆縺・, { mood: "romantic", tags: ["romantic", "stylish", "pair_welcome"] }, "bad", ["縺ｸ縺医ゅ◎縺・＞縺・､懊°縲・, "驍ｪ鬲斐＆繧後↓縺上◎縺・↑蠎励ｒ謗｢縺励※繧・ｋ繧医・]],
      ["閻ｹ縺梧ｸ帙▲縺・, { mood: "hungry", tags: ["hungry", "full_meal"] }, "good", ["驟偵ｈ繧雁・縺ｫ鬟ｯ縺縺ｪ縲・, "縺｡繧・ｓ縺ｨ鬟溘∴繧句ｺ励ｒ蠑ｷ繧√↓隕九ｋ縲・]],
      ["繧ゅ≧荳霆偵□縺・, { mood: "second_round", tags: ["second_round", "light_drink", "quick_finish", "second_round_welcome"] }, "bad", ["縺昴・窶應ｸ霆偵□縺鯛昴・菫｡逕ｨ縺励※縺ｪ縺・・, "縺ｾ縺ゅ∬ｻｽ縺丞ｯ・ｌ繧句ｺ励ｒ隕九※繧・ｋ縲・]]
    ]
  },
  {
    id: "people",
    text: "縺ｧ縲∽ｽ穂ｺｺ・・,
    options: [
      ["1莠ｺ", { people: "solo", tags: ["solo", "solo_welcome", "counter", "solo_time"] }, "normal", ["縺ｲ縺ｨ繧翫°縲ゆｿｺ繧ゅ＞縺､繧ゆｸ莠ｺ驟偵□縺懊・, "豌玲･ｽ縺ｫ蜈･繧後ｋ蠎励ｒ隕九※縺翫￥縲・]],
      ["2莠ｺ", { people: "pair", tags: ["pair", "pair_welcome", "slow_talk"] }, "bad", ["2莠ｺ・・縺ｸ縺医・, "隧ｳ縺励￥縺ｯ閨槭°縺ｪ縺・〒縺翫￥縲らｩｺ豌励・隱ｭ繧薙〒繧・ｋ繧医・]],
      ["3縲・莠ｺ", { people: "small_group", tags: ["small_group", "small_group_welcome", "group_welcome"] }, "good", ["縺｡繧・≧縺ｩ縺・＞莠ｺ謨ｰ縺倥ｃ繧薙・, "蠎励ｂ驕ｸ縺ｳ繧・☆縺・・]],
      ["5莠ｺ莉･荳・, { people: "large_group", tags: ["large_group", "large_group_welcome", "group_welcome", "table"] }, "surprise", ["莠ｺ謨ｰ螟壹＞縺ｪ縲ょ・縺ｫ險縺医ｈ縲・, "蟶ｭ縺ｮ縺ゅｋ蠎励ｒ蠑ｷ繧√↓謗｢縺吶・]]
    ]
  },
  {
    id: "round",
    text: "莉翫∽ｽ戊ｻ堤岼・・縺薙％縺ｯ縺斐∪縺九☆縺ｪ繧医・,
    options: [
      ["縺薙ｌ縺九ｉ1霆堤岼", { round: "first", tags: ["first_round", "full_meal"] }, "good", ["縺ｾ縺逵溘▲逋ｽ縺ｪ迥ｶ諷九°縲・, "譛蛻昴°繧峨■繧・ｓ縺ｨ讌ｽ縺励ａ繧句ｺ励ｒ隕九ｋ縲・]],
      ["2霆堤岼", { round: "second", tags: ["second_round", "second_round_welcome", "light_drink"] }, "bad", ["縺ｯ縺・・縺・√お繝ｳ繧ｸ繝ｳ縺九°縺｣縺ｦ繧九・縲・, "莠瑚ｻ堤岼豁楢ｿ弱・蠎励ｒ蠑ｷ繧√↓隕九ｋ縲・]],
      ["3霆堤岼莉･髯・, { round: "late", tags: ["third_round", "late_round_welcome", "closing", "quick_finish"] }, "surprise", ["縺ｾ縺陦後￥縺ｮ・・蜈・ｰ励□縺ｪ縲・, "邱繧√ｄ驕・ａ縺ｧ繧ょｯ・ｊ繧・☆縺・ｺ励ｒ隕九ｋ縲ら┌逅・・縺吶ｋ縺ｪ繧医・]],
      ["繧ゅ≧隕壹∴縺ｦ縺ｪ縺・, { safeExit: true, round: "unknown", tags: [] }, "tsukkomi", ["縺倥ｃ縺ょｺ励ｒ謗｢縺励※繧句ｴ蜷医§繧・↑縺・・, "豌ｴ繧帝｣ｲ繧薙〒蟶ｰ繧後ゆｻ頑律縺ｯ邨ゆｺ・・]]
    ]
  },
  {
    id: "budget",
    text: "莠育ｮ励・縺ｩ縺ｮ縺上ｉ縺・ｼ・,
    options: [
      ["1,500蜀・￥繧峨＞縺ｾ縺ｧ", { budget: "low", tags: ["budget_low"] }, "normal", ["蝣・ｮ溘□縺ｪ縲・, "縺｡繧・ｓ縺ｨ雋｡蟶・ｒ隕九※繧九§繧・ｓ縲・]],
      ["3,000蜀・￥繧峨＞", { budget: "medium", tags: ["budget_medium"] }, "good", ["縺ｾ縺ゅ√◎縺ｮ縺上ｉ縺・′迴ｾ螳溽噪縲・, "蛟呵｣懊ｂ螟壹◎縺・□縲・]],
      ["5,000蜀・￥繧峨＞", { budget: "high", tags: ["budget_high"] }, "good", ["莉頑律縺ｯ縺｡繧・▲縺ｨ譛ｬ豌励§繧・ｓ縲・, "縺・＞蠎励ｂ豺ｷ縺懊※隕九ｋ縲・]],
      ["莉頑律縺ｯ豌励↓縺励↑縺・, { budget: "no_limit", tags: [] }, "bad", ["蠑ｷ豌励□縺ｪ縲・, "譏取律縺ｮ閾ｪ蛻・→縺ｯ逶ｸ隲・＠縺滂ｼ・]]
    ]
  },
  {
    id: "atmosphere",
    text: "縺ｩ繧薙↑髮ｰ蝗ｲ豌励・蠎励′縺・＞・・,
    options: [
      ["縺ｫ縺弱ｄ縺・, { atmosphere: "lively", tags: ["lively", "group_fun"] }, "good", ["縺昴・隱ｿ蟄舌↑繧蛾撕縺九☆縺弱ｋ蠎励・驕輔≧縺ｪ縲・, "縺ｫ縺弱ｄ縺句ｯ・ｊ縺ｧ隕九ｋ縲・]],
      ["關ｽ縺｡逹縺・※縺・ｋ", { atmosphere: "calm", tags: ["calm", "quiet_drink", "slow_talk"] }, "normal", ["縺励▲縺ｨ繧雁ｯ・ｊ縺ｭ縲・, "莨夊ｩｱ縺励ｄ縺吶＆繧帝㍾隕悶☆繧九・]],
      ["縺翫＠繧・ｌ繝ｻ縺・＞繝繝ｼ繝・, { atmosphere: "stylish", tags: ["stylish", "romantic"] }, "bad", ["隕九◆逶ｮ繧よｰ怜・繧ょ､ｧ莠九√→縲・, "縺｡繧・▲縺ｨ豢定誠縺溷ｺ励ｒ隕九ｋ縲・]],
      ["譏斐↑縺後ｉ繝ｻ繧｢繝・ヨ繝帙・繝", { atmosphere: "homey", tags: ["traditional", "homey"] }, "normal", ["貂九￥縺ｦ霍晞屬縺ｮ霑代＞蠎励・縲・, "譏斐↑縺後ｉ縺ｮ遨ｺ豌励ｒ謗｢縺吶・]],
      ["蛻昴ａ縺ｦ縺ｧ繧ょ・繧翫ｄ縺吶＞", { atmosphere: "first_visit", tags: ["first_visit", "casual"] }, "good", ["蛻晁ｦ九・謇峨・縺｡繧・▲縺ｨ驥阪＞縺九ｉ縺ｪ縲・, "蜈･繧翫ｄ縺吶＆繧貞━蜈医☆繧九・]],
      ["蠎嶺ｸｻ繧・せ繧ｿ繝・ヵ縺ｨ隧ｱ縺励ｄ縺吶＞", { atmosphere: "talk_owner", tags: ["talk_owner", "homey"] }, "satisfied", ["蠎励・莠ｺ縺ｨ隧ｱ縺励◆縺・ｓ縺縺ｪ縲・, "霍晞屬縺ｮ霑代◎縺・↑蠎励ｒ隕九※縺翫￥縲・]]
    ]
  },
  {
    id: "foodDrink",
    text: "鬟溘∋縺溘＞・・鬟ｲ縺ｿ縺溘＞・・,
    options: [
      ["縺ｨ縺ｫ縺九￥鬟ｲ縺ｿ縺溘＞", { purpose: "drink", tags: ["light_drink"] }, "good", ["鬟ｲ縺ｿ荳ｭ蠢・□縺ｪ縲・, "縺溘□縺玲ｰｴ繧ゅ◆縺ｾ縺ｫ蜈･繧後ｍ繧医・]],
      ["縺秘｣ｯ繧ゅ＠縺｣縺九ｊ", { purpose: "food", tags: ["full_meal"] }, "good", ["縺｡繧・ｓ縺ｨ鬟溘∋繧九・縺ｯ豁｣隗｣縲・, "鬟滉ｺ九′蠑ｷ縺・ｺ励〒隕九ｋ縲・]],
      ["霆ｽ縺上▽縺ｾ縺ｿ縺ｪ縺後ｉ", { purpose: "snack", tags: ["light_drink", "snacks"] }, "normal", ["莠瑚ｻ堤岼縺｣縺ｽ縺上※縺・＞縲・, "縺､縺ｾ縺ｿ縺ｮ縺ゅｋ蠎励ｒ荳翫￡繧九・]],
      ["邱繧√ｒ鬟溘∋縺溘＞", { purpose: "closing", tags: ["closing", "noodles"] }, "satisfied", ["邱繧√∪縺ｧ陦後￥豌励□縺ｪ縲・, "轤ｭ豌ｴ蛹也黄縺ｮ豌鈴・繧呈爾縺吶・]],
      ["縺ｩ縺｣縺｡繧ょ､ｧ莠・, { purpose: "both", tags: ["full_meal", "light_drink"] }, "bad", ["谺ｲ蠑ｵ繧翫□縺ｪ縲・, "縺ｾ縺ゅ√◎縺ｮ縺上ｉ縺・′讌ｽ縺励＞縲・]]
    ]
  },
  {
    id: "preference",
    text: "縺ｧ縲∽ｽ輔′豌励↓縺ｪ繧具ｼ・荳逡ｪ霑代＞繧・▽繧帝∈縺ｹ縲・,
    options: [
      ["繧ｯ繝ｩ繝輔ヨ繝薙・繝ｫ", { preference: "craft_beer", tags: ["craft_beer", "beer", "local_beer"] }, "good", ["縺昴％縺ｯ螟悶○縺ｪ縺・√→縲・, "繝薙・繝ｫ縺ｫ蠑ｷ縺・ｺ励ｒ荳翫￡繧九・]],
      ["繝ｯ繧､繝ｳ繝ｻ繧ｫ繧ｯ繝・Ν", { preference: "wine_cocktail", tags: ["wine", "cocktail"] }, "bad", ["縺｡繧・▲縺ｨ豢定誠縺溘＞繧薙□縺ｪ縲・, "驟偵→髮ｰ蝗ｲ豌励∽ｸ｡譁ｹ隕九ｋ縲・]],
      ["譌･譛ｬ驟偵・繧ｦ繧､繧ｹ繧ｭ繝ｼ", { preference: "sake_whisky", tags: ["sake", "whisky", "shochu"] }, "normal", ["縺倥▲縺上ｊ鬟ｲ繧譁ｹ縺ｭ縲・, "縺昴・霎ｺ縺ｫ蠑ｷ縺・ｺ励ｒ謗｢縺吶・]],
      ["閧峨・荳ｲ辟ｼ縺・, { preference: "meat", tags: ["meat", "yakitori", "game_meat"] }, "good", ["繧上°繧翫ｄ縺吶￥縺ｦ蜉ｩ縺九ｋ縲・, "閧峨・豌鈴・縺梧ｿ・＞蠎励ｒ隕九ｋ縲・]],
      ["繝斐じ繝ｻ繝代せ繧ｿ", { preference: "italian", tags: ["pizza", "pasta", "italian"] }, "satisfied", ["縺ｿ繧薙↑縺ｧ蝗ｲ繧縺ｪ繧牙ｼｷ縺・↑縲・, "繧､繧ｿ繝ｪ繧｢繝ｳ蟇・ｊ繧定ｦ九※縺翫￥縲・]],
      ["荳ｭ闖ｯ繝ｻ鬢・ｭ舌・鮗ｺ", { preference: "chinese", tags: ["chinese", "gyoza", "noodles"] }, "good", ["閻ｹ縺梧ｱｺ縺ｾ縺｣縺ｦ繧九§繧・ｓ縲・, "荳ｭ闖ｯ縺ｨ邱繧√・蛟呵｣懊ｒ荳翫￡繧九・]],
      ["鬲壹・驥手除繝ｻ霆ｽ縺・ｂ縺ｮ", { preference: "light_food", tags: ["seafood", "vegetables", "snacks"] }, "normal", ["驥阪☆縺弱↑縺・婿縺後＞縺・√→縲・, "縺､縺ｾ縺ｿ繧・侭逅・・逶ｸ諤ｧ繧定ｦ九ｋ縲・]],
      ["縺ｪ繧薙〒繧ゅ＞縺・, { preference: "any", tags: [] }, "tired", ["荳逡ｪ蝗ｰ繧狗ｭ斐∴縺縺ｪ縲・, "縺ｾ縺ゅ∝ｺ怜・縺ｨ縺ｮ逶ｸ諤ｧ縺ｧ豎ｺ繧√※繧・ｋ縲・]]
    ]
  },
  {
    id: "distance",
    text: "譛蠕後ゅ←縺薙∪縺ｧ陦後￠繧具ｼ・,
    options: [
      ["鬧・°繧芽ｿ代＞譁ｹ縺後＞縺・, { distance: "near", allZones: false, tags: [] }, "normal", ["豁ｩ縺阪◆縺上↑縺・｡斐＠縺ｦ繧九↑縲・, "譚ｾ謌ｸ鬧・・霑大ｴ繧貞━蜈医☆繧九・]],
      ["10蛻・￥繧峨＞縺ｪ繧画ｭｩ縺・, { distance: "walk", allZones: false, tags: [] }, "good", ["縺昴・縺上ｉ縺・虚縺代ｋ縺ｪ繧牙香蛻・・, "譚ｾ謌ｸ鬧・捉霎ｺ繧貞ｺ・ａ縺ｫ隕九ｋ縲・]],
      ["驕縺上※繧り憶縺・ｺ励↑繧芽｡後￥", { distance: "explore", allZones: true, tags: ["new_encounter", "first_visit"] }, "surprise", ["縺翫∬｡悟虚蜉帙≠繧九§繧・ｓ縲・, "遏｢蛻・∪縺ｧ蛟呵｣懊ｒ蠎・￡繧九る□縺・▲縺ｦ譁・唱縺ｯ縺ｪ縺励↑縲・]]
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
    <img class="pon-face" src="${HASHIGOPON_IMAGES[image] || HASHIGOPON_IMAGES.normal}" alt="縺ｯ縺励＃繝昴Φ">
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
  if (!response.ok) throw new Error("蠎苓・CSV繧定ｪｭ縺ｿ霎ｼ繧√∪縺帙ｓ縺ｧ縺励◆");
  const rows = parseCsv(await response.text()).map(normalizeShop);
  const eventShops = rows.filter(shop => !shop.eventZone || shop.eventZone === ACTIVE_EVENT_ZONE);
  if (!eventShops.length) throw new Error(`蟇ｾ雎｡繧ｨ繝ｪ繧｢ ${ACTIVE_EVENT_ZONE} 縺ｮ蠎苓・縺後≠繧翫∪縺帙ｓ`);
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
    eventBenefit: row.event_benefit || "繧､繝吶Φ繝育音蜈ｸ縺ｯ蠎苓・縺ｧ遒ｺ隱・,
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
  re…1369 tokens truncated…

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
  const openNow = allRanked.filter(item => item.status.open);
  let ranked = openNow.length >= 3 ? openNow : allRanked;
  // 縲悟挨縺ｮ3霆偵阪・逶ｴ蜑阪・蛟呵｣懊ｒ驕ｿ縺代ｋ縲ょ霧讌ｭ荳ｭ縺縺代〒縺ｯ蛟呵｣懊′雜ｳ繧翫↑縺・ｴ蜷医・縲・  // 蝟ｶ讌ｭ譎る俣螟悶・逶ｸ諤ｧ蛟呵｣懊ｂ譏守､ｺ莉倥″縺ｧ陬懷ｮ後☆繧九・  if (alternate && ranked.filter(item => !state.currentPickIds.includes(item.shop.id)).length < 3) {
    ranked = allRanked;
  }
  if (state.answers.people?.people === "large_group") {
    const groupReady = ranked.filter(item => item.shop.sizeTag !== "small_shop");
    if (groupReady.length >= 3) ranked = groupReady;
  }
  if (!ranked.length) return [];
  const pool = ranked.slice(0, Math.min(8, ranked.length));
  let picks;
  if (alternate) {
    let candidates = pool.filter(item => !state.currentPickIds.includes(item.shop.id));
    if (candidates.length < 3) candidates = pool;
    picks = shuffle(candidates).slice(0, Math.min(3, candidates.length));
  } else {
    picks = [pool[0], ...shuffle(pool.slice(1, 6)).slice(0, Math.min(2, pool.length - 1))];
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
      return openStatus(previous.close - previousNow, `蜑肴律 ${previous.display}`);
    }
  }

  const today = openWindow(shop.hours[dayKey(date)]);
  if (!today) return { open: false, state: "holiday", label: "譛ｬ譌･莨代∩", detail: "譛ｬ譌･縺ｮ蝟ｶ讌ｭ譎る俣縺ｯ譛ｪ險ｭ螳・ };
  if (now >= today.open && now <= today.close) return openStatus(today.close - now, `譛ｬ譌･ ${today.display}`);
  if (now < today.open) return { open: false, state: "before", label: "蝟ｶ讌ｭ譎る俣蜑・, detail: `譛ｬ譌･ ${today.display}` };
  return { open: false, state: "closed", label: "蝟ｶ讌ｭ邨ゆｺ・, detail: `譛ｬ譌･ ${today.display}` };
}

function openStatus(untilClose, detail) {
  if (untilClose <= 60) return { open: true, state: "soon", label: "縺ｾ繧ゅ↑縺城哩蠎・, detail };
  return { open: true, state: "open", label: "蝟ｶ讌ｭ荳ｭ", detail };
}

async function showThinkingAndResults() {
  els.answers.innerHTML = "";
  els.thinking.classList.add("show");
  els.thinking.textContent = ["譚｡莉ｶ螟壹＞縺ｪ縲ゆｻ翫∪縺ｨ繧√※繧九・, "縺｡繧・▲縺ｨ蠕・※縲ゅ■繧・ｓ縺ｨ閠・∴縺ｦ繧九・, "諤･縺九☆縺ｪ縲ょｺ励ｒ驕ｸ繧薙〒繧九・][Math.floor(Math.random() * 3)];
  setPonImage("thinking");
  await wait(1350);
  els.thinking.classList.remove("show");
  showResults();
}

function showResults(alternate = false) {
  const picks = selectRecommendations(alternate);
  const includesClosedFallback = picks.some(item => !item.status.open && item.shop.hoursStatus !== "needs_confirmation");
  setPonImage("recommend");
  els.diagnosisImage.src = HASHIGOPON_IMAGES.recommend;
  els.results.classList.add("show");
  els.diagnosisTitle.textContent = diagnosisTitle();
  els.diagnosisText.textContent = picks.length
    ? includesClosedFallback
      ? `縺ｯ縺・・∈繧薙□縲ゅ％縺ｮ${picks.length}霆偵ゆｻ翫・蝟ｶ讌ｭ荳ｭ縺ｮ蠎励′蟆代↑縺・°繧峨∝霧讌ｭ譎ゅ・逶ｸ諤ｧ蛟呵｣懊ｂ豺ｷ縺懊◆縲り｡後￥蜑阪↓譎る俣縺ｯ遒ｺ隱阪＠繧阪ｈ縲Ａ
      : `縺ｯ縺・・∈繧薙□縲ゅ％縺ｮ${picks.length}霆偵ゆｻ翫・豌怜・縺ｨ蝟ｶ讌ｭ譎る俣繧定ｦ九※驕ｸ繧薙□縺槭Ａ
    : "莉雁霧讌ｭ荳ｭ縺ｮ蛟呵｣懊′隕九▽縺九ｉ縺ｪ縺九▲縺溘ょ霧讌ｭ譎る俣繧堤｢ｺ隱阪＠縺ｦ縲∫┌逅・○縺壼ｸｰ繧後・;
  els.storeGrid.innerHTML = "";
  picks.forEach((item, index) => els.storeGrid.append(renderStoreCard(item, index)));
  els.refineArea.hidden = true;
  track("results", { shops: picks.map(item => item.shop.id) });
  els.results.scrollIntoView({ behavior: "smooth", block: "start" });
}

function diagnosisTitle() {
  const mood = state.answers.mood?.mood;
  if (mood === "hungry") return "莉頑律縺ｯ鬟滓ｬｲ縺御ｸｻ蠖ｹ";
  if (mood === "calm") return "髱吶°縺ｫ鬟ｲ縺ｿ縺溘＞螟ｧ莠ｺ繝｢繝ｼ繝・;
  if (mood === "romantic") return "縺ｯ縺・・縺・√＞縺・Β繝ｼ繝峨・";
  if (mood === "party") return "縺ｾ縺螟懊・邨ゅｏ繧後↑縺・ち繧､繝・;
  return "莉翫・縺ゅｓ縺溘↓縺ｯ縲√％縺ｮ3霆・;
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
    ? `<a href="${escapeAttribute(shop.mapUrl)}" target="_blank" rel="noreferrer" data-shop-action="map" data-shop-id="${escapeAttribute(shop.id)}">蝨ｰ蝗ｳ繧定ｦ九ｋ</a>`
    : `<span class="action-disabled">蝨ｰ蝗ｳ貅門ｙ荳ｭ</span>`;
  const instagramAction = validExternalUrl(shop.instagramUrl, "instagram")
    ? `<a class="instagram" href="${escapeAttribute(shop.instagramUrl)}" target="_blank" rel="noreferrer" data-shop-action="instagram" data-shop-id="${escapeAttribute(shop.id)}">Instagram</a>`
    : "";
  const officialAction = validHttpUrl(shop.officialUrl)
    ? `<a href="${escapeAttribute(shop.officialUrl)}" target="_blank" rel="noreferrer" data-shop-action="official" data-shop-id="${escapeAttribute(shop.id)}">蜈ｬ蠑乗ュ蝣ｱ</a>`
    : "";
  const reservationAction = validHttpUrl(shop.reservationUrl)
    ? `<a class="reservation" href="${escapeAttribute(shop.reservationUrl)}" target="_blank" rel="noreferrer" data-shop-action="reservation" data-shop-id="${escapeAttribute(shop.id)}">莠育ｴ・/a>`
    : "";
  const benefit = shop.eventBenefit && shop.eventBenefit !== "譛ｪ遒ｺ隱・
    ? `<span>迚ｹ蜈ｸ: ${escapeHtml(shop.eventBenefit)}</span>`
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
        <span>霍晞屬: ${escapeHtml(distanceLabel(shop))}</span>
        <span>蝟ｶ讌ｭ譎る俣: ${escapeHtml(hoursDetail(shop, status))}</span>
        <span>迴ｾ蝨ｨ: ${escapeHtml(currentStatusLabel(shop, status))}</span>
        <span>莠育ｮ・ ${budgetLabel(shop)}</span>
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
  return ["譛ｬ蜻ｽ", "縺九↑繧雁粋縺・◎縺・, "諢丞､悶→繧｢繝ｪ"][index] || "蛟呵｣・;
}

function sourceLabel(source) {
  if (source === "survey") return "縺雁ｺ励°繧峨・縺ｲ縺ｨ縺薙→";
  if (source === "public") return "蜈ｬ髢区ュ蝣ｱ縺九ｉ縺ｮ迚ｹ蠕ｴ";
  if (source === "demo") return "繝・Δ諠・ｱ";
  return "縺雁ｺ励・迚ｹ蠕ｴ";
}

function distanceLabel(shop) {
  if (shop.eventZone && shop.eventZone !== ACTIVE_EVENT_ZONE) {
    return `${shop.area || "蛻･繧ｨ繝ｪ繧｢"}繝ｻ譚ｾ謌ｸ鬧・捉霎ｺ縺九ｉ遘ｻ蜍輔≠繧柿;
  }
  if (shop.area && shop.walkMinutes > 0) return `${shop.area}繝ｻ莨壼ｴ縺九ｉ蠕呈ｭｩ${shop.walkMinutes}蛻・;
  if (shop.walkMinutes > 0) return `莨壼ｴ縺九ｉ蠕呈ｭｩ${shop.walkMinutes}蛻・;
  return shop.accessNote || shop.area || "霍晞屬諠・ｱ繧堤｢ｺ隱堺ｸｭ";
}

function hoursDetail(shop, status) {
  if (shop.hoursStatus === "needs_confirmation") return "譛譁ｰ縺ｮ蜈ｬ蠑乗ュ蝣ｱ縺ｧ遒ｺ隱・;
  return status.detail;
}

function currentStatusLabel(shop, status) {
  if (shop.hoursStatus === "needs_confirmation") return "蝟ｶ讌ｭ譎る俣縺ｯ隕∫｢ｺ隱・;
  return status.label;
}

function budgetLabel(shop) {
  if (!shop.budgetMin && !shop.budgetMax) return "蠎苓・縺ｧ遒ｺ隱・;
  if (!shop.budgetMax) return `${shop.budgetMin.toLocaleString()}蜀・彖;
  return `${shop.budgetMin.toLocaleString()}縲・{shop.budgetMax.toLocaleString()}蜀・;
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
  if (state.answers.people?.people === "large_group" && shop.sizeTag === "small_shop") return "莠句燕遒ｺ隱阪′蠢・ｦ・;
  if (shop.eventZone && shop.eventZone !== ACTIVE_EVENT_ZONE) return "雜ｳ繧貞ｻｶ縺ｰ縺吝呵｣・;
  if (!status.open && shop.hoursStatus === "needs_confirmation") return "蝟ｶ讌ｭ譎る俣縺ｯ隕∫｢ｺ隱・;
  if (!status.open) return "蝟ｶ讌ｭ譎ゅ・逶ｸ諤ｧ蛟呵｣・;
  if (shop.welcomeTags.includes("closing")) return "邱繧√↓縺翫☆縺吶ａ";
  if (shop.welcomeTags.includes("large_group_welcome")) return "繧ｰ繝ｫ繝ｼ繝怜髄縺・;
  if (shop.welcomeTags.includes("quiet_drink")) return "髱吶°縺ｫ鬟ｲ繧蜷代″";
  if (status.state === "soon") return "髢牙ｺ玲凾髢薙↓豕ｨ諢・;
  return "莉翫・豌怜・縺ｫ蜷医＞縺昴≧";
}

function recommendReason(shop, status, tags) {
  const labels = tags.map(tagLabel).filter(Boolean);
  const parts = [];
  if (labels.length) parts.push(`${labels.join("繝ｻ")}縺御ｻ翫・譚｡莉ｶ縺ｫ霑代＞`);
  if (shop.ownerCommentTags.some(tag => tags.includes(tag))) parts.push("蠎怜・縺ｮ豁楢ｿ弱＠縺溘＞螳｢螻､縺ｨ繧ょ粋縺｣縺ｦ縺・ｋ");
  if (shop.eventZone && shop.eventZone !== ACTIVE_EVENT_ZONE) parts.push("驕縺上※繧０K縺ｪ繧芽ｶｳ繧貞ｻｶ縺ｰ縺吩ｾ｡蛟､縺後≠繧・);
  if (status.open) parts.push("莉翫・譎る俣繧ょｯ・ｊ繧・☆縺・);
  if (!status.open && shop.hoursStatus !== "needs_confirmation") parts.push("迴ｾ蝨ｨ縺ｯ蝟ｶ讌ｭ譎る俣螟悶↑縺ｮ縺ｧ縲∝霧讌ｭ譌･譎ゅ・遒ｺ隱阪′蠢・ｦ・);
  if (!parts.length) return "遏･繧峨↑縺・ｺ励ｒ髢区挙縺励◆縺・↑繧峨い繝ｪ縲・;
  return `${parts.join("縲・)}縲ゅ∪縺ゅ∵が縺上↑縺・→諤昴≧縺槭Ａ;
}

function fallbackTags(shop) {
  return [...shop.welcomeTags, ...shop.moodTags, ...shop.atmosphereTags, ...shop.foodTags, ...shop.drinkTags];
}

function tagLabel(tag) {
  const labels = {
    party: "逶帙ｊ荳翫′繧・,
    lively: "縺ｫ縺弱ｄ縺・,
    group_fun: "繝ｯ繧､繝ｯ繧､",
    calm: "關ｽ縺｡逹縺・,
    quiet_drink: "髱吶°縺ｫ荳譚ｯ",
    slow_talk: "繧・▲縺上ｊ莨夊ｩｱ",
    hungry: "鬟滉ｺ矩㍾隕・,
    full_meal: "縺励▲縺九ｊ鬟滉ｺ・,
    light_drink: "霆ｽ縺城｣ｲ繧",
    first_round: "1霆堤岼",
    second_round: "2霆堤岼",
    third_round: "3霆堤岼莉･髯・,
    second_round_welcome: "2霆堤岼豁楢ｿ・,
    late_round_welcome: "驕・ａ豁楢ｿ・,
    group_welcome: "繧ｰ繝ｫ繝ｼ繝玲ｭ楢ｿ・,
    small_group_welcome: "蟆台ｺｺ謨ｰ豁楢ｿ・,
    large_group_welcome: "螟ｧ莠ｺ謨ｰ豁楢ｿ・,
    solo_welcome: "荳莠ｺ豁楢ｿ・,
    solo: "荳莠ｺ",
    pair: "莠御ｺｺ",
    small_group: "蟆台ｺｺ謨ｰ",
    large_group: "螟ｧ莠ｺ謨ｰ",
    pair_welcome: "莠御ｺｺ蜷代″",
    craft_beer: "繧ｯ繝ｩ繝輔ヨ繝薙・繝ｫ",
    beer: "繝薙・繝ｫ",
    local_beer: "蝨ｰ蜈・ン繝ｼ繝ｫ",
    sake: "譌･譛ｬ驟・,
    whisky: "繧ｦ繧､繧ｹ繧ｭ繝ｼ",
    shochu: "辟ｼ驟・,
    wine: "繝ｯ繧､繝ｳ",
    cocktail: "繧ｫ繧ｯ繝・Ν",
    meat: "閧画侭逅・,
    yakitori: "荳ｲ辟ｼ縺・,
    game_meat: "繧ｸ繝薙お",
    pizza: "繝斐じ",
    pasta: "繝代せ繧ｿ",
    italian: "繧､繧ｿ繝ｪ繧｢繝ｳ",
    chinese: "荳ｭ闖ｯ",
    gyoza: "鬢・ｭ・,
    seafood: "鬲壽侭逅・,
    vegetables: "驥手除譁咏炊",
    noodles: "邱繧・,
    closing: "邱繧・,
    snacks: "縺､縺ｾ縺ｿ",
    counter: "繧ｫ繧ｦ繝ｳ繧ｿ繝ｼ",
    table: "繝・・繝悶Ν",
    talk_owner: "蠎嶺ｸｻ縺ｨ莨夊ｩｱ",
    first_visit: "蛻晁ｨｪ蝠丞髄縺・,
    quick_finish: "繧ｵ繧ｯ繝・→",
    new_encounter: "譁ｰ隕城幕諡・,
    solo_time: "荳莠ｺ譎る俣",
    hidden: "遨ｴ蝣ｴ",
    romantic: "髮ｰ蝗ｲ豌鈴㍾隕・,
    stylish: "縺翫＠繧・ｌ",
    traditional: "譏斐↑縺後ｉ",
    homey: "繧｢繝・ヨ繝帙・繝",
    casual: "蜈･繧翫ｄ縺吶＞"
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
  await ponSay("繧医≧縲ゆｿｺ縺ｯ縺ｯ縺励＃繝昴Φ縲ょｺ玲爾縺励↑繧我ｻｻ縺帙ｍ縲・蝠上□縺台ｻ倥″蜷医∴縲ゅ■繧・ｓ縺ｨ逶ｸ諤ｧ繧定ｦ九ｋ縲・, "normal");
  await renderQuestion();
}

function startAppSafely() {
  startApp().catch(error => {
    console.error(error);
    toast("繧ゅ≧荳蠎ｦ隱ｭ縺ｿ霎ｼ縺ｿ逶ｴ縺励※縺上□縺輔＞");
  });
}

function renderRefineForm() {
  els.refineArea.hidden = false;
  els.refineArea.innerHTML = `
    <label for="refineInput">譚｡莉ｶ繧剃ｸ險雜ｳ縺呻ｼ井ｻｻ諢擾ｼ・/label>
    <textarea id="refineInput" class="request-input" maxlength="120" placeholder="萓具ｼ夐撕縺九↓隧ｱ縺帙ｋ蠎・/ 譌･譛ｬ驟・/ 邱繧√↓繝ｩ繝ｼ繝｡繝ｳ"></textarea>
    <button type="button" class="answer-button primary" id="refineSubmit">譚｡莉ｶ繧定ｶｳ縺励※驕ｸ縺ｳ逶ｴ縺・/button>
  `;
  els.refineArea.querySelector("#refineSubmit").addEventListener("click", () => {
    state.requestText = els.refineArea.querySelector("#refineInput").value.trim();
    if (!state.requestText) {
      toast("譚｡莉ｶ繧剃ｸ險蜈･繧後※縺上ｌ");
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
  toast("蛻･縺ｮ蛟呵｣懊ｒ蜃ｺ縺励◆縺・);
});

els.refineButton?.addEventListener("click", renderRefineForm);

document.querySelectorAll("[data-feedback]").forEach(button => {
  button.addEventListener("click", () => {
    const good = button.dataset.feedback === "good";
    setPonImage(good ? "satisfied" : "tired");
    els.feedbackImage.src = HASHIGOPON_IMAGES[good ? "satisfied" : "tired"];
    track("feedback", { value: good ? "good" : "bad" });
    toast(good ? "縺繧搾ｼ・讌ｽ縺励ｓ縺ｧ縺薙＞縲・ : "繧上′縺ｾ縺ｾ縺縺ｪ縲よ擅莉ｶ繧定ｶｳ縺励※縺ｿ繧阪・);
  });
});

if (els.profile && window.matchMedia("(min-width: 861px)").matches) els.profile.open = true;

startApp().catch(error => {
  console.error(error);
  addPonMessage("蠎苓・繝・・繧ｿ縺ｮ隱ｭ縺ｿ霎ｼ縺ｿ縺ｧ縺､縺ｾ縺壹＞縺溘ょ・髢狗畑繧ｵ繝ｼ繝舌・縺九ｉ髢九″逶ｴ縺励※縺上ｌ縲・, "tired");
});

