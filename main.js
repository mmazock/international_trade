document.addEventListener("DOMContentLoaded", () => {

  const database = firebase.database();
  const gamesRef = database.ref("games");
// Cleanup inactive games (older than 15 minutes)
(async function cleanupOldGames() {

  const snapshot = await gamesRef.once("value");
  const games = snapshot.val();

  if (!games || typeof games !== "object") return;

  const now = Date.now();
  const fifteenMinutes = 15 * 60 * 1000;

  for (const gameId of Object.keys(games)) {

    const game = games[gameId];

    if (!game || !game.lastActive) continue;

    if (now - game.lastActive > fifteenMinutes) {
      await gamesRef.child(gameId).remove();
      console.log("Deleted inactive game:", gameId);
    }
  }

})();


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
  const leaveGameBtn = document.getElementById("leaveGameBtn");
  const phaseDisplay = document.getElementById("phaseDisplay");
  const endPhaseBtn = document.getElementById("endPhaseBtn");

  let currentGameCode = null;
  let currentPlayerId = null;
  let latestGameData = null;

  /* =============================
     WATER MAP
     ============================= */

  const waterSquares = new Set([
    ...Array.from({length:14}, (_,i)=>`A${i}`),
    ...Array.from({length:14}, (_,i)=>`B${i}`),
    "C0","C1","C2","C3","C6","C7","C8","C9","C10","C11","C12","C13",
    "D0","D1","D2","D3","D6","D7","D8","D9","D10","D11","D12","D13",
    "E2","E3","E7","E8","E9","E10","E11","E12","E13",
    "F3","F10","F11","F12","F13",
    "G3","G4","G5","G8","G9","G10","G11","G12","G13",
    "H5","H6","H7","H8","H9","H10","H11","H12","H13",
    "I4","I5","I6","I7","I8","I9","I10","I11","I12","I13",
    ...Array.from({length:10},(_,i)=>`J${i+4}`),
    ...Array.from({length:10},(_,i)=>`K${i+4}`),
    ...Array.from({length:10},(_,i)=>`L${i+4}`),
    ...Array.from({length:10},(_,i)=>`M${i+4}`),
    ...Array.from({length:9},(_,i)=>`N${i+5}`),
    ...Array.from({length:10},(_,i)=>`O${i+4}`),
    "P3","P4","P5","P6","P7","P8","P10","P11","P12","P13",
    "Q3","Q4","Q5","Q6","Q7","Q8","Q10","Q11","Q12","Q13",
    "R3","R4","R5","R6","R7","R8","R11","R12","R13",
    ...Array.from({length:12},(_,i)=>`S${i+2}`)
  ]);

  /* =============================
     MALACCA RULE
     ============================= */

  const restrictedTransitions = {
    "D1": ["D0"],
    "C1": ["C0", "B1", "C2"],
    "C2": ["C3", "B2", "C1"],
    "D2": ["E2", "D3"],
    "H5": ["G5", "I5"],
    "H6": ["I6", "H7"],
    "K4": ["J4", "K5"],
    "K5": ["K6", "K4", "J5"],
    "L5": ["L4", "M5", "L6"],
    "L4": ["M4", "L5"],
    "M5": ["M4", "L5", "M6"],
    "M7": ["M6", "M8", "L7"],
    "N5": ["N6", "O5"],
    "N7": ["N6", "O7"],
    "P7": ["P6", "O7", "Q7"],
    "P8": ["O8"],
    "Q8": ["Q7", "R8"]
  };
/* =============================
   HARVEST ZONES
   ============================= */

const harvestZones = {

  // West Africa
  "C6": { region: "West Africa" },
  "D6": { region: "West Africa" },

  // Central Africa
  "E7": { region: "Central Africa" },
  "E8": { region: "Central Africa" },

  // Southern Africa
  "E9": { region: "Southern Africa" },
  "E10": { region: "Southern Africa" },
  "F10": { region: "Southern Africa" },
  "G9": { region: "Southern Africa" },
  "G8": { region: "Southern Africa" },

  // Eastern Africa
  "H7": { region: "Eastern Africa" },
  "H6": { region: "Eastern Africa" },

  // Arabian Peninsula
  "I5": { region: "Arabian Peninsula" },
  "I4": { region: "Arabian Peninsula" },

  // Indian Subcontinent
  "J4": { region: "Indian Subcontinent" },
  "K4": { region: "Indian Subcontinent" },
  "K5": { region: "Indian Subcontinent" },
  "K6": { region: "Indian Subcontinent" },
  "L5": { region: "Indian Subcontinent" },
  "L4": { region: "Indian Subcontinent" },
  "M4": { region: "Indian Subcontinent" },

  // Southeast Asia
  "M5": { region: "Southeast Asia" },
  "N5": { region: "Southeast Asia" },

  // China
  "O4": { region: "China" },
  "P4": { region: "China" },
  "P3": { region: "China" },

  // Japan
  "Q3": { region: "Japan" },
  "R3": { region: "Japan" }
};

  /* =============================
   REGION RESOURCES
   ============================= */

const regionResources = {

  "West Africa": ["Gold", "Ivory"],

  "Central Africa": ["Gold", "Ivory", "Copper"],

  "Southern Africa": ["Gold", "Ivory", "Copper", "Iron", "Diamonds"],

  "Eastern Africa": ["Spices", "Ivory"],

  "Arabian Peninsula": ["Oil", "Spices"],

  "Indian Subcontinent": ["Spices", "Coal", "Cotton", "Rice"],

  "Southeast Asia": ["Coal", "Rice", "Oil"],

  "China": ["Silk", "Porcelain", "Rice", "Cotton", "Spices", "Iron"],

  "Japan": ["Copper", "Coal"]
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
    const rect = mapImage.getBoundingClientRect();
    return {
      x: rect.width * (colObj.x / originalWidth),
      y: rect.height * (rowObj.y / originalHeight)
    };
  }

  /* =============================
     SESSION LOAD
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
  currentTurnIndex: 0,
  currentPhase: 0,
  lastActive: Date.now()
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
      initials,
      movesRemaining: 0,
      rollValue: null
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

leaveGameBtn.addEventListener("click", async () => {

  if (!currentGameCode || !currentPlayerId) {
    location.reload();
    return;
  }

  // Remove this player from Firebase
  await games


  function hideSetupUI() {
    createGameBtn.style.display = "none";
    joinGameBtn.style.display = "none";
    joinCodeInput.style.display = "none";
    playerNameInput.style.display = "none";
    countrySelect.style.display = "none";
    joinStatus.style.display = "none";
  }

  function listenToGameData() {

    gamesRef.child(currentGameCode).on("value", snapshot => {

      const gameData = snapshot.val();
      if (!gameData) return;

      latestGameData = gameData;

      renderShips(gameData);
      renderLedger(gameData);
    });
  }

  /* =============================
     PHASE ENGINE
     ============================= */

  endPhaseBtn.addEventListener("click", async () => {

    const gameSnap = await gamesRef.child(currentGameCode).once("value");
    const gameData = gameSnap.val();

    const turnOrder = gameData.turnOrder;
    const currentTurnIndex = gameData.currentTurnIndex;
    const currentPhase = gameData.currentPhase || 0;

    if (turnOrder[currentTurnIndex] !== currentPlayerId) return;

    if (currentPhase < 2) {

      const newPhase = currentPhase + 1;

await gamesRef.child(currentGameCode).update({
  currentPhase: newPhase,
  lastActive: Date.now()
});


      if (newPhase === 2) {
        await gamesRef.child(currentGameCode)
          .child("players")
          .child(currentPlayerId)
          .update({
            movesRemaining: 0,
            rollValue: null
          });
      }

    } else {

      let nextTurn = currentTurnIndex + 1;
      if (nextTurn >= turnOrder.length) nextTurn = 0;

await gamesRef.child(currentGameCode).update({
  currentTurnIndex: nextTurn,
  currentPhase: 0,
  lastActive: Date.now()
});

    }
  });

  /* =============================
     DICE
     ============================= */

document.addEventListener("click", async function(event) {

  /* =============================
     ROLL DICE
     ============================= */

  if (event.target && event.target.id === "rollDiceBtn") {

    const gameSnap = await gamesRef.child(currentGameCode).once("value");
    const gameData = gameSnap.val();

    if (!gameData || gameData.currentPhase !== 2) return;

    const turnOrder = gameData.turnOrder;
    const currentTurnIndex = gameData.currentTurnIndex;

    if (turnOrder[currentTurnIndex] !== currentPlayerId) return;

    const player = gameData.players[currentPlayerId];

    if (player.rollValue) return;

    const roll = Math.floor(Math.random() * 6) + 1;

const newMoves = player.movesRemaining - 1;

await gamesRef
  .child(currentGameCode)
  .child("players")
  .child(currentPlayerId)
  .update({
    shipPosition: target,
    movesRemaining: newMoves
  });


if (newMoves === 0) {

const updatedSnap = await gamesRef.child(currentGameCode).once("value");

  const updatedData = updatedSnap.val();

  let nextTurn = updatedData.currentTurnIndex + 1;
  if (nextTurn >= updatedData.turnOrder.length) nextTurn = 0;

await gamesRef.child(currentGameCode).update({

    currentTurnIndex: nextTurn,
    currentPhase: 0
  });
}

  }


/* =============================
   HARVEST
   ============================= */

if (event.target && event.target.id === "harvestBtn") {

  const gameSnap = .child(currentGameCode).once("value");
  const gameData = gameSnap.val();

  if (!gameData || gameData.currentPhase !== 2) return;

  const turnOrder = gameData.turnOrder;
  const currentTurnIndex = gameData.currentTurnIndex;

  if (turnOrder[currentTurnIndex] !== currentPlayerId) return;

  const player = gameData.players[currentPlayerId];

  if (!harvestZones[player.shipPosition]) return;

  const region = harvestZones[player.shipPosition].region;

  // --- Country Guess Phase ---

  let answered = false;

  const timer = setTimeout(async () => {
    if (!answered) {
      alert("Time expired. Turn over.");
      await endTurnEarly();
    }
  }, 15000);

  const countryGuess = prompt("Name a country in " + region + ":");

  answered = true;
  clearTimeout(timer);

  if (!countryGuess) {
    alert("No answer. Turn over.");
    await endTurnEarly();
    return;
  }

  // TODO: Add real validation later
  startHarvestSelection(region);
}

async function endTurnEarly() {

  const gameSnap = .child(currentGameCode).once("value");
  const gameData = gameSnap.val();

  let nextTurn = gameData.currentTurnIndex + 1;
  if (nextTurn >= gameData.turnOrder.length) nextTurn = 0;

await gamesRef.child(currentGameCode).update({
  lastActive: Date.now()
});

await gamesRef.child(currentGameCode)
  .child("players")
  .child(currentPlayerId)
  .update({
    movesRemaining: roll,
    rollValue: roll
  });


await gamesRef.child(currentGameCode).update({
  currentTurnIndex: nextTurn,
  currentPhase: 0
});

}


});


  /* =============================
     MOVEMENT
     ============================= */

  mapImage.addEventListener("click", async function(event) {

    const gameSnap = await gamesRef.child(currentGameCode).once("value");
    const gameData = gameSnap.val();

    if (gameData.currentPhase !== 2) return;

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

    if (!waterSquares.has(target)) return;

    const currentPos = player.shipPosition;

    const colDiff = target.charCodeAt(0) - currentPos.charCodeAt(0);
    const rowDiff = parseInt(target.slice(1)) - parseInt(currentPos.slice(1));

    const isAdjacent =
      (Math.abs(colDiff) === 1 && rowDiff === 0) ||
      (Math.abs(rowDiff) === 1 && colDiff === 0);

    if (!isAdjacent) return;

    if (restrictedTransitions[currentPos]) {
      if (!restrictedTransitions[currentPos].includes(target)) return;
    }

await gamesRef.child(currentGameCode).update({
  lastActive: Date.now()
});

await gamesRef.child(currentGameCode)
  .child("players")
  .child(currentPlayerId)
  .update({
    shipPosition: target,
    movesRemaining: newMoves
  });

  });

 


  /* =============================
     RENDERING
     ============================= */

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
async function startHarvestSelection(region) {

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();

  const player = gameData.players[currentPlayerId];

  const harvestCapacity = 1 + (player.infrastructure || 0);
  let remaining = harvestCapacity;

  const resources = regionResources[region];

  const messageBox = document.getElementById("messageBox");

  function renderSelection() {

    messageBox.innerHTML = `
      <strong>You may harvest ${remaining} resource(s).</strong><br><br>
    `;

    resources.forEach(resource => {
      const btn = document.createElement("button");
      btn.textContent = resource;
      btn.onclick = async () => {

        const updatedSnap = await gamesRef.child(currentGameCode).once("value");
        const updatedData = updatedSnap.val();

        const currentInventory =
          updatedData.players[currentPlayerId].inventory || {};

        const currentAmount = currentInventory[resource] || 0;

        await gamesRef.child(currentGameCode)
          .child("players")
          .child(currentPlayerId)
          .update({
            inventory: {
              ...currentInventory,
              [resource]: currentAmount + 1
            }
          });

        remaining--;

if (remaining <= 0) {

  messageBox.innerHTML = "";

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();

  let nextTurn = gameData.currentTurnIndex + 1;
  if (nextTurn >= gameData.turnOrder.length) nextTurn = 0;

  await gamesRef.child(currentGameCode).update({
  currentTurnIndex: nextTurn,
  currentPhase: 0,
  lastActive: Date.now()
});

}

 else {
          renderSelection();
        }
      };

      messageBox.appendChild(btn);
      messageBox.appendChild(document.createElement("br"));
      messageBox.appendChild(document.createElement("br"));
    });
  }

  renderSelection();
}

  function renderLedger(gameData) {

    const players = gameData.players || {};
    const turnOrder = gameData.turnOrder || [];
    const currentTurnIndex = gameData.currentTurnIndex || 0;
    const currentPhase = gameData.currentPhase || 0;

    const phaseNames = ["Give Phase", "Upgrade Phase", "Movement Phase"];
    phaseDisplay.textContent = phaseNames[currentPhase];

    if (players[currentPlayerId]) {
      const me = players[currentPlayerId];
      playerHeader.textContent = `Player: ${me.name} (${me.country})`;
    }

    let html = "";

    turnOrder.forEach((playerId, index) => {

      const player = players[playerId];
      if (!player) return;

      const isCurrentTurn = index === currentTurnIndex;
      const onHarvestSquare = harvestZones[player.shipPosition] !== undefined;

console.log("ROLL CHECK:", {
  isCurrentTurn,
  playerId,
  currentPlayerId,
  currentPhase,
  rollValue: player.rollValue
});

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

      if (isCurrentTurn && playerId === currentPlayerId && currentPhase === 2 && !player.rollValue) {
        html += `<br><button id="rollDiceBtn">Roll Dice</button>`;
      }
if (
  isCurrentTurn &&
  playerId === currentPlayerId &&
  currentPhase === 2 &&
  onHarvestSquare &&
  player.rollValue &&               // must have rolled
  player.movesRemaining > 0         // must still have movement left
) {
  html += `<br><button id="harvestBtn">Harvest</button>`;
}


      if (player.movesRemaining > 0) {
        html += `<br>Moves Remaining: ${player.movesRemaining}`;
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
