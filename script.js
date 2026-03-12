const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("colorPicker");
const brushSizeInput = document.getElementById("brushSize");
const brushSizeValue = document.getElementById("brushSizeValue");
const clearCanvasBtn = document.getElementById("clearCanvasBtn");
const saveDrawingBtn = document.getElementById("saveDrawingBtn");
const clearGalleryBtn = document.getElementById("clearGalleryBtn");
const pencilToolBtn = document.getElementById("pencilToolBtn");
const eraserToolBtn = document.getElementById("eraserToolBtn");
const sprayModeBtn = document.getElementById("sprayModeBtn");
const mirrorModeBtn = document.getElementById("mirrorModeBtn");
const rainbowModeBtn = document.getElementById("rainbowModeBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const statusText = document.getElementById("statusText");
const gallery = document.getElementById("gallery");
const galleryItemTemplate = document.getElementById("galleryItemTemplate");

const storageKey = "drawapp-gallery";
const maxHistory = 40;
let drawing = false;
let lastPoint = { x: 0, y: 0 };
let galleryImages = loadGallery();
let activeTool = "pencil";
let mirrorMode = false;
let rainbowMode = false;
let sprayMode = false;
let rainbowHue = 0;
let undoStack = [];
let redoStack = [];

initializeCanvas();
renderGallery();

canvas.addEventListener("pointerdown", startDrawing);
canvas.addEventListener("pointermove", draw);
canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointerleave", stopDrawing);

brushSizeInput.addEventListener("input", () => {
  brushSizeValue.textContent = `${brushSizeInput.value} px`;
});

clearCanvasBtn.addEventListener("click", () => {
  clearCanvas();
  saveCanvasState();
  setStatus("Louend puhastatud.");
});

saveDrawingBtn.addEventListener("click", () => {
  const dataUrl = canvas.toDataURL("image/png");
  galleryImages.unshift(dataUrl);
  persistGallery();
  renderGallery();
  setStatus("Joonistus salvestatud galeriisse.");
});

clearGalleryBtn.addEventListener("click", () => {
  if (galleryImages.length === 0) {
    setStatus("Galerii on juba tuhi.");
    return;
  }

  galleryImages = [];
  persistGallery();
  renderGallery();
  setStatus("Galerii tuhjendatud.");
});

pencilToolBtn.addEventListener("click", () => {
  activeTool = "pencil";
  setStatus("Tool: Pencil");
  updateToolButtons();
});

eraserToolBtn.addEventListener("click", () => {
  activeTool = "eraser";
  setStatus("Tool: Eraser");
  updateToolButtons();
});

sprayModeBtn.addEventListener("click", () => {
  sprayMode = !sprayMode;
  updateToolButtons();
  setStatus(sprayMode ? "Spray mode ON" : "Spray mode OFF");
});

mirrorModeBtn.addEventListener("click", () => {
  mirrorMode = !mirrorMode;
  updateToolButtons();
  setStatus(mirrorMode ? "Mirror mode ON" : "Mirror mode OFF");
});

rainbowModeBtn.addEventListener("click", () => {
  rainbowMode = !rainbowMode;
  updateToolButtons();
  setStatus(rainbowMode ? "Rainbow mode ON" : "Rainbow mode OFF");
});

undoBtn.addEventListener("click", undo);
redoBtn.addEventListener("click", redo);


function initializeCanvas() {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  clearCanvas();
  saveCanvasState();
  updateToolButtons();
}

function clearCanvas() {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function startDrawing(event) {
  drawing = true;
  lastPoint = getCanvasPoint(event);
  canvas.setPointerCapture(event.pointerId);
}

function draw(event) {
  if (!drawing) {
    return;
  }

  const currentPoint = getCanvasPoint(event);
  const strokeColor = getStrokeColor();
  const size = Number(brushSizeInput.value);

  if (sprayMode) {
    sprayAtPoint(currentPoint, strokeColor, size);
    if (mirrorMode) {
      sprayAtPoint({ x: canvas.width - currentPoint.x, y: currentPoint.y }, strokeColor, size);
    }
  } else {
    drawSegment(lastPoint, currentPoint, strokeColor, size);

    if (mirrorMode) {
      const mirroredStart = { x: canvas.width - lastPoint.x, y: lastPoint.y };
      const mirroredEnd = { x: canvas.width - currentPoint.x, y: currentPoint.y };
      drawSegment(mirroredStart, mirroredEnd, strokeColor, size);
    }
  }

  lastPoint = currentPoint;
}

function stopDrawing() {
  if (drawing) {
    saveCanvasState();
  }
  drawing = false;
}

function drawSegment(fromPoint, toPoint, color, lineWidth) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(fromPoint.x, fromPoint.y);
  ctx.lineTo(toPoint.x, toPoint.y);
  ctx.stroke();
}

function sprayAtPoint(point, color, size) {
  const density = Math.max(8, size * 2);
  const radius = Math.max(8, size * 2);

  ctx.fillStyle = color;
  for (let i = 0; i < density; i += 1) {
    const offsetX = (Math.random() - 0.5) * radius;
    const offsetY = (Math.random() - 0.5) * radius;
    ctx.fillRect(point.x + offsetX, point.y + offsetY, 1.6, 1.6);
  }
}

function getStrokeColor() {
  if (activeTool === "eraser") {
    return "#ffffff";
  }

  if (rainbowMode) {
    rainbowHue = (rainbowHue + 3) % 360;
    return `hsl(${rainbowHue}, 95%, 48%)`;
  }

  return colorPicker.value;
}

function saveCanvasState() {
  undoStack.push(canvas.toDataURL("image/png"));
  if (undoStack.length > maxHistory) {
    undoStack.shift();
  }
  redoStack = [];
  updateUndoRedoState();
}

function restoreCanvasState(dataUrl) {
  const image = new Image();
  image.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  };
  image.src = dataUrl;
}

