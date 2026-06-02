// ─── Solver Shikaku (k-coloreo con backtracking + MRV) ────────────────────────

function getCandidates(pr, pc, k, H, W) {
  const candidates = [];
  for (let h = 1; h <= k; h++) {
    if (k % h !== 0) continue;
    const w = k / h;
    if (w > W || h > H) continue;
    const r1Min = Math.max(0, pr - h + 1), r1Max = Math.min(H - h, pr);
    const c1Min = Math.max(0, pc - w + 1), c1Max = Math.min(W - w, pc);
    for (let r1 = r1Min; r1 <= r1Max; r1++)
      for (let c1 = c1Min; c1 <= c1Max; c1++)
        candidates.push({ r1, c1, r2: r1 + h - 1, c2: c1 + w - 1 });
  }
  return candidates;
}

function overlaps(a, b) {
  return a.r1 <= b.r2 && a.r2 >= b.r1 && a.c1 <= b.c2 && a.c2 >= b.c1;
}

function solve(clueList, H, W) {
  const n = clueList.length;
  if (n === 0) return { ok: false, reason: "Sin pistas." };

  const domains = clueList.map(({ r, c, area }) => getCandidates(r, c, area, H, W));

  for (let i = 0; i < n; i++) {
    if (domains[i].length === 0)
      return { ok: false, reason: `Pista en (${clueList[i].r},${clueList[i].c}) sin candidatos.` };
  }

  // Precalcular conflictos entre candidatos de pistas distintas
  const preConflicts = domains.map(d => d.map(() => []));
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      for (let ki = 0; ki < domains[i].length; ki++)
        for (let kj = 0; kj < domains[j].length; kj++)
          if (overlaps(domains[i][ki], domains[j][kj])) {
            preConflicts[i][ki].push({ j, k: kj });
            preConflicts[j][kj].push({ j: i, k: ki });
          }

  const assignment = new Array(n).fill(-1);
  const available  = domains.map(d => new Array(d.length).fill(true));

  function countAvailable(i) { return available[i].filter(Boolean).length; }

  function pickUnassigned() {
    let best = -1, bestCount = Infinity;
    for (let i = 0; i < n; i++) {
      if (assignment[i] !== -1) continue;
      const cnt = countAvailable(i);
      if (cnt < bestCount) { bestCount = cnt; best = i; }
    }
    return best;
  }

  function verifyCoverage() {
    const covered = Array.from({ length: H }, () => new Array(W).fill(false));
    for (let i = 0; i < n; i++) {
      const rect = domains[i][assignment[i]];
      for (let r = rect.r1; r <= rect.r2; r++)
        for (let c = rect.c1; c <= rect.c2; c++) {
          if (covered[r][c]) return false;
          covered[r][c] = true;
        }
    }
    for (let r = 0; r < H; r++)
      for (let c = 0; c < W; c++)
        if (!covered[r][c]) return false;
    return true;
  }

  function backtrack() {
    const i = pickUnassigned();
    if (i === -1) return verifyCoverage();

    for (let ki = 0; ki < domains[i].length; ki++) {
      if (!available[i][ki]) continue;
      assignment[i] = ki;

      const eliminated = [];
      let conflict = false;

      for (const { j, k: kj } of preConflicts[i][ki]) {
        if (assignment[j] !== -1) {
          if (assignment[j] === kj) { conflict = true; break; }
          continue;
        }
        if (available[j][kj]) {
          available[j][kj] = false;
          eliminated.push({ j, k: kj });
          if (countAvailable(j) === 0) { conflict = true; break; }
        }
      }

      if (!conflict && backtrack()) return true;

      assignment[i] = -1;
      for (const { j, k: kj } of eliminated) available[j][kj] = true;
    }
    return false;
  }

  if (!backtrack()) return { ok: false, reason: "Sin solución." };

  const result = new Map();
  for (let i = 0; i < n; i++) result.set(i, domains[i][assignment[i]]);
  return { ok: true, assignment: result };
}

