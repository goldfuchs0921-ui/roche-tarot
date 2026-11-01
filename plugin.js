
(function () {
  "use strict";

  const PLUGIN_ID = "roche-tarot";
  const APP_ID = "astral-tarot";

  const MAJOR_ARCANA = [
    ["愚者","THE FOOL","0","旅程、自由、新的可能"],
    ["魔术师","THE MAGICIAN","I","意志、行动、创造"],
    ["女祭司","THE HIGH PRIESTESS","II","直觉、秘密、未说出口的话"],
    ["皇后","THE EMPRESS","III","滋养、感情、丰盛"],
    ["皇帝","THE EMPEROR","IV","秩序、控制、责任"],
    ["教皇","THE HIEROPHANT","V","信仰、传统、价值观"],
    ["恋人","THE LOVERS","VI","吸引、选择、关系"],
    ["战车","THE CHARIOT","VII","决心、方向、克制"],
    ["力量","STRENGTH","VIII","勇气、温柔、内在力量"],
    ["隐者","THE HERMIT","IX","独处、思考、寻找答案"],
    ["命运之轮","WHEEL OF FORTUNE","X","变化、机遇、循环"],
    ["正义","JUSTICE","XI","事实、公平、判断"],
    ["倒吊人","THE HANGED MAN","XII","停顿、换位思考、牺牲"],
    ["死神","DEATH","XIII","结束、转变、新阶段"],
    ["节制","TEMPERANCE","XIV","平衡、耐心、融合"],
    ["恶魔","THE DEVIL","XV","欲望、束缚、依赖"],
    ["高塔","THE TOWER","XVI","动荡、真相、旧秩序崩塌"],
    ["星星","THE STAR","XVII","希望、疗愈、信任"],
    ["月亮","THE MOON","XVIII","迷雾、直觉、不确定"],
    ["太阳","THE SUN","XIX","坦诚、活力、清晰"],
    ["审判","JUDGEMENT","XX","觉醒、回顾、重新选择"],
    ["世界","THE WORLD","XXI","完成、整合、新的循环"]
  ];

  const SUITS = [
    ["权杖","WANDS","行动、热情、动力"],
    ["圣杯","CUPS","感情、关系、内心"],
    ["宝剑","SWORDS","思想、冲突、判断"],
    ["星币","PENTACLES","现实、稳定、物质"]
  ];

  const SYMBOLS = ["✧","☾","☼","♢","⚝","✦","♜","♧"];

  const CSS = `
    .at-app {
      --gold:#c9ad72;
      --gold2:#88754e;
      --ivory:#eee5d1;
      --muted:#9b9bad;
      --bg:#070a15;
      color:var(--ivory);
      background:
        radial-gradient(ellipse at 50% 5%,#202943 0%,transparent 46%),
        radial-gradient(ellipse at 90% 75%,#172039 0%,transparent 35%),
        var(--bg);
      min-height:100%;
      padding:18px 17px 35px;
      font-family:Georgia,"Times New Roman",serif;
      overflow:auto;
      position:relative;
      isolation:isolate;
      -webkit-font-smoothing:antialiased;
    }
    .at-app * {box-sizing:border-box}
    .at-app button,.at-app textarea,.at-app select {font:inherit}
    .at-app button {cursor:pointer;-webkit-tap-highlight-color:transparent}
    .at-app button:disabled {opacity:.45;cursor:wait}
    .at-stars {
      position:absolute;inset:0;z-index:-1;pointer-events:none;
      background-image:
       radial-gradient(1px 1px at 8% 8%,#fff 99%,transparent),
       radial-gradient(1px 1px at 72% 11%,#e4d4ac 99%,transparent),
       radial-gradient(1px 1px at 91% 24%,#fff 99%,transparent),
       radial-gradient(1px 1px at 18% 31%,#c9ad72 99%,transparent),
       radial-gradient(1px 1px at 61% 44%,#fff 99%,transparent),
       radial-gradient(1px 1px at 7% 66%,#d9c99f 99%,transparent),
       radial-gradient(1px 1px at 86% 71%,#fff 99%,transparent),
       radial-gradient(1px 1px at 37% 89%,#d9c99f 99%,transparent);
      opacity:.6;
    }
    .at-top {
      display:flex;align-items:center;justify-content:space-between;
      gap:10px;padding-bottom:14px;border-bottom:1px solid #c9ad7230;
    }
    .at-back,.at-small {
      color:var(--gold);background:#090d1c;
      border:1px solid #c9ad724d;border-radius:30px;
      padding:8px 12px;font:11px Arial,sans-serif;
    }
    .at-brand {font:10px Arial,sans-serif;letter-spacing:2.5px;color:var(--gold)}
    .at-heading {text-align:center;font-size:32px;font-weight:400;
      letter-spacing:2px;margin:27px 0 5px}
    .at-subtitle {text-align:center;color:#a5a5b5;font:9px/1.8 Arial,sans-serif;
      letter-spacing:1.8px}
    .at-divider {width:74px;height:1px;margin:17px auto 20px;
      background:linear-gradient(90deg,transparent,var(--gold),transparent)}
    .at-label {display:block;color:#c9bd9f;font:11px Arial,sans-serif;margin:17px 0 8px}
    .at-select,.at-question {
      width:100%;color:var(--ivory);background:#080c19e8;
      border:1px solid #c9ad7247;border-radius:10px;
      padding:12px;font:13px/1.65 Arial,sans-serif;outline:none;
    }
    .at-select {min-height:44px}
    .at-question {min-height:74px;resize:vertical}
    .at-select:focus,.at-question:focus {border-color:var(--gold)}
    .at-deck {display:flex;justify-content:center;perspective:1100px;
      margin:25px auto 20px;min-height:224px;align-items:center}
    .at-card {
      position:relative;width:146px;height:224px;
      transform-style:preserve-3d;
      transition:transform .85s cubic-bezier(.2,.72,.18,1);
      filter:drop-shadow(0 15px 22px #0008);
    }
    .at-card.is-flipped {transform:rotateY(180deg)}
    .at-face {
      position:absolute;inset:0;backface-visibility:hidden;
      -webkit-backface-visibility:hidden;border-radius:7px;
      padding:7px;border:1px solid var(--gold);
      background:linear-gradient(145deg,#27304a,#090d1b 58%,#242039);
    }
    .at-face-back {transform:rotateY(0deg)}
    .at-face-front {transform:rotateY(180deg)}
    .at-card-frame {
      height:100%;border:1px solid #c9ad7280;
      outline:1px solid #c9ad7220;outline-offset:-5px;
      display:flex;flex-direction:column;align-items:center;
      justify-content:space-between;padding:13px 8px;text-align:center;
      overflow:hidden;position:relative;
    }
    .at-card-frame:before,.at-card-frame:after {
      content:"";position:absolute;width:76px;height:76px;
      border:1px solid #c9ad7230;border-radius:50%;
      pointer-events:none;
    }
    .at-card-frame:before {top:38px;left:50%;transform:translateX(-50%)}
    .at-card-frame:after {top:47px;left:50%;transform:translateX(-50%);
      width:58px;height:58px}
    .at-card-caption {font:8px Arial,sans-serif;letter-spacing:1.8px;color:var(--gold)}
    .at-card-symbol {font-size:43px;color:#e3ca8d;
      text-shadow:0 0 20px #d2b46c60;z-index:1}
    .at-card-title {font-size:17px;color:#f1e4c3;letter-spacing:1px;z-index:1}
    .at-card-sub {font:8px Arial,sans-serif;letter-spacing:1.2px;color:#b5a579}
    .at-card-art {font-size:45px;line-height:1.3;color:#d7bd7d;
      text-shadow:0 0 25px #d2b46c50;z-index:1}
    .at-orbit {position:absolute;top:39px;left:50%;width:84px;height:84px;
      border:1px solid #c9ad7260;border-radius:50%;
      transform:translateX(-50%) rotate(-30deg)}
    .at-orbit:before {content:"";position:absolute;inset:9px;
      border:1px dashed #c9ad7260;border-radius:50%}
    .at-draw {
      width:100%;padding:14px 16px;border:1px solid #dfc68e;
      border-radius:30px;background:linear-gradient(110deg,#9e8249,#e0c995,#a88a50);
      color:#171523;font:600 12px Arial,sans-serif;letter-spacing:2px;
      box-shadow:0 5px 20px #0004;
    }
    .at-draw:active {transform:scale(.985)}
    .at-hint {text-align:center;color:#82869b;font:10px/1.7 Arial,sans-serif;margin-top:10px}
    .at-section {
      border:1px solid #c9ad7230;border-radius:12px;
      background:linear-gradient(145deg,#131a2bc9,#090d19e8);
      padding:16px;margin-top:17px;
    }
    .at-kicker {color:var(--gold);font:9px Arial,sans-serif;
      letter-spacing:2px;margin-bottom:10px}
    .at-result-title {font-size:23px;font-weight:400;margin:0 0 5px}
    .at-result-meta {font:10px Arial,sans-serif;color:#a6a5b6;margin-bottom:13px}
    .at-reading {font:13px/1.9 Arial,sans-serif;color:#d3d0d2;white-space:pre-wrap}
    .at-row {display:flex;gap:8px;margin-top:13px}
    .at-row button {flex:1}
    .at-option {
      background:#11182b;border:1px solid #c9ad7247;border-radius:9px;
      color:#e5d7b7;padding:11px 7px;font:11px Arial,sans-serif;
    }
    .at-option:active,.at-option.selected {border-color:var(--gold);background:#302941}
    .at-status {color:#c9ad72;font:11px/1.7 Arial,sans-serif;text-align:center;margin-top:12px}
    .at-dialogue {display:flex;flex-direction:column;gap:12px;margin-top:14px}
    .at-message {padding:13px;border-radius:10px;font:12px/1.8 Arial,sans-serif;
      white-space:pre-wrap;overflow-wrap:anywhere}
    .at-message.tarot {background:#191b2b;border:1px solid #c9ad723d}
    .at-message.char {background:#101c2a;border:1px solid #8298b033}
    .at-message.user {background:#272238;border:1px solid #c9ad7240}
    .at-speaker {font:9px Arial,sans-serif;letter-spacing:1.8px;color:var(--gold);margin-bottom:7px}
    .at-followup {display:flex;gap:8px;margin-top:13px}
    .at-followup input {flex:1;min-width:0;background:#080c19;color:var(--ivory);
      border:1px solid #c9ad7247;border-radius:9px;padding:11px;font:12px Arial,sans-serif}
    .at-send {background:#c9ad72;color:#151421;border:0;border-radius:9px;
      padding:0 15px;font:12px Arial,sans-serif}
    .at-foot {text-align:center;color:#777b91;font:9px/1.8 Arial,sans-serif;
      letter-spacing:1px;margin-top:26px}
    .at-loading {display:inline-block;animation:at-pulse 1.2s ease-in-out infinite}
    @keyframes at-pulse {50%{opacity:.35}}
    @media(prefers-reduced-motion:reduce) {
      .at-app * {animation:none!important;transition:none!important}
    }
  `;

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }

  function getName(char) {
    return char ? (char.handle || char.name || "未命名角色") : "角色";
  }

  function getPersona(char) {
    return char ? (char.persona || char.bio || "") : "";
  }

  function cardInfo(index) {
    if (index < 22) {
      const c = MAJOR_ARCANA[index];
      return {
        name:c[0], english:c[1], number:c[2],
        meaning:c[3], symbol:SYMBOLS[index % SYMBOLS.length]
      };
    }
    const n = index - 22;
    const suit = SUITS[Math.floor(n / 14)];
    const rank = n % 14;
    const ranks = ["王牌","二","三","四","五","六","七","八","九","十","侍从","骑士","王后","国王"];
    return {
      name:suit[0]+ranks[rank],
      english:ranks[rank].toUpperCase()+" OF "+suit[1],
      number:"",
      meaning:suit[2],
      symbol:SYMBOLS[(index + rank) % SYMBOLS.length]
    };
  }

  function createDeck() {
    return Array.from({length:78},(_,i)=>i);
  }

  function pickCard() {
    const index = Math.floor(Math.random()*78);
    const info = cardInfo(index);
    return Object.assign({},info,{
      reversed:Math.random()<0.5,
      index:index
    });
  }

  function makeCardMarkup(card) {
    if (!card) {
      return `
        <div class="at-card" id="at-card">
          <div class="at-face at-face-back">
            <div class="at-card-frame">
              <div class="at-card-caption">XVII · THE UNKNOWN</div>
              <div class="at-orbit"></div>
              <div class="at-card-symbol">✧</div>
              <div class="at-card-title">ASTRAL</div>
              <div class="at-card-sub">AS ABOVE, SO BELOW</div>
            </div>
          </div>
          <div class="at-face at-face-front">
            <div class="at-card-frame">
              <div class="at-card-caption" id="at-front-number">ARCANA</div>
              <div class="at-orbit"></div>
              <div class="at-card-art" id="at-front-symbol">☾</div>
              <div class="at-card-title" id="at-front-name">月亮</div>
              <div class="at-card-sub" id="at-front-english">THE MOON</div>
            </div>
          </div>
        </div>`;
    }
    return "";
  }

  async function createApp(container, roche) {
    let characters = [];
    let selectedChar = null;
    let currentCard = null;
    let busy = false;
    let round = 0;
    let dialogue = [];
    let cleaned = false;
    let savedHistory = [];

    const styleTag = document.createElement("style");
    styleTag.textContent = CSS;
    const root = document.createElement("div");
    root.className = "at-app";

    root.innerHTML = `
      <div class="at-stars"></div>
      <header class="at-top">
        <button class="at-back" id="at-back" type="button">← 返回</button>
        <span class="at-brand">ASTRAL · ARCANA</span>
        <button class="at-small" id="at-reset" type="button">新一局</button>
      </header>
      <h1 class="at-heading">Astral Tarot</h1>
      <div class="at-subtitle">THE UNIVERSE DOES NOT SPEAK IN CERTAINTIES</div>
      <div class="at-divider"></div>

      <label class="at-label" for="at-character">选择一位角色</label>
      <select class="at-select" id="at-character">
        <option value="">正在读取角色…</option>
      </select>

      <label class="at-label" for="at-question">你想询问关于 TA 的什么？</label>
      <textarea class="at-question" id="at-question"
        placeholder="例如：他此刻在想什么？"></textarea>

      <div class="at-deck" id="at-deck">${makeCardMarkup(null)}</div>
      <button class="at-draw" id="at-draw" type="button">洗牌 · 抽取命运之牌</button>
      <div class="at-hint">78 张牌 · 正位与逆位 · 每次抽牌都是新的解释</div>

      <section class="at-section" id="at-reading-section" hidden>
        <div class="at-kicker">I · THE READING</div>
        <h2 class="at-result-title" id="at-card-title"></h2>
        <div class="at-result-meta" id="at-card-meta"></div>
        <div class="at-reading" id="at-tarot-reading"></div>
      </section>

      <section class="at-section" id="at-dialogue-section" hidden>
        <div class="at-kicker">II · THE CONFRONTATION</div>
        <div class="at-dialogue" id="at-dialogue"></div>
        <div class="at-row">
          <button class="at-option" data-choice="tarot">支持塔罗</button>
          <button class="at-option" data-choice="char">支持角色</button>
          <button class="at-option" data-choice="question">继续追问</button>
        </div>
        <div class="at-followup" id="at-followup" hidden>
          <input id="at-followup-input" placeholder="输入你想追问的内容…">
          <button class="at-send" id="at-followup-send">发送</button>
        </div>
        <div class="at-status" id="at-status" aria-live="polite"></div>
      </section>

      <div class="at-foot">
        TAROT IS A MIRROR, NOT A VERDICT.<br>
        塔罗是一面镜子，不是最终判决。
      </div>
    `;

    container.replaceChildren(styleTag,root);

    const $ = s => root.querySelector(s);
    const charSelect = $("#at-character");
    const questionInput = $("#at-question");
    const drawButton = $("#at-draw");
    const dialogueBox = $("#at-dialogue");
    const statusBox = $("#at-status");
    const listeners = [];

    function listen(element,event,fn) {
      element.addEventListener(event,fn);
      listeners.push(()=>element.removeEventListener(event,fn));
    }

    function setStatus(text) {
      statusBox.textContent = text || "";
    }

    function addMessage(type,name,text) {
      const div = document.createElement("div");
      div.className = "at-message " + type;
      const speaker = document.createElement("div");
      speaker.className = "at-speaker";
      speaker.textContent = name;
      const content = document.createElement("div");
      content.textContent = text;
      div.append(speaker,content);
      dialogueBox.append(div);
      dialogueBox.scrollIntoView({behavior:"smooth",block:"nearest"});
      return div;
    }

    function setBusy(value) {
      busy = value;
      drawButton.disabled = value;
      $("#at-followup-send").disabled = value;
      root.querySelectorAll("[data-choice]").forEach(b=>b.disabled=value);
      drawButton.textContent = value ? "星象正在显现…" :
        (currentCard ? "再抽一张" : "洗牌 · 抽取命运之牌");
    }

    function getAIText(result) {
      if (result && typeof result.text === "string") return result.text.trim();
      return "";
    }

    async function askAI(systemPrompt,userPrompt) {
      if (!roche || !roche.ai || typeof roche.ai.chat !== "function") {
        throw new Error("Roche AI 接口不可用，请检查插件权限和当前 AI 配置。");
      }
      const result = await roche.ai.chat({
        messages:[
          {role:"system",content:systemPrompt},
          {role:"user",content:userPrompt}
        ],
        temperature:0.85
      });
      const answer = getAIText(result);
      if (!answer) throw new Error("AI 没有返回可用的文字。");
      return answer;
    }

    async function loadCharacters() {
      try {
        characters = await roche.character.list();
        if (!Array.isArray(characters)) characters = [];
        charSelect.replaceChildren();
        const first = document.createElement("option");
        first.value = "";
        first.textContent = characters.length ? "选择你想占卜的角色" : "没有读取到角色";
        charSelect.append(first);

        characters.forEach(char=>{
          const opt = document.createElement("option");
          opt.value = char.id;
          opt.textContent = getName(char);
          charSelect.append(opt);
        });

        const stored = await roche.storage.get("selectedCharacter");
        if (stored && characters.some(c=>c.id===stored)) {
          charSelect.value = stored;
          selectedChar = characters.find(c=>c.id===stored);
        }
      } catch (error) {
        charSelect.innerHTML = '<option value="">读取角色失败</option>';
        setStatus("无法读取角色列表："+(error.message||"未知错误"));
      }
    }

    async function changeCharacter() {
      const id = charSelect.value;
      selectedChar = characters.find(c=>c.id===id)||null;
      if (selectedChar) {
        await roche.storage.set("selectedCharacter",selectedChar.id);
      }
    }

    function updateCardFace(card) {
      $("#at-front-number").textContent =
        (card.number ? card.number+" · " : "")+card.english;
      $("#at-front-symbol").textContent = card.symbol;
      $("#at-front-name").textContent = card.name;
      $("#at-front-english").textContent =
        card.reversed ? "REVERSED · 逆位" : "UPRIGHT · 正位";
    }

    async function draw() {
      if (busy) return;
      if (!selectedChar) {
        setStatus("请先选择一位角色。");
        return;
      }
      const question = questionInput.value.trim();
      if (!question) {
        setStatus("先写下你想询问的问题。");
        questionInput.focus();
        return;
      }

      setBusy(true);
      setStatus("正在洗牌，星象尚未给出答案……");
      $("#at-reading-section").hidden=true;
      $("#at-dialogue-section").hidden=true;
      dialogueBox.replaceChildren();
      dialogue=[];
      round++;
      currentCard=pickCard();

      const cardElement=$("#at-card");
      cardElement.classList.remove("is-flipped");
      cardElement.style.transform="translateY(-7px) rotateZ(-3deg)";

      await new Promise(resolve=>setTimeout(resolve,260));
      if (cleaned) return;
      cardElement.style.transform="translateY(0) rotateZ(2deg)";
      await new Promise(resolve=>setTimeout(resolve,240));
      if (cleaned) return;
      cardElement.style.transform="translateY(0) rotateZ(0)";
      updateCardFace(currentCard);

      await new Promise(resolve=>setTimeout(resolve,100));
      if (cleaned) return;
      cardElement.classList.add("is-flipped");

      $("#at-card-title").textContent=currentCard.name;
      $("#at-card-meta").textContent=
        currentCard.english+"  ·  "+(currentCard.reversed?"逆位":"正位");
      $("#at-reading-section").hidden=false;
      $("#at-tarot-reading").textContent="正在解读牌面……";
      $("#at-dialogue-section").hidden=false;
      setStatus("塔罗正在解读。角色尚未作出回应。");

      try {
        const charName=getName(selectedChar);
        const persona=getPersona(selectedChar);
        const userPersona=await roche.persona.getActiveUserPersona().catch(()=>null);
        const userPersonaText=userPersona ?
          (userPersona.persona||userPersona.bio||"") : "";

        const tarotSystem = `
你是 Astral Tarot，一位独立的塔罗解读者。
你的气质：客观、神秘、冷静、克制，像一位观察星象的古老审判者。
你不迎合提问者，不偏袒角色，也不为了戏剧性制造嫉妒、谎言、秘密或爱情结论。
你依据经典塔罗象征、正逆位和问题进行解读。
你不能把塔罗当作读取现实人物内心的绝对证据。请区分牌面象征、可能解释和无法确认的事实。
如果有多种合理解释，可以明确列出两种可能。
你的语言有意象但不空泛，不堆砌玄学术语，不写固定套话。
每次回答约 120 至 220 个中文字。
不要替角色说话，不要模仿角色，不要预判角色会如何回应。
`;

        const tarotPrompt = `
提问者的问题：${question}
被询问的角色：${charName}
牌面：${currentCard.name}（${currentCard.english}）
牌位：${currentCard.reversed?"逆位":"正位"}
象征关键词：${currentCard.meaning}

请解释这张牌如何回应问题。
先说明牌面象征，再结合当前问题解释可能性。
最后指出这张牌无法证实什么。
不要把关键词直接拼成一段泛泛的说明。
`;

        const tarotText=await askAI(tarotSystem,tarotPrompt);
        if (cleaned) return;
        $("#at-tarot-reading").textContent=tarotText;
        addMessage("tarot","🔮 ASTRAL TAROT",tarotText);
        dialogue.push({speaker:"tarot",text:tarotText});

        setStatus(charName+" 正在看到这次解读……");

        const charSystem = `
你正在扮演角色本人，不是塔罗解读者。
你必须以以下人设为第一依据，保持自己的性格、背景、信念、语言习惯、关系状态和价值观。
角色可以相信、怀疑或拒绝塔罗，判断必须来自人设和背景，不要套用统一的傲娇或恋爱套路。
角色知道自己在参与一场塔罗游戏，也知道塔罗刚才说了什么，但不必认同它。
你可以承认部分内容、反驳、要求证据、沉默、回避、质疑塔罗的解释，或者反过来询问用户。
不要为了配合游戏而泄露角色必然不愿说的秘密。不要把所有否认都写成口是心非。
不要声称知道自己人设之外的事实。
用角色自己的口吻直接回应刚才的塔罗解读，不要复述整段解读。
只输出角色说的话，不要写旁白、分析过程或括号内的心理描写。
`;

        const charPrompt = `
【角色姓名】
${charName}

【角色人设与背景】
${persona||"没有提供详细人设。请保持自然、谨慎，不要凭空添加背景。"}

【用户人设（如有）】
${userPersonaText||"没有提供用户人设。"}

【用户的问题】
${question}

【抽到的牌】
${currentCard.name}，${currentCard.reversed?"逆位":"正位"}。

【塔罗的独立解读】
${tarotText}

请以角色自己的立场作出回应。角色是否相信塔罗，要依据自己的世界观决定。
`;

        const charText=await askAI(charSystem,charPrompt);
        if (cleaned) return;
        addMessage("char",charName,charText);
        dialogue.push({speaker:"char",text:charText});
        setStatus("你可以选择立场，或者继续追问。");
        await saveRound(question);
      } catch (error) {
        if (!cleaned) {
          setStatus("本轮未能完成："+(error.message||"未知错误")+"。可以检查 AI 配置后重试。");
          addMessage("user","系统提示",
            "AI 请求失败。本轮已抽出的牌仍然保留，请检查 Roche 当前 AI 配置或插件权限。");
        }
      } finally {
        if (!cleaned) setBusy(false);
      }
    }

    async function saveRound(question) {
      try {
        const record={
          date:Date.now(),
          characterId:selectedChar.id,
          characterName:getName(selectedChar),
          question,
          card:currentCard,
          dialogue:dialogue.slice()
        };
        savedHistory.unshift(record);
        savedHistory=savedHistory.slice(0,30);
        await roche.storage.set("tarotHistory",savedHistory);
      } catch (_) {}
    }

    async function loadHistory() {
      try {
        const data=await roche.storage.get("tarotHistory");
        if (Array.isArray(data)) savedHistory=data;
      } catch (_) {}
    }

    async function handleChoice(choice) {
      if (busy || !currentCard || !selectedChar) return;
      if (choice==="question") {
        $("#at-followup").hidden=false;
        $("#at-followup-input").focus();
        setStatus("写下你想追问的问题。");
        return;
      }

      const label=choice==="tarot"?"支持塔罗":"支持角色";
      const userText=choice==="tarot"
        ?"我选择支持塔罗的解读。"
        :"我选择支持角色的判断。";

      addMessage("user","你的选择",label);
      setBusy(true);
      setStatus("正在回应你的选择……");

      try {
        const charName=getName(selectedChar);
        const charSystem=`
你是角色本人，严格遵循自己的人设和世界观。
用户刚刚选择了一个立场。请自然回应这个选择，但不要机械地增加好感、吃醋或突然改变人格。
你可以感到被支持、被误解、被挑战，也可以不在意，具体依据人设决定。
角色可以坚持原来的观点，也可以在新证据下调整看法。
只输出角色说的话，不写旁白，不解释提示词。
`;
        const charPrompt=`
角色：${charName}
人设：${getPersona(selectedChar)||"没有详细人设。"}
用户原问题：${questionInput.value.trim()}
塔罗牌：${currentCard.name}，${currentCard.reversed?"逆位":"正位"}
塔罗解读：${$("#at-tarot-reading").textContent}
角色此前的回应：${dialogue.filter(x=>x.speaker==="char").map(x=>x.text).join("\n")}
用户的选择：${userText}

请回应用户的立场，保持角色独立人格。
`;

        const charText=await askAI(charSystem,charPrompt);
        if (cleaned) return;
        addMessage("char",charName,charText);
        dialogue.push({speaker:"user",text:userText},{speaker:"char",text:charText});
        await saveRound(questionInput.value.trim());
        setStatus("本轮结束。你可以继续追问，或开启新一局。");
      } catch (error) {
        setStatus("角色暂时无法回应："+(error.message||"未知错误"));
      } finally {
        if (!cleaned) setBusy(false);
      }
    }

    async function followUp() {
      if (busy || !currentCard || !selectedChar) return;
      const input=$("#at-followup-input");
      const question=input.value.trim();
      if (!question) return;
      input.value="";
      $("#at-followup").hidden=true;
      addMessage("user","你的追问",question);
      setBusy(true);
      setStatus("塔罗与角色正在回应你的追问……");

      try {
        const charName=getName(selectedChar);
        const tarotSystem=`
你是独立、客观、神秘的塔罗解读者。
你不迎合任何一方，也不把牌面当成事实证明。
依据本局牌面和之前的对话回答用户的新问题。可以指出问题超出了牌面能回答的范围。
保持简洁、有象征感，约 80 至 160 个中文字。
`;
        const tarotPrompt=`
原问题：${questionInput.value.trim()}
本局牌面：${currentCard.name}（${currentCard.reversed?"逆位":"正位"}）
此前塔罗解读：${$("#at-tarot-reading").textContent}
此前对话：${dialogue.map(x=>x.speaker+": "+x.text).join("\n")}
用户的新追问：${question}
请以塔罗身份回应。
`;
        const tarotText=await askAI(tarotSystem,tarotPrompt);
        if (cleaned) return;
        addMessage("tarot","🔮 ASTRAL TAROT",tarotText);
        dialogue.push({speaker:"tarot",text:tarotText});

        const charSystem=`
你是角色本人。严格遵守自己的人设、背景、信念和语言习惯。
你知道这是塔罗游戏，但不必相信塔罗。不要自动傲娇、吃醋或承认任何猜测。
根据之前的对话和用户追问自然回应，只输出角色说的话。
`;
        const charPrompt=`
角色：${charName}
人设：${getPersona(selectedChar)||"没有详细人设。"}
用户原问题：${questionInput.value.trim()}
本局牌面：${currentCard.name}（${currentCard.reversed?"逆位":"正位"}）
此前对话：${dialogue.map(x=>x.speaker+": "+x.text).join("\n")}
用户追问：${question}
塔罗最新回应：${tarotText}
请让角色独立回应塔罗和用户，不要机械复述。
`;
        const charText=await askAI(charSystem,charPrompt);
        if (cleaned) return;
        addMessage("char",charName,charText);
        dialogue.push({speaker:"char",text:charText});
        await saveRound(questionInput.value.trim());
        setStatus("对话已继续。你可以再次选择立场或追问。");
      } catch (error) {
        setStatus("追问未能完成："+(error.message||"未知错误"));
      } finally {
        if (!cleaned) setBusy(false);
      }
    }

    function resetRound() {
      if (busy) return;
      currentCard=null;
      dialogue=[];
      round=0;
      questionInput.value="";
      $("#at-reading-section").hidden=true;
      $("#at-dialogue-section").hidden=true;
      dialogueBox.replaceChildren();
      const card=$("#at-card");
      card.classList.remove("is-flipped");
      card.style.transform="";
      setStatus("");
      drawButton.textContent="洗牌 · 抽取命运之牌";
    }

    listen($("#at-back"),"click",()=>roche.ui.closeApp());
    listen($("#at-reset"),"click",resetRound);
    listen(charSelect,"change",changeCharacter);
    listen(drawButton,"click",draw);
    listen($("#at-followup-send"),"click",followUp);
    listen($("#at-followup-input"),"keydown",event=>{
      if (event.key==="Enter") followUp();
    });
    root.querySelectorAll("[data-choice]").forEach(button=>{
      listen(button,"click",()=>handleChoice(button.dataset.choice));
    });

    await loadHistory();
    await loadCharacters();

    return function cleanup() {
      cleaned=true;
      listeners.forEach(fn=>fn());
      container.replaceChildren();
    };
  }

  if (!window.RochePlugin ||
      typeof window.RochePlugin.register!=="function") {
    console.error("[Astral Tarot] RochePlugin.register is unavailable.");
    return;
  }

  window.RochePlugin.register({
    id:PLUGIN_ID,
    name:"Astral Tarot",
    version:"1.1.0",
    apps:[{
      id:APP_ID,
      name:"Astral Tarot",
      icon:"✧",
      async mount(container,roche) {
        await createApp(container,roche);
      },
      async unmount(container) {
        container.replaceChildren();
      }
    }]
  });
})();
