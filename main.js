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
  const playerHeader = document.getElementById("playerHeader");
  const rollDiceBtn = document.getElementById("rollDiceBtn");
const diceResult = document.getElementById("diceResult");


  const leaveGameBtn = document.getElementById("leaveGameBtn");

  let currentGameCode = null;
  let currentPlayerId = null;
let latestGameData = null;
/* =============================
   WATER MAP
   ============================= */

const waterSquares = new Set([
  // A & B full
  ...Array.from({length:14}, (_,i)=>`A${i}`),
  ...Array.from({length:14}, (_,i)=>`B${i}`),

  // C
  "C0","C1","C2","C3","C6","C7","C8","C9","C10","C11","C12","C13",

  // D
  "D0","D1","D2","D3","D6","D7","D8","D9","D10","D11","D12","D13",

  // E
  "E2","E3","E7","E8","E9","E10","E11","E12","E13",

  // F
  "F3","F10","F11","F12","F13",

  // G
  "G3","G4","G5","G8","G9","G10","G11","G12","G13",

  // H
  "H5","H6","H7","H8","H9","H10","H11","H12","H13",

  // I
  "I4","I5","I6","I7","I8","I9","I10","I11","I12","I13",

  // J, K, L, M
  ...Array.from({length:10},(_,i)=>`J${i+4}`),
  ...Array.from({length:10},(_,i)=>`K${i+4}`),
  ...Array.from({length:10},(_,i)=>`L${i+4}`),
  ...Array.from({length:10},(_,i)=>`M${i+4}`),

  // N
  ...Array.from({length:9},(_,i)=>`N${i+5}`),

  // O
  ...Array.from({length:10},(_,i)=>`O${i+4}`),

  // P
  "P3","P4","P5","P6","P7","P8","P10","P11","P12","P13",

  // Q
  "Q3","Q4","Q5","Q6","Q7","Q8","Q10","Q11","Q12","Q13",

  // R
  "R3","R4","R5","R6","R7","R8","R11","R12","R13",

  // S
  ...Array.from({length:12},(_,i)=>`S${i+2}`)
]);
/* =============================
   SPECIAL MOVEMENT RULES
   ============================= */

const restrictedTransitions = {
  "C2": ["C3", "B2", "C1"],
  "C1": ["C0", "C2", "B1"],
  "D1": ["D0"],
  "D2": ["E2", "D3"],
  "H6": ["I6", "H7"],
  "H5": ["G5", "I5"],
  "K4": ["J4", "K5"],
  "K5": ["J5", "K4", "K6"],  
  "N6": ["M6", "N7"],
  "N7": ["N6", "O7"],
  "M5": ["M6", "M4", "L5"],
  "M7": ["M8", "M6", "L7"],
  "N8": ["M8", "O8", "N9"],
  "O8": ["N8", "O9", "P8"],
  "P8": ["O8"]
};

  const availableColors = ["red","purple","yellow","black","blue","green","orange"];

  const countryData = {
    Spain: { home: "C2" },
    Portugal: { home: "C3" },
    France: { home: "D2" },
    England: { home: "C1" },
    Germany: { home: "D1" },
    Italy: { home: "E2" }
  };

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

    return {
      x: rect.width * (colObj.x / originalWidth),
      y: rect.height * (rowObj.y / originalHeight)
    };
  }

  /* =============================
     LOAD SAVED SESSION
     ============================= */

  const savedGameCode = localStorage.getItem("gameCode");
  const savedPlayerId = localStorage.getItem("playerId");

  if (savedGameCode && savedPlayerId) {
    currentGameCode = savedGameCode;
    currentPlayerId = savedPlayerId;
    hideSetupUI();
    listenToGameData();
  }

  /* =============================
     CREATE GAME
     ============================= */

  createGameBtn.addEventListener("click", async () => {

    const code = Math.random().toString(36).substring(2,7).toUpperCase();

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
      name,
      country,
      homePort: countryData[country].home,
      money: 0,
      infrastructure: 0,
      inventory: {},
      shipPosition: countryData[country].home,
      color,
      initials
    });

    currentPlayerId = newPlayerRef.key;

    await gamesRef.child(code).child("turnOrder").transaction(order => {
      if (!order) return [currentPlayerId];
      return [...order, currentPlayerId];
    });

    localStorage.setItem("gameCode", currentGameCode);
    localStorage.setItem("playerId", currentPlayerId);

    hideSetupUI();
    listenToGameData();
  });

  leaveGameBtn.addEventListener("click", () => {
    localStorage.removeItem("gameCode");
    localStorage.removeItem("playerId");
    location.reload();
  });