function generatePuzzle(H, W) {
  // Recorre el tablero fila por fila (orden determinista).
  // En cada celda libre elige aleatoriamente un rectangulo de area >= 2
  // que quepa en el espacio libre disponible desde esa esquina.
  // Al recorrer en orden, la esquina superior-izquierda de cada rectangulo
  // siempre es la primera celda libre que encontramos, asi que nunca
  // se generan formas no rectangulares ni se necesita fusion posterior.

  const board = Array.from({ length: H }, () => new Array(W).fill(-1));
  const rects = [];

  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      if (board[r][c] !== -1) continue;

      // Calcular maximo alto y ancho disponibles desde (r,c) en espacio libre
      // Alto maximo: cuantas filas consecutivas tienen board[r+dr][c] === -1
      let maxH = 0;
      while (r + maxH < H && board[r + maxH][c] === -1) maxH++;

      // Para cada altura h, el ancho maximo es el minimo ancho libre en todas las filas r..r+h-1
      const options = [];
      let minW = W;
      for (let h = 1; h <= maxH; h++) {
        let w = 0;
        while (c + w < W && w < minW && board[r + h - 1][c + w] === -1) w++;
        minW = Math.min(minW, w);
        if (minW === 0) break;
        for (let fw = 2; fw <= minW; fw++) options.push({ h, w: fw });   // ancho >= 2
        if (h >= 2) options.push({ h, w: 1 });                           // alto >= 2, ancho = 1
      }

      // Preferir area entre 2 y 8 para puzzles interesantes
      const preferred = options.filter(o => o.h * o.w <= 8);
      const pool = preferred.length > 0 ? preferred : options;

      if (pool.length === 0) {
        // Celda completamente atrapada sin opcion de area >= 2.
        if (c + 1 < W && board[r][c + 1] === -1) {
          const idx = rects.length;
          rects.push({ r1: r, c1: c, r2: r, c2: c + 1, area: 2 });
          board[r][c] = idx; board[r][c + 1] = idx;
        } else if (r + 1 < H && board[r + 1][c] === -1) {
          const idx = rects.length;
          rects.push({ r1: r, c1: c, r2: r + 1, c2: c, area: 2 });
          board[r][c] = idx; board[r + 1][c] = idx;
        } else {
          // Sin salida: absorber al rectangulo de arriba (caso más común al barrer)
          if (r > 0 && board[r - 1][c] !== -1) {
            const aboveIdx = board[r - 1][c];
            board[r][c] = aboveIdx;
            // Corregir la geometraa: estirar el limite inferior del rectangulo de arriba
            rects[aboveIdx].r2 = Math.max(rects[aboveIdx].r2, r);
          } else if (c > 0 && board[r][c - 1] !== -1) {
            const leftIdx = board[r][c - 1];
            board[r][c] = leftIdx;
            // Corregir la geometria: estirar el limite derecho del rectangulo de la izquierda
            rects[leftIdx].c2 = Math.max(rects[leftIdx].c2, c);
          }
        }
        continue;
      }

      const chosen = pool[Math.floor(Math.random() * pool.length)];
      const idx = rects.length;
      rects.push({ r1: r, c1: c, r2: r + chosen.h - 1, c2: c + chosen.w - 1, area: chosen.h * chosen.w });
      for (let dr = 0; dr < chosen.h; dr++)
        for (let dc = 0; dc < chosen.w; dc++)
          board[r + dr][c + dc] = idx;
    }
  }

  // Recalcular areas reales por si alguna absorcion las modifico
  const areaReal = new Array(rects.length).fill(0);
  for (let r = 0; r < H; r++)
    for (let c = 0; c < W; c++)
      if (board[r][c] !== -1) areaReal[board[r][c]]++;
  rects.forEach((rect, i) => { rect.area = areaReal[i]; });

  // Solo exportar rectangulos con area > 0 (descartar absorciones sin celda propia)
  return {
    clues: rects
      .filter(rect => rect.area > 0)
      .map(rect => ({ r: rect.r1, c: rect.c1, area: rect.area })),
    solution: rects.filter(rect => rect.area > 0)
  };
}

// ─── Estados de la app ─────────────────────────────────────────────────────────

const tablero = document.getElementById("board");

const rectangulos = [];
let arrastrando  = false;
let celdaInicio  = null;
let tamañoCelda  = 0;
let boardAlto    = 0;
let boardAncho   = 0;
let cluesPuzzle      = new Map();  // "r,c" -> area
let modoJuego        = false;
let solucionGenerada = null;       // solucion conocida cuando el puzzle fue generado aqui

