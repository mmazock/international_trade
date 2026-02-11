document.addEventListener("DOMContentLoaded", () => {

  const mapImage = document.getElementById("map-image");
  const messageBox = document.getElementById("messageBox");
  const inventoryList = document.getElementById("inventoryList");
  const infraDisplay = document.getElementById("infraLevel");

  /* =============================
     PLAYER STATE
     ============================= */

  let player = {
    infrastructure: 0,
    inventory: {}
  };

  function updateInventoryDisplay() {
    if (Object.keys(player.inventory).length === 0) {
      inventoryList.innerHTML = "No resources collected yet.";
      return;
    }

    let html = "";
    for (let resource in player.inventory) {
      html += `${resource}: ${player.inventory[resource]}<br>`;
    }
    inventoryList.innerHTML = html;
  }

  function normalize(input) {
    return input.trim().toLowerCase();
  }

  function showMessage(html) {
    messageBox.innerHTML = html;
  }

  /* =============================
     ZOOM SAFE GRID
     ============================= */

  const originalWidth = 275;
  const originalHeight = 150;

  const columnPixels = [
    { letter: "A", x: 10 }, { letter: "B", x: 23 }, { letter: "C", x: 38 },
    { letter: "D", x: 53 }, { letter: "E", x: 67 }, { letter: "F", x: 81 },
    { letter: "G", x: 95 }, { letter: "H", x: 110 }, { letter: "I", x: 124 },
    { letter: "J", x: 138 }, { letter: "K", x: 153 }, { letter: "L", x: 168 },
    { letter: "M", x: 182 }, { letter: "N", x: 196 }, { letter: "O", x: 211 },
    { letter: "P", x: 225 }, { letter: "Q", x: 240 }, { letter: "R", x: 254 },
    { letter: "S", x: 267 }
  ];

  const rowPixels = [
    { row: 0, y: 7 }, { row: 1, y: 18 }, { row: 2, y: 29 },
    { row: 3, y: 39 }, { row: 4, y: 50 }, { row: 5, y: 60 },
    { row: 6, y: 71 }, { row: 7, y: 83 }, { row: 8, y: 92 },
    { row: 9, y: 102 }, { row: 10, y: 113 }, { row: 11, y: 123 },
    { row: 12, y: 134 }, { row: 13, y: 144 }
  ];

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

  /* =============================
     REGION RESOURCE TABLES
     ============================= */

  const regionResources = {
    "West Africa": ["Gold", "Ivory"],
    "Central Africa": ["Gold", "Ivory", "Copper"],
    "Southern Africa": ["Gold", "Ivory", "Copper", "Iron"],
    "Eastern Africa": ["Spices", "Ivory"],
    "Arabian Peninsula": ["Oil", "Spices"],
    "Indian Subcontinent": ["Spices", "Coal", "Cotton", "Rice"],
    "Southeast Asia": ["Coal", "Rice", "Oil"],
    "China": ["Silk", "Porcelain", "Rice", "Cotton", "Spices", "Iron"],
    "Japan": ["Copper", "Coal"]
  };

  /* =============================
     HARVEST SQUARES
     ============================= */

  const harvestSquares = {
    "C6": { region: "West Africa", countries: ["Liberia", "Côte d’Ivoire", "Cote D'Ivoire", "Cote DIvoire", "Cote Divoire", "Ivory Coast", "Ghana"] },
    "D6": { region: "West Africa", countries: ["Togo", "Benin", "Nigeria", "Cameroon"] },
    "E7": { region: "Central Africa", countries: ["Gabon", "Republic of the Congo", "Democratic Republic of the Congo", "Angola"] },
    "E8": { region: "Central Africa", countries: ["Angola", "Namibia"] },
    "E9": { region: "Southern Africa", countries: ["Namibia", "South Africa"] },
    "E10": { region: "Southern Africa", countries: ["South Africa"], special: "diamonds" },
    "F10": { region: "Southern Africa", countries: ["South Africa"] },
    "G9": { region: "Southern Africa", countries: ["South Africa", "Mozambique"] },
    "G8": { region: "Southern Africa", countries: ["Mozambique"] },
    "H7": { region: "Eastern Africa", countries: ["Kenya"] },
    "H6": { region: "Eastern Africa", countries: ["Somalia", "Kenya"] },
    "I5": { region: "Arabian Peninsula", countries: ["Yemen", "Oman"] },
    "I4": { region: "Arabian Peninsula", countries: ["Oman", "United Arab Emirates", "Qatar", "Bahrain", "Saudi Arabia", "Iran"] },
    "J4": { region: "Indian Subcontinent", countries: ["Iran", "Pakistan", "India"] },
    "K4": { region: "Indian Subcontinent", countries: ["India"] },
    "K5": { region: "Indian Subcontinent", countries: ["India"] },
    "K6": { region: "Indian Subcontinent", countries: ["India"] },
    "L5": { region: "Indian Subcontinent", countries: ["India"] },
    "L4": { region: "Indian Subcontinent", countries: ["India", "Bangladesh"] },
    "M4": { region: "Indian Subcontinent", countries: ["India", "Bangladesh", "Myanmar"] },
    "M5": { region: "Southeast Asia", countries: ["Myanmar"] },
    "N5": { region: "Southeast Asia", countries: ["Thailand", "Cambodia", "Vietnam"] },
    "O4": { region: "China", countries: ["China"] },
    "P4": { region: "China", countries: ["China"] },
    "P3": { region: "China", countries: ["China", "North Korea", "South Korea"] },
    "Q3": { region: "Japan", countries: ["Japan"] },
    "R3": { region: "Japan", countries: ["Japan"] }
  };

  /* =============================
     CLICK HANDLER
     ============================= */

  mapImage.addEventListener("click", (event) => {

    const rect = mapImage.getBoundingClientRect();
    const xPercent = (event.clientX - rect.left) / rect.width;
    const yPercent = (event.clientY - rect.top) / rect.height;

    const col = findClosest(xPercent, columns);
    const row = findClosest(yPercent, rows);
    const coord = `${col.letter}${row.row}`;

    if (!harvestSquares[coord]) {
      showMessage(`<strong>${coord}</strong><br>Not a harvest square.`);
      return;
    }

    const square = harvestSquares[coord];

    showCountryInput(coord, square);

  });

  function showCountryInput(coord, square) {

    let html = `
      <strong>${coord}</strong><br><br>
      Identify a country in this square:<br><br>
      <input type="text" id="countryInput">
      <button id="submitCountry">Submit</button>
    `;

    showMessage(html);

    document.getElementById("submitCountry").addEventListener("click", () => {

      const answer = document.getElementById("countryInput").value;
      const normalizedAnswer = normalize(answer);
      const valid = square.countries.map(normalize);

      if (!valid.includes(normalizedAnswer)) {
        showMessage("Incorrect country for this square.");
        return;
      }

      let resources = regionResources[square.region] || [];

      if (coord === "E10") {
        resources = [...resources, "Diamonds"];
      }

      displayResourceButtons(square.region, resources);

    });
  }

  function displayResourceButtons(region, resources) {

    let html = `<strong>Correct!</strong><br>`;
    html += `Region: ${region}<br><br>`;
    html += `Select a resource to harvest:<br><br>`;

    resources.forEach(resource => {
      html += `<button class="resourceBtn" data-resource="${resource}">${resource}</button><br><br>`;
    });

    showMessage(html);

    document.querySelectorAll(".resourceBtn").forEach(button => {
      button.addEventListener("click", () => {

        const resource = button.dataset.resource;
        const amount = 1 + player.infrastructure;

        if (!player.inventory[resource]) {
          player.inventory[resource] = 0;
        }

        player.inventory[resource] += amount;

        updateInventoryDisplay();

        showMessage(`Collected ${amount} unit(s) of ${resource}.`);

      });
    });
  }

});
