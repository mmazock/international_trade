document.addEventListener("DOMContentLoaded", () => {
  console.log("Zoom-safe grid system loaded");

  const mapImage = document.getElementById("map-image");

  /* =============================
     ORIGINAL CALIBRATION VALUES
     (based on your map at 275x150)
     ============================= */

  const originalWidth = 275;
  const originalHeight = 150;

  // Column centers (pixels from calibration)
  const columnPixels = [
    { letter: "A", x: 10 },
    { letter: "B", x: 23 },
    { letter: "C", x: 38 },
    { letter: "D", x: 53 },
    { letter: "E", x: 67 },
    { letter: "F", x: 81 },
    { letter: "G", x: 95 },
    { letter: "H", x: 110 },
    { letter: "I", x: 124 },
    { letter: "J", x: 138 },
    { letter: "K", x: 153 },
    { letter: "L", x: 168 },
    { letter: "M", x: 182 },
    { letter: "N", x: 196 },
    { letter: "O", x: 211 },
    { letter: "P", x: 225 },
    { letter: "Q", x: 240 },
    { letter: "R", x: 254 },
    { letter: "S", x: 267 }
  ];

  // Row centers (pixels from calibration)
  const rowPixels = [
    { row: 0, y: 7 },
    { row: 1, y: 18 },
    { row: 2, y: 29 },
    { row: 3, y: 39 },
    { row: 4, y: 50 },
    { row: 5, y: 60 },
    { row: 6, y: 71 },
    { row: 7, y: 83 },
    { row: 8, y: 92 },
    { row: 9, y: 102 },
    { row: 10, y: 113 },
    { row: 11, y: 123 },
    { row: 12, y: 134 },
    { row: 13, y: 144 }
  ];

  // Convert to percentages
  const columns = columnPixels.map(c => ({
    letter: c.letter,
    percent: c.x / originalWidth
  }));

  const rows = rowPixels.map(r => ({
    row: r.row,
    percent: r.y / originalHeight
  }));

  function findClosest(value, list) {
    return list.reduce((closest, current) =>
      Math.abs(current.percent - value) <
      Math.abs(closest.percent - value)
        ? current
        : closest
    );
  }

  mapImage.addEventListener("click", (event) => {
    const rect = mapImage.getBoundingClientRect();

    // Convert click to percentage of current display size
    const xPercent = (event.clientX - rect.left) / rect.width;
    const yPercent = (event.clientY - rect.top) / rect.height;

    const col = findClosest(xPercent, columns);
    const row = findClosest(yPercent, rows);

    console.log(`Clicked grid: ${col.letter}${row.row}`);
  });
});