const RECT_COLORS = [
  "rgba(110,168,254,0.22)", "rgba(100,220,140,0.22)", "rgba(255,180, 80,0.22)",
  "rgba(220,100,180,0.22)", "rgba( 80,210,230,0.22)", "rgba(255,130,100,0.22)",
  "rgba(170,130,255,0.22)", "rgba(200,230, 80,0.22)", "rgba(100,200,200,0.22)",
  "rgba(255,160,200,0.22)", "rgba(140,255,180,0.22)", "rgba(255,200,120,0.22)",
];
const RECT_BORDER = [
  "#6ea8fe","#64dc8c","#ffb450","#dc64b4","#50d2e6","#ff8264",
  "#aa82ff","#c8e650","#64c8c8","#ffa0c8","#8cffb4","#ffc878",
];

// ─── Preview overlay ──────────────────────────────────────────────────────────

const previewDiv = document.createElement("div");
previewDiv.className = "rect-overlay rect-preview";
tablero.appendChild(previewDiv);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function seSuperponen(a, b) {
  return a.filaMin <= b.filaMax && a.filaMax >= b.filaMin &&
         a.colMin  <= b.colMax  && a.colMax  >= b.colMin;
}

function posicionarOverlay(div, filaMin, colMin, filaMax, colMax) {
  div.style.top    = (filaMin * tamañoCelda) + "px";
  div.style.left   = (colMin  * tamañoCelda) + "px";
  div.style.width  = ((colMax  - colMin  + 1) * tamañoCelda) + "px";
  div.style.height = ((filaMax - filaMin + 1) * tamañoCelda) + "px";
}

function setStatus(msg, kind = "info") {
  const el = document.getElementById("status");
  if (!el) return;
  el.textContent = msg;
  el.style.color = kind === "error" ? "#ff6b6b" : kind === "ok" ? "#64dc8c" : "#9fb0c0";
}

// ─── Tablero ──────────────────────────────────────────────────────────────────

function buildBoard(alto, ancho) {
  boardAlto = Number(alto); boardAncho = Number(ancho);
  modoJuego = false; cluesPuzzle.clear(); solucionGenerada = null;
  rectangulos.forEach(r => r.div.remove());
  rectangulos.length = 0;

  tablero.innerHTML = "";
  tablero.style.setProperty("--H", String(boardAlto));
  tablero.style.setProperty("--W", String(boardAncho));

  const wrap = document.querySelector(".boardWrap");
  const espacioAncho = wrap.clientWidth  - 28;
  const espacioAlto  = wrap.clientHeight - 28;
  tamañoCelda = Math.floor(Math.min(espacioAncho / boardAncho, espacioAlto / boardAlto));
  tablero.style.setProperty("--cell", tamañoCelda + "px");

  const bold = document.getElementById("toggleBold5")?.checked ?? true;

  for (let i = 0; i < boardAlto; i++) {
    for (let j = 0; j < boardAncho; j++) {
      const celda = document.createElement("div");
      celda.className = "cell";
      celda.dataset.r = String(i);
      celda.dataset.c = String(j);
      if (i === 0)             celda.classList.add("topLine");
      if (i === boardAlto - 1) celda.classList.add("bottomLine");
      if (j === 0)             celda.classList.add("leftLine");
      if (j === boardAncho -1) celda.classList.add("rightLine");
      if (bold) {
        if ((i+1) % 5 === 0 && i !== boardAlto-1)  celda.classList.add("boldR");
        if ((j+1) % 5 === 0 && j !== boardAncho-1) celda.classList.add("boldC");
      }
      tablero.appendChild(celda);
    }
  }

  tablero.appendChild(previewDiv);
  previewDiv.style.display = "none";
  setStatus("Tablero listo.");
}

// ─── Pistas ───────────────────────────────────────────────────────────────────

function pintarPistas() {
  document.querySelectorAll(".cell").forEach(c => {
    c.textContent = "";
    c.classList.remove("clue-cell");
  });
  cluesPuzzle.forEach((area, key) => {
    const [r, c] = key.split(",").map(Number);
    const celda = document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
    if (celda) { celda.textContent = String(area); celda.classList.add("clue-cell"); }
  });
}

// ─── Generar puzzle ───────────────────────────────────────────────────────────

function generarPuzzle() {
  if (!boardAlto || !boardAncho) { setStatus("Primero genera un tablero.", "error"); return; }
  const { clues, solution } = generatePuzzle(boardAlto, boardAncho);
  rectangulos.forEach(r => r.div.remove());
  rectangulos.length = 0;
  cluesPuzzle.clear();
  clues.forEach(({ r, c, area }) => cluesPuzzle.set(`${r},${c}`, area));
  solucionGenerada = solution;
  modoJuego = true;
  pintarPistas();
  setStatus(`Puzzle generado: ${clues.length} pistas.`, "ok");
}

