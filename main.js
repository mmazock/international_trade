const mapImage = document.getElementById("map-image");

mapImage.addEventListener("click", function (event) {
  const rect = mapImage.getBoundingClientRect();

  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  console.log(`Map clicked at: X=${Math.round(x)}, Y=${Math.round(y)}`);
});
