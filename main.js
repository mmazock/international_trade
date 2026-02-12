document.addEventListener("DOMContentLoaded", () => {

  const database = firebase.database();
  const gamesRef = database.ref("games");

  const mapImage = document.getElementById("map-image");
  const mapContainer = document.getElementById("map-container");

  const createGameBtn = document.getElementById("createGameBtn");
  const joinGameBtn = document.getElementById("joinGameBtn");
  const joinCodeInput = document.getElementById("joinCodeInput");
  const playerNameInput = document.getElementById("playerNameInput");
  const countrySelect = document.getElementById("countrySelect");
  const joinStatus = document.getElementById("joinStatus");
  const inventoryList = document.getElementById("inventoryList");

  let currentGameCode = null;
  let currentPlayerId = null;

  const availableColors = [
    "red","purple","yellow","black",
    "blue","green","orange"
  ];

  const countryData = {
    Spain: { home: "C2" },
    Portugal: { home: "C3" },
    France: { home: "D2" },
    England: { home: "C1" },
    Germany: { home: "D1" },
    Italy: { home: "E2" }
  };

  /* =============================
     GRID CALIBRATION (Zoom Safe)
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

  function getScaledPosition(coord) {

    const col = coord[0];
    const row = parseInt(coord.slice(1));

    const colObj = columnPixels.find(c => c.letter === col);
    const rowObj = rowPixels.find(r => r.row === row);

    if (!colObj || !rowObj) return { x: 0, y: 0 };

    const rect = mapImage.getBoundingClientRect();

    const xPercent = colObj.x / originalWidth;
    const yPercent = rowObj.y / originalHeight;

    return {
      x: rect.width * xPercent,
      y: rect.height * yPercent
    };
  }

  function generateCode(length = 5) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  createGameBtn.addEventListener("click", async () => {

    let code = generateCode();
    const snapshot = await gamesRef.child(code).once("value");
    if (snapshot.exists()) code = generateCode();

    await gamesRef.child(code).set({
      players: {},
      turnOrder: [],
      currentTurnIndex: 0
    });

    currentGameCode = code;
    joinStatus.textContent = "Game created. Share this code: " + code;
  });

  joinGameBtn.addEventListener("click", async () => {

    const code = joinCodeInput.value.trim().toUpperCase();
    const name = playerNameInput.value.trim();
    const country = countrySelect.value;

    if (!code || !name || !country) {
      joinStatus.textContent = "Enter code, name, and select country.";
      return;
    }

    const snapshot = await gamesRef.child(code).once("value");
    if (!snapshot.exists()) {
      joinStatus.textContent = "Game not found.";
      return;
    }

    currentGameCode = code;

    const playersSnap = await gamesRef.child(code).child("players").once("value");
    const players = playersSnap.val() || {};

    const usedColors = Object.values(players).map(p => p.color);
    const color = availableColors.find(c => !usedColors.includes(c)) || "black";

    const initials = name.split(" ").map(n => n[0]).join("").toUpperCase();

    const newPlayerRef = gamesRef.child(code).child("players").push();

    await newPlayerRef.set({
      name: name,
      country: country,
      homePort: countryData[country].home,
      money: 0,
      infrastructure: 0,
      inventory: {},
      shipPosition: countryData[country].home,
      color: color,
      initials: initials
    });

    currentPlayerId = newPlayerRef.key;

    await gamesRef.child(code).child("turnOrder").transaction(order => {
      if (!order) return [currentPlayerId];
      return [...order, currentPlayerId];
    });

    hideSetupUI();
    listenToGameData();
  });

  function hideSetupUI() {
    createGameBtn.style.display = "none";
    joinGameBtn.style.display = "none";
    joinCodeInput.style.display = "none";
    playerNameInput.style.display = "none";
    countrySelect.style.display = "none";
    joinStatus.style.display = "none";
  }

  function listenToGameData() {

    const gameRef = gamesRef.child(currentGameCode);

    gameRef.on("value", snapshot => {

      const gameData = snapshot.val();
      if (!gameData) return;

      renderShips(gameData);
      renderLedger(gameData);
    });
  }

  function renderShips(gameData) {

    document.querySelectorAll(".ship").forEach(s => s.remove());

    const players = gameData.players || {};

    Object.keys(players).forEach(playerId => {

      const player = players[playerId];
      if (!player.shipPosition) return;

      const pos = getScaledPosition(player.shipPosition);

      const wrapper = document.createElement("div");
      wrapper.className = "ship";
      wrapper.style.position = "absolute";
      wrapper.style.left = pos.x + "px";
      wrapper.style.top = pos.y + "px";
      wrapper.style.width = "18px";
      wrapper.style.height = "18px";
      wrapper.style.transform = "translate(-50%, -50%)";

      const circle = document.createElement("div");
      circle.style.width = "18px";
      circle.style.height = "18px";
      circle.style.backgroundColor = player.color;
      circle.style.borderRadius = "50%";
      circle.style.position = "absolute";

      const shipImg = document.createElement("img");
      shipImg.src = "ship.png";
      shipImg.style.width = "14px";
      shipImg.style.position = "absolute";
      shipImg.style.left = "2px";
      shipImg.style.top = "2px";

      const label = document.createElement("div");
      label.textContent = player.initials;
      label.style.position = "absolute";
      label.style.fontSize = "8px";
      label.style.fontWeight = "bold";
      label.style.color = player.color === "yellow" ? "black" : "white";
      label.style.left = "3px";
      label.style.top = "4px";

      wrapper.appendChild(circle);
      wrapper.appendChild(shipImg);
      wrapper.appendChild(label);

      mapContainer.appendChild(wrapper);
    });
  }

  function renderLedger(gameData) {

    const players = gameData.players || {};
    const turnOrder = gameData.turnOrder || [];
    const currentTurnIndex = gameData.currentTurnIndex || 0;

    let html = "";

    turnOrder.forEach((playerId, index) => {

      const player = players[playerId];
      if (!player) return;

      const isCurrentTurn = index === currentTurnIndex;

      html += `<div style="border:1px solid #333; padding:8px; margin-bottom:10px;
              ${isCurrentTurn ? 'background-color:#d4edda;' : ''}">
              <strong>${player.name} (${player.country})</strong>
              ${isCurrentTurn ? ' (Current Turn)' : ''}
              <br>
              Money: $${player.money}
              <br>
              Infrastructure: ${player.infrastructure}
              <br>
              Inventory:
              <br>`;

      if (!player.inventory || Object.keys(player.inventory).length === 0) {
        html += `None`;
      } else {
        for (let resource in player.inventory) {
          html += `${resource}: ${player.inventory[resource]}<br>`;
        }
      }

      html += `</div>`;
    });

    inventoryList.innerHTML = html;
  }

});
