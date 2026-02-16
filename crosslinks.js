(function () {
  var wrapper = document.querySelector(".grid-wrapper");
  var svg = document.getElementById("connectors");
  var toggle = document.getElementById("crosslinks-toggle");
  if (!wrapper || !svg || !toggle) return;

  var rafId = 0;

  function getRect(el) {
    var r = el.getBoundingClientRect();
    var w = wrapper.getBoundingClientRect();
    return {
      left: r.left - w.left,
      top: r.top - w.top,
      right: r.right - w.left,
      bottom: r.bottom - w.top,
      width: r.width,
      height: r.height,
      midX: r.left - w.left + r.width / 2,
      midY: r.top - w.top + r.height / 2
    };
  }

  function scheduleDraw() {
    if (rafId) return;
    rafId = requestAnimationFrame(function () {
      rafId = 0;
      draw();
    });
  }

  function ensureDefs() {
    if (svg.querySelector("defs")) return;
    svg.insertAdjacentHTML(
      "afterbegin",
      "<defs>\n        <marker id=\"arrow\" viewBox=\"0 0 10 10\" refX=\"9\" refY=\"5\" markerWidth=\"7\" markerHeight=\"7\" orient=\"auto-start-reverse\">\n          <path d=\"M 0 0 L 10 5 L 0 10 z\"></path>\n        </marker>\n      </defs>"
    );
  }

  function curvePath(sx, sy, tx, ty) {
    var dx = Math.max(40, Math.min(140, Math.abs(tx - sx) / 2));
    var c1x = sx + dx;
    var c1y = sy;
    var c2x = tx - dx;
    var c2y = ty;
    return "M " + sx + " " + sy + " C " + c1x + " " + c1y + ", " + c2x + " " + c2y + ", " + tx + " " + ty;
  }

  function draw() {
    document.body.classList.toggle("crosslinks-hidden", !toggle.checked);
    if (document.body.classList.contains("crosslinks-hidden")) return;

    ensureDefs();

    var w = wrapper.getBoundingClientRect();
    svg.setAttribute("width", w.width);
    svg.setAttribute("height", w.height);
    svg.setAttribute("viewBox", "0 0 " + w.width + " " + w.height);

    var chips = wrapper.querySelectorAll(".link-chip[data-link]");
    svg.querySelectorAll("path[data-to]").forEach(function (p) { p.remove(); });

    chips.forEach(function (chip, i) {
      var targetId = chip.getAttribute("data-link");
      var target = document.getElementById(targetId);
      if (!target) return;

      var linkId = "link-" + i;
      chip.setAttribute("data-link-id", linkId);

      var sr = getRect(chip);
      var targetNode = target.querySelector(".node") || target;
      var tr = getRect(targetNode);

      var sx = sr.right + 6;
      var sy = sr.midY;
      var tx = tr.left - 8;
      var ty = tr.midY;

      var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", curvePath(sx, sy, tx, ty));
      path.setAttribute("data-from", linkId);
      path.setAttribute("data-to", targetId);

      var colorVar = chip.getAttribute("data-color");
      if (colorVar) path.style.setProperty("--linkColor", "var(" + colorVar + ")");

      svg.appendChild(path);
    });
  }

  function clearActive() {
    wrapper.classList.remove("dim-others");
    svg.querySelectorAll("path.is-active").forEach(function (p) { p.classList.remove("is-active"); });
    wrapper.querySelectorAll(".node.is-target, .node.is-source").forEach(function (el) { el.classList.remove("is-target", "is-source"); });
  }

  wrapper.addEventListener("pointerover", function (e) {
    var chip = e.target.closest(".link-chip[data-link]");
    if (!chip) return;
    var targetId = chip.getAttribute("data-link");
    var target = document.getElementById(targetId);
    if (!target) return;

    clearActive();
    wrapper.classList.add("dim-others");
    var linkId = chip.getAttribute("data-link-id");
    var path = linkId
      ? svg.querySelector('path[data-from="' + CSS.escape(linkId) + '"]')
      : svg.querySelector('path[data-to="' + CSS.escape(targetId) + '"]');
    if (path) path.classList.add("is-active");
    var targetNode = target.querySelector(".node") || target;
    targetNode.classList.add("is-target");
    var sourceNode = chip.closest(".node");
    if (sourceNode) sourceNode.classList.add("is-source");
  });

  wrapper.addEventListener("pointerout", function (e) {
    if (!e.target.closest(".link-chip[data-link]")) return;
    clearActive();
  });

  toggle.addEventListener("change", scheduleDraw);
  window.addEventListener("resize", scheduleDraw);
  window.addEventListener("scroll", scheduleDraw, { passive: true });

  var ro = new ResizeObserver(scheduleDraw);
  ro.observe(wrapper);

  window.addEventListener("load", scheduleDraw);
  scheduleDraw();
})();
