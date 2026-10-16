# huffman-visualizer

<p align="right">
  <strong>English</strong> |
  <a href="README.pt-BR.md">Português (Brasil)</a>
</p>

**huffman-visualizer** is an interactive, browser-based educational webtool for visualizing Huffman's algorithm for optimal prefix-free codes.

The tool was built to make algorithmic decisions visible through synchronized views of the forest, the priority queue and the code table.

---

## ✨ Features

- **Forest *F* in the center**, with the two lightest trees *T*₁ and *T*₂ highlighted in orange and the newly composed tree *T*₃ in green; nodes move smoothly as trees are merged.
- **Edge labels 0/1** and the **partial code** under each leaf: every merge prepends one bit to the codes of all symbols in *T*₃.
- **Priority queue *F*** with each tree's weight *P*, sorted as in the slides' pseudocode (ties broken by creation order).
- **Code table** with weight, code and length of each symbol, plus the running cost Σ *p*ₐ·|code(*a*)|, which grows by exactly *P*(*T*₃) at each merge; at the end, the average bits per symbol (ABL) versus a fixed-length code, and the compression ratio for text inputs.
- **Pseudocode** (same as the course slides), toggled by a button, with the current lines highlighted.
- **Step-by-step execution**: forward, back, reset and auto-run with three speeds (keys <kbd>→</kbd> <kbd>←</kbd> <kbd>space</kbd> <kbd>A</kbd> <kbd>P</kbd>); hover a leaf or a table row to see its code path.
- **Examples** (including the ones from the lectures and CLRS), **your own text or weights**, and **random weights**.
- Direct links: `?exemplo=aula22-2&passo=5&pseudo=1`, `?texto=abracadabra`, `?pesos=A:3,B:2,C:6` or `?aleatorio=1&n=8`.
- Colors and font (Lexend) match the course slides; the interface is in Portuguese. Fully client-side, no backend.

---

## 🛠️ Tech stack

- Vanilla **HTML / CSS / JavaScript**
- No external UI framework

---

## 🎓 Credits

**Developed by**  
**Lucas Nunes Alegre**

**Development note**  
This webtool was created with the assistance of **Generative AI**.

---
## 📦 License

This project is licensed under the **MIT License**.

You are free to use, modify, and redistribute it, provided proper attribution is given.

See the `LICENSE` file for details.
