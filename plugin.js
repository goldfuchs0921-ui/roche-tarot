/* 塔罗桌 · Roche 插件 v4.0.1
 * 问牌 / ta 自占：塔罗下断言，char 按自己的人设回应，你来站队。
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
  var SETTINGS_VERSION = 3;
  var ctx = null;

  /* ================= 牌组 78 张（中文名 + 意大利传统名） ================= */
  var MAJOR = ["愚者","魔术师","女祭司","皇后","皇帝","教皇","恋人","战车","力量","隐者","命运之轮","正义","倒吊人","死神","节制","恶魔","高塔","星星","月亮","太阳","审判","世界"];
  var IT_MAJOR = ["Il Matto","Il Bagatto","La Papessa","L'Imperatrice","L'Imperatore","Il Papa","Gli Amanti","Il Carro","La Forza","L'Eremita","La Ruota della Fortuna","La Giustizia","L'Appeso","La Morte","La Temperanza","Il Diavolo","La Torre","La Stella","La Luna","Il Sole","Il Giudizio","Il Mondo"];
  var SUITS = ["权杖","圣杯","宝剑","星币"];
  var IT_SUITS = ["Bastoni","Coppe","Spade","Denari"];
  var RANKS = ["王牌","二","三","四","五","六","七","八","九","十","侍从","骑士","王后","国王"];
  var IT_RANKS = ["Asso","Due","Tre","Quattro","Cinque","Sei","Sette","Otto","Nove","Dieci","Fante","Cavaliere","Regina","Re"];
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
  function itName(c) { return c.maj != null ? IT_MAJOR[c.maj] : IT_RANKS[c.rank] + " di " + IT_SUITS[c.suit]; }
  function rnd(n) {
    if (window.crypto && crypto.getRandomValues) { var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }
    return Math.floor(Math.random() * n);
  }
  function drawCards(n) {
    var d = buildDeck();
    for (var i = d.length - 1; i > 0; i--) { var j = rnd(i + 1), t = d[i]; d[i] = d[j]; d[j] = t; }
    return d.slice(0, n).map(function (c) { c.rev = rnd(2) === 1; return c; });
  }

  /* ================= SVG ================= */
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
    Ci(68, 26, 8) + Rays(68, 26, 11, 16, 10) + '<path d="M8 78H46V92H8"/><path d="M46 78C58 78 64 70 78 70" stroke-dasharray="2 4"/><path d="M28 48L35 60L28 72L21 60Z"/>' + Ln(28, 72, 28, 78),
    Ci(41, 22, 9) + Ci(59, 22, 9) + Ln(50, 34, 50, 70) + Ln(10, 70, 90, 70) + Ci(20, 86, 5) + '<path d="M40 81L45 91H35Z"/><rect x="55" y="81" width="10" height="10"/><path d="M80 80L86 86L80 92L74 86Z"/>',
    '<rect x="12" y="14" width="11" height="74"/><rect x="77" y="14" width="11" height="74"/><path d="M57 28A22 22 0 1 0 57 72A16 16 0 1 1 57 28Z"/>' + Ci(50, 18, 3),
    Ci(50, 40, 15) + Ln(50, 55, 50, 80) + Ln(38, 68, 62, 68) + Rays(50, 50, 40, 45, 14),
    '<rect x="28" y="30" width="44" height="44"/><path d="M28 42C8 42 8 16 30 20"/><path d="M72 42C92 42 92 16 70 20"/>' + Ci(50, 46, 6) + Ln(50, 52, 50, 68) + Ln(43, 60, 57, 60),
    Ln(50, 8, 50, 62) + Ln(38, 18, 62, 18) + Ln(33, 32, 67, 32) + Ln(28, 46, 72, 46) + '<path d="M26 92L74 70M74 92L26 70"/>' + Ci(26, 92, 4) + Ci(74, 92, 4),
    Ci(40, 54, 20) + Ci(60, 54, 20) + Ci(50, 15, 6) + Rays(50, 15, 9, 13, 10) + '<path d="M10 92C26 82 38 84 50 92C62 84 74 82 90 92"/>',
    Ci(28, 76, 11) + Ci(72, 76, 11) + Ln(28, 76, 72, 76) + '<path d="M18 54C28 30 72 30 82 54Z"/>' + Star(50, 44, 7, 3, 5),
    '<path d="M50 20C44 8 28 12 33 22C38 32 46 28 50 20C54 28 62 32 67 22C72 12 56 8 50 20Z"/>' + Ci(50, 64, 15) + Rays(50, 64, 20, 28, 16),
    '<path d="M38 34H62L66 62H34Z"/>' + Star(50, 48, 9, 3.6, 6) + Ln(50, 26, 50, 34) + Ci(50, 22, 4) + Ln(80, 12, 80, 92) + '<path d="M8 92L30 70L44 80L60 64L88 92Z"/>',
    Ci(50, 50, 32) + Ci(50, 50, 21) + Ci(50, 50, 5) + Rays(50, 50, 5, 32, 8) + Rays(50, 50, 32, 38, 16),
    Ln(50, 8, 50, 92) + Ln(42, 84, 58, 84) + Ln(18, 32, 82, 32) + Ln(18, 32, 10, 56) + Ln(18, 32, 26, 56) + Ln(82, 32, 74, 56) + Ln(82, 32, 90, 56) + '<path d="M8 56A10 10 0 0 0 28 56Z"/><path d="M72 56A10 10 0 0 0 92 56Z"/>',
    Ln(18, 10, 82, 10) + Ln(50, 10, 50, 32) + '<path d="M50 32L38 44L50 50"/>' + Ln(50, 32, 62, 44) + Ln(50, 50, 50, 66) + Ci(50, 77, 8) + Ci(50, 77, 14),
    Ci(50, 36, 6) + Ci(50, 36, 12) + Ci(50, 36, 18) + Ln(50, 54, 50, 88) + Ln(8, 78, 92, 78) + '<path d="M10 78A13 13 0 0 1 36 78"/>' + Rays(23, 78, 16, 21, 7, 3.14),
    '<path d="M14 18H38L34 40Q26 46 18 40Z"/><path d="M62 56H86L82 78Q74 84 66 78Z"/><path d="M28 42C34 64 66 40 74 56" stroke-dasharray="1.5 3.5"/><rect x="42" y="82" width="16" height="12"/>',
    Ci(50, 54, 30) + '<g transform="rotate(180 50 54)">' + Star(50, 54, 26, 10, 5) + "</g>" + '<path d="M34 26C26 12 36 6 41 14"/><path d="M66 26C74 12 64 6 59 14"/>',
    '<path d="M38 32H62L60 92H40Z"/><path d="M33 32L38 20L44 29L50 17L56 29L62 20L67 32"/><rect x="46" y="50" width="8" height="11"/><path d="M82 6L66 38L77 38L60 68"/>' + Ci(20, 56, 2) + Ci(14, 72, 2) + Ci(86, 74, 2),
    Star(50, 38, 24, 9, 8) + Star(16, 20, 6, 2.4, 4) + Star(84, 20, 6, 2.4, 4) + Star(12, 54, 5, 2, 4) + Star(88, 54, 5, 2, 4) + '<path d="M16 84Q33 76 50 84T84 84"/><path d="M26 94Q38 89 50 94T74 94"/>',
    Ci(50, 36, 24) + '<path d="M56 20A17 17 0 1 0 56 52A12 12 0 1 1 56 20Z"/>' + Rays(50, 36, 28, 34, 16) + '<rect x="12" y="66" width="14" height="26"/><rect x="74" y="66" width="14" height="26"/><path d="M42 92L50 72L58 92"/>',
    Ci(50, 50, 17) + Ci(50, 50, 9) + Rays(50, 50, 23, 40, 12) + Rays(50, 50, 23, 33, 12, 0.2618),
    '<path d="M12 40L58 22V58Z"/><path d="M68 32C78 42 78 42 68 52"/><path d="M76 24C92 42 92 42 76 60"/>' + Ci(24, 82, 6) + Ci(50, 86, 6) + Ci(76, 82, 6),
    Wreath()
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
      var pts = PIPS[c.rank];
      inner = c.rank === 0 ? Ci(50, 56, 34) + useSym(c.suit, 50, 56, 40) : pts.map(function (p) { return useSym(c.suit, p[0], p[1], 17); }).join("");
    } else inner = CROWNS[c.rank - 10] + Ci(50, 66, 26) + useSym(c.suit, 50, 66, 30);
    return '<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + inner + "</svg>";
  }
  function defsSvg() {
    return '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' + SUIT_DEFS.map(function (d, i) {
      return '<symbol id="tt-s' + i + '" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round">' + d + "</symbol>";
    }).join("") + "</defs></svg>";
  }
  function backSvg() {
    return '<svg viewBox="0 0 60 100" fill="none" stroke="currentColor" stroke-width=".7"><rect x="3.5" y="3.5" width="53" height="93" rx="3"/><rect x="6" y="6" width="48" height="88" rx="2" opacity=".35"/>' +
      '<path d="M11 88V46A19 19 0 0 1 49 46V88Z"/><path d="M16 88V47A14 14 0 0 1 44 47V88Z" opacity=".5"/><path d="M21 88V48A9 9 0 0 1 39 48V88Z" opacity=".3"/>' +
      '<path d="M33 33A6 6 0 1 0 33 45A4.6 4.6 0 1 1 33 33Z" stroke="#c9a45c"/>' + Star(30, 62, 4.4, 1.7, 4) + '<path d="M7 88H53M7 92H53" opacity=".4"/>' +
      Star(10, 12, 2, .8, 4) + Star(50, 12, 2, .8, 4) + "</svg>";
  }
  function ornSvg() {
    return '<svg viewBox="0 0 60 100" fill="none" stroke="#c9a45c" stroke-width=".6" opacity=".7"><path d="M7 15V8Q7 7 8 7H15M53 15V8Q53 7 52 7H45M7 85V92Q7 93 8 93H15M53 85V92Q53 93 52 93H45"/>' + Ci(8.5, 8.5, .9) + Ci(51.5, 8.5, .9) + Ci(8.5, 91.5, .9) + Ci(51.5, 91.5, .9) + "</svg>";
  }
  function sigil(sz) {
    return '<svg width="' + sz + '" height="' + sz + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"><path d="M4 21V11A8 8 0 0 1 20 11V21" opacity=".55"/><path d="M3.5 14C6.5 9.5 17.5 9.5 20.5 14C17.5 18.5 6.5 18.5 3.5 14Z"/><circle cx="12" cy="14" r="2.4"/><path d="M12 2.5V5" opacity=".7"/></svg>';
  }
  function archSvg() {
    var tw = [[110, 36, 3], [68, 62, 2], [152, 54, 2.4], [46, 104, 2], [174, 96, 2], [88, 28, 1.6], [134, 24, 1.8], [58, 150, 1.6], [164, 140, 1.6]];
    var s = '<svg viewBox="0 0 220 300" fill="none" stroke="currentColor" stroke-width=".8" stroke-linecap="round">' +
      '<path d="M14 286V112A96 96 0 0 1 206 112V286" stroke="#c9a45c" stroke-opacity=".65"/>' +
      '<path d="M28 286V114A82 82 0 0 1 192 114V286" opacity=".3"/><path d="M42 286V116A68 68 0 0 1 178 116V286" opacity=".17"/><path d="M56 286V118A54 54 0 0 1 164 118V286" opacity=".09"/>' +
      '<path d="M6 286H214M22 293H198" opacity=".4"/>';
    tw.forEach(function (t, i) {
      s += '<path class="tw" style="animation-delay:' + (i * 0.7) + 's" d="M' + t[0] + " " + (t[1] - t[2]) + "V" + (t[1] + t[2]) + "M" + (t[0] - t[2]) + " " + t[1] + "H" + (t[0] + t[2]) + '"/>';
    });
    return s + "</svg>";
  }
  /* 22 个罗马数字组成的环（对应 22 张大阿卡纳） */
  function ringSvg() {
    var s = '<svg viewBox="0 0 400 400" fill="none" stroke="currentColor" stroke-width=".7"><g class="rot">' + Ci(200, 200, 194) + Ci(200, 200, 180) + Ci(200, 200, 134).replace("<circle", '<circle opacity=".5"') +
      Rays(200, 200, 180, 194, 22, -1.5708) + '<g opacity=".4">' + Star(200, 200, 122, 70, 8) + "</g>";
    for (var i = 0; i < 22; i++) {
      var a = (i / 22) * 6.2832 - 1.5708, x = f1(200 + Math.cos(a) * 160), y = f1(200 + Math.sin(a) * 160), deg = f1((a * 180) / Math.PI + 90);
      s += '<text x="' + x + '" y="' + y + '" transform="rotate(' + deg + " " + x + " " + y + ')" text-anchor="middle" dominant-baseline="central" font-size="10" fill="currentColor" stroke="none" font-family="Baskerville,Didot,serif" letter-spacing="1">' + toRoman(i) + "</text>";
    }
    return s + "</g></svg>";
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
  /* 浏览器自带的 replaceChildren 不认数组，会把数组变成文字；统一用这个 */
  function fill(el, list) {
    var flat = [];
    (function walk(x) { if (x == null || x === false) return; if (Array.isArray(x)) x.forEach(walk); else flat.push(x.nodeType ? x : document.createTextNode(String(x))); })(list);
    el.replaceChildren.apply(el, flat);
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
  function lab(zh, it) { return h("div", { class: "lab" }, zh, it ? h("i", { text: " · " + it }) : null); }
  function sumLines(s, n) { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n) + "…" : s; }

  /* ================= 样式（& = 根 class） ================= */
  var GRAIN_SVG = "<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .95  0 0 0 0 .9  0 0 0 0 .8  0 0 0 .7 -.12'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>";
  var GRAIN_URL = 'url("data:image/svg+xml;utf8,' + encodeURIComponent(GRAIN_SVG).replace(/'/g, "%27") + '")';

  var CSS = [
"&{position:relative;width:100%;height:100%;overflow:hidden;color:#eadfc8;background:#0a0806;--grain:" + GRAIN_URL + ";--serif:'Songti SC','STSong','Noto Serif SC','Source Han Serif SC','Baskerville','Didot',serif;--ivory:#eadfc8;--mute:#8d8372;--line:rgba(234,223,200,.14);--brass:#c9a45c;--brass2:#e8cf8f;--moon:205,214,238;font-family:var(--serif);-webkit-tap-highlight-color:transparent}",
"& *{box-sizing:border-box}",
"& .bg{position:absolute;inset:0;background:radial-gradient(120% 55% at 50% 108%,#2a1d10 0%,rgba(42,29,16,0) 62%),radial-gradient(100% 70% at 50% 0%,#17130f 0%,#0d0a07 55%,#070504 100%)}",
"& .fog{position:absolute;inset:0;overflow:hidden;pointer-events:none}",
"& .fog i{position:absolute;border-radius:50%;will-change:transform}",
"& .fog i:nth-child(1){width:120vmax;height:70vmax;left:-50vmax;top:8vmax;background:radial-gradient(closest-side,rgba(160,138,100,.11),transparent);animation:tt-f1 70s ease-in-out infinite alternate}",
"& .fog i:nth-child(2){width:110vmax;height:60vmax;right:-55vmax;top:40vmax;background:radial-gradient(closest-side,rgba(110,130,150,.09),transparent);animation:tt-f2 86s ease-in-out infinite alternate}",
"& .fog i:nth-child(3){width:100vmax;height:55vmax;left:-30vmax;bottom:-18vmax;background:radial-gradient(closest-side,rgba(150,110,70,.12),transparent);animation:tt-f3 78s ease-in-out infinite alternate}",
"@keyframes tt-f1{to{transform:translate3d(30vmax,6vmax,0) scale(1.1)}}",
"@keyframes tt-f2{to{transform:translate3d(-34vmax,-8vmax,0) scale(1.06)}}",
"@keyframes tt-f3{to{transform:translate3d(26vmax,-6vmax,0) scale(1.12)}}",
"& .beam{position:absolute;left:50%;top:-6%;width:90%;height:62%;transform:translateX(-50%);background:radial-gradient(ellipse at 50% 0%,rgba(var(--moon),.17),transparent 68%);pointer-events:none}",
"& .shaft{position:absolute;left:50%;top:0;width:46%;height:74%;transform:translateX(-50%);background:linear-gradient(180deg,rgba(var(--moon),.11),transparent 90%);clip-path:polygon(34% 0,66% 0,100% 100%,0 100%);pointer-events:none;animation:tt-sh 9s ease-in-out infinite}",
"@keyframes tt-sh{0%,100%{opacity:.55}50%{opacity:1}}",
"& .grain{position:absolute;inset:0;pointer-events:none;opacity:.13;background-image:var(--grain);background-size:200px 200px}",
"& .vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 100% at 50% 45%,transparent 55%,rgba(0,0,0,.55) 100%)}",
"& canvas.sky{position:absolute;inset:0;width:100%;height:100%}",
"& .layer{position:absolute;inset:0}",
"& .scr{position:absolute;inset:0;display:flex;flex-direction:column;padding:calc(env(safe-area-inset-top,0px) + 10px) 22px calc(env(safe-area-inset-bottom,0px) + 18px);overflow-y:auto;overflow-x:hidden;animation:tt-in .6s ease both}",
"& .scr>*{flex-shrink:0}",
"& .scr.tb{overflow:hidden}",
"& .scr.tb>.chat{flex:1 1 0;min-height:0}",
"@keyframes tt-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}",
"& .top{display:flex;align-items:center;gap:8px;min-height:42px}",
"& .top .sp{flex:1}",
"& .ttl-s{flex:1;text-align:center;font-size:15px;letter-spacing:.3em;color:#d9cfb8}",
"& .ttl-s i{font-size:11px;color:var(--mute);letter-spacing:.06em;margin-left:6px}",
"& .rd{width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:rgba(255,255,255,.03);color:var(--ivory);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .2s,background .3s}",
"& .rd:active{transform:scale(.92);background:rgba(255,255,255,.1)}",
"& .pill{padding:11px 18px;border-radius:14px;border:1px solid rgba(234,223,200,.26);background:rgba(255,255,255,.035);color:var(--ivory);font:inherit;font-size:15px;letter-spacing:.12em;cursor:pointer;transition:transform .2s,background .3s,opacity .3s;display:inline-flex;align-items:center;justify-content:center;gap:8px;flex:1}",
"& .pill:active{transform:scale(.97);background:rgba(255,255,255,.12)}",
"& .pill[disabled]{opacity:.4;pointer-events:none}",
"& .pill.sm{padding:8px 14px;font-size:13px;letter-spacing:.08em;flex:none}",
"& .pill.main{width:100%;height:56px;border-color:rgba(201,164,92,.62);font-size:18px;letter-spacing:.7em;padding-left:calc(18px + .7em);background:linear-gradient(180deg,rgba(201,164,92,.13),rgba(201,164,92,.03));box-shadow:inset 0 0 0 1px rgba(201,164,92,.12),0 0 26px rgba(201,164,92,.07)}",
"& .pill.main i{font-size:12px;letter-spacing:.1em;color:#b59c68;font-style:italic}",
"& .hero{display:flex;gap:14px;align-items:flex-start;margin-top:6px}",
"& .vcol{display:flex;flex-direction:column;align-items:center;flex:none}",
"& .vt{writing-mode:vertical-rl;text-orientation:upright;font-size:40px;letter-spacing:.34em;line-height:1;padding-top:14px;background:linear-gradient(180deg,#f8eed3,#d4b06a 70%,#9d7d3f);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 0 14px rgba(232,207,143,.2))}",
"& .vt-l{width:1px;height:46px;background:linear-gradient(180deg,var(--brass),transparent);margin:12px auto 8px}",
"& .vt-it{writing-mode:vertical-rl;transform:rotate(180deg);font-style:italic;font-size:11px;letter-spacing:.34em;color:var(--mute)}",
"& .archw{position:relative;flex:1;max-width:260px;margin:0 auto;aspect-ratio:220/300;color:rgba(234,223,200,.8)}",
"& .archw .arch{position:absolute;inset:0}",
"& .archw svg{width:100%;height:100%}",
"& .ringbg{position:absolute;pointer-events:none;color:rgba(201,164,92,.32)}",
"& .ringbg svg{width:100%;height:100%;display:block}",
"& .ringbg .rot{transform-origin:200px 200px;animation:tt-rot 220s linear infinite}",
"@keyframes tt-rot{to{transform:rotate(360deg)}}",
"& .archw .ringbg{left:50%;top:66%;width:150%;aspect-ratio:1;transform:translate(-50%,-50%)}",
"& .archw .tw{animation:tt-tw 4.5s ease-in-out infinite;stroke:#f1e6c6}",
"@keyframes tt-tw{0%,100%{opacity:.15}50%{opacity:.95}}",
"& .glow{position:absolute;left:50%;top:66%;width:86%;aspect-ratio:1;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(201,164,92,.18),transparent 62%);pointer-events:none}",
"& .stack{position:absolute;left:50%;top:66%;width:36%;aspect-ratio:3/5;transform:translate(-50%,-50%);animation:tt-breath 6s ease-in-out infinite}",
"@keyframes tt-breath{50%{transform:translate(-50%,-52%)}}",
"& .bk{position:absolute;inset:0;border-radius:8px;background:linear-gradient(135deg,rgba(255,240,200,.07),transparent 40%),linear-gradient(160deg,#211a11,#0b0907);color:rgba(234,223,200,.78);box-shadow:inset 0 0 0 1px rgba(201,164,92,.28),inset 0 1px 0 rgba(255,255,255,.1),0 10px 30px rgba(0,0,0,.7)}",
"& .bk svg{width:100%;height:100%;display:block}",
"& .bk.b0{transform:rotate(-7deg) translateX(-8%)}& .bk.b1{transform:rotate(1deg)}& .bk.b2{transform:rotate(8deg) translateX(8%)}",
"& .stack.shuf .b0{animation:tt-sf0 1.3s cubic-bezier(.5,0,.3,1) both}",
"& .stack.shuf .b2{animation:tt-sf2 1.3s cubic-bezier(.5,0,.3,1) both}",
"& .stack.shuf .b1{animation:tt-sf1 1.3s ease both}",
"@keyframes tt-sf0{0%{transform:rotate(-7deg) translateX(-8%)}25%{transform:translateX(-95%) rotate(-12deg)}50%{transform:translateX(40%) rotate(4deg)}75%{transform:translateX(-80%) rotate(-10deg)}100%{transform:rotate(0) translateX(0)}}",
"@keyframes tt-sf2{0%{transform:rotate(8deg) translateX(8%)}25%{transform:translateX(95%) rotate(12deg)}50%{transform:translateX(-40%) rotate(-4deg)}75%{transform:translateX(80%) rotate(10deg)}100%{transform:rotate(0) translateX(0)}}",
"@keyframes tt-sf1{0%,100%{transform:rotate(1deg) translateY(0)}50%{transform:translateY(-8%) scale(1.04)}}",
"& .who{display:flex;align-items:center;gap:12px;margin:14px 0 2px}",
"& .who .av{width:42px;height:42px;border:1px solid var(--line)}",
"& .who .nm{flex:1;font-size:17px;letter-spacing:.06em}",
"& .who .nm i{display:block;font-style:normal;font-size:12px;color:var(--mute);letter-spacing:.06em;margin-top:2px}",
"& .av{border-radius:50%;background:#251d14 center/cover no-repeat;display:flex;align-items:center;justify-content:center;color:var(--ivory);font-size:15px;flex:0 0 auto}",
"& textarea,& input.in{width:100%;border-radius:14px;border:1px solid var(--line);background:rgba(10,8,6,.62);color:#f4ecd9;font:inherit;font-size:15px;padding:12px 15px;outline:none;resize:none;transition:border-color .3s,box-shadow .3s}",
"& textarea:focus,& input.in:focus,& input.num:focus{border-color:rgba(201,164,92,.6);box-shadow:0 0 0 3px rgba(201,164,92,.08)}",
"& .hint{color:var(--mute);font-size:12.5px;line-height:1.7;margin:4px 2px}",
"& .lab{font-size:13px;letter-spacing:.2em;color:#b8ac95;margin:18px 0 8px}",
"& .lab i,& .sh-t i{font-size:.82em;letter-spacing:.04em;color:var(--mute);font-style:italic}",
"& .seg{display:flex;gap:4px;padding:3px;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid var(--line)}",
"& .seg button{flex:1;padding:9px 6px;border:0;border-radius:11px;background:transparent;color:var(--mute);font:inherit;font-size:14px;cursor:pointer;transition:background .35s,color .35s}",
"& .seg button.on{background:rgba(234,223,200,.12);color:#fff}",
"& .go{margin-top:16px}",
"& .tally{font-size:13px;letter-spacing:.06em;color:#d0c6b0;white-space:nowrap}",
"& .ph{display:flex;gap:9px;align-items:center;flex:1;justify-content:center}",
"& .ph i{width:9px;height:9px;border-radius:50%;border:1px solid rgba(234,223,200,.28);transition:all .5s}",
"& .ph i.done{background:var(--ivory);border-color:var(--ivory)}",
"& .ph i.cur{border-color:var(--brass);box-shadow:0 0 9px rgba(201,164,92,.55)}",
"& .cards{display:flex;justify-content:center;gap:14px;padding:12px 0 4px;position:relative}",
"& .cards .ringbg{left:50%;top:50%;width:min(112vw,470px);aspect-ratio:1;transform:translate(-50%,-50%)}",
"& .cards::before{content:'';position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:min(86vw,340px);height:112%;border-radius:999px 999px 0 0;border:1px solid var(--line);border-bottom:0;pointer-events:none}",
"& .slot{text-align:center;position:relative;animation:tt-deal .9s cubic-bezier(.2,.9,.25,1.1) both}",
"& .slot.still{animation:none}",
"@keyframes tt-deal{0%{opacity:0;transform:translate(var(--dx,0px),-26px) rotate(var(--rt,0deg)) scale(.86)}55%{opacity:1}100%{opacity:1;transform:none}}",
"& .cd{width:clamp(72px,23vw,96px);aspect-ratio:3/5;perspective:900px}",
"& .cards.one .cd{width:clamp(104px,33vw,132px)}",
"& .slot.fl .cd{animation:tt-lift 1.2s cubic-bezier(.3,.7,.3,1)}",
"@keyframes tt-lift{40%{transform:translateY(-10px) scale(1.06)}}",
"& .inner{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform 1.1s cubic-bezier(.22,.8,.2,1),box-shadow .8s;border-radius:8px}",
"& .inner.flip{transform:rotateY(180deg)}",
"& .slot.cur .inner{box-shadow:0 0 0 1px rgba(201,164,92,.6),0 12px 40px rgba(201,164,92,.12)}",
"& .face{position:absolute;inset:0;border-radius:8px;backface-visibility:hidden;-webkit-backface-visibility:hidden;overflow:hidden;background:linear-gradient(135deg,rgba(255,240,200,.08),transparent 38%),radial-gradient(90% 70% at 50% 40%,rgba(201,164,92,.07),transparent),linear-gradient(160deg,#221b12,#0b0907);box-shadow:inset 0 0 0 1px rgba(201,164,92,.30),inset 0 0 0 3px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.1),0 8px 24px rgba(0,0,0,.6);color:rgba(234,223,200,.86)}",
"& .face.back svg{width:100%;height:100%;display:block}",
"& .face.front{transform:rotateY(180deg)}",
"& .face.front::before{content:'';position:absolute;inset:4px;border:1px solid rgba(234,223,200,.20);border-radius:5px;pointer-events:none}",
"& .face.front::after{content:'';position:absolute;inset:-30%;background:linear-gradient(112deg,transparent 42%,rgba(255,238,196,.5) 50%,transparent 58%);transform:translateX(-130%);pointer-events:none}",
"& .inner.flip .face.front::after{animation:tt-shine 1.5s .5s ease both}",
"@keyframes tt-shine{to{transform:translateX(130%)}}",
"& .orn{position:absolute;inset:0;pointer-events:none}",
"& .orn svg{width:100%;height:100%;display:block}",
"& .fc{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:9% 8% 7%}",
"& .fc.rev{transform:rotate(180deg)}",
"& .fc .n{font-size:10.5px;letter-spacing:.24em;color:#b99a5f;padding-left:.24em}",
"& .fc .a{flex:1;width:80%;min-height:0;display:flex;align-items:center}",
"& .fc .a svg{width:100%;height:auto;max-height:100%}",
"& .fc .m{text-align:center;padding-left:.1em}",
"& .fc .m b{display:block;font-weight:400;font-size:11.5px;letter-spacing:.14em;color:#e9dfca}",
"& .fc .m i{display:block;font-size:8.5px;letter-spacing:.03em;color:#a89c82;line-height:1.25;margin-top:2px}",
"& .cp{margin-top:8px;font-size:11.5px;color:var(--mute);min-height:15px;letter-spacing:.08em;transition:color .5s}",
"& .cp span{display:block}& .cp i{display:block;font-size:10px;font-style:italic;letter-spacing:.03em;color:#7d7463}",
"& .slot.cur .cp{color:#e2d8c2}",
"& .dust{position:absolute;left:50%;top:40%;width:3px;height:3px;border-radius:50%;background:#f4e6c0;opacity:0;pointer-events:none;animation:tt-dust 1.1s ease-out forwards}",
"@keyframes tt-dust{0%{opacity:.9;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--x),var(--y)) scale(.3)}}",
"& .chat{overflow-y:auto;padding:14px 0 10px;-webkit-mask-image:linear-gradient(180deg,transparent,#000 7%);mask-image:linear-gradient(180deg,transparent,#000 7%)}",
"& .beat{margin:14px 0;animation:tt-in .6s ease both}",
"& .beat .w{display:flex;align-items:center;gap:7px;font-size:11.5px;letter-spacing:.2em;color:var(--mute);margin-bottom:5px}",
"& .beat .w .av{width:18px;height:18px;font-size:10px}",
"& .beat.tarot .tx{font-style:italic;font-size:17px;line-height:1.75;color:#f7efdc;padding-left:14px;border-left:1px solid rgba(201,164,92,.65)}",
"& .beat.tarot .w{color:#cdbfa4}",
"& .beat.char .tx{font-size:15.5px;line-height:1.8;color:#d8d0bf;padding-left:14px}",
"& .beat.re .tx{font-size:14.5px;color:#cdbfa6}",
"& .beat.user .tx{font-size:13px;color:var(--mute);text-align:right;font-style:italic}",
"& .beat .tx{white-space:pre-wrap;word-break:break-word}",
"& .sys{text-align:center;color:var(--mute);font-size:12px;letter-spacing:.16em;margin:12px 0}",
"& .pulse{display:inline-block;color:#cdbfa4;animation:tt-pulse 1.6s ease-in-out infinite}",
"@keyframes tt-pulse{50%{opacity:.25}}",
"& .acts{display:flex;flex-direction:column;gap:9px;padding-top:6px}",
"& .row{display:flex;gap:8px;align-items:center}",
"& .acts .pill{padding:12px 6px;font-size:14px;letter-spacing:.08em}",
"& .res{text-align:center;font-size:16px;color:#f0e6cf;letter-spacing:.14em;padding:2px 0}",
"& .shade{position:absolute;inset:0;background:rgba(0,0,0,.62);opacity:0;pointer-events:none;transition:opacity .45s;z-index:20}",
"& .shade.on{opacity:1;pointer-events:auto}",
"& .sheet{position:absolute;left:0;right:0;bottom:0;max-height:86%;display:flex;flex-direction:column;z-index:21;border-radius:24px 24px 0 0;background:var(--grain),linear-gradient(180deg,#1d160e 0%,#110d08 100%);background-blend-mode:soft-light,normal;border-top:1px solid rgba(201,164,92,.5);box-shadow:0 -20px 60px rgba(0,0,0,.65);transform:translateY(106%);transition:transform .55s cubic-bezier(.2,.9,.25,1);padding-bottom:env(safe-area-inset-bottom,0px)}",
"& .sheet.on{transform:none}",
"& .grab{width:40px;height:3px;border-radius:2px;background:rgba(234,223,200,.28);margin:9px auto 4px;flex:none;touch-action:none}",
"& .sh-h{display:flex;align-items:center;justify-content:space-between;padding:6px 22px 10px;flex:none}",
"& .sh-t{font-size:20px;letter-spacing:.3em;color:#f4ecd9}",
"& .sh-t i{margin-left:10px;letter-spacing:.04em}",
"& .sh-b{overflow-y:auto;padding:0 22px 22px;flex:1;min-height:0}",
"& .rw{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.06);font-size:14.5px}",
"& .rw small{display:block;color:var(--mute);font-size:12px;margin-top:2px}",
"& .sw{width:42px;height:24px;border-radius:12px;background:rgba(255,255,255,.12);position:relative;transition:background .35s;flex:none;cursor:pointer}",
"& .sw::after{content:'';position:absolute;left:3px;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .35s cubic-bezier(.3,.9,.3,1)}",
"& .sw.on{background:rgba(201,164,92,.75)}& .sw.on::after{transform:translateX(18px)}",
"& .step{display:flex;align-items:center;gap:6px;flex:none}",
"& .step button{width:32px;height:32px;border-radius:50%;border:1px solid var(--line);background:rgba(255,255,255,.04);color:#fff;font:inherit;font-size:17px;cursor:pointer}",
"& input.num{width:54px;height:32px;text-align:center;border-radius:10px;border:1px solid var(--line);background:rgba(8,6,4,.7);color:#fff;font:inherit;font-size:15px;outline:none}",
"& .chg{display:grid;grid-template-columns:repeat(4,1fr);gap:14px 8px;padding-top:8px}",
"& .chg .ch{text-align:center;cursor:pointer;opacity:.5;transition:opacity .3s,transform .3s}",
"& .chg .ch.on{opacity:1;transform:translateY(-2px)}",
"& .chg .av{width:56px;height:56px;margin:0 auto 6px;border:1px solid var(--line)}",
"& .chg .ch.on .av{border-color:rgba(201,164,92,.85)}",
"& .chg .cn{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
"& .hs{padding:13px 0;border-bottom:1px solid rgba(255,255,255,.06);font-size:13.5px;line-height:1.7}",
"& .hs b{font-weight:400;color:#f4ecd9}",
"& .hs p{margin:4px 0 8px;color:#aea38c;font-size:13px}",
"& .hs .tag{display:inline-block;font-size:11px;color:var(--brass2);border:1px solid rgba(201,164,92,.4);border-radius:8px;padding:0 7px;margin-left:8px;letter-spacing:.06em}",
"& .memw{position:relative;margin-top:8px}",
"& textarea.mem{min-height:160px;line-height:1.75;font-size:14.5px}",
"& .busy{position:absolute;inset:0;border-radius:14px;background:rgba(10,8,6,.9);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:var(--brass2);letter-spacing:.22em;font-size:14px;opacity:0;pointer-events:none;transition:opacity .3s}",
"& .busy.on{opacity:1;pointer-events:auto}",
"& .busy .bar{width:56%;height:2px;background:rgba(234,223,200,.12);overflow:hidden;border-radius:2px;position:relative}",
"& .busy .bar::after{content:'';position:absolute;top:0;bottom:0;left:0;width:38%;background:linear-gradient(90deg,transparent,var(--brass2),transparent);animation:tt-bar 1.2s ease-in-out infinite}",
"@keyframes tt-bar{from{transform:translateX(-100%)}to{transform:translateX(270%)}}",
"& pre.bi{white-space:pre-wrap;font:inherit;font-size:12.5px;line-height:1.7;color:#b3a88f;background:rgba(0,0,0,.4);border:1px solid var(--line);border-radius:12px;padding:12px;margin:10px 0}",
"@media (prefers-reduced-motion:reduce){& *{animation-duration:.01s!important;animation-iteration-count:1!important}& .inner{transition-duration:.01s}}"
  ].join("\n");

  /* ================= 天空：星、尘、流星 ================= */
  function startSky(canvas, C) {
    var g = canvas.getContext("2d"), W = 0, H = 0, stars = [], dust = [], shoots = [], raf = 0, last = 0;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2), r = canvas.getBoundingClientRect();
      W = r.width || 360; H = r.height || 640;
      canvas.width = W * dpr; canvas.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(80, (W * H) / 10000)); stars = [];
      for (var i = 0; i < n; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.1 + 0.2, p: Math.random() * 6.28, s: Math.random() * 0.016 + 0.004, gold: Math.random() < 0.1 });
      dust = [];
      for (var j = 0; j < 46; j++) dust.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + 0.4, vx: (Math.random() - 0.5) * 0.12, vy: -(Math.random() * 0.16 + 0.03), p: Math.random() * 6.28, s: Math.random() * 0.01 + 0.004 });
      if (reduce) draw();
    }
    function draw() {
      g.clearRect(0, 0, W, H);
      var i;
      for (i = 0; i < stars.length; i++) {
        var s = stars[i]; s.p += s.s;
        g.globalAlpha = 0.18 + 0.7 * Math.abs(Math.sin(s.p));
        g.fillStyle = s.gold ? "#efd9a0" : "#e8e6ef";
        g.beginPath(); g.arc(s.x, s.y, s.r, 0, 6.283); g.fill();
      }
      for (i = 0; i < dust.length; i++) {
        var d = dust[i]; d.p += d.s; d.x += d.vx; d.y += d.vy;
        if (d.y < -4) { d.y = H + 4; d.x = Math.random() * W; }
        if (d.x < -4) d.x = W + 4; if (d.x > W + 4) d.x = -4;
        g.globalAlpha = 0.08 + 0.34 * Math.abs(Math.sin(d.p));
        g.fillStyle = "#e6d3a6";
        g.beginPath(); g.arc(d.x, d.y, d.r, 0, 6.283); g.fill();
      }
      g.globalAlpha = 1;
      if (!reduce) {
        if (Math.random() < 0.007 && shoots.length < 2) shoots.push({ x: W * 0.25 + Math.random() * W * 0.8, y: Math.random() * H * 0.4, vx: -(4.5 + Math.random() * 2.5), vy: 1.8 + Math.random() * 1.8, l: 1 });
        shoots = shoots.filter(function (m) { return m.l > 0; });
        shoots.forEach(function (m) {
          var tx = m.x - m.vx * 16, ty = m.y - m.vy * 16, gr = g.createLinearGradient(m.x, m.y, tx, ty);
          gr.addColorStop(0, "rgba(250,240,214," + m.l * 0.3 + ")"); gr.addColorStop(1, "rgba(250,240,214,0)");
          g.strokeStyle = gr; g.lineWidth = 3.4; g.lineCap = "round"; g.beginPath(); g.moveTo(m.x, m.y); g.lineTo(tx, ty); g.stroke();
          gr = g.createLinearGradient(m.x, m.y, tx, ty);
          gr.addColorStop(0, "rgba(255,248,228," + m.l + ")"); gr.addColorStop(1, "rgba(255,248,228,0)");
          g.strokeStyle = gr; g.lineWidth = 1.1; g.beginPath(); g.moveTo(m.x, m.y); g.lineTo(tx, ty); g.stroke();
          g.fillStyle = "rgba(255,250,235," + m.l + ")"; g.beginPath(); g.arc(m.x, m.y, 1.3, 0, 6.283); g.fill();
          m.x += m.vx; m.y += m.vy; m.l -= 0.012;
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
  var DEFAULTS = { v: SETTINGS_VERSION, charId: "", mode: "ask", spread: 3, question: "", useCore: true, nFacts: 20, nChat: 10, askWrite: false, useAI: false, customPrompt: "" };
  var BUILTIN_PROMPT = [
    "你是 Roche 的记忆整理员。下面是一局「塔罗桌」互动的记录，请据此写一条可以写入「事实记忆」的记忆。",
    "要求：",
    "1. 2 到 4 句，中文，第三人称，信息密度高。必须保留 user 最初的塔罗问题（可以略微精简，但不能改意）。",
    "2. 只保留对后续剧情有用的信息：这一局暴露出的事实、角色对塔罗的态度、他在意或回避的事、他与 user 之间关系的变化，以及 user 最后站了谁。",
    "3. 不要写动作、神态、语气、场景描写（比如“沉默了几秒”“转过身”），也不要复述逐轮过程。",
    "4. 可以保留角色最有代表性的一句原话（不超过 20 字，加引号）。牌只点出最关键的一两张。",
    "5. 不要写塔罗牌义，不要评价和加戏；记录里没出现的事一律不要编。",
    "6. 只输出记忆正文，不要标题、前缀、解释。"
  ].join("\n");
  function saveSettings() { try { return ctx.roche.storage.set("settings", ctx.settings); } catch (e) {} }
  function saveHistory() { try { return ctx.roche.storage.set("history", ctx.history); } catch (e) {} }
  function curChar() {
    var C = ctx;
    return C.chars.find(function (c) { return String(c.id) === String(C.settings.charId); }) || C.chars[0] || null;
  }

  /* ================= 底部面板 ================= */
  function openSheet(title, it, body) {
    var C = ctx, closed = false;
    var shade = h("div", { class: "shade", onclick: close });
    var grab = h("div", { class: "grab" });
    var sheet = h("div", { class: "sheet" }, grab,
      h("div", { class: "sh-h" }, h("div", { class: "sh-t" }, title, it ? h("i", { text: it }) : null), h("button", { class: "pill sm", text: "收起", onclick: close })),
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
    return { close: close };
  }

  function toggleRow(label, sub, key) {
    var S = ctx.settings;
    var sw = h("div", { class: "sw" + (S[key] ? " on" : ""), onclick: function () { S[key] = !S[key]; sw.classList.toggle("on", S[key]); saveSettings(); } });
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
    var C = ctx, S = C.settings, body = h("div");
    openSheet("设置", "Impostazioni", body);
    function render() {
      var sel = curChar();
      var bi = h("pre", { class: "bi", text: BUILTIN_PROMPT });
      bi.style.display = "none";
      var cp = h("textarea", { rows: "5", placeholder: "留空就使用内置提示词。本局记录会自动附在提示词后面发给 AI。" });
      cp.value = S.customPrompt || "";
      cp.addEventListener("input", function () { S.customPrompt = cp.value; });
      cp.addEventListener("change", saveSettings);
      var viewBtn = h("button", { class: "pill sm", text: "查看内置提示词", onclick: function () {
        var show = bi.style.display === "none";
        bi.style.display = show ? "block" : "none";
        viewBtn.textContent = show ? "收起内置提示词" : "查看内置提示词";
        if (show && bi.scrollIntoView) setTimeout(function () { try { bi.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) {} }, 80);
      } });
      var tplBtn = h("button", { class: "pill sm", text: "以它为模板", onclick: function () {
        cp.value = BUILTIN_PROMPT; S.customPrompt = BUILTIN_PROMPT; saveSettings(); cp.focus(); C.roche.ui.toast("已填入输入框，可以直接修改");
      } });
      var clrBtn = h("button", { class: "pill sm", text: "清空自定义", onclick: function () { S.customPrompt = ""; saveSettings(); render(); } });
      var bl = h("textarea", { rows: "3", placeholder: "留空 = 根据人设自动判断。比如：相信，但讨厌被人看穿 / 完全不信，认为是心理暗示" });
      bl.value = (sel && S.belief[sel.id]) || "";
      bl.addEventListener("input", function () { if (sel) S.belief[sel.id] = bl.value; });
      bl.addEventListener("change", saveSettings);
      fill(body, [
        lab("玩法", "Modalità"),
        seg([["ask", "问牌"], ["self", "ta 自己占"]], S.mode, function (v) { S.mode = v; saveSettings(); render(); renderHome(); }),
        lab("牌阵", "Stesa"),
        seg([[3, "三张"], [1, "单张"]], S.spread, function (v) { S.spread = v; saveSettings(); render(); }),
        lab(sel ? dispName(sel) + " 对塔罗的态度" : "角色对塔罗的态度", "Fede"),
        bl,
        h("div", { class: "hint", text: "不填的话，AI 会根据 ta 的人设、职业、信仰和经历自己判断：信科学的会驳斥，有信仰的本来就倾向相信。" }),
        lab("让 ta 参考", "Memoria"),
        toggleRow("核心记忆", "整段核心记忆", "useCore"),
        h("div", { class: "rw" }, h("div", null, "事实记忆条数", h("small", { text: "0 = 不读取" })), stepper("nFacts", 0, 100, 5)),
        h("div", { class: "rw" }, h("div", null, "最近聊天条数", h("small", { text: "0 = 不读取；条数越多越耗 token" })), stepper("nChat", 0, 100, 5)),
        lab("牌局结束后", "Dopo la stesa"),
        toggleRow("自动弹出「写入记忆」", "默认关闭；关闭时仍可在牌局结束后手动点「写入记忆」", "askWrite"),
        toggleRow("弹出时自动用 AI 总结", "默认关闭；开启后每次弹出都会调用一次 AI", "useAI"),
        lab("总结提示词", "Istruzioni"),
        h("div", { class: "row", style: "flex-wrap:wrap" }, viewBtn, tplBtn, clrBtn),
        bi, cp
      ]);
    }
    render();
  }

  function openChars() {
    var C = ctx, S = C.settings, sel = curChar(), sh;
    var grid = h("div", { class: "chg" }, C.chars.length ? C.chars.map(function (c) {
      return h("div", { class: "ch" + (sel && c.id === sel.id ? " on" : ""), onclick: function () { S.charId = c.id; saveSettings(); sh.close(); renderHome(); } },
        avatarEl(c.avatar, dispName(c)), h("div", { class: "cn", text: dispName(c) }));
    }) : h("div", { class: "hint", text: "没有读到角色，请先在 Roche 里创建角色。" }));
    sh = openSheet("占谁", "Per chi", grid);
  }

  function openHistory() {
    var C = ctx, body = h("div"), sh = openSheet("记录", "Registro", body);
    function render() {
      if (!C.history.length) { fill(body, h("div", { class: "hint", text: "还没有牌局。洗一次牌就会有记录。" })); return; }
      fill(body, [
        C.history.map(function (r) {
          var d = new Date(r.t), ds = (d.getMonth() + 1) + "/" + d.getDate() + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
          return h("div", { class: "hs" },
            h("b", { text: r.cname + " · " + (r.mode === "ask" ? "问牌" : "自占") + " · " + ds }),
            r.written ? h("span", { class: "tag", text: "已写入记忆" }) : null,
            h("p", { text: (r.q ? "问：" + sumLines(r.q, 40) + "　" : "") + r.cards.join("、") + "　塔罗 " + r.tally.tarot + " : " + r.tally.char + " " + r.cname }),
            h("div", { class: "row" },
              h("button", { class: "pill sm", text: "回放", onclick: function () { sh.close(); renderReplay(r); } }),
              h("button", { class: "pill sm", text: "删除", onclick: async function () {
                var ok = await C.roche.ui.confirm({ title: "删除这条记录？", message: "只删除插件里的牌局记录，不会动已经写入 Roche 的记忆。" });
                if (!ok) return;
                C.history = C.history.filter(function (x) { return x.t !== r.t; }); saveHistory(); render();
              } })));
        })
      ]);
    }
    render();
  }

  /* ================= 记忆整理与写入 ================= */
  function recordText(rec) {
    var lines = (rec.log || []).filter(function (x) { return x.who !== "card"; }).slice(-44).map(function (x) {
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
    var C = ctx, R = C.roche, S = C.settings, busy = false, sh = null;
    var ta = h("textarea", { class: "mem", rows: "6", placeholder: "这里是要写入的记忆，随时可以自己改。" });
    ta.value = rec.summary || "";
    ta.addEventListener("input", function () { rec.summary = ta.value; });
    var overlay = h("div", { class: "busy" }, h("span", { class: "pulse", html: sigil(30) }), h("div", { text: "正在整理这一局……" }), h("div", { class: "bar" }));
    var status = h("div", { class: "hint" });
    var fb = h("input", { class: "in", placeholder: "给上一版提点意见，比如：再短一点，多写他的反应" });
    var genBtn = h("button", { class: "pill sm", text: rec.summary ? "重新生成" : "AI 整理", onclick: function () { gen(""); } });
    var fbBtn = h("button", { class: "pill sm", text: "按意见重写", onclick: function () { gen(fb.value.trim()); } });
    var fbToggle = h("button", { class: "pill sm", text: "提意见", onclick: function () { fbRow.style.display = fbRow.style.display === "none" ? "flex" : "none"; } });
    var fbRow = h("div", { class: "row", style: "display:none;margin-top:8px" }, fb, fbBtn);
    var saveBtn = h("button", { class: "pill", text: rec.memoryId ? "更新记忆" : "写入记忆", onclick: save });
    var all = [genBtn, fbBtn, fbToggle, saveBtn];
    function setBusy(b) {
      busy = b; overlay.classList.toggle("on", b);
      all.forEach(function (x) { x.disabled = b; });
      genBtn.textContent = b ? "整理中…" : "重新生成";
    }
    var body = h("div",
      h("div", { class: "hint", text: "写入的是 Roche 主事实记忆，卸载插件后不会自动删除。内容你可以随意修改。" }),
      h("div", { class: "memw" }, ta, overlay), status,
      h("div", { class: "row", style: "margin-top:10px" }, genBtn, fbToggle),
      fbRow,
      h("div", { class: "row", style: "margin-top:14px" }, saveBtn));
    sh = openSheet("记忆", "Memoria", body);

    async function gen(feedback) {
      if (busy) return;
      setBusy(true); status.textContent = "";
      try {
        var t = await summarize(rec, ta.value, feedback);
        if (C.disposed) return;
        ta.value = t; rec.summary = t; if (feedback) fb.value = "";
      } catch (e) { status.textContent = "整理失败：" + ((e && e.message) || "请检查 AI 配置") + "。可以重试，或者自己写。"; }
      setBusy(false);
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
    C.replayId++; C.t = null;
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
    } }, h("span", { text: "洗牌" }), h("i", { text: "Mescolare" }));
    if (!sel) go.disabled = true;

    setScreen(h("div", { class: "scr" },
      h("div", { class: "top" },
        h("button", { class: "rd", html: ICON_BACK, onclick: function () { C.roche.ui.closeApp(); } }), h("div", { class: "sp" }),
        h("button", { class: "pill sm", text: "记录", onclick: openHistory }),
        h("button", { class: "pill sm", text: "设置", onclick: openSettings })),
      h("div", { class: "hero" },
        h("div", { class: "vcol" }, h("div", { class: "vt", text: "塔罗桌" }), h("div", { class: "vt-l" }), h("div", { class: "vt-it", text: "Tarocchi" })),
        h("div", { class: "archw" }, h("div", { class: "ringbg", html: ringSvg() }), h("div", { class: "arch", html: archSvg() }), h("div", { class: "glow" }), stack)),
      sel ? h("div", { class: "who" }, avatarEl(sel.avatar, dispName(sel)),
        h("div", { class: "nm" }, dispName(sel), h("i", { text: S.mode === "ask" ? "你向牌询问 ta" : "ta 自己抽牌" })),
        h("button", { class: "pill sm", text: "更换", onclick: openChars }))
        : h("div", { class: "hint", text: "还没有读到角色，请先在 Roche 里创建角色。" }),
      S.mode === "ask" ? h("div", { style: "margin-top:12px" }, q) : h("div", { class: "hint", style: "margin-top:12px", text: "自占模式：ta 会自己抽牌，塔罗解读 ta，ta 按自己的性格回应。" }),
      h("div", { class: "go" }, go)
    ));
  }

  /* ================= 牌桌：牌行 / 对话气泡（牌局与回放共用） ================= */
  var POS_ASK = ["表层", "暗流", "底牌"], POS_SELF = ["他想的", "他躲的", "他不认的"];
  function posFor(mode) { return mode === "ask" ? POS_ASK : POS_SELF; }
  function oriIt(rev) { return rev ? "Rovesciata" : "Dritta"; }

  function setCp(sl, label, rev, one) {
    fill(sl.cp, [h("span", { text: (one || !label ? "" : label + " · ") + (rev ? "逆位" : "正位") }), h("i", { text: oriIt(rev) })]);
  }
  function cardsRow(cards, pos, flipped, animate) {
    var one = cards.length === 1, slots = [];
    var el = h("div", { class: "cards" + (one ? " one" : "") }, h("div", { class: "ringbg", html: ringSvg() }), cards.map(function (c, i) {
      var inner = h("div", { class: "inner" + (flipped ? " flip" : "") },
        h("div", { class: "face back", html: backSvg() }),
        h("div", { class: "face front" }, h("div", { class: "orn", html: ornSvg() }),
          h("div", { class: "fc" + (c.rev ? " rev" : "") },
            h("div", { class: "n", text: c.num }), h("div", { class: "a", html: artSvg(c) }),
            h("div", { class: "m" }, h("b", { text: c.name }), h("i", { text: itName(c) })))));
      var cp = h("div", { class: "cp", text: one ? "" : pos[i] });
      var slot = h("div", { class: "slot" + (animate ? "" : " still"), style: animate ? "--dx:" + (one ? 0 : (1 - i) * 100) + "px;--rt:" + ((i - 1) * 6) + "deg;animation-delay:" + (i * 0.17 + 0.05) + "s" : "" }, h("div", { class: "cd" }, inner), cp);
      var sl = { slot: slot, inner: inner, cp: cp, card: c, label: pos[i], one: one };
      if (flipped) setCp(sl, pos[i], c.rev, one);
      slots.push(sl);
      return slot;
    }));
    return { el: el, slots: slots };
  }
  function flipSlot(sl) {
    sl.slot.classList.add("fl"); sl.inner.classList.add("flip");
    later(function () { burst(sl.slot); }, 650);
    later(function () { setCp(sl, sl.label, sl.card.rev, sl.one); }, 600);
  }
  function unflipSlot(sl) {
    sl.slot.classList.remove("fl"); sl.inner.classList.remove("flip");
    sl.cp.textContent = sl.one ? "" : sl.label;
  }
  function burst(slotEl) {
    for (var k = 0; k < 14; k++) {
      var a = Math.random() * 6.283, d = 30 + Math.random() * 46;
      var p = h("i", { class: "dust", style: "--x:" + Math.round(Math.cos(a) * d) + "px;--y:" + Math.round(Math.sin(a) * d - 8) + "px;animation-delay:" + (Math.random() * 0.2) + "s" });
      slotEl.append(p);
      (function (n) { setTimeout(function () { n.remove(); }, 1500); })(p);
    }
  }
  /* ps = { cname, avatar } */
  function makeBeat(ps, kind, text, cls) {
    var tx = h("div", { class: "tx" });
    if (kind === "sys") { var sysEl = h("div", { class: "sys", text: text }); return { el: sysEl, tx: sysEl }; }
    var who = kind === "tarot" ? h("div", { class: "w" }, h("span", { html: sigil(16) }), h("span", { text: "塔罗" }))
      : kind === "char" ? h("div", { class: "w" }, avatarEl(ps.avatar, ps.cname), h("span", { text: ps.cname }))
      : null;
    return { el: h("div", { class: "beat " + kind + (cls ? " " + cls : "") }, who, tx), tx: tx };
  }
  function scrollDown(c) {
    c = c || (ctx && ctx.t && ctx.t.chat);
    if (!c) return;
    c.scrollTop = c.scrollHeight;
    requestAnimationFrame(function () { c.scrollTop = c.scrollHeight; });
  }
  function typeInto(el, text, chatEl) {
    return new Promise(function (res) {
      var chars = Array.from(text), i = 0, step = chars.length > 60 ? 2 : 1;
      (function tick() {
        if (!ctx || ctx.disposed) return res();
        i = Math.min(chars.length, i + step); el.textContent = chars.slice(0, i).join(""); scrollDown(chatEl);
        if (i >= chars.length) return res();
        later(tick, 30);
      })();
    });
  }

  /* ================= 回放 ================= */
  function renderReplay(rec) {
    var C = ctx, R = C.roche, myTok = ++C.replayId;
    var ps = { cname: rec.cname, avatar: rec.avatar || "" };
    var chat = h("div", { class: "chat" });
    var row = rec.cardData && rec.cardData.length ? cardsRow(rec.cardData, posFor(rec.mode), true, false) : null;
    var slots = row ? row.slots : [];
    var hasMarks = (rec.log || []).some(function (e) { return e.who === "card"; });
    var memBtn = h("button", { class: "pill", text: rec.memoryId || rec.written ? "编辑记忆" : "整理记忆", onclick: function () { openMemory(rec); } });
    var replayBtn = h("button", { class: "pill", text: "重播", onclick: replay });
    C.t = { chat: chat, memBtn: memBtn };

    function showAll() {
      fill(chat, (rec.log || []).filter(function (e) { return e.who !== "card"; }).map(function (e) {
        var b = makeBeat(ps, e.who, e.text, e.cls); b.tx.textContent = e.text; return b.el;
      }));
      chat.scrollTop = 0;
    }
    async function replay() {
      var tok = ++C.replayId; replayBtn.disabled = true;
      chat.replaceChildren(); slots.forEach(unflipSlot);
      await sleep(500);
      if (!hasMarks) slots.forEach(flipSlot);
      for (var k = 0; k < rec.log.length; k++) {
        if (tok !== C.replayId || C.disposed) return;
        var e = rec.log[k];
        if (e.who === "card") { if (slots[e.i]) flipSlot(slots[e.i]); await sleep(1300); continue; }
        var b = makeBeat(ps, e.who, e.text, e.cls); chat.append(b.el); scrollDown(chat);
        if (e.who === "tarot" || e.who === "char") { await typeInto(b.tx, e.text, chat); await sleep(450); }
        else { b.tx.textContent = e.text; await sleep(500); }
      }
      if (tok === C.replayId) replayBtn.disabled = false;
    }

    var d = new Date(rec.t);
    setScreen(h("div", { class: "scr tb" },
      h("div", { class: "top" }, h("button", { class: "rd", html: ICON_BACK, onclick: function () { renderHome(); openHistory(); } }),
        h("div", { class: "ttl-s" }, "回放", h("i", { text: "Rivedi" })),
        h("div", { class: "tally", text: "塔罗 " + rec.tally.tarot + " : " + rec.tally.char + " " + rec.cname })),
      row ? row.el : h("div", { class: "hint", text: rec.cards.join("、") + "（这是旧记录，没有保存牌面）" }),
      h("div", { class: "hint", style: "text-align:center", text: (rec.mode === "ask" ? "问：" + sumLines(rec.q, 50) : rec.cname + " 自占") + "　·　" + (d.getMonth() + 1) + "/" + d.getDate() }),
      chat,
      h("div", { class: "acts" },
        h("div", { class: "row" }, replayBtn, memBtn),
        h("div", { class: "row" },
          rec.memoryId ? h("button", { class: "pill", text: "删除这条记忆", onclick: async function () {
            var ok = await R.ui.confirm({ title: "删除这条记忆？", message: "会从 Roche 主事实记忆里删除。" });
            if (!ok) return;
            try { await R.memory.delete(rec.memoryId); rec.memoryId = null; rec.written = false; saveHistory(); R.ui.toast("已删除"); renderReplay(rec); } catch (e) { R.ui.toast("删除失败"); }
          } }) : null,
          h("button", { class: "pill", text: "删除这条记录", onclick: async function () {
            var ok = await R.ui.confirm({ title: "删除这条记录？", message: "只删除插件里的牌局记录，不会动已经写入 Roche 的记忆。" });
            if (!ok) return;
            C.history = C.history.filter(function (x) { return x.t !== rec.t; }); saveHistory(); renderHome(); openHistory();
          } })))));
    showAll();
  }

  /* ================= 牌局 ================= */
  async function loadContext(char) {
    var C = ctx, S = C.settings, R = C.roche, parts = [];
    if (!char.conversationId) return "";
    try {
      if (S.useCore || S.nFacts > 0) {
        var m = await R.memory.getLongTerm({ conversationId: char.conversationId, limit: Math.max(S.nFacts, 1) });
        if (S.useCore && m && m.core && m.core.summary) parts.push("Core memory: " + m.core.summary);
        if (S.nFacts > 0) {
          var f = ((m && m.facts) || []).map(function (x) { return x.summaryText || x.action || x.text || ""; }).filter(Boolean).slice(0, S.nFacts);
          if (f.length) parts.push("Fact memories:\n- " + f.join("\n- "));
        }
      }
    } catch (e) {}
    try {
      if (S.nChat > 0) {
        var msgs = (await R.memory.getShortTerm({ conversationId: char.conversationId, limit: S.nChat })) || [];
        msgs = msgs.slice().sort(function (a, b) { return (a.timestamp || 0) - (b.timestamp || 0); }).slice(-S.nChat);
        var t = msgs.map(function (x) { return (x.senderHandle || x.senderName || "?") + ": " + sumLines(x.text, 200); }).filter(function (x) { return x.length > 3; });
        if (t.length) parts.push("Recent chat (background only):\n" + t.join("\n"));
      }
    } catch (e) {}
    return parts.join("\n\n").slice(0, 9000);
  }

  /* 每轮都发送的提示词用英文（更省 token）；输出仍然是中文 */
  function buildSystem(s) {
    var belief = (s.belief || "").trim(), N = s.cname;
    return [
      "You are running a small interactive tarot-table scene and voicing two parties at once.",
      "",
      "[TAROT] The voice of the cards: mysterious, certain, fatalistic. Judge ONLY from the current card and its orientation. One or two sharp sentences. May needle or expose.",
      "[" + N + "] A real person with an independent mind. Speak strictly in character, one or two sentences, never long speeches.",
      "",
      "[" + N + "'s persona]", s.charPersona || "(none)",
      "",
      "[User: " + s.uname + "]", s.userPersona || "(none)",
      s.ctxText ? "\n[Background the user opted to share. Use it only to make reactions precise; never recite it]\n" + s.ctxText : "",
      "",
      "[" + N + "'s attitude toward tarot]",
      belief ? "Specified by the user: " + belief
        : "Not specified. Infer it from the persona, profession, faith, upbringing and memories, and keep it consistent for the whole game. Rationalists and scientists treat tarot as suggestion or cold reading and dismiss it (yet may fall silent when truly hit). People with religious or superstitious grounding tend to believe, take it seriously, feel awe or tension, and may argue about how a card is read rather than deny tarot itself. Some claim not to believe but clearly care. Some have doctrinal qualms about divination. Never deny just to manufacture conflict.",
      "",
      s.mode === "self"
        ? "[Scene] " + N + " draws cards for themself. The cards read " + N + "; they reply in first person."
        : "[Scene] " + s.uname + " asked: \"" + s.q + "\". The cards read " + N + "'s inner state; " + N + " sees the reading and responds on the spot.",
      "",
      "Rules:",
      "1. Output ONLY one JSON object, no code fences, no extra text: {\"react\":\"...\",\"tarot\":\"...\",\"char\":\"...\"}",
      "2. \"react\": fill it only when the input says the user just took a side; otherwise use \"\". It is " + N + "'s immediate reaction to that choice: one line with a visible change of mood or attitude (backed: smug, awkward, restrained, persuaded; opposed: indignant, hurt, cold, retaliating, shaken). It must fit their stance on tarot, drift as the score builds, and never repeat itself.",
      "3. \"tarot\": one NEW, concrete assertion about the current card. No generic lecture on card meanings.",
      "4. \"char\": " + N + "'s response to the current card. May rebut, agree, add, waver or stay silent, depending on persona and attitude. Stay in character; never mention AI, prompts or plugins.",
      "5. Every text value MUST be natural, spoken Chinese, without translationese."
    ].join("\n");
  }
  function parseDuo(raw) {
    var t = String(raw || "").trim();
    try {
      var m = t.match(/\{[\s\S]*\}/);
      if (m) {
        var o = JSON.parse(m[0]);
        if (o.tarot || o.char) return { react: String(o.react || "").trim(), tarot: String(o.tarot || "……"), char: String(o.char || "……") };
      }
    } catch (e) {}
    var a = t.match(/塔罗\s*[:：]\s*([^\n]+)/), b = t.match(/(?:char|CHAR)\s*[:：]\s*([^\n]+)/i);
    return { react: "", tarot: a ? a[1] : t || "……", char: b ? b[1] : "……" };
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
    var pos = posFor(S.mode);
    var cards = drawCards(n);
    var avatar = typeof char.avatar === "string" && char.avatar.length < 600 ? char.avatar : "";
    var s = {
      C: C, char: char, mode: S.mode, q: q, cards: cards, i: 0, turns: [], pending: "", flipped: {},
      tally: { tarot: 0, char: 0 }, cname: dispName(char), uname: C.user ? (C.user.handle || C.user.name || "user") : "user",
      charPersona: char.persona || char.bio || "", userPersona: C.user ? (C.user.persona || C.user.bio || "") : "", ctxText: ctxText,
      belief: S.belief[char.id] || ""
    };
    s.ps = { cname: s.cname, avatar: char.avatar };
    s.rec = {
      t: Date.now(), charId: char.id, cname: s.cname, avatar: avatar, uname: s.uname, conversationId: char.conversationId || "", mode: S.mode, q: q,
      cards: cards.map(function (c, i) { return c.name + (c.rev ? "（逆位）" : "（正位）") + (n === 1 ? "" : "·" + pos[i]); }),
      cardData: cards.map(function (c) { return { name: c.name, num: c.num, maj: c.maj, suit: c.suit, rank: c.rank, rev: c.rev }; }),
      tally: s.tally, log: [], summary: "", memoryId: null, written: false
    };
    s.system = buildSystem(s);
    renderTable(s);
    await sleep(1100);
    await round(s, "card");
  }

  function renderTable(s) {
    var C = s.C, pos = posFor(s.mode);
    C.replayId++;
    var T = C.t = { slots: [], memBtn: null };
    T.tally = h("div", { class: "tally" }); updateTally(s);
    T.ph = h("div", { class: "ph" }, s.cards.map(function () { return h("i"); }));
    T.chat = h("div", { class: "chat" });
    T.acts = h("div", { class: "acts" });
    var row = cardsRow(s.cards, pos, false, true);
    T.slots = row.slots;
    setScreen(h("div", { class: "scr tb" },
      h("div", { class: "top" }, h("button", { class: "rd", html: ICON_BACK, onclick: renderHome }), T.ph, T.tally),
      row.el, T.chat, T.acts));
  }
  function updateTally(s) { s.C.t.tally.textContent = "塔罗 " + s.tally.tarot + " : " + s.tally.char + " " + s.cname; }
  function updatePhase(s, done) {
    s.C.t.ph.childNodes.forEach(function (el, i) { el.className = i < s.i || done ? "done" : i === s.i ? "cur" : ""; });
  }
  function addMsg(s, kind, text, cls) {
    var b = makeBeat(s.ps, kind, text, cls);
    s.C.t.chat.append(b.el); scrollDown();
    s.rec.log.push({ who: kind, text: text, cls: cls || "" });
    if (kind === "user") { b.tx.textContent = text; return Promise.resolve(); }
    return typeInto(b.tx, text);
  }
  function addSys(s, text) { s.rec.log.push({ who: "sys", text: text }); s.C.t.chat.append(makeBeat(s.ps, "sys", text).el); scrollDown(); }
  function addTyping(s) {
    var el = h("div", { class: "beat tarot" }, h("div", { class: "w" }, h("span", { class: "pulse", html: sigil(16) }), h("span", { class: "pulse", text: "……" })));
    s.C.t.chat.append(el); scrollDown();
    return function () { el.remove(); };
  }

  async function round(s, kind, extra) {
    var C = s.C; if (C.disposed) return;
    var T = C.t, card = s.cards[s.i], pos = posFor(s.mode);
    T.acts.replaceChildren();
    updatePhase(s, kind === "end");
    var label = s.cards.length === 1 ? "core" : pos[s.i], userText;
    var face = card.name + " (" + (card.rev ? "reversed" : "upright") + ")";
    if (kind === "card") userText = (s.pending ? s.pending + " " : "") + "Now reveal card " + (s.i + 1) + "/" + s.cards.length + ": " + face + ", position \"" + label + "\". Output this round.";
    else if (kind === "ask") userText = "The user follows up: \"" + extra + "\". Still about " + face + ". Output this round.";
    else userText = (s.pending ? s.pending + " " : "") + "Finale. Final score: tarot " + s.tally.tarot + ", " + s.cname + " " + s.tally.char + ". Give one closing assertion from the tarot and one closing line from " + s.cname + ", in line with their persona and their attitude toward tarot.";

    var minWait = Promise.resolve();
    if (kind === "card") {
      T.slots.forEach(function (x, k) { x.slot.classList.toggle("cur", k === s.i); });
      if (!s.flipped[s.i]) {
        if (s.mode === "self") addSys(s, s.cname + " 伸手抽了一张牌……");
        s.rec.log.push({ who: "card", i: s.i });
        flipSlot(T.slots[s.i]); s.flipped[s.i] = true;
        minWait = sleep(1500); // 翻牌动画与 AI 请求同时进行
      }
    }
    var stop = addTyping(s);
    var out = await askDuo(s, userText).then(function (v) { return { v: v }; }, function (e) { return { e: e }; });
    await minWait;
    stop(); if (C.disposed) return;
    if (out.e) return showRetry(s, function () { round(s, kind, extra); }, out.e);
    var duo = out.v;
    if (kind !== "ask") s.pending = "";
    if (duo.react && kind !== "ask") { await addMsg(s, "char", duo.react, "re"); if (C.disposed) return; await sleep(520); if (C.disposed) return; }
    await addMsg(s, "tarot", duo.tarot); if (C.disposed) return;
    await sleep(420); if (C.disposed) return;
    await addMsg(s, "char", duo.char); if (C.disposed) return;
    if (kind === "end") return finish(s);
    showActions(s);
  }

  function showRetry(s, fn, err) {
    addSys(s, "出错了：" + ((err && err.message) || "请求失败") + "。检查 Roche 的 AI 配置后重试。");
    s.C.t.acts.replaceChildren(h("div", { class: "row" }, h("button", { class: "pill", text: "重试", onclick: fn }), h("button", { class: "pill", text: "返回", onclick: renderHome })));
    scrollDown();
  }

  function showActions(s) {
    var T = s.C.t;
    function choose(who) {
      s.tally[who]++; updateTally(s);
      addSys(s, who === "tarot" ? "你站了塔罗" : "你站了 " + s.cname);
      var side = who === "tarot" ? "the tarot" : s.cname;
      s.pending = "(The user just sided with " + side + ". Score now: tarot " + s.tally.tarot + " : " + s.cname + " " + s.tally.char + ". Fill \"react\" with " + s.cname + "'s on-the-spot reaction.)";
      if (s.i < s.cards.length - 1) { s.i++; round(s, "card"); }
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
      h("button", { class: "pill", text: "追问", onclick: function () { askRow.style.display = "flex"; input.focus(); scrollDown(); } })));
    scrollDown();
  }

  async function finish(s) {
    var C = s.C, R = C.roche, T = C.t, rec = s.rec;
    var verdict = s.tally.tarot > s.tally.char ? "这一局，牌赢了。" : s.tally.tarot < s.tally.char ? "这一局，" + s.cname + " 赢了。" : "这一局，平。";
    T.memBtn = h("button", { class: "pill", text: "写入记忆", onclick: function () { openMemory(rec); } });
    T.acts.replaceChildren(h("div", { class: "res", text: verdict }),
      h("div", { class: "row" }, T.memBtn,
        h("button", { class: "pill", text: "再来一局", onclick: renderHome }),
        h("button", { class: "pill", text: "返回", onclick: function () { R.ui.closeApp(); } })));
    scrollDown();
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
    id: PLUGIN_ID, name: "塔罗桌", version: "4.0.1",
    apps: [{
      id: APP_ID, name: "塔罗桌", icon: "extension", iconImage: "https://raw.githubusercontent.com/goldfuchs0921-ui/roche-Tarot/main/icon.png",
      async mount(container, roche) {
        destroy();
        var C = ctx = { container: container, roche: roche, timers: new Set(), cleanups: [], disposed: false, settings: Object.assign({}, DEFAULTS), chars: [], user: null, history: [], t: null, replayId: 0 };
        var style = document.createElement("style");
        style.id = STYLE_ID; style.textContent = CSS.replace(/&/g, "." + ROOT);
        document.head.appendChild(style);
        var sky = h("canvas", { class: "sky" });
        C.layer = h("div", { class: "layer" });
        C.root = h("div", { class: ROOT },
          h("div", { html: defsSvg() }), h("div", { class: "bg" }),
          h("div", { class: "fog" }, h("i"), h("i"), h("i")),
          h("div", { class: "beam" }), h("div", { class: "shaft" }), sky,
          h("div", { class: "grain" }), h("div", { class: "vig" }), C.layer);
        container.replaceChildren(C.root);
        startSky(sky, C);
        try {
          var saved = await roche.storage.get("settings");
          if (saved) {
            if (!saved.v || saved.v < SETTINGS_VERSION) { saved.askWrite = false; saved.useAI = false; saved.v = SETTINGS_VERSION; }
            Object.assign(C.settings, saved);
          }
        } catch (e) {}
        if (!C.settings.belief || typeof C.settings.belief !== "object") C.settings.belief = {};
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
