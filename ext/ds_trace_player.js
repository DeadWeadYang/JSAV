(function () {
  "use strict";

  function parseDSTraceJSONL(text) {
    var lines = text.split(/\r?\n/);
    var events = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) {
        continue;
      }
      try {
        events.push(JSON.parse(line));
      } catch (e) {
        throw new Error("Invalid JSONL at line " + (i + 1) + ": " + e.message);
      }
    }
    return events;
  }

  function buildDSTraceJSAVCode(events, options) {
    options = options || {};
    var avId = options.avId || "av";
    var includeLoc = options.includeLoc !== false;
    var lines = [];

    function q(v) {
      return JSON.stringify(v);
    }

    function pushEvtComment(evt) {
      if (!includeLoc || !evt) {
        return;
      }
      var loc = evt.loc || {};
      var file = loc.file || "?";
      var line = typeof loc.line === "number" ? loc.line : "?";
      var func = loc.func || "?";
      lines.push("// seq " + (evt.seq || "?") + " " + file + ":" + line + " " + func);
    }

    lines.push("var jsav = new JSAV(" + q(avId) + ");");
    lines.push("var __arr = {};");
    lines.push("var __arrOrder = [];");
    lines.push("var __arrFocus = {};");
    lines.push("var __arrWrite = {};");
    lines.push("var __bt = {};");
    lines.push("var __btOrder = [];");
    lines.push("var __btGhost = {};");
    lines.push("var __btRootId = {};");
    lines.push("var __nodes = {};");
    lines.push("var __meta = {};");
    lines.push("var __colorMap = { red: '#d94848', black: '#2d3748' };");
    lines.push("");
    lines.push("function __nodeText(m) {");
    lines.push("  var v = (m && m.value !== undefined && m.value !== null) ? String(m.value) : '';");
    lines.push("  var n = (m && m.note) ? String(m.note) : '';");
    lines.push("  return n ? (v + '\\\\n' + n) : v;");
    lines.push("}");
    lines.push("function __ensureArray(obj, values) {");
    lines.push("  if (__arr[obj]) return __arr[obj];");
    lines.push("  var a = jsav.ds.array(values || [], { left: 20, top: 20 + __arrOrder.length * 90, indexed: true });");
    lines.push("  __arr[obj] = a;");
    lines.push("  __arrOrder.push(obj);");
    lines.push("  return a;");
    lines.push("}");
    lines.push("function __setFocus(obj, l, r) {");
    lines.push("  var a = __ensureArray(obj, []);");
    lines.push("  var old = __arrFocus[obj] || [];");
    lines.push("  if (old.length) a.css(old, { outline: '', 'outline-offset': '' });");
    lines.push("  var idx = [];");
    lines.push("  for (var i = l; i < r; i++) idx.push(i);");
    lines.push("  __arrFocus[obj] = idx;");
    lines.push("  if (idx.length) a.css(idx, { outline: '2px solid #2b8a3e', 'outline-offset': '-2px' });");
    lines.push("}");
    lines.push("function __setArrayValue(obj, idx, value) {");
    lines.push("  var a = __ensureArray(obj, []);");
    lines.push("  var old = __arrWrite[obj] || [];");
    lines.push("  if (old.length) a.css(old, { outline: '', 'outline-offset': '', 'background-color': '', 'font-weight': '' });");
    lines.push("  a.css([idx], { outline: '3px solid #d94848', 'outline-offset': '-2px', 'background-color': '#fff1f2', 'font-weight': '700' });");
    lines.push("  a.value(idx, value);");
    lines.push("  __arrWrite[obj] = [idx];");
    lines.push("}");
    lines.push("function __ensureBTree(obj) {");
    lines.push("  if (__bt[obj]) return __bt[obj];");
    lines.push("  var t = jsav.ds.binarytree({ left: 20 + __btOrder.length * 460, top: 20, center: false });");
    lines.push("  __bt[obj] = t;");
    lines.push("  __btOrder.push(obj);");
    lines.push("  var g = t.root();");
    lines.push("  if (g) {");
    lines.push("    if (typeof g.left === 'function') g.left(null, { hide: false });");
    lines.push("    if (typeof g.right === 'function') g.right(null, { hide: false });");
    lines.push("    if (typeof g.isVisible === 'function' && g.isVisible()) g.hide({ recursive: false });");
    lines.push("  }");
    lines.push("  __btGhost[obj] = g || null;");
    lines.push("  __btRootId[obj] = null;");
    lines.push("  if (!__nodes[obj]) __nodes[obj] = {};");
    lines.push("  if (!__meta[obj]) __meta[obj] = {};");
    lines.push("  return t;");
    lines.push("}");
    lines.push("function __hideGhost(obj) {");
    lines.push("  var g = __btGhost[obj];");
    lines.push("  if (!g) return;");
    lines.push("  if (typeof g.isVisible === 'function' && g.isVisible()) g.hide({ recursive: false });");
    lines.push("}");
    lines.push("function __setRoot(obj, id, node) {");
    lines.push("  var t = __ensureBTree(obj);");
    lines.push("  var g = __btGhost[obj];");
    lines.push("  if (!id || !node) {");
    lines.push("    if (g) {");
    lines.push("      t.root(g, { hide: false });");
    lines.push("      if (typeof g.left === 'function') g.left(null, { hide: false });");
    lines.push("      if (typeof g.right === 'function') g.right(null, { hide: false });");
    lines.push("      __hideGhost(obj);");
    lines.push("    }");
    lines.push("    __btRootId[obj] = null;");
    lines.push("    return;");
    lines.push("  }");
    lines.push("  __showIfHidden(node);");
    lines.push("  t.root(node, { hide: false });");
    lines.push("  __hideGhost(obj);");
    lines.push("  __btRootId[obj] = id;");
    lines.push("}");
    lines.push("function __getMeta(obj, id) {");
    lines.push("  if (!__meta[obj]) __meta[obj] = {};");
    lines.push("  if (!__meta[obj][id]) __meta[obj][id] = { value: '', note: '', color: 'black' };");
    lines.push("  return __meta[obj][id];");
    lines.push("}");
    lines.push("function __applyStyle(node, meta) {");
    lines.push("  if (!node || !meta) return;");
    lines.push("  var bg = __colorMap[meta.color || 'black'] || __colorMap.black;");
    lines.push("  node.css({ 'background-color': bg, color: '#ffffff', 'white-space': 'pre-line' });");
    lines.push("}");
    lines.push("function __showIfHidden(node) {");
    lines.push("  if (!node || typeof node.isVisible !== 'function') return;");
    lines.push("  if (!node.isVisible()) node.show({ recursive: false });");
    lines.push("}");
    lines.push("function __ensureNode(obj, id) {");
    lines.push("  var map = __nodes[obj] || (__nodes[obj] = {});");
    lines.push("  if (map[id]) return map[id];");
    lines.push("  var t = __ensureBTree(obj);");
    lines.push("  var m = __getMeta(obj, id);");
    lines.push("  var n = t.newNode(__nodeText(m));");
    lines.push("  __applyStyle(n, m);");
    lines.push("  map[id] = n;");
    lines.push("  return n;");
    lines.push("}");
    lines.push("function __refreshNode(obj, id) {");
    lines.push("  var map = __nodes[obj] || {};");
    lines.push("  var n = map[id];");
    lines.push("  if (!n) return;");
    lines.push("  var m = __getMeta(obj, id);");
    lines.push("  n.value(__nodeText(m));");
    lines.push("  __applyStyle(n, m);");
    lines.push("}");
    lines.push("function __bt_sync(obj, args) {");
    lines.push("  var t = __ensureBTree(obj);");
    lines.push("  var nodes = (args && args.nodes) || [];");
    lines.push("  var rootId = args ? args.root : null;");
    lines.push("  var index = {};");
    lines.push("  for (var i = 0; i < nodes.length; i++) if (nodes[i] && nodes[i].id) index[nodes[i].id] = nodes[i];");
    lines.push("  var built = {};");
    lines.push("  function build(id) {");
    lines.push("    if (!id) return null;");
    lines.push("    if (built[id]) return built[id];");
    lines.push("    var d = index[id];");
    lines.push("    if (!d) return null;");
    lines.push("    var m = __getMeta(obj, id);");
    lines.push("    if (d.value !== undefined) m.value = d.value;");
    lines.push("    var n = __ensureNode(obj, id);");
    lines.push("    __showIfHidden(n);");
    lines.push("    n.value(__nodeText(m));");
    lines.push("    __applyStyle(n, m);");
    lines.push("    built[id] = n;");
    lines.push("    n.left(build(d.left), { hide: false });");
    lines.push("    n.right(build(d.right), { hide: false });");
    lines.push("    return n;");
    lines.push("  }");
    lines.push("  if (!rootId) {");
    lines.push("    __setRoot(obj, null, null);");
    lines.push("    __nodes[obj] = {};");
    lines.push("    t.layout();");
    lines.push("    return;");
    lines.push("  }");
    lines.push("  var rn = build(rootId);");
    lines.push("  if (rn) __setRoot(obj, rootId, rn);");
    lines.push("  __nodes[obj] = built;");
    lines.push("  t.layout();");
    lines.push("}");
    lines.push("");
    lines.push("jsav.displayInit();");
    lines.push("");

    for (var i = 0; i < events.length; i++) {
      var evt = events[i] || {};
      var ds = evt.ds;
      var op = evt.op;
      var obj = evt.obj || (ds === "btree" ? "T" : "A");
      var args = evt.args || {};

      pushEvtComment(evt);

      if (ds === "array") {
        if (op === "init") {
          lines.push("__ensureArray(" + q(obj) + ", " + q(args.values || []) + ");");
        } else if (op === "focus") {
          lines.push("__setFocus(" + q(obj) + ", " + (args.l || 0) + ", " + (args.r || 0) + ");");
        } else if (op === "swap") {
          lines.push("__ensureArray(" + q(obj) + ", []).swap(" + (args.i || 0) + ", " + (args.j || 0) + ", { highlight: true });");
        } else if (op === "set") {
          lines.push("__setArrayValue(" + q(obj) + ", " + (args.i || 0) + ", " + q(args.v) + ");");
        } else if (op === "mark") {
          lines.push("__ensureArray(" + q(obj) + ", []).highlight(" + q(args.indices || []) + ");");
        } else if (op === "unmark") {
          lines.push("__ensureArray(" + q(obj) + ", []).unhighlight(" + q(args.indices || []) + ");");
        } else {
          lines.push("// unsupported array op: " + q(op));
        }
      } else if (ds === "btree") {
        if (op === "init") {
          lines.push("__ensureBTree(" + q(obj) + ");");
        } else if (op === "new_node") {
          lines.push("(function(){ var a=" + q(args) + "; var m=__getMeta(" + q(obj) + ", a.id); if(a.value!==undefined)m.value=a.value; if(a.note!==undefined)m.note=a.note; if(a.color!==undefined)m.color=a.color; __ensureNode(" + q(obj) + ", a.id); })();");
        } else if (op === "set_root") {
          lines.push("(function(){ var t=__ensureBTree(" + q(obj) + "); var id=" + q(args.id) + "; if(!id){ __setRoot(" + q(obj) + ", null, null); __nodes[" + q(obj) + "]={}; t.layout(); return; } var r=__ensureNode(" + q(obj) + ", id); __setRoot(" + q(obj) + ", id, r); __refreshNode(" + q(obj) + ", id); t.layout(); })();");
        } else if (op === "link") {
          lines.push("(function(){ var a=" + q(args) + "; if(!a.parent || (a.side!=='left' && a.side!=='right')) return; var t=__ensureBTree(" + q(obj) + "); var p=__ensureNode(" + q(obj) + ", a.parent); __showIfHidden(p); if(a.child===null || a.child===undefined){ if(a.side==='left') p.left(null,{ hide:false }); else p.right(null,{ hide:false }); t.layout(); return; } var c=__ensureNode(" + q(obj) + ", a.child); if(c.parent()) c.remove({ hide:false }); __showIfHidden(c); if(a.side==='left') p.left(c,{ hide:false }); else p.right(c,{ hide:false }); __refreshNode(" + q(obj) + ", a.parent); __refreshNode(" + q(obj) + ", a.child); t.layout(); })();");
        } else if (op === "remove_node") {
          lines.push("(function(){ var id=" + q(args.id) + "; if(!id) return; var map=__nodes[" + q(obj) + "]||{}; var n=map[id]; var t=__ensureBTree(" + q(obj) + "); if(n){ if(typeof n.left==='function') n.left(null,{ hide:false }); if(typeof n.right==='function') n.right(null,{ hide:false }); if(t.root && t.root()===n){ if(typeof n.isVisible==='function' && n.isVisible()){ n.hide({ recursive:false }); } } else { n.remove({ hide:false }); } } t.layout(); })();");
        } else if (op === "destroy_node") {
          lines.push("(function(){ var id=" + q(args.id) + "; if(!id) return; var map=__nodes[" + q(obj) + "]||{}; var n=map[id]; if(n && typeof n.isVisible==='function' && n.isVisible()){ n.hide({ recursive:false }); } delete map[id]; if(__meta[" + q(obj) + "]) delete __meta[" + q(obj) + "][id]; })();");
        } else if (op === "rotate_left") {
          lines.push("(function(){ var map=__nodes[" + q(obj) + "]||{}; var p=map[" + q(args.pivot) + "]; var t=__ensureBTree(" + q(obj) + "); if(p && typeof p.rotateLeft==='function'){ p.rotateLeft(); t.layout(); } })();");
        } else if (op === "rotate_right") {
          lines.push("(function(){ var map=__nodes[" + q(obj) + "]||{}; var p=map[" + q(args.pivot) + "]; var t=__ensureBTree(" + q(obj) + "); if(p && typeof p.rotateRight==='function'){ p.rotateRight(); t.layout(); } })();");
        } else if (op === "set_note") {
          lines.push("(function(){ var id=" + q(args.id) + "; if(!id) return; var m=__getMeta(" + q(obj) + ", id); m.note=" + q(args.note || "") + "; __refreshNode(" + q(obj) + ", id); __ensureBTree(" + q(obj) + ").layout(); })();");
        } else if (op === "set_color") {
          lines.push("(function(){ var id=" + q(args.id) + "; if(!id) return; var m=__getMeta(" + q(obj) + ", id); m.color=" + q(args.color || "black") + "; __refreshNode(" + q(obj) + ", id); })();");
        } else if (op === "mark") {
          lines.push("(function(){ var ids=" + q(args.ids || []) + "; var map=__nodes[" + q(obj) + "]||{}; for(var i=0;i<ids.length;i++){ if(map[ids[i]]) map[ids[i]].css({outline:'3px solid #f59e0b','outline-offset':'3px'}); } })();");
        } else if (op === "unmark") {
          lines.push("(function(){ var ids=" + q(args.ids || []) + "; var map=__nodes[" + q(obj) + "]||{}; for(var i=0;i<ids.length;i++){ if(map[ids[i]]) map[ids[i]].css({outline:'','outline-offset':''}); } })();");
        } else if (op === "sync") {
          lines.push("__bt_sync(" + q(obj) + ", " + q(args) + ");");
        } else {
          lines.push("// unsupported btree op: " + q(op));
        }
      } else {
        lines.push("// unsupported ds: " + q(ds) + ", op: " + q(op));
      }

      if (evt.step) {
        lines.push("jsav.step();");
      }
      lines.push("");
    }

    lines.push("jsav.recorded();");
    return lines.join("\n");
  }

  function buildDSTraceFlatJSAVCode(events, options) {
    options = options || {};
    var avId = options.avId || "av";
    var includeLoc = options.includeLoc !== false;
    var lines = [];

    function q(v) {
      return JSON.stringify(v);
    }

    function idToVarToken(id) {
      return String(id).replace(/[^a-zA-Z0-9_]/g, "_");
    }

    function getNodeText(meta) {
      var value = meta && meta.value !== undefined && meta.value !== null ? String(meta.value) : "";
      var note = meta && meta.note ? String(meta.note) : "";
      return note ? (value + "\n" + note) : value;
    }

    function nodeStyle(meta) {
      var colorKey = (meta && meta.color) || "black";
      var bg = colorKey === "red" ? "#d94848" : "#2d3748";
      return { "background-color": bg, color: "#ffffff", "white-space": "pre-line" };
    }

    function pushEvtComment(evt, ctxName) {
      if (!includeLoc || !evt) {
        return;
      }
      var loc = evt.loc || {};
      var file = loc.file || "?";
      var line = typeof loc.line === "number" ? loc.line : "?";
      var func = loc.func || "?";
      lines.push("// ctx " + (ctxName || "default") + " | seq " + (evt.seq || "?") + " " + file + ":" + line + " " + func);
    }

    var groups = {};
    var order = [];
    for (var gi = 0; gi < events.length; gi++) {
      var ev0 = events[gi] || {};
      var key = ev0.ctx || "default";
      if (!groups[key]) {
        groups[key] = [];
        order.push(key);
      }
      groups[key].push(ev0);
    }

    lines.push("var __dstrace_host = document.getElementById(" + q(avId) + ");");
    lines.push("__dstrace_host.innerHTML = \"\";");
    lines.push("");

    function buildContext(ctxName, ctxEvents, ctxIndex) {
      var ctxToken = idToVarToken(ctxName);
      var panelVar = "__panel_" + ctxToken + "_" + ctxIndex;
      var titleVar = "__title_" + ctxToken + "_" + ctxIndex;
      var bodyVar = "__body_" + ctxToken + "_" + ctxIndex;
      var controlsVar = "__controls_" + ctxToken + "_" + ctxIndex;
      var counterVar = "__counter_" + ctxToken + "_" + ctxIndex;
      var panelId = "dstrace_ctx_" + ctxIndex;
      var jsavVar = "jsav_" + ctxToken + "_" + ctxIndex;

      var arrVars = {};
      var arrOrder = [];
      var arrFocus = {};
      var btVars = {};
      var btOrder = [];
      var nodeVars = {};
      var nodeMeta = {};
      var nodeHidden = {};
      var btRoot = {};
      var btGhost = {};
      var btParent = {};
      var btChildren = {};

      function arrVar(obj) {
        return "arr_" + idToVarToken(ctxName + "__" + obj);
      }

      function btVar(obj) {
        return "bt_" + idToVarToken(ctxName + "__" + obj);
      }

      function nodeVar(obj, id) {
        return "node_" + idToVarToken(ctxName + "__" + obj + "__" + id);
      }

      function ensureArray(obj, values) {
        if (arrVars[obj]) {
          return arrVars[obj];
        }
        var v = arrVar(obj);
        lines.push("var " + v + " = " + jsavVar + ".ds.array(" + q(values || []) + ", { left: 20, top: " + (20 + arrOrder.length * 90) + ", indexed: true });");
        arrVars[obj] = v;
        arrOrder.push(obj);
        return v;
      }

      function ensureBTree(obj) {
        if (btVars[obj]) {
          return btVars[obj];
        }
        var v = btVar(obj);
        lines.push("var " + v + " = " + jsavVar + ".ds.binarytree({ left: " + (20 + btOrder.length * 460) + ", top: 20, center: false });");
        btVars[obj] = v;
        btOrder.push(obj);
        nodeVars[obj] = nodeVars[obj] || {};
        nodeMeta[obj] = nodeMeta[obj] || {};
        nodeHidden[obj] = nodeHidden[obj] || {};
        btRoot[obj] = null;
        btParent[obj] = btParent[obj] || {};
        btChildren[obj] = btChildren[obj] || {};
        var gv = "__ghost_" + idToVarToken(ctxName + "__" + obj);
        lines.push("var " + gv + " = " + v + ".root();");
        lines.push(gv + ".left(null, { hide: false });");
        lines.push(gv + ".right(null, { hide: false });");
        lines.push(gv + ".hide({ recursive: false });");
        btGhost[obj] = gv;
        return v;
      }

      function ensureNode(obj, id) {
        if (!id) {
          return null;
        }
        ensureBTree(obj);
        nodeVars[obj] = nodeVars[obj] || {};
        nodeMeta[obj] = nodeMeta[obj] || {};
        nodeHidden[obj] = nodeHidden[obj] || {};
        btParent[obj] = btParent[obj] || {};
        btChildren[obj] = btChildren[obj] || {};
        if (!nodeMeta[obj][id]) {
          nodeMeta[obj][id] = { value: "", note: "", color: "black" };
        }
        if (nodeVars[obj][id]) {
          return nodeVars[obj][id];
        }
        var nv = nodeVar(obj, id);
        var tv = btVars[obj];
        lines.push("var " + nv + " = " + tv + ".newNode(" + q(getNodeText(nodeMeta[obj][id])) + ");");
        lines.push(nv + ".css(" + q(nodeStyle(nodeMeta[obj][id])) + ");");
        nodeVars[obj][id] = nv;
        nodeHidden[obj][id] = false;
        btParent[obj][id] = btParent[obj][id] || null;
        btChildren[obj][id] = btChildren[obj][id] || { left: null, right: null };
        return nv;
      }

      function emitShowIfPossiblyHidden(obj, id) {
        if (!id || !nodeVars[obj] || !nodeVars[obj][id]) {
          return;
        }
        if (!nodeHidden[obj] || !nodeHidden[obj][id]) {
          return;
        }
        lines.push(nodeVars[obj][id] + ".show({ recursive: false });");
        nodeHidden[obj][id] = false;
      }

      function refreshNode(obj, id) {
        var nv = ensureNode(obj, id);
        if (!nv) {
          return;
        }
        var m = nodeMeta[obj][id] || { value: "", note: "", color: "black" };
        lines.push(nv + ".value(" + q(getNodeText(m)) + ");");
        lines.push(nv + ".css(" + q(nodeStyle(m)) + ");");
      }

      function setRoot(obj, rid, nodeVarName) {
        var tv = ensureBTree(obj);
        var gv = btGhost[obj];
        if (!rid || !nodeVarName) {
          if (gv) {
            lines.push(tv + ".root(" + gv + ", { hide: false });");
            lines.push(gv + ".left(null, { hide: false });");
            lines.push(gv + ".right(null, { hide: false });");
            lines.push(gv + ".hide({ recursive: false });");
          }
          btRoot[obj] = null;
          return;
        }
        emitShowIfPossiblyHidden(obj, rid);
        lines.push(tv + ".root(" + nodeVarName + ", { hide: false });");
        if (gv) {
          lines.push(gv + ".hide({ recursive: false });");
        }
        btRoot[obj] = rid;
      }

      function detachChildRecord(obj, parentId, side) {
        if (!btChildren[obj] || !btChildren[obj][parentId]) {
          return;
        }
        var oldChild = btChildren[obj][parentId][side];
        if (oldChild && btParent[obj]) {
          btParent[obj][oldChild] = null;
        }
        btChildren[obj][parentId][side] = null;
      }

      function linkRecord(obj, parentId, side, childId) {
        btChildren[obj] = btChildren[obj] || {};
        btChildren[obj][parentId] = btChildren[obj][parentId] || { left: null, right: null };
        detachChildRecord(obj, parentId, side);
        btChildren[obj][parentId][side] = childId || null;
        if (childId) {
          btParent[obj] = btParent[obj] || {};
          btParent[obj][childId] = parentId;
        }
      }

      lines.push("var " + panelVar + " = document.createElement(\"div\");");
      lines.push(panelVar + ".className = \"dstrace-context-panel\";");
      lines.push("var " + titleVar + " = document.createElement(\"div\");");
      lines.push(titleVar + ".className = \"dstrace-context-title\";");
      lines.push(titleVar + ".textContent = " + q("Context: " + ctxName) + ";");
      lines.push("var " + bodyVar + " = document.createElement(\"div\");");
      lines.push(bodyVar + ".id = " + q(panelId) + ";");
      lines.push("var " + controlsVar + " = document.createElement(\"div\");");
      lines.push(controlsVar + ".className = \"jsavcontrols\";");
      lines.push("var " + counterVar + " = document.createElement(\"span\");");
      lines.push(counterVar + ".className = \"jsavcounter\";");
      lines.push("var __output_" + ctxToken + "_" + ctxIndex + " = document.createElement(\"p\");");
      lines.push("__output_" + ctxToken + "_" + ctxIndex + ".className = \"jsavoutput jsavline\";");
      lines.push(bodyVar + ".appendChild(" + controlsVar + ");");
      lines.push(bodyVar + ".appendChild(" + counterVar + ");");
      lines.push(bodyVar + ".appendChild(__output_" + ctxToken + "_" + ctxIndex + ");");
      lines.push(panelVar + ".appendChild(" + titleVar + ");");
      lines.push(panelVar + ".appendChild(" + bodyVar + ");");
      lines.push("__dstrace_host.appendChild(" + panelVar + ");");
      lines.push("var " + jsavVar + " = new JSAV(" + q(panelId) + ");");
      lines.push(jsavVar + ".displayInit();");
      lines.push("");

      for (var i = 0; i < ctxEvents.length; i++) {
        var evt = ctxEvents[i] || {};
        var ds = evt.ds;
        var op = evt.op;
        var obj = evt.obj || (ds === "btree" ? "T" : "A");
        var args = evt.args || {};
        pushEvtComment(evt, ctxName);

        if (ds === "array") {
          var av = ensureArray(obj, args.values || []);
          if (op === "init") {
            // no-op
          } else if (op === "focus") {
            var oldIdx = arrFocus[obj] || [];
            if (oldIdx.length > 0) {
              lines.push(av + ".css(" + q(oldIdx) + ", {\"outline\":\"\",\"outline-offset\":\"\"});");
            }
            var l = args.l || 0;
            var r = args.r || 0;
            var idx = [];
            for (var ai = l; ai < r; ai++) {
              idx.push(ai);
            }
            arrFocus[obj] = idx;
            if (idx.length > 0) {
              lines.push(av + ".css(" + q(idx) + ", {\"outline\":\"2px solid #2b8a3e\",\"outline-offset\":\"-2px\"});");
            }
          } else if (op === "swap") {
            lines.push(av + ".swap(" + q(args.i) + ", " + q(args.j) + ", { highlight: true });");
          } else if (op === "set") {
            lines.push(av + ".value(" + q(args.i) + ", " + q(args.v) + ");");
          } else if (op === "mark") {
            lines.push(av + ".highlight(" + q(args.indices || []) + ");");
          } else if (op === "unmark") {
            lines.push(av + ".unhighlight(" + q(args.indices || []) + ");");
          } else {
            lines.push("// unsupported array op: " + q(op));
          }
        } else if (ds === "btree") {
          var tv = ensureBTree(obj);
          if (op === "init") {
            // no-op
          } else if (op === "new_node") {
            var nid = args.id;
            if (nid) {
              nodeMeta[obj][nid] = nodeMeta[obj][nid] || { value: "", note: "", color: "black" };
              if (args.value !== undefined) {
                nodeMeta[obj][nid].value = args.value;
              }
              if (args.note !== undefined) {
                nodeMeta[obj][nid].note = args.note;
              }
              if (args.color !== undefined) {
                nodeMeta[obj][nid].color = args.color;
              }
              ensureNode(obj, nid);
              refreshNode(obj, nid);
            }
          } else if (op === "set_root") {
            var rid = args.id;
            if (!rid) {
              setRoot(obj, null, null);
            } else {
              var rnv = ensureNode(obj, rid);
              setRoot(obj, rid, rnv);
              btParent[obj][rid] = null;
              refreshNode(obj, rid);
            }
            lines.push(tv + ".layout();");
          } else if (op === "link") {
            var parentId = args.parent;
            var side = args.side;
            var childId = args.child;
            var pnv = ensureNode(obj, parentId);
            emitShowIfPossiblyHidden(obj, parentId);
            if (childId === null || childId === undefined) {
              lines.push(pnv + "." + side + "(null, { hide: false });");
              linkRecord(obj, parentId, side, null);
            } else {
              var cnv = ensureNode(obj, childId);
              if (btParent[obj][childId]) {
                lines.push(cnv + ".remove({ hide: false });");
                nodeHidden[obj][childId] = true;
              }
              emitShowIfPossiblyHidden(obj, childId);
              lines.push(pnv + "." + side + "(" + cnv + ", { hide: false });");
              linkRecord(obj, parentId, side, childId);
              refreshNode(obj, childId);
            }
            refreshNode(obj, parentId);
            lines.push(tv + ".layout();");
          } else if (op === "remove_node") {
            var rmId = args.id;
            if (rmId && nodeVars[obj] && nodeVars[obj][rmId]) {
              lines.push(nodeVars[obj][rmId] + ".left(null, { hide: false });");
              lines.push(nodeVars[obj][rmId] + ".right(null, { hide: false });");
              if (btRoot[obj] === rmId) {
                lines.push(nodeVars[obj][rmId] + ".hide({ recursive: false });");
              } else {
                lines.push(nodeVars[obj][rmId] + ".remove({ hide: false });");
              }
              nodeHidden[obj][rmId] = true;
              var parentId2 = btParent[obj][rmId];
              if (parentId2 && btChildren[obj][parentId2]) {
                if (btChildren[obj][parentId2].left === rmId) {
                  btChildren[obj][parentId2].left = null;
                }
                if (btChildren[obj][parentId2].right === rmId) {
                  btChildren[obj][parentId2].right = null;
                }
              }
              btParent[obj][rmId] = null;
              if (btRoot[obj] === rmId) {
                btRoot[obj] = null;
              }
            }
            lines.push(tv + ".layout();");
          } else if (op === "destroy_node") {
            var dstId = args.id;
            if (dstId && nodeVars[obj] && nodeVars[obj][dstId]) {
              lines.push(nodeVars[obj][dstId] + ".hide({ recursive: false });");
              delete nodeVars[obj][dstId];
              if (nodeMeta[obj]) {
                delete nodeMeta[obj][dstId];
              }
              if (nodeHidden[obj]) {
                delete nodeHidden[obj][dstId];
              }
              if (btParent[obj]) {
                delete btParent[obj][dstId];
              }
              if (btChildren[obj]) {
                delete btChildren[obj][dstId];
              }
            }
          } else if (op === "rotate_left") {
            var lp = args.pivot;
            var lpn = ensureNode(obj, lp);
            lines.push(lpn + ".rotateLeft();");
            lines.push(tv + ".layout();");
          } else if (op === "rotate_right") {
            var rp = args.pivot;
            var rpn = ensureNode(obj, rp);
            lines.push(rpn + ".rotateRight();");
            lines.push(tv + ".layout();");
          } else if (op === "set_note") {
            var noteId = args.id;
            if (noteId) {
              ensureNode(obj, noteId);
              nodeMeta[obj][noteId] = nodeMeta[obj][noteId] || { value: "", note: "", color: "black" };
              nodeMeta[obj][noteId].note = args.note || "";
              refreshNode(obj, noteId);
              lines.push(tv + ".layout();");
            }
          } else if (op === "set_color") {
            var colorId = args.id;
            if (colorId) {
              ensureNode(obj, colorId);
              nodeMeta[obj][colorId] = nodeMeta[obj][colorId] || { value: "", note: "", color: "black" };
              nodeMeta[obj][colorId].color = args.color || "black";
              refreshNode(obj, colorId);
            }
          } else if (op === "mark") {
            var ids = args.ids || [];
            for (var mi = 0; mi < ids.length; mi++) {
              var markId = ids[mi];
              ensureNode(obj, markId);
              lines.push(nodeVars[obj][markId] + ".css({outline:'3px solid #f59e0b','outline-offset':'3px'});");
            }
          } else if (op === "unmark") {
            var ids2 = args.ids || [];
            for (var umi = 0; umi < ids2.length; umi++) {
              var unmarkId = ids2[umi];
              ensureNode(obj, unmarkId);
              lines.push(nodeVars[obj][unmarkId] + ".css({outline:'','outline-offset':''});");
            }
          } else if (op === "sync") {
            var syncNodes = args.nodes || [];
            var syncRoot = args.root || null;
            for (var si2 = 0; si2 < syncNodes.length; si2++) {
              var sn = syncNodes[si2];
              ensureNode(obj, sn.id);
              nodeMeta[obj][sn.id] = nodeMeta[obj][sn.id] || { value: "", note: "", color: "black" };
              if (sn.value !== undefined) {
                nodeMeta[obj][sn.id].value = sn.value;
              }
              refreshNode(obj, sn.id);
            }

            for (var si3 = 0; si3 < syncNodes.length; si3++) {
              var sn2 = syncNodes[si3];
              btChildren[obj][sn2.id] = btChildren[obj][sn2.id] || { left: null, right: null };
              if (sn2.left) {
                ensureNode(obj, sn2.left);
                lines.push(nodeVars[obj][sn2.left] + ".remove({ hide: false });");
                nodeHidden[obj][sn2.left] = true;
                emitShowIfPossiblyHidden(obj, sn2.left);
                lines.push(nodeVars[obj][sn2.id] + ".left(" + nodeVars[obj][sn2.left] + ", { hide: false });");
                linkRecord(obj, sn2.id, "left", sn2.left);
              } else {
                lines.push(nodeVars[obj][sn2.id] + ".left(null, { hide: false });");
                linkRecord(obj, sn2.id, "left", null);
              }
              if (sn2.right) {
                ensureNode(obj, sn2.right);
                lines.push(nodeVars[obj][sn2.right] + ".remove({ hide: false });");
                nodeHidden[obj][sn2.right] = true;
                emitShowIfPossiblyHidden(obj, sn2.right);
                lines.push(nodeVars[obj][sn2.id] + ".right(" + nodeVars[obj][sn2.right] + ", { hide: false });");
                linkRecord(obj, sn2.id, "right", sn2.right);
              } else {
                lines.push(nodeVars[obj][sn2.id] + ".right(null, { hide: false });");
                linkRecord(obj, sn2.id, "right", null);
              }
            }

            if (syncRoot) {
              ensureNode(obj, syncRoot);
              setRoot(obj, syncRoot, nodeVars[obj][syncRoot]);
              btParent[obj][syncRoot] = null;
            } else {
              setRoot(obj, null, null);
            }
            lines.push(tv + ".layout();");
          } else {
            lines.push("// unsupported btree op: " + q(op));
          }
        } else {
          lines.push("// unsupported ds: " + q(ds) + ", op: " + q(op));
        }

        if (evt.step) {
          lines.push(jsavVar + ".step();");
        }
        lines.push("");
      }

      lines.push(jsavVar + ".recorded();");
      lines.push("");
    }

    for (var oi = 0; oi < order.length; oi++) {
      buildContext(order[oi], groups[order[oi]], oi);
    }

    return lines.join("\n");
  }

  function createContext(jsav, options, ctxName) {
    options = options || {};
    var debugEnabled = !!options.debugRuntimeApi;
    var jsavVarName = options.jsavVarName || "jsav";
    return {
      jsav: jsav,
      ctxName: ctxName || "default",
      arrays: {},
      arrayOrder: [],
      arrayLogicalLen: {},
      arrayFocusIndices: {},
      arrayMarkedIndices: {},
      arrayWriteIndices: {},
      btrees: {},
      btreeOrder: [],
      btreeNodes: {},
      btreeMeta: {},
      btreeGhost: {},
      btreeRootId: {},
      btreeHiddenState: {},
      btreeDetachedNodes: {},
      btreeMarkedIds: {},
      trees: {},
      treeOrder: [],
      treeNodes: {},
      treeMeta: {},
      treeGhost: {},
      treeRootId: {},
      treeHiddenState: {},
      treeDetachedNodes: {},
      treeMarkedIds: {},
      graphs: {},
      graphOrder: [],
      graphMeta: {},
      graphNodes: {},
      graphNodeVars: {},
      graphEdges: {},
      graphEdgeVars: {},
      graphNodeMarked: {},
      graphEdgeMarked: {},
      graphDirected: {},
      graphLayout: options.graphLayout || "auto_freeze",
      graphLayoutDone: {},
      graphStructureDirty: {},
      graphForceRelayout: {},
      states: {},
      stateOrder: [],
      stateFocusCells: {},
      stateHistory: {},
      stateSequences: {},
      stateLabels: {},
      strings: {},
      stringOrder: [],
      stringFocus: {},
      pendingGraphLayouts: {},
      pendingBTreeLayouts: {},
      pendingTreeLayouts: {},
      pendingStateLayouts: {},
      currentMessage: null,
      arrayFocusStyle: {
        outline: "2px solid #2b8a3e",
        "outline-offset": "-2px"
      },
      arrayFocusClearStyle: {
        outline: "",
        "outline-offset": ""
      },
      arrayWriteStyle: {
        outline: "3px solid #d94848",
        "outline-offset": "-2px",
        "background-color": "#fff1f2",
        "font-weight": "700"
      },
      arrayWriteClearStyle: {
        outline: "",
        "outline-offset": "",
        "background-color": "",
        "font-weight": ""
      },
      treeNodeFocusStyle: {
        outline: "3px solid #f59e0b",
        "outline-offset": "3px"
      },
      treeNodeFocusClearStyle: {
        outline: "",
        "outline-offset": ""
      },
      btreeColorMap: {
        red: "#d94848",
        black: "#2d3748"
      },
      treeColorMap: {
        red: "#d94848",
        black: "#2d3748"
      },
      graphNodeColorMap: {
        red: "#d94848",
        black: "#2d3748",
        blue: "#2563eb",
        green: "#16a34a",
        gray: "#64748b"
      },
      stateFocusStyles: {
        focus: { outline: "2px solid #2563eb", "outline-offset": "-2px" },
        read: { outline: "2px solid #64748b", "outline-offset": "-2px" },
        write: { outline: "2px solid #d94848", "outline-offset": "-2px" },
        candidate: { outline: "2px dashed #f59e0b", "outline-offset": "-2px" }
      },
      stateFocusClearStyle: {
        outline: "",
        "outline-offset": ""
      },
      debug: {
        enabled: debugEnabled,
        jsavVarName: jsavVarName,
        lines: [],
        names: (typeof WeakMap !== "undefined") ? new WeakMap() : null,
        callDepth: 0
      }
    };
  }

  function debugToken(s) {
    return String(s || "default").replace(/[^a-zA-Z0-9_]/g, "_");
  }

  function debugQ(v) {
    return JSON.stringify(v);
  }

  function debugBindName(ctx, obj, name) {
    if (!ctx || !ctx.debug || !ctx.debug.enabled || !ctx.debug.names || !obj) {
      return;
    }
    ctx.debug.names.set(obj, name);
  }

  function debugNameOf(ctx, obj, fallback) {
    if (ctx && ctx.debug && ctx.debug.enabled && ctx.debug.names && obj && ctx.debug.names.has(obj)) {
      return ctx.debug.names.get(obj);
    }
    if (typeof fallback !== "undefined") {
      return fallback;
    }
    return null;
  }

  function debugArg(ctx, v) {
    if (v === null) return "null";
    if (typeof v === "undefined") return "undefined";
    if (typeof v === "string") return debugQ(v);
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    if (Array.isArray(v)) return debugQ(v);
    if (typeof v === "object") {
      var n = debugNameOf(ctx, v, null);
      if (n) return n;
      return debugQ(v);
    }
    return String(v);
  }

  function debugPush(ctx, line) {
    if (!ctx || !ctx.debug || !ctx.debug.enabled) {
      return;
    }
    ctx.debug.lines.push(line);
  }

  function debugWrapMethod(ctx, target, method, fallbackName, retHook, shouldRecord) {
    if (!ctx || !ctx.debug || !ctx.debug.enabled || !target || typeof target[method] !== "function") {
      return;
    }
    var wrappedFlag = "__dsa_debug_wrapped_" + method;
    if (target[wrappedFlag]) {
      return;
    }
    var original = target[method];
    target[method] = function () {
      var args = Array.prototype.slice.call(arguments);
      var prevDepth = (ctx.debug && typeof ctx.debug.callDepth === "number") ? ctx.debug.callDepth : 0;
      if (ctx.debug) {
        ctx.debug.callDepth = prevDepth + 1;
      }
      var ret;
      try {
        ret = original.apply(this, args);
      } finally {
        if (ctx.debug) {
          ctx.debug.callDepth = prevDepth;
        }
      }
      var doRecord = (prevDepth === 0);
      if (doRecord && typeof shouldRecord === "function") {
        doRecord = !!shouldRecord(args, ret, this);
      }
      if (doRecord) {
        var tname = debugNameOf(ctx, this, fallbackName);
        var argv = [];
        for (var i = 0; i < args.length; i++) {
          argv.push(debugArg(ctx, args[i]));
        }
        debugPush(ctx, tname + "." + method + "(" + argv.join(", ") + ");");
      }
      if (retHook) {
        retHook(ret, args, this);
      }
      return ret;
    };
    target[wrappedFlag] = true;
  }

  function debugWrapArray(ctx, arr, arrName) {
    if (!ctx || !ctx.debug || !ctx.debug.enabled || !arr) {
      return;
    }
    debugBindName(ctx, arr, arrName);
    debugWrapMethod(ctx, arr, "css", arrName);
    debugWrapMethod(ctx, arr, "swap", arrName);
    debugWrapMethod(ctx, arr, "value", arrName, null, function (args) {
      return args.length > 1;
    });
    debugWrapMethod(ctx, arr, "highlight", arrName);
    debugWrapMethod(ctx, arr, "unhighlight", arrName);
    debugWrapMethod(ctx, arr, "hide", arrName);
    debugWrapMethod(ctx, arr, "show", arrName);
  }

  function debugWrapMatrix(ctx, matrix, matrixName) {
    if (!ctx || !ctx.debug || !ctx.debug.enabled || !matrix) {
      return;
    }
    debugBindName(ctx, matrix, matrixName);
    debugWrapMethod(ctx, matrix, "css", matrixName);
    debugWrapMethod(ctx, matrix, "value", matrixName, null, function (args) {
      return args.length > 2;
    });
    debugWrapMethod(ctx, matrix, "highlight", matrixName);
    debugWrapMethod(ctx, matrix, "unhighlight", matrixName);
    debugWrapMethod(ctx, matrix, "layout", matrixName);
    debugWrapMethod(ctx, matrix, "hide", matrixName);
    debugWrapMethod(ctx, matrix, "show", matrixName);
  }

  function debugWrapLabel(ctx, label, labelName) {
    if (!ctx || !ctx.debug || !ctx.debug.enabled || !label) {
      return;
    }
    debugBindName(ctx, label, labelName);
    debugWrapMethod(ctx, label, "css", labelName);
    debugWrapMethod(ctx, label, "text", labelName, null, function (args) {
      return args.length > 0;
    });
    debugWrapMethod(ctx, label, "value", labelName, null, function (args) {
      return args.length > 0;
    });
    debugWrapMethod(ctx, label, "hide", labelName);
    debugWrapMethod(ctx, label, "show", labelName);
  }

  function debugWrapNode(ctx, node, nodeName) {
    if (!ctx || !ctx.debug || !ctx.debug.enabled || !node) {
      return;
    }
    var existing = debugNameOf(ctx, node, null);
    debugBindName(ctx, node, nodeName || existing || ("node_" + debugToken(ctx.ctxName)));
    var fallback = debugNameOf(ctx, node, nodeName || "node");
    debugWrapMethod(ctx, node, "left", fallback, function (ret, args) {
      if (args && args.length === 0) {
        return;
      }
      if (ret && typeof ret === "object") {
        var n = debugNameOf(ctx, ret, null);
        if (!n) {
          debugBindName(ctx, ret, "node_" + debugToken(ctx.ctxName) + "_tmp");
        }
        debugWrapNode(ctx, ret, debugNameOf(ctx, ret, null));
      }
    }, function (args) {
      return args.length > 0;
    });
    debugWrapMethod(ctx, node, "right", fallback, function (ret, args) {
      if (args && args.length === 0) {
        return;
      }
      if (ret && typeof ret === "object") {
        var n = debugNameOf(ctx, ret, null);
        if (!n) {
          debugBindName(ctx, ret, "node_" + debugToken(ctx.ctxName) + "_tmp");
        }
        debugWrapNode(ctx, ret, debugNameOf(ctx, ret, null));
      }
    }, function (args) {
      return args.length > 0;
    });
    debugWrapMethod(ctx, node, "child", fallback, function (ret, args) {
      if (args && args.length === 0) {
        return;
      }
      if (ret && typeof ret === "object") {
        var n = debugNameOf(ctx, ret, null);
        if (!n) {
          debugBindName(ctx, ret, "node_" + debugToken(ctx.ctxName) + "_tmp");
        }
        debugWrapNode(ctx, ret, debugNameOf(ctx, ret, null));
      }
    }, function (args) {
      return args.length > 1;
    });
    debugWrapMethod(ctx, node, "addChild", fallback, function (ret) {
      if (ret && typeof ret === "object") {
        var n = debugNameOf(ctx, ret, null);
        if (!n) {
          debugBindName(ctx, ret, "node_" + debugToken(ctx.ctxName) + "_tmp");
        }
        debugWrapNode(ctx, ret, debugNameOf(ctx, ret, null));
      }
    }, function (args) {
      return args.length > 0;
    });
    debugWrapMethod(ctx, node, "parent", fallback, function () {
      return;
    }, function () {
      return false;
    });
    debugWrapMethod(ctx, node, "remove", fallback);
    debugWrapMethod(ctx, node, "show", fallback);
    debugWrapMethod(ctx, node, "hide", fallback);
    debugWrapMethod(ctx, node, "value", fallback, function (ret, args) {
      if (args && args.length === 0) {
        return;
      }
      if (ret && typeof ret === "object") {
        var n = debugNameOf(ctx, ret, null);
        if (!n) {
          debugBindName(ctx, ret, "node_" + debugToken(ctx.ctxName) + "_tmp");
        }
        debugWrapNode(ctx, ret, debugNameOf(ctx, ret, null));
      }
    }, function (args) {
      return args.length > 0;
    });
    debugWrapMethod(ctx, node, "css", fallback);
    debugWrapMethod(ctx, node, "highlight", fallback);
    debugWrapMethod(ctx, node, "unhighlight", fallback);
    debugWrapMethod(ctx, node, "rotateLeft", fallback);
    debugWrapMethod(ctx, node, "rotateRight", fallback);
  }

  function debugWrapTree(ctx, tree, treeName, ghostName) {
    if (!ctx || !ctx.debug || !ctx.debug.enabled || !tree) {
      return;
    }
    debugBindName(ctx, tree, treeName);
    debugWrapMethod(ctx, tree, "layout", treeName);
    debugWrapMethod(ctx, tree, "root", treeName, function (ret, args) {
      if (args && args.length === 0 && ret && typeof ret === "object") {
        var n = debugNameOf(ctx, ret, null);
        if (!n) {
          debugBindName(ctx, ret, ghostName || ("ghost_" + debugToken(ctx.ctxName)));
        }
        debugWrapNode(ctx, ret, debugNameOf(ctx, ret, null));
      }
    }, function (args) {
      return args.length > 0;
    });
  }

  function debugCall(ctx, target, fallbackName, method, args) {
    return target[method].apply(target, args || []);
  }

  function treeTopFromArrayCount(ctx) {
    var count = (ctx && ctx.arrayOrder && ctx.arrayOrder.length) ? ctx.arrayOrder.length : 0;
    return 20 + count * 90;
  }
  function graphTopFromArrayCount(ctx) {
    return treeTopFromArrayCount(ctx);
  }

  function ensureArray(ctx, objName, values) {
    if (ctx.arrays[objName]) {
      return ctx.arrays[objName];
    }
    var arrName = "arr_" + debugToken(ctx.ctxName + "__" + objName);
    var arrInit = {
      left: 20,
      top: 20 + ctx.arrayOrder.length * 90,
      indexed: true
    };
    var arr = ctx.jsav.ds.array(values || [], arrInit);
    debugPush(ctx, "var " + arrName + " = " + ctx.debug.jsavVarName + ".ds.array(" + debugQ(values || []) + ", " + debugQ(arrInit) + ");");
    ctx.arrays[objName] = arr;
    ctx.arrayOrder.push(objName);
    debugBindName(ctx, arr, arrName);
    debugWrapArray(ctx, arr, arrName);
    return arr;
  }

  function clearArrayFocus(ctx, arr, objName) {
    var old = ctx.arrayFocusIndices[objName];
    if (old && old.length > 0) {
      debugCall(ctx, arr, "arr_" + debugToken(ctx.ctxName + "__" + objName), "css", [old, ctx.arrayFocusClearStyle]);
    }
  }

  function setArrayFocus(ctx, arr, objName, l, r) {
    clearArrayFocus(ctx, arr, objName);
    var idx = [];
    for (var i = l; i < r; i++) {
      idx.push(i);
    }
    ctx.arrayFocusIndices[objName] = idx;
    if (idx.length > 0) {
      debugCall(ctx, arr, "arr_" + debugToken(ctx.ctxName + "__" + objName), "css", [idx, ctx.arrayFocusStyle]);
    }
  }

  function clearArrayWrite(ctx, arr, objName) {
    var old = ctx.arrayWriteIndices[objName] || [];
    if (old.length > 0) {
      debugCall(ctx, arr, "arr_" + debugToken(ctx.ctxName + "__" + objName), "css", [old, ctx.arrayWriteClearStyle]);
    }
    ctx.arrayWriteIndices[objName] = [];
  }

  function arrayValuesEqual(arr, values) {
    if (!arr || typeof arr.size !== "function" || typeof arr.value !== "function") {
      return false;
    }
    var target = values || [];
    if (arr.size() !== target.length) {
      return false;
    }
    for (var i = 0; i < target.length; i++) {
      if (arr.value(i) !== target[i]) {
        return false;
      }
    }
    return true;
  }

  function rebuildArrayObject(ctx, obj, values) {
    var normalized = [];
    values = values || [];
    for (var ni = 0; ni < values.length; ni++) {
      normalized.push((values[ni] === undefined || values[ni] === null) ? "" : values[ni]);
    }
    var oldArr = ctx.arrays[obj];
    var marks = ctx.arrayMarkedIndices[obj] || {};
    var focus = ctx.arrayFocusIndices[obj] || [];
    if (oldArr) {
      clearArrayFocus(ctx, oldArr, obj);
      if (typeof oldArr.hide === "function") {
        oldArr.hide();
      }
    }
    var idx = ctx.arrayOrder.indexOf(obj);
    if (idx < 0) {
      ctx.arrayOrder.push(obj);
      idx = ctx.arrayOrder.length - 1;
    }
    var arrName = "arr_" + debugToken(ctx.ctxName + "__" + obj + "__r" + (ctx.arrayRebuildSeq = (ctx.arrayRebuildSeq || 0) + 1));
    var arrInit = {
      left: 20,
      top: 20 + idx * 90,
      indexed: true
    };
    var arr = ctx.jsav.ds.array(normalized, arrInit);
    ctx.arrays[obj] = arr;
    ctx.arrayLogicalLen[obj] = normalized.length;
    debugPush(ctx, "var " + arrName + " = " + ctx.debug.jsavVarName + ".ds.array(" + debugQ(normalized) + ", " + debugQ(arrInit) + ");");
    debugBindName(ctx, arr, arrName);
    debugWrapArray(ctx, arr, arrName);
    if (focus.length > 0) {
      var nextFocus = [];
      for (var fi = 0; fi < focus.length; fi++) {
        if (focus[fi] >= 0 && focus[fi] < normalized.length) {
          nextFocus.push(focus[fi]);
        }
      }
      ctx.arrayFocusIndices[obj] = nextFocus;
      if (nextFocus.length > 0) {
        arr.css(nextFocus, ctx.arrayFocusStyle);
      }
    }
    ctx.arrayWriteIndices[obj] = [];
    var marked = Object.keys(marks);
    for (var mi = 0; mi < marked.length; mi++) {
      var markIndex = parseInt(marked[mi], 10);
      if (markIndex >= 0 && markIndex < normalized.length) {
        arr.highlight([markIndex]);
      } else {
        delete marks[marked[mi]];
      }
    }
    return arr;
  }

  var arrayOpHandlers = {
    init: function (ctx, evt) {
      var obj = evt.obj || "A";
      var args = evt.args || {};
      var initValues = args.values || [];
      ensureArray(ctx, obj, initValues);
      ctx.arrayLogicalLen[obj] = initValues.length;
      if (!ctx.arrayMarkedIndices[obj]) {
        ctx.arrayMarkedIndices[obj] = {};
      }
    },
    focus: function (ctx, evt) {
      var obj = evt.obj || "A";
      var args = evt.args || {};
      var arr = ensureArray(ctx, obj, []);
      setArrayFocus(ctx, arr, obj, args.l || 0, args.r || 0);
    },
    swap: function (ctx, evt) {
      var obj = evt.obj || "A";
      var args = evt.args || {};
      var arr = ensureArray(ctx, obj, []);
      var i = Number(args.i), j = Number(args.j);
      var logicalLen = (typeof ctx.arrayLogicalLen[obj] === "number") ? ctx.arrayLogicalLen[obj] : ((typeof arr.size === "function") ? arr.size() : 0);
      if (!Number.isInteger(i) || !Number.isInteger(j)) {
        throw new Error("[DSA_TRACE] array.swap non-integer index: ctx=" + ctx.ctxName + ", obj=" + obj +
          ", seq=" + (((evt || {}).seq !== undefined) ? evt.seq : "n/a") +
          ", i=" + args.i + ", j=" + args.j + ", logicalLen=" + logicalLen);
      }
      if (i < 0 || j < 0 || i >= logicalLen || j >= logicalLen) {
        throw new Error("[DSA_TRACE] array.swap out of logical range: ctx=" + ctx.ctxName + ", obj=" + obj +
          ", seq=" + (((evt || {}).seq !== undefined) ? evt.seq : "n/a") +
          ", i=" + i + ", j=" + j + ", logicalLen=" + logicalLen);
      }
      var n = (typeof arr.size === "function") ? arr.size() : 0;
      var hasRealDomArray = !!(arr && arr.element && typeof arr.element.find === "function");
      if (hasRealDomArray && (i >= n || j >= n)) {
        throw new Error("[DSA_TRACE] array.swap out of physical range: ctx=" + ctx.ctxName + ", obj=" + obj +
          ", seq=" + (((evt || {}).seq !== undefined) ? evt.seq : "n/a") +
          ", i=" + i + ", j=" + j + ", physicalSize=" + n + ", logicalLen=" + logicalLen);
      }
      if (hasRealDomArray) {
        var $li1 = arr.element.find("li:eq(" + i + ")");
        var $li2 = arr.element.find("li:eq(" + j + ")");
        if ($li1.length === 0 || $li2.length === 0) {
          throw new Error("[DSA_TRACE] array.swap li missing: ctx=" + ctx.ctxName + ", obj=" + obj +
            ", seq=" + (((evt || {}).seq !== undefined) ? evt.seq : "n/a") +
            ", i=" + i + ", j=" + j + ", physicalSize=" + n + ", logicalLen=" + logicalLen);
        }
      }
      arr.swap(i, j, { highlight: true });
    },
    set: function (ctx, evt) {
      var obj = evt.obj || "A";
      var args = evt.args || {};
      var arr = ensureArray(ctx, obj, []);
      var idx = Number(args.i);
      if (!Number.isNaN(idx)) {
        clearArrayWrite(ctx, arr, obj);
        debugCall(ctx, arr, "arr_" + debugToken(ctx.ctxName + "__" + obj), "css", [[idx], ctx.arrayWriteStyle]);
      }
      arr.value(idx, (args.v === undefined || args.v === null) ? "" : args.v);
      if (!Number.isNaN(idx)) {
        var nextLen = idx + 1;
        var currLen = (typeof ctx.arrayLogicalLen[obj] === "number") ? ctx.arrayLogicalLen[obj] : 0;
        if (nextLen > currLen) {
          ctx.arrayLogicalLen[obj] = nextLen;
        }
        ctx.arrayWriteIndices[obj] = [idx];
      }
    },
    sync: function (ctx, evt) {
      var obj = evt.obj || "A";
      var args = evt.args || {};
      var values = args.values || [];
      var arr = ensureArray(ctx, obj, []);
      var marks = ctx.arrayMarkedIndices[obj] || {};
      var focus = ctx.arrayFocusIndices[obj] || [];
      var normalized = [];
      for (var ni = 0; ni < values.length; ni++) {
        normalized.push((values[ni] === undefined || values[ni] === null) ? "" : values[ni]);
      }
      ctx.arrayLogicalLen[obj] = values.length;
      var currSize = (typeof arr.size === "function") ? arr.size() : 0;
      var needRecreate = (currSize !== normalized.length);
      if (!needRecreate && arr && arrayValuesEqual(arr, normalized)) {
        return;
      }
      clearArrayFocus(ctx, arr, obj);
      if (needRecreate) {
        if (typeof arr.hide === "function") {
          arr.hide();
        }
        var idx = ctx.arrayOrder.indexOf(obj);
        if (idx < 0) {
          ctx.arrayOrder.push(obj);
          idx = ctx.arrayOrder.length - 1;
        }
        var arrName = "arr_" + debugToken(ctx.ctxName + "__" + obj);
        var arrInit = {
          left: 20,
          top: 20 + idx * 90,
          indexed: true
        };
        arr = ctx.jsav.ds.array(normalized, arrInit);
        ctx.arrays[obj] = arr;
        debugPush(ctx, arrName + " = " + ctx.debug.jsavVarName + ".ds.array(" + debugQ(normalized) + ", " + debugQ(arrInit) + ");");
        debugBindName(ctx, arr, arrName);
        debugWrapArray(ctx, arr, arrName);
      } else {
        for (var vi = 0; vi < normalized.length; vi++) {
          if (arr.value(vi) !== normalized[vi]) {
            arr.value(vi, normalized[vi]);
          }
        }
      }
      if (focus.length > 0) {
        arr.css(focus, ctx.arrayFocusStyle);
      }
      var marked = Object.keys(marks);
      for (var i = 0; i < marked.length; i++) {
        var mi = parseInt(marked[i], 10);
        if (mi >= 0 && mi < values.length) {
          arr.highlight([mi]);
        } else {
          arr.unhighlight([mi]);
          delete marks[marked[i]];
        }
      }
    },
    rebuild: function (ctx, evt) {
      var obj = evt.obj || "A";
      var args = evt.args || {};
      rebuildArrayObject(ctx, obj, args.values || []);
    },
    mark: function (ctx, evt) {
      var obj = evt.obj || "A";
      var args = evt.args || {};
      var arr = ensureArray(ctx, obj, []);
      var indices = args.indices || [];
      arr.highlight(indices);
      if (!ctx.arrayMarkedIndices[obj]) {
        ctx.arrayMarkedIndices[obj] = {};
      }
      for (var i = 0; i < indices.length; i++) {
        ctx.arrayMarkedIndices[obj][String(indices[i])] = true;
      }
    },
    unmark: function (ctx, evt) {
      var obj = evt.obj || "A";
      var args = evt.args || {};
      var arr = ensureArray(ctx, obj, []);
      var indices = args.indices || [];
      arr.unhighlight(indices);
      if (!ctx.arrayMarkedIndices[obj]) {
        ctx.arrayMarkedIndices[obj] = {};
      }
      for (var i = 0; i < indices.length; i++) {
        delete ctx.arrayMarkedIndices[obj][String(indices[i])];
      }
    }
  };

  function stringChars(s) {
    s = (s === undefined || s === null) ? "" : String(s);
    var out = [];
    for (var i = 0; i < s.length; i++) {
      out.push(s.charAt(i));
    }
    return out;
  }

  function ensureStringVis(ctx, objName, text, pattern, mode) {
    if (ctx.strings[objName]) {
      return ctx.strings[objName];
    }
    var idx = ctx.stringOrder.indexOf(objName);
    if (idx < 0) {
      ctx.stringOrder.push(objName);
      idx = ctx.stringOrder.length - 1;
    }
    text = (text === undefined || text === null) ? "" : String(text);
    pattern = (pattern === undefined || pattern === null) ? "" : String(pattern);
    mode = mode || "match";
    var patternOnly = mode === "pattern";
    var selfCompare = mode === "self";
    var left = 20;
    var top = stateTopFromArrayCount(ctx) + 230 + idx * (patternOnly ? 110 : 190);
    var patternGap = patternOnly ? 0 : 92;
    var prefix = "str_" + debugToken(ctx.ctxName + "__" + objName);
    var title = makeStateLabel(ctx, prefix + "_title", objName + ((patternOnly || selfCompare) ? " pattern preprocessing" : " string matching"), {
      left: left,
      top: top - 28
    }, {
      "font-weight": "700",
      "font-size": "14px",
      "color": "#334155"
    });
    var textLabel = null;
    if (!patternOnly) {
      textLabel = makeStateLabel(ctx, prefix + "_text_label", selfCompare ? "PATTERN" : "TEXT", {
        left: left,
        top: top + 8
      }, {
        "font-size": "12px",
        "color": "#64748b"
      });
    }
    var patternLabel = makeStateLabel(ctx, prefix + "_pattern_label", selfCompare ? "PREFIX CANDIDATE" : "PATTERN", {
      left: left,
      top: top + patternGap + 8
    }, {
      "font-size": "12px",
      "color": "#64748b"
    });
    var textInit = { left: left + 78, top: top, indexed: true };
    var patternInit = { left: left + 78, top: top + patternGap, indexed: true };
    var textValues = selfCompare ? stringChars(pattern) : stringChars(text);
    var textArr = patternOnly ? null : ctx.jsav.ds.array(textValues, textInit);
    var patternArr = ctx.jsav.ds.array(stringChars(pattern), patternInit);
    var textName = prefix + "_text";
    var patternName = prefix + "_pattern";
    if (!patternOnly) {
      debugPush(ctx, "var " + textName + " = " + ctx.debug.jsavVarName + ".ds.array(" + debugQ(textValues) + ", " + debugQ(textInit) + ");");
      debugWrapArray(ctx, textArr, textName);
    }
    debugPush(ctx, "var " + patternName + " = " + ctx.debug.jsavVarName + ".ds.array(" + debugQ(stringChars(pattern)) + ", " + debugQ(patternInit) + ");");
    debugWrapArray(ctx, patternArr, patternName);
    ctx.strings[objName] = {
      mode: mode,
      text: text,
      pattern: pattern,
      shift: 0,
      left: left,
      top: top,
      patternGap: patternGap,
      title: title,
      textLabel: textLabel,
      patternLabel: patternLabel,
      textArr: textArr,
      patternArr: patternArr,
      patternVersion: 0
    };
    ctx.stringFocus[objName] = { text: [], pattern: [] };
    return ctx.strings[objName];
  }

  function clearStringFocus(ctx, objName) {
    var rec = ctx.strings[objName];
    if (!rec) {
      return;
    }
    var focus = ctx.stringFocus[objName] || { text: [], pattern: [] };
    if (rec.textArr && focus.text && focus.text.length) {
      rec.textArr.css(focus.text, ctx.arrayFocusClearStyle);
      rec.textArr.unhighlight(focus.text);
    }
    if (rec.patternArr && focus.pattern && focus.pattern.length) {
      rec.patternArr.css(focus.pattern, ctx.arrayFocusClearStyle);
      rec.patternArr.unhighlight(focus.pattern);
    }
    ctx.stringFocus[objName] = { text: [], pattern: [] };
  }

  function rebuildPatternAlignment(ctx, objName, shift) {
    var rec = ctx.strings[objName];
    if (!rec) {
      return;
    }
    shift = Math.max(0, Number(shift) || 0);
    rec.shift = shift;
    if (rec.patternArr && typeof rec.patternArr.hide === "function") {
      rec.patternArr.hide();
    }
    var values = [];
    for (var i = 0; i < shift; i++) {
      values.push("");
    }
    var chars = stringChars(rec.pattern);
    for (var j = 0; j < chars.length; j++) {
      values.push(chars[j]);
    }
    var init = { left: rec.left + 78, top: rec.top + (rec.patternGap || 0), indexed: true };
    rec.patternVersion += 1;
    var patternName = "str_" + debugToken(ctx.ctxName + "__" + objName) + "_pattern_" + rec.patternVersion;
    rec.patternArr = ctx.jsav.ds.array(values, init);
    debugPush(ctx, "var " + patternName + " = " + ctx.debug.jsavVarName + ".ds.array(" + debugQ(values) + ", " + debugQ(init) + ");");
    debugWrapArray(ctx, rec.patternArr, patternName);
    ctx.stringFocus[objName] = { text: [], pattern: [] };
  }

  function stringPatternVisualIndex(rec, j) {
    return (Number(rec.shift) || 0) + (Number(j) || 0);
  }

  var stringOpHandlers = {
    init: function (ctx, evt) {
      var obj = evt.obj || "STR";
      var args = evt.args || {};
      ensureStringVis(ctx, obj, args.text || "", args.pattern || "", args.mode || "match");
    },
    align: function (ctx, evt) {
      var obj = evt.obj || "STR";
      var args = evt.args || {};
      var rec = ensureStringVis(ctx, obj, "", "");
      clearStringFocus(ctx, obj);
      rebuildPatternAlignment(ctx, obj, Number(args.shift) || 0);
    },
    compare: function (ctx, evt) {
      var obj = evt.obj || "STR";
      var args = evt.args || {};
    var rec = ensureStringVis(ctx, obj, "", "");
      clearStringFocus(ctx, obj);
      var i = Number(args.i);
      var j = Number(args.j);
      if (!Number.isInteger(i) || !Number.isInteger(j) || i < 0 || j < 0) {
        return;
      }
      if (rec.mode === "self") {
        rebuildPatternAlignment(ctx, obj, i - j);
        rec = ctx.strings[obj];
      }
      var pidx = stringPatternVisualIndex(rec, j);
      var style = args.match ? {
        outline: "2px solid #16a34a",
        "outline-offset": "-2px"
      } : {
        outline: "2px solid #d94848",
        "outline-offset": "-2px"
      };
      if (rec.mode === "pattern") {
        rec.patternArr.css([i, pidx], style);
        ctx.stringFocus[obj] = { text: [], pattern: [i, pidx] };
      } else if (rec.mode === "self") {
        rec.textArr.css([i], style);
        rec.patternArr.css([pidx], style);
        ctx.stringFocus[obj] = { text: [i], pattern: [pidx] };
      } else {
        rec.textArr.css([i], style);
        rec.patternArr.css([pidx], style);
        ctx.stringFocus[obj] = { text: [i], pattern: [pidx] };
      }
    },
    fallback: function (ctx, evt) {
      var obj = evt.obj || "STR";
      var args = evt.args || {};
      var rec = ensureStringVis(ctx, obj, "", "");
      clearStringFocus(ctx, obj);
      var from = Number(args.from);
      var to = Number(args.to);
      var indices = [];
      if (rec.mode === "pattern") {
        if (Number.isInteger(from) && from >= 0) {
          indices.push(from);
        }
        if (Number.isInteger(to) && to >= 0) {
          indices.push(to);
        }
      } else {
        if (Number.isInteger(from) && from >= 0) {
        indices.push(stringPatternVisualIndex(rec, from));
        }
        if (Number.isInteger(to) && to >= 0) {
          indices.push(stringPatternVisualIndex(rec, to));
        }
      }
      if (indices.length) {
        rec.patternArr.css(indices, ctx.stateFocusStyles.candidate);
      }
      ctx.stringFocus[obj] = { text: [], pattern: indices };
    },
    accept: function (ctx, evt) {
      var obj = evt.obj || "STR";
      var args = evt.args || {};
      var rec = ensureStringVis(ctx, obj, "", "");
      clearStringFocus(ctx, obj);
      var start = Number(args.start);
      var length = Number(args.length);
      if (!Number.isInteger(start) || !Number.isInteger(length) || start < 0 || length <= 0) {
        return;
      }
      var textIndices = [];
      var patternIndices = [];
      for (var i = 0; i < length; i++) {
        textIndices.push(start + i);
        patternIndices.push((Number(rec.shift) || 0) + i);
      }
      rec.textArr.highlight(textIndices);
      rec.patternArr.highlight(patternIndices);
      ctx.stringFocus[obj] = { text: textIndices, pattern: patternIndices };
    },
    clear: function (ctx, evt) {
      var obj = evt.obj || "STR";
      var rec = ctx.strings[obj];
      clearStringFocus(ctx, obj);
      if (!rec) {
        return;
      }
      var pieces = [rec.title, rec.textLabel, rec.patternLabel, rec.textArr, rec.patternArr];
      for (var i = 0; i < pieces.length; i++) {
        if (pieces[i] && typeof pieces[i].hide === "function") {
          pieces[i].hide();
        }
      }
    }
  };

  var dsHandlers = {
    array: function (ctx, evt) {
      var op = evt && evt.op;
      var opHandler = arrayOpHandlers[op];
      if (opHandler) {
        opHandler(ctx, evt);
      }
    },
    btree: function (ctx, evt) {
      var op = evt && evt.op;
      var opHandler = btreeOpHandlers[op];
      if (opHandler) {
        opHandler(ctx, evt);
      }
    },
    tree: function (ctx, evt) {
      var op = evt && evt.op;
      var opHandler = treeOpHandlers[op];
      if (opHandler) {
        opHandler(ctx, evt);
      }
    },
    graph: function (ctx, evt) {
      var op = evt && evt.op;
      var opHandler = graphOpHandlers[op];
      if (opHandler) {
        opHandler(ctx, evt);
      }
    },
    state: function (ctx, evt) {
      var op = evt && evt.op;
      var opHandler = stateOpHandlers[op];
      if (opHandler) {
        opHandler(ctx, evt);
      }
    },
    string: function (ctx, evt) {
      var op = evt && evt.op;
      var opHandler = stringOpHandlers[op];
      if (opHandler) {
        opHandler(ctx, evt);
      }
    },
    meta: function (ctx, evt) {
      var op = evt && evt.op;
      if (op === "msg") {
        var args = evt.args || {};
        var messageText = (args.text !== undefined && args.text !== null) ? String(args.text) : "";
        var messageOptions = {};
        if (args.kind !== undefined) {
          messageOptions.kind = args.kind;
        }
        if (args.phase !== undefined) {
          messageOptions.phase = args.phase;
        }
        if (args.refs !== undefined) {
          messageOptions.refs = args.refs;
        }
        if (args.options && typeof args.options === "object") {
          messageOptions.options = {};
          for (var mk in args.options) {
            if (Object.prototype.hasOwnProperty.call(args.options, mk)) {
              messageOptions.options[mk] = args.options[mk];
            }
          }
        }
        ctx.currentMessage = {
          text: messageText,
          clear: !!args.clear,
          kind: args.kind || "",
          phase: args.phase || "",
          refs: args.refs || null,
          options: messageOptions.options || null,
          seq: (typeof evt.seq === "number") ? evt.seq : null
        };
        if (args.clear && typeof ctx.jsav.clearumsg === "function") {
          ctx.jsav.clearumsg();
          debugPush(ctx, ctx.debug.jsavVarName + ".clearumsg();");
        }
        if (args.text !== undefined && args.text !== null) {
          var umsgOpts = {};
          var optKeys = ["color", "fill", "preserve"];
          for (var ki = 0; ki < optKeys.length; ki++) {
            var key = optKeys[ki];
            if (args[key] !== undefined) {
              umsgOpts[key] = args[key];
            }
          }
          if (args.options && typeof args.options === "object") {
            for (var k in args.options) {
              if (Object.prototype.hasOwnProperty.call(args.options, k)) {
                umsgOpts[k] = args.options[k];
              }
            }
          }
          if (args.kind !== undefined) {
            umsgOpts.kind = args.kind;
          }
          if (args.phase !== undefined) {
            umsgOpts.phase = args.phase;
          }
          if (args.refs !== undefined) {
            umsgOpts.refs = args.refs;
          }
          if (Object.keys(umsgOpts).length > 0) {
            ctx.jsav.umsg(String(args.text), umsgOpts);
            debugPush(ctx, ctx.debug.jsavVarName + ".umsg(" + debugQ(String(args.text)) + ", " + debugQ(umsgOpts) + ");");
          } else {
            ctx.jsav.umsg(String(args.text));
            debugPush(ctx, ctx.debug.jsavVarName + ".umsg(" + debugQ(String(args.text)) + ");");
          }
        }
      }
    }
  };

  function ensureBTree(ctx, objName) {
    if (ctx.btrees[objName]) {
      return ctx.btrees[objName];
    }
    var treeName = "bt_" + debugToken(ctx.ctxName + "__" + objName);
    var ghostName = "ghost_" + debugToken(ctx.ctxName + "__" + objName);
    var treeInit = {
      left: 20 + ctx.btreeOrder.length * 460,
      top: treeTopFromArrayCount(ctx),
      center: false
    };
    var tree = ctx.jsav.ds.binarytree(treeInit);
    debugPush(ctx, "var " + treeName + " = " + ctx.debug.jsavVarName + ".ds.binarytree(" + debugQ(treeInit) + ");");
    debugBindName(ctx, tree, treeName);
    debugWrapTree(ctx, tree, treeName, ghostName);
    ctx.btrees[objName] = tree;
    ctx.btreeOrder.push(objName);
    if (!ctx.btreeNodes[objName]) {
      ctx.btreeNodes[objName] = {};
    }
    if (!ctx.btreeMeta[objName]) {
      ctx.btreeMeta[objName] = {};
    }
    if (!ctx.btreeHiddenState[objName]) {
      ctx.btreeHiddenState[objName] = {};
    }
    if (!ctx.btreeDetachedNodes[objName]) {
      ctx.btreeDetachedNodes[objName] = {};
    }
    if (!ctx.btreeMarkedIds[objName]) {
      ctx.btreeMarkedIds[objName] = {};
    }
    if (!ctx.btreeGhost[objName]) {
      var ghost = tree.root();
      debugPush(ctx, "var " + ghostName + " = " + treeName + ".root();");
      debugBindName(ctx, ghost, ghostName);
      debugWrapNode(ctx, ghost, ghostName);
      if (ghost) {
        if (typeof ghost.left === "function") {
          ghost.left(null, { hide: false });
        }
        if (typeof ghost.right === "function") {
          ghost.right(null, { hide: false });
        }
        if (typeof ghost.hide === "function") {
          ghost.hide({ recursive: false });
        }
      }
      ctx.btreeGhost[objName] = ghost || null;
    }
    if (typeof ctx.btreeRootId[objName] === "undefined") {
      ctx.btreeRootId[objName] = null;
    }
    return tree;
  }

  function hideGhostNode(ctx, objName) {
    var ghost = ctx.btreeGhost[objName];
    if (!ghost) {
      return;
    }
    if (typeof ghost.hide === "function") {
      ghost.hide({ recursive: false });
    }
  }

  function setTreeRootNode(ctx, objName, rootId, rootNode) {
    ensureBTree(ctx, objName);
    var ghost = ctx.btreeGhost[objName];
    if (!rootId || !rootNode) {
      if (ghost) {
        if (typeof ghost.left === "function") {
          debugCall(ctx, ghost, debugNameOf(ctx, ghost, "ghost_" + debugToken(ctx.ctxName + "__" + objName)), "left", [null, { hide: false }]);
        }
        if (typeof ghost.right === "function") {
          debugCall(ctx, ghost, debugNameOf(ctx, ghost, "ghost_" + debugToken(ctx.ctxName + "__" + objName)), "right", [null, { hide: false }]);
        }
        hideGhostNode(ctx, objName);
      }
      ctx.btreeRootId[objName] = null;
      return;
    }
    showNodeIfHidden(ctx, objName, rootId);
    if (ghost && typeof ghost.left === "function") {
      debugCall(ctx, ghost, debugNameOf(ctx, ghost, "ghost_" + debugToken(ctx.ctxName + "__" + objName)), "left", [rootNode, { hide: false }]);
    }
    if (ghost && typeof ghost.right === "function") {
      debugCall(ctx, ghost, debugNameOf(ctx, ghost, "ghost_" + debugToken(ctx.ctxName + "__" + objName)), "right", [null, { hide: false }]);
    }
    hideGhostNode(ctx, objName);
    ctx.btreeRootId[objName] = rootId;
  }

  function nodeText(meta) {
    var value = meta && meta.value !== undefined && meta.value !== null ? String(meta.value) : "";
    var note = meta && meta.note ? String(meta.note) : "";
    return note ? (value + "\n" + note) : value;
  }

  function getMeta(ctx, objName, id) {
    if (!ctx.btreeMeta[objName]) {
      ctx.btreeMeta[objName] = {};
    }
    if (!ctx.btreeMeta[objName][id]) {
      ctx.btreeMeta[objName][id] = { value: "", note: "", color: "black" };
    }
    return ctx.btreeMeta[objName][id];
  }

  function applyNodeStyle(ctx, node, meta) {
    if (!node || !meta) {
      return;
    }
    var colorKey = meta.color || "black";
    var bg = ctx.btreeColorMap[colorKey] || ctx.btreeColorMap.black;
    node.css({
      "background-color": bg,
      "color": "#ffffff",
      "white-space": "pre-line"
    });
  }

  function focusTreeLikeNode(ctx, node) {
    if (node && typeof node.css === "function") {
      node.css(ctx.treeNodeFocusStyle);
    }
  }

  function unfocusTreeLikeNode(ctx, node) {
    if (node && typeof node.css === "function") {
      node.css(ctx.treeNodeFocusClearStyle);
    }
  }

  function rebuildBTreeNodeMap(ctx, objName) {
    var tree = ctx.btrees[objName];
    if (!tree) {
      return;
    }
    var oldMap = ctx.btreeNodes[objName] || {};
    var newMap = {};
    var used = {};
    function walk(node) {
      if (!node) {
        return;
      }
      var val = String(node.value() || "");
      var foundId = null;
      for (var id in oldMap) {
        if (!Object.prototype.hasOwnProperty.call(oldMap, id)) {
          continue;
        }
        if (used[id]) {
          continue;
        }
        var m = getMeta(ctx, objName, id);
        if (nodeText(m) === val) {
          foundId = id;
          break;
        }
      }
      if (foundId) {
        used[foundId] = true;
        newMap[foundId] = node;
        applyNodeStyle(ctx, node, getMeta(ctx, objName, foundId));
      }
      walk(node.left());
      walk(node.right());
    }
    var ghost = ctx.btreeGhost[objName];
    var logicalRoot = (ghost && typeof ghost.left === "function") ? ghost.left() : null;
    walk(logicalRoot);
    ctx.btreeNodes[objName] = newMap;
  }

  function ensureVisualNode(ctx, objName, id) {
    var map = ctx.btreeNodes[objName] || {};
    if (map[id]) {
      return map[id];
    }
    var tree = ensureBTree(ctx, objName);
    var meta = getMeta(ctx, objName, id);
    var nodeName = "node_" + debugToken(ctx.ctxName + "__" + objName + "__" + id);
    var node = tree.newNode(nodeText(meta));
    debugPush(ctx, "var " + nodeName + " = " + debugNameOf(ctx, tree, "bt_" + debugToken(ctx.ctxName + "__" + objName)) + ".newNode(" + debugQ(nodeText(meta)) + ");");
    debugWrapNode(ctx, node, nodeName);
    applyNodeStyle(ctx, node, meta);
    map[id] = node;
    ctx.btreeNodes[objName] = map;
    if (!ctx.btreeHiddenState[objName]) {
      ctx.btreeHiddenState[objName] = {};
    }
    if (!ctx.btreeDetachedNodes[objName]) {
      ctx.btreeDetachedNodes[objName] = {};
    }
    ctx.btreeHiddenState[objName][id] = false;
    return node;
  }

  function showNodeIfHidden(ctx, objName, id) {
    if (!id) {
      return;
    }
    var hiddenMap = ctx.btreeHiddenState[objName] || {};
    if (!hiddenMap[id]) {
      return;
    }
    var map = ctx.btreeNodes[objName] || {};
    var node = map[id];
    if (!node) {
      return;
    }
    if (typeof node.show === "function") {
      node.show({ recursive: false });
    }
    hiddenMap[id] = false;
  }

  function updateNodeValueAndStyle(ctx, objName, id) {
    var map = ctx.btreeNodes[objName] || {};
    var node = map[id];
    if (!node) {
      return;
    }
    var meta = getMeta(ctx, objName, id);
    node.value(nodeText(meta));
    applyNodeStyle(ctx, node, meta);
  }

  function stashDetachedNode(ctx, objName, id, node) {
    if (!id || !node) {
      return;
    }
    if (!ctx.btreeDetachedNodes[objName]) {
      ctx.btreeDetachedNodes[objName] = {};
    }
    ctx.btreeDetachedNodes[objName][id] = node;
  }

  function btreeParentSide(node) {
    if (!node || typeof node.parent !== "function") {
      return { parent: null, side: null };
    }
    var p = node.parent();
    if (!p) {
      return { parent: null, side: null };
    }
    if (typeof p.left === "function" && p.left() === node) {
      return { parent: p, side: "left" };
    }
    if (typeof p.right === "function" && p.right() === node) {
      return { parent: p, side: "right" };
    }
    return { parent: p, side: null };
  }

  function btreeAttach(ctx, objName, parent, side, child) {
    if (!parent || (side !== "left" && side !== "right")) {
      return;
    }
    if (side === "left") {
      parent.left(child || null, { hide: false });
    } else {
      parent.right(child || null, { hide: false });
    }
    if (child) {
      var id = findBTreeNodeIdByNode(ctx, objName, child);
      if (id) {
        ctx.btreeHiddenState[objName][id] = false;
      }
    }
  }

  function findBTreeNodeIdByNode(ctx, objName, ref) {
    var map = ctx.btreeNodes[objName] || {};
    var ids = Object.keys(map);
    for (var i = 0; i < ids.length; i++) {
      if (map[ids[i]] === ref) {
        return ids[i];
      }
    }
    return null;
  }

  function syncBTreeRootIdFromGhost(ctx, objName) {
    var ghost = ctx.btreeGhost[objName];
    var logicalRoot = (ghost && typeof ghost.left === "function") ? ghost.left() : null;
    ctx.btreeRootId[objName] = logicalRoot ? findBTreeNodeIdByNode(ctx, objName, logicalRoot) : null;
    return ctx.btreeRootId[objName];
  }

  function swapBTreeTopology(ctx, objName, aId, bId) {
    if (!aId || !bId || aId === bId) {
      return;
    }
    ensureBTree(ctx, objName);
    var map = ctx.btreeNodes[objName] || {};
    var a = map[aId];
    var b = map[bId];
      if (!a || !b) {
      return;
    }
    syncBTreeRootIdFromGhost(ctx, objName);
    showNodeIfHidden(ctx, objName, aId);
    showNodeIfHidden(ctx, objName, bId);
    var ghost = ctx.btreeGhost[objName];
    var aRel = btreeParentSide(a);
    var bRel = btreeParentSide(b);
    var aLeft = (typeof a.left === "function") ? a.left() : null;
    var aRight = (typeof a.right === "function") ? a.right() : null;
    var bLeft = (typeof b.left === "function") ? b.left() : null;
    var bRight = (typeof b.right === "function") ? b.right() : null;

    if (aRel.parent === b) {
      var aChildSide = aRel.side;
      var bOtherSide = aChildSide === "left" ? "right" : "left";
      if (bRel.parent) {
        btreeAttach(ctx, objName, bRel.parent, bRel.side, a);
      }
      if (aChildSide === "left") {
        btreeAttach(ctx, objName, a, "left", b);
        btreeAttach(ctx, objName, a, "right", bRight);
        btreeAttach(ctx, objName, b, "left", aLeft);
        btreeAttach(ctx, objName, b, "right", aRight);
      } else {
        btreeAttach(ctx, objName, a, "right", b);
        btreeAttach(ctx, objName, a, "left", bLeft);
        btreeAttach(ctx, objName, b, "left", aLeft);
        btreeAttach(ctx, objName, b, "right", aRight);
      }
      if (!bRel.parent && ghost) {
        btreeAttach(ctx, objName, ghost, "left", a);
      }
      syncBTreeRootIdFromGhost(ctx, objName);
      markBTreeLayout(ctx, objName);
      return;
    }

    if (bRel.parent === a) {
      swapBTreeTopology(ctx, objName, bId, aId);
      return;
    }

    if (aRel.parent) {
      btreeAttach(ctx, objName, aRel.parent, aRel.side, null);
    } else if (ghost) {
      btreeAttach(ctx, objName, ghost, "left", null);
    }
    if (bRel.parent) {
      btreeAttach(ctx, objName, bRel.parent, bRel.side, null);
    } else if (ghost) {
      btreeAttach(ctx, objName, ghost, "left", null);
    }
    btreeAttach(ctx, objName, a, "left", null);
    btreeAttach(ctx, objName, a, "right", null);
    btreeAttach(ctx, objName, b, "left", null);
    btreeAttach(ctx, objName, b, "right", null);

    if (aRel.parent) {
      btreeAttach(ctx, objName, aRel.parent, aRel.side, b);
    } else if (ghost) {
      btreeAttach(ctx, objName, ghost, "left", b);
    }
    if (bRel.parent) {
      btreeAttach(ctx, objName, bRel.parent, bRel.side, a);
    } else if (ghost) {
      btreeAttach(ctx, objName, ghost, "left", a);
    }
    btreeAttach(ctx, objName, a, "left", bLeft);
    btreeAttach(ctx, objName, a, "right", bRight);
    btreeAttach(ctx, objName, b, "left", aLeft);
    btreeAttach(ctx, objName, b, "right", aRight);
    syncBTreeRootIdFromGhost(ctx, objName);
    markBTreeLayout(ctx, objName);
  }

  function renderSyncTree(ctx, objName, args) {
    var tree = ensureBTree(ctx, objName);
    var nodes = (args && args.nodes) || [];
    var rootId = args ? args.root : null;
    var index = {};
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n && n.id) {
        index[n.id] = n;
      }
    }
    var built = {};
    function build(id) {
      if (!id) {
        return null;
      }
      if (built[id]) {
        return built[id];
      }
      var data = index[id];
      if (!data) {
        return null;
      }
      var meta = getMeta(ctx, objName, id);
      if (data.value !== undefined) {
        meta.value = data.value;
      }
      var node = ensureVisualNode(ctx, objName, id);
      showNodeIfHidden(ctx, objName, id);
      node.value(nodeText(meta));
      applyNodeStyle(ctx, node, meta);
      built[id] = node;
      var leftNode = build(data.left);
      var rightNode = build(data.right);
      node.left(leftNode, { hide: false });
      node.right(rightNode, { hide: false });
      return node;
    }
    if (!rootId) {
      setTreeRootNode(ctx, objName, null, null);
      ctx.btreeNodes[objName] = {};
      ctx.btreeHiddenState[objName] = {};
      markBTreeLayout(ctx, objName);
      return;
    }
    var rootNode = build(rootId);
    if (rootNode) {
      setTreeRootNode(ctx, objName, rootId, rootNode);
    }
    ctx.btreeNodes[objName] = built;
    markBTreeLayout(ctx, objName);
  }

  function markBTreeLayout(ctx, objName) {
    ensureBTree(ctx, objName);
    ctx.pendingBTreeLayouts[objName] = true;
  }

  function markTreeLayout(ctx, objName) {
    ensureTree(ctx, objName);
    ctx.pendingTreeLayouts[objName] = true;
  }

  function graphEdgeKey(fromId, toId) {
    return String(fromId) + "->" + String(toId);
  }

  function applyGraphEdgeStyle(edge, style) {
    if (!edge || typeof edge.css !== "function") {
      return;
    }
    var css = {};
    if (style && style.color !== undefined && style.color !== null && style.color !== "") {
      css.stroke = String(style.color);
    }
    if (style && style.width !== undefined && style.width !== null && style.width !== "") {
      css["stroke-width"] = String(style.width);
    }
    if (style && style.dash !== undefined && style.dash !== null && style.dash !== "") {
      css["stroke-dasharray"] = String(style.dash);
    } else if (style && style.dash === "") {
      css["stroke-dasharray"] = "none";
    }
    if (Object.keys(css).length > 0) {
      edge.css(css);
    }
  }

  function applyGraphEdgeVisualState(rec) {
    if (!rec || !rec.edge) {
      return;
    }
    var baseStyle = rec.style || null;
    var mergedStyle = {
      color: (baseStyle && baseStyle.color !== undefined) ? baseStyle.color : null,
      width: (baseStyle && baseStyle.width !== undefined) ? baseStyle.width : null,
      dash: (baseStyle && baseStyle.dash !== undefined) ? baseStyle.dash : null
    };
    if (rec.marked) {
      var markStyle = rec.markStyle || {};
      mergedStyle.color = (markStyle.color !== undefined) ? markStyle.color : (mergedStyle.color || "#f59e0b");
      mergedStyle.width = (markStyle.width !== undefined) ? markStyle.width : (mergedStyle.width || 4);
      mergedStyle.dash = (markStyle.dash !== undefined) ? markStyle.dash : "";
    }
    applyGraphEdgeStyle(rec.edge, mergedStyle);
    if (rec.marked) {
      rec.edge.highlight();
    } else {
      rec.edge.unhighlight();
    }
  }

  function setGraphEdgeLabelVisible(rec, visible) {
    if (!rec || !rec.edge || !rec.edge._label) {
      return;
    }
    var l = rec.edge._label;
    if (typeof l.show === "function" && typeof l.hide === "function") {
      if (visible) l.show();
      else l.hide();
      return;
    }
    if (l.element && typeof l.element.show === "function" && typeof l.element.hide === "function") {
      if (visible) l.element.show();
      else l.element.hide();
      return;
    }
    if (typeof l.css === "function") {
      l.css({ display: visible ? "" : "none" });
      return;
    }
    if (l.element && typeof l.element.css === "function") {
      l.element.css({ display: visible ? "" : "none" });
    }
  }

  function bindGraphEdgeLabelHover(rec) {
    if (!rec || !rec.edge || rec._labelHoverBound) {
      return;
    }
    var $edgeEl = rec.edge.element;
    if (!$edgeEl || !$edgeEl.length) {
      return;
    }
    $edgeEl.on("mouseenter.dstrace_label", function () {
      setGraphEdgeLabelVisible(rec, true);
    });
    $edgeEl.on("mouseleave.dstrace_label", function () {
      if (!rec.labelPinned) {
        setGraphEdgeLabelVisible(rec, false);
      }
    });
    rec._labelHoverBound = true;
  }

  function normalizeTraceTextValue(v) {
    if (v === undefined || v === null) {
      return v;
    }
    var s = String(v);
    // Trace payload may include escaped newline literals ("\\n"), normalize for UI rendering.
    return s.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");
  }

  function graphNodeStyle(ctx, meta) {
    var colorKey = (meta && meta.color) || "black";
    var bg = ctx.graphNodeColorMap[colorKey] || ctx.graphNodeColorMap.black;
    return {
      "background-color": bg,
      color: "#ffffff",
      "white-space": "pre-line"
    };
  }

  function ensureGraph(ctx, objName) {
    if (ctx.graphs[objName]) {
      return ctx.graphs[objName];
    }
    var graphName = "graph_" + debugToken(ctx.ctxName + "__" + objName);
    var graphLayoutMode = ctx.graphLayout || "auto_freeze";
    var graphInitLayout = (graphLayoutMode === "auto_freeze") ? "automatic" : graphLayoutMode;
    var graphInit = {
      left: 20 + ctx.graphOrder.length * 500,
      top: graphTopFromArrayCount(ctx),
      center: false,
      width: 460,
      height: 280,
      directed: !!ctx.graphDirected[objName],
      layout: graphInitLayout
    };
    var g = ctx.jsav.ds.graph(graphInit);
    debugPush(ctx, "var " + graphName + " = " + ctx.debug.jsavVarName + ".ds.graph(" + debugQ(graphInit) + ");");
    debugBindName(ctx, g, graphName);
    debugWrapMethod(ctx, g, "layout", graphName);
    ctx.graphs[objName] = g;
    ctx.graphOrder.push(objName);
    if (!ctx.graphMeta[objName]) ctx.graphMeta[objName] = {};
    if (!ctx.graphNodes[objName]) ctx.graphNodes[objName] = {};
    if (!ctx.graphNodeVars[objName]) ctx.graphNodeVars[objName] = {};
    if (!ctx.graphEdges[objName]) ctx.graphEdges[objName] = {};
    if (!ctx.graphEdgeVars[objName]) ctx.graphEdgeVars[objName] = {};
    if (!ctx.graphNodeMarked[objName]) ctx.graphNodeMarked[objName] = {};
    if (!ctx.graphEdgeMarked[objName]) ctx.graphEdgeMarked[objName] = {};
    return g;
  }

  function markGraphLayout(ctx, objName, structureChanged) {
    ensureGraph(ctx, objName);
    ctx.pendingGraphLayouts[objName] = true;
    if (structureChanged) {
      ctx.graphStructureDirty[objName] = true;
    }
  }
  function markGraphRelayout(ctx, objName) {
    ensureGraph(ctx, objName);
    ctx.pendingGraphLayouts[objName] = true;
    ctx.graphForceRelayout[objName] = true;
  }

  function ensureGraphNodeMeta(ctx, objName, id) {
    if (!ctx.graphMeta[objName]) {
      ctx.graphMeta[objName] = {};
    }
    if (!ctx.graphMeta[objName][id]) {
      ctx.graphMeta[objName][id] = { value: "", color: "black" };
    }
    return ctx.graphMeta[objName][id];
  }

  function ensureGraphNode(ctx, objName, id) {
    if (!id) return null;
    ensureGraph(ctx, objName);
    if (ctx.graphNodes[objName][id]) {
      return ctx.graphNodes[objName][id];
    }
    var g = ctx.graphs[objName];
    var meta = ensureGraphNodeMeta(ctx, objName, id);
    var nodeName = "graph_node_" + debugToken(ctx.ctxName + "__" + objName + "__" + id);
    var graphName = debugNameOf(ctx, g, "graph_" + debugToken(ctx.ctxName + "__" + objName));
    var initValue = (meta.value === undefined || meta.value === null) ? "" : String(meta.value);
    var node = g.addNode(initValue);
    debugPush(ctx, "var " + nodeName + " = " + graphName + ".addNode(" + debugQ(initValue) + ");");
    debugBindName(ctx, node, nodeName);
    debugWrapNode(ctx, node, nodeName);
    node.css(graphNodeStyle(ctx, meta));
    ctx.graphNodes[objName][id] = node;
    ctx.graphNodeVars[objName][id] = nodeName;
    return node;
  }

  function updateGraphNode(ctx, objName, id) {
    var node = ensureGraphNode(ctx, objName, id);
    if (!node) return;
    var meta = ensureGraphNodeMeta(ctx, objName, id);
    node.value((meta.value === undefined || meta.value === null) ? "" : String(meta.value));
    node.css(graphNodeStyle(ctx, meta));
  }

  function ensureGraphEdgeRecord(ctx, objName, fromId, toId) {
    var key = graphEdgeKey(fromId, toId);
    var rec = ctx.graphEdges[objName][key];
    if (!rec) {
      rec = { from: fromId, to: toId, edge: null, label: "", style: null, markStyle: null, marked: false, labelPinned: false, _labelHoverBound: false };
      ctx.graphEdges[objName][key] = rec;
    }
    return rec;
  }

  function ensureGraphEdge(ctx, objName, fromId, toId) {
    if (!fromId || !toId) return null;
    var g = ensureGraph(ctx, objName);
    var key = graphEdgeKey(fromId, toId);
    var fromNode = ensureGraphNode(ctx, objName, fromId);
    var toNode = ensureGraphNode(ctx, objName, toId);
    if (!fromNode || !toNode) return null;
    var rec = ensureGraphEdgeRecord(ctx, objName, fromId, toId);
    if (!rec.edge) {
      var existing = g.getEdge(fromNode, toNode);
      if (existing) {
        rec.edge = existing;
      } else {
        rec.edge = g.addEdge(fromNode, toNode);
        var edgeName = "graph_edge_" + debugToken(ctx.ctxName + "__" + objName + "__" + fromId + "__" + toId);
        var graphName = debugNameOf(ctx, g, "graph_" + debugToken(ctx.ctxName + "__" + objName));
        var fromName = debugNameOf(ctx, fromNode, "graph_node_" + debugToken(ctx.ctxName + "__" + objName + "__" + fromId));
        var toName = debugNameOf(ctx, toNode, "graph_node_" + debugToken(ctx.ctxName + "__" + objName + "__" + toId));
        debugPush(ctx, "var " + edgeName + " = " + graphName + ".addEdge(" + fromName + ", " + toName + ");");
        debugBindName(ctx, rec.edge, edgeName);
        debugWrapMethod(ctx, rec.edge, "label", edgeName, null, function (args) { return args.length > 0; });
        debugWrapMethod(ctx, rec.edge, "css", edgeName);
        debugWrapMethod(ctx, rec.edge, "highlight", edgeName);
        debugWrapMethod(ctx, rec.edge, "unhighlight", edgeName);
        ctx.graphEdgeVars[objName][key] = edgeName;
      }
    }
    bindGraphEdgeLabelHover(rec);
    applyGraphEdgeVisualState(rec);
    return rec.edge;
  }

  function relayoutIncidentGraphEdges(ctx, objName, nodeId) {
    var edgeMap = ctx.graphEdges[objName] || {};
    var keys = Object.keys(edgeMap);
    for (var i = 0; i < keys.length; i++) {
      var rec = edgeMap[keys[i]];
      if (!rec || !rec.edge) continue;
      if (rec.from === nodeId || rec.to === nodeId) {
        if (typeof rec.edge.layout === "function") {
          rec.edge.layout();
        }
      }
    }
  }

  function stateTopFromArrayCount(ctx) {
    var base = graphTopFromArrayCount(ctx);
    var graphRows = (ctx.graphOrder && ctx.graphOrder.length) ? ctx.graphOrder.length : 0;
    var treeRows = (ctx.treeOrder && ctx.treeOrder.length) ? ctx.treeOrder.length : 0;
    var btreeRows = (ctx.btreeOrder && ctx.btreeOrder.length) ? ctx.btreeOrder.length : 0;
    return base + Math.max(graphRows, treeRows, btreeRows) * 330;
  }

  function emptyMatrixData(rows, cols) {
    rows = Math.max(0, rows || 0);
    cols = Math.max(0, cols || 0);
    var data = [];
    for (var r = 0; r < rows; r++) {
      var row = [];
      for (var c = 0; c < cols; c++) {
        row.push("");
      }
      data.push(row);
    }
    return data;
  }

  function escapeHtml(text) {
    return String(text === undefined || text === null ? "" : text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function defaultStateTitle(objName, kind, rows, cols) {
    if (kind === "vector") {
      return objName + " [node]";
    }
    if (kind === "matrix") {
      return objName + " [row][col]";
    }
    return objName + " (" + rows + " x " + cols + ")";
  }

  function normalizeStateLabels(labels, count, base) {
    var out = [];
    if (Array.isArray(labels) && labels.length) {
      for (var i = 0; i < count; i++) {
        out.push(labels[i] !== undefined && labels[i] !== null ? String(labels[i]) : "");
      }
      return out;
    }
    if (typeof base !== "number" || !isFinite(base)) {
      base = 0;
    }
    for (var j = 0; j < count; j++) {
      out.push(String(base + j));
    }
    return out;
  }

  function makeStateLabel(ctx, name, text, options, css) {
    var label = ctx.jsav.label(escapeHtml(text), options || {});
    if (css && typeof label.css === "function") {
      label.css(css);
    }
    debugPush(ctx, "var " + name + " = " + ctx.debug.jsavVarName + ".label(" + debugQ(escapeHtml(text)) + ", " + debugQ(options || {}) + ");");
    debugWrapLabel(ctx, label, name);
    if (css) {
      debugPush(ctx, name + ".css(" + debugQ(css) + ");");
    }
    return label;
  }

  function ensureStateMatrix(ctx, objName, kind, rows, cols, meta) {
    if (ctx.states[objName]) {
      return ctx.states[objName].matrix;
    }
    var idx = ctx.stateOrder.indexOf(objName);
    if (idx < 0) {
      ctx.stateOrder.push(objName);
      idx = ctx.stateOrder.length - 1;
    }
    kind = kind || "table";
    var style = (kind === "matrix") ? "matrix" : ((kind === "plain") ? "plain" : "table");
    var matrixName = "state_" + debugToken(ctx.ctxName + "__" + objName);
    var left = 52 + idx * 430;
    var top = stateTopFromArrayCount(ctx) + 64;
    meta = meta || {};
    var title = meta.title || meta.label || defaultStateTitle(objName, kind, rows || 1, cols || 1);
    var showColLabels = meta.showColLabels !== false && meta.show_col_labels !== false;
    var showRowLabels = meta.showRowLabels !== false && meta.show_row_labels !== false;
    var colLabels = showColLabels ? normalizeStateLabels(meta.colLabels || meta.col_labels, cols || 1, Number(meta.colBase !== undefined ? meta.colBase : meta.col_base)) : [];
    var rowLabels = showRowLabels ? normalizeStateLabels(meta.rowLabels || meta.row_labels, rows || 1, Number(meta.rowBase !== undefined ? meta.rowBase : meta.row_base)) : [];
    var init = {
      left: left,
      top: top,
      style: style,
      center: false
    };
    var labelPrefix = "state_label_" + debugToken(ctx.ctxName + "__" + objName);
    var titleLabel = makeStateLabel(ctx, labelPrefix + "_title", title, {
      left: left,
      top: top - 58
    }, {
      "font-weight": "700",
      "font-size": "14px",
      "color": "#334155"
    });
    var axisLabel = null;
    if (meta.axis || meta.axisLabel || meta.axis_label) {
      axisLabel = makeStateLabel(ctx, labelPrefix + "_axis", meta.axis || meta.axisLabel || meta.axis_label, {
        left: left,
        top: top - 38
      }, {
        "font-size": "12px",
        "color": "#64748b"
      });
    }
    var colLabelObjs = [];
    for (var ci = 0; ci < colLabels.length; ci++) {
      colLabelObjs.push(makeStateLabel(ctx, labelPrefix + "_col_" + ci, colLabels[ci], {
        left: left + ci * 30 + 10,
        top: top - 18
      }, {
        "font-size": "11px",
        "line-height": "14px",
        "min-width": "20px",
        "text-align": "center",
        "color": "#475569"
      }));
    }
    var rowLabelObjs = [];
    for (var ri = 0; ri < rowLabels.length; ri++) {
      rowLabelObjs.push(makeStateLabel(ctx, labelPrefix + "_row_" + ri, rowLabels[ri], {
        left: left - 32,
        top: top + ri * 30 + 6
      }, {
        "font-size": "11px",
        "line-height": "14px",
        "width": "24px",
        "text-align": "right",
        "color": "#475569"
      }));
    }
    var matrix = ctx.jsav.ds.matrix(emptyMatrixData(rows || 1, cols || 1), init);
    ctx.states[objName] = {
      kind: kind,
      rows: rows || 1,
      cols: cols || 1,
      matrix: matrix,
      title: title,
      titleLabel: titleLabel,
      axisLabel: axisLabel,
      rowLabelObjs: rowLabelObjs,
      colLabelObjs: colLabelObjs
    };
    ctx.stateFocusCells[objName] = [];
    ctx.stateHistory[objName] = {};
    debugPush(ctx, "var " + matrixName + " = " + ctx.debug.jsavVarName + ".ds.matrix(" + debugQ(emptyMatrixData(rows || 1, cols || 1)) + ", " + debugQ(init) + ");");
    debugWrapMatrix(ctx, matrix, matrixName);
    return matrix;
  }

  function stateCellKey(row, col) {
    return String(row) + "," + String(col);
  }

  function normalizeStateValue(value) {
    if (value === undefined || value === null) {
      return "";
    }
    return String(value);
  }

  function clearStateFocus(ctx, objName) {
    var rec = ctx.states[objName];
    if (!rec || !rec.matrix) {
      return;
    }
    var cells = ctx.stateFocusCells[objName] || [];
    for (var i = 0; i < cells.length; i++) {
      rec.matrix.css(cells[i].row, cells[i].col, ctx.stateFocusClearStyle);
    }
    ctx.stateFocusCells[objName] = [];
  }

  function setStateCellTitle(ctx, objName, row, col) {
    var rec = ctx.states[objName];
    if (!rec || !rec.matrix || !rec.matrix._arrays || !rec.matrix._arrays[row]) {
      return;
    }
    var history = ((ctx.stateHistory[objName] || {})[stateCellKey(row, col)]) || [];
    if (!history.length) {
      return;
    }
    var arr = rec.matrix._arrays[row];
    if (arr && arr.element && typeof arr.element.find === "function") {
      var text = [];
      for (var i = Math.max(0, history.length - 6); i < history.length; i++) {
        var h = history[i];
        text.push((h.note ? h.note + ": " : "") + normalizeStateValue(h.value));
      }
      arr.element.find("li:eq(" + col + ")").attr("title", text.join("\n"));
    }
  }

  function markStateLayout(ctx, objName) {
    if (ctx.states[objName]) {
      ctx.pendingStateLayouts[objName] = true;
    }
  }

  function stateSequenceTop(ctx) {
    return stateTopFromArrayCount(ctx) + 160;
  }

  function renderStateSequence(ctx, objName) {
    if (!ctx.stateSequences[objName]) {
      ctx.stateSequences[objName] = { values: [], arr: null, version: 0 };
    }
    var rec = ctx.stateSequences[objName];
    if (rec.arr && typeof rec.arr.hide === "function") {
      rec.arr.hide();
    }
    var idx = ctx.stateOrder.indexOf(objName);
    if (idx < 0) {
      ctx.stateOrder.push(objName);
      idx = ctx.stateOrder.length - 1;
    }
    rec.version += 1;
    var arrName = "state_seq_" + debugToken(ctx.ctxName + "__" + objName + "__" + rec.version);
    var init = {
      left: 20 + idx * 420,
      top: stateSequenceTop(ctx),
      indexed: true
    };
    rec.arr = ctx.jsav.ds.array(rec.values.slice(), init);
    debugPush(ctx, "var " + arrName + " = " + ctx.debug.jsavVarName + ".ds.array(" + debugQ(rec.values.slice()) + ", " + debugQ(init) + ");");
    debugWrapArray(ctx, rec.arr, arrName);
  }

  function flushPendingLayouts(ctx) {
    var btreeObjs = Object.keys(ctx.pendingBTreeLayouts || {}).sort();
    for (var bi = 0; bi < btreeObjs.length; bi++) {
      var bobj = btreeObjs[bi];
      if (!ctx.pendingBTreeLayouts[bobj]) {
        continue;
      }
      ensureBTree(ctx, bobj).layout();
      ctx.pendingBTreeLayouts[bobj] = false;
    }
    var treeObjs = Object.keys(ctx.pendingTreeLayouts || {}).sort();
    for (var ti = 0; ti < treeObjs.length; ti++) {
      var tobj = treeObjs[ti];
      if (!ctx.pendingTreeLayouts[tobj]) {
        continue;
      }
      ensureTree(ctx, tobj).layout();
      ctx.pendingTreeLayouts[tobj] = false;
    }
    var graphObjs = Object.keys(ctx.pendingGraphLayouts || {}).sort();
    for (var gi = 0; gi < graphObjs.length; gi++) {
      var gobj = graphObjs[gi];
      if (!ctx.pendingGraphLayouts[gobj]) {
        continue;
      }
      var g = ensureGraph(ctx, gobj);
      var targetTop = graphTopFromArrayCount(ctx);
      if (g && typeof g.css === "function") {
        g.css({ top: targetTop });
      }
      if ((ctx.graphLayout || "auto_freeze") === "auto_freeze") {
        if (!ctx.graphLayoutDone[gobj] || ctx.graphStructureDirty[gobj] || ctx.graphForceRelayout[gobj]) {
          if (g.options) {
            g.options.layout = "automatic";
          }
          g.layout();
          if (g.options) {
            g.options.layout = "manual";
          }
          ctx.graphLayoutDone[gobj] = true;
          ctx.graphStructureDirty[gobj] = false;
          ctx.graphForceRelayout[gobj] = false;
        } else {
          var edges = g.edges();
          while (edges.hasNext()) {
            edges.next().layout();
          }
        }
      } else {
        g.layout();
      }
      ctx.pendingGraphLayouts[gobj] = false;
    }
    var stateObjs = Object.keys(ctx.pendingStateLayouts || {}).sort();
    for (var si = 0; si < stateObjs.length; si++) {
      var sobj = stateObjs[si];
      if (!ctx.pendingStateLayouts[sobj] || !ctx.states[sobj] || !ctx.states[sobj].matrix) {
        continue;
      }
      ctx.states[sobj].matrix.layout();
      ctx.pendingStateLayouts[sobj] = false;
    }
  }

  function ensureTree(ctx, objName) {
    if (ctx.trees[objName]) {
      return ctx.trees[objName];
    }
    var treeName = "tree_" + debugToken(ctx.ctxName + "__" + objName);
    var ghostName = "tree_ghost_" + debugToken(ctx.ctxName + "__" + objName);
    var treeInit = {
      left: 20 + ctx.treeOrder.length * 460,
      top: treeTopFromArrayCount(ctx),
      center: false
    };
    var tree = ctx.jsav.ds.tree(treeInit);
    debugPush(ctx, "var " + treeName + " = " + ctx.debug.jsavVarName + ".ds.tree(" + debugQ(treeInit) + ");");
    debugBindName(ctx, tree, treeName);
    debugWrapTree(ctx, tree, treeName, ghostName);
    ctx.trees[objName] = tree;
    ctx.treeOrder.push(objName);
    if (!ctx.treeNodes[objName]) {
      ctx.treeNodes[objName] = {};
    }
    if (!ctx.treeMeta[objName]) {
      ctx.treeMeta[objName] = {};
    }
    if (!ctx.treeHiddenState[objName]) {
      ctx.treeHiddenState[objName] = {};
    }
    if (!ctx.treeDetachedNodes[objName]) {
      ctx.treeDetachedNodes[objName] = {};
    }
    if (!ctx.treeMarkedIds[objName]) {
      ctx.treeMarkedIds[objName] = {};
    }
    if (!ctx.treeGhost[objName]) {
      var ghost = tree.root();
      debugPush(ctx, "var " + ghostName + " = " + treeName + ".root();");
      debugBindName(ctx, ghost, ghostName);
      debugWrapNode(ctx, ghost, ghostName);
      if (ghost) {
        var gch = (typeof ghost.children === "function") ? (ghost.children() || []) : [];
        for (var gi = gch.length - 1; gi >= 0; gi--) {
          ghost.child(gi, null, { hide: false });
        }
        if (typeof ghost.hide === "function") {
          ghost.hide({ recursive: false });
        }
      }
      ctx.treeGhost[objName] = ghost || null;
    }
    if (typeof ctx.treeRootId[objName] === "undefined") {
      ctx.treeRootId[objName] = null;
    }
    return tree;
  }

  function hideTreeGhostNode(ctx, objName) {
    var ghost = ctx.treeGhost[objName];
    if (!ghost) {
      return;
    }
    if (typeof ghost.hide === "function") {
      ghost.hide({ recursive: false });
    }
  }

  function setTreeRootGeneric(ctx, objName, rootId, rootNode) {
    ensureTree(ctx, objName);
    var ghost = ctx.treeGhost[objName];
    if (!rootId || !rootNode) {
      if (ghost) {
        var gch = (typeof ghost.children === "function") ? (ghost.children() || []) : [];
        for (var gi = gch.length - 1; gi >= 0; gi--) {
          debugCall(ctx, ghost, debugNameOf(ctx, ghost, "tree_ghost_" + debugToken(ctx.ctxName + "__" + objName)), "child", [gi, null, { hide: false }]);
        }
        hideTreeGhostNode(ctx, objName);
      }
      ctx.treeRootId[objName] = null;
      return;
    }
    showTreeNodeIfHidden(ctx, objName, rootId);
    if (ghost) {
      var oldChildren = (typeof ghost.children === "function") ? (ghost.children() || []) : [];
      for (var oi = oldChildren.length - 1; oi >= 0; oi--) {
        debugCall(ctx, ghost, debugNameOf(ctx, ghost, "tree_ghost_" + debugToken(ctx.ctxName + "__" + objName)), "child", [oi, null, { hide: false }]);
      }
      if (typeof ghost.addChild === "function") {
        debugCall(ctx, ghost, debugNameOf(ctx, ghost, "tree_ghost_" + debugToken(ctx.ctxName + "__" + objName)), "addChild", [rootNode, { hide: false }]);
      }
    }
    hideTreeGhostNode(ctx, objName);
    ctx.treeRootId[objName] = rootId;
  }

  function addTreeRootGeneric(ctx, objName, rootId, rootNode) {
    ensureTree(ctx, objName);
    if (!rootId || !rootNode) {
      return;
    }
    showTreeNodeIfHidden(ctx, objName, rootId);
    if (rootNode.parent && rootNode.parent()) {
      treeDetachFromParentOnly(rootNode);
    }
    var ghost = ctx.treeGhost[objName];
    if (ghost && typeof ghost.children === "function") {
      var ch = ghost.children() || [];
      for (var i = 0; i < ch.length; i++) {
        if (ch[i] === rootNode) {
          hideTreeGhostNode(ctx, objName);
          return;
        }
      }
    }
    if (ghost && typeof ghost.addChild === "function") {
      debugCall(ctx, ghost, debugNameOf(ctx, ghost, "tree_ghost_" + debugToken(ctx.ctxName + "__" + objName)), "addChild", [rootNode, { hide: false }]);
    }
    hideTreeGhostNode(ctx, objName);
    if (!ctx.treeRootId[objName]) {
      ctx.treeRootId[objName] = rootId;
    }
  }

  function removeTreeRootGeneric(ctx, objName, rootId) {
    ensureTree(ctx, objName);
    if (!rootId) {
      return;
    }
    var node = (ctx.treeNodes[objName] || {})[rootId];
    if (!node) {
      return;
    }
    treeDetachFromParentOnly(node);
    if (ctx.treeRootId[objName] === rootId) {
      var ghost = ctx.treeGhost[objName];
      var roots = (ghost && typeof ghost.children === "function") ? (ghost.children() || []) : [];
      ctx.treeRootId[objName] = roots.length ? findTreeNodeIdByNode(ctx, objName, roots[0]) : null;
    }
    hideTreeGhostNode(ctx, objName);
  }

  function getTreeMeta(ctx, objName, id) {
    if (!ctx.treeMeta[objName]) {
      ctx.treeMeta[objName] = {};
    }
    if (!ctx.treeMeta[objName][id]) {
      ctx.treeMeta[objName][id] = { value: "", note: "", color: "black" };
    }
    return ctx.treeMeta[objName][id];
  }

  function applyTreeNodeStyle(ctx, node, meta) {
    if (!node || !meta) {
      return;
    }
    var colorKey = meta.color || "black";
    var bg = ctx.treeColorMap[colorKey] || ctx.treeColorMap.black;
    node.css({
      "background-color": bg,
      "color": "#ffffff",
      "white-space": "pre-line"
    });
  }

  function ensureVisualTreeNode(ctx, objName, id) {
    var map = ctx.treeNodes[objName] || {};
    if (map[id]) {
      return map[id];
    }
    var tree = ensureTree(ctx, objName);
    var meta = getTreeMeta(ctx, objName, id);
    var nodeName = "tree_node_" + debugToken(ctx.ctxName + "__" + objName + "__" + id);
    var node = tree.newNode(nodeText(meta));
    debugPush(ctx, "var " + nodeName + " = " + debugNameOf(ctx, tree, "tree_" + debugToken(ctx.ctxName + "__" + objName)) + ".newNode(" + debugQ(nodeText(meta)) + ");");
    debugWrapNode(ctx, node, nodeName);
    applyTreeNodeStyle(ctx, node, meta);
    map[id] = node;
    ctx.treeNodes[objName] = map;
    if (!ctx.treeHiddenState[objName]) {
      ctx.treeHiddenState[objName] = {};
    }
    if (!ctx.treeDetachedNodes[objName]) {
      ctx.treeDetachedNodes[objName] = {};
    }
    ctx.treeHiddenState[objName][id] = false;
    return node;
  }

  function showTreeNodeIfHidden(ctx, objName, id) {
    if (!id) {
      return;
    }
    var hiddenMap = ctx.treeHiddenState[objName] || {};
    if (!hiddenMap[id]) {
      return;
    }
    var map = ctx.treeNodes[objName] || {};
    var node = map[id];
    if (!node) {
      return;
    }
    if (typeof node.show === "function") {
      node.show({ recursive: false });
    }
    hiddenMap[id] = false;
  }

  function updateTreeNodeValueAndStyle(ctx, objName, id) {
    var map = ctx.treeNodes[objName] || {};
    var node = map[id];
    if (!node) {
      return;
    }
    var meta = getTreeMeta(ctx, objName, id);
    node.value(nodeText(meta));
    applyTreeNodeStyle(ctx, node, meta);
  }

  function stashDetachedTreeNode(ctx, objName, id, node) {
    if (!id || !node) {
      return;
    }
    if (!ctx.treeDetachedNodes[objName]) {
      ctx.treeDetachedNodes[objName] = {};
    }
    ctx.treeDetachedNodes[objName][id] = node;
  }

  function findTreeNodeIdByNode(ctx, objName, ref) {
    var map = ctx.treeNodes[objName] || {};
    var ids = Object.keys(map);
    for (var i = 0; i < ids.length; i++) {
      if (map[ids[i]] === ref) {
        return ids[i];
      }
    }
    return null;
  }

  function treeDetachFromParentAtPos(parent, pos) {
    if (!parent || typeof parent.child !== "function" || pos < 0) {
      return;
    }
    var ch = parent.child(pos);
    if (!ch) {
      return;
    }
    parent.child(pos, null, { hide: false });
  }

  function treeDetachAllChildren(node) {
    if (!node || typeof node.children !== "function" || typeof node.child !== "function") {
      return;
    }
    var children = node.children() || [];
    for (var i = children.length - 1; i >= 0; i--) {
      if (children[i]) {
        node.child(i, null, { hide: false });
      }
    }
  }

  function treeDetachFromParentOnly(node) {
    if (!node || typeof node.parent !== "function") {
      return;
    }
    var p = node.parent();
    if (!p || typeof p.children !== "function" || typeof p.child !== "function") {
      return;
    }
    var ch = p.children() || [];
    for (var i = 0; i < ch.length; i++) {
      if (ch[i] === node) {
        p.child(i, null, { hide: false });
        return;
      }
    }
  }

  var treeOpHandlers = {
    init: function (ctx, evt) {
      var obj = evt.obj || "T";
      var tree = ensureTree(ctx, obj);
    },
    new_node: function (ctx, evt) {
      var obj = evt.obj || "T";
      var args = evt.args || {};
      var id = args.id;
      if (!id) {
        return;
      }
      var meta = getTreeMeta(ctx, obj, id);
      if (args.value !== undefined) {
        meta.value = args.value;
      }
      if (args.note !== undefined) {
        meta.note = args.note;
      }
      if (args.color !== undefined) {
        meta.color = args.color;
      }
      ensureVisualTreeNode(ctx, obj, id);
    },
    set_root: function (ctx, evt) {
      var obj = evt.obj || "T";
      var args = evt.args || {};
      var id = args.id;
      if (!id) {
        setTreeRootGeneric(ctx, obj, null, null);
        markTreeLayout(ctx, obj);
        return;
      }
      var rootNode = ensureVisualTreeNode(ctx, obj, id);
      setTreeRootGeneric(ctx, obj, id, rootNode);
      updateTreeNodeValueAndStyle(ctx, obj, id);
      markTreeLayout(ctx, obj);
    },
    add_root: function (ctx, evt) {
      var obj = evt.obj || "T";
      var args = evt.args || {};
      var id = args.id;
      if (!id) {
        return;
      }
      var rootNode = ensureVisualTreeNode(ctx, obj, id);
      addTreeRootGeneric(ctx, obj, id, rootNode);
      updateTreeNodeValueAndStyle(ctx, obj, id);
      markTreeLayout(ctx, obj);
    },
    remove_root: function (ctx, evt) {
      var obj = evt.obj || "T";
      var args = evt.args || {};
      if (!args.id) {
        return;
      }
      removeTreeRootGeneric(ctx, obj, args.id);
      markTreeLayout(ctx, obj);
    },
    add_child: function (ctx, evt) {
      var obj = evt.obj || "T";
      var args = evt.args || {};
      var parentId = args.parent;
      var childId = args.child;
      if (!parentId || childId === null || childId === undefined) {
        return;
      }
      var parentNode = ensureVisualTreeNode(ctx, obj, parentId);
      var childNode = ensureVisualTreeNode(ctx, obj, childId);
      if (childNode.parent && childNode.parent()) {
        childNode.remove({ hide: false });
        ctx.treeHiddenState[obj][childId] = true;
      }
      showTreeNodeIfHidden(ctx, obj, childId);
      parentNode.addChild(childNode, { hide: false });
      updateTreeNodeValueAndStyle(ctx, obj, parentId);
      updateTreeNodeValueAndStyle(ctx, obj, childId);
      markTreeLayout(ctx, obj);
    },
    set_child: function (ctx, evt) {
      var obj = evt.obj || "T";
      var args = evt.args || {};
      var parentId = args.parent;
      var pos = (typeof args.pos === "number") ? args.pos : -1;
      var childId = args.child;
      if (!parentId || pos < 0) {
        return;
      }
      var parentNode = ensureVisualTreeNode(ctx, obj, parentId);
      if (childId === null || childId === undefined) {
        treeDetachFromParentAtPos(parentNode, pos);
        markTreeLayout(ctx, obj);
        return;
      }
      var childNode = ensureVisualTreeNode(ctx, obj, childId);
      if (childNode.parent && childNode.parent()) {
        childNode.remove({ hide: false });
        ctx.treeHiddenState[obj][childId] = true;
      }
      showTreeNodeIfHidden(ctx, obj, childId);
      parentNode.child(pos, childNode, { hide: false });
      updateTreeNodeValueAndStyle(ctx, obj, parentId);
      updateTreeNodeValueAndStyle(ctx, obj, childId);
      markTreeLayout(ctx, obj);
    },
    remove_node: function (ctx, evt) {
      var obj = evt.obj || "T";
      var args = evt.args || {};
      var id = args.id;
      if (!id) {
        return;
      }
      ensureTree(ctx, obj);
      var map = ctx.treeNodes[obj] || {};
      var node = map[id];
      if (node) {
        if (ctx.treeRootId[obj] === id) {
          setTreeRootGeneric(ctx, obj, null, null);
          stashDetachedTreeNode(ctx, obj, id, node);
        } else {
          treeDetachFromParentOnly(node);
          stashDetachedTreeNode(ctx, obj, id, node);
        }
        ctx.treeHiddenState[obj][id] = true;
        if (ctx.treeMarkedIds[obj]) {
          delete ctx.treeMarkedIds[obj][id];
        }
      }
      markTreeLayout(ctx, obj);
    },
    destroy_node: function (ctx, evt) {
      var obj = evt.obj || "T";
      var args = evt.args || {};
      var id = args.id;
      if (!id) {
        return;
      }
      var map = ctx.treeNodes[obj] || {};
      var node = map[id];
      if (!node && ctx.treeDetachedNodes[obj]) {
        node = ctx.treeDetachedNodes[obj][id];
      }
      if (node) {
        if (typeof node.hide === "function") {
          node.hide({ recursive: false });
        }
        delete map[id];
      }
      if (ctx.treeDetachedNodes[obj]) {
        delete ctx.treeDetachedNodes[obj][id];
      }
      if (ctx.treeMeta[obj]) {
        delete ctx.treeMeta[obj][id];
      }
      if (ctx.treeHiddenState[obj]) {
        delete ctx.treeHiddenState[obj][id];
      }
      if (ctx.treeMarkedIds[obj]) {
        delete ctx.treeMarkedIds[obj][id];
      }
      if (ctx.treeRootId[obj] === id) {
        ctx.treeRootId[obj] = null;
      }
      markTreeLayout(ctx, obj);
    },
    set_note: function (ctx, evt) {
      var obj = evt.obj || "T";
      var args = evt.args || {};
      var id = args.id;
      if (!id) {
        return;
      }
      var meta = getTreeMeta(ctx, obj, id);
      meta.note = args.note || "";
      updateTreeNodeValueAndStyle(ctx, obj, id);
      markTreeLayout(ctx, obj);
    },
    set_color: function (ctx, evt) {
      var obj = evt.obj || "T";
      var args = evt.args || {};
      var id = args.id;
      if (!id) {
        return;
      }
      var meta = getTreeMeta(ctx, obj, id);
      meta.color = args.color || "black";
      updateTreeNodeValueAndStyle(ctx, obj, id);
    },
    mark: function (ctx, evt) {
      var obj = evt.obj || "T";
      var args = evt.args || {};
      var ids = args.ids || [];
      var map = ctx.treeNodes[obj] || {};
      if (!ctx.treeMarkedIds[obj]) {
        ctx.treeMarkedIds[obj] = {};
      }
      for (var i = 0; i < ids.length; i++) {
        var node = map[ids[i]];
        if (node) {
          focusTreeLikeNode(ctx, node);
          ctx.treeMarkedIds[obj][ids[i]] = true;
        }
      }
    },
    unmark: function (ctx, evt) {
      var obj = evt.obj || "T";
      var args = evt.args || {};
      var ids = args.ids || [];
      var map = ctx.treeNodes[obj] || {};
      if (!ctx.treeMarkedIds[obj]) {
        ctx.treeMarkedIds[obj] = {};
      }
      for (var i = 0; i < ids.length; i++) {
        var node = map[ids[i]];
        if (node) {
          unfocusTreeLikeNode(ctx, node);
          delete ctx.treeMarkedIds[obj][ids[i]];
        }
      }
    },
    hide_node: function (ctx, evt) {
      var obj = evt.obj || "T";
      var args = evt.args || {};
      var id = args.id;
      if (!id) {
        return;
      }
      var map = ctx.treeNodes[obj] || {};
      var node = map[id];
      if (!node) {
        node = ensureVisualTreeNode(ctx, obj, id);
      }
      if (!node) {
        return;
      }
      if (typeof node.hide === "function") {
        node.hide({ recursive: false });
      }
      if (!ctx.treeHiddenState[obj]) {
        ctx.treeHiddenState[obj] = {};
      }
      ctx.treeHiddenState[obj][id] = true;
      markTreeLayout(ctx, obj);
    },
    show_node: function (ctx, evt) {
      var obj = evt.obj || "T";
      var args = evt.args || {};
      var id = args.id;
      if (!id) {
        return;
      }
      var map = ctx.treeNodes[obj] || {};
      var node = map[id];
      if (!node) {
        node = ensureVisualTreeNode(ctx, obj, id);
      }
      if (!node) {
        return;
      }
      if (typeof node.show === "function") {
        node.show({ recursive: false });
      }
      if (!ctx.treeHiddenState[obj]) {
        ctx.treeHiddenState[obj] = {};
      }
      ctx.treeHiddenState[obj][id] = false;
      markTreeLayout(ctx, obj);
    }
  };

  var btreeOpHandlers = {
    init: function (ctx, evt) {
      var obj = evt.obj || "T";
      ensureBTree(ctx, obj);
    },
    new_node: function (ctx, evt) {
      var obj = evt.obj || "T";
      var args = evt.args || {};
      var id = args.id;
      if (!id) {
        return;
      }
      var meta = getMeta(ctx, obj, id);
      if (args.value !== undefined) {
        meta.value = args.value;
      }
      if (args.note !== undefined) {
        meta.note = args.note;
      }
      if (args.color !== undefined) {
        meta.color = args.color;
      }
      ensureVisualNode(ctx, obj, id);
    },
    set_root: function (ctx, evt) {
      var obj = evt.obj || "T";
      var args = evt.args || {};
      var id = args.id;
      if (!id) {
        setTreeRootNode(ctx, obj, null, null);
        markBTreeLayout(ctx, obj);
        return;
      }
      var rootNode = ensureVisualNode(ctx, obj, id);
      setTreeRootNode(ctx, obj, id, rootNode);
      updateNodeValueAndStyle(ctx, obj, id);
      markBTreeLayout(ctx, obj);
    },
    link: function (ctx, evt) {
      var obj = evt.obj || "T";
      var args = evt.args || {};
      var parentId = args.parent;
      var side = args.side;
      var childId = args.child;
      if (!parentId || (side !== "left" && side !== "right")) {
        return;
      }
      var parentNode = ensureVisualNode(ctx, obj, parentId);
      showNodeIfHidden(ctx, obj, parentId);
      if (childId === null || childId === undefined) {
        if (side === "left") {
          parentNode.left(null, { hide: false });
        } else {
          parentNode.right(null, { hide: false });
        }
        markBTreeLayout(ctx, obj);
        return;
      }
      var childNode = ensureVisualNode(ctx, obj, childId);
      if (childNode.parent()) {
        childNode.remove({ hide: false });
        ctx.btreeHiddenState[obj][childId] = true;
      }
      showNodeIfHidden(ctx, obj, childId);
      if (side === "left") {
        parentNode.left(childNode, { hide: false });
      } else {
        parentNode.right(childNode, { hide: false });
      }
      updateNodeValueAndStyle(ctx, obj, parentId);
      updateNodeValueAndStyle(ctx, obj, childId);
      markBTreeLayout(ctx, obj);
    },
    remove_node: function (ctx, evt) {
      var obj = evt.obj || "T";
      var args = evt.args || {};
      var id = args.id;
      if (!id) {
        return;
      }
      ensureBTree(ctx, obj);
      var map = ctx.btreeNodes[obj] || {};
      var node = map[id];
      if (node) {
        syncBTreeRootIdFromGhost(ctx, obj);
        var rel = btreeParentSide(node);
        if (ctx.btreeRootId[obj] === id) {
          setTreeRootNode(ctx, obj, null, null);
        } else if (rel.parent && rel.side) {
          btreeAttach(ctx, obj, rel.parent, rel.side, null);
        } else {
          node.remove({ hide: false });
        }
        if (typeof node.hide === "function") {
          node.hide({ recursive: false });
        }
        stashDetachedNode(ctx, obj, id, node);
        ctx.btreeHiddenState[obj][id] = true;
        if (ctx.btreeMarkedIds[obj]) {
          delete ctx.btreeMarkedIds[obj][id];
        }
      }
      markBTreeLayout(ctx, obj);
    },
    destroy_node: function (ctx, evt) {
      var obj = evt.obj || "T";
      var args = evt.args || {};
      var id = args.id;
      if (!id) {
        return;
      }
      var map = ctx.btreeNodes[obj] || {};
      var node = map[id];
      if (!node && ctx.btreeDetachedNodes[obj]) {
        node = ctx.btreeDetachedNodes[obj][id];
      }
      if (node) {
        if (typeof node.hide === "function") {
          node.hide({ recursive: false });
        }
        delete map[id];
      }
      if (ctx.btreeDetachedNodes[obj]) {
        delete ctx.btreeDetachedNodes[obj][id];
      }
      if (ctx.btreeMeta[obj]) {
        delete ctx.btreeMeta[obj][id];
      }
      if (ctx.btreeHiddenState[obj]) {
        delete ctx.btreeHiddenState[obj][id];
      }
      if (ctx.btreeMarkedIds[obj]) {
        delete ctx.btreeMarkedIds[obj][id];
      }
      if (ctx.btreeRootId[obj] === id) {
        ctx.btreeRootId[obj] = null;
      }
      markBTreeLayout(ctx, obj);
    },
    rotate_left: function (ctx, evt) {
      var obj = evt.obj || "T";
      var args = evt.args || {};
      var map = ctx.btreeNodes[obj] || {};
      var pivot = map[args.pivot];
      ensureBTree(ctx, obj);
        if (pivot && typeof pivot.rotateLeft === "function") {
        showNodeIfHidden(ctx, obj, args.pivot);
        pivot.rotateLeft();
        markBTreeLayout(ctx, obj);
        rebuildBTreeNodeMap(ctx, obj);
        syncBTreeRootIdFromGhost(ctx, obj);
      }
    },
    rotate_right: function (ctx, evt) {
      var obj = evt.obj || "T";
      var args = evt.args || {};
      var map = ctx.btreeNodes[obj] || {};
      var pivot = map[args.pivot];
      ensureBTree(ctx, obj);
      if (pivot && typeof pivot.rotateRight === "function") {
        showNodeIfHidden(ctx, obj, args.pivot);
        pivot.rotateRight();
        markBTreeLayout(ctx, obj);
        rebuildBTreeNodeMap(ctx, obj);
        syncBTreeRootIdFromGhost(ctx, obj);
      }
    },
    swap_topology: function (ctx, evt) {
      var obj = evt.obj || "T";
      var args = evt.args || {};
      swapBTreeTopology(ctx, obj, args.a, args.b);
    },
    set_note: function (ctx, evt) {
      var obj = evt.obj || "T";
      var args = evt.args || {};
      var id = args.id;
      if (!id) {
        return;
      }
      var meta = getMeta(ctx, obj, id);
      meta.note = args.note || "";
      updateNodeValueAndStyle(ctx, obj, id);
      markBTreeLayout(ctx, obj);
    },
    set_color: function (ctx, evt) {
      var obj = evt.obj || "T";
      var args = evt.args || {};
      var id = args.id;
      if (!id) {
        return;
      }
      var meta = getMeta(ctx, obj, id);
      meta.color = args.color || "black";
      updateNodeValueAndStyle(ctx, obj, id);
    },
    mark: function (ctx, evt) {
      var obj = evt.obj || "T";
      var args = evt.args || {};
      var ids = args.ids || [];
      var map = ctx.btreeNodes[obj] || {};
      if (!ctx.btreeMarkedIds[obj]) {
        ctx.btreeMarkedIds[obj] = {};
      }
      for (var i = 0; i < ids.length; i++) {
        var node = map[ids[i]];
        if (node) {
          focusTreeLikeNode(ctx, node);
          ctx.btreeMarkedIds[obj][ids[i]] = true;
        }
      }
    },
    unmark: function (ctx, evt) {
      var obj = evt.obj || "T";
      var args = evt.args || {};
      var ids = args.ids || [];
      var map = ctx.btreeNodes[obj] || {};
      if (!ctx.btreeMarkedIds[obj]) {
        ctx.btreeMarkedIds[obj] = {};
      }
      for (var i = 0; i < ids.length; i++) {
        var node = map[ids[i]];
        if (node) {
          unfocusTreeLikeNode(ctx, node);
          delete ctx.btreeMarkedIds[obj][ids[i]];
        }
      }
    },
    sync: function (ctx, evt) {
      var obj = evt.obj || "T";
      var args = evt.args || {};
      renderSyncTree(ctx, obj, args);
    }
  };

  var graphOpHandlers = {
    init: function (ctx, evt) {
      var obj = evt.obj || "G";
      var args = evt.args || {};
      ctx.graphDirected[obj] = !!args.directed;
      ensureGraph(ctx, obj);
      markGraphLayout(ctx, obj, true);
    },
    new_node: function (ctx, evt) {
      var obj = evt.obj || "G";
      var args = evt.args || {};
      var id = args.id;
      if (!id) return;
      var meta = ensureGraphNodeMeta(ctx, obj, id);
      if (args.value !== undefined) meta.value = normalizeTraceTextValue(args.value);
      if (args.color !== undefined) meta.color = args.color;
      updateGraphNode(ctx, obj, id);
      markGraphLayout(ctx, obj, true);
    },
    remove_node: function (ctx, evt) {
      var obj = evt.obj || "G";
      var args = evt.args || {};
      var id = args.id;
      if (!id) return;
      ensureGraph(ctx, obj);
      var node = ctx.graphNodes[obj][id];
      if (node) {
        ctx.graphs[obj].removeNode(node);
        delete ctx.graphNodes[obj][id];
      }
      var keys = Object.keys(ctx.graphEdges[obj] || {});
      for (var i = 0; i < keys.length; i++) {
        var rec = ctx.graphEdges[obj][keys[i]];
        if (rec && (rec.from === id || rec.to === id)) {
          delete ctx.graphEdges[obj][keys[i]];
          delete ctx.graphEdgeMarked[obj][keys[i]];
        }
      }
      delete ctx.graphMeta[obj][id];
      delete ctx.graphNodeMarked[obj][id];
      markGraphLayout(ctx, obj, true);
    },
    set_node_value: function (ctx, evt) {
      var obj = evt.obj || "G";
      var args = evt.args || {};
      var id = args.id;
      if (!id) return;
      var meta = ensureGraphNodeMeta(ctx, obj, id);
      meta.value = normalizeTraceTextValue(args.value);
      updateGraphNode(ctx, obj, id);
      relayoutIncidentGraphEdges(ctx, obj, id);
    },
    set_node_color: function (ctx, evt) {
      var obj = evt.obj || "G";
      var args = evt.args || {};
      var id = args.id;
      if (!id) return;
      var meta = ensureGraphNodeMeta(ctx, obj, id);
      meta.color = args.color || "black";
      updateGraphNode(ctx, obj, id);
    },
    mark_node: function (ctx, evt) {
      var obj = evt.obj || "G";
      var args = evt.args || {};
      var id = args.id;
      if (!id) return;
      var node = ensureGraphNode(ctx, obj, id);
      if (node) {
        node.highlight();
        ctx.graphNodeMarked[obj][id] = true;
      }
    },
    unmark_node: function (ctx, evt) {
      var obj = evt.obj || "G";
      var args = evt.args || {};
      var id = args.id;
      if (!id) return;
      var node = ensureGraphNode(ctx, obj, id);
      if (node) {
        node.unhighlight();
      }
      delete ctx.graphNodeMarked[obj][id];
    },
    new_edge: function (ctx, evt) {
      var obj = evt.obj || "G";
      var args = evt.args || {};
      var fromId = args.from, toId = args.to;
      if (!fromId || !toId) return;
      var e = ensureGraphEdge(ctx, obj, fromId, toId);
      if (!e) return;
      var rec = ensureGraphEdgeRecord(ctx, obj, fromId, toId);
      if (args.label !== undefined && args.label !== null) {
        rec.label = String(args.label);
        e.label(rec.label);
        setGraphEdgeLabelVisible(rec, false);
      }
      if (args.style && typeof args.style === "object") {
        rec.style = {
          color: args.style.color,
          width: args.style.width,
          dash: args.style.dash
        };
        applyGraphEdgeVisualState(rec);
      }
      markGraphLayout(ctx, obj, true);
    },
    remove_edge: function (ctx, evt) {
      var obj = evt.obj || "G";
      var args = evt.args || {};
      var fromId = args.from, toId = args.to;
      if (!fromId || !toId) return;
      ensureGraph(ctx, obj);
      var key = graphEdgeKey(fromId, toId);
      var rec = ctx.graphEdges[obj][key];
      if (rec && rec.edge) {
        ctx.graphs[obj].removeEdge(rec.edge);
      } else {
        var fromNode = ctx.graphNodes[obj][fromId];
        var toNode = ctx.graphNodes[obj][toId];
        if (fromNode && toNode) {
          var edge = ctx.graphs[obj].getEdge(fromNode, toNode);
          if (edge) {
            ctx.graphs[obj].removeEdge(edge);
          }
        }
      }
      delete ctx.graphEdges[obj][key];
      delete ctx.graphEdgeMarked[obj][key];
      markGraphLayout(ctx, obj, true);
    },
    set_edge_label: function (ctx, evt) {
      var obj = evt.obj || "G";
      var args = evt.args || {};
      var fromId = args.from, toId = args.to;
      if (!fromId || !toId) return;
      var e = ensureGraphEdge(ctx, obj, fromId, toId);
      if (!e) return;
      var rec = ensureGraphEdgeRecord(ctx, obj, fromId, toId);
      rec.label = (args.label === undefined || args.label === null) ? "" : String(args.label);
      e.label(rec.label);
      // Visibility is controlled by traversal lifecycle (mark_edge/unmark_edge),
      // not by label updates.
      if (typeof e.layout === "function") {
        e.layout();
      }
    },
    set_edge_weight: function (ctx, evt) {
      graphOpHandlers.set_edge_label(ctx, evt);
    },
    set_edge_style: function (ctx, evt) {
      var obj = evt.obj || "G";
      var args = evt.args || {};
      var fromId = args.from, toId = args.to;
      if (!fromId || !toId) return;
      var e = ensureGraphEdge(ctx, obj, fromId, toId);
      if (!e) return;
      var rec = ensureGraphEdgeRecord(ctx, obj, fromId, toId);
      rec.style = {
        color: (args.color === undefined) ? null : args.color,
        width: (args.width === undefined) ? null : args.width,
        dash: (args.dash === undefined) ? null : args.dash
      };
      applyGraphEdgeVisualState(rec);
      if (typeof e.layout === "function") {
        e.layout();
      }
    },
    mark_edge: function (ctx, evt) {
      var obj = evt.obj || "G";
      var args = evt.args || {};
      var fromId = args.from, toId = args.to;
      if (!fromId || !toId) return;
      var rec = ensureGraphEdgeRecord(ctx, obj, fromId, toId);
      var e = ensureGraphEdge(ctx, obj, fromId, toId);
      if (!e) return;
      rec.markStyle = {
        color: (args.color === undefined) ? "#f59e0b" : args.color,
        width: (args.width === undefined) ? 4 : args.width,
        dash: (args.dash === undefined) ? "" : args.dash
      };
      rec.marked = true;
      rec.labelPinned = true;
      applyGraphEdgeVisualState(rec);
      setGraphEdgeLabelVisible(rec, true);
      ctx.graphEdgeMarked[obj][graphEdgeKey(fromId, toId)] = true;
    },
    unmark_edge: function (ctx, evt) {
      var obj = evt.obj || "G";
      var args = evt.args || {};
      var fromId = args.from, toId = args.to;
      if (!fromId || !toId) return;
      var rec = ensureGraphEdgeRecord(ctx, obj, fromId, toId);
      var e = ensureGraphEdge(ctx, obj, fromId, toId);
      if (e) {
        rec.marked = false;
        rec.markStyle = null;
        applyGraphEdgeVisualState(rec);
        rec.labelPinned = false;
        setGraphEdgeLabelVisible(rec, false);
      }
      delete ctx.graphEdgeMarked[obj][graphEdgeKey(fromId, toId)];
    },
    force_layout: function (ctx, evt) {
      var obj = evt.obj || "G";
      markGraphRelayout(ctx, obj);
    }
  };

  var stateOpHandlers = {
    init: function (ctx, evt) {
      var obj = evt.obj || "S";
      var args = evt.args || {};
      var rows = Math.max(1, Number(args.rows) || 1);
      var cols = Math.max(1, Number(args.cols) || 1);
      ensureStateMatrix(ctx, obj, args.kind || "table", rows, cols, args);
      markStateLayout(ctx, obj);
    },
    set: function (ctx, evt) {
      var obj = evt.obj || "S";
      var args = evt.args || {};
      var row = Number(args.row);
      var col = Number(args.col);
      if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0) {
        return;
      }
      var rec = ctx.states[obj];
      var matrix = rec ? rec.matrix : ensureStateMatrix(ctx, obj, "table", row + 1, col + 1);
      if (row >= (ctx.states[obj].rows || 0) || col >= (ctx.states[obj].cols || 0)) {
        return;
      }
      matrix.value(row, col, normalizeStateValue(args.value));
      matrix.css(row, col, { "font-weight": "700" });
      markStateLayout(ctx, obj);
    },
    focus: function (ctx, evt) {
      var obj = evt.obj || "S";
      var args = evt.args || {};
      var row = Number(args.row);
      var col = Number(args.col);
      if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0) {
        return;
      }
      var rec = ctx.states[obj];
      if (!rec) {
        ensureStateMatrix(ctx, obj, "table", row + 1, col + 1);
        rec = ctx.states[obj];
      }
      if (row >= rec.rows || col >= rec.cols) {
        return;
      }
      var role = args.role || "focus";
      var style = ctx.stateFocusStyles[role] || ctx.stateFocusStyles.focus;
      rec.matrix.css(row, col, style);
      if (!ctx.stateFocusCells[obj]) {
        ctx.stateFocusCells[obj] = [];
      }
      ctx.stateFocusCells[obj].push({ row: row, col: col });
    },
    clear_focus: function (ctx, evt) {
      clearStateFocus(ctx, evt.obj || "S");
    },
    history_append: function (ctx, evt) {
      var obj = evt.obj || "S";
      var args = evt.args || {};
      var row = Number(args.row);
      var col = Number(args.col);
      if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0) {
        return;
      }
      if (!ctx.states[obj]) {
        ensureStateMatrix(ctx, obj, "table", row + 1, col + 1);
      }
      if (!ctx.stateHistory[obj]) {
        ctx.stateHistory[obj] = {};
      }
      var key = stateCellKey(row, col);
      if (!ctx.stateHistory[obj][key]) {
        ctx.stateHistory[obj][key] = [];
      }
      ctx.stateHistory[obj][key].push({
        value: args.value,
        note: args.note || "",
        seq: (ctx.__currentEvt && typeof ctx.__currentEvt.seq === "number") ? ctx.__currentEvt.seq : null
      });
      setStateCellTitle(ctx, obj, row, col);
    },
    seq_push: function (ctx, evt) {
      var obj = evt.obj || "SEQ";
      var args = evt.args || {};
      if (!ctx.stateSequences[obj]) {
        ctx.stateSequences[obj] = { values: [], arr: null, version: 0 };
      }
      ctx.stateSequences[obj].values.push(normalizeStateValue(args.value));
      renderStateSequence(ctx, obj);
    },
    seq_pop: function (ctx, evt) {
      var obj = evt.obj || "SEQ";
      if (!ctx.stateSequences[obj]) {
        ctx.stateSequences[obj] = { values: [], arr: null, version: 0 };
      }
      if (ctx.stateSequences[obj].values.length > 0) {
        ctx.stateSequences[obj].values.shift();
      }
      renderStateSequence(ctx, obj);
    },
    seq_clear: function (ctx, evt) {
      var obj = evt.obj || "SEQ";
      if (!ctx.stateSequences[obj]) {
        ctx.stateSequences[obj] = { values: [], arr: null, version: 0 };
      }
      ctx.stateSequences[obj].values = [];
      renderStateSequence(ctx, obj);
    }
  };

  function playDSTrace(jsav, events, options) {
    options = options || {};
    var stepDedupeDebug = !!options.stepDedupeDebug;
    var animationSpeed = (options.animationSpeed === false)
      ? null
      : (typeof options.animationSpeed === "number" ? options.animationSpeed : 150);

    function applyAnimationSpeed(jsavInstance) {
      if (!jsavInstance || animationSpeed === null) {
        return;
      }
      jsavInstance.SPEED = animationSpeed;
      if (typeof window !== "undefined" && window.JSAV && window.JSAV.ext) {
        window.JSAV.ext.SPEED = animationSpeed;
      }
    }

    function sortedKeys(obj) {
      return Object.keys(obj || {}).sort();
    }

    function snapshotArray(arr) {
      var out = [];
      if (!arr || typeof arr.value !== "function") {
        return out;
      }
      var n = 0;
      if (typeof arr.size === "function") {
        n = arr.size();
      } else if (arr._values && arr._values.length) {
        n = arr._values.length;
      }
      for (var i = 0; i < n; i++) {
        out.push(arr.value(i));
      }
      return out;
    }

    function findNodeIdByRef(map, ids, ref) {
      if (!ref) {
        return null;
      }
      for (var i = 0; i < ids.length; i++) {
        var id = ids[i];
        if (map[id] === ref) {
          return id;
        }
      }
      return null;
    }

    function captureStateHash(ctx) {
      function sortedOwnKeys(obj) {
        return Object.keys(obj || {}).sort();
      }
      var snap = { arrays: {}, btrees: {}, trees: {}, graphs: {} };
      var arrObjs = sortedKeys(ctx.arrays);
      for (var ai = 0; ai < arrObjs.length; ai++) {
        var aobj = arrObjs[ai];
        snap.arrays[aobj] = {
          values: snapshotArray(ctx.arrays[aobj]),
          focus: (ctx.arrayFocusIndices[aobj] || []).slice(),
          marks: sortedOwnKeys(ctx.arrayMarkedIndices[aobj] || {})
        };
      }

      var treeObjs = sortedKeys(ctx.btrees);
      for (var ti = 0; ti < treeObjs.length; ti++) {
        var tobj = treeObjs[ti];
        var t = ctx.btrees[tobj];
        var map = ctx.btreeNodes[tobj] || {};
        var ids = sortedKeys(map);
        var nodes = {};
        for (var ni = 0; ni < ids.length; ni++) {
          var id = ids[ni];
          var node = map[id];
          var lref = (node && typeof node.left === "function") ? node.left() : null;
          var rref = (node && typeof node.right === "function") ? node.right() : null;
          var meta = (ctx.btreeMeta[tobj] && ctx.btreeMeta[tobj][id]) || {};
          nodes[id] = {
            left: findNodeIdByRef(map, ids, lref),
            right: findNodeIdByRef(map, ids, rref),
            value: meta.value,
            note: meta.note,
            color: meta.color,
            hidden: !!(ctx.btreeHiddenState[tobj] && ctx.btreeHiddenState[tobj][id])
          };
        }
        var ghost = ctx.btreeGhost[tobj];
        var rootRef = (ghost && typeof ghost.left === "function") ? ghost.left() : null;
        var rootId = findNodeIdByRef(map, ids, rootRef);
        snap.btrees[tobj] = {
          root: rootId || null,
          nodes: nodes,
          marks: sortedOwnKeys(ctx.btreeMarkedIds[tobj] || {})
        };
      }
      var generalTreeObjs = sortedKeys(ctx.trees);
      for (var gti = 0; gti < generalTreeObjs.length; gti++) {
        var gtobj = generalTreeObjs[gti];
        var gt = ctx.trees[gtobj];
        var gmap = ctx.treeNodes[gtobj] || {};
        var gids = sortedKeys(gmap);
        var gnodes = {};
        for (var gni = 0; gni < gids.length; gni++) {
          var gid = gids[gni];
          var gnode = gmap[gid];
          var chrefs = (gnode && typeof gnode.children === "function") ? (gnode.children() || []) : [];
          var childIds = [];
          for (var ci = 0; ci < chrefs.length; ci++) {
            childIds.push(findNodeIdByRef(gmap, gids, chrefs[ci]));
          }
          var gmeta = (ctx.treeMeta[gtobj] && ctx.treeMeta[gtobj][gid]) || {};
          gnodes[gid] = {
            children: childIds,
            value: gmeta.value,
            note: gmeta.note,
            color: gmeta.color,
            hidden: !!(ctx.treeHiddenState[gtobj] && ctx.treeHiddenState[gtobj][gid])
          };
        }
        var gghost = ctx.treeGhost[gtobj];
        var rootRefs = (gghost && typeof gghost.children === "function") ? (gghost.children() || []) : [];
        var grootIds = [];
        for (var gri = 0; gri < rootRefs.length; gri++) {
          var rid = findNodeIdByRef(gmap, gids, rootRefs[gri]);
          if (rid) {
            grootIds.push(rid);
          }
        }
        snap.trees[gtobj] = {
          roots: grootIds,
          nodes: gnodes,
          marks: sortedOwnKeys(ctx.treeMarkedIds[gtobj] || {})
        };
      }
      var graphObjs = sortedKeys(ctx.graphs);
      for (var gi = 0; gi < graphObjs.length; gi++) {
        var gobj = graphObjs[gi];
        var gmeta = ctx.graphMeta[gobj] || {};
        var gnodes = {};
        var nids = sortedKeys(ctx.graphNodes[gobj] || {});
        for (var ni2 = 0; ni2 < nids.length; ni2++) {
          var nid = nids[ni2];
          var nm = gmeta[nid] || {};
          gnodes[nid] = {
            value: nm.value,
            color: nm.color
          };
        }
        var gedges = {};
        var ekeys = sortedKeys(ctx.graphEdges[gobj] || {});
        for (var ei = 0; ei < ekeys.length; ei++) {
          var ek = ekeys[ei];
          var er = ctx.graphEdges[gobj][ek] || {};
          gedges[ek] = {
            from: er.from || null,
            to: er.to || null,
            label: (er.label === undefined || er.label === null) ? "" : String(er.label),
            style: er.style || null,
            marked: !!er.marked
          };
        }
        snap.graphs[gobj] = {
          directed: !!ctx.graphDirected[gobj],
          nodes: gnodes,
          edges: gedges,
          nodeMarks: sortedOwnKeys(ctx.graphNodeMarked[gobj] || {})
        };
      }
      return JSON.stringify(snap);
    }

    function isJSAVInstance(obj) {
      return !!(obj && typeof obj.displayInit === "function" && typeof obj.recorded === "function" && obj.ds);
    }

    function playSingleContext(jsavInstance, ctxEvents, ctxName, jsavVarName) {
      applyAnimationSpeed(jsavInstance);
      if (jsavInstance && jsavInstance.container && jsavInstance.container.length) {
        if (!jsavInstance.container.find(".jsavoutput").length) {
          jsavInstance.container.append("<p class='jsavoutput jsavline'></p>");
        }
      }
      var ctx = createContext(jsavInstance, {
        debugRuntimeApi: !!options.debugRuntimeApi,
        jsavVarName: jsavVarName || "jsav"
      }, ctxName || "default");
      var stepMap = [];
      var stepDedupeLog = [];
      var pendingNavEvents = [];
      var frameSeq = 0;

      function normalizeLoc(loc) {
        if (!loc) {
          return null;
        }
        var file = loc.file || "";
        var line = (typeof loc.line === "number") ? loc.line : null;
        var func = loc.func || "";
        if (!file && line === null && !func) {
          return null;
        }
        return { file: file, line: line, func: func };
      }

      function pushNavEvent(evt) {
        if (!evt) {
          return;
        }
        var loc = normalizeLoc(evt.loc);
        if (!loc) {
          return;
        }
        pendingNavEvents.push({
          seq: (typeof evt.seq === "number") ? evt.seq : null,
          ds: evt.ds || "",
          op: evt.op || "",
          file: loc.file,
          line: loc.line,
          func: loc.func
        });
      }

      function buildFileSpans(locList) {
        var spansByFile = {};
        var order = [];
        for (var i = 0; i < locList.length; i++) {
          var loc = locList[i];
          if (!loc || !loc.file || typeof loc.line !== "number") {
            continue;
          }
          if (!spansByFile[loc.file]) {
            spansByFile[loc.file] = {
              file: loc.file,
              lineStart: loc.line,
              lineEnd: loc.line
            };
            order.push(loc.file);
          } else {
            if (loc.line < spansByFile[loc.file].lineStart) {
              spansByFile[loc.file].lineStart = loc.line;
            }
            if (loc.line > spansByFile[loc.file].lineEnd) {
              spansByFile[loc.file].lineEnd = loc.line;
            }
          }
        }
        var spans = [];
        for (var oi = 0; oi < order.length; oi++) {
          spans.push(spansByFile[order[oi]]);
        }
        return spans;
      }

      function isHelperLoc(loc) {
        var file = (loc && loc.file ? String(loc.file) : "").replace(/\\/g, "/").toLowerCase();
        if (!file) {
          return true;
        }
        return file.indexOf("_vis.hpp") !== -1 ||
          file.indexOf("/vis_trace.hpp") !== -1 ||
          file.indexOf("\\vis_trace.hpp") !== -1;
      }

      function choosePrimaryLoc(locList, stepEvt) {
        var triggerLoc = normalizeLoc(stepEvt && stepEvt.loc);
        if (triggerLoc && !isHelperLoc(triggerLoc)) {
          return {
            file: triggerLoc.file,
            line: triggerLoc.line,
            func: triggerLoc.func
          };
        }
        for (var i = locList.length - 1; i >= 0; i--) {
          var loc = locList[i];
          if (loc && !isHelperLoc(loc)) {
            return {
              file: loc.file,
              line: loc.line,
              func: loc.func
            };
          }
        }
        if (triggerLoc) {
          return {
            file: triggerLoc.file,
            line: triggerLoc.line,
            func: triggerLoc.func
          };
        }
        if (locList.length) {
          var last = locList[locList.length - 1];
          return {
            file: last.file,
            line: last.line,
            func: last.func
          };
        }
        return null;
      }

      function cloneCurrentMessage() {
        if (!ctx.currentMessage) {
          return null;
        }
        return {
          text: ctx.currentMessage.text || "",
          clear: !!ctx.currentMessage.clear,
          kind: ctx.currentMessage.kind || "",
          phase: ctx.currentMessage.phase || "",
          refs: ctx.currentMessage.refs || null,
          options: ctx.currentMessage.options || null,
          seq: (typeof ctx.currentMessage.seq === "number") ? ctx.currentMessage.seq : null
        };
      }

      function commitFrame(reason, stepEvt) {
        frameSeq += 1;
        var locList = [];
        var seen = {};
        var seqStart = null;
        var seqEnd = null;
        for (var i = 0; i < pendingNavEvents.length; i++) {
          var item = pendingNavEvents[i];
          var dedupeKey = (item.seq !== null)
            ? ("seq:" + item.seq)
            : ("loc:" + item.file + ":" + item.line + ":" + item.func + ":" + item.ds + ":" + item.op);
          if (seen[dedupeKey]) {
            continue;
          }
          seen[dedupeKey] = true;
          locList.push({
            seq: item.seq,
            file: item.file,
            line: item.line,
            func: item.func,
            ds: item.ds,
            op: item.op
          });
          if (typeof item.seq === "number") {
            if (seqStart === null || item.seq < seqStart) {
              seqStart = item.seq;
            }
            if (seqEnd === null || item.seq > seqEnd) {
              seqEnd = item.seq;
            }
          }
        }
        var primaryLoc = choosePrimaryLoc(locList, stepEvt);
        stepMap.push({
          frame: frameSeq,
          ctx: ctxName || "default",
          reason: reason || "step",
          seqStart: seqStart,
          seqEnd: seqEnd,
          trigger: stepEvt ? {
            seq: (typeof stepEvt.seq === "number") ? stepEvt.seq : null,
            ds: stepEvt.ds || "",
            op: stepEvt.op || ""
          } : null,
          message: cloneCurrentMessage(),
          primaryLoc: primaryLoc,
          locList: locList,
          fileSpans: buildFileSpans(locList)
        });
        pendingNavEvents = [];
      }

      if (animationSpeed !== null) {
        debugPush(ctx, (ctx.debug.jsavVarName || "jsav") + ".SPEED = " + Number(animationSpeed) + ";");
        debugPush(ctx, "JSAV.ext.SPEED = " + Number(animationSpeed) + ";");
      }
      debugPush(ctx, (ctx.debug.jsavVarName || "jsav") + ".displayInit();");
      jsavInstance.displayInit();
      for (var i = 0; i < ctxEvents.length; i++) {
        var evt = ctxEvents[i];
        ctx.__currentEvt = evt || null;
        if (evt && evt.ds) {
          var dsHandler = dsHandlers[evt.ds];
          if (dsHandler) {
            dsHandler(ctx, evt);
          }
        }
        pushNavEvent(evt);
        if (evt && evt.step) {
          flushPendingLayouts(ctx);
          debugPush(ctx, (ctx.debug.jsavVarName || "jsav") + ".step();");
          jsavInstance.step();
          commitFrame("step", evt);
          if (stepDedupeDebug) {
              stepDedupeLog.push({
                seq: (typeof evt.seq === "number") ? evt.seq : null,
                ds: evt.ds || "",
                op: evt.op || "",
                decision: "commit",
                reason: "dedupe_removed"
              });
          }
        }
      }
      ctx.__currentEvt = null;
      flushPendingLayouts(ctx);
      debugPush(ctx, (ctx.debug.jsavVarName || "jsav") + ".recorded();");
      jsavInstance.recorded();
      return {
        debugLines: (ctx.debug && ctx.debug.enabled) ? ctx.debug.lines.slice() : [],
        stepMap: stepMap,
        stepDedupeLog: stepDedupeLog
      };
    }

    if (isJSAVInstance(jsav)) {
      var singleCtxName = options.ctxName || (((events && events[0] && events[0].ctx) ? events[0].ctx : "default"));
      var singleResult = playSingleContext(jsav, events || [], singleCtxName, options.jsavVarName || "jsav");
      var linesSingle = singleResult.debugLines || [];
      if (options.debugRuntimeApi) {
        window.__DSA_LAST_RUNTIME_API_LOG = linesSingle.join("\n");
        if (options.printRuntimeApiLog && window.console && typeof window.console.log === "function") {
          window.console.log(window.__DSA_LAST_RUNTIME_API_LOG);
        }
      }
      window.__DSA_LAST_STEP_MAP = singleResult.stepMap || [];
      window.__DSA_LAST_STEP_DEDUPE_LOG = singleResult.stepDedupeLog || [];
      return;
    }

    var $host = (jsav && jsav.constructor === jQuery) ? jsav : $(jsav);
    if (!$host || !$host.length) {
      throw new Error("playDSTrace: invalid host container");
    }
    $host.empty();

    var groups = {};
    var order = [];
    for (var ei = 0; ei < (events || []).length; ei++) {
      var ev = events[ei] || {};
      var key = ev.ctx || "default";
      if (!groups[key]) {
        groups[key] = [];
        order.push(key);
      }
      groups[key].push(ev);
    }

    var allDebugSections = [];
    var allStepMaps = [];
    var allStepDedupeLogs = [];
    for (var gi = 0; gi < order.length; gi++) {
      var ctxName = order[gi];
      var $panel = $("<div class='dstrace-context-panel'></div>");
      var $title = $("<div class='dstrace-context-title'></div>").text("Context: " + ctxName);
      var panelId = "dstrace_ctx_" + gi;
      var $av = $("<div></div>").attr("id", panelId).append("<div class='jsavcontrols'></div><span class='jsavcounter'></span><p class='jsavoutput jsavline'></p>");
      $panel.append($title).append($av);
      $host.append($panel);
      var jsavInstance = new JSAV(panelId);
      var jsavVarName = "jsav_" + debugToken(ctxName) + "_" + gi;
      var ctxResult = playSingleContext(jsavInstance, groups[ctxName], ctxName, jsavVarName);
      var dbgLines = ctxResult.debugLines || [];
      allStepMaps.push({
        ctx: ctxName,
        frames: ctxResult.stepMap || []
      });
      allStepDedupeLogs.push({
        ctx: ctxName,
        records: ctxResult.stepDedupeLog || []
      });
      if (options.debugRuntimeApi) {
        allDebugSections.push("// Context: " + ctxName);
        for (var di = 0; di < dbgLines.length; di++) {
          allDebugSections.push(dbgLines[di]);
        }
        allDebugSections.push("");
      }
    }
      if (options.debugRuntimeApi) {
        window.__DSA_LAST_RUNTIME_API_LOG = allDebugSections.join("\n");
        if (options.printRuntimeApiLog && window.console && typeof window.console.log === "function") {
          window.console.log(window.__DSA_LAST_RUNTIME_API_LOG);
        }
      }
      window.__DSA_LAST_STEP_MAP = allStepMaps;
      window.__DSA_LAST_STEP_DEDUPE_LOG = allStepDedupeLogs;
    }

  function buildDSTraceFromRuntimeExecution(events, options) {
    options = options || {};
    if (typeof document === "undefined") {
      throw new Error("buildDSTraceFromRuntimeExecution requires a browser environment");
    }
    var hostId = options.hostId || "__dsa_runtime_export_host__";
    var host = document.getElementById(hostId);
    if (!host) {
      host = document.createElement("div");
      host.id = hostId;
      host.style.display = "none";
      document.body.appendChild(host);
    }
    playDSTrace(host, events || [], {
      debugRuntimeApi: true,
      printRuntimeApiLog: false
    });
    return window.__DSA_LAST_RUNTIME_API_LOG || "";
  }

  window.parseDSTraceJSONL = parseDSTraceJSONL;
  window.playDSTrace = playDSTrace;
  window.buildDSTraceFromRuntimeExecution = buildDSTraceFromRuntimeExecution;
  // Keep legacy names for compatibility, but route all static export to the
  // runtime-bound recorder so exported JS always mirrors actual playback calls.
  window.buildDSTraceJSAVCode = buildDSTraceFromRuntimeExecution;
  window.buildDSTraceFlatJSAVCode = buildDSTraceFromRuntimeExecution;
  window.printDSTraceJSAVCode = function (events, options) {
    var code = buildDSTraceFromRuntimeExecution(events, options);
    window.__DSA_LAST_JSAV_CODE = code;
    if (window.console && typeof window.console.log === "function") {
      window.console.log(code);
    }
    return code;
  };
  window.printDSTraceJSONLAsJSAVCode = function (text, options) {
    var events = parseDSTraceJSONL(text || "");
    return window.printDSTraceJSAVCode(events, options);
  };
  window.printDSTraceFlatJSAVCode = function (events, options) {
    var code = buildDSTraceFromRuntimeExecution(events, options);
    window.__DSA_LAST_JSAV_CODE = code;
    if (window.console && typeof window.console.log === "function") {
      window.console.log(code);
    }
    return code;
  };
  window.printDSTraceJSONLAsFlatJSAVCode = function (text, options) {
    var events = parseDSTraceJSONL(text || "");
    return window.printDSTraceFlatJSAVCode(events, options);
  };
  window.printDSTraceRuntimeJSAVCode = function (events, options) {
    var code = buildDSTraceFromRuntimeExecution(events, options);
    window.__DSA_LAST_JSAV_CODE = code;
    if (window.console && typeof window.console.log === "function") {
      window.console.log(code);
    }
    return code;
  };
  window.printDSTraceJSONLAsRuntimeJSAVCode = function (text, options) {
    var events = parseDSTraceJSONL(text || "");
    return window.printDSTraceRuntimeJSAVCode(events, options);
  };
  window.playDSTraceByContext = function (host, events) {
    return playDSTrace(host, events);
  };
  window.getLastRuntimeApiLog = function () {
    return window.__DSA_LAST_RUNTIME_API_LOG || "";
  };
  window.getLastStepMap = function () {
    return window.__DSA_LAST_STEP_MAP || [];
  };
  window.__DSA_TRACE_PLAYER_VERSION = "2026-05-24-graph-label-hover-no-patch-1";
})();
