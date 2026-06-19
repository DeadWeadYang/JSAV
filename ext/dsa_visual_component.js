(function () {
  "use strict";

  var DEFAULT_VERSION = "2026-06-14-component-1";
  var dependencyPromise = null;
  var mountedCount = 0;

  function currentScriptSrc() {
    var script = document.currentScript;
    if (script && script.src) {
      return script.src;
    }
    var scripts = document.getElementsByTagName("script");
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].src || "";
      if (src.indexOf("dsa_visual_component.js") !== -1) {
        return src;
      }
    }
    return "";
  }

  function defaultAssetsBase() {
    var src = currentScriptSrc();
    if (!src) {
      return "../";
    }
    if (/\/ext\/dsa_visual_component\.js(?:[?#].*)?$/.test(src)) {
      return src.replace(/ext\/dsa_visual_component\.js(?:[?#].*)?$/, "");
    }
    if (/\/dsa-visual\.js(?:[?#].*)?$/.test(src)) {
      return src.replace(/dsa-visual\.js(?:[?#].*)?$/, "assets/");
    }
    return src.replace(/[^/]*(?:[?#].*)?$/, "assets/");
  }

  function joinUrl(base, path) {
    if (/^(?:https?:)?\/\//.test(path) || path.indexOf("data:") === 0) {
      return path;
    }
    return String(base || "").replace(/\/?$/, "/") + path.replace(/^\/+/, "");
  }

  function hasStylesheet(href) {
    var links = document.getElementsByTagName("link");
    for (var i = 0; i < links.length; i++) {
      if ((links[i].href || "").indexOf(href) !== -1) {
        return true;
      }
    }
    return false;
  }

  function loadCss(href) {
    if (hasStylesheet(href)) {
      return;
    }
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  function loadScript(src, test) {
    if (test && test()) {
      return Promise.resolve();
    }
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector("script[data-dsa-visual-src='" + src.replace(/'/g, "\\'") + "']");
      if (existing) {
        existing.addEventListener("load", function () { resolve(); });
        existing.addEventListener("error", function () { reject(new Error("Failed to load " + src)); });
        return;
      }
      var script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.setAttribute("data-dsa-visual-src", src);
      script.onload = function () { resolve(); };
      script.onerror = function () { reject(new Error("Failed to load " + src)); };
      document.head.appendChild(script);
    });
  }

  function ensureDependencies(options) {
    options = options || {};
    var base = options.assetsBase || defaultAssetsBase();
    if (!dependencyPromise) {
      loadCss(joinUrl(base, "css/JSAV.css"));
      loadCss(joinUrl(base, "css/dsa_visual_component.css"));
      dependencyPromise = Promise.resolve()
        .then(function () {
          return loadScript(joinUrl(base, "lib/jquery.min.js"), function () {
            return !!window.jQuery;
          });
        })
        .then(function () {
          return loadScript(joinUrl(base, "lib/jquery-ui.min.js"), function () {
            return !!(window.jQuery && window.jQuery.ui);
          });
        })
        .then(function () {
          return loadScript(joinUrl(base, "lib/jquery.transit.js"), function () {
            return !!(window.jQuery && window.jQuery.fn && window.jQuery.fn.transition);
          });
        })
        .then(function () {
          return loadScript(joinUrl(base, "lib/raphael.js"), function () {
            return !!window.Raphael;
          });
        })
        .then(function () {
          return loadScript(joinUrl(base, "lib/dagre.min.js"), function () {
            return !!window.dagre;
          });
        })
        .then(function () {
          return loadScript(joinUrl(base, "build/JSAV.js"), function () {
            return !!window.JSAV;
          });
        })
        .then(function () {
          return loadScript(joinUrl(base, "ext/bug_fix.js"));
        })
        .then(function () {
          return loadScript(joinUrl(base, "ext/binary_tree_rotation.js"));
        })
        .then(function () {
          return loadScript(joinUrl(base, "ext/ds_trace_player.js"), function () {
            return !!(window.playDSTrace && window.parseDSTraceJSONL);
          });
        })
        .then(function () {
          return loadScript(joinUrl(base, "ext/dsa_code_trace.js"), function () {
            return !!window.DSAVisualCodeTrace;
          });
        });
    }
    return dependencyPromise;
  }

  function boolAttr(el, name, fallback) {
    if (!el.hasAttribute(name)) {
      return fallback;
    }
    var value = String(el.getAttribute(name) || "").toLowerCase();
    return !(value === "false" || value === "0" || value === "no");
  }

  function numberAttr(el, name, fallback) {
    if (!el.hasAttribute(name)) {
      return fallback;
    }
    var n = Number(el.getAttribute(name));
    return Number.isFinite(n) ? n : fallback;
  }

  function initialAnimationSpeed(options) {
    if (options && options.animationSpeed === false) {
      return false;
    }
    return (options && typeof options.animationSpeed === "number") ? options.animationSpeed : 150;
  }

  function applyAnimationSpeed(speed) {
    if (speed === false || !Number.isFinite(Number(speed))) {
      return;
    }
    var value = Number(speed);
    if (window.JSAV && window.JSAV.ext) {
      window.JSAV.ext.SPEED = value;
    }
    if (window.jQuery) {
      window.jQuery(document).trigger("jsav-speed-change", value);
    }
  }

  function parseOptionsFromElement(el) {
    return {
      src: el.getAttribute("src") || "",
      staticSrc: el.getAttribute("static-src") || "",
      mode: el.getAttribute("mode") || "",
      assetsBase: el.getAttribute("assets-base") || "",
      graphLayout: el.getAttribute("graph-layout") || el.getAttribute("layout") || "auto_freeze",
      animationSpeed: numberAttr(el, "animation-speed", undefined),
      showToolbar: boolAttr(el, "toolbar", true),
      showSourceInput: boolAttr(el, "source-input", false),
      codeTrace: boolAttr(el, "code-trace", false),
      sourceBase: el.getAttribute("source-base") || "",
      height: el.getAttribute("height") || "",
      title: el.getAttribute("title") || ""
    };
  }

  function setText(node, text) {
    node.textContent = text || "";
  }

  function emit(target, name, detail) {
    var eventName = "dsa-visual:" + name;
    var evt;
    if (typeof CustomEvent === "function") {
      evt = new CustomEvent(eventName, {
        bubbles: true,
        detail: detail || {}
      });
    } else {
      evt = document.createEvent("CustomEvent");
      evt.initCustomEvent(eventName, true, false, detail || {});
    }
    target.dispatchEvent(evt);
  }

  function createShell(target, options) {
    target.innerHTML = "";
    target.classList.add("dsa-visual");
    if (options.height) {
      target.style.setProperty("--dsa-visual-height", /^\d+$/.test(String(options.height)) ? (options.height + "px") : options.height);
    }

    var header = document.createElement("div");
    header.className = "dsa-visual__header";
    var title = document.createElement("div");
    title.className = "dsa-visual__title";
    title.textContent = options.title || "DSA Trace Player";
    var status = document.createElement("div");
    status.className = "dsa-visual__status";
    header.appendChild(title);
    header.appendChild(status);

    var toolbar = document.createElement("div");
    toolbar.className = "dsa-visual__toolbar";
    var reload = document.createElement("button");
    reload.type = "button";
    reload.className = "dsa-visual__button";
    reload.textContent = "Reload";
    toolbar.appendChild(reload);

    var speedLabel = document.createElement("label");
    speedLabel.className = "dsa-visual__speed-label";
    speedLabel.textContent = "Speed";
    var speedSelect = document.createElement("select");
    speedSelect.className = "dsa-visual__speed";
    [
      [220, "Slow"],
      [150, "Normal"],
      [90, "Fast"],
      [50, "Very fast"]
    ].forEach(function (item) {
      var option = document.createElement("option");
      option.value = String(item[0]);
      option.textContent = item[1];
      speedSelect.appendChild(option);
    });
    var speedValue = initialAnimationSpeed(options);
    if (speedValue !== false) {
      if (!speedSelect.querySelector("option[value='" + String(speedValue) + "']")) {
        var custom = document.createElement("option");
        custom.value = String(speedValue);
        custom.textContent = speedValue + " ms";
        speedSelect.appendChild(custom);
      }
      speedSelect.value = String(speedValue);
    }
    speedLabel.appendChild(speedSelect);
    toolbar.appendChild(speedLabel);

    var textarea = document.createElement("textarea");
    textarea.className = "dsa-visual__source";
    textarea.placeholder = "Paste JSONL trace here";

    var viewport = document.createElement("div");
    viewport.className = "dsa-visual__viewport";
    var workspace = document.createElement("div");
    workspace.className = "dsa-visual__workspace";
    workspace.appendChild(viewport);

    var codeTrace = null;
    if (options.codeTrace) {
      target.classList.add("has-code-trace");
      codeTrace = document.createElement("div");
      codeTrace.className = "dsa-visual__code-trace";
      workspace.appendChild(codeTrace);
    }

    target.appendChild(header);
    if (options.showToolbar) {
      target.appendChild(toolbar);
    }
    if (options.showSourceInput) {
      target.appendChild(textarea);
    }
    target.appendChild(workspace);

    return {
      header: header,
      status: status,
      toolbar: toolbar,
      reload: reload,
      speedSelect: speedSelect,
      textarea: textarea,
      viewport: viewport,
      workspace: workspace,
      codeTrace: codeTrace
    };
  }

  function fetchText(src) {
    return fetch(src).then(function (res) {
      if (!res.ok) {
        throw new Error("HTTP " + res.status + " when loading " + src);
      }
      return res.text();
    });
  }

  function TracePlayer(target, options) {
    this.target = target;
    this.options = options || {};
    this.events = [];
    this.traceText = "";
    this.inlineTraceText = "";
    this.codeTrace = null;
    this.animationSpeed = initialAnimationSpeed(this.options);
    var inline = target.querySelector("script[type='application/jsonl'], script[type='text/plain']");
    if (inline) {
      this.inlineTraceText = inline.textContent || "";
    }
    this.shell = createShell(target, this.options);
    this.ready = this.init();
  }

  TracePlayer.prototype.setStatus = function (text) {
    setText(this.shell.status, text);
  };

  TracePlayer.prototype.init = function () {
    var self = this;
    this.shell.reload.addEventListener("click", function () {
      self.load().catch(function (err) {
        self.setStatus(err.message);
        emit(self.target, "error", { error: err, message: err.message });
      });
    });
    this.shell.speedSelect.addEventListener("change", function () {
      self.setAnimationSpeed(Number(self.shell.speedSelect.value));
    });
    return ensureDependencies(this.options).then(function () {
      self.setAnimationSpeed(self.animationSpeed, { silent: true });
      return self.load();
    }).catch(function (err) {
      self.setStatus(err.message);
      emit(self.target, "error", { error: err, message: err.message });
      throw err;
    });
  };

  TracePlayer.prototype.load = function () {
    var self = this;
    var options = this.options;
    this.setStatus("Loading...");

    if (options.mode === "static" || options.staticSrc) {
      return this.loadStatic(options.staticSrc || options.src);
    }

    if (options.events) {
      this.events = options.events.slice();
      this.traceText = "";
      return this.play();
    }
    if (typeof options.traceText === "string") {
      this.traceText = options.traceText;
      this.events = window.parseDSTraceJSONL(options.traceText);
      this.shell.textarea.value = options.traceText;
      return this.play();
    }
    if (options.src) {
      return fetchText(options.src).then(function (text) {
        self.traceText = text;
        self.events = window.parseDSTraceJSONL(text);
        self.shell.textarea.value = text;
        return self.play();
      });
    }

    if (this.inlineTraceText) {
      this.traceText = this.inlineTraceText;
      this.events = window.parseDSTraceJSONL(this.traceText);
      this.shell.textarea.value = this.traceText;
      return this.play();
    }

    this.setStatus("No trace source.");
    return Promise.resolve(this);
  };

  TracePlayer.prototype.setAnimationSpeed = function (speed, opts) {
    if (speed === false) {
      this.animationSpeed = false;
      this.options.animationSpeed = false;
      return this;
    }
    var value = Number(speed);
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error("setAnimationSpeed expects a positive number of milliseconds");
    }
    this.animationSpeed = value;
    this.options.animationSpeed = value;
    if (this.shell && this.shell.speedSelect) {
      if (!this.shell.speedSelect.querySelector("option[value='" + String(value) + "']")) {
        var custom = document.createElement("option");
        custom.value = String(value);
        custom.textContent = value + " ms";
        this.shell.speedSelect.appendChild(custom);
      }
      this.shell.speedSelect.value = String(value);
    }
    applyAnimationSpeed(value);
    if (!opts || !opts.silent) {
      emit(this.target, "speedchange", { animationSpeed: value });
    }
    return this;
  };

  TracePlayer.prototype.play = function () {
    var options = this.options;
    var textFromTextarea = this.options.showSourceInput ? this.shell.textarea.value : null;
    if (textFromTextarea !== null && textFromTextarea !== this.traceText) {
      this.traceText = textFromTextarea;
      this.events = window.parseDSTraceJSONL(textFromTextarea);
    }
    this.shell.viewport.innerHTML = "";
    window.playDSTrace(this.shell.viewport, this.events || [], {
      graphLayout: options.graphLayout || "auto_freeze",
      animationSpeed: this.animationSpeed
    });
    this.setAnimationSpeed(this.animationSpeed, { silent: true });
    this.attachCodeTrace();
    this.setStatus("Loaded " + (this.events ? this.events.length : 0) + " events.");
    emit(this.target, "loaded", {
      mode: "trace",
      events: this.events ? this.events.length : 0,
      stepMap: window.getLastStepMap ? window.getLastStepMap() : []
    });
    return Promise.resolve(this);
  };

  TracePlayer.prototype.attachCodeTrace = function () {
    if (!this.options.codeTrace || !this.shell.codeTrace || !window.DSAVisualCodeTrace) {
      return;
    }
    this.codeTrace = window.DSAVisualCodeTrace.attach({
      playerHost: this.shell.viewport,
      panel: this.shell.codeTrace,
      sourceBase: this.options.sourceBase || "../../",
      stepMap: window.getLastStepMap ? window.getLastStepMap() : []
    });
  };

  TracePlayer.prototype.loadStatic = function (src) {
    var self = this;
    if (!src) {
      this.setStatus("No static source.");
      return Promise.resolve(this);
    }
    this.shell.viewport.innerHTML = "";
    this.shell.viewport.id = this.shell.viewport.id || "av";
    if (this.shell.viewport.id !== "av" && !document.getElementById("av")) {
      this.shell.viewport.id = "av";
    }
    return loadScript(src + (src.indexOf("?") === -1 ? "?t=" : "&t=") + Date.now()).then(function () {
      self.setStatus("Loaded static trace.");
      emit(self.target, "loaded", {
        mode: "static",
        src: src,
        stepMap: window.getLastStepMap ? window.getLastStepMap() : []
      });
      return self;
    });
  };

  function mount(target, options) {
    var el = (typeof target === "string") ? document.querySelector(target) : target;
    if (!el) {
      throw new Error("DSAVisual.mount: target not found");
    }
    el.__dsaVisual = new TracePlayer(el, options || {});
    return el.__dsaVisual;
  }

  function defineElement() {
    if (!window.customElements || window.customElements.get("dsa-trace-player")) {
      return;
    }
    window.customElements.define("dsa-trace-player", class extends HTMLElement {
      connectedCallback() {
        if (this.__dsaVisualMounted) {
          return;
        }
        this.__dsaVisualMounted = true;
        mountedCount += 1;
        if (!this.id) {
          this.id = "dsa-trace-player-" + mountedCount;
        }
        this.__dsaVisual = mount(this, parseOptionsFromElement(this));
      }
    });
  }

  /**
   * @namespace DSAVisual
   * @memberof js_component_api
   * @description Public browser API for embedding the DSA trace player.
   *
   * Common usage:
   *
   * ```js
   * const player = DSAVisual.mount("#player", {
   *   traceText,
   *   assetsBase: "/dsa-visual/assets/",
   *   sourceBase: "/sources/",
   *   codeTrace: true,
   *   animationSpeed: 120
   * });
   * player.setAnimationSpeed(90);
   * ```
   */
  window.DSAVisual = {
    version: DEFAULT_VERSION,
    /**
     * Mount a trace player into a DOM node.
     * @memberof DSAVisual
     * @param {string|Element} target CSS selector or target element.
     * @param {Object} options Player options.
     * @param {string=} options.traceText JSONL trace text.
     * @param {Array<Object>=} options.events Parsed trace events.
     * @param {string=} options.src URL of a JSONL trace file.
     * @param {string=} options.assetsBase Base URL for bundled JSAV assets.
     * @param {string=} options.sourceBase Base URL for C++ source files used by code trace.
     * @param {boolean=} options.codeTrace Whether to show the code trace panel.
     * @param {number|boolean=} options.animationSpeed Animation speed in milliseconds, or false to leave JSAV speed unchanged.
     * @returns {TracePlayer} Mounted player instance.
     */
    mount: mount,
    /**
     * Load JSAV and DSA Visual runtime dependencies.
     * @memberof DSAVisual
     * @param {Object=} options Dependency options.
     * @param {string=} options.assetsBase Base URL for JSAV assets.
     * @returns {Promise<void>} Promise resolved when dependencies are ready.
     */
    ensureDependencies: ensureDependencies,
    /**
     * Parse JSONL trace text into event objects.
     * @memberof DSAVisual
     * @param {string} text JSONL trace text.
     * @returns {Array<Object>} Parsed events.
     */
    parseJSONL: function (text) {
      if (!window.parseDSTraceJSONL) {
        throw new Error("DSAVisual.parseJSONL requires ds_trace_player.js");
      }
      return window.parseDSTraceJSONL(text || "");
    }
  };

  defineElement();
})();
