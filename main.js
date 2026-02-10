document.addEventListener("DOMContentLoaded", () => {
  console.log("Grid system loaded");

  const mapImage = document.getElementById("map-image");

  // GRID SETTINGS (easy to tweak later)
  const GRID_COLUMNS = 20; // A–T
  const GRID_ROWS = 15;    // 1–15

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
