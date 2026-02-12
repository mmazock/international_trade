document.addEventListener("DOMContentLoaded", () => {

  const database = firebase.database();
  const gamesRef = database.ref("games");

  const mapContainer = document.getElementById("map-container");
  const createGameBtn = document.getElementById("createGameBtn");
  const joinGameBtn = document.getElementById("joinGameBtn");
  const joinCodeInput = document.getElementById("joinCodeInput");
  const playerNameInput = document.getElementById("playerNameInput");
  const joinStatus = document.getElementById("joinStatus");
  const inventoryList = document.getElementById("inventoryList");

  let currentGameCode = null;
  let currentPlayerId = null;

  const availableColors = [
    "red",
    "purple",
    "yellow",
    "black",
    "blue",
    "green",
    "orange"
  ];

  function generateCode(length = 5) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /* =============================
     CREATE GAME
     ============================= */

  createGameBtn.addEventListener("click", async () => {

    let code = generateCode();
    const snapshot = await gamesRef.child(code).once("value");

    if (snapshot.exists()) {
      code = generateCode();
    }

    await gamesRef.child(code).set({
      players: {},
      turnOrder: [],
      currentTurnIndex: 0
    });

    currentGameCode = code;
    joinStatus.textContent = "Game created. Share this code: " + code;
  });

  /* =============================
     JOIN GAME
     ============================= */

  joinGameBtn.addEventListener("click", async () => {

    const code = joinCodeInput.value.trim().toUpperCase();
    const name = playerNameInput.value.trim();

    if (!code || !name) {
      joinStatus.textContent = "Enter join code and name.";
      return;
    }

    const snapshot = await gamesRef.child(code).once("value");

    if (!snapshot.exists()) {
      joinStatus.textContent = "Game code not found.";
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
      money: 0,
      infrastructure: 0,
      inventory: {},
      shipPosition: "C6",
      color: color,
      initials: initials
    });

    currentPlayerId = newPlayerRef.key;

    await gamesRef.child(code).child("turnOrder").transaction(order => {
      if (!order) return [currentPlayerId];
      return [...order, currentPlayerId];
    });

    joinStatus.textContent = "Joined game: " + code;

    listenToGameData();
  });

  /* =============================
     LISTEN TO GAME DATA
     ============================= */

  function listenToGameData() {

    const gameRef = gamesRef.child(currentGameCode);

    gameRef.on("value", snapshot => {
      const gameData = snapshot.val();
      if (!gameData) return;

      renderShips(gameData);
      renderLedger(gameData);
    });
  }

  /* =============================
     RENDER SHIPS
     ============================= */

  function renderShips(gameData) {

    document.querySelectorAll(".ship").forEach(s => s.remove());

    const players = gameData.players || {};

    Object.keys(players).forEach(playerId => {

      const player = players[playerId];
      if (!player.shipPosition) return;

      const ship = document.createElement("div");
      ship.className = "ship";

      ship.style.position = "absolute";
      ship.style.width = "40px";
      ship.style.height = "40px";
      ship.style.backgroundImage = "url('ship.png')";
      ship.style.backgroundSize = "contain";
      ship.style.backgroundRepeat = "no-repeat";
      ship.style.filter = `drop-shadow(0 0 0 ${player.color})`;

      const label = document.createElement("div");
      label.textContent = player.initials;
      label.style.position = "absolute";
      label.style.top = "10px";
      label.style.left = "12px";
      label.style.color = "white";
      label.style.fontWeight = "bold";
      label.style.fontSize = "12px";

      ship.appendChild(label);

      // TEMP: random positioning until movement system added
      ship.style.left = Math.random() * 300 + "px";
      ship.style.top = Math.random() * 150 + "px";

      mapContainer.appendChild(ship);
    });
  }

  /* =============================
     RENDER LEDGER
     ============================= */

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
              <strong>${player.name}</strong>
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
