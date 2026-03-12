const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("colorPicker");
const brushSizeInput = document.getElementById("brushSize");
const brushSizeValue = document.getElementById("brushSizeValue");
const clearCanvasBtn = document.getElementById("clearCanvasBtn");
const statusText = document.getElementById("statusText");

let drawing = false;
let lastPoint = { x: 0, y: 0 };

initializeCanvas();

canvas.addEventListener("pointerdown", startDrawing);
canvas.addEventListener("pointermove", draw);
canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointerleave", stopDrawing);

brushSizeInput.addEventListener("input", () => {
  brushSizeValue.textContent = `${brushSizeInput.value} px`;
});

clearCanvasBtn.addEventListener("click", () => {
  clearCanvas();
  setStatus("Louend puhastatud.");
});


function initializeCanvas() {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  clearCanvas();
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
  ctx.strokeStyle = colorPicker.value;
  ctx.lineWidth = Number(brushSizeInput.value);

  ctx.beginPath();
  ctx.moveTo(lastPoint.x, lastPoint.y);
  ctx.lineTo(currentPoint.x, currentPoint.y);
  ctx.stroke();

  lastPoint = currentPoint;
}

function stopDrawing() {
  drawing = false;
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

function setStatus(message) {
  statusText.textContent = message;
}