// ─── Resolver ─────────────────────────────────────────────────────────────────

function resolverPuzzle() {
  if (!modoJuego || cluesPuzzle.size === 0) { setStatus("Genera un puzzle primero.", "error"); return; }

  // Si el puzzle fue generado aquí, la solución ya la conocemos — usarla directamente
  if (solucionGenerada) {
    pintarSolucion(solucionGenerada);
    setStatus("✓ Solución mostrada.", "ok");
    return;
  }

  // Puzzle importado: correr el backtracking
  setStatus("Resolviendo…");
  const clueList = Array.from(cluesPuzzle.entries()).map(([key, area]) => {
    const [r, c] = key.split(",").map(Number);
    return { r, c, area };
  });

  const t0 = performance.now();
  const result = solve(clueList, boardAlto, boardAncho);
  const elapsed = (performance.now() - t0).toFixed(0);

  if (result.ok) {
    const rects = [];
    result.assignment.forEach(rect => rects.push(rect));
    pintarSolucion(rects);
    setStatus(`✓ Solución encontrada en ${elapsed} ms.`, "ok");
  } else {
    setStatus("Sin solución: " + result.reason, "error");
  }
}

function pintarSolucion(rects) {
  rectangulos.forEach(r => r.div.remove());
  rectangulos.length = 0;
  rects.forEach((rect, idx) => {
    const div = document.createElement("div");
    div.className = "rect-overlay rect-confirmed";
    div.style.background  = RECT_COLORS[idx % RECT_COLORS.length];
    div.style.borderColor = RECT_BORDER[idx % RECT_BORDER.length];
    div.style.borderWidth = "2px";
    div.style.borderStyle = "solid";
    tablero.appendChild(div);
    posicionarOverlay(div, rect.r1, rect.c1, rect.r2, rect.c2);
    rectangulos.push({ filaMin: rect.r1, filaMax: rect.r2, colMin: rect.c1, colMax: rect.c2, div });
  });
}

// ─── Drag-to-draw ─────────────────────────────────────────────────────────────

tablero.addEventListener("mousedown", ev => {
  if (!ev.target.classList.contains("cell")) return;
  arrastrando = true; celdaInicio = ev.target;
  const r = Number(celdaInicio.dataset.r), c = Number(celdaInicio.dataset.c);
  posicionarOverlay(previewDiv, r, c, r, c);
  previewDiv.style.display = "flex";
});

tablero.addEventListener("mousemove", ev => {
  if (!arrastrando || !ev.target.classList.contains("cell")) return;
  const filaA = Number(celdaInicio.dataset.r), colA = Number(celdaInicio.dataset.c);
  const filaB = Number(ev.target.dataset.r),   colB = Number(ev.target.dataset.c);
  const filaMin = Math.min(filaA,filaB), filaMax = Math.max(filaA,filaB);
  const colMin  = Math.min(colA,colB),  colMax  = Math.max(colA,colB);
  posicionarOverlay(previewDiv, filaMin, colMin, filaMax, colMax);
});

tablero.addEventListener("mouseup", ev => {
  if (!arrastrando) return;
  arrastrando = false;
  previewDiv.style.display = "none";
  const celdaFin = ev.target.classList.contains("cell") ? ev.target : celdaInicio;
  const filaA = Number(celdaInicio.dataset.r), colA = Number(celdaInicio.dataset.c);
  const filaB = Number(celdaFin.dataset.r),    colB = Number(celdaFin.dataset.c);
  const nuevo = {
    filaMin: Math.min(filaA,filaB), filaMax: Math.max(filaA,filaB),
    colMin:  Math.min(colA,colB),   colMax:  Math.max(colA,colB),
  };
  for (let i = rectangulos.length - 1; i >= 0; i--) {
    if (seSuperponen(rectangulos[i], nuevo)) { rectangulos[i].div.remove(); rectangulos.splice(i,1); }
  }
  const div = document.createElement("div");
  div.className = "rect-overlay rect-confirmed";
  tablero.appendChild(div);
  posicionarOverlay(div, nuevo.filaMin, nuevo.colMin, nuevo.filaMax, nuevo.colMax);
  nuevo.div = div;
  rectangulos.push(nuevo);
});

// ─── Verificar solucion del jugador ───────────────────────────────────────────

