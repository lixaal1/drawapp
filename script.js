const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("colorPicker");
const brushSizeInput = document.getElementById("brushSize");
const brushSizeValue = document.getElementById("brushSizeValue");
const clearCanvasBtn = document.getElementById("clearCanvasBtn");
const saveDrawingBtn = document.getElementById("saveDrawingBtn");
const clearGalleryBtn = document.getElementById("clearGalleryBtn");
const statusText = document.getElementById("statusText");
const gallery = document.getElementById("gallery");
const galleryItemTemplate = document.getElementById("galleryItemTemplate");

const storageKey = "drawapp-gallery";
let drawing = false;
let lastPoint = { x: 0, y: 0 };
let galleryImages = loadGallery();

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
