/* 塔罗桌 · Roche 插件 v1.0.1
 * 玩法：问牌（user 问 char 的事 → 塔罗解读 → char 反驳）/ 自占（char 自己抽牌占自己）
 * 数据：全部存在 roche.storage（卸载插件会自动清理）；只有你确认后才会写入 Roche 主事实记忆
 */
(function () {
  "use strict";
  if (!window.RochePlugin || typeof window.RochePlugin.register !== "function") {
    console.error("[tarot-table] 找不到 window.RochePlugin，当前环境不是 Roche。");
    return;
  }

  var PLUGIN_ID = "tarot-table";
  var APP_ID = "tarot-table-home";
  var ROOT = "roche-plugin-tarot-table";
  var STYLE_ID = "roche-plugin-tarot-table-style";
  var ctx = null; // 当前这次 mount 的运行环境

  /* ============ 牌组：78 张 ============ */
  var MAJOR = ["愚者","魔术师","女祭司","皇后","皇帝","教皇","恋人","战车","力量","隐者","命运之轮","正义","倒吊人","死神","节制","恶魔","高塔","星星","月亮","太阳","审判","世界"];
  var ROMAN = ["0","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX","XXI"];
  var SUITS = [["权杖","✦"],["圣杯","❖"],["宝剑","†"],["星币","◈"]];
  var RANKS = ["王牌","二","三","四","五","六","七","八","九","十","侍从","骑士","王后","国王"];
  var COURT = ["P","N","Q","K"];

  function buildDeck() {
    var d = MAJOR.map(function (n, i) { return { name: n, num: ROMAN[i], sym: "✧" }; });
    SUITS.forEach(function (s) {
      RANKS.forEach(function (r, i) {
        d.push({ name: s[0] + r, num: i < 10 ? String(i + 1) : COURT[i - 10], sym: s[1] });
      });
    });
    return d;
  }
  function rnd(n) {
    if (window.crypto && crypto.getRandomValues) {
      var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n;
    }
    return Math.floor(Math.random() * n);
  }
  function drawCards(n) {
    var d = buildDeck();
    for (var i = d.length - 1; i > 0; i--) {
      var j = rnd(i + 1), t = d[i]; d[i] = d[j]; d[j] = t;
    }
    return d.slice(0, n).map(function (c) { c.rev = rnd(2) === 1; return c; });
  }

  /* ============ 小工具 ============ */
  function h(tag, props) {
    var el = document.createElement(tag);
    if (props) for (var k in props) {
      var v = props[k];
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
      else if (v != null && v !== false) el.setAttribute(k, v === true ? "" : v);
    }
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) return c.forEach(function (x) { append(el, x); });
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  function later(fn, ms) {
    var id = setTimeout(function () { ctx && ctx.timers.delete(id); fn(); }, ms);
    ctx.timers.add(id); return id;
  }
  function sleep(ms) { return new Promise(function (r) { later(r, ms); }); }
  function dispName(c) { return (c && (c.handle || c.name)) || "char"; }
  function avatarEl(url, name, cls) {
    var el = h("div", { class: "av " + (cls || "") });
    if (url) el.style.backgroundImage = 'url("' + String(url).replace(/"/g, "%22") + '")';
    else el.textContent = String(name || "?").slice(0, 1);
    return el;
  }
  function seg(opts, value, onChange) {
    return h("div", { class: "seg" }, opts.map(function (o) {
      return h("button", { class: o[0] === value ? "on" : "", onclick: function () { onChange(o[0]); } }, o[1]);
    }));
  }

  /* ============ 样式（& 会被替换成根 class） ============ */
  var CSS = [
"&{position:relative;width:100%;height:100%;overflow:hidden;color:#e9e4f7;background:#05041a;font-family:'Songti SC','STSong','Noto Serif SC','Source Han Serif SC','Cormorant Garamond',Georgia,serif;-webkit-tap-highlight-color:transparent;--gold:#d9b66a;--gold2:#f3dca0;--mute:#9a92bd}",
"& *{box-sizing:border-box}",
"& .bg{position:absolute;inset:0;background:linear-gradient(165deg,#05041a 0%,#150c36 55%,#09071f 100%)}",
"& .neb{position:absolute;inset:0;overflow:hidden;pointer-events:none}",
"& .neb i{position:absolute;width:90vmax;height:90vmax;border-radius:50%;will-change:transform}",
"& .neb i:nth-child(1){left:-40vmax;top:-30vmax;background:radial-gradient(circle,rgba(110,70,230,.5),transparent 62%);animation:tt-d1 38s ease-in-out infinite alternate}",
"& .neb i:nth-child(2){right:-45vmax;top:10vmax;background:radial-gradient(circle,rgba(40,90,210,.42),transparent 62%);animation:tt-d2 46s ease-in-out infinite alternate}",
"& .neb i:nth-child(3){left:-20vmax;bottom:-50vmax;background:radial-gradient(circle,rgba(190,90,200,.30),transparent 62%);animation:tt-d3 52s ease-in-out infinite alternate}",
"@keyframes tt-d1{to{transform:translate3d(18vmax,12vmax,0) scale(1.15)}}",
"@keyframes tt-d2{to{transform:translate3d(-22vmax,8vmax,0) scale(.9)}}",
"@keyframes tt-d3{to{transform:translate3d(20vmax,-14vmax,0) scale(1.2)}}",
"& canvas.sky{position:absolute;inset:0;width:100%;height:100%}",
"& .layer{position:absolute;inset:0}",
"& .scr{position:absolute;inset:0;display:flex;flex-direction:column;padding:calc(env(safe-area-inset-top,0px) + 12px) 18px calc(env(safe-area-inset-bottom,0px) + 14px);overflow-y:auto;overflow-x:hidden;animation:tt-in .5s ease both}",
"@keyframes tt-in{from{opacity:0}to{opacity:1}}",
"& .top{display:flex;align-items:center;gap:10px;min-height:40px}",
"& .top .sp{flex:1}",
"& .back{width:38px;height:38px;border-radius:50%;border:1px solid rgba(217,182,106,.4);background:rgba(255,255,255,.04);color:var(--gold2);font-size:20px;line-height:1;cursor:pointer;transition:transform .15s,background .2s}",
"& .back:active{transform:scale(.92)}",
"& .title{text-align:center;margin:22px 0 4px;font-size:34px;letter-spacing:.42em;padding-left:.42em;font-weight:600;background:linear-gradient(180deg,#fff3cf,#d9b66a 60%,#a98440);-webkit-background-clip:text;background-clip:text;color:transparent}",
"& .sub{text-align:center;color:var(--mute);font-size:13px;letter-spacing:.12em;margin-bottom:22px}",
"& .sec{margin:14px 0 6px;color:var(--gold);font-size:13px;letter-spacing:.14em}",
"& .chars{display:flex;gap:12px;overflow-x:auto;padding:6px 2px 10px;scrollbar-width:none}",
"& .chars::-webkit-scrollbar{display:none}",
"& .ch{flex:0 0 auto;width:66px;text-align:center;cursor:pointer;opacity:.55;transition:opacity .25s,transform .25s}",
"& .ch.on{opacity:1;transform:translateY(-2px)}",
"& .ch .av{width:54px;height:54px;margin:0 auto 6px;border:1.5px solid rgba(217,182,106,.25);transition:border-color .25s,box-shadow .25s}",
"& .ch.on .av{border-color:var(--gold);box-shadow:0 0 18px rgba(217,182,106,.45)}",
"& .chn{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
"& .av{border-radius:50%;background:#2a1b57 center/cover no-repeat;display:flex;align-items:center;justify-content:center;color:var(--gold2);font-size:16px;flex:0 0 auto}",
"& .seg{display:flex;gap:6px;padding:4px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)}",
"& .seg button{flex:1;padding:10px 6px;border:0;border-radius:10px;background:transparent;color:var(--mute);font:inherit;font-size:14px;cursor:pointer;transition:background .25s,color .25s}",
"& .seg button.on{background:linear-gradient(135deg,rgba(217,182,106,.28),rgba(120,80,200,.28));color:var(--gold2);box-shadow:inset 0 0 0 1px rgba(217,182,106,.45)}",
"& textarea,& input.in{width:100%;border-radius:14px;border:1px solid rgba(217,182,106,.3);background:rgba(8,6,28,.6);color:#f1ecff;font:inherit;font-size:15px;padding:12px 14px;outline:none;resize:none;transition:border-color .2s,box-shadow .2s}",
"& textarea:focus,& input.in:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(217,182,106,.14)}",
"& .tg{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);margin-bottom:8px;font-size:14px;cursor:pointer}",
"& .tg.off{opacity:.4;pointer-events:none}",
"& .sw{width:40px;height:22px;border-radius:11px;background:rgba(255,255,255,.14);position:relative;transition:background .25s}",
"& .sw::after{content:'';position:absolute;left:3px;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:transform .25s cubic-bezier(.3,.9,.3,1)}",
"& .tg.on .sw{background:var(--gold)}",
"& .tg.on .sw::after{transform:translateX(18px)}",
"& .hint{color:var(--mute);font-size:12px;line-height:1.6;margin:4px 2px}",
"& .btn{padding:12px 16px;border-radius:14px;border:1px solid rgba(217,182,106,.5);background:rgba(255,255,255,.05);color:var(--gold2);font:inherit;font-size:15px;cursor:pointer;transition:transform .15s,background .25s,opacity .2s;flex:1}",
"& .btn:active{transform:scale(.97)}",
"& .btn[disabled]{opacity:.5}",
"& .btn.pri{border:0;color:#2a1b05;font-weight:700;letter-spacing:.2em;background:linear-gradient(135deg,#fff0c4,#d9b66a 55%,#b08a45);box-shadow:0 6px 24px rgba(217,182,106,.28)}",
"& .go{margin:18px 0 8px;padding:15px;font-size:16px}",
"& .hist{margin-top:10px;font-size:12.5px;color:var(--mute);line-height:1.7}",
"& .hist div{padding:6px 0;border-bottom:1px solid rgba(255,255,255,.06)}",
"& .tally{font-size:13px;color:var(--gold2);letter-spacing:.06em;white-space:nowrap}",
"& .cards{display:flex;justify-content:center;gap:14px;padding:10px 0 2px;flex:0 0 auto}",
"& .slot{text-align:center;animation:tt-up .6s cubic-bezier(.2,.8,.2,1) both}",
"@keyframes tt-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}",
"& .cd{width:78px;height:130px;perspective:900px}",
"& .cards.one .cd{width:104px;height:174px}",
"& .inner{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform 1s cubic-bezier(.2,.8,.2,1),box-shadow .6s;border-radius:9px}",
"& .inner.flip{transform:rotateY(180deg)}",
"& .slot.cur .inner{box-shadow:0 0 26px rgba(217,182,106,.5)}",
"& .face{position:absolute;inset:0;border-radius:9px;backface-visibility:hidden;-webkit-backface-visibility:hidden;border:1px solid var(--gold);overflow:hidden}",
"& .face.back{background:radial-gradient(circle at 50% 50%,rgba(243,220,160,.95) 0 2.5px,transparent 3.5px),repeating-conic-gradient(from 0deg at 50% 50%,rgba(217,182,106,.24) 0 6deg,transparent 6deg 12deg),linear-gradient(160deg,#1d1144,#0b0824)}",
"& .face.back::before{content:'';position:absolute;left:50%;top:50%;width:34%;aspect-ratio:1;transform:translate(-50%,-50%) rotate(45deg);border:1px solid rgba(243,220,160,.8)}",
"& .face.back::after{content:'';position:absolute;inset:5px;border:1px solid rgba(217,182,106,.5);border-radius:6px}",
"& .face.front{transform:rotateY(180deg);background:radial-gradient(circle at 50% 38%,rgba(120,80,210,.35),transparent 70%),linear-gradient(170deg,#241552,#0c0926)}",
"& .fc{position:absolute;inset:5px;border:1px solid rgba(217,182,106,.45);border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:6px 3px;color:var(--gold2)}",
"& .fc.rev{transform:rotate(180deg)}",
"& .fc .n{font-size:11px;letter-spacing:.1em}",
"& .fc .s{font-size:30px;line-height:1;text-shadow:0 0 14px rgba(243,220,160,.55)}",
"& .cards.one .fc .s{font-size:40px}",
"& .fc .m{font-size:11.5px;text-align:center;line-height:1.3}",
"& .cap{margin-top:7px;font-size:11.5px;color:var(--mute);min-height:15px;transition:color .4s}",
"& .slot.cur .cap{color:var(--gold2)}",
"& .chat{flex:1;overflow-y:auto;padding:8px 0 12px;scroll-behavior:smooth;min-height:0}",
"& .msg{display:flex;gap:9px;margin:12px 0;animation:tt-up .45s cubic-bezier(.2,.8,.2,1) both}",
"& .msg.char{flex-direction:row-reverse}",
"& .msg.user{justify-content:flex-end}",
"& .msg .av{width:36px;height:36px}",
"& .msg.tarot .av{background:radial-gradient(circle at 35% 30%,#5b3aa8,#1b1040);border:1px solid var(--gold);font-size:17px}",
"& .bub{max-width:78%;padding:10px 14px;border-radius:16px;line-height:1.7;font-size:14.5px;word-break:break-word;white-space:pre-wrap}",
"& .msg.tarot .bub{background:linear-gradient(135deg,rgba(217,182,106,.17),rgba(120,80,200,.16));border:1px solid rgba(217,182,106,.38);border-top-left-radius:4px;color:#fbf2d6}",
"& .msg.char .bub{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);border-top-right-radius:4px}",
"& .msg.user .bub{background:rgba(217,182,106,.14);border:1px solid rgba(217,182,106,.3);font-size:13.5px}",
"& .sys{text-align:center;color:var(--mute);font-size:12px;letter-spacing:.08em;margin:10px 0}",
"& .dots{display:inline-flex;gap:5px;padding:4px 2px}",
"& .dots b{width:6px;height:6px;border-radius:50%;background:var(--gold);opacity:.3;animation:tt-dot 1.2s infinite}",
"& .dots b:nth-child(2){animation-delay:.2s}& .dots b:nth-child(3){animation-delay:.4s}",
"@keyframes tt-dot{50%{opacity:1}}",
"& .acts{flex:0 0 auto;display:flex;flex-direction:column;gap:8px;padding-top:6px}",
"& .row{display:flex;gap:8px}",
"& .acts .btn{padding:11px 6px;font-size:14px}",
"& .res{text-align:center;color:var(--gold2);font-size:15px;letter-spacing:.1em;padding:4px 0 2px}",
"@media (prefers-reduced-motion:reduce){& .neb i,& .slot,& .msg,& .scr{animation:none!important}& .inner{transition-duration:.01s}}"
  ].join("\n");

  /* ============ 星空 ============ */
  function startSky(canvas, C) {
    var g = canvas.getContext("2d");
    var W = 0, H = 0, stars = [], shoots = [], raf = 0, last = 0;
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = canvas.getBoundingClientRect();
      W = r.width || 360; H = r.height || 640;
      canvas.width = W * dpr; canvas.height = H * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(150, (W * H) / 6500));
      stars = [];
      for (var i = 0; i < n; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + 0.2, p: Math.random() * 6.28, s: Math.random() * 0.02 + 0.005, gold: Math.random() < 0.15 });
      if (reduce) draw();
    }
    function draw() {
      g.clearRect(0, 0, W, H);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i]; s.p += s.s;
        g.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(s.p));
        g.fillStyle = s.gold ? "#f3dca0" : "#dfe0ff";
        g.beginPath(); g.arc(s.x, s.y, s.r, 0, 6.283); g.fill();
      }
      g.globalAlpha = 1;
      if (!reduce) {
        if (Math.random() < 0.004 && shoots.length < 2) shoots.push({ x: W * 0.2 + Math.random() * W * 0.8, y: Math.random() * H * 0.4, vx: -(4 + Math.random() * 3), vy: 2 + Math.random() * 2, l: 1 });
        shoots = shoots.filter(function (s) { return s.l > 0; });
        shoots.forEach(function (s) {
          var tx = s.x - s.vx * 10, ty = s.y - s.vy * 10;
          var gr = g.createLinearGradient(s.x, s.y, tx, ty);
          gr.addColorStop(0, "rgba(255,240,200," + s.l + ")"); gr.addColorStop(1, "rgba(255,240,200,0)");
          g.strokeStyle = gr; g.lineWidth = 1.4; g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(tx, ty); g.stroke();
          s.x += s.vx; s.y += s.vy; s.l -= 0.016;
        });
      }
    }
    function frame(t) {
      raf = requestAnimationFrame(frame);
      if (t - last < 33) return; // 约 30fps，省电
      last = t; draw();
    }
    resize();
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(resize); ro.observe(canvas); }
    else window.addEventListener("resize", resize);
    if (!reduce) raf = requestAnimationFrame(frame);
    C.cleanups.push(function () {
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect(); else window.removeEventListener("resize", resize);
    });
  }

  /* ============ 存储 ============ */
  var DEFAULTS = { charId: "", mode: "ask", spread: 3, question: "", useCore: false, useFacts: false };
  async function saveSettings() { try { await ctx.roche.storage.set("settings", ctx.settings); } catch (e) {} }

  /* ============ 首页 ============ */
  function setScreen(el) { ctx.layer.replaceChildren(el); }

  function renderHome() {
    var C = ctx, S = C.settings;
    var sel = C.chars.find(function (c) { return String(c.id) === String(S.charId); }) || C.chars[0] || null;
    if (sel) S.charId = sel.id;
    var canMem = !!(sel && sel.conversationId);

    var chars = C.chars.length
      ? h("div", { class: "chars" }, C.chars.map(function (c) {
          return h("div", { class: "ch" + (sel && c.id === sel.id ? " on" : ""), onclick: function () { S.charId = c.id; saveSettings(); renderHome(); } },
            avatarEl(c.avatar, dispName(c)), h("div", { class: "chn", text: dispName(c) }));
        }))
      : h("div", { class: "hint", text: "还没有读到角色。请先在 Roche 里创建角色。" });

    function toggle(key, label) {
      return h("div", { class: "tg " + (S[key] && canMem ? "on" : "") + (canMem ? "" : " off"), onclick: function () { S[key] = !S[key]; saveSettings(); renderHome(); } },
        h("span", { text: label }), h("div", { class: "sw" }));
    }

    var q = h("textarea", { rows: "3", placeholder: "比如：他此时在想什么？他是不是在嫉妒？", oninput: function (e) { S.question = e.target.value; } });
    q.value = S.question || "";

    var startBtn = h("button", { class: "btn pri go", text: "洗　牌", onclick: function () { startBtn.disabled = true; startBtn.textContent = "洗牌中…"; startSession(sel).finally(function () { startBtn.disabled = false; startBtn.textContent = "洗　牌"; }); } });
    if (!sel) startBtn.disabled = true;

    var hist = (C.history || []).slice(0, 5);

    setScreen(h("div", { class: "scr" },
      h("div", { class: "top" }, h("button", { class: "back", text: "‹", onclick: function () { C.roche.ui.closeApp(); } })),
      h("div", { class: "title", text: "塔罗桌" }),
      h("div", { class: "sub", text: "牌说了算？ta 可不这么想" }),
      h("div", { class: "sec", text: "占谁" }), chars,
      h("div", { class: "sec", text: "玩法" }),
      seg([["ask", "问牌"], ["self", "ta 自己占"]], S.mode, function (v) { S.mode = v; saveSettings(); renderHome(); }),
      h("div", { class: "sec", text: "牌阵" }),
      seg([[3, "三张"], [1, "单张"]], S.spread, function (v) { S.spread = v; saveSettings(); renderHome(); }),
      S.mode === "ask" ? [h("div", { class: "sec", text: "你想问什么" }), q] : h("div", { class: "hint", text: "自占模式：ta 会自己抽牌，塔罗解读 ta，ta 照样嘴硬。" }),
      h("div", { class: "sec", text: "让 ta 反驳时参考记忆" }),
      toggle("useCore", "核心记忆"), toggle("useFacts", "事实记忆"),
      canMem ? null : h("div", { class: "hint", text: "这个角色没有会话 ID，读不到记忆，只会按人设反驳。" }),
      startBtn,
      hist.length ? h("div", { class: "hist" },
        h("div", { class: "sec", text: "最近的牌局" }),
        hist.map(function (x) {
          return h("div", { text: dispName({ name: x.char }) + "｜" + (x.mode === "ask" ? "问牌" : "自占") + "｜" + x.cards.join("、") + "｜塔罗 " + x.tally.tarot + " : " + x.tally.char + " ta" });
        }),
        h("button", { class: "btn", style: "margin-top:10px;flex:none;width:100%;font-size:13px", text: "清空记录", onclick: async function () { C.history = []; try { await C.roche.storage.delete("history"); } catch (e) {} renderHome(); } })
      ) : null
    ));
  }

  /* ============ 牌局 ============ */
  var POS_ASK = ["表层", "暗流", "底牌"];
  var POS_SELF = ["他想的", "他躲的", "他不认的"];

  async function loadMemoryText(char) {
    var C = ctx, S = C.settings;
    if (!char.conversationId || (!S.useCore && !S.useFacts)) return "";
    try {
      var m = await C.roche.memory.getLongTerm({ conversationId: char.conversationId, limit: 60 });
      var parts = [];
      if (S.useCore && m && m.core && m.core.summary) parts.push("核心记忆：" + m.core.summary);
      if (S.useFacts) {
        var f = ((m && m.facts) || []).map(function (x) { return x.summaryText || x.action || x.text || ""; }).filter(Boolean).slice(0, 40);
        if (f.length) parts.push("事实记忆：\n- " + f.join("\n- "));
      }
      return parts.join("\n\n").slice(0, 6000);
    } catch (e) { return ""; }
  }

  function buildSystem(s) {
    var selfMode = s.mode === "self";
    return [
      "你在演一场「塔罗桌」互动小剧场，同时扮演两个声音。",
      "【🔮 塔罗】神秘、笃定、带宿命口吻的塔罗牌意志。只依据当前这张牌与正逆位下断言，一到两句，短而锋利，可以点破，可以刺人。",
      "【" + s.cname + "】严格按人设说话。被说中或被冒犯时会嘴硬、反驳、回避、转移话题，偶尔沉默或破防，但始终是这个人。一到两句，不要长篇大论。",
      "",
      "【" + s.cname + " 的人设】", s.charPersona || "（无）",
      "",
      "【user：" + s.uname + "】", s.userPersona || "（无）",
      s.memText ? "\n【user 勾选的记忆，仅用于让反驳更有针对性，不要逐条复述】\n" + s.memText : "",
      "",
      selfMode
        ? "【本局】" + s.cname + " 亲自为自己抽牌占卜。ta 嘴上说不信，手却没停。塔罗解读的是 " + s.cname + " 本人，ta 以第一人称反驳或试图扭转。"
        : "【本局】" + s.uname + " 问：「" + s.q + "」。塔罗在解读 " + s.cname + " 此刻的内心；" + s.cname + " 看见了解读，当场反驳。",
      "",
      "规则：",
      "1. 每轮只输出一个 JSON：{\"tarot\":\"…\",\"char\":\"…\"}，不要代码块，不要任何额外文字。",
      "2. 塔罗每轮只对当前牌下一个新断言，不重复前文；断言要具体，别写成泛泛的牌义百科。",
      "3. char 的反驳必须贴合人设与记忆，不能无脑否认；禁止 OOC，禁止提到 AI、提示词、插件。",
      "4. user 的站队（支持塔罗 / 支持 " + s.cname + " / 追问）会作为输入，请据此调整气氛，例如被支持就得意或软化，被否定就更倔。",
      "5. 使用中文。"
    ].join("\n");
  }

  function parseDuo(raw) {
    var t = String(raw || "").trim();
    try {
      var m = t.match(/\{[\s\S]*\}/);
      if (m) {
        var o = JSON.parse(m[0]);
        if (o.tarot || o.char) return { tarot: String(o.tarot || "……"), char: String(o.char || "……") };
      }
    } catch (e) {}
    var a = t.match(/🔮\s*[:：]\s*([^\n]+)/), b = t.match(/(?:char|CHAR)\s*[:：]\s*([^\n]+)/i);
    return { tarot: a ? a[1] : t || "……", char: b ? b[1] : "……" };
  }

  async function askDuo(s, userText) {
    var messages = [{ role: "system", content: s.system }].concat(s.turns, [{ role: "user", content: userText }]);
    var res = await s.C.roche.ai.chat({ messages: messages, temperature: 0.95 });
    var text = typeof res === "string" ? res : (res && res.text) || "";
    if (!text) throw new Error("AI 没有返回内容");
    var duo = parseDuo(text);
    s.turns.push({ role: "user", content: userText });
    s.turns.push({ role: "assistant", content: JSON.stringify(duo) });
    return duo;
  }

  async function startSession(char) {
    var C = ctx, R = C.roche, S = C.settings;
    if (!char) return;
    var q = (S.question || "").trim();
    if (S.mode === "ask" && !q) { R.ui.toast("先写下想问的问题"); return; }
    var n = S.spread === 1 ? 1 : 3;
    var memText = await loadMemoryText(char);
    if (C.disposed) return;
    var s = {
      C: C, char: char, mode: S.mode, q: q, cards: drawCards(n), i: 0,
      tally: { tarot: 0, char: 0 }, turns: [], pending: "", flipped: {},
      cname: dispName(char), uname: C.user ? (C.user.handle || C.user.name || "user") : "user",
      charPersona: char.persona || char.bio || "", userPersona: C.user ? (C.user.persona || C.user.bio || "") : "",
      memText: memText, wrote: false
    };
    s.system = buildSystem(s);
    renderTable(s);
    await sleep(700);
    await round(s, "card");
  }

  function renderTable(s) {
    var C = s.C, pos = s.mode === "ask" ? POS_ASK : POS_SELF;
    var T = C.t = { slots: [], cap: [] };
    T.tally = h("div", { class: "tally" });
    updateTally(s);
    T.chat = h("div", { class: "chat" });
    T.acts = h("div", { class: "acts" });
    var one = s.cards.length === 1;
    T.cardsEl = h("div", { class: "cards" + (one ? " one" : "") }, s.cards.map(function (c, i) {
      var inner = h("div", { class: "inner" },
        h("div", { class: "face back" }),
        h("div", { class: "face front" }, h("div", { class: "fc" + (c.rev ? " rev" : "") },
          h("div", { class: "n", text: c.num }), h("div", { class: "s", text: c.sym }), h("div", { class: "m", text: c.name }))));
      var cap = h("div", { class: "cap", text: one ? "" : pos[i] });
      var slot = h("div", { class: "slot", style: "animation-delay:" + (i * 0.12) + "s" }, h("div", { class: "cd" }, inner), cap);
      T.slots.push({ slot: slot, inner: inner, cap: cap });
      return slot;
    }));
    setScreen(h("div", { class: "scr" },
      h("div", { class: "top" },
        h("button", { class: "back", text: "‹", onclick: function () { renderHome(); } }),
        h("div", { class: "sp" }), T.tally),
      T.cardsEl, T.chat, T.acts));
  }

  function updateTally(s) { s.C.t.tally.textContent = "🔮 " + s.tally.tarot + " : " + s.tally.char + " " + s.cname; }
  function scrollDown() { var c = ctx && ctx.t && ctx.t.chat; if (c) c.scrollTop = c.scrollHeight; }

  function typeInto(el, text) {
    return new Promise(function (res) {
      var chars = Array.from(text), i = 0, step = chars.length > 60 ? 2 : 1;
      (function tick() {
        if (!ctx || ctx.disposed) return res();
        i = Math.min(chars.length, i + step);
        el.textContent = chars.slice(0, i).join("");
        scrollDown();
        if (i >= chars.length) return res();
        later(tick, 28);
      })();
    });
  }

  function addMsg(s, kind, text) {
    var C = s.C, bub = h("div", { class: "bub" });
    var av = kind === "tarot" ? h("div", { class: "av", text: "🔮" }) : kind === "char" ? avatarEl(s.char.avatar, s.cname) : null;
    C.t.chat.append(h("div", { class: "msg " + kind }, av, bub));
    scrollDown();
    if (kind === "user") { bub.textContent = text; return Promise.resolve(); }
    return typeInto(bub, text);
  }
  function addSys(s, text) { s.C.t.chat.append(h("div", { class: "sys", text: text })); scrollDown(); }
  function addTyping(s) {
    var el = h("div", { class: "msg tarot" }, h("div", { class: "av", text: "🔮" }), h("div", { class: "bub" }, h("span", { class: "dots" }, h("b"), h("b"), h("b"))));
    s.C.t.chat.append(el); scrollDown();
    return function () { el.remove(); };
  }

  async function round(s, kind, extra) {
    var C = s.C; if (C.disposed) return;
    var T = C.t, card = s.cards[s.i], pos = s.mode === "ask" ? POS_ASK : POS_SELF;
    T.acts.replaceChildren();
    if (kind === "card") {
      T.slots.forEach(function (x, k) { x.slot.classList.toggle("cur", k === s.i); });
      if (!s.flipped[s.i]) {
        if (s.mode === "self") addSys(s, s.cname + " 伸手抽了一张牌……");
        T.slots[s.i].inner.classList.add("flip"); s.flipped[s.i] = true;
        await sleep(1000); if (C.disposed) return;
      }
    }
    var userText;
    var label = s.cards.length === 1 ? "核心" : pos[s.i];
    if (kind === "card") userText = (s.pending ? s.pending + " " : "") + "现在翻开第 " + (s.i + 1) + "/" + s.cards.length + " 张牌：【" + card.name + "·" + (card.rev ? "逆位" : "正位") + "】，位置「" + label + "」。请输出本轮。";
    else if (kind === "ask") userText = "user 追问：「" + extra + "」。仍针对【" + card.name + "·" + (card.rev ? "逆位" : "正位") + "】这张牌，请输出本轮。";
    else userText = "终局。user 最终站队：塔罗 " + s.tally.tarot + " 票，" + s.cname + " " + s.tally.char + " 票。请塔罗给一句总断言，" + s.cname + " 给一句收尾（贴合人设，可嘴硬也可软化）。";
    if (kind === "card") s.pending = "";

    var stop = addTyping(s), duo;
    try { duo = await askDuo(s, userText); }
    catch (e) { stop(); if (C.disposed) return; return showRetry(s, function () { round(s, kind, extra); }, e); }
    stop(); if (C.disposed) return;
    await addMsg(s, "tarot", duo.tarot); if (C.disposed) return;
    await sleep(380); if (C.disposed) return;
    await addMsg(s, "char", duo.char); if (C.disposed) return;
    if (kind === "end") return finish(s);
    showActions(s);
  }

  function showRetry(s, fn, err) {
    var T = s.C.t;
    addSys(s, "出错了：" + ((err && err.message) || "请求失败") + "。检查 Roche 的 AI 配置后重试。");
    T.acts.replaceChildren(h("div", { class: "row" },
      h("button", { class: "btn", text: "重试", onclick: fn }),
      h("button", { class: "btn", text: "返回", onclick: renderHome })));
  }

  function showActions(s) {
    var C = s.C, T = C.t;
    function choose(who) {
      s.tally[who]++; updateTally(s);
      addSys(s, who === "tarot" ? "你站了 🔮" : "你站了 " + s.cname);
      if (s.i < s.cards.length - 1) {
        s.i++; s.pending = "（上一轮 user 支持了" + (who === "tarot" ? "塔罗" : s.cname) + "。）";
        round(s, "card");
      } else round(s, "end");
    }
    var input = h("input", { class: "in", placeholder: "追问点什么……" });
    var askRow = h("div", { class: "row", style: "display:none" }, input,
      h("button", { class: "btn", style: "flex:none;padding:0 18px", text: "追问", onclick: function () {
        var v = input.value.trim() || "说清楚点。";
        addMsg(s, "user", v); round(s, "ask", v);
      } }));
    T.acts.replaceChildren(
      askRow,
      h("div", { class: "row" },
        h("button", { class: "btn", text: "支持塔罗", onclick: function () { choose("tarot"); } }),
        h("button", { class: "btn", text: "支持 " + s.cname, onclick: function () { choose("char"); } }),
        h("button", { class: "btn", text: "继续追问", onclick: function () { askRow.style.display = "flex"; input.focus(); } })));
  }

  async function finish(s) {
    var C = s.C, R = C.roche, T = C.t;
    var verdict = s.tally.tarot > s.tally.char ? "这局，牌赢了。" : s.tally.tarot < s.tally.char ? "这局，" + s.cname + " 赢了。" : "这局，平。";
    var memBtn = h("button", { class: "btn", text: "写入记忆", onclick: function () { writeMemory(s, memBtn); } });
    T.acts.replaceChildren(
      h("div", { class: "res", text: verdict }),
      h("div", { class: "row" }, memBtn,
        h("button", { class: "btn", text: "再来一局", onclick: renderHome }),
        h("button", { class: "btn", text: "返回", onclick: function () { R.ui.closeApp(); } })));
    try {
      var hist = (await R.storage.get("history")) || [];
      hist.unshift({ t: Date.now(), char: s.char.name || s.cname, mode: s.mode, q: s.q, cards: s.cards.map(function (c) { return c.name + (c.rev ? "(逆)" : ""); }), tally: s.tally });
      hist = hist.slice(0, 20); C.history = hist; await R.storage.set("history", hist);
    } catch (e) {}
    await sleep(900); if (C.disposed || s.wrote) return;
    writeMemory(s, memBtn);
  }

  async function writeMemory(s, btn) {
    var C = s.C, R = C.roche;
    if (s.wrote) return R.ui.toast("已经写入过了");
    if (!s.char.conversationId) return R.ui.toast("这个角色没有会话 ID，无法写入记忆");
    var ok = await R.ui.confirm({ title: "写入主记忆？", message: "要把这一局的结果写进 " + s.cname + " 的事实记忆吗？这会写入 Roche 主记忆，卸载插件后不会自动删除。" });
    if (!ok || C.disposed) return;
    try {
      var cards = s.cards.map(function (c) { return c.name + (c.rev ? "逆位" : "正位"); }).join("、");
      var text = "塔罗桌（" + (s.mode === "ask" ? "问牌" : s.cname + " 自占") + "）" + (s.q ? "，问「" + s.q + "」" : "") + "，抽到" + cards + "；站队结果：塔罗 " + s.tally.tarot + " 票，" + s.cname + " " + s.tally.char + " 票。";
      await R.memory.write({ conversationId: s.char.conversationId, summaryText: text, who: [s.uname, s.cname], action: "玩了一局塔罗桌", when: "最近", where: "塔罗桌插件", source: "plugin" });
      s.wrote = true; btn.textContent = "已写入"; btn.disabled = true;
      R.ui.toast("已写入事实记忆");
    } catch (e) { R.ui.toast("写入失败：" + ((e && e.message) || "未知错误")); }
  }

  /* ============ 注册 ============ */
  function destroy() {
    if (!ctx) return;
    ctx.disposed = true;
    ctx.timers.forEach(clearTimeout);
    ctx.cleanups.forEach(function (f) { try { f(); } catch (e) {} });
    var st = document.getElementById(STYLE_ID); if (st) st.remove();
    try { ctx.container.replaceChildren(); } catch (e) {}
    ctx = null;
  }

  window.RochePlugin.register({
    id: PLUGIN_ID,
    name: "塔罗桌",
    version: "1.0.0",
    apps: [{
      id: APP_ID,
      name: "塔罗桌",
      icon: "extension",
      iconImage: "",
      async mount(container, roche) {
        destroy();
        var C = ctx = { container: container, roche: roche, timers: new Set(), cleanups: [], disposed: false, settings: Object.assign({}, DEFAULTS), chars: [], user: null, history: [], t: null };
        var style = document.createElement("style");
        style.id = STYLE_ID; style.textContent = CSS.replace(/&/g, "." + ROOT);
        document.head.appendChild(style);

        var sky = h("canvas", { class: "sky" });
        C.layer = h("div", { class: "layer" });
        container.replaceChildren(h("div", { class: ROOT },
          h("div", { class: "bg" }), h("div", { class: "neb" }, h("i"), h("i"), h("i")), sky, C.layer));
        startSky(sky, C);

        try { var saved = await roche.storage.get("settings"); if (saved) Object.assign(C.settings, saved); } catch (e) {}
        try { C.history = (await roche.storage.get("history")) || []; } catch (e) {}
        try { C.chars = (await roche.character.list()) || []; } catch (e) { roche.ui.toast("读取角色失败"); }
        try { C.user = await roche.persona.getActiveUserPersona(); } catch (e) {}
        if (C.disposed) return;
        renderHome();
      },
      async unmount(container) { destroy(); container.replaceChildren(); }
    }]
  });
})();
