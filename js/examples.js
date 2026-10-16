// Exemplos e leitura de entradas (texto ou pesos digitados, pesos aleatórios).
// Cada exemplo: { id, name, description, symbols: [[símbolo, peso], ...], swap?, text? }
// swap: iterações (1, 2, ...) em que T2 fica à esquerda na composição, para
// reproduzir as árvores dos slides; a ordem dos filhos não altera o custo.
(function () {
  'use strict';

  const MIN_SYMBOLS = 2;
  const MAX_SYMBOLS = 16;
  const SPACE = '␣';

  const EXAMPLES = [
    {
      id: 'aula22-1',
      name: 'Exemplo da aula 22',
      description: '4 símbolos · frequências em %',
      symbols: [['A', 60], ['B', 25], ['C', 10], ['D', 5]],
      swap: [1, 2, 3]
    },
    {
      id: 'aula22-2',
      name: 'Outro exemplo da aula 22',
      description: '6 símbolos · pesos 3, 2, 6, 8, 2, 6',
      symbols: [['A', 3], ['B', 2], ['C', 6], ['D', 8], ['E', 2], ['F', 6]],
      swap: [5]
    },
    {
      id: 'clrs',
      name: 'Exemplo do CLRS',
      description: '6 símbolos · frequências em milhares',
      symbols: [['a', 45], ['b', 13], ['c', 12], ['d', 16], ['e', 9], ['f', 5]]
    },
    {
      id: 'rato',
      name: 'Frase “o rato roeu a roupa do rei de roma”',
      description: 'frequência de cada caractere (␣ = espaço)',
      text: 'o rato roeu a roupa do rei de roma'
    },
    {
      id: 'fibonacci',
      name: 'Pesos de Fibonacci',
      description: '7 símbolos · árvore o mais desbalanceada possível',
      symbols: [['A', 1], ['B', 1], ['C', 2], ['D', 3], ['E', 5], ['F', 8], ['G', 13]]
    },
    {
      id: 'iguais',
      name: 'Pesos iguais',
      description: '8 símbolos · Huffman gera um código de tamanho fixo',
      symbols: [['A', 1], ['B', 1], ['C', 1], ['D', 1], ['E', 1], ['F', 1], ['G', 1], ['H', 1]]
    }
  ];

  // Frequência de cada caractere, na ordem da primeira ocorrência.
  function fromText(text, name) {
    const counts = new Map();
    for (const ch of text.replace(/[\r\n\t]/g, '')) {
      const sym = ch === ' ' ? SPACE : ch;
      counts.set(sym, (counts.get(sym) || 0) + 1);
    }
    const symbols = [...counts.entries()];
    const error = checkCount(symbols.length, 'caracteres distintos');
    if (error) return { error };
    const length = symbols.reduce((s, [, w]) => s + w, 0);
    return {
      name: name || `Texto “${text.length > 28 ? `${text.slice(0, 27)}…` : text}”`,
      description: `${length} caracteres · ${symbols.length} distintos`,
      symbols,
      text
    };
  }

  function checkCount(n, what) {
    if (n < MIN_SYMBOLS) return `São necessários pelo menos ${MIN_SYMBOLS} ${what}.`;
    if (n > MAX_SYMBOLS) return `Use no máximo ${MAX_SYMBOLS} ${what} (encontrados: ${n}).`;
    return null;
  }

  // "A:3 B:2, C=6" vira pesos; qualquer outra coisa é tratada como texto.
  function parseInput(raw) {
    const input = raw.trim();
    if (!input) return { error: 'Digite um texto ou uma lista de pesos.' };
    const tokens = input.split(/[\s,;]+/).filter(Boolean);
    const pairs = tokens.map(t => t.match(/^(.{1,3}?)[:=](\d+(?:[.,]\d+)?)$/));
    if (pairs.every(Boolean)) {
      const symbols = pairs.map(m => [m[1], Number(m[2].replace(',', '.'))]);
      const names = new Set(symbols.map(([s]) => s));
      if (names.size !== symbols.length) return { error: 'Há símbolos repetidos na lista de pesos.' };
      const error = checkCount(symbols.length, 'símbolos');
      if (error) return { error };
      if (symbols.every(([, w]) => w === 0)) return { error: 'Pelo menos um peso deve ser positivo.' };
      return { name: 'Pesos digitados', description: `${symbols.length} símbolos`, symbols };
    }
    return fromText(raw.replace(/^\s+|\s+$/g, ''));
  }

  function randomExample(n) {
    const symbols = [];
    for (let i = 0; i < n; i++) symbols.push([String.fromCharCode(65 + i), 1 + Math.floor(Math.random() * 20)]);
    return { name: 'Pesos aleatórios', description: `${n} símbolos · pesos de 1 a 20`, symbols };
  }

  // Normaliza um exemplo: textos viram tabelas de frequência.
  function resolve(def) {
    if (def.text && !def.symbols) {
      const fromT = fromText(def.text, def.name);
      return Object.assign({}, def, { symbols: fromT.symbols, description: def.description || fromT.description });
    }
    return def;
  }

  window.HuffmanExamples = { EXAMPLES, MAX_SYMBOLS, parseInput, randomExample, resolve };
})();
