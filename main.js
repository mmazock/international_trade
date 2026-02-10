document.addEventListener("DOMContentLoaded", () => {
  console.log("Grid overlay loaded");

  const mapImage = document.getElementById("map-image");
  const canvas = document.getElementById("grid-overlay");
  const ctx = canvas.getContext("2d");

  const GRID_COLUMNS = 20; // A–T
  const GRID_ROWS = 15;    // 1–15

  function drawGrid() {
    const rect = mapImage.getBoundingClientRect();

    canvas.width = rect.width;
    canvas.height = rect.height;

    const cellWidth = rect.width / GRID_COLUMNS;
    const cellHeight = rect.height / GRID_ROWS;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(0, 0, 255, 0.4)";
    ctx.lineWidth = 1;

    // Vertical lines
    for (let c = 0; c <= GRID_COLUMNS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellWidth, 0);
      ctx.lineTo(c * cellWidth, canvas.height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let r = 0; r <= GRID_ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellHeight);
      ctx.lineTo(canvas.width, r * cellHeight);
      ctx.stroke();
    }
  }

  // Draw grid once image loads
  mapImage.onload = drawGrid;

  // Redraw grid if window resizes
  window.addEventListener("resize", drawGrid);

  // CLICK LOGIC (kept from before)
  mapImage.addEventListener("click", (event) => {
    const rect = mapImage.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const cellWidth = rect.width / GRID_COLUMNS;
    const cellHeight = rect.height / GRID_ROWS;

    const colIndex = Math.floor(x / cellWidth);
    const rowIndex = Math.floor(y / cellHeight);

    const columnLetter = String.fromCharCode(65 + colIndex);
    const rowNumber = rowIndex + 1;

    console.log(`Clicked grid: ${columnLetter}${rowNumber}`);
  });
});
