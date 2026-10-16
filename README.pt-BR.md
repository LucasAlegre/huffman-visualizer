# huffman-visualizer

<p align="right">
  <a href="README.md">English</a> |
  <strong>Português (Brasil)</strong>
</p>

**huffman-visualizer** é uma ferramenta educacional interativa, executada no navegador, para visualização do algoritmo de Huffman para códigos *prefix-free* ótimos.

A ferramenta foi construída para tornar visíveis as decisões do algoritmo por meio de visualizações sincronizadas da floresta, da fila de prioridade e da tabela de códigos.

---

## ✨ Funcionalidades

- **Floresta *F* no centro**, com as duas árvores de menor peso *T*₁ e *T*₂ em laranja e a árvore recém-composta *T*₃ em verde; os nodos se movem suavemente quando as árvores se juntam.
- **Rótulos 0/1 nas arestas** e o **código parcial** abaixo de cada folha: cada composição acrescenta um bit à esquerda dos códigos de todos os símbolos de *T*₃.
- **Fila de prioridade *F*** com o peso *P* de cada árvore, ordenada como no pseudocódigo dos slides (empates pela ordem de criação).
- **Tabela de códigos** com peso, código e tamanho de cada símbolo, e o custo acumulado Σ *p*ₐ·|código(*a*)|, que cresce exatamente *P*(*T*₃) a cada composição; no fim, o número médio de bits por símbolo (ABL) comparado a um código de tamanho fixo e, para textos, a taxa de compressão.
- **Pseudocódigo** (o mesmo dos slides), aberto por um botão, com as linhas executadas em destaque.
- **Execução passo a passo**: avançar, voltar, reiniciar e modo automático com três velocidades (teclas <kbd>→</kbd> <kbd>←</kbd> <kbd>espaço</kbd> <kbd>A</kbd> <kbd>P</kbd>); passe o mouse sobre uma folha ou linha da tabela para ver o caminho do código.
- **Exemplos** (incluindo os das aulas e o do CLRS), **seu próprio texto ou pesos** e **pesos aleatórios**.
- Links diretos: `?exemplo=aula22-2&passo=5&pseudo=1`, `?texto=abracadabra`, `?pesos=A:3,B:2,C:6` ou `?aleatorio=1&n=8`.
- Paleta e fonte (Lexend) iguais às dos slides da disciplina; totalmente no cliente, sem backend.

---

## 🛠️ Stack tecnológica

- **HTML / CSS / JavaScript** puro
- Sem framework externo de UI

---

## 🎓 Créditos

**Desenvolvido por**  
**Lucas Nunes Alegre**

**Nota de desenvolvimento**  
Esta ferramenta foi criada com a assistência de **IA Generativa**.

---
## 📦 Licença

Este projeto está licenciado sob a **Licença MIT**.

Você pode usar, modificar e redistribuir, desde que haja a devida atribuição.

Veja o arquivo `LICENSE` para detalhes.
