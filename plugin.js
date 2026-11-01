
(function () {
  "use strict";

  const PLUGIN_ID = "roche-tarot";

  const style = `
    .astral-tarot {
      --gold: #c9ad72;
      --muted-gold: #81704d;
      --ink: #080b18;
      --panel: rgba(18, 23, 43, .86);
      color: #eee8dc;
      font-family: Georgia, "Times New Roman", serif;
      min-height: 100%;
      box-sizing: border-box;
      background:
        radial-gradient(ellipse at 50% 20%, #202746 0%, transparent 52%),
        radial-gradient(ellipse at 10% 85%, #182139 0%, transparent 42%),
        #080b18;
      padding: 22px 18px 32px;
      position: relative;
      overflow: auto;
      isolation: isolate;
    }

    .astral-tarot * { box-sizing: border-box; }

    .astral-tarot .at-stars {
      position: absolute;
      inset: 0;
      z-index: -1;
      pointer-events: none;
      background-image:
        radial-gradient(1px 1px at 8% 12%, #e7d7aa 99%, transparent),
        radial-gradient(1px 1px at 76% 8%, #fff 99%, transparent),
        radial-gradient(1px 1px at 91% 28%, #d8c79e 99%, transparent),
        radial-gradient(1px 1px at 19% 38%, #fff 99%, transparent),
        radial-gradient(1px 1px at 65% 48%, #c9ad72 99%, transparent),
        radial-gradient(1px 1px at 11% 71%, #fff 99%, transparent),
        radial-gradient(1px 1px at 83% 81%, #d8c79e 99%, transparent),
        radial-gradient(1px 1px at 43% 91%, #fff 99%, transparent);
      opacity: .72;
    }

    .astral-tarot .at-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(201,173,114,.25);
      padding-bottom: 15px;
      gap: 12px;
    }

    .astral-tarot .at-back {
      border: 1px solid rgba(201,173,114,.45);
      color: var(--gold);
      background: rgba(8,11,24,.6);
      border-radius: 30px;
      padding: 8px 13px;
      font: 12px Arial, sans-serif;
    }

    .astral-tarot .at-mark {
      color: var(--gold);
      font-size: 11px;
      letter-spacing: 3px;
    }

    .astral-tarot .at-heading {
      text-align: center;
      margin: 36px 0 8px;
      font-size: clamp(27px, 7vw, 36px);
      font-weight: normal;
      letter-spacing: 3px;
    }

    .astral-tarot .at-subtitle {
      text-align: center;
      color: #a8a9ba;
      font: 11px/1.8 Arial, sans-serif;
      letter-spacing: 2px;
    }

    .astral-tarot .at-divider {
      width: 76px;
      margin: 20px auto;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--gold), transparent);
    }

    .astral-tarot .at-question-label {
      display: block;
      color: #c9bd9f;
      font: 12px Arial, sans-serif;
      margin: 24px 0 10px;
    }

    .astral-tarot .at-question {
      display: block;
      width: 100%;
      min-height: 82px;
      resize: vertical;
      border: 1px solid rgba(201,173,114,.35);
      border-radius: 12px;
      padding: 14px;
      color: #f1eadc;
      background: rgba(7,10,22,.72);
      font: 14px/1.7 Arial, sans-serif;
      outline: none;
    }

    .astral-tarot .at-question:focus {
      border-color: var(--gold);
    }

    .astral-tarot .at-deck {
      display: flex;
      justify-content: center;
      margin: 27px 0 22px;
      perspective: 800px;
    }

    .astral-tarot .at-card {
      width: 142px;
      height: 230px;
      border: 1px solid var(--gold);
      border-radius: 7px;
      padding: 7px;
      background: linear-gradient(145deg, #202945, #0b1021 65%, #25203a);
      box-shadow: 0 14px 36px #0008, 0 0 22px #c9ad7210;
      transition: transform .45s ease, box-shadow .45s ease;
    }

    .astral-tarot .at-card-inner {
      height: 100%;
      border: 1px solid rgba(201,173,114,.52);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      padding: 16px 8px;
      text-align: center;
    }

    .astral-tarot .at-sigil {
      color: var(--gold);
      font-size: 35px;
      line-height: 1;
      margin-top: 12px;
      text-shadow: 0 0 18px #c9ad7240;
    }

    .astral-tarot .at-card-caption {
      color: #b6a77f;
      font-size: 9px;
      letter-spacing: 2px;
    }

    .astral-tarot .at-card-name {
      font-size: 17px;
      letter-spacing: 2px;
      color: #f0dfb6;
    }

    .astral-tarot .at-draw {
      display: block;
      width: 100%;
      border: 1px solid var(--gold);
      border-radius: 30px;
      padding: 14px 18px;
      background: linear-gradient(110deg, #b59a60, #e0c994, #a98a50);
      color: #151522;
      font: 600 13px Arial, sans-serif;
      letter-spacing: 2px;
      box-shadow: 0 5px 20px #0004;
    }

    .astral-tarot .at-draw:active {
      transform: scale(.98);
    }

    .astral-tarot .at-result {
      margin-top: 22px;
      padding: 19px;
      border: 1px solid rgba(201,173,114,.28);
      border-radius: 12px;
      background: var(--panel);
      text-align: center;
      animation: at-appear .5s ease both;
    }

    .astral-tarot .at-result-title {
      color: var(--gold);
      font-size: 19px;
      margin-bottom: 12px;
    }

    .astral-tarot .at-result-text {
      color: #c4c4cf;
      font: 13px/1.8 Arial, sans-serif;
    }

    .astral-tarot .at-foot {
      margin-top: 30px;
      text-align: center;
      color: #77798d;
      font: 10px/1.8 Arial, sans-serif;
      letter-spacing: 1px;
    }

    @keyframes at-appear {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (prefers-reduced-motion: reduce) {
      .astral-tarot *, .astral-tarot *::before,
      .astral-tarot *::after {
        animation: none !important;
        transition: none !important;
      }
    }
  `;

  const cards = [
    {
      name: "THE MOON",
      cn: "月亮",
      symbol: "☾",
      text: "月亮象征尚未明朗的情绪、直觉与不确定性。眼前的答案可能还藏在迷雾之中。"
    },
    {
      name: "THE STAR",
      cn: "星星",
      symbol: "✧",
      text: "星星象征希望、信任与慢慢恢复的力量。给彼此一点空间，也许会看见新的可能。"
    },
    {
      name: "THE HERMIT",
      cn: "隐者",
      symbol: "♙",
      text: "隐者象征独处、思考与内在探索。沉默不一定代表拒绝，也可能意味着一个人需要时间整理自己。"
    },
    {
      name: "THE LOVERS",
      cn: "恋人",
      symbol: "♡",
      text: "恋人象征吸引、选择与关系中的坦诚。真正重要的，可能是双方愿意如何面对彼此。"
    },
    {
      name: "THE HIGH PRIESTESS",
      cn: "女祭司",
      symbol: "☽",
      text: "女祭司象征直觉、秘密与尚未说出口的话。不要急着替对方下结论，留意那些尚未得到证实的部分。"
    },
    {
      name: "JUSTICE",
      cn: "正义",
      symbol: "⚖",
      text: "正义象征事实、判断与平衡。试着把猜测和已经确认的事情分开，再决定自己相信什么。"
    }
  ];

  function createApp(container, roche) {
    const root = document.createElement("div");
    root.className = "astral-tarot";

    const styleTag = document.createElement("style");
    styleTag.textContent = style;

    root.innerHTML = `
      <div class="at-stars"></div>
      <header class="at-top">
        <button class="at-back" type="button">← 返回</button>
        <span class="at-mark">ASTRAL · ARCANA</span>
      </header>

      <h1 class="at-heading">Astral Tarot</h1>
      <div class="at-subtitle">THE UNIVERSE DOES NOT SPEAK IN CERTAINTIES</div>
      <div class="at-divider"></div>

      <label class="at-question-label" for="at-question">
        你想询问关于 TA 的什么？
      </label>
      <textarea
        class="at-question"
        id="at-question"
        placeholder="例如：此刻，他在想什么？"
      ></textarea>

      <div class="at-deck">
        <div class="at-card">
          <div class="at-card-inner">
            <div class="at-card-caption">XVII · THE UNKNOWN</div>
            <div class="at-sigil">✧</div>
            <div class="at-card-name">✦</div>
            <div class="at-card-caption">AS ABOVE, SO BELOW</div>
          </div>
        </div>
      </div>

      <button class="at-draw" type="button">抽取一张牌</button>
      <div class="at-result" hidden>
        <div class="at-result-title"></div>
        <div class="at-result-text"></div>
      </div>

      <footer class="at-foot">
        TAROT IS A MIRROR, NOT A VERDICT.<br>
        塔罗是一面镜子，不是最终判决。
      </footer>
    `;

    container.replaceChildren(styleTag, root);

    const closeButton = root.querySelector(".at-back");
    const drawButton = root.querySelector(".at-draw");
    const questionInput = root.querySelector(".at-question");
    const cardBox = root.querySelector(".at-card");
    const cardName = root.querySelector(".at-card-name");
    const cardSigil = root.querySelector(".at-sigil");
    const cardCaption = root.querySelector(".at-card-caption");
    const result = root.querySelector(".at-result");
    const resultTitle = root.querySelector(".at-result-title");
    const resultText = root.querySelector(".at-result-text");

    let lastIndex = -1;

    function closeApp() {
      if (roche && roche.ui &&
          typeof roche.ui.closeApp === "function") {
        roche.ui.closeApp();
      }
    }

    function drawCard() {
      let index = Math.floor(Math.random() * cards.length);

      if (cards.length > 1 && index === lastIndex) {
        index = (index + 1) % cards.length;
      }

      lastIndex = index;
      const card = cards[index];

      cardBox.style.transform = "rotateY(90deg) scale(.92)";

      window.setTimeout(() => {
        if (!root.isConnected) return;

        cardCaption.textContent = card.name;
        cardName.textContent = card.cn;
        cardSigil.textContent = card.symbol;
        cardBox.style.transform = "rotateY(0deg) scale(1)";

        resultTitle.textContent = card.cn + " · " + card.name;
        resultText.textContent = card.text;
        result.hidden = false;
        drawButton.textContent = "再抽一张";
      }, 220);
    }

    closeButton.addEventListener("click", closeApp);
    drawButton.addEventListener("click", drawCard);

    return function cleanup() {
      closeButton.removeEventListener("click", closeApp);
      drawButton.removeEventListener("click", drawCard);
      container.replaceChildren();
    };
  }

  if (!window.RochePlugin ||
      typeof window.RochePlugin.register !== "function") {
    console.error(
      "[Astral Tarot] RochePlugin.register is unavailable."
    );
    return;
  }

  window.RochePlugin.register({
    id: PLUGIN_ID,
    name: "Astral Tarot",
    version: "1.0.0",
    apps: [
      {
        id: "astral-tarot",
        name: "Astral Tarot",
        icon: "✧",
        async mount(container, roche) {
          createApp(container, roche);
        },
        async unmount(container) {
          container.replaceChildren();
        }
      }
    ]
  });
})();