function verificarSolucion() {
  if (!modoJuego || cluesPuzzle.size === 0) {
    setStatus("Generá un puzzle primero.", "error"); return;
  }
  if (rectangulos.length === 0) {
    setStatus("Aun no dibujaste ningun rectangulo.", "error"); return;
  }

  // 1. Verificar que los rectangulos cubren exactamente todo el tablero sin solapamientos
  const covered = Array.from({ length: boardAlto }, () => new Array(boardAncho).fill(0));
  for (const rect of rectangulos) {
    for (let r = rect.filaMin; r <= rect.filaMax; r++) {
      for (let c = rect.colMin; c <= rect.colMax; c++) {
        covered[r][c]++;
      }
    }
  }
  for (let r = 0; r < boardAlto; r++) {
    for (let c = 0; c < boardAncho; c++) {
      if (covered[r][c] !== 1) {
        setStatus("✗ Incorrecto: hay celdas sin cubrir o solapadas.", "error"); return;
      }
    }
  }

  // 2. Cada pista debe estar dentro de exactamente un rectangulo cuya area coincida
  for (const [key, area] of cluesPuzzle) {
    const [pr, pc] = key.split(",").map(Number);
    const rectDeLaPista = rectangulos.find(rect =>
      pr >= rect.filaMin && pr <= rect.filaMax &&
      pc >= rect.colMin  && pc <= rect.colMax
    );
    if (!rectDeLaPista) {
      setStatus(`✗ Incorrecto: la pista en (${pr},${pc}) no está cubierta.`, "error"); return;
    }
    const areaRect = (rectDeLaPista.filaMax - rectDeLaPista.filaMin + 1) *
                     (rectDeLaPista.colMax  - rectDeLaPista.colMin  + 1);
    if (areaRect !== area) {
      setStatus(`✗ Incorrecto: el rectángulo en (${pr},${pc}) tiene área ${areaRect}, debería ser ${area}.`, "error");
      return;
    }
  }

  setStatus("✓ ¡Correcto! Resolviste el puzzle.", "ok");
}

// ─── Cargar tablero ───────────────────────────────────────────────────────────

document.getElementById("btnLoadBoard")?.addEventListener("click", () => {
  const mensajeError = document.getElementById("mensajeError");
  try {
    const toks = document.getElementById("boardData").value.trim().split(/\s+/).map(Number);
    if (toks.length < 2) throw new Error("Falta H W al inicio.");
    const h = toks[0], w = toks[1];
    if (h < 2 || h > 20 || w < 2 || w > 20) throw new Error("Dimensiones entre 2 y 20.");
    buildBoard(h, w);
    const triples = toks.slice(2);
    if (triples.length % 3 !== 0) throw new Error("Se esperaban triples: r c area.");
    cluesPuzzle.clear();
    solucionGenerada = null;
    for (let i = 0; i < triples.length; i += 3)
      cluesPuzzle.set(`${triples[i]},${triples[i+1]}`, triples[i+2]);
    if (cluesPuzzle.size > 0) { modoJuego = true; pintarPistas(); }
    mensajeError.textContent = "";
    setStatus(`Tablero ${h}×${w} cargado.`, "ok");
  } catch (e) { mensajeError.textContent = e.message; }
});

// ─── Botones ──────────────────────────────────────────────────────────────────

document.getElementById("btnGenerateBoard")?.addEventListener("click", () => {
  const alto  = Number(document.getElementById("boardHeight").value);
  const ancho = Number(document.getElementById("boardWidth").value);
  const mensajeError = document.getElementById("mensajeError");
  if (isNaN(alto) || isNaN(ancho) || alto < 2 || ancho < 2) {
    mensajeError.textContent = "La dimensión mínima es 2."; return;
  }
  if (alto > 20 || ancho > 20) {
    mensajeError.textContent = "La dimensión máxima es 20."; return;
  }
  mensajeError.textContent = "";
  buildBoard(alto, ancho);
});

document.getElementById("btnVerify")?.addEventListener("click", verificarSolucion);
document.getElementById("btnGeneratePuzzle")?.addEventListener("click", generarPuzzle);
document.getElementById("btnSolve")?.addEventListener("click", resolverPuzzle);
document.getElementById("btnReset")?.addEventListener("click", () => {
  if (boardAlto && boardAncho) buildBoard(boardAlto, boardAncho);
  setStatus("Reset.");
});
document.getElementById("toggleBold5")?.addEventListener("change", () => {
  if (boardAlto && boardAncho) buildBoard(boardAlto, boardAncho);
});

