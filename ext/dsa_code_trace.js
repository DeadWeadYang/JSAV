(function () {
  "use strict";

  function escHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function padLeft(n, width) {
    var s = String(n);
    while (s.length < width) {
      s = " " + s;
    }
    return s;
  }

  function flattenStepMap(raw) {
    if (!raw) {
      return [];
    }
    if (Array.isArray(raw) && raw.length && raw[0] && raw[0].frames) {
      var rows = [];
      for (var i = 0; i < raw.length; i++) {
        var frames = raw[i].frames || [];
        for (var j = 0; j < frames.length; j++) {
          rows.push(frames[j]);
        }
      }
      return rows;
    }
    return Array.isArray(raw) ? raw : [];
  }

  function normalizeSourcePath(file) {
    var path = String(file || "").replace(/\\/g, "/");
    var markers = ["CPP-DSA/", "JSAV/", "tools/trace_sources/"];
    var lowerPath = path.toLowerCase();
    for (var i = 0; i < markers.length; i++) {
      var marker = markers[i];
      var idx = lowerPath.indexOf(marker.toLowerCase());
      if (idx !== -1) {
        return marker + path.slice(idx + marker.length);
      }
    }
    path = path.replace(/^\/+/, "");
    while (path.indexOf("../") === 0) {
      path = path.slice(3);
    }
    while (path.indexOf("./") === 0) {
      path = path.slice(2);
    }
    var cppSubdirs = [
      "graph/",
      "sorting/",
      "tree/",
      "visual_main_templates/",
      "vis_trace.hpp"
    ];
    var lowerClean = path.toLowerCase();
    for (var j = 0; j < cppSubdirs.length; j++) {
      if (lowerClean.indexOf(cppSubdirs[j]) === 0) {
        return "CPP-DSA/" + path;
      }
    }
    return path;
  }

  function joinUrl(base, path) {
    if (/^(?:https?:)?\/\//.test(path)) {
      return path;
    }
    return String(base || "").replace(/\/?$/, "/") + path.replace(/^\/+/, "");
  }

  function sourceUrl(sourceBase, file) {
    return joinUrl(sourceBase || "../../", normalizeSourcePath(file));
  }

  function isHelperSource(file) {
    var path = normalizeSourcePath(file).toLowerCase();
    return !path ||
      path.indexOf("_vis.hpp") !== -1 ||
      path.indexOf("vis_trace.hpp") !== -1;
  }

  function fetchSource(cache, sourceBase, file) {
    if (!file) {
      return Promise.resolve([]);
    }
    var key = normalizeSourcePath(file);
    if (cache[key]) {
      return Promise.resolve(cache[key]);
    }
    return fetch(sourceUrl(sourceBase, key))
      .then(function (res) {
        if (!res.ok) {
          throw new Error("HTTP " + res.status + " while loading " + key);
        }
        return res.text();
      })
      .then(function (text) {
        var lines = text.split(/\r?\n/);
        cache[key] = lines;
        return lines;
      });
  }

  function findFunctionRange(lines, lineNo, funcName) {
    if (!lines || !lines.length) {
      return { start: 1, end: 1, signature: "" };
    }
    var primary = Math.max(1, Math.min(lines.length, lineNo || 1));

    function rangeFromBrace(braceLine) {
      var depth = 0;
      var opened = false;
      var end = Math.min(lines.length, braceLine + 80);
      for (var x = braceLine; x <= lines.length; x++) {
        var text = String(lines[x - 1] || "");
        for (var c = 0; c < text.length; c++) {
          if (text[c] === "{") {
            depth += 1;
            opened = true;
          } else if (text[c] === "}") {
            depth -= 1;
            if (opened && depth <= 0) {
              end = x;
              x = lines.length + 1;
              break;
            }
          }
        }
      }
      return { start: braceLine, end: end, signature: "" };
    }

    if (funcName) {
      var escaped = String(funcName).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      var re = new RegExp("\\b" + escaped + "\\s*\\(");
      var best = null;
      var bestDist = Infinity;
      for (var i = 1; i <= lines.length; i++) {
        if (!re.test(String(lines[i - 1] || ""))) {
          continue;
        }
        var dist = Math.abs(i - primary);
        if (i <= primary && dist <= bestDist) {
          best = i;
          bestDist = dist;
        } else if (best === null && dist < bestDist) {
          best = i;
          bestDist = dist;
        }
      }
      if (best !== null) {
        for (var fwd = best; fwd <= Math.min(lines.length, best + 50); fwd++) {
          var line = String(lines[fwd - 1] || "");
          if (line.indexOf("{") !== -1) {
            var found = rangeFromBrace(fwd);
            found.start = Math.max(1, Math.min(best, fwd));
            found.signature = String(lines[best - 1] || "").trim();
            return found;
          }
          if (line.indexOf(";") !== -1) {
            break;
          }
        }
      }
    }

    var start = Math.max(1, primary - 10);
    var end = Math.min(lines.length, primary + 10);
    return { start: start, end: end, signature: "" };
  }

  function primaryLocation(frame) {
    if (!frame) {
      return {};
    }
    if (frame.primaryLoc && !isHelperSource(frame.primaryLoc.file || "")) {
      return frame.primaryLoc;
    }
    var locs = frame.locList || [];
    for (var i = locs.length - 1; i >= 0; i--) {
      if (locs[i] && !isHelperSource(locs[i].file || "")) {
        return locs[i];
      }
    }
    return frame.primaryLoc || {};
  }

  function frameMessage(frame) {
    return (frame && frame.message && frame.message.text) || "";
  }

  function parseCounterCurrent(counterText) {
    var m = String(counterText || "").match(/^\s*(\d+)/);
    if (!m) {
      return 1;
    }
    var n = parseInt(m[1], 10);
    return isNaN(n) ? 1 : n;
  }

  function scrollChildIntoContainer(container, child, block) {
    if (!container || !child) {
      return;
    }
    if (typeof child.scrollIntoView === "function") {
      var winX = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
      var winY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      var saved = [];
      var el = container.parentElement;
      while (el) {
        saved.push({
          el: el,
          left: el.scrollLeft,
          top: el.scrollTop
        });
        el = el.parentElement;
      }
      child.scrollIntoView({
        block: block === "nearest" ? "nearest" : "center",
        inline: "nearest"
      });
      for (var i = 0; i < saved.length; i++) {
        saved[i].el.scrollLeft = saved[i].left;
        saved[i].el.scrollTop = saved[i].top;
      }
      window.scrollTo(winX, winY);
      return;
    }
    var childTop = child.offsetTop;
    var childBottom = childTop + child.offsetHeight;
    var visibleTop = container.scrollTop;
    var visibleBottom = visibleTop + container.clientHeight;

    if (block === "center") {
      container.scrollTop = Math.max(0, childTop - Math.floor((container.clientHeight - child.offsetHeight) / 2));
      return;
    }

    if (block === "lower-center") {
      container.scrollTop = Math.max(0, childTop - Math.floor(container.clientHeight * 0.58));
      return;
    }

    if (childTop < visibleTop) {
      container.scrollTop = childTop;
    } else if (childBottom > visibleBottom) {
      container.scrollTop = childBottom - container.clientHeight;
    }
  }

  function CodeTrace(options) {
    this.options = options || {};
    this.playerHost = typeof options.playerHost === "string"
      ? document.querySelector(options.playerHost)
      : options.playerHost;
    this.panel = typeof options.panel === "string"
      ? document.querySelector(options.panel)
      : options.panel;
    this.sourceBase = options.sourceBase || "../../";
    this.sourceCache = {};
    this.rawStepMap = options.stepMap || (window.getLastStepMap ? window.getLastStepMap() : []);
    this.frames = flattenStepMap(this.rawStepMap);
    this.activeIndex = -1;
    this.renderShell();
    this.renderFrameList();
    this.bindPlayerCounters();
    if (this.frames.length) {
      this.setActiveFrame(0, false);
    }
  }

  CodeTrace.prototype.renderShell = function () {
    if (!this.panel) {
      throw new Error("DSAVisualCodeTrace.attach: panel is required");
    }
    this.panel.classList.add("dsa-code-trace");
    this.panel.innerHTML =
      "<div class='dsa-code-trace__header'>" +
        "<div class='dsa-code-trace__title'>Code Trace</div>" +
        "<div class='dsa-code-trace__meta'></div>" +
      "</div>" +
      "<div class='dsa-code-trace__message'></div>" +
      "<div class='dsa-code-trace__body'>" +
        "<div class='dsa-code-trace__frames'></div>" +
        "<div class='dsa-code-trace__code'>" +
          "<div class='dsa-code-trace__file'></div>" +
          "<div class='dsa-code-trace__source'></div>" +
        "</div>" +
      "</div>";
    this.metaEl = this.panel.querySelector(".dsa-code-trace__meta");
    this.messageEl = this.panel.querySelector(".dsa-code-trace__message");
    this.framesEl = this.panel.querySelector(".dsa-code-trace__frames");
    this.fileEl = this.panel.querySelector(".dsa-code-trace__file");
    this.sourceEl = this.panel.querySelector(".dsa-code-trace__source");
    this.metaEl.textContent = this.frames.length + " frames";
  };

  CodeTrace.prototype.renderFrameList = function () {
    var self = this;
    this.framesEl.innerHTML = "";
    for (var i = 0; i < this.frames.length; i++) {
      var frame = this.frames[i] || {};
      var loc = primaryLocation(frame);
      var rawPrimary = (frame && frame.primaryLoc) || {};
      var item = document.createElement("button");
      item.type = "button";
      item.className = "dsa-code-trace__frame";
      item.setAttribute("data-frame-index", String(i));
      item.innerHTML =
        "<span class='dsa-code-trace__frame-no'>" + escHtml(frame.ctx || "default") + " #" + escHtml(frame.frame || i + 1) + "</span>" +
        "<span class='dsa-code-trace__frame-loc'>" + escHtml(normalizeSourcePath(loc.file || "?")) + ":" + escHtml(loc.line || "?") +
        (isHelperSource(rawPrimary.file || "") && !isHelperSource(loc.file || "") ? " (from frame events)" : "") +
        "</span>";
      item.addEventListener("click", (function (idx) {
        return function () {
          self.setActiveFrame(idx, true);
        };
      })(i));
      this.framesEl.appendChild(item);
    }
  };

  CodeTrace.prototype.setActiveFrame = function (idx, fromUser) {
    if (idx < 0 || idx >= this.frames.length) {
      return;
    }
    this.activeIndex = idx;
    var items = this.framesEl.querySelectorAll(".dsa-code-trace__frame");
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle("is-active", i === idx);
    }
    scrollChildIntoContainer(this.framesEl, items[idx], "nearest");
    this.renderCode(this.frames[idx], fromUser);
  };

  CodeTrace.prototype.renderCode = function (frame, fromUser) {
    var self = this;
    var loc = primaryLocation(frame);
    var file = loc.file || "";
    var lineNo = typeof loc.line === "number" ? loc.line : null;
    this.messageEl.textContent = frameMessage(frame);
    if (!file) {
      this.fileEl.textContent = "No source location for this frame.";
      this.sourceEl.innerHTML = "";
      return;
    }
    if (isHelperSource(file)) {
      this.fileEl.textContent = "Only helper source location is available: " + normalizeSourcePath(file) + ":" + (lineNo || "?");
      this.sourceEl.innerHTML =
        "<div class='dsa-code-trace__empty'>" +
        "This frame points to visualization helper code, not the algorithm body. Regenerate the trace after fixing call-site locations, or move the STEP hook into the algorithm statement." +
        "</div>";
      return;
    }

    fetchSource(this.sourceCache, this.sourceBase, file)
      .then(function (lines) {
        var range = findFunctionRange(lines, lineNo || 1, loc.func || "");
        var hitSet = {};
        var locs = frame.locList || [];
        for (var i = 0; i < locs.length; i++) {
          if (normalizeSourcePath(locs[i].file || "") === normalizeSourcePath(file) && typeof locs[i].line === "number") {
            hitSet[locs[i].line] = true;
          }
        }
        var html = [];
        for (var ln = range.start; ln <= range.end; ln++) {
          var cls = "dsa-code-trace__line";
          if (hitSet[ln]) {
            cls += " is-hit";
          }
          if (lineNo === ln) {
            cls += " is-primary";
          }
          html.push(
            "<div class='" + cls + "'>" +
              "<span class='dsa-code-trace__ln'>" + escHtml(padLeft(ln, 4)) + "</span>" +
              "<span class='dsa-code-trace__text'>" + escHtml(lines[ln - 1] || "") + "</span>" +
            "</div>"
          );
        }
        self.fileEl.textContent =
          normalizeSourcePath(file) + ":" + (lineNo || "?") +
          (loc.func ? " | " + loc.func : "");
        self.sourceEl.innerHTML = html.join("");
        var primary = self.sourceEl.querySelector(".is-primary");
        scrollChildIntoContainer(self.sourceEl, primary, "center");
      })
      .catch(function (err) {
        self.fileEl.textContent = "Failed to load " + normalizeSourcePath(file);
        self.sourceEl.textContent = err.message;
      });
  };

  CodeTrace.prototype.bindPlayerCounters = function () {
    if (!this.playerHost || !window.jQuery) {
      return;
    }
    var self = this;
    var packs = Array.isArray(this.rawStepMap) ? this.rawStepMap : [];
    var panels = this.playerHost.querySelectorAll(".dstrace-context-panel");
    for (var i = 0; i < panels.length; i++) {
      var body = panels[i].querySelector("div[id^='dstrace_ctx_']");
      if (!body) {
        continue;
      }
      var pack = packs[i] && packs[i].frames ? packs[i] : { frames: this.frames };
      (function (contextFrames, targetId) {
        var $target = window.jQuery("#" + targetId);
        $target.off(".dsaCodeTrace");
        $target.on("jsav-updatecounter.dsaCodeTrace", function (evt, current) {
          var frameIdx = Math.max(0, (current || 1) - 2);
          var localFrame = contextFrames.frames[frameIdx];
          if (!localFrame) {
            return;
          }
          var globalIdx = self.frames.indexOf(localFrame);
          if (globalIdx >= 0) {
            self.setActiveFrame(globalIdx, false);
          }
        });
        var counterText = $target.find(".jsavcounter").first().text();
        var initCurrent = parseCounterCurrent(counterText);
        var initFrame = contextFrames.frames[Math.max(0, initCurrent - 2)];
        var initIdx = self.frames.indexOf(initFrame);
        if (initIdx >= 0) {
          self.setActiveFrame(initIdx, false);
        }
      })(pack, body.id);
    }
  };

  window.DSAVisualCodeTrace = {
    attach: function (options) {
      return new CodeTrace(options || {});
    },
    flattenStepMap: flattenStepMap,
    normalizeSourcePath: normalizeSourcePath
  };
})();
