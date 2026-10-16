// Visualização do algoritmo de Huffman (pseudocódigo da aula 22).
// Toda a execução é pré-calculada como uma lista de passos (snapshots);
// avançar/voltar apenas escolhe qual passo desenhar. As posições dos nodos
// são interpoladas entre passos para mostrar as árvores se juntando.
(function () {
  'use strict';

  const { EXAMPLES, parseInput, randomExample, resolve } = window.HuffmanExamples;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const R = 24;        // raio dos nodos (unidades do SVG)
  const DX = 74;       // distância horizontal entre folhas vizinhas
  const GAP = 34;      // espaço extra entre árvores da floresta
  const DY = 86;       // distância vertical entre níveis
  const MX = 56;       // margem horizontal
  const TOP = 64;      // espaço acima das raízes (rótulos T1, T2, T3)
  const BOTTOM = 88;   // espaço abaixo das folhas (peso e código)
  const ANIM_MS = 480;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = id => document.getElementById(id);
  const ui = {
    layout: $('layout'),
    svg: $('forest'),
    exampleName: $('exampleName'),
    forestSize: $('forestSize'),
    alphabetSize: $('alphabetSize'),
    heap: $('heap'),
    codeBody: $('codeBody'),
    cost: $('cost'),
    message: $('message'),
    stepCounter: $('stepCounter'),
    progressBar: $('progressBar'),
    pseudoPanel: $('pseudoPanel'),
    pseudoBtn: $('pseudoBtn'),
    examplesBtn: $('examplesBtn'),
    examplesMenu: $('examplesMenu'),
    exampleList: $('exampleList'),
    customForm: $('customForm'),
    customInput: $('customInput'),
    customHint: $('customHint'),
    symbolCount: $('symbolCount'),
    symbolCountValue: $('symbolCountValue'),
    randomBtn: $('randomBtn'),
    helpBtn: $('helpBtn'),
    helpDialog: $('helpDialog'),
    resetBtn: $('resetBtn'),
    prevBtn: $('prevBtn'),
    nextBtn: $('nextBtn'),
    autoBtn: $('autoBtn'),
    speedSelect: $('speedSelect')
  };

  let run = null;       // execução atual: nodos, passos e dimensões do desenho
  let steps = [];       // snapshots da execução
  let current = 0;      // passo exibido
  let timer = null;     // execução automática
  let hovered = null;   // símbolo cujo caminho está destacado
  const view = { nodes: new Map(), edges: new Map(), shown: new Map(), layers: null, raf: 0 };

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = x => (Number.isInteger(x) ? String(x) : x.toLocaleString('pt-BR', { maximumFractionDigits: 2 }));
  const dec2 = x => x.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const T = k => `<i>T</i><sub>${k}</sub>`;

  // ── Execução (pseudocódigo Huffman do slide da aula 22) ────────────────
  // Linhas: 1–3 cria as árvores unitárias, 4 monta F, 5 laço, 6–7 escolhe
  // T1 e T2, 8–11 compõe T3, 12 retorna. Empates de P são desfeitos pela
  // ordem de criação das árvores.

  function buildRun(def) {
    const nodes = [];
    const make = (sym, w, left, right) => {
      const leaf = sym !== null;
      const node = {
        id: nodes.length, sym, w, left, right,
        leaves: leaf ? [sym] : nodes[left].leaves.concat(nodes[right].leaves),
        height: leaf ? 0 : 1 + Math.max(nodes[left].height, nodes[right].height)
      };
      nodes.push(node);
      return node.id;
    };

    const symbols = def.symbols.map(([sym, w]) => ({ sym, w }));
    const leafOf = {};
    symbols.forEach(s => { leafOf[s.sym] = make(s.sym, s.w, null, null); });
    const n = symbols.length;
    const sum = symbols.reduce((acc, s) => acc + s.w, 0);
    const swap = new Set(def.swap || []);
    const codes = Object.fromEntries(symbols.map(s => [s.sym, '']));
    const sums = [];
    const out = [];
    let F = symbols.map(s => leafOf[s.sym]);

    const ref = id => {
      const node = nodes[id];
      if (node.sym !== null) return `<span class="ref">${esc(node.sym)}</span>`;
      const shown = node.leaves.slice(0, 5).map(esc).join(', ');
      return `<span class="ref">{${shown}${node.leaves.length > 5 ? ', …' : ''}}</span>`;
    };
    const snap = extra => out.push(Object.assign({
      F: F.slice(), codes: { ...codes }, sums: sums.slice(),
      t1: null, t2: null, t3: null
    }, extra));

    snap({
      phase: 'input',
      lines: ['in', 'out'],
      msg: `<b>Entrada:</b> alfabeto <i>Σ</i> com ${n} símbolos e seus pesos <i>p<sub>a</sub></i> (soma ${fmt(sum)}). ` +
        `<b>Saída:</b> uma <i>Σ</i>-árvore ótima, ou seja, um código <i>prefix-free</i> com o menor número médio de bits por símbolo.`
    });
    snap({
      phase: 'init',
      lines: [1, 2, 3, 4],
      msg: `<b>Linhas 1–4:</b> cada símbolo <i>a</i> vira uma árvore unitária <i>T<sub>a</sub></i> com <i>P</i>(<i>T<sub>a</sub></i>) = <i>p<sub>a</sub></i>. ` +
        `A floresta <i>F</i> começa com ${n} árvores. <span class="tip">Por enquanto todo código é vazio: o custo é 0.</span>`
    });

    let iter = 0;
    while (F.length >= 2) {
      iter++;
      const order = F.slice().sort((a, b) => (nodes[a].w - nodes[b].w) || (a - b));
      const [t1, t2] = order;
      const w1 = nodes[t1].w;
      const w2 = nodes[t2].w;
      const tie = order.slice(2).some(id => nodes[id].w === w2);
      snap({
        phase: 'select',
        lines: [5, 6, 7],
        t1, t2,
        msg: `<b>Linhas 5–7:</b> <i>F</i> tem ${F.length} árvores. ${T(1)} = ${ref(t1)} tem o menor peso (<i>P</i> = ${fmt(w1)}) ` +
          `e ${T(2)} = ${ref(t2)} tem o segundo menor (<i>P</i> = ${fmt(w2)}).` +
          (tie ? ' <span class="tip">Empate de pesos: escolhemos a árvore criada primeiro. Qualquer escolha gera um código ótimo.</span>' : '')
      });

      const swapped = swap.has(iter);
      const left = swapped ? t2 : t1;
      const right = swapped ? t1 : t2;
      const t3 = make(null, w1 + w2, left, right);
      nodes[left].leaves.forEach(s => { codes[s] = `0${codes[s]}`; });
      nodes[right].leaves.forEach(s => { codes[s] = `1${codes[s]}`; });
      const at = Math.min(F.indexOf(t1), F.indexOf(t2));
      F = F.filter(id => id !== t1 && id !== t2);
      F.splice(at, 0, t3);
      sums.push(w1 + w2);
      snap({
        phase: 'merge',
        lines: [8, 9, 10, 11],
        t1, t2, t3,
        msg: `<b>Linhas 8–11:</b> ${T(1)} e ${T(2)} saem de <i>F</i> e viram filhos de ${T(3)}, com <i>P</i>(${T(3)}) = ${fmt(w1)} + ${fmt(w2)} = <b>${fmt(w1 + w2)}</b>; ${T(3)} entra em <i>F</i>. ` +
          (swapped
            ? `Como nos slides, ${T(2)} fica à esquerda (bit 0) e ${T(1)} à direita (bit 1).`
            : `${T(1)} fica à esquerda (bit 0) e ${T(2)} à direita (bit 1).`) +
          ` <span class="tip">Os ${nodes[t3].leaves.length} símbolos de ${T(3)} ganham um bit à esquerda do código: o custo aumenta ${fmt(w1 + w2)}.</span>`
      });
    }

    const root = F[0];
    const cost = sums.reduce((a, b) => a + b, 0);
    const fixed = Math.ceil(Math.log2(n));
    snap({
      phase: 'done',
      lines: [5, 12],
      msg: `<b><i>F</i> tem uma única árvore: fim!</b> O código de cada símbolo é o caminho da raiz até a sua folha (esquerda = 0, direita = 1). ` +
        `Média: ${fmt(cost)} / ${fmt(sum)} ≈ <b>${dec2(cost / sum)}</b> bits por símbolo, contra ${fixed} bits de um código de tamanho fixo.`
    });

    return { def, nodes, leafOf, symbols, n, sum, cost, fixed, height: nodes[root].height, steps: out };
  }

  // ── Desenho da floresta ─────────────────────────────────────────────────

  function svgEl(tag, attrs, parent) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => el.setAttribute(k, v));
    if (parent) parent.appendChild(el);
    return el;
  }

  // Folhas em ordem (espaçadas de DX), nodo interno no meio dos filhos e
  // árvores alinhadas pela base, como nos slides.
  function layout(state) {
    const pos = new Map();
    const edges = [];
    const span = (run.n - 1) * DX + (state.F.length - 1) * GAP;
    let x = (run.VW - span) / 2;
    state.F.forEach(rootId => {
      const h = run.nodes[rootId].height;
      let i = 0;
      const place = (id, depth) => {
        const node = run.nodes[id];
        let px;
        if (node.sym !== null) {
          px = x + i * DX;
          i++;
        } else {
          px = (place(node.left, depth + 1) + place(node.right, depth + 1)) / 2;
          edges.push({ parent: id, child: node.left, bit: '0' }, { parent: id, child: node.right, bit: '1' });
        }
        pos.set(id, { x: px, y: run.base - (h - depth) * DY });
        return px;
      };
      place(rootId, 0);
      x += run.nodes[rootId].leaves.length * DX + GAP;
    });
    return { pos, edges };
  }

  function setupSvg() {
    cancelAnimationFrame(view.raf);
    ui.svg.innerHTML = '';
    ui.svg.setAttribute('viewBox', `0 0 ${run.VW} ${run.VH}`);
    view.layers = {
      edges: svgEl('g', { class: 'layer-edges' }, ui.svg),
      bits: svgEl('g', { class: 'layer-bits' }, ui.svg),
      nodes: svgEl('g', { class: 'layer-nodes' }, ui.svg)
    };
    view.nodes.clear();
    view.edges.clear();
    view.shown.clear();
  }

  function nodeEl(id, fresh) {
    if (view.nodes.has(id)) return view.nodes.get(id);
    const node = run.nodes[id];
    const leaf = node.sym !== null;
    const g = svgEl('g', { class: 'tnode' }, view.layers.nodes);
    svgEl('circle', { r: R + 8, class: 'ring' }, g);
    svgEl('circle', { r: R, class: 'body' }, g);
    const label = svgEl('text', { class: 'label' }, g);
    label.textContent = leaf ? node.sym : fmt(node.w);
    const size = label.textContent.length;
    if (size > 2) label.setAttribute('font-size', leaf ? 17 : Math.max(12, 21 - 3 * (size - 2)));
    const tag = svgEl('text', { y: -(R + 20), class: 'tag' }, g);
    let code = null;
    if (leaf) {
      const weight = svgEl('text', { y: R + 18, class: 'wt' }, g);
      weight.textContent = fmt(node.w);
      code = svgEl('text', { y: R + 41, class: 'code' }, g);
      g.addEventListener('mouseenter', () => setHover(node.sym));
      g.addEventListener('mouseleave', () => setHover(null));
    }
    const el = { g, tag, code, leaf };
    view.nodes.set(id, el);
    fresh.push(g);
    return el;
  }

  function edgeEl(edge, fresh) {
    if (view.edges.has(edge.child)) return view.edges.get(edge.child);
    const line = svgEl('line', { class: 'edge' }, view.layers.edges);
    const bit = svgEl('text', { class: 'bit' }, view.layers.bits);
    bit.textContent = edge.bit;
    const el = { line, bit, parent: edge.parent, b: edge.bit };
    view.edges.set(edge.child, el);
    fresh.push(line, bit);
    return el;
  }

  function subtree(id, acc) {
    acc.add(id);
    const node = run.nodes[id];
    if (node.sym === null) { subtree(node.left, acc); subtree(node.right, acc); }
    return acc;
  }

  // Conjuntos de nodos/arestas destacados no passo atual.
  function highlights(state, parentOf) {
    const h = { pick: new Set(), pickRoot: new Set(), newRoot: null, grew: new Set(), path: new Set(), tags: new Map() };
    if (state.phase === 'select') {
      subtree(state.t1, h.pick);
      subtree(state.t2, h.pick);
      h.pickRoot = new Set([state.t1, state.t2]);
      h.tags.set(state.t1, '1').set(state.t2, '2');
    } else if (state.phase === 'merge') {
      h.newRoot = state.t3;
      run.nodes[state.t3].leaves.forEach(s => h.grew.add(run.leafOf[s]));
      h.tags.set(state.t3, '3');
    }
    if (hovered !== null && state.phase !== 'input') {
      let cur = run.leafOf[hovered];
      while (cur !== undefined) { h.path.add(cur); cur = parentOf.get(cur); }
    }
    return h;
  }

  function applyClasses(state, edges) {
    const parentOf = new Map(edges.map(e => [e.child, e.parent]));
    const h = highlights(state, parentOf);
    const done = state.phase === 'done';

    view.nodes.forEach((el, id) => {
      const cls = ['tnode', el.leaf ? 'leaf' : 'internal'];
      if (state.phase === 'input') cls.push('raw');
      if (h.pick.has(id)) cls.push('pick');
      if (h.pickRoot.has(id)) cls.push('pick-root');
      if (id === h.newRoot) cls.push('new');
      if (h.grew.has(id)) cls.push('grew');
      if (h.path.has(id)) cls.push('path');
      el.g.setAttribute('class', cls.join(' '));

      const tag = h.tags.get(id);
      el.tag.innerHTML = tag ? `T<tspan class="sub" dy="6">${tag}</tspan>` : '';
      el.tag.setAttribute('class', tag === '3' ? 'tag new' : 'tag');

      if (el.code) {
        const sym = run.nodes[id].sym;
        const code = state.codes[sym];
        el.code.textContent = '';
        if (code) {
          if (h.grew.has(id)) {
            svgEl('tspan', { class: 'fresh' }, el.code).textContent = code[0];
            el.code.appendChild(document.createTextNode(code.slice(1)));
          } else {
            el.code.textContent = code;
          }
        }
        el.code.setAttribute('class', done ? 'code done' : 'code');
      }
    });

    view.edges.forEach((el, child) => {
      let kind = '';
      if (h.path.has(child)) kind = 'path';
      else if (el.parent === h.newRoot) kind = 'new';
      else if (h.pick.has(child)) kind = 'pick';
      el.line.setAttribute('class', `edge ${kind}`);
      el.bit.setAttribute('class', `bit ${kind}${done ? ' done' : ''}`);
    });

    ui.svg.classList.toggle('hovering', hovered !== null);
  }

  function placeEdge(el, child) {
    const a = view.shown.get(el.parent);
    const b = view.shown.get(child);
    el.line.setAttribute('x1', a.x.toFixed(1));
    el.line.setAttribute('y1', a.y.toFixed(1));
    el.line.setAttribute('x2', b.x.toFixed(1));
    el.line.setAttribute('y2', b.y.toFixed(1));
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    // Bit 0 à esquerda-acima da aresta, bit 1 à direita-acima.
    const [nx, ny] = el.b === '0' ? [-dy / len, dx / len] : [dy / len, -dx / len];
    el.bit.setAttribute('x', ((a.x + b.x) / 2 + nx * 16).toFixed(1));
    el.bit.setAttribute('y', ((a.y + b.y) / 2 + ny * 16).toFixed(1));
  }

  function animateTo(target, animate) {
    cancelAnimationFrame(view.raf);
    const from = new Map();
    target.forEach((p, id) => from.set(id, view.shown.get(id) || p));
    const draw = t => {
      const e = t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
      target.forEach((p, id) => {
        const f = from.get(id);
        const x = f.x + (p.x - f.x) * e;
        const y = f.y + (p.y - f.y) * e;
        view.shown.set(id, { x, y });
        view.nodes.get(id).g.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
      });
      view.edges.forEach(placeEdge);
    };
    if (!animate || reduceMotion) { draw(1); return; }
    const t0 = performance.now();
    const frame = now => {
      const t = Math.min(1, (now - t0) / ANIM_MS);
      draw(t);
      if (t < 1) view.raf = requestAnimationFrame(frame);
    };
    draw(0);
    view.raf = requestAnimationFrame(frame);
  }

  function renderForest(state, animate) {
    const { pos, edges } = layout(state);
    const keepEdges = new Set(edges.map(e => e.child));
    view.nodes.forEach((el, id) => {
      if (!pos.has(id)) { el.g.remove(); view.nodes.delete(id); view.shown.delete(id); }
    });
    view.edges.forEach((el, child) => {
      if (!keepEdges.has(child)) { el.line.remove(); el.bit.remove(); view.edges.delete(child); }
    });
    const fresh = [];
    edges.forEach(e => edgeEl(e, fresh));
    pos.forEach((p, id) => nodeEl(id, fresh));
    applyClasses(state, edges);
    // Elementos novos aparecem com um fade.
    if (animate && !reduceMotion) {
      fresh.forEach(el => el.classList.add('enter'));
      requestAnimationFrame(() => requestAnimationFrame(() => fresh.forEach(el => el.classList.remove('enter'))));
    }
    view.edgesNow = edges;
    animateTo(pos, animate);
  }

  // ── Painéis ─────────────────────────────────────────────────────────────

  function renderSets(state) {
    if (state.phase === 'input') {
      ui.forestSize.textContent = 'ainda não inicializada';
    } else {
      const k = state.F.length;
      ui.forestSize.textContent = k === 1 ? '1 árvore' : `${k} árvores`;
    }
    ui.alphabetSize.textContent = `${run.n} símbolos, soma dos pesos ${fmt(run.sum)}`;
  }

  function chipLabel(node) {
    const multi = node.leaves.some(s => s.length > 1);
    const parts = node.leaves.map(esc);
    const sep = multi ? ',' : '';
    return parts.length <= 4 ? parts.join(sep) : `${parts.slice(0, 3).join(sep)}…`;
  }

  function renderHeap(state) {
    if (state.phase === 'input') {
      ui.heap.innerHTML = '<p class="empty">ainda não inicializada</p>';
      return;
    }
    const chip = (id, cls, tag, title) => {
      const node = run.nodes[id];
      return `<div class="${cls.join(' ')}"${tag ? ` data-tag="T${tag}"` : ''} title="${esc(title)}">` +
        `<span class="chip-id">${chipLabel(node)}</span><span class="chip-key">${fmt(node.w)}</span></div>`;
    };
    const describe = node => `{${node.leaves.join(', ')}} com P = ${fmt(node.w)}`;
    const chips = [];
    if (state.phase === 'merge') {
      chips.push(chip(state.t1, ['chip', 'leaving'], '₁', `T1 saiu de F: ${describe(run.nodes[state.t1])}`));
      chips.push(chip(state.t2, ['chip', 'leaving'], '₂', `T2 saiu de F: ${describe(run.nodes[state.t2])}`));
    }
    state.F.slice().sort((a, b) => (run.nodes[a].w - run.nodes[b].w) || (a - b)).forEach(id => {
      const cls = ['chip'];
      let tag = null;
      if (state.phase === 'select' && id === state.t1) { cls.push('pick'); tag = '₁'; }
      if (state.phase === 'select' && id === state.t2) { cls.push('pick'); tag = '₂'; }
      if (state.phase === 'merge' && id === state.t3) { cls.push('changed'); tag = '₃'; }
      chips.push(chip(id, cls, tag, describe(run.nodes[id])));
    });
    ui.heap.innerHTML = chips.join('');
  }

  function renderCodes(state) {
    const pick = new Set();
    const grew = new Set();
    if (state.phase === 'select') {
      run.nodes[state.t1].leaves.forEach(s => pick.add(s));
      run.nodes[state.t2].leaves.forEach(s => pick.add(s));
    }
    if (state.phase === 'merge') run.nodes[state.t3].leaves.forEach(s => grew.add(s));
    const done = state.phase === 'done';
    ui.codeBody.innerHTML = run.symbols.map(({ sym, w }) => {
      const code = state.codes[sym];
      const cls = [];
      if (pick.has(sym)) cls.push('pick');
      if (grew.has(sym)) cls.push('changed');
      if (done) cls.push('done');
      if (sym === hovered) cls.push('hovered');
      let codeHtml = '–';
      if (code) codeHtml = grew.has(sym) ? `<span class="fresh">${code[0]}</span>${code.slice(1)}` : code;
      const bits = state.phase === 'input' ? '–' : code.length;
      return `<tr class="${cls.join(' ')}" data-sym="${esc(sym)}"><td class="col-sym"><span class="dot"></span>${esc(sym)}</td>` +
        `<td class="col-w">${fmt(w)}</td><td class="col-code">${codeHtml}</td><td class="col-bits">${bits}</td></tr>`;
    }).join('');
  }

  function renderCost(state) {
    if (state.phase === 'input') { ui.cost.innerHTML = ''; return; }
    const cost = state.sums.reduce((a, b) => a + b, 0);
    const terms = state.sums.map((s, i) =>
      (state.phase === 'merge' && i === state.sums.length - 1 ? `<span class="fresh">${fmt(s)}</span>` : fmt(s)));
    const sumText = terms.length > 1 ? `${terms.join(' + ')} = ` : '';
    let html = `<p><span class="cost-label">Custo Σ <i>p<sub>a</sub></i> · |código(<i>a</i>)|</span> = ${sumText}<b>${fmt(cost)}</b></p>`;
    if (state.phase === 'done') {
      html += `<p><span class="cost-label">Média (ABL)</span> = ${fmt(cost)} / ${fmt(run.sum)} ≈ <b>${dec2(cost / run.sum)}</b> bits por símbolo</p>`;
      html += `<p><span class="cost-label">Tamanho fixo</span> = ⌈log<sub>2</sub> ${run.n}⌉ = <b>${run.fixed}</b> bits por símbolo</p>`;
      if (run.def.text) {
        const chars = run.sum;
        html += `<p><span class="cost-label">Texto</span>: ${chars} caracteres = ${8 * chars} bits em ASCII → <b>${fmt(cost)}</b> bits com Huffman ` +
          `(${Math.round((100 * cost) / (8 * chars))}%, sem contar a árvore)</p>`;
      }
    } else {
      html += '<p class="cost-note">Cada composição soma <i>P</i>(<i>T</i><sub>3</sub>) ao custo: todos os símbolos de <i>T</i><sub>3</sub> ganham um bit.</p>';
    }
    ui.cost.innerHTML = html;
  }

  function renderPseudo(state) {
    const lines = state.lines.map(String);
    ui.pseudoPanel.querySelectorAll('li[data-line]').forEach(li => {
      li.classList.toggle('hl', lines.includes(li.dataset.line));
    });
  }

  function render(animate) {
    const state = steps[current];
    renderForest(state, animate);
    renderSets(state);
    renderHeap(state);
    renderCodes(state);
    renderCost(state);
    renderPseudo(state);
    ui.message.innerHTML = state.msg;
    ui.stepCounter.textContent = `Passo ${current} de ${steps.length - 1}`;
    ui.progressBar.style.width = `${(100 * current) / (steps.length - 1)}%`;
    ui.prevBtn.disabled = current === 0;
    ui.resetBtn.disabled = current === 0;
    ui.nextBtn.disabled = current === steps.length - 1;
  }

  // ── Interação ───────────────────────────────────────────────────────────

  function setHover(sym) {
    if (hovered === sym) return;
    hovered = sym;
    const state = steps[current];
    applyClasses(state, view.edgesNow || []);
    ui.codeBody.querySelectorAll('tr').forEach(tr => tr.classList.toggle('hovered', tr.dataset.sym === sym));
  }

  function goTo(index, animate = true) {
    const next = Math.max(0, Math.min(steps.length - 1, index));
    const moved = next !== current;
    current = next;
    render(animate && moved);
    if (current === steps.length - 1) stopAuto();
  }

  function stopAuto() {
    if (timer) clearInterval(timer);
    timer = null;
    ui.autoBtn.innerHTML = '▶▶ Automático';
    ui.autoBtn.classList.remove('active');
  }

  function startAuto() {
    if (current === steps.length - 1) goTo(0);
    stopAuto();
    timer = setInterval(() => goTo(current + 1), Number(ui.speedSelect.value));
    ui.autoBtn.innerHTML = '❚❚ Pausar';
    ui.autoBtn.classList.add('active');
  }

  function load(def) {
    stopAuto();
    hovered = null;
    const resolved = resolve(def);
    run = buildRun(resolved);
    steps = run.steps;
    run.VW = (run.n - 1) * (DX + GAP) + 2 * MX;
    run.base = TOP + run.height * DY;
    run.VH = run.base + BOTTOM;
    setupSvg();
    ui.exampleName.textContent = `${resolved.name} · ${resolved.description}`;
    current = 0;
    render(false);
  }

  function toggleMenu(open) {
    const show = open === undefined ? ui.examplesMenu.hidden : open;
    ui.examplesMenu.hidden = !show;
    ui.examplesBtn.setAttribute('aria-expanded', String(show));
  }

  function togglePseudo() {
    const show = ui.pseudoPanel.hidden;
    ui.pseudoPanel.hidden = !show;
    ui.layout.classList.toggle('with-pseudo', show);
    ui.pseudoBtn.setAttribute('aria-pressed', String(show));
    ui.pseudoBtn.classList.toggle('active', show);
  }

  EXAMPLES.forEach(ex => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'example';
    btn.innerHTML = `<span class="example-name">${esc(ex.name)}</span><span class="example-desc">${esc(ex.description)}</span>`;
    btn.addEventListener('click', () => { load(ex); toggleMenu(false); });
    ui.exampleList.appendChild(btn);
  });

  const defaultHint = ui.customHint.innerHTML;
  ui.customForm.addEventListener('submit', event => {
    event.preventDefault();
    const result = parseInput(ui.customInput.value);
    if (result.error) {
      ui.customHint.textContent = result.error;
      ui.customHint.classList.add('error');
      return;
    }
    ui.customHint.innerHTML = defaultHint;
    ui.customHint.classList.remove('error');
    load(result);
    toggleMenu(false);
  });

  ui.symbolCount.addEventListener('input', () => { ui.symbolCountValue.textContent = ui.symbolCount.value; });
  ui.randomBtn.addEventListener('click', () => {
    load(randomExample(Number(ui.symbolCount.value)));
    toggleMenu(false);
  });

  ui.examplesBtn.addEventListener('click', event => { event.stopPropagation(); toggleMenu(); });
  ui.examplesMenu.addEventListener('click', event => event.stopPropagation());
  document.addEventListener('click', () => toggleMenu(false));

  ui.pseudoBtn.addEventListener('click', togglePseudo);
  ui.helpBtn.addEventListener('click', () => ui.helpDialog.showModal());
  ui.resetBtn.addEventListener('click', () => { stopAuto(); goTo(0); });
  ui.prevBtn.addEventListener('click', () => { stopAuto(); goTo(current - 1); });
  ui.nextBtn.addEventListener('click', () => { stopAuto(); goTo(current + 1); });
  ui.autoBtn.addEventListener('click', () => (timer ? stopAuto() : startAuto()));
  ui.speedSelect.addEventListener('change', () => { if (timer) startAuto(); });

  ui.codeBody.addEventListener('mouseover', event => {
    const tr = event.target.closest('tr');
    if (tr) setHover(tr.dataset.sym);
  });
  ui.codeBody.addEventListener('mouseleave', () => setHover(null));

  document.addEventListener('keydown', event => {
    if (ui.helpDialog.open || event.altKey || event.ctrlKey || event.metaKey) return;
    const tag = event.target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    // Espaço/Enter num botão focado já acionam o próprio botão.
    if (tag === 'BUTTON' && (event.key === ' ' || event.key === 'Enter')) return;
    switch (event.key) {
      case 'ArrowRight':
      case ' ':
        event.preventDefault(); stopAuto(); goTo(current + 1); break;
      case 'ArrowLeft':
        event.preventDefault(); stopAuto(); goTo(current - 1); break;
      case 'Home':
        event.preventDefault(); stopAuto(); goTo(0); break;
      case 'End':
        event.preventDefault(); stopAuto(); goTo(steps.length - 1); break;
      case 'a': case 'A':
        if (timer) stopAuto(); else startAuto();
        break;
      case 'p': case 'P':
        togglePseudo(); break;
      case 'Escape':
        toggleMenu(false); break;
      default:
    }
  });

  // Parâmetros opcionais na URL, úteis para linkar a partir dos slides:
  // ?exemplo=aula22-2&passo=5&pseudo=1, ?texto=abracadabra,
  // ?pesos=A:3,B:2,C:6 ou ?aleatorio=1&n=8
  const params = new URLSearchParams(window.location.search);
  let initial = null;
  if (params.has('texto')) initial = parseInput(params.get('texto'));
  else if (params.has('pesos')) initial = parseInput(params.get('pesos'));
  else if (params.get('aleatorio') === '1') initial = randomExample(Math.max(3, Math.min(12, Number(params.get('n')) || 7)));
  else initial = EXAMPLES.find(ex => ex.id === params.get('exemplo'));
  load(initial && !initial.error ? initial : EXAMPLES[0]);
  if (params.has('passo')) goTo(Number(params.get('passo')) || 0, false);
  if (params.get('pseudo') === '1') togglePseudo();
})();
