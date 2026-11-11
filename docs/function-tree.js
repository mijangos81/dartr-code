/* The function tree on the website. Data: functions.js (written by
   build-functions.R). Drawing: D3, loaded from a CDN; when D3 is not
   available the same content is shown as a plain list. */
(function () {
  "use strict";
  var D = window.DARTR_FUNCTIONS, host = document.getElementById("fn-map");
  if (!D || !host) return;

  var PKGS = ["dartR.base", "dartR.popgen", "dartR.spatial", "dartR.captive", "dartR.sexlinked", "dartR.sim", "dartRverse"];
  var KEY = { "dartR.base": "base", "dartR.popgen": "popgen", "dartR.spatial": "spatial", "dartR.captive": "captive",
              "dartR.sexlinked": "sexlinked", "dartR.sim": "sim", "dartRverse": "verse" };
  var names = Object.keys(D.fns);
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var state = { view: null, sel: null, pkg: null };

  var $ = function (id) { return document.getElementById(id); };
  var stageBox = $("fn-stage"), svgNode = $("fn-svg"), listBox = $("fn-list"), panel = $("fn-detail"),
      input = $("fn-q"), hitsBox = $("fn-hits"), legend = $("fn-legend");

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function byName(a, b) { var x = a.toLowerCase(), y = b.toLowerCase(); return x < y ? -1 : x > y ? 1 : 0; }

  // ---- the model: two stages, their groups, and the functions in each group ----
  var stages = [], groups = [], home = {}, alsoIn = {};
  D.stages.forEach(function (s, si) {
    var st = { kind: "stage", i: si, name: s.name, r: 44, groups: [] };
    s.groups.forEach(function (g) {
      var items = g.fns.map(function (n) { return { name: n, also: false }; })
        .concat(g.also.map(function (n) { return { name: n, also: true }; }));
      items.sort(function (a, b) { return byName(a.name, b.name); });
      var grp = { kind: "group", name: g.name, stage: st, items: items, n: items.length, open: false,
                  r: 18 + Math.sqrt(items.length) * 1.9 };
      g.fns.forEach(function (n) { home[n] = grp; });
      g.also.forEach(function (n) { (alsoIn[n] = alsoIn[n] || []).push(grp); });
      st.groups.push(grp); groups.push(grp);
    });
    stages.push(st);
  });
  var nAlso = Object.keys(alsoIn).length;

  var cap = $("fn-caption");
  if (cap) {
    cap.textContent = names.length + " functions in " + groups.length + " groups. " + nAlso +
      " of them do two jobs and sit in two groups; the tree draws those with a dashed outline. " +
      (D.left_out ? "The " + D.left_out + " internal helpers (utils.*) are not shown. " : "") + "Read on " + D.reference_date +
      " from the development branches: " + D.versions + ".";
  }

  // ---- one function, written out: used by the panel and by the list ----
  function prettySig(s) {
    var open = s.indexOf("(");
    if (open < 0 || s.length <= 56 || s.charAt(s.length - 1) !== ")") return s;
    var parts = [], depth = 0, q = null, cur = "";
    for (var i = open + 1; i < s.length - 1; i++) {
      var c = s.charAt(i);
      if (q) { cur += c; if (c === "\\") { cur += s.charAt(++i); } else if (c === q) { q = null; } continue; }
      if (c === '"' || c === "'" || c === "`") { q = c; cur += c; continue; }
      if (c === "(" || c === "[" || c === "{") depth++;
      if (c === ")" || c === "]" || c === "}") depth--;
      if (c === "," && depth === 0) { parts.push(cur.trim()); cur = ""; continue; }
      cur += c;
    }
    if (cur.trim()) parts.push(cur.trim());
    return s.slice(0, open + 1) + "\n  " + parts.join(",\n  ") + "\n)";
  }
  function swatch(pkg) { return el("i", "fn-dot pk-" + KEY[pkg]); }
  function card(name, withName) {
    var f = D.fns[name], box = el("div", "fn-card");
    if (withName) box.appendChild(el("h3", "fn-name", name));
    var meta = el("p", "fn-meta");
    var pk = el("span", "fn-pk"); pk.appendChild(swatch(f.p)); pk.appendChild(document.createTextNode(f.p));
    meta.appendChild(pk);
    meta.appendChild(el("span", null, [f.g].concat((alsoIn[name] || []).map(function (g) { return g.name; })).join(" · ")));
    box.appendChild(meta);
    var chips = [];
    if (f.k === "deprecated") chips.push("Deprecated");
    if (f.k === "internal") chips.push("Internal helper");
    if (f.d) chips.push(f.d + " data only");
    if (chips.length) {
      var row = el("p", "fn-chips");
      chips.forEach(function (c) { row.appendChild(el("span", "fn-chip", c)); });
      box.appendChild(row);
    }
    box.appendChild(el("p", "fn-title", f.t));
    var cb = el("div", "codebox"), pre = el("pre");
    pre.appendChild(el("code", null, prettySig(f.s)));
    cb.appendChild(pre);
    var copy = el("button", "copy", "Copy"); copy.type = "button";
    cb.appendChild(copy);
    box.appendChild(cb);
    var a = el("a", "fn-more", "Arguments and return value");
    a.href = D.ref + f.f + "#" + f.a;
    box.appendChild(a);
    return box;
  }

  function showPanel(name) {
    panel.textContent = "";
    if (!name) { panel.hidden = true; return; }
    var close = el("button", "fn-close", "Close"); close.type = "button";
    close.addEventListener("click", function () { select(null); });
    panel.appendChild(close);
    panel.appendChild(card(name, true));
    panel.hidden = false;
  }

  // ---- selection, shared by both views ----
  function select(name, reveal) {
    state.sel = name;
    showPanel(state.view === "tree" ? name : null);
    try { history.replaceState(null, "", name ? "#fn=" + encodeURIComponent(name) : location.pathname + location.search); } catch (e) {}
    if (tree) tree.paint();
    if (reveal && name) {
      if (state.view === "tree" && tree) tree.reveal(name);
      else revealInList(name);
    }
  }

  // ---- the plain list ----
  function fillRow(row) {
    if (row.getAttribute("data-filled")) return;
    row.setAttribute("data-filled", "1");
    row.appendChild(card(row.getAttribute("data-name"), false));
  }
  function buildList() {
    stages.forEach(function (st) {
      var col = el("div", "flist-stage");
      col.appendChild(el("h3", null, st.name));
      st.groups.forEach(function (g) {
        var d = el("details", "fgroup"), s = el("summary");
        s.appendChild(el("span", null, g.name));
        s.appendChild(el("span", "n", String(g.n)));
        d.appendChild(s);
        var ul = el("ul");
        g.items.forEach(function (it) {
          var f = D.fns[it.name], li = el("li"), row = el("details", "frow"), sum = el("summary");
          row.setAttribute("data-name", it.name);
          row.setAttribute("data-pkg", f.p);
          sum.appendChild(swatch(f.p));
          sum.appendChild(el("code", f.k === "deprecated" ? "dep" : null, it.name));
          sum.appendChild(el("span", "t", f.t));
          row.appendChild(sum);
          row.addEventListener("toggle", function () { if (row.open) fillRow(row); });
          li.appendChild(row); ul.appendChild(li);
        });
        d.appendChild(ul);
        g.listNode = d;
        col.appendChild(d);
      });
      listBox.appendChild(col);
    });
  }
  function filterList() {
    groups.forEach(function (g) {
      var shown = 0;
      Array.prototype.forEach.call(g.listNode.querySelectorAll(".frow"), function (row) {
        var on = !state.pkg || row.getAttribute("data-pkg") === state.pkg;
        row.parentNode.hidden = !on;
        if (on) shown++;
      });
      g.listNode.hidden = shown === 0;
      g.listNode.querySelector("summary .n").textContent = String(shown);
    });
  }
  function revealInList(name) {
    var g = home[name];
    if (state.pkg && D.fns[name].p !== state.pkg) setPkg(null);
    g.listNode.open = true;
    var rows = g.listNode.querySelectorAll(".frow");
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].getAttribute("data-name") === name) {
        rows[i].open = true; fillRow(rows[i]);
        rows[i].scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
        rows[i].querySelector("summary").focus({ preventScroll: true });
        break;
      }
    }
  }

  // ---- package legend: press one to show only that package ----
  var counts = {};
  names.forEach(function (n) { counts[D.fns[n].p] = (counts[D.fns[n].p] || 0) + 1; });
  PKGS.forEach(function (p) {
    if (!counts[p]) return;
    var b = el("button"); b.type = "button";
    b.setAttribute("aria-pressed", "false");
    b.setAttribute("data-pkg", p);
    b.appendChild(swatch(p));
    b.appendChild(document.createTextNode(p));
    b.appendChild(el("span", "n", String(counts[p])));
    b.addEventListener("click", function () { setPkg(state.pkg === p ? null : p); });
    legend.appendChild(b);
  });
  function setPkg(p) {
    state.pkg = p;
    Array.prototype.forEach.call(legend.querySelectorAll("button"), function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-pkg") === p ? "true" : "false");
    });
    filterList();
    if (tree) tree.paint();
  }

  // ---- search ----
  var active = -1, shown = [];
  function findHits(q) {
    q = q.toLowerCase().trim();
    if (!q) return [];
    var inName = [], inTitle = [];
    names.forEach(function (n) {
      var i = n.toLowerCase().indexOf(q);
      if (i >= 0) inName.push([i, n]);
      else if (D.fns[n].t.toLowerCase().indexOf(q) >= 0) inTitle.push(n);
    });
    inName.sort(function (a, b) { return a[0] - b[0] || a[1].length - b[1].length || byName(a[1], b[1]); });
    return inName.map(function (x) { return x[1]; }).concat(inTitle.sort(byName));
  }
  function closeHits() {
    hitsBox.hidden = true; hitsBox.textContent = ""; shown = []; active = -1;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  }
  function drawHits() {
    var all = findHits(input.value);
    hitsBox.textContent = "";
    shown = all.slice(0, 8); active = -1;
    if (!input.value.trim()) { closeHits(); return; }
    if (!all.length) {
      hitsBox.appendChild(el("li", "none", "No function has “" + input.value.trim() + "” in its name or description."));
    }
    shown.forEach(function (n, i) {
      var li = el("li"); li.id = "fn-hit-" + i;
      li.setAttribute("role", "option"); li.setAttribute("aria-selected", "false");
      li.appendChild(el("code", null, n));
      li.appendChild(el("span", null, home[n].name));
      li.addEventListener("mousedown", function (e) { e.preventDefault(); pick(n); });
      hitsBox.appendChild(li);
    });
    if (all.length > shown.length) hitsBox.appendChild(el("li", "none", (all.length - shown.length) + " more. Keep typing to narrow them."));
    hitsBox.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }
  function mark(i) {
    if (!shown.length) return;
    active = (i + shown.length) % shown.length;
    Array.prototype.forEach.call(hitsBox.querySelectorAll('[role="option"]'), function (li, k) {
      li.setAttribute("aria-selected", k === active ? "true" : "false");
      if (k === active) li.scrollIntoView({ block: "nearest" });
    });
    input.setAttribute("aria-activedescendant", "fn-hit-" + active);
  }
  function pick(n) { input.value = n; closeHits(); select(n, true); }
  input.addEventListener("input", drawHits);
  input.addEventListener("focus", function () { if (input.value.trim()) drawHits(); });
  input.addEventListener("blur", function () { setTimeout(closeHits, 120); });
  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { e.preventDefault(); if (hitsBox.hidden) drawHits(); mark(active + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); mark(active - 1); }
    else if (e.key === "Enter") { if (shown.length) { e.preventDefault(); pick(shown[active < 0 ? 0 : active]); } }
    else if (e.key === "Escape") { closeHits(); }
  });

  // ---- the tree ----
  var tree = null;
  function makeTree() {
    var d3 = window.d3;
    var PAD = 12, ROW = 31, CH = 9;   // CH: width of one character of a function name (15px monospace)
    var svg = d3.select(svgNode);
    var layer = svg.append("g");
    var linkLayer = layer.append("g");
    var nodeLayer = layer.append("g");
    var rootN = { kind: "root", name: "dartRverse", r: 72, x: 0, y: 0, fx: 0, fy: 0 };
    var nodes = [rootN].concat(stages, groups), links = [];

    function wrap(label) {
      if (label.length <= 17) return [label];
      var mid = label.length / 2, best = -1;
      for (var i = 0; i < label.length; i++) {
        if (label.charAt(i) === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
      }
      return best < 0 ? [label] : [label.slice(0, best), label.slice(best + 1)];
    }
    function pillW(name) { return 42 + name.length * CH; }

    // where the functions of an open group sit, relative to the group's centre
    function layout(g) {
      var items = g.items, left = [], right = [];
      var rep = items.filter(function (it) { return /^gl\.report\./.test(it.name); });
      var fil = items.filter(function (it) { return /^gl\.filter\./.test(it.name); });
      if (items.length >= 8 && rep.length === fil.length && rep.length + fil.length === items.length) {
        left = rep; right = fil;                       // a report and its filter share a row
      } else if (items.length <= 10) {
        if (g.x < g.stage.x) left = items; else right = items;
      } else {
        var h = Math.ceil(items.length / 2);
        left = items.slice(0, h); right = items.slice(h);
      }
      var gap = Math.max(g.r + 34, g.labelHalf + 14);
      function place(col, side) {
        var w = 0;
        col.forEach(function (it, i) {
          it.side = side; it.w = pillW(it.name);
          it.dx = side * gap; it.dy = (i - (col.length - 1) / 2) * ROW;
          if (it.w > w) w = it.w;
        });
        return w;
      }
      var wl = place(left, -1), wr = place(right, 1), rows = Math.max(left.length, right.length);
      g.ext = { x0: left.length ? -(gap + wl) : 0, x1: right.length ? gap + wr : 0, y0: -rows * ROW / 2, y1: rows * ROW / 2 };
    }
    function setBox(n) {
      if (n.kind !== "group") { n.box = { x0: -n.r - PAD, x1: n.r + PAD, y0: -n.r - PAD, y1: n.r + PAD }; return; }
      var half = Math.max(n.r, n.labelHalf);
      var b = { x0: -half, x1: half, y0: -n.r, y1: n.r + 11 + n.lines.length * 20 };
      if (n.open) {
        b.x0 = Math.min(b.x0, n.ext.x0); b.x1 = Math.max(b.x1, n.ext.x1);
        b.y0 = Math.min(b.y0, n.ext.y0); b.y1 = Math.max(b.y1, n.ext.y1);
      }
      n.box = { x0: b.x0 - PAD, x1: b.x1 + PAD, y0: b.y0 - PAD, y1: b.y1 + PAD };
    }

    // starting positions: Data to the left, Analyses to the right, groups fanned around each
    stages.forEach(function (st) {
      st.x = st.i === 0 ? -270 : 270; st.y = 0;
      links.push({ source: rootN, target: st });
      var span = st.i === 0 ? 1.35 * Math.PI : 1.6 * Math.PI, mid = st.i === 0 ? Math.PI : 0, n = st.groups.length;
      st.groups.forEach(function (g, i) {
        var a = mid + (n > 1 ? i / (n - 1) - 0.5 : 0) * span;
        g.x = st.x + 230 * Math.cos(a); g.y = st.y + 230 * Math.sin(a);
        g.lines = wrap(g.name);
        g.labelHalf = Math.max.apply(null, g.lines.map(function (l) { return l.length; })) * 4.5 + 2;
        links.push({ source: st, target: g });
      });
    });
    nodes.forEach(setBox);

    // boxes must not overlap: an open group is one rigid box that holds its functions
    function boxForce() {
      for (var pass = 0; pass < 2; pass++) {
        for (var i = 0; i < nodes.length; i++) {
          for (var j = i + 1; j < nodes.length; j++) {
            var a = nodes[i], b = nodes[j];
            var ox = Math.min(a.x + a.box.x1, b.x + b.box.x1) - Math.max(a.x + a.box.x0, b.x + b.box.x0);
            if (ox <= 0) continue;
            var oy = Math.min(a.y + a.box.y1, b.y + b.box.y1) - Math.max(a.y + a.box.y0, b.y + b.box.y0);
            if (oy <= 0) continue;
            var af = a.fx != null, bf = b.fx != null;
            if (af && bf) continue;
            var wa = af ? 0 : bf ? 1 : 0.5, wb = 1 - wa, s;
            if (ox < oy) {
              s = (a.x + (a.box.x0 + a.box.x1) / 2 < b.x + (b.box.x0 + b.box.x1) / 2 ? -1 : 1) * ox * 0.6;
              a.x += s * wa; b.x -= s * wb;
            } else {
              s = (a.y + (a.box.y0 + a.box.y1) / 2 < b.y + (b.box.y0 + b.box.y1) / 2 ? -1 : 1) * oy * 0.6;
              a.y += s * wa; b.y -= s * wb;
            }
          }
        }
      }
    }

    var sim = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).distance(function (l) { return l.target.kind === "group" ? 205 : 270; })
        .strength(function (l) { return l.target.kind === "group" ? 0.3 : 0.7; }))
      .force("charge", d3.forceManyBody().strength(-520).distanceMax(700))
      .force("side", d3.forceX(function (n) { return n.kind === "stage" ? (n.i === 0 ? -280 : 280) : 0; })
        .strength(function (n) { return n.kind === "stage" ? 0.3 : 0; }))
      .force("level", d3.forceY(0).strength(function (n) { return n.kind === "stage" ? 0.3 : 0.02; }))
      .force("boxes", boxForce)
      .velocityDecay(0.5)
      .stop();

    // ---- drawing ----
    var linkSel = linkLayer.selectAll("line").data(links).join("line").attr("class", "sk-link");

    var rootSel = nodeLayer.append("g").attr("class", "rootn").attr("tabindex", 0).attr("role", "button")
      .attr("aria-label", "Show the whole tree");
    var hex = d3.range(6).map(function (k) {
      var a = (-90 + 60 * k) * Math.PI / 180;
      return (rootN.r * Math.cos(a)).toFixed(1) + "," + (rootN.r * Math.sin(a)).toFixed(1);
    });
    // the dartR logo: a hexagon standing on a point, so its width is sqrt(3)/2 of its height
    var logoH = rootN.r * 2, logoW = logoH * Math.sqrt(3) / 2;
    rootSel.append("image").attr("href", "dartR-logo.png")
      .attr("x", -logoW / 2).attr("y", -logoH / 2).attr("width", logoW).attr("height", logoH);
    rootSel.append("path").attr("d", "M" + hex.join("L") + "Z");   // not painted; carries the focus ring
    rootSel.append("title").text("dartRverse: show the whole tree");
    press(rootSel, function () { fit(null); });

    var stageSel = nodeLayer.selectAll("g.stage").data(stages).join("g").attr("class", "stage")
      .attr("tabindex", 0).attr("role", "button")
      .attr("aria-label", function (d) { return "Zoom to " + d.name; });
    stageSel.append("circle").attr("r", function (d) { return d.r; });
    stageSel.append("text").attr("dy", "0.35em").text(function (d) { return d.name; });
    press(stageSel, function (ev, d) { fit(union(d.groups.concat([d]))); });

    var grpSel = nodeLayer.selectAll("g.grp").data(groups).join("g").attr("class", "grp");
    grpSel.append("g").attr("class", "leaflinks");
    var hubSel = grpSel.append("g").attr("class", "hub").attr("tabindex", 0).attr("role", "button")
      .attr("aria-expanded", "false")
      .attr("aria-label", function (d) { return d.name + ", " + d.n + " functions"; });
    grpSel.append("g").attr("class", "leaves");

    var pie = d3.pie().sort(null).value(function (d) { return d.n; });
    hubSel.each(function (g) {
      var byPkg = {};
      g.items.forEach(function (it) { var p = D.fns[it.name].p; byPkg[p] = (byPkg[p] || 0) + 1; });
      var parts = PKGS.filter(function (p) { return byPkg[p]; }).map(function (p) { return { p: p, n: byPkg[p] }; });
      g.parts = parts;
      var arc = d3.arc().innerRadius(g.r - 7).outerRadius(g.r).padAngle(parts.length > 1 ? 0.07 : 0);
      var h = d3.select(this);
      h.append("circle").attr("class", "core").attr("r", g.r);
      h.selectAll("path.arc").data(pie(parts)).join("path")
        .attr("class", function (d) { return "arc pk-" + KEY[d.data.p]; }).attr("d", arc);
      h.append("text").attr("class", "count").attr("dy", "0.35em").text(g.n);
      g.lines.forEach(function (line, i) {
        h.append("text").attr("class", "label").attr("y", g.r + 25 + i * 20).text(line);
      });
      h.append("title").text(g.name + ": " + parts.map(function (d) { return d.n + " in " + d.p; }).join(", "));
    });
    press(hubSel, function (ev, g) { toggle(g); });

    function press(sel, fn) {
      sel.on("click", fn).on("keydown", function (ev, d) {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); fn.call(this, ev, d); }
      });
    }

    function draw() {
      linkSel.attr("x1", function (l) { return l.source.x; }).attr("y1", function (l) { return l.source.y; })
        .attr("x2", function (l) { return l.target.x; }).attr("y2", function (l) { return l.target.y; });
      stageSel.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
      grpSel.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
    }
    sim.on("tick", function () { draw(); track(); });

    function renderLeaves(g) {
      var node = grpSel.filter(function (d) { return d === g; });
      node.classed("open", g.open);
      node.select(".hub").attr("aria-expanded", g.open ? "true" : "false");
      var data = g.open ? g.items : [];
      var ms = reduced ? 0 : 320;
      node.select(".leaflinks").selectAll("path").data(data, function (d) { return d.name; }).join(
        function (enter) {
          return enter.append("path").attr("class", "leaf-link")
            .attr("d", function (d) { return "M0,0C" + d.dx * 0.5 + ",0 " + d.dx * 0.5 + "," + d.dy + " " + d.dx + "," + d.dy; })
            .style("opacity", 0).call(function (s) {
              s.transition().delay(ms * 0.6).duration(ms).style("opacity", 1)
                .on("end interrupt", function () { d3.select(this).style("opacity", null); });
            });
        });
      node.select(".leaves").selectAll("g.leaf").data(data, function (d) { return d.name; }).join(
        function (enter) {
          var leaf = enter.append("g")
            .attr("class", function (d) {
              var f = D.fns[d.name];
              return "leaf pk-" + KEY[f.p] + (d.also ? " also" : "") + (f.k === "deprecated" ? " dep" : "");
            })
            .attr("tabindex", 0).attr("role", "button")
            .attr("aria-label", function (d) { var f = D.fns[d.name]; return d.name + ", " + f.p + ": " + f.t; })
            .attr("transform", "translate(0,0)").style("opacity", 0);
          leaf.append("rect").attr("y", -13.5).attr("height", 27).attr("rx", 13.5)
            .attr("x", function (d) { return d.side > 0 ? 0 : -d.w; }).attr("width", function (d) { return d.w; });
          leaf.append("circle").attr("class", "dot").attr("r", 4.5).attr("cx", function (d) { return d.side * 16; });
          leaf.append("text").attr("dy", "0.35em")
            .attr("x", function (d) { return d.side * 28; })
            .attr("text-anchor", function (d) { return d.side > 0 ? "start" : "end"; })
            .text(function (d) { return d.name; });
          press(leaf, function (ev, d) { ev.stopPropagation(); select(d.name); });
          leaf.on("mouseenter mousemove", function (ev, d) { tip(ev, d.name); })
            .on("mouseleave", function () { tipBox.hidden = true; });
          leaf.transition().duration(ms).delay(function (d, i) { return reduced ? 0 : i * 6; })
            .attr("transform", function (d) { return "translate(" + d.dx + "," + d.dy + ")"; }).style("opacity", 1)
            // hand opacity back to the style sheet, which dims the functions of other packages
            .on("end interrupt", function (d) {
              d3.select(this).style("opacity", null).attr("transform", "translate(" + d.dx + "," + d.dy + ")");
            });
          return leaf;
        });
      paint();
    }

    function paint() {
      var p = state.pkg;
      nodeLayer.selectAll("g.leaf")
        .classed("sel", function (d) { return d.name === state.sel; })
        .classed("dim", function (d) { return !!p && D.fns[d.name].p !== p; });
      nodeLayer.selectAll("path.arc").classed("dim", function (d) { return !!p && d.data.p !== p; });
      hubSel.classed("dim", function (g) { return !!p && !g.parts.some(function (x) { return x.p === p; }); });
    }

    // ---- moving about ----
    var zoom = d3.zoom().scaleExtent([0.1, 2.5])
      .filter(function (ev) {
        if (ev.type === "wheel") return ev.ctrlKey || ev.metaKey;    // plain scrolling moves the page
        if (ev.type === "touchstart") return ev.touches.length > 1;   // one finger scrolls the page
        return !ev.button;
      })
      .on("zoom", function (ev) {
        layer.attr("transform", ev.transform); tipBox.hidden = true;
        if (ev.sourceEvent) cam = null;          // the reader took over: stop following
      });
    svg.call(zoom).on("dblclick.zoom", null);

    function world(n) { return { x0: n.x + n.box.x0, x1: n.x + n.box.x1, y0: n.y + n.box.y0, y1: n.y + n.box.y1 }; }
    function union(list) {
      var u = null;
      list.forEach(function (n) {
        var b = world(n);
        u = u ? { x0: Math.min(u.x0, b.x0), x1: Math.max(u.x1, b.x1), y0: Math.min(u.y0, b.y0), y1: Math.max(u.y1, b.y1) } : b;
      });
      return u;
    }
    // On a wide screen the panel floats over the right of the tree, so an open
    // group is fitted into the space to its left.
    function reserve(whole) {
      if (getComputedStyle(panel).position !== "absolute") return 0;
      return (whole ? !panel.hidden : groups.some(function (g) { return g.open; })) ? 360 : 0;
    }
    // hovering a function shows its one-line description beside the pointer
    var tipBox = $("fn-tip");
    function tip(ev, name) {
      if (tipBox.getAttribute("data-name") !== name) {
        tipBox.textContent = "";
        tipBox.appendChild(el("b", null, name));
        tipBox.appendChild(document.createTextNode(D.fns[name].t));
        tipBox.setAttribute("data-name", name);
      }
      tipBox.hidden = false;
      var r = stageBox.getBoundingClientRect(), x = ev.clientX - r.left + 14, y = ev.clientY - r.top + 16;
      if (x + tipBox.offsetWidth > r.width - 8) x = ev.clientX - r.left - tipBox.offsetWidth - 14;
      if (y + tipBox.offsetHeight > r.height - 8) y = ev.clientY - r.top - tipBox.offsetHeight - 12;
      tipBox.style.left = Math.max(8, x) + "px";
      tipBox.style.top = Math.max(8, y) + "px";
    }
    // the zoom that shows a box, or the whole tree when there is no box
    function viewOf(box, maxScale) {
      var W = svgNode.clientWidth - reserve(!box), H = svgNode.clientHeight, m = 26;
      box = box || union(nodes);
      if (W <= 0 || H <= 0) return null;
      var s = Math.min(maxScale || 1.15, (W - 2 * m) / (box.x1 - box.x0), (H - 2 * m) / (box.y1 - box.y0));
      return d3.zoomIdentity.translate(W / 2 - s * (box.x0 + box.x1) / 2, H / 2 - s * (box.y0 + box.y1) / 2).scale(s);
    }
    function fit(box, maxScale, instant) {
      var t = viewOf(box, maxScale);
      if (!t) return;
      cam = null;
      if (reduced || instant) svg.call(zoom.transform, t);
      else svg.transition().duration(600).call(zoom.transform, t);
    }
    // When a group opens or closes, the layout keeps moving for a moment. The view
    // follows its target while that happens, easing toward it on every tick. The
    // target is a function that gives a box, or nothing for the whole tree.
    var cam = null;
    function follow(target, ms) {
      if (reduced) { sim.stop(); for (var i = 0; i < 220; i++) sim.tick(); draw(); fit(target()); return; }
      svg.interrupt();
      cam = { target: target, until: Date.now() + (ms || 2200) };
      sim.alpha(0.7).restart();
    }
    function track() {
      if (!cam) return;
      if (Date.now() > cam.until) { cam = null; return; }
      var to = viewOf(cam.target()), now = d3.zoomTransform(svgNode), e = 0.16;
      if (!to) return;
      svg.call(zoom.transform, d3.zoomIdentity
        .translate(now.x + (to.x - now.x) * e, now.y + (to.y - now.y) * e).scale(now.k + (to.k - now.k) * e));
    }
    function toggle(g, open, quiet) {
      open = open == null ? !g.open : open;
      if (g.open === open) return;
      g.open = open;
      if (open) layout(g);
      setBox(g);
      renderLeaves(g);
      allBtn.textContent = groups.every(function (x) { return x.open; }) ? "Close all" : "Open all";
      if (!quiet) follow(function () { return g.open ? world(g) : null; });
    }
    function reveal(name) {
      var g = home[name];
      if (state.pkg && D.fns[name].p !== state.pkg) setPkg(null);
      if (g.open) { fit(world(g)); return; }
      toggle(g, true, true);
      follow(function () { return world(g); });
    }

    var drag = d3.drag().container(function () { return layer.node(); }).subject(function (ev, d) { return d; })
      .on("start", function (ev, d) { cam = null; if (!ev.active) sim.alphaTarget(0.25).restart(); d.fx = d.x; d.fy = d.y; })
      .on("drag", function (ev, d) { d.fx = ev.x; d.fy = ev.y; })
      .on("end", function (ev, d) { if (!ev.active) sim.alphaTarget(0); d.fx = null; d.fy = null; });
    hubSel.call(drag); stageSel.call(drag);

    // ---- the buttons under the tree ----
    var allBtn = $("fn-all");
    $("fn-in").addEventListener("click", function () { cam = null; svg.transition().duration(reduced ? 0 : 250).call(zoom.scaleBy, 1.4); });
    $("fn-out").addEventListener("click", function () { cam = null; svg.transition().duration(reduced ? 0 : 250).call(zoom.scaleBy, 1 / 1.4); });
    $("fn-fit").addEventListener("click", function () { fit(null); });
    allBtn.addEventListener("click", function () {
      var open = !groups.every(function (x) { return x.open; });
      groups.forEach(function (g) { toggle(g, open, true); });
      follow(function () { return null; }, 3000);
      if (!reduced) sim.alpha(0.9);
    });

    for (var i = 0; i < 300; i++) sim.tick();
    draw();
    fit(null, 1.15, true);
    window.addEventListener("resize", function () { if (state.view === "tree" && !groups.some(function (g) { return g.open; })) fit(null, 1.15, true); });

    return { paint: paint, reveal: reveal, fit: fit };
  }

  // ---- tree or list ----
  var viewBtns = host.querySelectorAll("[data-view]");
  function setView(v) {
    if (v === "tree" && !window.d3) v = "list";
    state.view = v;
    host.setAttribute("data-view", v);
    stageBox.hidden = v !== "tree";
    listBox.hidden = v !== "list";
    Array.prototype.forEach.call(viewBtns, function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-view") === v ? "true" : "false"); });
    showPanel(v === "tree" ? state.sel : null);
    if (v === "tree" && !tree) tree = makeTree();
    if (v === "tree") tree.paint();
  }
  Array.prototype.forEach.call(viewBtns, function (b) {
    b.addEventListener("click", function () { setView(b.getAttribute("data-view")); });
  });

  buildList();
  host.classList.add("ready");
  if (!window.d3) {
    Array.prototype.forEach.call(viewBtns, function (b) { if (b.getAttribute("data-view") === "tree") b.disabled = true; });
  }
  setView(window.d3 && window.innerWidth >= 760 ? "tree" : "list");

  // a link of the form #fn=gl.filter.callrate opens the page at that function
  function fromHash() {
    var m = /^#fn=(.+)$/.exec(location.hash), wanted = null;
    if (!m) return;
    try { wanted = decodeURIComponent(m[1]); } catch (e) {}
    if (!wanted || !D.fns[wanted] || wanted === state.sel) return;
    select(wanted, true);
    host.scrollIntoView({ block: "start" });
  }
  fromHash();
  window.addEventListener("hashchange", fromHash);
})();
