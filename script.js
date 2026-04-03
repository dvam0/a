// ============================================================
//  MÁQUINA DE ESTADOS — BOTÓN "NO"
//  Estados posibles:
//    'dialogo'   → muestra frases una por una
//    'reduccion' → encoge el botón No, agranda el Sí
//    'evasion'   → el botón huye del cursor
// ============================================================

// --- Referencias al DOM ---
const preguntaEl  = document.getElementById('pregunta');
const btnSi       = document.getElementById('btn-si');
const btnNo       = document.getElementById('btn-no');
const appEl       = document.getElementById('app');
const exitoEl     = document.getElementById('pantalla-exito');

// --- Configuración de la máquina de estados ---
const FRASES = [
  '¿Seguro? Piénsalo bien... 🥺',
  'Eso no es lo que tu corazón dice...',
  'Está bien, te doy otra oportunidad.',
  'Última oportunidad para elegir bien 😅',
];

const ESCALA_INICIAL = 1;       // Escala inicial del botón No
const ESCALA_MINIMA  = 0.45;    // A partir de aquí entra la fase de evasión
const PASO_REDUCCION = 0.15;    // Cuánto se encoge por clic en fase de reducción

let estado        = 'dialogo';  // Estado actual
let indiceFrase   = 0;          // Qué frase del array mostrar a continuación
let escalaNo      = ESCALA_INICIAL; // Escala actual del botón No


// ============================================================
//  EVENTO: Clic en "Sí"
// ============================================================
btnSi.addEventListener('click', () => {
  // Ocultar pantalla principal y mostrar pantalla de éxito
  appEl.classList.add('oculto');
  exitoEl.classList.remove('oculto');
});


// ============================================================
//  EVENTO: Clic en "No"  (solo activo en fases 'dialogo' y 'reduccion')
// ============================================================
btnNo.addEventListener('click', () => {
  if (estado === 'dialogo') {
    manejarDialogo();
  } else if (estado === 'reduccion') {
    manejarReduccion();
  }
  // En 'evasion' el clic no hace nada; el mouseover toma el control.
});


// ============================================================
//  EVENTO: Mouseover en "No"  (solo activo en fase 'evasion')
// ============================================================
btnNo.addEventListener('mouseover', () => {
  if (estado === 'evasion') {
    moverBotonAleatorio();
  }
});


// ============================================================
//  FASE 1 — DIÁLOGO
//  Muestra frases de la lista. Al agotarlas, pasa a 'reduccion'.
// ============================================================
function manejarDialogo() {
  if (indiceFrase < FRASES.length) {
    // Pequeño fade para suavizar el cambio de texto
    preguntaEl.style.opacity = '0';
    setTimeout(() => {
      preguntaEl.textContent = FRASES[indiceFrase];
      preguntaEl.style.opacity = '1';
    }, 300);
    indiceFrase++;
  } else {
    // Se agotaron las frases → pasar a reducción
    estado = 'reduccion';
    manejarReduccion(); // Procesar el clic actual como primer paso de reducción
  }
}


// ============================================================
//  FASE 2 — REDUCCIÓN
//  Encoge el botón "No" y agranda el "Sí" proporcionalmente.
//  Al llegar al mínimo, activa la fase de evasión.
// ============================================================
function manejarReduccion() {
  escalaNo = Math.max(ESCALA_MINIMA, escalaNo - PASO_REDUCCION);
  aplicarEscalas();

  if (escalaNo <= ESCALA_MINIMA) {
    activarEvasion();
  }
}

function aplicarEscalas() {
  // El botón No se encoge
  btnNo.style.transform = `scale(${escalaNo})`;

  // El botón Sí crece inversamente: cuando No está al 50%, Sí estará al ~175%
  // Fórmula: escala_si = 1 + (1 - escalaNo) * factor
  const escalaSi = 1 + (1 - escalaNo) * 1.5;
  btnSi.style.transform = `scale(${escalaSi})`;
}


// ============================================================
//  FASE 3 — EVASIÓN
//  Convierte el botón en un elemento de posición absoluta
//  y lo hace saltar cuando el cursor se acerca.
// ============================================================
function activarEvasion() {
  estado = 'evasion';

  // Para mover el botón libremente por el viewport necesitamos
  // sacarlo del flujo del documento (position: absolute en el body).
  const rect = btnNo.getBoundingClientRect(); // Posición actual en pantalla

  // Mover el botón al body para que las coordenadas absolutas
  // sean relativas al viewport completo, no al contenedor.
  document.body.appendChild(btnNo);
  btnNo.style.position = 'absolute';
  btnNo.style.left     = `${rect.left}px`;
  btnNo.style.top      = `${rect.top + window.scrollY}px`;
  btnNo.style.margin   = '0'; // Eliminar cualquier margen heredado

  // Opcional: cambiar cursor para indicar que algo raro pasa
  btnNo.style.cursor = 'not-allowed';
}

