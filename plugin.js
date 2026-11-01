/* 塔罗桌 · Roche 插件 v2.0.0
 * 问牌 / ta 自占：塔罗下断言，char 当场反驳，你来站队。
 * 数据：设置与牌局记录存在 roche.storage（卸载自动清理）；只有你点「写入」才会写 Roche 主事实记忆。
 */
(function () {
  "use strict";
  if (!window.RochePlugin || typeof window.RochePlugin.register !== "function") {
    console.error("[tarot-table] 找不到 window.RochePlugin，当前环境不是 Roche。");
    return;
  }

  var PLUGIN_ID = "tarot-table", APP_ID = "tarot-table-home";
  var ROOT = "roche-plugin-tarot-table", STYLE_ID = "roche-plugin-tarot-table-style";
  var ctx = null;

  /* ================= 牌组 78 张 ================= */
  var MAJOR = ["愚者","魔术师","女祭司","皇后","皇帝","教皇","恋人","战车","力量","隐者","命运之轮","正义","倒吊人","死神","节制","恶魔","高塔","星星","月亮","太阳","审判","世界"];
  var SUITS = ["权杖","圣杯","宝剑","星币"];
  var RANKS = ["王牌","二","三","四","五","六","七","八","九","十","侍从","骑士","王后","国王"];
  var COURT = ["P","N","Q","K"];

  function toRoman(n) {
    if (n === 0) return "0";
    var m = [[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]], s = "";
    m.forEach(function (p) { while (n >= p[0]) { s += p[1]; n -= p[0]; } });
    return s;
  }
  function buildDeck() {
    var d = [];
    MAJOR.forEach(function (n, i) { d.push({ name: n, num: toRoman(i), maj: i }); });
    SUITS.forEach(function (s, si) {
      RANKS.forEach(function (r, ri) {
        d.push({ name: s + r, num: ri < 10 ? toRoman(ri + 1) : COURT[ri - 10], suit: si, rank: ri });
      });
    });
    return d;
  }
  function rnd(n) {
    if (window.crypto && crypto.getRandomValues) { var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }
    return Math.floor(Math.random() * n);
  }
  function drawCards(n) {
    var d = buildDeck();
    for (var i = d.length - 1; i > 0; i--) { var j = rnd(i + 1), t = d[i]; d[i] = d[j]; d[j] = t; }
    return d.slice(0, n).map(function (c) { c.rev = rnd(2) === 1; return c; });
  }

  /* ================= 牌面 SVG（银色线刻） ================= */
  function f1(x) { return (Math.round(x * 10) / 10); }
  function Ci(x, y, r) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '"/>'; }
  function Ln(a, b, c, d) { return '<path d="M' + a + " " + b + "L" + c + " " + d + '"/>'; }
  function Rays(cx, cy, r1, r2, n, off) {
    var s = ""; off = off || 0;
    for (var i = 0; i < n; i++) {
      var a = (i / n) * 6.2832 + off;
      s += Ln(f1(cx + Math.cos(a) * r1), f1(cy + Math.sin(a) * r1), f1(cx + Math.cos(a) * r2), f1(cy + Math.sin(a) * r2));
    }
    return s;
  }
  function Star(cx, cy, R, r, n) {
    var p = [];
    for (var i = 0; i < n * 2; i++) {
      var a = -1.5708 + (i * Math.PI) / n, rr = i % 2 ? r : R;
      p.push(f1(cx + Math.cos(a) * rr) + "," + f1(cy + Math.sin(a) * rr));
    }
    return '<polygon points="' + p.join(" ") + '"/>';
  }
  function Wreath() {
    var s = '<ellipse cx="50" cy="50" rx="30" ry="40"/><ellipse cx="50" cy="50" rx="25" ry="34"/>';
    for (var i = 0; i < 18; i++) {
      var a = (i / 18) * 6.2832, c = Math.cos(a), si = Math.sin(a);
      s += Ln(f1(50 + 30 * c), f1(50 + 40 * si), f1(50 + 35 * c), f1(50 + 46 * si));
    }
    return s + '<path d="M50 36L58 50L50 64L42 50Z"/>' + Ci(10, 10, 2) + Ci(90, 10, 2) + Ci(10, 90, 2) + Ci(90, 90, 2);
  }
  var EMBLEMS = [
    /* 0 愚者 */ Ci(68, 26, 8) + Rays(68, 26, 11, 16, 10) + '<path d="M8 78H46V92H8"/><path d="M46 78C58 78 64 70 78 70" stroke-dasharray="2 4"/><path d="M28 48L35 60L28 72L21 60Z"/>' + Ln(28, 72, 28, 78),
    /* 1 魔术师 */ Ci(41, 22, 9) + Ci(59, 22, 9) + Ln(50, 34, 50, 70) + Ln(10, 70, 90, 70) + Ci(20, 86, 5) + '<path d="M40 81L45 91H35Z"/><rect x="55" y="81" width="10" height="10"/><path d="M80 80L86 86L80 92L74 86Z"/>',
    /* 2 女祭司 */ '<rect x="12" y="14" width="11" height="74"/><rect x="77" y="14" width="11" height="74"/><path d="M57 28A22 22 0 1 0 57 72A16 16 0 1 1 57 28Z"/>' + Ci(50, 18, 3),
    /* 3 皇后 */ Ci(50, 40, 15) + Ln(50, 55, 50, 80) + Ln(38, 68, 62, 68) + Rays(50, 50, 40, 45, 14),
    /* 4 皇帝 */ '<rect x="28" y="30" width="44" height="44"/><path d="M28 42C8 42 8 16 30 20"/><path d="M72 42C92 42 92 16 70 20"/>' + Ci(50, 46, 6) + Ln(50, 52, 50, 68) + Ln(43, 60, 57, 60),
    /* 5 教皇 */ Ln(50, 8, 50, 62) + Ln(38, 18, 62, 18) + Ln(33, 32, 67, 32) + Ln(28, 46, 72, 46) + '<path d="M26 92L74 70M74 92L26 70"/>' + Ci(26, 92, 4) + Ci(74, 92, 4),
    /* 6 恋人 */ Ci(40, 54, 20) + Ci(60, 54, 20) + Ci(50, 15, 6) + Rays(50, 15, 9, 13, 10) + '<path d="M10 92C26 82 38 84 50 92C62 84 74 82 90 92"/>',
    /* 7 战车 */ Ci(28, 76, 11) + Ci(72, 76, 11) + Ln(28, 76, 72, 76) + '<path d="M18 54C28 30 72 30 82 54Z"/>' + Star(50, 44, 7, 3, 5),
    /* 8 力量 */ '<path d="M50 20C44 8 28 12 33 22C38 32 46 28 50 20C54 28 62 32 67 22C72 12 56 8 50 20Z"/>' + Ci(50, 64, 15) + Rays(50, 64, 20, 28, 16),
    /* 9 隐者 */ '<path d="M38 34H62L66 62H34Z"/>' + Star(50, 48, 9, 3.6, 6) + Ln(50, 26, 50, 34) + Ci(50, 22, 4) + Ln(80, 12, 80, 92) + '<path d="M8 92L30 70L44 80L60 64L88 92Z"/>',
    /* 10 命运之轮 */ Ci(50, 50, 32) + Ci(50, 50, 21) + Ci(50, 50, 5) + Rays(50, 50, 5, 32, 8) + Rays(50, 50, 32, 38, 16),
    /* 11 正义 */ Ln(50, 8, 50, 92) + Ln(42, 84, 58, 84) + Ln(18, 32, 82, 32) + Ln(18, 32, 10, 56) + Ln(18, 32, 26, 56) + Ln(82, 32, 74, 56) + Ln(82, 32, 90, 56) + '<path d="M8 56A10 10 0 0 0 28 56Z"/><path d="M72 56A10 10 0 0 0 92 56Z"/>',
    /* 12 倒吊人 */ Ln(18, 10, 82, 10) + Ln(50, 10, 50, 32) + '<path d="M50 32L38 44L50 50"/>' + Ln(50, 32, 62, 44) + Ln(50, 50, 50, 66) + Ci(50, 77, 8) + Ci(50, 77, 14),
    /* 13 死神 */ Ci(50, 36, 6) + Ci(50, 36, 12) + Ci(50, 36, 18) + Ln(50, 54, 50, 88) + Ln(8, 78, 92, 78) + '<path d="M10 78A13 13 0 0 1 36 78"/>' + Rays(23, 78, 16, 21, 7, 3.14),
    /* 14 节制 */ '<path d="M14 18H38L34 40Q26 46 18 40Z"/><path d="M62 56H86L82 78Q74 84 66 78Z"/><path d="M28 42C34 64 66 40 74 56" stroke-dasharray="1.5 3.5"/><rect x="42" y="82" width="16" height="12"/>',
    /* 15 恶魔 */ Ci(50, 54, 30) + '<g transform="rotate(180 50 54)">' + Star(50, 54, 26, 10, 5) + "</g>" + '<path d="M34 26C26 12 36 6 41 14"/><path d="M66 26C74 12 64 6 59 14"/>',
    /* 16 高塔 */ '<path d="M38 32H62L60 92H40Z"/><path d="M33 32L38 20L44 29L50 17L56 29L62 20L67 32"/><rect x="46" y="50" width="8" height="11"/><path d="M82 6L66 38L77 38L60 68"/>' + Ci(20, 56, 2) + Ci(14, 72, 2) + Ci(86, 74, 2),
    /* 17 星星 */ Star(50, 38, 24, 9, 8) + Star(16, 20, 6, 2.4, 4) + Star(84, 20, 6, 2.4, 4) + Star(12, 54, 5, 2, 4) + Star(88, 54, 5, 2, 4) + '<path d="M16 84Q33 76 50 84T84 84"/><path d="M26 94Q38 89 50 94T74 94"/>',
    /* 18 月亮 */ Ci(50, 36, 24) + '<path d="M56 20A17 17 0 1 0 56 52A12 12 0 1 1 56 20Z"/>' + Rays(50, 36, 28, 34, 16) + '<rect x="12" y="66" width="14" height="26"/><rect x="74" y="66" width="14" height="26"/><path d="M42 92L50 72L58 92"/>',
    /* 19 太阳 */ Ci(50, 50, 17) + Ci(50, 50, 9) + Rays(50, 50, 23, 40, 12) + Rays(50, 50, 23, 33, 12, 0.2618),
    /* 20 审判 */ '<path d="M12 40L58 22V58Z"/><path d="M68 32C78 42 78 42 68 52"/><path d="M76 24C92 42 92 42 76 60"/>' + Ci(24, 82, 6) + Ci(50, 86, 6) + Ci(76, 82, 6),
    /* 21 世界 */ Wreath()
  ];
  var SUIT_DEFS = [
    '<path d="M10 2V18"/><path d="M10 7C6 6 5 4 5 1.5C8 1.5 10 3.5 10 7ZM10 11C14 10 15 8 15 5.5C12 5.5 10 7.5 10 11Z"/>',
    '<path d="M4 3H16C16 9 13 11 10 11C7 11 4 9 4 3Z"/><path d="M10 11V16M6 17.5H14"/>',
    '<path d="M10 1L12.2 4V13H7.8V4Z"/><path d="M5 13H15M10 13V19"/>',
    '<circle cx="10" cy="10" r="8"/><path d="M10 4L11.8 8.2L16 10L11.8 11.8L10 16L8.2 11.8L4 10L8.2 8.2Z"/>'
  ];
  var PIPS = [
    [[50, 56]], [[50, 34], [50, 80]], [[50, 28], [50, 56], [50, 84]],
    [[34, 36], [66, 36], [34, 76], [66, 76]], [[34, 36], [66, 36], [50, 56], [34, 76], [66, 76]],
    [[34, 28], [66, 28], [34, 56], [66, 56], [34, 84], [66, 84]],
    [[34, 28], [66, 28], [34, 56], [66, 56], [34, 84], [66, 84], [50, 42]],
    [[34, 28], [66, 28], [34, 56], [66, 56], [34, 84], [66, 84], [50, 42], [50, 70]],
    [[34, 22], [66, 22], [34, 46], [66, 46], [34, 70], [66, 70], [34, 92], [66, 92], [50, 56]],
    [[34, 22], [66, 22], [34, 46], [66, 46], [34, 70], [66, 70], [34, 92], [66, 92], [50, 34], [50, 80]]
  ];
  var CROWNS = [
    '<path d="M38 30L50 16L62 30Z"/>',
    '<path d="M34 30L40 16L50 24L60 16L66 30Z"/>',
    '<path d="M30 32L34 14L42 24L50 10L58 24L66 14L70 32Z"/>',
    '<path d="M26 32L28 12L38 22L44 8L50 20L56 8L62 22L72 12L74 32Z"/>'
  ];
  function useSym(si, x, y, w) { return '<use href="#tt-s' + si + '" x="' + (x - w / 2) + '" y="' + (y - w / 2) + '" width="' + w + '" height="' + w + '"/>'; }
  function artSvg(c) {
    var inner = "";
    if (c.maj != null) inner = EMBLEMS[c.maj];
    else if (c.rank < 10) {
      var pts = PIPS[c.rank], big = c.rank === 0;
      inner = big ? Ci(50, 56, 34) + useSym(c.suit, 50, 56, 40) : pts.map(function (p) { return useSym(c.suit, p[0], p[1], 17); }).join("");
    } else inner = CROWNS[c.rank - 10] + Ci(50, 66, 26) + useSym(c.suit, 50, 66, 30);
    return '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + inner + "</svg>";
  }
  function defsSvg() {
    return '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' + SUIT_DEFS.map(function (d, i) {
      return '<symbol id="tt-s' + i + '" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round">' + d + "</symbol>";
    }).join("") + "</defs></svg>";
  }
  function backSvg() {
    return '<svg viewBox="0 0 60 100" fill="none" stroke="currentColor" stroke-width=".7"><rect x="3.5" y="3.5" width="53" height="93" rx="3"/><rect x="6.5" y="6.5" width="47" height="87" rx="2" opacity=".5"/>' +
      Ci(30, 50, 7) + Ci(30, 50, 13) + Ci(30, 50, 19) + Rays(30, 50, 19, 22, 36) + '<path d="M30 20V80M4 50H56" opacity=".45"/>' + Star(30, 50, 4.2, 1.6, 4) + "</svg>";
  }
  function sigil(sz) {
    return '<svg width="' + sz + '" height="' + sz + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"><circle cx="12" cy="12" r="10.5" opacity=".55"/><path d="M3.5 12C6.5 7 17.5 7 20.5 12C17.5 17 6.5 17 3.5 12Z"/><circle cx="12" cy="12" r="2.6"/><path d="M12 1.5V4M12 20V22.5" opacity=".6"/></svg>';
  }
  function ringSvg() {
    return '<svg viewBox="0 0 300 300" fill="none" stroke="currentColor" stroke-width=".8"><g class="rot">' + Ci(150, 150, 138) + Rays(150, 150, 138, 144, 72) + Rays(150, 150, 138, 150, 8) + "</g>" +
      Ci(150, 150, 112).replace("<circle", '<circle opacity=".4"') + '<path d="M0 150H300M150 0V300" opacity=".28"/><path d="M112 150v-4M120 150v-3M128 150v-4M136 150v-3M164 150v-3M172 150v-4M180 150v-3M188 150v-4" opacity=".6"/></svg>';
  }
  var ICON_BACK = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M11 3L5 9L11 15"/></svg>';

  /* ================= 工具 ================= */
  function h(tag, props) {
    var el = document.createElement(tag);
    if (props) for (var k in props) {
      var v = props[k];
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "html") el.innerHTML = v; // 只用于本文件内部生成的 SVG
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
  function later(fn, ms) { var id = setTimeout(function () { ctx && ctx.timers.delete(id); fn(); }, ms); ctx.timers.add(id); return id; }
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
  function lab(zh, fr) { return h("div", { class: "lab" }, zh, fr ? h("i", { text: " · " + fr }) : null); }
  function sumLines(s, n) { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n) + "…" : s; }

  /* ================= 样式（& = 根 class） ================= */
  var CSS = [
"&{position:relative;width:100%;height:100%;overflow:hidden;color:#e4e5ee;background:#040409;--serif:'Baskerville','Didot','Bodoni 72','Songti SC','STSong','Noto Serif SC',serif;--script:'Snell Roundhand','Apple Chancery','Brush Script MT',cursive;--silver:#dcdde8;--mute:#7f8199;--line:rgba(220,222,235,.15);--gold:#e6c88a;font-family:var(--serif);-webkit-tap-highlight-color:transparent}",
"& *{box-sizing:border-box}",
"& .bg{position:absolute;inset:0;background:radial-gradient(120% 70% at 50% 0%,#14141f 0%,#07070d 55%,#030307 100%)}",
"& .neb{position:absolute;inset:0;overflow:hidden;pointer-events:none}",
"& .neb i{position:absolute;width:80vmax;height:80vmax;border-radius:50%;will-change:transform}",
"& .neb i:nth-child(1){left:-45vmax;top:-20vmax;background:radial-gradient(circle,rgba(110,95,190,.20),transparent 62%);animation:tt-d1 50s ease-in-out infinite alternate}",
"& .neb i:nth-child(2){right:-50vmax;bottom:-30vmax;background:radial-gradient(circle,rgba(70,90,170,.16),transparent 62%);animation:tt-d2 62s ease-in-out infinite alternate}",
"@keyframes tt-d1{to{transform:translate3d(16vmax,10vmax,0) scale(1.12)}}",
"@keyframes tt-d2{to{transform:translate3d(-18vmax,-8vmax,0) scale(.92)}}",
"& .beam{position:absolute;left:50%;top:-8%;width:78%;height:56%;transform:translateX(-50%);background:radial-gradient(ellipse at 50% 0%,rgba(214,218,244,.15),transparent 68%);pointer-events:none}",
"& .ruler{position:absolute;left:8px;top:0;bottom:0;width:16px;pointer-events:none;opacity:.5;background:repeating-linear-gradient(180deg,rgba(220,222,235,.5) 0 1px,transparent 1px 9px) left/7px 100% no-repeat,repeating-linear-gradient(180deg,rgba(220,222,235,.75) 0 1px,transparent 1px 45px) left/14px 100% no-repeat;-webkit-mask-image:linear-gradient(180deg,transparent,#000 16%,#000 84%,transparent);mask-image:linear-gradient(180deg,transparent,#000 16%,#000 84%,transparent)}",
"& canvas.sky{position:absolute;inset:0;width:100%;height:100%}",
"& .layer{position:absolute;inset:0}",
"& .scr{position:absolute;inset:0;display:flex;flex-direction:column;padding:calc(env(safe-area-inset-top,0px) + 10px) 22px calc(env(safe-area-inset-bottom,0px) + 18px) 34px;overflow-y:auto;overflow-x:hidden;animation:tt-in .6s ease both}",
"& .scr>*{flex-shrink:0}",
"@keyframes tt-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}",
"& .top{display:flex;align-items:center;gap:8px;min-height:42px}",
"& .top .sp{flex:1}",
"& .rd{width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:rgba(255,255,255,.04);color:var(--silver);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .2s,background .3s}",
"& .rd:active{transform:scale(.92);background:rgba(255,255,255,.12)}",
"& .pill{padding:11px 20px;border-radius:999px;border:1px solid rgba(235,236,246,.32);background:rgba(255,255,255,.04);color:#ecedf6;font:inherit;font-size:15px;letter-spacing:.14em;cursor:pointer;transition:transform .2s,background .3s,opacity .3s;display:inline-flex;align-items:center;justify-content:center;gap:8px;flex:1}",
"& .pill:active{transform:scale(.97);background:rgba(255,255,255,.14)}",
"& .pill[disabled]{opacity:.45;pointer-events:none}",
"& .pill.sm{padding:8px 15px;font-size:13px;letter-spacing:.08em;flex:none}",
"& .pill.main{width:100%;height:54px;border-color:rgba(230,200,138,.55);font-size:17px;letter-spacing:.5em;padding-left:calc(20px + .5em)}",
"& .pill i,& .lab i,& .fr{font-style:italic;font-size:.78em;letter-spacing:.04em;color:var(--mute)}",
"& .ttl{font-family:var(--script);font-size:66px;line-height:1.05;color:#f4f4fb;text-shadow:0 0 24px rgba(214,218,255,.32);margin:10px 0 0 2px}",
"& .rule{height:1px;background:var(--line);margin:10px 0 9px;width:78%}",
"& .meta{font-size:11px;letter-spacing:.3em;color:var(--mute);line-height:1.9}",
"& .lab{font-size:13px;letter-spacing:.16em;color:#b9bbd0;margin:16px 0 8px}",
"& .ringw{position:relative;width:min(80vw,310px);aspect-ratio:1;margin:12px auto 4px;color:rgba(220,222,235,.75)}",
"& .ringw>div:first-child{position:absolute;inset:0}",
"& .ringw svg{width:100%;height:100%}",
"& .ringw .rot{transform-origin:150px 150px;animation:tt-rot 140s linear infinite}",
"@keyframes tt-rot{to{transform:rotate(360deg)}}",
"& .stack{position:absolute;left:50%;top:50%;width:25%;aspect-ratio:3/5;transform:translate(-50%,-50%)}",
"& .bk{position:absolute;inset:0;border-radius:8px;background:linear-gradient(160deg,#171726,#07070d);color:rgba(220,222,235,.8);box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 10px 30px rgba(0,0,0,.6)}",
"& .bk svg{width:100%;height:100%;display:block}",
"& .bk.b0{transform:rotate(-7deg) translateX(-8%)}& .bk.b1{transform:rotate(1deg)}& .bk.b2{transform:rotate(8deg) translateX(8%)}",
"& .stack{animation:tt-breath 6s ease-in-out infinite}",
"@keyframes tt-breath{50%{transform:translate(-50%,-52%)}}",
"& .stack.shuf .b0{animation:tt-sf0 1.3s cubic-bezier(.5,0,.3,1) both}",
"& .stack.shuf .b2{animation:tt-sf2 1.3s cubic-bezier(.5,0,.3,1) both}",
"& .stack.shuf .b1{animation:tt-sf1 1.3s ease both}",
"@keyframes tt-sf0{0%{transform:rotate(-7deg) translateX(-8%)}25%{transform:translateX(-95%) rotate(-12deg)}50%{transform:translateX(40%) rotate(4deg)}75%{transform:translateX(-80%) rotate(-10deg)}100%{transform:rotate(0) translateX(0)}}",
"@keyframes tt-sf2{0%{transform:rotate(8deg) translateX(8%)}25%{transform:translateX(95%) rotate(12deg)}50%{transform:translateX(-40%) rotate(-4deg)}75%{transform:translateX(80%) rotate(10deg)}100%{transform:rotate(0) translateX(0)}}",
"@keyframes tt-sf1{0%,100%{transform:rotate(1deg) translateY(0)}50%{transform:translateY(-8%) scale(1.04)}}",
"& .who{display:flex;align-items:center;gap:12px;margin:6px 0 2px}",
"& .who .av{width:42px;height:42px;border:1px solid var(--line)}",
"& .who .nm{flex:1;font-size:17px;letter-spacing:.06em}",
"& .who .nm i{display:block;font-size:11.5px;color:var(--mute);letter-spacing:.04em}",
"& .av{border-radius:50%;background:#1d1d2c center/cover no-repeat;display:flex;align-items:center;justify-content:center;color:var(--silver);font-size:15px;flex:0 0 auto}",
"& textarea,& input.in{width:100%;border-radius:16px;border:1px solid var(--line);background:rgba(10,10,18,.55);color:#f1f1f8;font:inherit;font-size:15px;padding:12px 15px;outline:none;resize:none;transition:border-color .3s,box-shadow .3s}",
"& textarea:focus,& input.in:focus,& input.num:focus{border-color:rgba(235,236,246,.5);box-shadow:0 0 0 3px rgba(220,222,235,.07)}",
"& .hint{color:var(--mute);font-size:12.5px;line-height:1.7;margin:4px 2px}",
"& .seg{display:flex;gap:4px;padding:3px;border-radius:999px;background:rgba(255,255,255,.04);border:1px solid var(--line)}",
"& .seg button{flex:1;padding:9px 6px;border:0;border-radius:999px;background:transparent;color:var(--mute);font:inherit;font-size:14px;cursor:pointer;transition:background .35s,color .35s}",
"& .seg button.on{background:rgba(235,236,246,.14);color:#fff}",
"& .go{margin-top:16px}",
"& .tally{font-size:13px;letter-spacing:.04em;color:#c9cadb;font-style:italic;white-space:nowrap}",
"& .cards{display:flex;justify-content:center;gap:14px;padding:6px 0 4px;position:relative}",
"& .cards::before{content:'';position:absolute;left:50%;top:50%;width:min(88vw,330px);aspect-ratio:1;transform:translate(-50%,-52%);border-radius:50%;border:1px solid var(--line);pointer-events:none}",
"& .slot{text-align:center;position:relative;animation:tt-deal .9s cubic-bezier(.2,.9,.25,1.1) both}",
"@keyframes tt-deal{0%{opacity:0;transform:translate(var(--dx,0px),-26px) rotate(var(--rt,0deg)) scale(.86)}55%{opacity:1}100%{opacity:1;transform:none}}",
"& .cd{width:clamp(72px,23vw,96px);aspect-ratio:3/5;perspective:900px}",
"& .cards.one .cd{width:clamp(104px,33vw,132px)}",
"& .slot.fl .cd{animation:tt-lift 1.2s cubic-bezier(.3,.7,.3,1)}",
"@keyframes tt-lift{40%{transform:translateY(-10px) scale(1.06)}}",
"& .inner{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform 1.1s cubic-bezier(.22,.8,.2,1),box-shadow .8s;border-radius:8px}",
"& .inner.flip{transform:rotateY(180deg)}",
"& .slot.cur .inner{box-shadow:0 0 0 1px rgba(230,200,138,.5),0 12px 40px rgba(230,200,138,.10)}",
"& .face{position:absolute;inset:0;border-radius:8px;backface-visibility:hidden;-webkit-backface-visibility:hidden;overflow:hidden;background:linear-gradient(160deg,#181828,#07070d);box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 8px 24px rgba(0,0,0,.55);color:rgba(222,224,238,.85)}",
"& .face.back svg{width:100%;height:100%;display:block}",
"& .face.front{transform:rotateY(180deg)}",
"& .face.front::before{content:'';position:absolute;inset:3px;border:1px solid rgba(220,222,235,.28);border-radius:5px;pointer-events:none}",
"& .face.front::after{content:'';position:absolute;inset:-30%;background:linear-gradient(112deg,transparent 42%,rgba(255,238,196,.5) 50%,transparent 58%);transform:translateX(-130%);pointer-events:none}",
"& .inner.flip .face.front::after{animation:tt-shine 1.5s .5s ease both}",
"@keyframes tt-shine{to{transform:translateX(130%)}}",
"& .fc{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:9% 8% 8%}",
"& .fc.rev{transform:rotate(180deg)}",
"& .fc .n{font-size:11px;letter-spacing:.2em;font-style:italic;color:#c7c9dc}",
"& .fc .a{flex:1;width:86%;min-height:0;display:flex;align-items:center}",
"& .fc .a svg{width:100%;height:auto;max-height:100%}",
"& .fc .m{font-size:11.5px;letter-spacing:.14em;color:#d6d7e6;padding-left:.14em}",
"& .cp{margin-top:8px;font-size:11.5px;color:var(--mute);min-height:15px;letter-spacing:.08em;transition:color .5s}",
"& .slot.cur .cp{color:#d9dae8}",
"& .dust{position:absolute;left:50%;top:50%;width:3px;height:3px;border-radius:50%;background:#f4e6c0;opacity:0;pointer-events:none;animation:tt-dust 1.1s ease-out forwards}",
"@keyframes tt-dust{0%{opacity:.9;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--x),var(--y)) scale(.3)}}",
"& .chat{flex:1;min-height:120px;overflow-y:auto;padding:14px 0 10px;scroll-behavior:smooth;-webkit-mask-image:linear-gradient(180deg,transparent,#000 7%);mask-image:linear-gradient(180deg,transparent,#000 7%)}",
"& .beat{margin:14px 0;animation:tt-in .6s ease both}",
"& .beat .w{display:flex;align-items:center;gap:7px;font-size:11.5px;letter-spacing:.2em;color:var(--mute);margin-bottom:5px}",
"& .beat .w .av{width:18px;height:18px;font-size:10px}",
"& .beat.tarot .tx{font-style:italic;font-size:17px;line-height:1.75;color:#f3f3fb;padding-left:14px;border-left:1px solid rgba(220,222,235,.4)}",
"& .beat.tarot .w{color:#c7c9dc}",
"& .beat.char .tx{font-size:15.5px;line-height:1.8;color:#d2d3e2;padding-left:14px}",
"& .beat.user .tx{font-size:13px;color:var(--mute);text-align:right;font-style:italic}",
"& .beat .tx{white-space:pre-wrap;word-break:break-word}",
"& .sys{text-align:center;color:var(--mute);font-size:12px;letter-spacing:.14em;margin:12px 0;font-style:italic}",
"& .pulse{display:inline-block;color:#c7c9dc;animation:tt-pulse 1.6s ease-in-out infinite}",
"@keyframes tt-pulse{50%{opacity:.25}}",
"& .acts{display:flex;flex-direction:column;gap:9px;padding-top:6px}",
"& .row{display:flex;gap:8px;align-items:center}",
"& .acts .pill{padding:12px 6px;font-size:14px;letter-spacing:.08em}",
"& .res{text-align:center;font-style:italic;font-size:16px;color:#e6e7f2;letter-spacing:.08em;padding:2px 0}",
"& .shade{position:absolute;inset:0;background:rgba(0,0,0,.6);opacity:0;pointer-events:none;transition:opacity .45s;z-index:20}",
"& .shade.on{opacity:1;pointer-events:auto}",
"& .sheet{position:absolute;left:0;right:0;bottom:0;max-height:86%;display:flex;flex-direction:column;z-index:21;border-radius:28px 28px 0 0;background:linear-gradient(180deg,rgba(46,46,60,.78),rgba(14,14,22,.94));-webkit-backdrop-filter:blur(26px) saturate(1.3);backdrop-filter:blur(26px) saturate(1.3);border:1px solid rgba(255,255,255,.13);border-bottom:0;transform:translateY(106%);transition:transform .55s cubic-bezier(.2,.9,.25,1);padding-bottom:env(safe-area-inset-bottom,0px)}",
"& .sheet.on{transform:none}",
"& .grab{width:44px;height:4px;border-radius:2px;background:rgba(255,255,255,.3);margin:9px auto 4px;flex:none;touch-action:none}",
"& .sh-h{display:flex;align-items:center;justify-content:space-between;padding:6px 22px 10px;flex:none}",
"& .sh-t{font-size:24px;font-family:var(--script);color:#f2f2fa}",
"& .sh-t i{font-family:var(--serif);font-size:12px;color:var(--mute);margin-left:10px;letter-spacing:.06em}",
"& .sh-b{overflow-y:auto;padding:0 22px 22px;flex:1;min-height:0}",
"& .rw{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.07);font-size:14.5px}",
"& .rw small{display:block;color:var(--mute);font-size:12px;margin-top:2px}",
"& .sw{width:42px;height:24px;border-radius:12px;background:rgba(255,255,255,.14);position:relative;transition:background .35s;flex:none;cursor:pointer}",
"& .sw::after{content:'';position:absolute;left:3px;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .35s cubic-bezier(.3,.9,.3,1)}",
"& .sw.on{background:rgba(235,236,246,.55)}& .sw.on::after{transform:translateX(18px)}",
"& .step{display:flex;align-items:center;gap:6px;flex:none}",
"& .step button{width:32px;height:32px;border-radius:50%;border:1px solid var(--line);background:rgba(255,255,255,.05);color:#fff;font:inherit;font-size:17px;cursor:pointer}",
"& input.num{width:54px;height:32px;text-align:center;border-radius:10px;border:1px solid var(--line);background:rgba(8,8,14,.6);color:#fff;font:inherit;font-size:15px;outline:none}",
"& .chg{display:grid;grid-template-columns:repeat(4,1fr);gap:14px 8px;padding-top:8px}",
"& .chg .ch{text-align:center;cursor:pointer;opacity:.5;transition:opacity .3s,transform .3s}",
"& .chg .ch.on{opacity:1;transform:translateY(-2px)}",
"& .chg .av{width:56px;height:56px;margin:0 auto 6px;border:1px solid var(--line)}",
"& .chg .ch.on .av{border-color:rgba(230,200,138,.8)}",
"& .chg .cn{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
"& .hs{padding:12px 0;border-bottom:1px solid rgba(255,255,255,.07);font-size:13.5px;line-height:1.7}",
"& .hs b{font-weight:400;color:#f0f0f8}",
"& .hs p{margin:4px 0 8px;color:#a9abc2;font-size:13px}",
"& textarea.mem{min-height:150px;line-height:1.75;font-size:14.5px}",
"& pre.bi{white-space:pre-wrap;font:inherit;font-size:12.5px;line-height:1.7;color:#a9abc2;background:rgba(0,0,0,.35);border-radius:12px;padding:12px;margin:8px 0}",
"@media (prefers-reduced-motion:reduce){& *{animation-duration:.01s!important;animation-iteration-count:1!important}& .inner{transition-duration:.01s}}"
  ].join("\n");

  /* ================= 星空（克制：星少、偏银白） ================= */
  function startSky(canvas, C) {
    var g = canvas.getContext("2d"), W = 0, H = 0, stars = [], shoots = [], raf = 0, last = 0;
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2), r = canvas.getBoundingClientRect();
      W = r.width || 360; H = r.height || 640;
      canvas.width = W * dpr; canvas.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(90, (W * H) / 9000)); stars = [];
      for (var i = 0; i < n; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.1 + 0.2, p: Math.random() * 6.28, s: Math.random() * 0.016 + 0.004, gold: Math.random() < 0.06 });
      if (reduce) draw();
    }
    function draw() {
      g.clearRect(0, 0, W, H);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i]; s.p += s.s;
        g.globalAlpha = 0.2 + 0.7 * Math.abs(Math.sin(s.p));
        g.fillStyle = s.gold ? "#f0dca8" : "#dfe1f2";
        g.beginPath(); g.arc(s.x, s.y, s.r, 0, 6.283); g.fill();
      }
      g.globalAlpha = 1;
      if (!reduce) {
        if (Math.random() < 0.0025 && shoots.length < 1) shoots.push({ x: W * 0.3 + Math.random() * W * 0.7, y: Math.random() * H * 0.35, vx: -(4 + Math.random() * 2), vy: 1.6 + Math.random() * 1.6, l: 1 });
        shoots = shoots.filter(function (s) { return s.l > 0; });
        shoots.forEach(function (s) {
          var tx = s.x - s.vx * 12, ty = s.y - s.vy * 12, gr = g.createLinearGradient(s.x, s.y, tx, ty);
          gr.addColorStop(0, "rgba(240,242,255," + s.l * 0.9 + ")"); gr.addColorStop(1, "rgba(240,242,255,0)");
          g.strokeStyle = gr; g.lineWidth = 1.1; g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(tx, ty); g.stroke();
          s.x += s.vx; s.y += s.vy; s.l -= 0.014;
        });
      }
    }
    function frame(t) { raf = requestAnimationFrame(frame); if (t - last < 33) return; last = t; draw(); }
    resize();
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(resize); ro.observe(canvas); } else window.addEventListener("resize", resize);
    if (!reduce) raf = requestAnimationFrame(frame);
    C.cleanups.push(function () { cancelAnimationFrame(raf); if (ro) ro.disconnect(); else window.removeEventListener("resize", resize); });
  }

  /* ================= 设置与存储 ================= */
  var DEFAULTS = { charId: "", mode: "ask", spread: 3, question: "", useCore: true, nFacts: 20, nChat: 10, askWrite: true, useAI: true, customPrompt: "" };
  var BUILTIN_PROMPT = [
    "你是 Roche 的记忆整理员。下面是一局「塔罗桌」互动的记录，请据此写一条可以写入「事实记忆」的记忆。",
    "要求：",
    "1. 2 到 4 句，中文，第三人称，信息密度高。必须保留 user 最初的塔罗问题（可以略微精简但不能改意）。",
    "2. 重点写这一局暴露出来的东西：角色被说中时的真实反应、嘴硬或回避的方式、他在意什么，以及 user 与角色之间的张力；最后写清 user 站了谁。",
    "3. 可以保留角色最有代表性的一句原话（不超过 20 字，加引号）。牌只点出最关键的一两张。",
    "4. 不要写塔罗牌义百科，不要按轮次流水账，不要评价和加戏；记录里没出现的事一律不要编。",
    "5. 只输出记忆正文，不要标题、前缀、解释。"
  ].join("\n");
  function saveSettings() { try { return ctx.roche.storage.set("settings", ctx.settings); } catch (e) {} }
  function saveHistory() { try { return ctx.roche.storage.set("history", ctx.history); } catch (e) {} }
  function curChar() {
    var C = ctx;
    return C.chars.find(function (c) { return String(c.id) === String(C.settings.charId); }) || C.chars[0] || null;
  }

  /* ================= 底部毛玻璃面板 ================= */
  function openSheet(title, fr, body) {
    var C = ctx, closed = false;
    var shade = h("div", { class: "shade", onclick: close });
    var grab = h("div", { class: "grab" });
    var sheet = h("div", { class: "sheet" }, grab,
      h("div", { class: "sh-h" }, h("div", { class: "sh-t" }, title, h("i", { text: fr })), h("button", { class: "pill sm", text: "好了", onclick: close })),
      h("div", { class: "sh-b" }, body));
    C.root.append(shade, sheet);
    requestAnimationFrame(function () { requestAnimationFrame(function () { shade.classList.add("on"); sheet.classList.add("on"); }); });
    var y0 = 0, dy = 0;
    grab.addEventListener("touchstart", function (e) { y0 = e.touches[0].clientY; dy = 0; sheet.style.transition = "none"; }, { passive: true });
    grab.addEventListener("touchmove", function (e) { dy = Math.max(0, e.touches[0].clientY - y0); sheet.style.transform = "translateY(" + dy + "px)"; }, { passive: true });
    grab.addEventListener("touchend", function () { sheet.style.transition = ""; sheet.style.transform = ""; if (dy > 90) close(); });
    function close() {
      if (closed) return; closed = true;
      shade.classList.remove("on"); sheet.classList.remove("on");
      setTimeout(function () { shade.remove(); sheet.remove(); }, 450);
    }
    return { close: close, body: sheet.querySelector(".sh-b") };
  }

  function toggleRow(label, sub, key, onChange) {
    var S = ctx.settings;
    var sw = h("div", { class: "sw" + (S[key] ? " on" : ""), onclick: function () { S[key] = !S[key]; sw.classList.toggle("on", S[key]); saveSettings(); if (onChange) onChange(); } });
    return h("div", { class: "rw" }, h("div", null, label, sub ? h("small", { text: sub }) : null), sw);
  }
  function stepper(key, min, max, step) {
    var S = ctx.settings;
    var inp = h("input", { class: "num", type: "number", inputmode: "numeric", min: min, max: max, value: S[key] });
    function set(v) { v = Math.max(min, Math.min(max, Math.round(Number(v) || 0))); S[key] = v; inp.value = v; saveSettings(); }
    inp.addEventListener("change", function () { set(inp.value); });
    return h("div", { class: "step" }, h("button", { text: "−", onclick: function () { set(S[key] - step); } }), inp, h("button", { text: "+", onclick: function () { set(S[key] + step); } }));
  }

  function openSettings() {
    var C = ctx, S = C.settings;
    var body = h("div");
    var sh = openSheet("Réglages", "设置", body);
    function render() {
      var bi = h("pre", { class: "bi", text: BUILTIN_PROMPT, style: "display:none" });
      var cp = h("textarea", { rows: "5", placeholder: "留空就使用内置提示词。记录会自动附在提示词后面发给 AI。" });
      cp.value = S.customPrompt || "";
      cp.addEventListener("input", function () { S.customPrompt = cp.value; });
      cp.addEventListener("change", saveSettings);
      body.replaceChildren(
        lab("玩法", "jeu"),
        seg([["ask", "问牌"], ["self", "ta 自己占"]], S.mode, function (v) { S.mode = v; saveSettings(); render(); renderHome(); }),
        lab("牌阵", "tirage"),
        seg([[3, "三张"], [1, "单张"]], S.spread, function (v) { S.spread = v; saveSettings(); render(); }),
        lab("让 ta 反驳时参考", "mémoire"),
        toggleRow("核心记忆", "整段核心记忆", "useCore"),
        h("div", { class: "rw" }, h("div", null, "事实记忆条数", h("small", { text: "0 = 不读取" })), stepper("nFacts", 0, 100, 5)),
        h("div", { class: "rw" }, h("div", null, "最近聊天条数", h("small", { text: "0 = 不读取；条数越多越耗 token" })), stepper("nChat", 0, 100, 5)),
        lab("牌局结束后", "inscrire"),
        toggleRow("自动弹出「写入记忆」", "关掉后仍可在牌局结束时手动点写入", "askWrite"),
        toggleRow("用 AI 总结这一局", "关掉则给你一份草稿，自己写", "useAI"),
        lab("总结提示词", "consigne"),
        cp,
        h("div", { class: "row", style: "margin-top:8px" },
          h("button", { class: "pill sm", text: "查看内置提示词", onclick: function () { bi.style.display = bi.style.display === "none" ? "block" : "none"; } }),
          h("button", { class: "pill sm", text: "清空自定义", onclick: function () { S.customPrompt = ""; saveSettings(); render(); } })),
        bi
      );
    }
    render();
    return sh;
  }

  function openChars() {
    var C = ctx, S = C.settings, sel = curChar(), sh;
    var grid = h("div", { class: "chg" }, C.chars.length ? C.chars.map(function (c) {
      return h("div", { class: "ch" + (sel && c.id === sel.id ? " on" : ""), onclick: function () { S.charId = c.id; saveSettings(); sh.close(); renderHome(); } },
        avatarEl(c.avatar, dispName(c)), h("div", { class: "cn", text: dispName(c) }));
    }) : h("div", { class: "hint", text: "没有读到角色，请先在 Roche 里创建角色。" }));
    sh = openSheet("Consulté", "占谁", grid);
  }

  function openHistory() {
    var C = ctx, body = h("div"), sh = openSheet("Journal", "牌局记录", body);
    function render() {
      if (!C.history.length) { body.replaceChildren(h("div", { class: "hint", text: "还没有牌局。洗一次牌就会有记录。" })); return; }
      body.replaceChildren(
        C.history.map(function (r) {
          var d = new Date(r.t), ds = (d.getMonth() + 1) + "/" + d.getDate() + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
          return h("div", { class: "hs" },
            h("b", { text: r.cname + " · " + (r.mode === "ask" ? "问牌" : "自占") + " · " + ds }),
            h("p", { text: (r.q ? "问：" + sumLines(r.q, 40) + "　" : "") + r.cards.join("、") + "　塔罗 " + r.tally.tarot + " : " + r.tally.char + " " + r.cname }),
            r.summary ? h("p", { text: sumLines(r.summary, 90) }) : null,
            h("div", { class: "row" },
              h("button", { class: "pill sm", text: r.memoryId || r.written ? "编辑记忆" : "整理记忆", onclick: function () { sh.close(); openMemory(r); } }),
              r.memoryId ? h("button", { class: "pill sm", text: "删除记忆", onclick: async function () {
                var ok = await C.roche.ui.confirm({ title: "删除这条记忆？", message: "会从 Roche 主事实记忆里删除。" });
                if (!ok) return;
                try { await C.roche.memory.delete(r.memoryId); r.memoryId = null; r.written = false; saveHistory(); C.roche.ui.toast("已删除"); render(); } catch (e) { C.roche.ui.toast("删除失败"); }
              } }) : null));
        }),
        h("button", { class: "pill sm", style: "margin-top:14px;width:100%", text: "清空记录", onclick: async function () { C.history = []; try { await C.roche.storage.delete("history"); } catch (e) {} render(); renderHome(); } })
      );
    }
    render();
  }

  /* ================= 记忆整理与写入 ================= */
  function recordText(rec) {
    var lines = (rec.log || []).slice(-44).map(function (x) {
      var w = x.who === "tarot" ? "塔罗" : x.who === "char" ? rec.cname : x.who === "user" ? rec.uname + "（追问）" : "旁白";
      return w + "：" + sumLines(x.text, 170);
    });
    return [
      "角色：" + rec.cname, "user：" + rec.uname,
      "玩法：" + (rec.mode === "ask" ? "user 向塔罗问角色的事" : "角色自己抽牌占自己"),
      rec.q ? "user 最初的塔罗问题：" + rec.q : "（自占，没有 user 提问）",
      "牌：" + rec.cards.join("；"),
      "最终站队：塔罗 " + rec.tally.tarot + " 票，" + rec.cname + " " + rec.tally.char + " 票",
      "对话摘录：", lines.join("\n")
    ].join("\n");
  }
  function skeleton(rec) {
    return "塔罗桌" + (rec.mode === "ask" ? "：" + rec.uname + "问「" + rec.q + "」" : "：" + rec.cname + " 自己占卜") + "，抽到" + rec.cards.join("、") + "。最终 " + rec.uname + " 站队：塔罗 " + rec.tally.tarot + " 票，" + rec.cname + " " + rec.tally.char + " 票。";
  }
  async function summarize(rec, prev, feedback) {
    var S = ctx.settings;
    var sys = (S.customPrompt && S.customPrompt.trim()) || BUILTIN_PROMPT;
    var msgs = [{ role: "system", content: sys }, { role: "user", content: "【本局记录】\n" + recordText(rec) }];
    if (feedback) {
      msgs.push({ role: "assistant", content: prev });
      msgs.push({ role: "user", content: "请按这条意见重写，仍然只输出记忆正文：" + feedback });
    }
    var res = await ctx.roche.ai.chat({ messages: msgs, temperature: 0.5 });
    var t = typeof res === "string" ? res : (res && res.text) || "";
    t = t.replace(/^```[a-z]*\n?|```$/g, "").trim();
    if (!t) throw new Error("AI 没有返回内容");
    return t;
  }
  function extractId(r) { return r && (r.id || r.memoryId || r._id || (r.item && r.item.id) || (typeof r === "string" ? r : null)) || null; }

  function openMemory(rec) {
    var C = ctx, R = C.roche, S = C.settings, busy = false;
    var ta = h("textarea", { class: "mem", rows: "6", placeholder: "这里是要写入的记忆，随时可以自己改。" });
    ta.value = rec.summary || "";
    ta.addEventListener("input", function () { rec.summary = ta.value; });
    var status = h("div", { class: "hint" });
    var fb = h("input", { class: "in", placeholder: "给上一版提点意见，比如：再短一点，多写他的反应" });
    var fbRow = h("div", { class: "row", style: "display:none;margin-top:8px" }, fb, h("button", { class: "pill sm", text: "按意见重写", onclick: function () { gen(fb.value.trim()); } }));
    var saveBtn = h("button", { class: "pill", text: rec.memoryId ? "更新记忆" : "写入记忆", onclick: save });
    var body = h("div",
      h("div", { class: "hint", text: "写入的是 Roche 主事实记忆，卸载插件后不会自动删除。内容你可以随意修改。" }),
      ta, status,
      h("div", { class: "row", style: "margin-top:10px" },
        h("button", { class: "pill sm", text: "重新生成", onclick: function () { gen(""); } }),
        h("button", { class: "pill sm", text: "提意见", onclick: function () { fbRow.style.display = fbRow.style.display === "none" ? "flex" : "none"; } })),
      fbRow,
      h("div", { class: "row", style: "margin-top:14px" }, saveBtn)
    );
    var sh = openSheet("Inscrire", "记忆", body);

    async function gen(feedback) {
      if (busy) return; busy = true; status.textContent = "整理中……";
      try {
        var t = await summarize(rec, ta.value, feedback);
        if (C.disposed) return;
        ta.value = t; rec.summary = t; status.textContent = ""; if (feedback) fb.value = "";
      } catch (e) { status.textContent = "整理失败：" + ((e && e.message) || "请检查 AI 配置") + "。可以重试或自己写。"; }
      busy = false;
    }
    async function save() {
      var text = ta.value.trim();
      if (!text) return R.ui.toast("记忆是空的");
      if (!rec.conversationId) return R.ui.toast("这个角色没有会话 ID，无法写入");
      saveBtn.disabled = true;
      try {
        rec.summary = text;
        if (rec.memoryId) await R.memory.update(rec.memoryId, { summaryText: text, action: text });
        else {
          var r = await R.memory.write({ conversationId: rec.conversationId, summaryText: text, who: [rec.uname, rec.cname], action: text, when: new Date().toLocaleString("zh-CN", { hour12: false }), where: "塔罗桌", source: "plugin" });
          rec.memoryId = extractId(r);
        }
        rec.written = true; saveHistory();
        R.ui.toast(rec.memoryId ? "已写入事实记忆" : "已写入（这条之后需要在 Roche 里修改）");
        sh.close();
        if (C.t && C.t.memBtn) C.t.memBtn.textContent = "编辑记忆";
      } catch (e) { saveBtn.disabled = false; R.ui.toast("写入失败：" + ((e && e.message) || "未知错误")); }
    }
    if (!rec.summary) {
      if (S.useAI) gen(""); else { ta.value = skeleton(rec); rec.summary = ta.value; }
    }
  }

  /* ================= 首页 ================= */
  function setScreen(el) { ctx.layer.replaceChildren(el); }

  function renderHome() {
    var C = ctx, S = C.settings, sel = curChar();
    if (sel) S.charId = sel.id;
    var stack = h("div", { class: "stack" }, [0, 1, 2].map(function (i) { return h("div", { class: "bk b" + i, html: backSvg() }); }));
    C.homeStack = stack;
    var q = h("textarea", { rows: "2", placeholder: "想问什么？比如：他此时在想什么？" });
    q.value = S.question || "";
    q.addEventListener("input", function () { S.question = q.value; });
    q.addEventListener("change", saveSettings);
    var go = h("button", { class: "pill main", onclick: function () {
      go.disabled = true;
      startSession(sel).then(function () { if (ctx && !ctx.disposed && ctx.layer.contains(go)) go.disabled = false; });
    } }, h("span", { text: "洗牌" }), h("i", { text: "mélanger" }));
    if (!sel) go.disabled = true;

    setScreen(h("div", { class: "scr" },
      h("div", { class: "top" },
        h("button", { class: "rd", html: ICON_BACK, onclick: function () { C.roche.ui.closeApp(); } }), h("div", { class: "sp" }),
        h("button", { class: "pill sm", onclick: openHistory }, "记录", h("i", { text: "journal" })),
        h("button", { class: "pill sm", onclick: openSettings }, "设置", h("i", { text: "réglages" }))),
      h("div", { class: "ttl", text: "Tarot" }),
      h("div", { class: "rule" }),
      h("div", { class: "meta", text: "TABLE DE TAROT" }),
      h("div", { class: "meta", text: "Nº " + toRoman(C.history.length + 1) + " · " + toRoman(new Date().getFullYear()) }),
      h("div", { class: "ringw" }, h("div", { html: ringSvg() }), stack),
      sel ? h("div", { class: "who" }, avatarEl(sel.avatar, dispName(sel)),
        h("div", { class: "nm" }, dispName(sel), h("i", { text: S.mode === "ask" ? "你向牌询问 ta" : "ta 自己抽牌" })),
        h("button", { class: "pill sm", text: "更换", onclick: openChars }))
        : h("div", { class: "hint", text: "还没有读到角色，请先在 Roche 里创建角色。" }),
      S.mode === "ask" ? h("div", { style: "margin-top:12px" }, q) : h("div", { class: "hint", style: "margin-top:12px", text: "自占模式：ta 会自己抽牌，塔罗解读 ta，ta 照样嘴硬。" }),
      h("div", { class: "go" }, go)
    ));
  }

  /* ================= 牌局 ================= */
  var POS_ASK = ["表层", "暗流", "底牌"], POS_SELF = ["他想的", "他躲的", "他不认的"];

  async function loadContext(char) {
    var C = ctx, S = C.settings, R = C.roche, parts = [];
    if (!char.conversationId) return "";
    try {
      if (S.useCore || S.nFacts > 0) {
        var m = await R.memory.getLongTerm({ conversationId: char.conversationId, limit: Math.max(S.nFacts, 1) });
        if (S.useCore && m && m.core && m.core.summary) parts.push("核心记忆：" + m.core.summary);
        if (S.nFacts > 0) {
          var f = ((m && m.facts) || []).map(function (x) { return x.summaryText || x.action || x.text || ""; }).filter(Boolean).slice(0, S.nFacts);
          if (f.length) parts.push("事实记忆：\n- " + f.join("\n- "));
        }
      }
    } catch (e) {}
    try {
      if (S.nChat > 0) {
        var msgs = (await R.memory.getShortTerm({ conversationId: char.conversationId, limit: S.nChat })) || [];
        msgs = msgs.slice().sort(function (a, b) { return (a.timestamp || 0) - (b.timestamp || 0); }).slice(-S.nChat);
        var t = msgs.map(function (x) { return (x.senderHandle || x.senderName || "?") + "：" + sumLines(x.text, 200); }).filter(function (x) { return x.length > 2; });
        if (t.length) parts.push("最近的聊天（仅作背景）：\n" + t.join("\n"));
      }
    } catch (e) {}
    return parts.join("\n\n").slice(0, 9000);
  }

  function buildSystem(s) {
    return [
      "你在演一场「塔罗桌」互动小剧场，同时扮演两个声音。",
      "【塔罗】神秘、笃定、带宿命口吻的牌的意志。只依据当前这张牌与正逆位下断言，一到两句，短而锋利，可以点破，可以刺人。",
      "【" + s.cname + "】严格按人设说话。被说中或被冒犯时会嘴硬、反驳、回避、转移话题，偶尔沉默或破防，但始终是这个人。一到两句，不要长篇大论。",
      "", "【" + s.cname + " 的人设】", s.charPersona || "（无）",
      "", "【user：" + s.uname + "】", s.userPersona || "（无）",
      s.ctxText ? "\n【user 勾选的背景，仅用于让反驳更有针对性，不要逐条复述】\n" + s.ctxText : "",
      "",
      s.mode === "self"
        ? "【本局】" + s.cname + " 亲自为自己抽牌占卜。ta 嘴上说不信，手却没停。塔罗解读的是 " + s.cname + " 本人，ta 以第一人称反驳或试图扭转。"
        : "【本局】" + s.uname + " 问：「" + s.q + "」。塔罗在解读 " + s.cname + " 此刻的内心；" + s.cname + " 看见了解读，当场反驳。",
      "", "规则：",
      "1. 每轮只输出一个 JSON：{\"tarot\":\"…\",\"char\":\"…\"}，不要代码块，不要任何额外文字。",
      "2. 塔罗每轮只对当前牌下一个新断言，不重复前文；断言要具体，别写成泛泛的牌义百科。",
      "3. char 的反驳必须贴合人设与记忆，不能无脑否认；禁止 OOC，禁止提到 AI、提示词、插件。",
      "4. user 的站队（支持塔罗 / 支持 " + s.cname + " / 追问）会作为输入，请据此调整气氛：被支持就得意或软化，被否定就更倔。",
      "5. 使用中文。"
    ].join("\n");
  }
  function parseDuo(raw) {
    var t = String(raw || "").trim();
    try {
      var m = t.match(/\{[\s\S]*\}/);
      if (m) { var o = JSON.parse(m[0]); if (o.tarot || o.char) return { tarot: String(o.tarot || "……"), char: String(o.char || "……") }; }
    } catch (e) {}
    var a = t.match(/塔罗\s*[:：]\s*([^\n]+)/), b = t.match(/(?:char|CHAR)\s*[:：]\s*([^\n]+)/i);
    return { tarot: a ? a[1] : t || "……", char: b ? b[1] : "……" };
  }
  async function askDuo(s, userText) {
    var messages = [{ role: "system", content: s.system }].concat(s.turns, [{ role: "user", content: userText }]);
    var res = await s.C.roche.ai.chat({ messages: messages, temperature: 0.95 });
    var text = typeof res === "string" ? res : (res && res.text) || "";
    if (!text) throw new Error("AI 没有返回内容");
    var duo = parseDuo(text);
    s.turns.push({ role: "user", content: userText }, { role: "assistant", content: JSON.stringify(duo) });
    return duo;
  }

  async function startSession(char) {
    var C = ctx, S = C.settings;
    if (!char) return;
    var q = (S.question || "").trim();
    if (S.mode === "ask" && !q) { C.roche.ui.toast("先写下想问的问题"); return; }
    var n = S.spread === 1 ? 1 : 3;
    if (C.homeStack) C.homeStack.classList.add("shuf");
    var shuffled = sleep(1400);
    var ctxText = await loadContext(char);
    await shuffled;
    if (C.disposed) return;
    var pos = S.mode === "ask" ? POS_ASK : POS_SELF;
    var cards = drawCards(n);
    var s = {
      C: C, char: char, mode: S.mode, q: q, cards: cards, i: 0, turns: [], pending: "", flipped: {},
      tally: { tarot: 0, char: 0 }, cname: dispName(char), uname: C.user ? (C.user.handle || C.user.name || "user") : "user",
      charPersona: char.persona || char.bio || "", userPersona: C.user ? (C.user.persona || C.user.bio || "") : "", ctxText: ctxText
    };
    s.rec = {
      t: Date.now(), charId: char.id, cname: s.cname, uname: s.uname, conversationId: char.conversationId || "", mode: S.mode, q: q,
      cards: cards.map(function (c, i) { return c.name + (c.rev ? "（逆位）" : "（正位）") + (n === 1 ? "" : "·" + pos[i]); }),
      tally: s.tally, log: [], summary: "", memoryId: null, written: false
    };
    s.system = buildSystem(s);
    renderTable(s);
    await sleep(1100);
    await round(s, "card");
  }

  function renderTable(s) {
    var C = s.C, pos = s.mode === "ask" ? POS_ASK : POS_SELF, one = s.cards.length === 1;
    var T = C.t = { slots: [] };
    T.tally = h("div", { class: "tally" }); updateTally(s);
    T.chat = h("div", { class: "chat" });
    T.acts = h("div", { class: "acts" });
    T.cardsEl = h("div", { class: "cards" + (one ? " one" : "") }, s.cards.map(function (c, i) {
      var inner = h("div", { class: "inner" },
        h("div", { class: "face back", html: backSvg() }),
        h("div", { class: "face front" }, h("div", { class: "fc" + (c.rev ? " rev" : "") },
          h("div", { class: "n", text: c.num }), h("div", { class: "a", html: artSvg(c) }), h("div", { class: "m", text: c.name }))));
      var cp = h("div", { class: "cp", text: one ? "" : pos[i] });
      var slot = h("div", { class: "slot", style: "--dx:" + (one ? 0 : (1 - i) * 100) + "px;--rt:" + ((i - 1) * 6) + "deg;animation-delay:" + (i * 0.17 + 0.05) + "s" }, h("div", { class: "cd" }, inner), cp);
      T.slots.push({ slot: slot, inner: inner, cp: cp });
      return slot;
    }));
    setScreen(h("div", { class: "scr" },
      h("div", { class: "top" }, h("button", { class: "rd", html: ICON_BACK, onclick: renderHome }), h("div", { class: "sp" }), T.tally),
      T.cardsEl, T.chat, T.acts));
  }
  function updateTally(s) { s.C.t.tally.textContent = "Tarot " + s.tally.tarot + " : " + s.tally.char + " " + s.cname; }
  function scrollDown() { var c = ctx && ctx.t && ctx.t.chat; if (c) c.scrollTop = c.scrollHeight; }

  function typeInto(el, text) {
    return new Promise(function (res) {
      var chars = Array.from(text), i = 0, step = chars.length > 60 ? 2 : 1;
      (function tick() {
        if (!ctx || ctx.disposed) return res();
        i = Math.min(chars.length, i + step); el.textContent = chars.slice(0, i).join(""); scrollDown();
        if (i >= chars.length) return res();
        later(tick, 30);
      })();
    });
  }
  function addMsg(s, kind, text) {
    var C = s.C, tx = h("div", { class: "tx" });
    var who = kind === "tarot" ? h("div", { class: "w" }, h("span", { html: sigil(16) }), h("span", { text: "TAROT" }))
      : kind === "char" ? h("div", { class: "w" }, avatarEl(s.char.avatar, s.cname), h("span", { text: s.cname }))
      : null;
    C.t.chat.append(h("div", { class: "beat " + kind }, who, tx)); scrollDown();
    s.rec.log.push({ who: kind, text: text });
    if (kind === "user") { tx.textContent = text; return Promise.resolve(); }
    return typeInto(tx, text);
  }
  function addSys(s, text) { s.rec.log.push({ who: "sys", text: text }); s.C.t.chat.append(h("div", { class: "sys", text: text })); scrollDown(); }
  function addTyping(s) {
    var el = h("div", { class: "beat tarot" }, h("div", { class: "w" }, h("span", { class: "pulse", html: sigil(16) }), h("span", { class: "pulse", text: "……" })));
    s.C.t.chat.append(el); scrollDown();
    return function () { el.remove(); };
  }
  function burst(slotEl) {
    for (var k = 0; k < 14; k++) {
      var a = Math.random() * 6.283, d = 30 + Math.random() * 46;
      var p = h("i", { class: "dust", style: "--x:" + Math.round(Math.cos(a) * d) + "px;--y:" + Math.round(Math.sin(a) * d - 8) + "px;animation-delay:" + (Math.random() * 0.2) + "s" });
      slotEl.append(p);
      (function (n) { setTimeout(function () { n.remove(); }, 1500); })(p);
    }
  }

  async function round(s, kind, extra) {
    var C = s.C; if (C.disposed) return;
    var T = C.t, card = s.cards[s.i], pos = s.mode === "ask" ? POS_ASK : POS_SELF;
    T.acts.replaceChildren();
    if (kind === "card") {
      T.slots.forEach(function (x, k) { x.slot.classList.toggle("cur", k === s.i); });
      if (!s.flipped[s.i]) {
        if (s.mode === "self") addSys(s, s.cname + " 伸手抽了一张牌……");
        var sl = T.slots[s.i];
        sl.slot.classList.add("fl"); sl.inner.classList.add("flip"); s.flipped[s.i] = true;
        later(function () { burst(sl.slot); }, 650);
        later(function () { sl.cp.textContent = (s.cards.length === 1 ? "" : pos[s.i] + " · ") + (card.rev ? "逆位" : "正位"); }, 600);
        await sleep(1500); if (C.disposed) return;
      }
    }
    var label = s.cards.length === 1 ? "核心" : pos[s.i], userText;
    var face = "【" + card.name + "·" + (card.rev ? "逆位" : "正位") + "】";
    if (kind === "card") userText = (s.pending ? s.pending + " " : "") + "现在翻开第 " + (s.i + 1) + "/" + s.cards.length + " 张牌：" + face + "，位置「" + label + "」。请输出本轮。";
    else if (kind === "ask") userText = "user 追问：「" + extra + "」。仍针对" + face + "这张牌，请输出本轮。";
    else userText = "终局。user 最终站队：塔罗 " + s.tally.tarot + " 票，" + s.cname + " " + s.tally.char + " 票。请塔罗给一句总断言，" + s.cname + " 给一句收尾（贴合人设，可嘴硬也可软化）。";
    if (kind === "card") s.pending = "";

    var stop = addTyping(s), duo;
    try { duo = await askDuo(s, userText); }
    catch (e) { stop(); if (C.disposed) return; return showRetry(s, function () { round(s, kind, extra); }, e); }
    stop(); if (C.disposed) return;
    await addMsg(s, "tarot", duo.tarot); if (C.disposed) return;
    await sleep(420); if (C.disposed) return;
    await addMsg(s, "char", duo.char); if (C.disposed) return;
    if (kind === "end") return finish(s);
    showActions(s);
  }

  function showRetry(s, fn, err) {
    addSys(s, "出错了：" + ((err && err.message) || "请求失败") + "。检查 Roche 的 AI 配置后重试。");
    s.C.t.acts.replaceChildren(h("div", { class: "row" }, h("button", { class: "pill", text: "重试", onclick: fn }), h("button", { class: "pill", text: "返回", onclick: renderHome })));
  }

  function showActions(s) {
    var T = s.C.t;
    function choose(who) {
      s.tally[who]++; updateTally(s);
      addSys(s, who === "tarot" ? "你站了塔罗" : "你站了 " + s.cname);
      if (s.i < s.cards.length - 1) { s.i++; s.pending = "（上一轮 user 支持了" + (who === "tarot" ? "塔罗" : s.cname) + "。）"; round(s, "card"); }
      else round(s, "end");
    }
    var input = h("input", { class: "in", placeholder: "追问点什么……" });
    var askRow = h("div", { class: "row", style: "display:none" }, input,
      h("button", { class: "pill sm", text: "追问", onclick: function () {
        var v = input.value.trim() || "说清楚点。";
        addMsg(s, "user", v); round(s, "ask", v);
      } }));
    T.acts.replaceChildren(askRow, h("div", { class: "row" },
      h("button", { class: "pill", text: "支持塔罗", onclick: function () { choose("tarot"); } }),
      h("button", { class: "pill", text: "支持 " + s.cname, onclick: function () { choose("char"); } }),
      h("button", { class: "pill", text: "追问", onclick: function () { askRow.style.display = "flex"; input.focus(); } })));
  }

  async function finish(s) {
    var C = s.C, R = C.roche, T = C.t, rec = s.rec;
    var verdict = s.tally.tarot > s.tally.char ? "这一局，牌赢了。" : s.tally.tarot < s.tally.char ? "这一局，" + s.cname + " 赢了。" : "这一局，平。";
    T.memBtn = h("button", { class: "pill", text: "写入记忆", onclick: function () { openMemory(rec); } });
    T.acts.replaceChildren(h("div", { class: "res", text: verdict }),
      h("div", { class: "row" }, T.memBtn,
        h("button", { class: "pill", text: "再来一局", onclick: renderHome }),
        h("button", { class: "pill", text: "返回", onclick: function () { R.ui.closeApp(); } })));
    rec.tally = { tarot: s.tally.tarot, char: s.tally.char };
    C.history.unshift(rec); C.history = C.history.slice(0, 20); saveHistory();
    if (C.settings.askWrite) { await sleep(1000); if (!C.disposed && !rec.written) openMemory(rec); }
  }

  /* ================= 注册 ================= */
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
    id: PLUGIN_ID, name: "塔罗桌", version: "2.0.0",
    apps: [{
      id: APP_ID, name: "塔罗桌", icon: "extension", iconImage: "",
      async mount(container, roche) {
        destroy();
        var C = ctx = { container: container, roche: roche, timers: new Set(), cleanups: [], disposed: false, settings: Object.assign({}, DEFAULTS), chars: [], user: null, history: [], t: null };
        var style = document.createElement("style");
        style.id = STYLE_ID; style.textContent = CSS.replace(/&/g, "." + ROOT);
        document.head.appendChild(style);
        var sky = h("canvas", { class: "sky" });
        C.layer = h("div", { class: "layer" });
        C.root = h("div", { class: ROOT },
          h("div", { html: defsSvg() }), h("div", { class: "bg" }), h("div", { class: "neb" }, h("i"), h("i")), h("div", { class: "beam" }),
          h("div", { class: "ruler" }), sky, C.layer);
        container.replaceChildren(C.root);
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