document.addEventListener("click", async function(event) {

  if (event.target && event.target.id === "rollDiceBtn") {

    const playerSnap = await gamesRef
      .child(currentGameCode)
      .child("players")
      .child(currentPlayerId)
      .once("value");

    const playerData = playerSnap.val();

    if (playerData.movesRemaining && playerData.movesRemaining > 0) {
      return;
    }

    const roll = Math.floor(Math.random() * 6) + 1;

    await gamesRef.child(currentGameCode)
      .child("players")
      .child(currentPlayerId)
      .update({ movesRemaining: roll });

  }

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

latestGameData = gameData;

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
      wrapper.style.width = "22px";
      wrapper.style.height = "22px";
      wrapper.style.transform = "translate(-50%, -50%)";

      const circle = document.createElement("div");
      circle.style.width = "22px";
      circle.style.height = "22px";
      circle.style.backgroundColor = player.color;
      circle.style.borderRadius = "50%";
      circle.style.display = "flex";
      circle.style.flexDirection = "column";
      circle.style.alignItems = "center";
      circle.style.justifyContent = "center";

      const shipImg = document.createElement("img");
      shipImg.src = "ship.png";
      shipImg.style.width = "14px";

      const label = document.createElement("div");
      label.textContent = player.initials;
      label.style.fontSize = "7px";
      label.style.fontWeight = "bold";
      label.style.color = player.color === "yellow" ? "black" : "white";

      circle.appendChild(shipImg);
      circle.appendChild(label);
      wrapper.appendChild(circle);
      mapContainer.appendChild(wrapper);
    });
  }
mapImage.addEventListener("click", async function(event) {

  if (!currentGameCode || !currentPlayerId) return;

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();

  const turnOrder = gameData.turnOrder;
  const currentTurnIndex = gameData.currentTurnIndex;

  if (turnOrder[currentTurnIndex] !== currentPlayerId) return;

  const player = gameData.players[currentPlayerId];

  if (!player.movesRemaining || player.movesRemaining <= 0) return;

const rect = mapImage.getBoundingClientRect();

const xPercent = (event.clientX - rect.left) / rect.width;
const yPercent = (event.clientY - rect.top) / rect.height;

const colObj = columnPixels.reduce((a,b)=>
  Math.abs((b.x/originalWidth) - xPercent) <
  Math.abs((a.x/originalWidth) - xPercent) ? b : a
);

const rowObj = rowPixels.reduce((a,b)=>
  Math.abs((b.y/originalHeight) - yPercent) <
  Math.abs((a.y/originalHeight) - yPercent) ? b : a
);

const target = colObj.letter + rowObj.row;
console.log("Clicked square:", target);
console.log("Current position:", player.shipPosition);
console.log("Moves remaining:", player.movesRemaining);


  if (!waterSquares.has(target)) return;

  const currentPos = player.shipPosition;

  const colDiff = target.charCodeAt(0) - currentPos.charCodeAt(0);
  const rowDiff = parseInt(target.slice(1)) - parseInt(currentPos.slice(1));

// Normal adjacency check
const isAdjacent =
  (Math.abs(colDiff) === 1 && rowDiff === 0) ||
  (Math.abs(rowDiff) === 1 && colDiff === 0);

if (!isAdjacent) return;

// Special movement restrictions (Malacca etc.)
if (restrictedTransitions[currentPos]) {
  const allowed = restrictedTransitions[currentPos];
  if (!allowed.includes(target)) return;
}


  await gamesRef.child(currentGameCode)
    .child("players")
    .child(currentPlayerId)
    .update({
      shipPosition: target,
      movesRemaining: player.movesRemaining - 1
    });

});

  function renderLedger(gameData) {

    const players = gameData.players || {};
    if (players[currentPlayerId]) {
  const me = players[currentPlayerId];
  playerHeader.textContent = `Player: ${me.name} (${me.country})`;
}
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
if (player.movesRemaining !== undefined) {
  html += `<br>Moves Remaining: ${player.movesRemaining}`;
}

if (isCurrentTurn && playerId === currentPlayerId && (!player.movesRemaining || player.movesRemaining === 0)) {
  html += `<br><button id="rollDiceBtn">Roll Dice</button>`;
}


      html += `</div>`;
    });

    inventoryList.innerHTML = html;
  }
window.addEventListener("resize", () => {
  if (latestGameData) {
    renderShips(latestGameData);
  }
});

});
