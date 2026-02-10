document.addEventListener("DOMContentLoaded", () => {
  console.log("Calibrated grid system loaded");

  const mapImage = document.getElementById("map-image");

  // ===== GRID SETTINGS =====
const GRID_COLUMNS = 19; // A–S
const GRID_ROWS = 13;    // 1–13

  // ===== CALIBRATION VALUES (LOCKED) =====
  const GRID_LEFT = 9;
  const GRID_TOP = 6;
  const GRID_RIGHT = 621;
  const GRID_BOTTOM = 339;

  const GRID_WIDTH = GRID_RIGHT - GRID_LEFT;
  const GRID_HEIGHT = GRID_BOTTOM - GRID_TOP;

  mapImage.addEventListener("click", (event) => {
    const rect = mapImage.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Ignore clicks outside the playable grid
    if (
      x < GRID_LEFT || x > GRID_RIGHT ||
      y < GRID_TOP || y > GRID_BOTTOM
    ) {
      console.log("Outside playable grid");
      return;
    }

    // Translate to grid-relative coordinates
    const gridX = x - GRID_LEFT;
    const gridY = y - GRID_TOP;

    const cellWidth = GRID_WIDTH / GRID_COLUMNS;
    const cellHeight = GRID_HEIGHT / GRID_ROWS;

    const colIndex = Math.floor(gridX / cellWidth);
    const rowIndex = Math.floor(gridY / cellHeight);

    const columnLetter = String.fromCharCode(65 + colIndex);
    const rowNumber = rowIndex + 1;

    console.log(`Clicked grid: ${columnLetter}${rowNumber}`);
  });
});
