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
   HARVEST ZONES (Square Specific)
   ============================= */

const harvestZones = {

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

  /* =============================
   BASE RESOURCE VALUES
   ============================= */

const baseResourceValues = {
  "Diamonds": 70,
  "Gold": 20,
  "Ivory": 20,
  "Oil": 70,
  "Spices": 50,
  "Cotton": 40,
  "Rice": 60,
  "Coal": 40,
  "Iron": 20,
  "Copper": 20,
  "Silk": 80,
  "Porcelain": 80
};


  const availableColors = ["red","purple","yellow","black","blue","green","orange"];

const countryData = {

  Spain: {
    home: "C2",
    multipliers: {
      "Gold": 1.5,
      "Ivory": 1,
      "Spices": 0.5,
      "Copper": 1
    }
  },

  Portugal: {
    home: "C3",
    multipliers: {
      "Rice": 2,
      "Silk": 1.5,
      "Ivory": 0.5
    }
  },

  England: {
    home: "C1",
    multipliers: {
      "Porcelain": 2,
      "Silk": 2,
      "Gold": 0.5,
      "Copper": 0.5
    }
  },

  France: {
    home: "D2",
    multipliers: {
      "Cotton": 1.5,
      "Rice": 1.5,
      "Spices": 0.5,
      "Ivory": 0.5
    }
  },

  Italy: {
    home: "E2",
    multipliers: {
      "Gold": 1.5,
      "Spices": 2,
      "Silk": 1.5,
      "Rice": 1.5
    }
  },

  Germany: {
    home: "D1",
    multipliers: {
      "Oil": 1.5,
      "Coal": 1.5,
      "Diamonds": 1.5
    }
  }

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
  round: 1,
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
  multipliers: countryData[country].multipliers,
  money: 0,
  upgrades: {
    transport: 0,
    navigation: 0,
    weapons: 0
  },
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

  const gameRef = gamesRef.child(currentGameCode);

  // Remove player
  await gameRef.child("players").child(currentPlayerId).remove();

  // Update turn order
  const snap = await gameRef.once("value");
  const gameData = snap.val();

  if (gameData && gameData.turnOrder) {

    const updatedOrder = gameData.turnOrder.filter(
      id => id !== currentPlayerId
    );

    await gameRef.update({
      turnOrder: updatedOrder
    });

    // If no players left, delete game
    if (updatedOrder.length === 0) {
      await gameRef.remove();
    }
  }

  localStorage.removeItem("gameCode");
  localStorage.removeItem("playerId");

  location.reload();
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

      document.getElementById("messageBox").innerHTML = "";

await gamesRef.child(currentGameCode).update({
  currentPhase: newPhase,
  lastActive: Date.now()
});



    } else {

      let nextTurn = currentTurnIndex + 1;
      if (nextTurn >= turnOrder.length) nextTurn = 0;

const nextPlayerId = gameData.turnOrder[nextTurn];

await gamesRef.child(currentGameCode)
  .child("players")
  .child(nextPlayerId)
  .update({
    movesRemaining: 0,
    rollValue: null
  });

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

/* =============================
   CLICK HANDLER
   ============================= */

document.addEventListener("click", async function(event) {
/* ===== UPGRADE PHASE PROMPT ===== */

if (event.target && event.target.id === "upgradeNoBtn") {

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();

  if (!gameData || gameData.currentPhase !== 1) return;

  const turnOrder = gameData.turnOrder;
  const currentTurnIndex = gameData.currentTurnIndex;

  if (turnOrder[currentTurnIndex] !== currentPlayerId) return;

  // Clear upgrade UI
  const messageBox = document.getElementById("messageBox");
  messageBox.innerHTML = "";

  await gamesRef.child(currentGameCode).update({
    currentPhase: 2,
    lastActive: Date.now()
  });

  return;
}


if (event.target && event.target.id === "upgradeYesBtn") {

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();

  if (!gameData || gameData.currentPhase !== 1) return;

  const turnOrder = gameData.turnOrder;
  const currentTurnIndex = gameData.currentTurnIndex;

  if (turnOrder[currentTurnIndex] !== currentPlayerId) return;

  showUpgradeOptions();
  return;
}
 /* ===== TRANSPORT UPGRADE ===== */

if (event.target && event.target.id === "upgradeTransport") {

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();

  if (!gameData || gameData.currentPhase !== 1) return;

  const turnOrder = gameData.turnOrder;
  const currentTurnIndex = gameData.currentTurnIndex;

  if (turnOrder[currentTurnIndex] !== currentPlayerId) return;

  const player = gameData.players[currentPlayerId];

  if (player.money < 150) {
    alert("Not enough money. Cost is $150.");
    return;
  }

  // Deduct money first
  await gamesRef.child(currentGameCode)
    .child("players")
    .child(currentPlayerId)
    .update({
      money: player.money - 150
    });

  const success = Math.random() < 0.75;

  if (success) {
    await gamesRef.child(currentGameCode)
      .child("players")
      .child(currentPlayerId)
      .update({
        "upgrades/transport": (player.upgrades?.transport || 0) + 1
      });

    alert("Transport upgrade successful!");
  } else {
    alert("Transport upgrade failed. Investment lost.");
  }

  await gamesRef.child(currentGameCode).update({
    lastActive: Date.now()
  });

  return;
}
 /* ===== NAVIGATION UPGRADE ===== */

if (event.target && event.target.id === "upgradeNavigation") {

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();

  if (!gameData || gameData.currentPhase !== 1) return;

  const turnOrder = gameData.turnOrder;
  const currentTurnIndex = gameData.currentTurnIndex;

  if (turnOrder[currentTurnIndex] !== currentPlayerId) return;

  const player = gameData.players[currentPlayerId];

  if ((player.upgrades?.navigation || 0) >= 3) {
    alert("Navigation is already at maximum level.");
    return;
  }

  if (player.money < 100) {
    alert("Not enough money. Cost is $100.");
    return;
  }

  await gamesRef.child(currentGameCode)
    .child("players")
    .child(currentPlayerId)
    .update({
      money: player.money - 100
    });

  const success = Math.random() < 0.75;

  if (success) {
    await gamesRef.child(currentGameCode)
      .child("players")
      .child(currentPlayerId)
      .update({
        "upgrades/navigation": (player.upgrades?.navigation || 0) + 1
      });

    alert("Navigation upgrade successful!");
  } else {
    alert("Navigation upgrade failed. Investment lost.");
  }

  await gamesRef.child(currentGameCode).update({
    lastActive: Date.now()
  });

  return;
}


  /* ===== ROLL DICE ===== */

  if (event.target && event.target.id === "rollDiceBtn") {

    const gameSnap = await gamesRef.child(currentGameCode).once("value");
    const gameData = gameSnap.val();

    if (!gameData || gameData.currentPhase !== 2) return;

    const turnOrder = gameData.turnOrder;
    const currentTurnIndex = gameData.currentTurnIndex;

    if (turnOrder[currentTurnIndex] !== currentPlayerId) return;

    const player = gameData.players[currentPlayerId];

    if (player.rollValue) return;

    const maxRoll = 6 + ((player.upgrades?.navigation || 0) * 3);
const roll = Math.floor(Math.random() * maxRoll) + 1;


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
  }

  /* ===== HARVEST ===== */

  if (event.target && event.target.id === "harvestBtn") {

    const gameSnap = await gamesRef.child(currentGameCode).once("value");
    const gameData = gameSnap.val();

    if (!gameData || gameData.currentPhase !== 2) return;

    const turnOrder = gameData.turnOrder;
    const currentTurnIndex = gameData.currentTurnIndex;

    if (turnOrder[currentTurnIndex] !== currentPlayerId) return;

    const player = gameData.players[currentPlayerId];

    if (!harvestZones[player.shipPosition]) return;

    const region = harvestZones[player.shipPosition].region;

    let answered = false;

    const timer = setTimeout(async () => {
      if (!answered) {
        alert("Time expired. Turn over.");
        await advanceTurn();
      }
    }, 15000);

const countryGuess = prompt("Name a country at this location:");


answered = true;
clearTimeout(timer);

if (!countryGuess) {
  alert("No answer. Turn over.");
  await advanceTurn();
  return;
}

const square = player.shipPosition;
const validCountries = harvestZones[square].countries;

const normalizedGuess = countryGuess.trim().toLowerCase();

const isValid = validCountries.some(country =>
  country.toLowerCase() === normalizedGuess
);

if (!isValid) {
  alert("Incorrect country. Turn over.");
  await advanceTurn();
  return;
}

startHarvestSelection(region);

  }

});

async function advanceTurn() {

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();

  const oldPlayerId = gameData.turnOrder[gameData.currentTurnIndex];

  let nextTurn = gameData.currentTurnIndex + 1;
  let newRound = gameData.round || 1;

  if (nextTurn >= gameData.turnOrder.length) {
    nextTurn = 0;
    newRound += 1;
  }

  const nextPlayerId = gameData.turnOrder[nextTurn];

  // Reset old player movement state
  await gamesRef.child(currentGameCode)
    .child("players")
    .child(oldPlayerId)
    .update({
      movesRemaining: 0,
      rollValue: null
    });

  // Switch turn + phase + round
  await gamesRef.child(currentGameCode).update({
    currentTurnIndex: nextTurn,
    currentPhase: 0,
    round: newRound,
    lastActive: Date.now()
  });

  // Initialize next player movement state
  await gamesRef.child(currentGameCode)
    .child("players")
    .child(nextPlayerId)
    .update({
      movesRemaining: 0,
      rollValue: null
    });
}






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
    console.log("Clicked target:", target);
// === CHECK FOR BATTLE ===

const players = gameData.players || {};
let defendingPlayerId = null;

for (let id in players) {
  if (id !== currentPlayerId && players[id].shipPosition === target) {
    defendingPlayerId = id;
    break;
  }
}

if (defendingPlayerId) {

  const defender = players[defendingPlayerId];

  // Cannot attack in defender's home port
  if (target === defender.homePort) {
    alert("This player is in their home waters and cannot be attacked.");
    return;
  }

  const proceed = confirm(`Warning: this move will initiate a battle with ${defender.color} team. Proceed?`);

  if (!proceed) {
    return;
  }

  // Resolve battle
// Resolve battle but store in Firebase instead of alerting
const battleResult = resolveBattle(currentPlayerId, defendingPlayerId, gameData);

await gamesRef.child(currentGameCode).update({
  battle: {
    attackerId: currentPlayerId,
    defenderId: defendingPlayerId,
    attackerRoll: battleResult.attackerRoll,
    defenderRoll: battleResult.defenderRoll,
    winnerId: battleResult.winner,
    stage: "start"
  },
  lastActive: Date.now()
});

return;
}
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

const newMoves = player.movesRemaining - 1;

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

    // === CASH IN CHECK ===

const updatedSnap = await gamesRef.child(currentGameCode).once("value");
const updatedData = updatedSnap.val();
const updatedPlayer = updatedData.players[currentPlayerId];

if (
  updatedPlayer.shipPosition === updatedPlayer.homePort &&
  updatedPlayer.inventory &&
  Object.keys(updatedPlayer.inventory).length > 0
) {

  let totalValue = 0;

  for (let resource in updatedPlayer.inventory) {

    const quantity = updatedPlayer.inventory[resource];
    const baseValue = baseResourceValues[resource] || 0;
    const multiplier = updatedPlayer.multipliers?.[resource] || 1;

    totalValue += quantity * baseValue * multiplier;
  }

  await gamesRef.child(currentGameCode)
    .child("players")
    .child(currentPlayerId)
    .update({
      money: (updatedPlayer.money || 0) + totalValue,
      inventory: {},
    });

  await advanceTurn();
  return;
}


if (newMoves === 0) {
  await advanceTurn();
}


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
  function showUpgradeOptions() {

  const messageBox = document.getElementById("messageBox");

  messageBox.innerHTML = `
    <strong>Select Upgrade:</strong><br><br>
    <button id="upgradeTransport">Transport ($150)</button><br><br>
    <button id="upgradeNavigation">Navigation ($100)</button><br><br>
    <button id="upgradeWeapons">Weapons ($100)</button><br><br>
    <button id="upgradeSuez">Construct Suez ($150)</button><br><br>
    <button id="upgradeDictatorship">Fund Dictatorship ($200)</button><br><br>
  `;
}

async function startHarvestSelection(region) {

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();

  const player = gameData.players[currentPlayerId];

  const harvestCapacity = 1 + (player.upgrades?.transport || 0);

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
  // === BATTLE MODE OVERRIDE ===
  if (gameData.battle) {

    const battle = gameData.battle;
    const attacker = gameData.players[battle.attackerId];
    const defender = gameData.players[battle.defenderId];

    inventoryList.innerHTML = `
      <div style="text-align:center;">
        <h2>BATTLE</h2>
        <p><strong>${attacker.name}</strong> vs <strong>${defender.name}</strong></p>
        <div id="battleStage"></div>
      </div>
    `;

    runBattleAnimation(gameData);

    return;
  }
    const players = gameData.players || {};
    const turnOrder = gameData.turnOrder || [];
    const currentTurnIndex = gameData.currentTurnIndex || 0;
    const currentPhase = gameData.currentPhase || 0;
    const roundNumber = gameData.round || 1;


    const phaseNames = ["Give Phase", "Upgrade Phase", "Movement Phase"];
    phaseDisplay.textContent = `Round ${roundNumber} — ${phaseNames[currentPhase]}`;


    if (players[currentPlayerId]) {
      const me = players[currentPlayerId];
      playerHeader.textContent = `Player: ${me.name} (${me.country})`;
    }

    let html = "";

    turnOrder.forEach((playerId, index) => {

      const player = players[playerId];
      if (!player) return;

     const isCurrentTurn = index === currentTurnIndex;

if (
  isCurrentTurn &&
  playerId === currentPlayerId &&
  currentPhase === 1
) {
  html += `
    <br><strong>Would you like to make an upgrade?</strong><br>
    <button id="upgradeYesBtn">Yes</button>
    <button id="upgradeNoBtn">No</button>
  `;
}




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
${isCurrentTurn ? ' (Current Turn)' : ''}`;

html += `<br>
Money: $${player.money}
<br>
Transport: ${(player.upgrades && player.upgrades.transport) || 0}
<br>
Navigation: ${(player.upgrades && player.upgrades.navigation) || 0}
<br>
Weapons: ${(player.upgrades && player.upgrades.weapons) || 0}
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
/* =============================
   BATTLE ENGINE CORE
   ============================= */

function resolveBattle(attackerId, defenderId, gameData) {

  const attacker = gameData.players[attackerId];
  const defender = gameData.players[defenderId];

  const baseMax = 5;

  const attackerMax = baseMax + ((attacker.upgrades?.weapons || 0) * 3);
  const defenderMax = baseMax + ((defender.upgrades?.weapons || 0) * 3);

  const attackerRoll = Math.floor(Math.random() * attackerMax) + 1;
  const defenderRoll = Math.floor(Math.random() * defenderMax) + 1;

  console.log("BATTLE RESULT:");
  console.log("Attacker rolled:", attackerRoll, " / max:", attackerMax);
  console.log("Defender rolled:", defenderRoll, " / max:", defenderMax);

  if (attackerRoll > defenderRoll) {
    return {
      winner: attackerId,
      loser: defenderId,
      attackerRoll,
      defenderRoll
    };
  } else {
    // Defender wins ties
    return {
      winner: defenderId,
      loser: attackerId,
      attackerRoll,
      defenderRoll
    };
  }
}
});
