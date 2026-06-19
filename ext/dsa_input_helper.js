(function () {
  "use strict";

  function escHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function splitTokens(text) {
    return String(text || "")
      .replace(/[\[\],;]+/g, " ")
      .split(/\s+/)
      .map(function (x) { return x.trim(); })
      .filter(Boolean);
  }

  function parseIntStrict(token) {
    if (!/^[+-]?\d+$/.test(String(token || ""))) {
      return null;
    }
    var n = Number(token);
    return Number.isSafeInteger(n) ? n : null;
  }

  function parseIntList(text) {
    var tokens = splitTokens(text);
    var values = [];
    var errors = [];
    for (var i = 0; i < tokens.length; i++) {
      var n = parseIntStrict(tokens[i]);
      if (n === null) {
        errors.push("第 " + (i + 1) + " 个值不是整数：" + tokens[i]);
      } else {
        values.push(n);
      }
    }
    if (!values.length) {
      errors.push("至少需要输入一个整数。");
    }
    return { value: values.join(" "), preview: values, errors: errors };
  }

  function parseLineNumbers(text, arity, label) {
    var lines = String(text || "").split(/\r?\n/);
    var rows = [];
    var errors = [];
    for (var i = 0; i < lines.length; i++) {
      var raw = lines[i].trim();
      if (!raw) {
        continue;
      }
      var tokens = splitTokens(raw);
      if (tokens.length !== arity) {
        errors.push("第 " + (i + 1) + " 行需要 " + arity + " 个整数：" + label);
        continue;
      }
      var row = [];
      for (var j = 0; j < tokens.length; j++) {
        var n = parseIntStrict(tokens[j]);
        if (n === null) {
          errors.push("第 " + (i + 1) + " 行第 " + (j + 1) + " 个值不是整数：" + tokens[j]);
        } else {
          row.push(n);
        }
      }
      if (row.length === arity) {
        rows.push(row);
      }
    }
    if (!rows.length) {
      errors.push("至少需要输入一行。");
    }
    return {
      value: rows.map(function (r) { return r.join(" "); }).join("\n"),
      preview: rows,
      errors: errors
    };
  }

  function parseOps(text, spec) {
    var lines = String(text || "").split(/\r?\n/);
    var normalized = [];
    var preview = [];
    var errors = [];
    for (var i = 0; i < lines.length; i++) {
      var raw = lines[i].trim();
      if (!raw) {
        continue;
      }
      var tokens = splitTokens(raw.toLowerCase());
      var op = tokens[0] || "";
      var rule = spec[op];
      if (!rule && spec.aliases && spec.aliases[op]) {
        op = spec.aliases[op];
        rule = spec[op];
      }
      if (!rule) {
        errors.push("第 " + (i + 1) + " 行操作不认识：" + raw);
        continue;
      }
      if (tokens.length - 1 !== rule.arity) {
        errors.push("第 " + (i + 1) + " 行格式应为：" + rule.help);
        continue;
      }
      var args = [];
      for (var j = 1; j < tokens.length; j++) {
        var n = parseIntStrict(tokens[j]);
        if (n === null) {
          errors.push("第 " + (i + 1) + " 行参数不是整数：" + tokens[j]);
        } else {
          args.push(n);
        }
      }
      if (args.length === rule.arity) {
        var out = [op].concat(args).join(" ");
        normalized.push(out);
        preview.push({ op: op, args: args });
      }
    }
    if (!normalized.length) {
      errors.push("至少需要一个操作。");
    }
    return { value: normalized.join("\n"), preview: preview, errors: errors };
  }

  var opSpecs = {
    "tree-ops": {
      insert: { arity: 1, help: "insert x" },
      erase: { arity: 1, help: "erase x" },
      aliases: { delete: "erase", remove: "erase", add: "insert" }
    },
    "heap-ops": {
      push: { arity: 1, help: "push x" },
      pop: { arity: 0, help: "pop" },
      aliases: { insert: "push", delete: "pop", remove: "pop" }
    },
    "dsu-ops": {
      union_rank: { arity: 2, help: "union_rank a b" },
      union_size: { arity: 2, help: "union_size a b" },
      find: { arity: 1, help: "find x" },
      aliases: { union: "union_rank", merge: "union_rank" }
    }
  };

  function parseField(field, raw) {
    var type = field.type || "string";
    if (type === "int") {
      var n = parseIntStrict(raw);
      return n === null
        ? { value: raw, preview: raw, errors: [field.label + " 必须是整数。"] }
        : { value: String(n), preview: n, errors: [] };
    }
    if (type === "boolean") {
      var s = String(raw || "").toLowerCase();
      var b = s === "true" || s === "1" || s === "yes" || s === "on";
      return { value: b ? "true" : "false", preview: b, errors: [] };
    }
    if (type === "int-list") {
      return parseIntList(raw);
    }
    if (type === "edges") {
      return parseLineNumbers(raw, 2, "u v");
    }
    if (type === "weighted-edges") {
      return parseLineNumbers(raw, 3, "u v w");
    }
    if (opSpecs[type]) {
      return parseOps(raw, opSpecs[type]);
    }
    var str = String(raw == null ? "" : raw).trim();
    return {
      value: str,
      preview: str,
      errors: str ? [] : [field.label + " 不能为空。"]
    };
  }

  function checkGraphBounds(input, algo) {
    var errors = [];
    var n = parseIntStrict(input.n);
    if (n === null) {
      return errors;
    }
    var edgeText = input.edges || "";
    var arity = algo.fields.some(function (f) { return f.type === "weighted-edges"; }) ? 3 : 2;
    var parsed = parseLineNumbers(edgeText, arity, arity === 3 ? "u v w" : "u v");
    parsed.preview.forEach(function (row, idx) {
      if (row[0] < 1 || row[0] > n || row[1] < 1 || row[1] > n) {
        errors.push("第 " + (idx + 1) + " 条边的端点应在 1.." + n + " 范围内。");
      }
      if (algo.id === "graph_dijkstra" && arity === 3 && row[2] < 0) {
        errors.push("Dijkstra 不接受负权边：第 " + (idx + 1) + " 条边权为 " + row[2] + "。");
      }
    });
    if (input.source) {
      var source = parseIntStrict(input.source);
      if (source !== null && (source < 1 || source > n)) {
        errors.push("源点应在 1.." + n + " 范围内。");
      }
    }
    return errors;
  }

  function emit(target, name, detail) {
    var eventName = "dsa-input:" + name;
    var evt;
    if (typeof CustomEvent === "function") {
      evt = new CustomEvent(eventName, { bubbles: true, detail: detail || {} });
    } else {
      evt = document.createEvent("CustomEvent");
      evt.initCustomEvent(eventName, true, false, detail || {});
    }
    target.dispatchEvent(evt);
  }

  function isProgressiveType(type) {
    return ["int-list", "edges", "weighted-edges", "tree-ops", "heap-ops", "dsu-ops"].indexOf(type) !== -1;
  }

  function appendLine(text, line) {
    var current = String(text || "").trim();
    return current ? (current + "\n" + line) : line;
  }

  function setControlValue(control, value, helper) {
    control.value = value;
    if (helper) {
      helper.refreshBuilders();
      helper.updatePreview();
    }
  }

  function removeLine(text, index) {
    var lines = String(text || "").split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean);
    lines.splice(index, 1);
    return lines.join("\n");
  }

  function opDisplay(row) {
    var names = {
      insert: "插入",
      erase: "删除",
      push: "入堆",
      pop: "弹出堆顶",
      union_rank: "按秩合并",
      union_size: "按大小合并",
      find: "查找/路径压缩"
    };
    return (names[row.op] || row.op) + (row.args.length ? " " + row.args.join(", ") : "");
  }

  function InputHelper(target, options) {
    this.target = typeof target === "string" ? document.querySelector(target) : target;
    if (!this.target) {
      throw new Error("DSAVisualInputHelper.mount: target not found");
    }
    this.options = options || {};
    this.catalog = (options.catalog || (window.DSAAlgorithmCatalog && window.DSAAlgorithmCatalog.all && window.DSAAlgorithmCatalog.all()) || []);
    this.algorithm = null;
    this.controls = {};
    this.builders = {};
    this.render();
    this.selectAlgorithm(options.algorithmId || (this.catalog[0] && this.catalog[0].id));
  }

  InputHelper.prototype.render = function () {
    this.target.classList.add("dsa-input-helper");
    this.target.innerHTML =
      "<div class='dsa-input-helper__header'>" +
        "<div>" +
          "<div class='dsa-input-helper__title'>Create a Trace</div>" +
          "<div class='dsa-input-helper__subtitle'>Choose an algorithm and enter small teaching-friendly data.</div>" +
        "</div>" +
        "<label class='dsa-input-helper__select-label'>Algorithm <select class='dsa-input-helper__select'></select></label>" +
      "</div>" +
      "<div class='dsa-input-helper__description'></div>" +
      "<div class='dsa-input-helper__fields'></div>" +
      "<div class='dsa-input-helper__actions'>" +
        "<button type='button' class='dsa-input-helper__button' data-action='example'>Reset Example</button>" +
        "<button type='button' class='dsa-input-helper__button is-primary' data-action='submit'>Generate Trace</button>" +
      "</div>" +
      "<div class='dsa-input-helper__errors'></div>" +
      "<div class='dsa-input-helper__preview'><div class='dsa-input-helper__preview-title'>Normalized input.json</div><pre></pre></div>";

    this.selectEl = this.target.querySelector(".dsa-input-helper__select");
    this.descriptionEl = this.target.querySelector(".dsa-input-helper__description");
    this.fieldsEl = this.target.querySelector(".dsa-input-helper__fields");
    this.errorsEl = this.target.querySelector(".dsa-input-helper__errors");
    this.previewEl = this.target.querySelector(".dsa-input-helper__preview pre");

    var groups = {};
    for (var i = 0; i < this.catalog.length; i++) {
      var item = this.catalog[i];
      var groupName = item.group || "Other";
      if (!groups[groupName]) {
        groups[groupName] = document.createElement("optgroup");
        groups[groupName].label = groupName;
        this.selectEl.appendChild(groups[groupName]);
      }
      var opt = document.createElement("option");
      opt.value = item.id;
      opt.textContent = item.title;
      groups[groupName].appendChild(opt);
    }

    var self = this;
    this.selectEl.addEventListener("change", function () {
      self.selectAlgorithm(self.selectEl.value);
    });
    this.target.querySelector("[data-action='example']").addEventListener("click", function () {
      self.fillDefaults();
      self.updatePreview();
    });
    this.target.querySelector("[data-action='submit']").addEventListener("click", function () {
      var result = self.collect();
      if (result.valid) {
        emit(self.target, "submit", result);
      }
    });
  };

  InputHelper.prototype.selectAlgorithm = function (id) {
    var item = null;
    for (var i = 0; i < this.catalog.length; i++) {
      if (this.catalog[i].id === id) {
        item = this.catalog[i];
        break;
      }
    }
    if (!item) {
      return;
    }
    this.algorithm = item;
    this.selectEl.value = item.id;
    this.descriptionEl.innerHTML =
      "<strong>" + escHtml(item.title) + "</strong> - " + escHtml(item.description || "") +
      "<div class='dsa-input-helper__template'>" + escHtml(item.template || "") + "</div>";
    this.renderFields();
    this.fillDefaults();
    this.updatePreview();
  };

  InputHelper.prototype.renderFields = function () {
    var self = this;
    this.controls = {};
    this.builders = {};
    this.fieldsEl.innerHTML = "";
    var fields = this.algorithm.fields || [];
    fields.forEach(function (field) {
      var wrap = document.createElement("div");
      wrap.className = "dsa-input-helper__field";
      var id = "dsa_input_" + self.algorithm.id + "_" + field.name;
      var control;
      var multiline = ["int-list", "edges", "weighted-edges", "tree-ops", "heap-ops", "dsu-ops"].indexOf(field.type) !== -1;
      if (field.type === "boolean") {
        control = document.createElement("select");
        control.innerHTML = "<option value='false'>No</option><option value='true'>Yes</option>";
      } else if (multiline) {
        control = document.createElement("textarea");
        control.rows = field.type.indexOf("ops") !== -1 ? 7 : 6;
        control.placeholder = field.placeholder || "";
      } else {
        control = document.createElement("input");
        control.type = field.type === "int" ? "number" : "text";
        control.placeholder = field.placeholder || "";
      }
      control.id = id;
      control.className = "dsa-input-helper__control";
      control.addEventListener("input", function () { self.updatePreview(); });
      control.addEventListener("change", function () { self.updatePreview(); });
      wrap.innerHTML =
        "<span class='dsa-input-helper__label'>" + escHtml(field.label || field.name) + "</span>" +
        "<span class='dsa-input-helper__help'>" + escHtml(field.help || "") + "</span>";
      if (isProgressiveType(field.type)) {
        wrap.appendChild(self.createProgressiveBuilder(field, control));
        var advanced = document.createElement("details");
        advanced.className = "dsa-input-helper__advanced";
        advanced.innerHTML = "<summary>高级：直接编辑文本</summary>";
        advanced.appendChild(control);
        wrap.appendChild(advanced);
      } else {
        wrap.appendChild(control);
      }
      self.fieldsEl.appendChild(wrap);
      self.controls[field.name] = control;
    });
  };

  InputHelper.prototype.createProgressiveBuilder = function (field, control) {
    var self = this;
    var builder = document.createElement("div");
    builder.className = "dsa-input-builder";
    var type = field.type;

    function addButton(text, action, primary) {
      return "<button type='button' class='dsa-input-builder__button" + (primary ? " is-primary" : "") + "' data-action='" + action + "'>" + text + "</button>";
    }

    if (type === "int-list") {
      builder.innerHTML =
        "<div class='dsa-input-builder__row'>" +
          "<input class='dsa-input-builder__input' type='number' data-role='value' placeholder='数字' />" +
          addButton("添加数字", "add-int", true) +
        "</div>" +
        "<div class='dsa-input-builder__items'></div>";
    } else if (type === "edges" || type === "weighted-edges") {
      builder.innerHTML =
        "<div class='dsa-input-builder__row'>" +
          "<input class='dsa-input-builder__input' type='number' data-role='u' placeholder='起点 u' />" +
          "<input class='dsa-input-builder__input' type='number' data-role='v' placeholder='终点 v' />" +
          (type === "weighted-edges" ? "<input class='dsa-input-builder__input' type='number' data-role='w' placeholder='权重 w' />" : "") +
          addButton("添加边", "add-edge", true) +
        "</div>" +
        "<div class='dsa-input-builder__items'></div>";
    } else if (type === "tree-ops") {
      builder.innerHTML =
        "<div class='dsa-input-builder__row'>" +
          "<input class='dsa-input-builder__input' type='number' data-role='value' placeholder='节点值' />" +
          addButton("插入", "tree-insert", true) +
          addButton("删除", "tree-erase", false) +
        "</div>" +
        "<div class='dsa-input-builder__items'></div>";
    } else if (type === "heap-ops") {
      builder.innerHTML =
        "<div class='dsa-input-builder__row'>" +
          "<input class='dsa-input-builder__input' type='number' data-role='value' placeholder='元素值' />" +
          addButton("入堆", "heap-push", true) +
          addButton("弹出堆顶", "heap-pop", false) +
        "</div>" +
        "<div class='dsa-input-builder__items'></div>";
    } else if (type === "dsu-ops") {
      builder.innerHTML =
        "<div class='dsa-input-builder__row'>" +
          "<input class='dsa-input-builder__input' type='number' data-role='a' placeholder='a' />" +
          "<input class='dsa-input-builder__input' type='number' data-role='b' placeholder='b' />" +
          addButton("按秩合并 a,b", "dsu-rank", true) +
          addButton("按大小合并 a,b", "dsu-size", false) +
        "</div>" +
        "<div class='dsa-input-builder__row'>" +
          "<input class='dsa-input-builder__input' type='number' data-role='x' placeholder='x' />" +
          addButton("查找 x", "dsu-find", false) +
        "</div>" +
        "<div class='dsa-input-builder__items'></div>";
    }

    function readNumber(role) {
      var el = builder.querySelector("[data-role='" + role + "']");
      var n = parseIntStrict(el ? el.value : "");
      return n === null ? null : n;
    }

    function showLocalError(message) {
      var old = builder.querySelector(".dsa-input-builder__local-error");
      if (old) {
        old.remove();
      }
      var node = document.createElement("div");
      node.className = "dsa-input-builder__local-error";
      node.textContent = message;
      builder.insertBefore(node, builder.querySelector(".dsa-input-builder__items"));
    }

    function clearLocalError() {
      var old = builder.querySelector(".dsa-input-builder__local-error");
      if (old) {
        old.remove();
      }
    }

    function appendCanonical(line) {
      clearLocalError();
      setControlValue(control, appendLine(control.value, line), self);
    }

    builder.addEventListener("click", function (evt) {
      var action = evt.target && evt.target.getAttribute("data-action");
      if (!action) {
        return;
      }
      if (action === "remove-line") {
        var idx = parseInt(evt.target.getAttribute("data-index"), 10);
        setControlValue(control, removeLine(control.value, idx), self);
        return;
      }
      var value = readNumber("value");
      var u = readNumber("u");
      var v = readNumber("v");
      var w = readNumber("w");
      var a = readNumber("a");
      var b = readNumber("b");
      var x = readNumber("x");

      if (action === "add-int") {
        if (value === null) return showLocalError("先输入一个整数。");
        var parsed = parseIntList(control.value);
        var next = parsed.preview.concat([value]);
        clearLocalError();
        setControlValue(control, next.join(" "), self);
      } else if (action === "add-edge") {
        if (u === null || v === null || (type === "weighted-edges" && w === null)) {
          return showLocalError(type === "weighted-edges" ? "请填好 u、v、w。" : "请填好 u、v。");
        }
        appendCanonical(type === "weighted-edges" ? [u, v, w].join(" ") : [u, v].join(" "));
      } else if (action === "tree-insert") {
        if (value === null) return showLocalError("先输入节点值。");
        appendCanonical("insert " + value);
      } else if (action === "tree-erase") {
        if (value === null) return showLocalError("先输入节点值。");
        appendCanonical("erase " + value);
      } else if (action === "heap-push") {
        if (value === null) return showLocalError("先输入元素值。");
        appendCanonical("push " + value);
      } else if (action === "heap-pop") {
        appendCanonical("pop");
      } else if (action === "dsu-rank") {
        if (a === null || b === null) return showLocalError("请填好 a 和 b。");
        appendCanonical("union_rank " + a + " " + b);
      } else if (action === "dsu-size") {
        if (a === null || b === null) return showLocalError("请填好 a 和 b。");
        appendCanonical("union_size " + a + " " + b);
      } else if (action === "dsu-find") {
        if (x === null) return showLocalError("请填好 x。");
        appendCanonical("find " + x);
      }
    });

    this.builders[field.name] = function () {
      self.renderBuilderItems(field, control, builder);
    };
    return builder;
  };

  InputHelper.prototype.renderBuilderItems = function (field, control, builder) {
    var items = builder.querySelector(".dsa-input-builder__items");
    if (!items) {
      return;
    }
    var parsed = parseField(field, control.value);
    var rows = [];
    if (field.type === "int-list") {
      rows = (parsed.preview || []).map(function (n) { return String(n); });
    } else if (field.type === "edges" || field.type === "weighted-edges") {
      rows = (parsed.preview || []).map(function (row) {
        return field.type === "weighted-edges"
          ? (row[0] + " -> " + row[1] + "  w=" + row[2])
          : (row[0] + " -> " + row[1]);
      });
    } else if (opSpecs[field.type]) {
      rows = (parsed.preview || []).map(opDisplay);
    }
    if (!rows.length) {
      items.innerHTML = "<div class='dsa-input-builder__empty'>还没有添加内容。</div>";
      return;
    }
    items.innerHTML = rows.map(function (text, idx) {
      return "<div class='dsa-input-builder__item'>" +
        "<span>" + escHtml(String(idx + 1)) + ". " + escHtml(text) + "</span>" +
        "<button type='button' class='dsa-input-builder__remove' data-action='remove-line' data-index='" + idx + "'>移除</button>" +
      "</div>";
    }).join("");
  };

  InputHelper.prototype.refreshBuilders = function () {
    Object.keys(this.builders || {}).forEach(function (name) {
      this.builders[name]();
    }, this);
  };

  InputHelper.prototype.fillDefaults = function () {
    var fields = this.algorithm.fields || [];
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      var control = this.controls[field.name];
      if (control) {
        control.value = field.defaultValue == null ? "" : String(field.defaultValue);
      }
    }
    this.refreshBuilders();
  };

  InputHelper.prototype.collect = function () {
    var algo = this.algorithm;
    var fields = algo.fields || [];
    var input = {};
    var preview = {};
    var errors = [];
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      var raw = this.controls[field.name] ? this.controls[field.name].value : "";
      var parsed = parseField(field, raw);
      input[field.name] = parsed.value;
      preview[field.name] = parsed.preview;
      errors = errors.concat(parsed.errors.map(function (msg) {
        return (field.label || field.name) + "：" + msg;
      }));
    }
    if (algo.group === "Graph") {
      errors = errors.concat(checkGraphBounds(input, algo));
    }
    var result = {
      valid: errors.length === 0,
      algorithmId: algo.id,
      algorithm: algo,
      input: input,
      preview: preview,
      errors: errors,
      inputJson: JSON.stringify(input, null, 2)
    };
    this.renderValidation(result);
    return result;
  };

  InputHelper.prototype.renderValidation = function (result) {
    this.errorsEl.innerHTML = "";
    if (!result.valid) {
      this.errorsEl.innerHTML = result.errors.map(function (msg) {
        return "<div class='dsa-input-helper__error'>" + escHtml(msg) + "</div>";
      }).join("");
    }
    this.previewEl.textContent = result.inputJson;
    this.refreshBuilders();
  };

  InputHelper.prototype.updatePreview = function () {
    this.collect();
  };

  /**
   * @namespace DSAVisualInputHelper
   * @memberof js_input_helper_api
   * @description Public API for the beginner-friendly algorithm input helper.
   *
   * The helper emits `dsa-input:submit` with `{ algorithmId, input, inputJson }`.
   */
  window.DSAVisualInputHelper = {
    /**
     * Mount an input helper form.
     * @memberof DSAVisualInputHelper
     * @param {string|Element} target CSS selector or target element.
     * @param {Object} options Input helper options.
     * @param {string=} options.algorithmId Initial algorithm id.
     * @param {Array<Object>=} options.catalog Algorithm catalog entries.
     * @returns {InputHelper} Mounted helper instance.
     */
    mount: function (target, options) {
      return new InputHelper(target, options || {});
    },
    /**
     * Parse a single catalog field using the helper's built-in parser.
     * @memberof DSAVisualInputHelper
     * @param {Object} field Catalog field definition.
     * @param {string} raw Raw user input.
     * @returns {Object} Parsed value, preview data and validation errors.
     */
    parseField: parseField
  };
})();
