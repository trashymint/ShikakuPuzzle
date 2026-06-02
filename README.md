# Shikaku Puzzle

Aplicación web para jugar y resolver puzzles Shikaku. El tablero se divide en rectángulos no superpuestos; cada pista numérica indica el área del rectángulo que contiene esa celda.

## Requisitos

| Requisito | Detalle |
|-----------|---------|
| Navegador | Cualquier navegador moderno (Chrome, Firefox, Edge, Safari, etc.) |

## Instalación

1. Cloná o descargá el repositorio:

   ```bash
   git clone <url-del-repositorio>
   cd ShikakuPuzzle
   ```

   También podés descomprimir el proyecto en una carpeta y abrir esa carpeta.

## Ejecución

### Opción 1: Abrir el archivo directamente

1. Entrá a la carpeta del proyecto.
2. Abrí `index.html` con doble clic o arrastrándolo al navegador.

En la mayoría de los casos esto es suficiente.

### Opción 2: Servidor local (recomendado)

Levantá un servidor estático en la carpeta del proyecto:

**Python 3:**

```bash
python -m http.server 8000
```

**Python 2:**

```bash
python -m SimpleHTTPServer 8000
```

**Node.js (si lo tenés instalado):**

```bash
npx --yes serve .
```

Luego abrí en el navegador: [http://localhost:8000](http://localhost:8000) (o el puerto que indique la herramienta).

## Estructura del proyecto

```
ShikakuPuzzle/
├── index.html   # Interfaz y panel de controles
├── style.css    # Estilos del tablero y la UI
├── app.js       # Lógica del juego, generación y solver (backtracking)
└── README.md
```

## Uso básico

1. **Generar tablero**: indicá ancho y alto (entre 2 y 20) y pulsá *Generar Tablero*.
2. **Generar puzzle**: crea pistas automáticamente a partir de una solución válida.
3. **Jugar**: arrastrá con el mouse para dibujar rectángulos sobre el tablero.
4. **Verificar**: comprueba si tu solución cubre todo el tablero y respeta cada pista.
5. **Resolver**: muestra una solución generada por el algoritmo interno.
6. **Resetear**: limpia los rectángulos dibujados manteniendo el tablero actual.
7. **Cargar tablero**: pegá datos en el área de texto con el formato:

   ```
   H W
   r c area
   r c area
   ...
   ```

   Ejemplo para un tablero 6×6:

   ```
   6 6
   0 0 4
   0 4 2
   ```

   La primera línea son alto (`H`) y ancho (`W`); cada línea siguiente es fila, columna y área de una pista (índices desde 0).

## Reglas del puzzle

- Cada celda con número pertenece a un único rectángulo.
- El número es el **área** (cantidad de celdas) de ese rectángulo.
- Los rectángulos no se superponen y deben cubrir **todo** el tablero.