// ============================================================
//  FUNCIÓN: moverBotonAleatorio()
//  Calcula una posición aleatoria SEGURA dentro del viewport,
//  asegurando que el botón no quede cortado en ningún borde.
// ============================================================
function moverBotonAleatorio() {
  // Dimensiones del botón en pantalla (considerando su escala CSS)
  const rect = btnNo.getBoundingClientRect();
  const anchoBoton  = rect.width;
  const altoBoton   = rect.height;

  // Límites del viewport
  const anchoVentana = window.innerWidth;
  const altoVentana  = window.innerHeight;

  // ── CÁLCULO DE ZONA SEGURA ──────────────────────────────
  // El botón puede colocarse en X desde 0 hasta (ancho_ventana - ancho_botón).
  // Si usáramos Math.random() * anchoVentana, el botón podría quedar
  // parcialmente fuera del borde derecho o inferior.
  // Con estos límites, el BORDE del botón nunca supera el BORDE del viewport.
  //
  //   [0]────────────────────────────[anchoVentana]
  //        ↑                    ↑
  //     min x=0           max x = anchoVentana - anchoBoton
  //
  const maxX = anchoVentana  - anchoBoton  - 8; // -8px de margen de seguridad
  const maxY = altoVentana   - altoBoton   - 8;
  const minX = 8;
  const minY = 8;

  // Posición aleatoria dentro del área segura
  const nuevaX = Math.random() * (maxX - minX) + minX;
  const nuevaY = Math.random() * (maxY - minY) + minY;

  // Aplicar posición (+ scroll por si la página tuviera scroll, aunque
  // en este caso overflow:hidden lo impide; buena práctica de todas formas)
  btnNo.style.left = `${nuevaX + window.scrollX}px`;
  btnNo.style.top  = `${nuevaY + window.scrollY}px`;
}
// ... (Tus referencias al DOM existentes) ...
const overlayEl = document.getElementById('pantalla-completa-overlay');

// --- Definición de Assets (Tus dibujos de gatos) ---
const ASSETS = {
  si: 'gatos-felices-pareja.gif', // GIF o imagen full-screen
  no: 'gatos-tristes-llorando.png'  // Imagen full-screen
};

// ============================================================
//  LÓGICA DEL OVERLAY (Hover)
// ============================================================

// FUNCIÓN COMÚN: Activar Overlay
function mostrarOverlay(asset) {
  overlayEl.style.backgroundImage = `url('${asset}')`;
  overlayEl.classList.add('overlay-visible');
  overlayEl.classList.remove('overlay-oculto');
}

// FUNCIÓN COMÚN: Desactivar Overlay
function ocultarOverlay() {
  overlayEl.classList.add('overlay-oculto');
  overlayEl.classList.remove('overlay-visible');
}


// --- ASOCIAR EVENTOS A LOS BOTONES ---

// BOTÓN SÍ
btnSi.addEventListener('mouseover', () => {
  // Solo mostrar el protector de pantalla si no estamos huyendo
  if (estado !== 'evasion') mostrarOverlay(ASSETS.si);
});
btnSi.addEventListener('mouseout', ocultarOverlay);


// BOTÓN NO (Adaptado)
// Usamos 'mouseenter' para que solo se dispare al entrar, no con el 'mouseover' aleatorio
btnNo.addEventListener('mouseenter', () => {
  if (estado !== 'evasion') mostrarOverlay(ASSETS.no);
});
btnNo.addEventListener('mouseout', ocultarOverlay);

// ... (El resto de tus eventos click y moverBotonAleatorio se mantienen) ...
// Asegúrate de que tu evento 'mouseover' del No para huir no entre en conflicto.
```

---

## Cómo funciona la lógica de movimiento (resumen)

El truco clave en `moverBotonAleatorio()` es calcular una **zona segura** antes de elegir la posición al azar:
```
posición X aleatoria ∈ [8px  …  (ancho_ventana - ancho_botón - 8px)]
posición Y aleatoria ∈ [8px  …  (alto_ventana  - alto_botón  - 8px)]