const tablero = document.getElementById("board");
let arrastrando = false;
let celdaInicio = null;

tablero.addEventListener("mousedown", (event) => {
  if (!event.target.classList.contains("cell")) return;
  arrastrando = true;
  celdaInicio = event.target;
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

  document.querySelectorAll(".cell").forEach(c => {
    const r = Number(c.dataset.r);
    const col = Number(c.dataset.c);
    c.classList.toggle("preview", r >= filaMin && r <= filaMax && col >= colMin && col <= colMax);
  });
});

tablero.addEventListener("mouseup", () => {
  arrastrando = false;
  document.querySelectorAll(".cell.preview").forEach(c => {
    c.classList.remove("preview");
    c.classList.add("selected");
  });
});

function buildBoard(alto, ancho) {
  const tablero = document.getElementById("board");
  tablero.innerHTML = "";
  tablero.style.setProperty("--H", String(alto));
  tablero.style.setProperty("--W", String(ancho));

  const wrap = document.querySelector(".boardWrap");
  const espacioAncho = wrap.clientWidth - 28;
  const espacioAlto  = wrap.clientHeight - 28;
  const tamañoCelda  = Math.floor(Math.min(espacioAncho / ancho, espacioAlto / alto));
  tablero.style.setProperty("--cell", tamañoCelda + "px");

  for(let i = 0; i < alto; i++) {
    for(let j = 0; j < ancho; j++) {
      const celda = document.createElement("div");
      celda.className = "cell";
      celda.dataset.r = String(i);
      celda.dataset.c = String(j);
      tablero.appendChild(celda);
    }
  }
}

btnGenerateBoard.addEventListener("click", () => {
  const alto = document.getElementById("boardHeight").value;
  const ancho = document.getElementById("boardWidth").value;
  const mensajeError = document.getElementById("mensajeError");
  
  if(alto > 40 || ancho > 40) {
    mensajeError.innerHTML = "La dimensión del tablero no puede ser mayor a 40 en ningún lado";
    return;
  }

  if(alto < 1 || ancho < 1) {
    mensajeError.innerHTML = "La dimensión del tablero no puede ser menor a 1 en ningún lado";
    return;
  }

  buildBoard(alto, ancho);

  mensajeError.textContent="";
});

btnReset.addEventListener("click", () => {
  const alto = document.getElementById("boardHeight").value;
  const ancho = document.getElementById("boardWidth").value;
  buildBoard(alto, ancho);
  mensajeError.textContent="";
});