function undo() {
  if (undoStack.length <= 1) {
    setStatus("Nothing to undo.");
    return;
  }

  const currentState = undoStack.pop();
  redoStack.push(currentState);
  restoreCanvasState(undoStack[undoStack.length - 1]);
  updateUndoRedoState();
  setStatus("Undo complete.");
}

function redo() {
  if (redoStack.length === 0) {
    setStatus("Nothing to redo.");
    return;
  }

  const nextState = redoStack.pop();
  undoStack.push(nextState);
  restoreCanvasState(nextState);
  updateUndoRedoState();
  setStatus("Redo complete.");
}

function updateToolButtons() {
  pencilToolBtn.classList.toggle("is-active", activeTool === "pencil");
  eraserToolBtn.classList.toggle("is-active", activeTool === "eraser");
  sprayModeBtn.classList.toggle("is-active", sprayMode);
  mirrorModeBtn.classList.toggle("is-active", mirrorMode);
  rainbowModeBtn.classList.toggle("is-active", rainbowMode);
  updateUndoRedoState();
}

function updateUndoRedoState() {
  undoBtn.disabled = undoStack.length <= 1;
  redoBtn.disabled = redoStack.length === 0;
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function renderGallery() {
  gallery.innerHTML = "";

  if (galleryImages.length === 0) {
    const emptyText = document.createElement("p");
    emptyText.textContent = "Galerii on tuhi. Salvesta esimene joonistus!";
    emptyText.className = "status-text";
    gallery.appendChild(emptyText);
    return;
  }

  galleryImages.forEach((imageData, index) => {
    const fragment = galleryItemTemplate.content.cloneNode(true);
    const img = fragment.querySelector("img");
    const deleteBtn = fragment.querySelector("button");

    img.src = imageData;
    deleteBtn.addEventListener("click", () => {
      galleryImages.splice(index, 1);
      persistGallery();
      renderGallery();
      setStatus("Joonistus kustutatud.");
    });

    gallery.appendChild(fragment);
  });
}

function loadGallery() {
  const raw = localStorage.getItem(storageKey);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Galerii laadimine ebaonnestus:", error);
    return [];
  }
}

function persistGallery() {
  localStorage.setItem(storageKey, JSON.stringify(galleryImages));
}

function setStatus(message) {
  statusText.textContent = message;
}
