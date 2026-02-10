document.addEventListener("DOMContentLoaded", () => {
  console.log("🔥 CALIBRATION MODE — NO GRID LOGIC SHOULD RUN 🔥");

  const mapImage = document.getElementById("map-image");

  mapImage.addEventListener("click", (event) => {
    const rect = mapImage.getBoundingClientRect();
    const x = Math.round(event.clientX - rect.left);
    const y = Math.round(event.clientY - rect.top);

    console.log(`PIXEL CLICK → X=${x}, Y=${y}`);
  });
});
