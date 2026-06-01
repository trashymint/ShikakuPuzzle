const tablero = document.getElementById("board");

const rectangulos = [];

let arrastrando = false;
let celdaInicio = null;
let tamañoCelda = 0;

const previewDiv = document.createElement("div");
previewDiv.className = "rect-overlay rect-preview";
tablero.appendChild(previewDiv);

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

tablero.addEventListener("mousedown", (event) => {
  if (!event.target.classList.contains("cell")) return;
  arrastrando = true;
  celdaInicio = event.target;

  const r = Number(celdaInicio.dataset.r);
  const c = Number(celdaInicio.dataset.c);
  posicionarOverlay(previewDiv, r, c, r, c);
  previewDiv.textContent = "1";
  previewDiv.style.display = "flex";
});

tablero.addEventListener("mousemove", (event) => {
  if (!arrastrando) return;
  if (!event.target.classList.contains("cell")) return;

  const filaA = Number(celdaInicio.dataset.r);
  const colA  = Number(celdaInicio.dataset.c);
  const filaB = Number(event.target.dataset.r);
  const colB  = Number(event.target.dataset.c);

  const filaMin = Math.min(filaA, filaB);
  const filaMax = Math.max(filaA, filaB);
  const colMin  = Math.min(colA, colB);
  const colMax  = Math.max(colA, colB);

  posicionarOverlay(previewDiv, filaMin, colMin, filaMax, colMax);

  const total = (filaMax - filaMin + 1) * (colMax - colMin + 1);
  previewDiv.textContent = total;
});

tablero.addEventListener("mouseup", (event) => {
  if (!arrastrando) return;
  arrastrando = false;
  previewDiv.style.display = "none";

  const celdaFin = event.target.classList.contains("cell") ? event.target : celdaInicio;

  const filaA = Number(celdaInicio.dataset.r);
  const colA  = Number(celdaInicio.dataset.c);
  const filaB = Number(celdaFin.dataset.r);
  const colB  = Number(celdaFin.dataset.c);

  const nuevo = {
    filaMin: Math.min(filaA, filaB),
    filaMax: Math.max(filaA, filaB),
    colMin:  Math.min(colA, colB),
    colMax:  Math.max(colA, colB),
  };

  for (let i = rectangulos.length - 1; i >= 0; i--) {
    if (seSuperponen(rectangulos[i], nuevo)) {
      rectangulos[i].div.remove();
      rectangulos.splice(i, 1);
    }
  }

  const div = document.createElement("div");
  div.className = "rect-overlay rect-confirmed";
  tablero.appendChild(div);
  posicionarOverlay(div, nuevo.filaMin, nuevo.colMin, nuevo.filaMax, nuevo.colMax);

  const total = (nuevo.filaMax - nuevo.filaMin + 1) * (nuevo.colMax - nuevo.colMin + 1);
  div.textContent = total;

  nuevo.div = div;
  rectangulos.push(nuevo);
});

function buildBoard(alto, ancho) {
  const tablero = document.getElementById("board");

  rectangulos.forEach(r => r.div.remove());
  rectangulos.length = 0;

  tablero.innerHTML = "";
  tablero.style.setProperty("--H", String(alto));
  tablero.style.setProperty("--W", String(ancho));

  const wrap = document.querySelector(".boardWrap");
  const espacioAncho = wrap.clientWidth - 28;
  const espacioAlto  = wrap.clientHeight - 28;
  tamañoCelda = Math.floor(Math.min(espacioAncho / ancho, espacioAlto / alto));
  tablero.style.setProperty("--cell", tamañoCelda + "px");

  const boldLines = document.getElementById("toggleBold5")?.checked ?? true;

  for (let i = 0; i < alto; i++) {
    for (let j = 0; j < ancho; j++) {
      const celda = document.createElement("div");
      celda.className = "cell";
      celda.dataset.r = String(i);
      celda.dataset.c = String(j);

      if (i === 0)        celda.classList.add("topLine");
      if (i === alto - 1) celda.classList.add("bottomLine");
      if (j === 0)        celda.classList.add("leftLine");
      if (j === ancho - 1) celda.classList.add("rightLine");

      if (boldLines) {
        if ((i + 1) % 5 === 0 && i !== alto - 1)  celda.classList.add("boldR");
        if ((j + 1) % 5 === 0 && j !== ancho - 1) celda.classList.add("boldC");
      }

      tablero.appendChild(celda);
    }
  }

  tablero.appendChild(previewDiv);
  previewDiv.style.display = "none";
}

document.getElementById("toggleBold5")?.addEventListener("change", () => {
  const alto  = document.getElementById("boardHeight").value;
  const ancho = document.getElementById("boardWidth").value;
  if (alto && ancho) buildBoard(alto, ancho);
});

document.getElementById("btnGenerateBoard").addEventListener("click", () => {
  const alto  = document.getElementById("boardHeight").value;
  const ancho = document.getElementById("boardWidth").value;
  const mensajeError = document.getElementById("mensajeError");

  if (alto > 40 || ancho > 40) {
    mensajeError.textContent = "La dimensión no puede ser mayor a 40";
    return;
  }
  if (alto < 1 || ancho < 1) {
    mensajeError.textContent = "La dimensión no puede ser menor a 1";
    return;
  }

  buildBoard(alto, ancho);
  mensajeError.textContent = "";
});

document.getElementById("btnReset").addEventListener("click", () => {
  const alto  = document.getElementById("boardHeight").value;
  const ancho = document.getElementById("boardWidth").value;
  if (alto && ancho) buildBoard(alto, ancho);
});
