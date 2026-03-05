document.addEventListener("DOMContentLoaded", () => {

  const database = firebase.database();
  const gamesRef = database.ref("games");
// Cleanup inactive games (older than 15 minutes)
(async function cleanupOldGames() {

  const snapshot = await gamesRef.once("value");
  const games = snapshot.val();

  if (!games || typeof games !== "object") return;
gameLog: []
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
   FACTORY ZONES
   ============================= */

const factoryZones = {

  // TECHNOLOGY
  "P3": ["Technology", "Automobile", "Steel"],
  "Q3": ["Technology", "Automobile"],
  "R3": ["Technology", "Automobile"],
  "L4": ["Technology", "Clothes"],

  // AUTOMOBILES
  "O4": ["Automobile", "Steel"],

  // STEEL
  "K5": ["Steel"],
  "L5": ["Steel", "Clothes"],
  "P4": ["Steel"],

  // CLOTHES
  "M4": ["Clothes"],
  "M5": ["Clothes"],
  "N5": ["Clothes"],
  "K6": ["Clothes"]

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
  "Porcelain": 80,

  "Clothes": 250,
  "Steel": 150,
  "Technology": 200,
  "Automobiles": 1500
};
/* =============================
   MANUFACTURING RECIPES
   ============================= */

const manufacturingRecipes = {

  "Technology": {
    inputs: ["Copper", "Oil"]
  },

  "Automobile": {
    inputs: ["Steel", "Clothes", "Oil", "Copper"]
  },

  "Steel": {
    inputs: ["Iron", "Coal"]
  },

  "Clothes": {
    inputs: ["Cotton", "Silk"]
  }

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

  const name = playerNameInput.value.trim();
  const country = countrySelect.value;

  if (!name || !country) {
    joinStatus.textContent = "Enter your name and select a country first.";
    return;
  }

  const code = Math.random().toString(36).substring(2,7).toUpperCase();

  await gamesRef.child(code).set({
    players: {},
    turnOrder: [],
    currentTurnIndex: 0,
    currentPhase: 0,
    round: 1,
    gameState: "lobby",
    lastActive: Date.now()
  });

  currentGameCode = code;

  // Assign first available color
  const color = availableColors[0];
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
    rollValue: null,
    bounty: 0
  });

  currentPlayerId = newPlayerRef.key;

  await gamesRef.child(code).child("turnOrder").set([currentPlayerId]);

  localStorage.setItem("gameCode", currentGameCode);
  localStorage.setItem("playerId", currentPlayerId);

  hideSetupUI();
  listenToGameData();
});
console.log("Game created with gameLog initialized");
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
  bounty: 0, // ← ADD THIS LINE
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
  const setupSection = document.getElementById("setupSection");
  if (setupSection) {
    setupSection.style.display = "none";
  }
}

function listenToGameData() {

  gamesRef.child(currentGameCode).on("value", snapshot => {

    const gameData = snapshot.val();
    if (!gameData) return;

    latestGameData = gameData;

    if (gameData.gameState === "lobby") {
      renderLobby(gameData);
      return;
    }

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

  // Prevent clicks before game is fully loaded
  if (!currentGameCode) return;

  // === GIVE: NO ===
  if (event.target && event.target.id === "giveNoBtn") {

  await gamesRef.child(currentGameCode).update({
    currentPhase: 1, // move to Upgrade Phase
    lastActive: Date.now()
  });

  return;
}

// === GIVE: YES ===
if (event.target && event.target.id === "giveYesBtn") {

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();

  // Store temporary UI state
  await gamesRef.child(currentGameCode)
    .child("players")
    .child(currentPlayerId)
    .update({
      givingMode: true
    });

  return;
}
  // === GIVE: BACK ===
if (event.target && event.target.id === "giveBackBtn") {

  await gamesRef.child(currentGameCode)
    .child("players")
    .child(currentPlayerId)
    .update({
      givingMode: null
    });

  return;
}
  // === GIVE MONEY ===
if (event.target && event.target.id === "giveMoneyBtn") {

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();

  const player = gameData.players[currentPlayerId];

  const amountInput = prompt("Enter whole dollar amount to give:");
  if (!amountInput) return;

  const amount = parseInt(amountInput);

  if (isNaN(amount) || amount <= 0) {
    alert("Enter a valid whole number.");
    return;
  }

  if (amount > player.money) {
    alert("You cannot give more than you have.");
    return;
  }

  showGiveMoneyRecipients(gameData, amount);

  return;
}

  // === GIVE MONEY RECIPIENT SELECTED ===
if (event.target && event.target.classList.contains("giveMoneyRecipientBtn")) {

  const recipientId = event.target.dataset.id;
  const amount = parseInt(event.target.dataset.amount);

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();

  const sender = gameData.players[currentPlayerId];
  const recipient = gameData.players[recipientId];

  // Deduct from sender
  await gamesRef.child(currentGameCode)
    .child("players")
    .child(currentPlayerId)
    .update({
      money: sender.money - amount
    });

  // Add to recipient
  await gamesRef.child(currentGameCode)
    .child("players")
    .child(recipientId)
    .update({
      money: recipient.money + amount
    });

  await gamesRef.child(currentGameCode)
  .child("gameLog")
  .push({
    round: gameData.round,
    message: `${sender.name} gave $${amount} to ${recipient.name}.`
  });

  // Reset giving mode
  await gamesRef.child(currentGameCode)
    .child("players")
    .child(currentPlayerId)
    .update({
      givingMode: false
    });
  return;
}
  // === GIVE RESOURCES ===
if (event.target && event.target.id === "giveResourcesBtn") {

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();
  const sender = gameData.players[currentPlayerId];

  const inventory = sender.inventory || {};

  let html = `<strong>Select Resource to Give:</strong><br><br>`;

  const resourceKeys = Object.keys(inventory);

  if (resourceKeys.length === 0) {
    html += "You have no resources to give.<br><br>";
    html += `<button id="giveBackBtn">Back</button>`;
    inventoryList.innerHTML = html;
    return;
  }

  resourceKeys.forEach(resource => {
    html += `
      <button class="resourceSelectBtn" data-resource="${resource}">
        ${resource} (${inventory[resource]})
      </button><br><br>
    `;
  });

  html += `<button id="giveBackBtn">Back</button>`;

  inventoryList.innerHTML = html;
}

  // === RESOURCE SELECTED ===
if (event.target && event.target.classList.contains("resourceSelectBtn")) {

  const resource = event.target.dataset.resource;

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();
  const sender = gameData.players[currentPlayerId];

  const available = sender.inventory?.[resource] || 0;

  const amountStr = prompt(`How many ${resource} would you like to give? (Max: ${available})`);
  if (!amountStr) return;

  const amount = parseInt(amountStr);

  if (isNaN(amount) || amount <= 0 || amount > available) {
    alert("Invalid amount.");
    return;
  }

  // Store temporary selection in Firebase
  await gamesRef.child(currentGameCode).update({
    pendingResourceTransfer: {
      resource,
      amount,
      senderId: currentPlayerId
    }
  });

  showResourceRecipientOptions(gameData, resource, amount);

  return;
}
// === GIVE RESOURCE RECIPIENT SELECTED ===
if (event.target.classList.contains("giveResourceRecipientBtn")) {

  const recipientId = event.target.dataset.id;
  const resource = event.target.dataset.resource;
  const amount = parseInt(event.target.dataset.amount);

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();

  const sender = gameData.players[currentPlayerId];
  const recipient = gameData.players[recipientId];

  const senderInventory = sender.inventory || {};
  const recipientInventory = recipient.inventory || {};

  if (!senderInventory[resource] || senderInventory[resource] < amount) {
    alert("Not enough resources.");
    return;
  }

  // Subtract from sender
  senderInventory[resource] -= amount;
  if (senderInventory[resource] <= 0) {
    delete senderInventory[resource];
  }

// === CHECK IF RECIPIENT IS AT HOME ===
if (recipient.shipPosition === recipient.homePort) {

  const baseValue = baseResourceValues[resource] || 0;
  const multiplier = recipient.multipliers?.[resource] || 1;

  const totalValue = amount * baseValue * multiplier;

  await gamesRef.child(currentGameCode)
    .child("players")
    .child(recipientId)
    .update({
      money: (recipient.money || 0) + totalValue
    });

  alert(`${sender.name} gave ${amount} ${resource} to ${recipient.name}. It was immediately cashed in for $${totalValue}.`);

} else {

  // Add to recipient inventory normally
  recipientInventory[resource] =
    (recipientInventory[resource] || 0) + amount;

  await gamesRef.child(currentGameCode)
    .child("players")
    .child(recipientId)
    .update({ inventory: recipientInventory });

  alert(`${sender.name} gave ${amount} ${resource} to ${recipient.name}.`);

}

// Update sender inventory after transfer
await gamesRef.child(currentGameCode)
  .child("players")
  .child(currentPlayerId)
  .update({ inventory: senderInventory });

  // Return to Give Phase start
  document.getElementById("messageBox").innerHTML = "";

  return;
}
  // === GIVE SUEZ ===
if (event.target && event.target.id === "giveSuezBtn") {

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();
  const players = gameData.players || {};

  let html = `<strong>Transfer Suez Canal to:</strong><br><br>`;

  Object.keys(players).forEach(id => {
    if (id !== currentPlayerId) {
      html += `
        <button class="giveSuezRecipientBtn" data-id="${id}">
          ${players[id].name}
        </button><br><br>
      `;
    }
  });

  html += `<button id="giveBackBtn">Back</button>`;

  inventoryList.innerHTML = html;

  return;
}
  // === SUEZ RECIPIENT SELECTED ===
if (event.target && event.target.classList.contains("giveSuezRecipientBtn")) {

  const recipientId = event.target.dataset.id;

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();

  const sender = gameData.players[currentPlayerId];
  const recipient = gameData.players[recipientId];

  await gamesRef.child(currentGameCode).update({
    suezOwner: recipientId
  });

  alert(`${sender.name} transferred control of the Suez Canal to ${recipient.name}.`);

  return;
}
  // === MANUFACTURE BUTTON CLICKED ===
if (event.target && event.target.id === "manufactureBtn") {

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();
  const player = gameData.players[currentPlayerId];

  const goods = factoryZones[player.shipPosition];
  if (!goods) return;

  let html = `<strong>Select Production:</strong><br><br>`;

  goods.forEach(good => {

    const recipe = manufacturingRecipes[good];
    const ingredients = recipe.inputs.join(" + ");

    html += `
      <button class="manufactureSelectBtn" data-good="${good}">
        ${good} = ${ingredients}
      </button><br><br>
    `;
  });

  html += `<button id="manufactureBackBtn">Back</button>`;

  inventoryList.innerHTML = html;
  return;
}
  // === MANUFACTURE BACK ===
if (event.target && event.target.id === "manufactureBackBtn") {

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();

  renderLedger(gameData); // Re-render the movement phase UI
  return;
}
  // === MANUFACTURE SELECTION ===
if (event.target && event.target.classList.contains("manufactureSelectBtn")) {

  const good = event.target.dataset.good;

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();
  const player = gameData.players[currentPlayerId];

  const recipe = manufacturingRecipes[good];
  if (!recipe) return;

  const inventory = player.inventory || {};

  // Check resources
  for (let resource of recipe.inputs) {
    if (!inventory[resource] || inventory[resource] < 1) {
      alert("Insufficient resources.");
      return;
    }
  }

  // Remove inputs
  recipe.inputs.forEach(resource => {
    inventory[resource] -= 1;
    if (inventory[resource] <= 0) {
      delete inventory[resource];
    }
  });

  // Add manufactured good
  inventory[good] = (inventory[good] || 0) + 1;

  await gamesRef.child(currentGameCode)
    .child("players")
    .child(currentPlayerId)
    .update({
      inventory: inventory,
      movesRemaining: 0
    });

  alert(`${good} manufactured successfully!`);

  await advanceTurn();
  return;
}
  // === START GAME ===
if (event.target && event.target.id === "startGameBtn") {

  await gamesRef.child(currentGameCode).update({
    gameState: "active",
    currentPhase: 0,
    round: 1
  });

  return;
}
  // === ROLL ATTACK ===
if (event.target && event.target.id === "rollAttackBtn") {

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();
  const battle = gameData.battle;
  const attacker = gameData.players[battle.attackerId];

  const baseMax = 5;
  const maxRoll = baseMax + ((attacker.upgrades?.weapons || 0) * 3);

  let roll = 0;
  const interval = setInterval(() => {
    roll = Math.floor(Math.random() * maxRoll) + 1;
    document.getElementById("battleOverlay").innerHTML = `
      <h1>Rolling...</h1>
      <h2>${roll}</h2>
    `;
  }, 100);

  setTimeout(async () => {
    clearInterval(interval);

    await gamesRef.child(currentGameCode).child("battle").update({
      attackerRoll: roll,
      stage: "awaitingDefenderRoll"
    });

  }, 2000);
}

// === ROLL DEFENSE ===
if (event.target && event.target.id === "rollDefenseBtn") {

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();
  const battle = gameData.battle;
  const defender = gameData.players[battle.defenderId];

  const baseMax = 5;
  const maxRoll = baseMax + ((defender.upgrades?.weapons || 0) * 3);

  let roll = 0;
  const interval = setInterval(() => {
    roll = Math.floor(Math.random() * maxRoll) + 1;
    document.getElementById("battleOverlay").innerHTML = `
      <h1>Rolling...</h1>
      <h2>${roll}</h2>
    `;
  }, 100);

  setTimeout(async () => {
    clearInterval(interval);

    const attackerRoll = battle.attackerRoll;

    let winnerId;
    if (roll > attackerRoll) {
      winnerId = battle.defenderId;
    } else if (roll < attackerRoll) {
      winnerId = battle.attackerId;
    } else {
      winnerId = battle.defenderId; // defender wins ties
    }

    await gamesRef.child(currentGameCode).child("battle").update({
      defenderRoll: roll,
      winnerId: winnerId,
      stage: "result"
    });

  }, 2000);
}
// === DESTROY SHIP ===
if (event.target && event.target.id === "battleDestroy") {

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();
  const battle = gameData.battle;

  const winnerId = battle.winnerId;
  const loserId = winnerId === battle.attackerId
    ? battle.defenderId
    : battle.attackerId;

  const winner = gameData.players[winnerId];
  const loser = gameData.players[loserId];

  let winnerBountyHistory = winner.bountyCollectedFrom || {};
  let bountyAward = 0;

  // === BOUNTY COLLECTION CHECK ===
  if (loser.bounty && loser.bounty > 0) {

    if (!winnerBountyHistory[loserId]) {

      bountyAward = loser.bounty;

      winnerBountyHistory[loserId] = true;

      await gamesRef.child(currentGameCode)
        .child("players")
        .child(winnerId)
        .update({
          money: (winner.money || 0) + bountyAward,
          bountyCollectedFrom: winnerBountyHistory
        });

      await gamesRef.child(currentGameCode)
        .child("players")
        .child(loserId)
        .update({
          bounty: 0
        });

      alert(`Bounty Collected: $${bountyAward}`);
    }
  }

  // Reset loser ship
  await gamesRef.child(currentGameCode)
    .child("players")
    .child(loserId)
    .update({
      shipPosition: loser.homePort,
      inventory: {},
      movesRemaining: 0
    });

  await gamesRef.child(currentGameCode).update({
    battle: null
  });

await advanceTurn();

await gamesRef.child(currentGameCode)
  .child("gameLog")
  .push({
    round: gameData.round,
    message: `${winner.name} destroyed ${loser.name} and collected $${bountyAward} bounty.`
  });

return;
}
// === PLUNDER ===
if (event.target && event.target.id === "battlePlunder") {

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();
  const battle = gameData.battle;

  const winnerId = battle.winnerId;
  const loserId = winnerId === battle.attackerId
    ? battle.defenderId
    : battle.attackerId;

  const winner = gameData.players[winnerId];
  const loser = gameData.players[loserId];

  const winnerInventory = winner.inventory || {};
  const loserInventory = loser.inventory || {};

  for (let resource in loserInventory) {
    winnerInventory[resource] =
      (winnerInventory[resource] || 0) + loserInventory[resource];
  }

  await gamesRef.child(currentGameCode)
    .child("players")
    .child(winnerId)
    .update({ inventory: winnerInventory });

  await gamesRef.child(currentGameCode)
    .child("players")
    .child(loserId)
    .update({ inventory: {} });

  await gamesRef.child(currentGameCode).update({
    battle: {
      ...battle,
      stage: "displacement",
      displacedPlayerId: loserId,
      originSquare: winner.shipPosition
    }
  });
  // Increase bounty for attacker
await gamesRef.child(currentGameCode)
  .child("players")
  .child(currentPlayerId)
  .update({
    bounty: (gameData.players[currentPlayerId].bounty || 0) + 200
  });
}

// === MOVE ON ===
if (event.target && event.target.id === "battleMoveOn") {

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();
  const battle = gameData.battle;

  const winnerId = battle.winnerId;
  const loserId = winnerId === battle.attackerId
    ? battle.defenderId
    : battle.attackerId;

  await gamesRef.child(currentGameCode).update({
    battle: {
      ...battle,
      stage: "displacement",
      displacedPlayerId: loserId,
      originSquare: gameData.players[winnerId].shipPosition
    }
  });
}
  // === CONTINUE AFTER RESULT ===
if (event.target && event.target.id === "battleContinueBtn") {

  console.log("Continue clicked");
  
  document.getElementById("battleOverlay").style.display = "none";

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();

  await gamesRef.child(currentGameCode).child("battle").update({
    stage: "decision"
  });
}
/* ===== UPGRADE PHASE PROMPT ===== */

// === UPGRADE: NO ===
if (event.target && event.target.id === "upgradeNoBtn") {

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();

  if (!gameData) return;

  await gamesRef.child(currentGameCode).update({
    currentPhase: 2,
    lastActive: Date.now()
  });

  return;
}


// === UPGRADE: YES ===
if (event.target && event.target.id === "upgradeYesBtn") {

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();

  if (!gameData) return;

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

  const level = player.upgrades?.transport || 0;
  const cost = 150 * (level + 1);

  if (player.money < cost) {
    alert(`Not enough money. Cost is $${cost}.`);
    return;
  }

  // Deduct money
  await gamesRef.child(currentGameCode)
    .child("players")
    .child(currentPlayerId)
    .update({
      money: player.money - cost
    });

  const success = Math.random() < 0.75;

  if (success) {
    await gamesRef.child(currentGameCode)
      .child("players")
      .child(currentPlayerId)
      .update({
        "upgrades/transport": level + 1
      });

    alert("Transport upgrade successful!");
  } else {
    alert("Transport upgrade failed. Investment lost.");
  }

  await gamesRef.child(currentGameCode).update({
  lastActive: Date.now()
});

// Hide upgrade menu after purchase
document.getElementById("messageBox").innerHTML = "";

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

  const level = player.upgrades?.navigation || 0;

  if (level >= 3) {
    alert("Navigation is already at maximum level (3).");
    return;
  }

  const cost = 100 * (level + 1);

  if (player.money < cost) {
    alert(`Not enough money. Cost is $${cost}.`);
    return;
  }

  // Deduct money
  await gamesRef.child(currentGameCode)
    .child("players")
    .child(currentPlayerId)
    .update({
      money: player.money - cost
    });

  const success = Math.random() < 0.75;

  if (success) {
    await gamesRef.child(currentGameCode)
      .child("players")
      .child(currentPlayerId)
      .update({
        "upgrades/navigation": level + 1
      });

    alert("Navigation upgrade successful!");
  } else {
    alert("Navigation upgrade failed. Investment lost.");
  }

await gamesRef.child(currentGameCode).update({
  lastActive: Date.now()
});

// Hide upgrade menu after purchase
document.getElementById("messageBox").innerHTML = "";

return;
}
  /* ===== WEAPONS UPGRADE ===== */

if (event.target && event.target.id === "upgradeWeapons") {

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();

  if (!gameData || gameData.currentPhase !== 1) return;

  const turnOrder = gameData.turnOrder;
  const currentTurnIndex = gameData.currentTurnIndex;

  if (turnOrder[currentTurnIndex] !== currentPlayerId) return;

  const player = gameData.players[currentPlayerId];

  const level = player.upgrades?.weapons || 0;
  const cost = 100 * (level + 1);

  if (player.money < cost) {
    alert(`Not enough money. Cost is $${cost}.`);
    return;
  }

  // Deduct money
  await gamesRef.child(currentGameCode)
    .child("players")
    .child(currentPlayerId)
    .update({
      money: player.money - cost
    });

  const success = Math.random() < 0.75;

  if (success) {
    await gamesRef.child(currentGameCode)
      .child("players")
      .child(currentPlayerId)
      .update({
        "upgrades/weapons": level + 1
      });

    alert("Weapons upgrade successful!");
  } else {
    alert("Weapons upgrade failed. Investment lost.");
  }

await gamesRef.child(currentGameCode).update({
  lastActive: Date.now()
});

// Hide upgrade menu after purchase
document.getElementById("messageBox").innerHTML = "";

return;
}
  // === SUEZ CONSTRUCTION ===
if (event.target && event.target.id === "upgradeSuez") {

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();

  const player = gameData.players[currentPlayerId];

  if (gameData.suezOwner) {
    alert("The Suez Canal has already been constructed.");
    return;
  }

  if (player.money < 150) {
    alert("Not enough money. Cost is $150.");
    return;
  }

  await gamesRef.child(currentGameCode)
    .child("players")
    .child(currentPlayerId)
    .update({
      money: player.money - 150
    });

  await gamesRef.child(currentGameCode).update({
    suezOwner: currentPlayerId
  });

  alert("The Suez Canal has been constructed and is now under your control.");
}

// === DICTATORSHIP ===
if (event.target && event.target.id === "upgradeDictatorship") {

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();

  const player = gameData.players[currentPlayerId];

  const ownedDictatorships = Object.values(gameData.dictatorships || {})
    .filter(ownerId => ownerId === currentPlayerId).length;

  const cost = 300 * (ownedDictatorships + 1);

  if (player.money < cost) {
    alert(`Not enough money. Cost is $${cost}.`);
    return;
  }

  const square = prompt("Enter the square (e.g., E10) to place dictatorship:");
  if (!square) return;

  const target = square.toUpperCase();

  if (!waterSquares.has(target) && !harvestZones[target]) {
    alert("Dictatorships may only be placed on water tiles or harvest zones.");
    return;
  }

  if (player.homePort === target) {
    alert("You cannot place a dictatorship on your home port.");
    return;
  }

  await gamesRef.child(currentGameCode)
    .child("players")
    .child(currentPlayerId)
    .update({
      money: player.money - cost
    });

  const success = Math.random() < 0.6;

  if (!success) {
    alert("Dictatorship attempt failed. Funds lost.");
    return;
  }

  const dictatorships = gameData.dictatorships || {};
dictatorships[target] = currentPlayerId;

// Check if another player is on that square
let displacedPlayerId = null;

for (let id in gameData.players) {
  if (
    id !== currentPlayerId &&
    gameData.players[id].shipPosition === target
  ) {
    displacedPlayerId = id;
    break;
  }
}

if (displacedPlayerId) {

  await gamesRef.child(currentGameCode).update({
    dictatorships: dictatorships,
    battle: {
      stage: "displacement",
      winnerId: currentPlayerId,
      displacedPlayerId: displacedPlayerId,
      originSquare: target
    }
  });

} else {

  await gamesRef.child(currentGameCode).update({
    dictatorships: dictatorships
  });

}

alert(`Dictatorship successfully established on ${target}.`);

} // closes upgradeDictatorsship

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

// === CASH IN CONTINUE ===
if (event.target && event.target.id === "cashInContinueBtn") {

  const messageBox = document.getElementById("messageBox");
  messageBox.innerHTML = "";

  await advanceTurn();
}

// === GRANT ACCESS ===
if (event.target && event.target.id === "grantAccessBtn") {

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();
  const request = gameData.permissionRequest;

  if (!request) return;

  // Move requester
const requester = gameData.players[request.requesterId];

await gamesRef.child(currentGameCode)
  .child("players")
  .child(request.requesterId)
  .update({
    shipPosition: request.square,
    movesRemaining: requester.movesRemaining - 1
  });

  // Send approval message
  await gamesRef.child(currentGameCode).update({
    permissionResult: {
      requesterId: request.requesterId,
      message: "Access Approved!"
    },
    permissionRequest: null
  });
}

// === DENY ACCESS ===
if (event.target && event.target.id === "denyAccessBtn") {

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();
  const request = gameData.permissionRequest;

  if (!request) return;

  await gamesRef.child(currentGameCode).update({
    permissionResult: {
      requesterId: request.requesterId,
      message: "Access Denied."
    },
    permissionRequest: null
  });
}
if (event.target && event.target.id === "permissionAcknowledgeBtn") {
  await gamesRef.child(currentGameCode).update({
    permissionResult: null
  });
}

}); // closes document.addEventListener("click", ...)

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
    
const turnOrder = gameData.turnOrder;
const currentTurnIndex = gameData.currentTurnIndex;

// Allow displacement even if not technically current turn
if (
  !gameData.battle ||
  gameData.battle.stage !== "displacement"
) {
  if (!turnOrder || turnOrder[currentTurnIndex] !== currentPlayerId) {
    return;
  }
}
    const player = gameData.players[currentPlayerId];

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
const currentPos = player.shipPosition;

const colDiff = target.charCodeAt(0) - currentPos.charCodeAt(0);
const rowDiff = parseInt(target.slice(1)) - parseInt(currentPos.slice(1));

const isAdjacent =
  (Math.abs(colDiff) === 1 && rowDiff === 0) ||
  (Math.abs(rowDiff) === 1 && colDiff === 0);
  // === DISPLACEMENT MODE ===
  if (gameData.battle && gameData.battle.stage === "displacement") {

    const battle = gameData.battle;

    if (battle.winnerId !== currentPlayerId) return;

    const origin = battle.originSquare;

    const colDiff = target.charCodeAt(0) - origin.charCodeAt(0);
    const rowDiff = parseInt(target.slice(1)) - parseInt(origin.slice(1));

    const isAdjacent =
      (Math.abs(colDiff) === 1 && rowDiff === 0) ||
      (Math.abs(rowDiff) === 1 && colDiff === 0);

// === SUEZ RESTRICTION (DISPLACEMENT) ===
if (
  (origin === "G3" && target === "G4") ||
  (origin === "G4" && target === "G3")
) {
  if (!gameData.suezOwner) {
    alert("The Suez Canal has not been constructed.");
    return;
  }
}

    if (!isAdjacent) return;
    if (!waterSquares.has(target)) return;

    await gamesRef.child(currentGameCode)
      .child("players")
      .child(battle.displacedPlayerId)
      .update({ shipPosition: target });

    await gamesRef.child(currentGameCode).update({
      battle: null
    });

    await advanceTurn();
    return;
  }

  // --- NORMAL MOVEMENT CONTINUES BELOW ---
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

  const currentPos = player.shipPosition;

  const colDiff = target.charCodeAt(0) - currentPos.charCodeAt(0);
  const rowDiff = parseInt(target.slice(1)) - parseInt(currentPos.slice(1));

  const isAdjacent =
    (Math.abs(colDiff) === 1 && rowDiff === 0) ||
    (Math.abs(rowDiff) === 1 && colDiff === 0);

  if (!isAdjacent) {
    alert("You must move adjacent to initiate battle.");
    return;
  }
}
if (defendingPlayerId) {

  const defender = players[defendingPlayerId];

  if (target === defender.homePort) {
    alert("This player is in their home waters and cannot be attacked.");
    return;
  }

  const proceed = confirm(`Warning: this move will initiate a battle with ${defender.color} team. Proceed?`);

  if (!proceed) {
    return;
  }

  // 🔥 Move attacker into defender's square FIRST
  await gamesRef.child(currentGameCode)
    .child("players")
    .child(currentPlayerId)
    .update({
      shipPosition: target
    });

  // THEN start battle
  await gamesRef.child(currentGameCode).update({
    battle: {
      attackerId: currentPlayerId,
      defenderId: defendingPlayerId,
      attackerRoll: null,
      defenderRoll: null,
      winnerId: null,
      stage: "awaitingAttackerRoll"
    },
    lastActive: Date.now()
  });

  return;
}

// Must be water
if (!waterSquares.has(target)) return;

// === SUEZ RESTRICTION ===
if (
  (currentPos === "G3" && target === "G4") ||
  (currentPos === "G4" && target === "G3")
) {

  if (!gameData.suezOwner) {
    alert("The Suez Canal has not been constructed.");
    return;
  }

  // If mover is not the owner, create permission request
  if (gameData.suezOwner !== currentPlayerId) {

// Prevent duplicate request this turn
if (
  gameData.lastSuezRequest &&
  gameData.lastSuezRequest.requesterId === currentPlayerId &&
  gameData.lastSuezRequest.round === gameData.round
) {
  alert("Access already denied this turn.");
  return;
}

await gamesRef.child(currentGameCode).update({
  permissionRequest: {
    type: "suez",
    requesterId: currentPlayerId,
    ownerId: gameData.suezOwner,
    square: target,
    round: gameData.round
  },
  lastSuezRequest: {
    requesterId: currentPlayerId,
    round: gameData.round
  }
});

    alert("Waiting for Suez owner to respond.");
    return;
  }
}

// === DICTATORSHIP ENTRY CHECK ===
if (gameData.dictatorships && gameData.dictatorships[target]) {

  const ownerId = gameData.dictatorships[target];

  if (ownerId !== currentPlayerId) {

    await gamesRef.child(currentGameCode).update({
      permissionRequest: {
        type: "dictatorship",
        requesterId: currentPlayerId,
        ownerId: ownerId,
        square: target,
        round: gameData.round
      }
    });

    alert("Waiting for territory owner to respond.");
    return;
  }
}

// Adjacency check
const colDiff = target.charCodeAt(0) - currentPos.charCodeAt(0);
const rowDiff = parseInt(target.slice(1)) - parseInt(currentPos.slice(1));

const isAdjacent =
  (Math.abs(colDiff) === 1 && rowDiff === 0) ||
  (Math.abs(rowDiff) === 1 && colDiff === 0);

if (!isAdjacent) return;

// Malacca restriction
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
let breakdownHtml = "<h3>Cash In Summary</h3>";

for (let resource in updatedPlayer.inventory) {

  const quantity = updatedPlayer.inventory[resource];
  const baseValue = baseResourceValues[resource] || 0;
  const multiplier = updatedPlayer.multipliers?.[resource] || 1;

  const resourceTotal = quantity * baseValue * multiplier;
  totalValue += resourceTotal;

  if (multiplier !== 1) {
    breakdownHtml += `
      <p>${quantity} ${resource} $${baseValue} × ${multiplier} multiplier = $${resourceTotal}</p>
    `;
  } else {
    breakdownHtml += `
      <p>${quantity} ${resource} $${baseValue} = $${resourceTotal}</p>
    `;
  }
}

breakdownHtml += `<hr><strong>Total = $${totalValue}</strong><br><br>
<button id="cashInContinueBtn">Continue to next player's turn</button>`;

// Add money + clear inventory
await gamesRef.child(currentGameCode)
  .child("players")
  .child(currentPlayerId)
  .update({
    money: (updatedPlayer.money || 0) + totalValue,
    inventory: {},
  });

// Display breakdown in messageBox
const messageBox = document.getElementById("messageBox");
messageBox.innerHTML = breakdownHtml;

// Stop automatic turn advancement
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
const dictatorships = gameData.dictatorships || {};
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
// Remove old dictatorship overlays
document.querySelectorAll(".dictatorship-overlay")
  .forEach(el => el.remove());
    
    // === DICTATORSHIP VISUAL OVERLAYS ===
Object.keys(dictatorships).forEach(square => {

  const ownerId = dictatorships[square];
  const owner = players[ownerId];
  if (!owner) return;

  const pos = getScaledPosition(square);

 const overlay = document.createElement("div");
overlay.className = "dictatorship-overlay";
  overlay.style.position = "absolute";
  overlay.style.left = pos.x + "px";
  overlay.style.top = pos.y + "px";
  overlay.style.width = "30px";
  overlay.style.height = "30px";
  overlay.style.backgroundColor = owner.color;
  overlay.style.opacity = "0.3";
  overlay.style.transform = "translate(-50%, -50%)";
  overlay.style.pointerEvents = "none";

  mapContainer.appendChild(overlay);
});
    
// Remove old Suez line
document.querySelectorAll(".suez-line").forEach(line => line.remove());

if (gameData.suezOwner) {

  const owner = players[gameData.suezOwner];
  if (!owner) return;

  const g3 = getScaledPosition("G3");
  const g4 = getScaledPosition("G4");

  const suezLine = document.createElement("div");
  suezLine.className = "suez-line";

  suezLine.style.position = "absolute";
  suezLine.style.left = g3.x + "px";
  suezLine.style.top = g3.y + "px";
  suezLine.style.width = "4px";
  suezLine.style.height = Math.abs(g4.y - g3.y) + "px";
  suezLine.style.backgroundColor = owner.color;
  suezLine.style.transform = "translate(-50%, 0)";
  suezLine.style.pointerEvents = "none";

  mapContainer.appendChild(suezLine);
}

}
function showUpgradeOptions() {

  const messageBox = document.getElementById("messageBox");

  const gameData = latestGameData;
  const player = gameData.players[currentPlayerId];

  const transportLevel = player.upgrades?.transport || 0;
  const navigationLevel = player.upgrades?.navigation || 0;
  const weaponsLevel = player.upgrades?.weapons || 0;

  const transportCost = 150 * (transportLevel + 1);
  const navigationCost = 100 * (navigationLevel + 1);
  const weaponsCost = 100 * (weaponsLevel + 1);

  messageBox.innerHTML = `
    <strong>Select Upgrade:</strong><br><br>

    <button id="upgradeTransport">
      Transport (Level ${transportLevel} → ${transportLevel + 1})<br>
      Cost: $${transportCost} | Success: 75%
    </button>
    <br><br>

    <button id="upgradeNavigation" ${navigationLevel >= 3 ? "disabled" : ""}>
      Navigation (Level ${navigationLevel}${navigationLevel < 3 ? ` → ${navigationLevel + 1}` : ""})<br>
      Cost: $${navigationCost} | Success: 75% | Max Level: 3
    </button>
    <br><br>

    <button id="upgradeWeapons">
      Weapons (Level ${weaponsLevel} → ${weaponsLevel + 1})<br>
      Cost: $${weaponsCost} | Success: 75%
    </button>
    <br><br>

    <button id="upgradeSuez">
      Construct Suez Canal ($150)
    </button>
    <br><br>

    <button id="upgradeDictatorship">
      Fund Dictatorship (60% success, $300 × level)
    </button>
  `;
}
  function showGiveOptions(gameData) {

  const players = gameData.players || {};
  const turnOrder = gameData.turnOrder || [];

  let html = `
    <h2>Give Phase</h2>
    <strong>Select what to give:</strong><br><br>
    <button id="giveMoneyBtn">Give Money</button><br><br>
    <button id="giveResourcesBtn">Give Resources</button><br><br>
  `;

  // Only show Suez transfer if player owns it
  if (gameData.suezOwner === currentPlayerId) {
    html += `<button id="giveSuezBtn">Transfer Suez Canal</button><br><br>`;
  }

  // Only show dictatorship transfer if player owns any
  const ownedDictatorships = Object.entries(gameData.dictatorships || {})
    .filter(([square, ownerId]) => ownerId === currentPlayerId);

  if (ownedDictatorships.length > 0) {
    html += `<button id="giveDictatorshipBtn">Transfer Dictatorship</button><br><br>`;
  }

  html += `<button id="giveBackBtn">Back</button>`;

  inventoryList.innerHTML = html;
}
  function renderLobby(gameData) {

  const players = gameData.players || {};

  let html = `
    <h2>Game Lobby</h2>
    <p><strong>Join Code:</strong> ${currentGameCode}</p>
    <hr>
    <strong>Players:</strong><br><br>
  `;

  Object.keys(players).forEach(id => {
    html += `${players[id].name} (${players[id].country})<br>`;
  });

  html += `<br><hr>`;

  html += `
    <strong>Victory Condition:</strong><br>
    <button id="victoryMoneyBtn">Money ($2000)</button><br><br>
  `;

  html += `<br><button id="startGameBtn">Start Game</button>`;

  inventoryList.innerHTML = html;
}
  function showGiveMoneyRecipients(gameData, amount) {

  const players = gameData.players || {};

  let html = `<strong>Select recipient:</strong><br><br>`;

  Object.keys(players).forEach(id => {

    if (id !== currentPlayerId) {
      html += `
        <button class="giveMoneyRecipientBtn" 
                data-id="${id}" 
                data-amount="${amount}">
          ${players[id].name}
        </button><br><br>
      `;
    }

  });

  html += `<button id="giveBackBtn">Back</button>`;

  inventoryList.innerHTML = html;
}
function showResourceRecipientOptions(gameData, resource, amount) {

  const players = gameData.players || {};
  let html = `<strong>Give ${amount} ${resource} to:</strong><br><br>`;

  Object.keys(players).forEach(id => {
    if (id !== currentPlayerId) {
      html += `
        <button class="giveResourceRecipientBtn"
                data-id="${id}"
                data-resource="${resource}"
                data-amount="${amount}">
          ${players[id].name}
        </button><br><br>
      `;
    }
  });

  html += `<button id="giveBackBtn">Back</button>`;

  inventoryList.innerHTML = html;
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
// === PERMISSION REQUEST HANDLER ===
if (
  gameData.permissionRequest &&
  gameData.permissionRequest.ownerId === currentPlayerId
) {
  const request = gameData.permissionRequest;

  inventoryList.innerHTML = `
    <h2>Access Request</h2>
    <p>${gameData.players[request.requesterId].name} wants access to ${request.square}</p>
    <button id="grantAccessBtn">Grant</button>
    <button id="denyAccessBtn">Deny</button>
  `;

  return;
}
  // === PERMISSION RESULT HANDLER ===
if (
  gameData.permissionResult &&
  gameData.permissionResult.requesterId === currentPlayerId
) {

  inventoryList.innerHTML = `
    <h2>${gameData.permissionResult.message}</h2>
    <button id="permissionAcknowledgeBtn">OK</button>
  `;

  return;
}
  // === BATTLE MODE OVERRIDE ===
const overlay = document.getElementById("battleOverlay");
if (!gameData.battle && overlay) {
  overlay.style.display = "none";
}
if (gameData.battle) {

  if (gameData.battle.stage === "decision") {

    const battle = gameData.battle;

    if (battle.winnerId === currentPlayerId) {

      inventoryList.innerHTML = `
        <h2>Battle Victory</h2>
        <button id="battleDestroy">Destroy Ship</button><br><br>
        <button id="battlePlunder">Plunder Cargo</button><br><br>
        <button id="battleMoveOn">Move On</button>
      `;

      return;
    }

    // Non-winners see nothing during decision
    inventoryList.innerHTML = `<h2>Battle Resolved</h2>`;
    return;
  }
if (gameData.battle.stage === "displacement") {

  const battle = gameData.battle;

  inventoryList.innerHTML = `
    <h2>Displacement</h2>
    <p>Select adjacent water square for defeated ship.</p>
  `;

  return;
}
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

  // === PLAYER HEADER RESTORE ===
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

    html += `<div style="border:1px solid #333; padding:8px; margin-bottom:10px;
    ${isCurrentTurn ? 'background-color:#d4edda;' : ''}">`;

    html += `<strong>${player.name} (${player.country})</strong>`;
    if (isCurrentTurn) html += ` (Current Turn)`;
// === GIVE MODE UI ===
if (
  currentPhase === 0 &&
  playerId === currentPlayerId &&
  player.givingMode
) {
  html += `
    <br><strong>Select What to Give:</strong><br>
    <button id="giveMoneyBtn">Give Money</button><br>
    <button id="giveResourcesBtn">Give Resources</button><br>
    ${gameData.suezOwner === currentPlayerId ? '<button id="giveSuezBtn">Transfer Suez</button><br>' : ''}
    ${Object.entries(gameData.dictatorships || {}).some(([sq, owner]) => owner === currentPlayerId)
      ? '<button id="giveDictatorshipBtn">Transfer Dictatorship</button><br>'
      : ''}
    <button id="giveBackBtn">Back</button>
  `;
}
// === SUEZ OWNERSHIP INDICATOR ===
if (gameData.suezOwner === playerId) {
html += `<br>🏗️ <strong>Suez Owner</strong>`;
}
    
    html += `<br>Money: $${player.money}`;
    html += `<br>Transport: ${(player.upgrades?.transport) || 0}`;
    html += `<br>Navigation: ${(player.upgrades?.navigation) || 0}`;
    html += `<br>Weapons: ${(player.upgrades?.weapons) || 0}`;
// === BOUNTY DISPLAY ===
if (player.bounty && player.bounty > 0) {
  html += `<br>⚠️ Bounty: $${player.bounty}`;
}
    html += `<br>Inventory:<br>`;

    if (!player.inventory || Object.keys(player.inventory).length === 0) {
      html += `None`;
    } else {
      for (let resource in player.inventory) {
        html += `${resource}: ${player.inventory[resource]}<br>`;
      }
    }
// === GIVE PHASE PROMPT (inside green box) ===
if (
  isCurrentTurn &&
  playerId === currentPlayerId &&
  currentPhase === 0 &&
  !player.givingMode
) {
  html += `
    <br><strong>Would you like to give anything?</strong><br>
    <button id="giveYesBtn">Yes</button>
    <button id="giveNoBtn">No</button>
  `;
}
    // === UPGRADE PHASE PROMPT RESTORED ===
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

    // === ROLL DICE BUTTON ===
    if (
      isCurrentTurn &&
      playerId === currentPlayerId &&
      currentPhase === 2 &&
      !player.rollValue
    ) {
      html += `<br><button id="rollDiceBtn">Roll Dice</button>`;
    }

    // === HARVEST BUTTON ===
if (
  isCurrentTurn &&
  playerId === currentPlayerId &&
  currentPhase === 2 &&
  onHarvestSquare &&
  player.rollValue &&
  player.movesRemaining > 0
) {
  html += `<br><button id="harvestBtn">Harvest</button>`;
}

// === MANUFACTURE BUTTON ===
if (
  isCurrentTurn &&
  playerId === currentPlayerId &&
  currentPhase === 2 &&
  factoryZones[player.shipPosition] &&
  player.movesRemaining > 0 &&
  player.shipPosition !== player.homePort
) {
  html += `<br><button id="manufactureBtn">Manufacture</button>`;
}

    if (player.movesRemaining > 0) {
      html += `<br>Moves Remaining: ${player.movesRemaining}`;
    }

    html += `</div>`;
  });
inventoryList.innerHTML = html;
}
/* =============================
   BATTLE ANIMATION ENGINE
   ============================= */

async function runBattleAnimation(gameData) {

  const overlay = document.getElementById("battleOverlay");
  const battle = gameData.battle;
  if (!overlay) return;

  overlay.style.display = "flex";
overlay.style.pointerEvents = "none";
  
  const attacker = gameData.players[battle.attackerId];
  const defender = gameData.players[battle.defenderId];

  const baseMax = 5;

  // === AWAITING ATTACKER ROLL ===
  if (battle.stage === "awaitingAttackerRoll") {

overlay.style.pointerEvents = "auto";
    
    overlay.innerHTML = `
      <h1>BATTLE</h1>
      <h2>${attacker.name} (ATTACK)</h2>
      ${currentPlayerId === battle.attackerId
        ? `<button id="rollAttackBtn">ROLL ATTACK</button>`
        : `<p>Waiting for attacker to roll...</p>`}
    `;
  }

  // === AWAITING DEFENDER ROLL ===
  else if (battle.stage === "awaitingDefenderRoll") {

overlay.style.pointerEvents = "auto";
    
    overlay.innerHTML = `
      <h1>BATTLE</h1>
      <h2>${attacker.name}: ${battle.attackerRoll}</h2>
      <h2>${defender.name} (DEFENSE)</h2>
      ${currentPlayerId === battle.defenderId
        ? `<button id="rollDefenseBtn">ROLL DEFENSE</button>`
        : `<p>Waiting for defender to roll...</p>`}
    `;
  }

// === RESULT ===
else if (battle.stage === "result") {

overlay.style.pointerEvents = "auto";
  
  // End attacker movement
await gamesRef.child(currentGameCode)
  .child("players")
  .child(battle.winnerId)
  .update({ movesRemaining: 0 });

overlay.innerHTML = `
  <h1>BATTLE RESULT</h1>
  <h2>${attacker.name}: ${battle.attackerRoll}</h2>
  <h2>${defender.name}: ${battle.defenderRoll}</h2>
  <h2>${gameData.players[battle.winnerId].name} WINS!</h2>
  ${
    currentPlayerId === battle.winnerId
      ? '<br><br><button id="battleContinueBtn">Continue</button>'
      : '<p>Waiting for winner...</p>'
  }
`;
}
}
/* =============================
   BATTLE RESOLUTION (UTILITY)
   ============================= */

function resolveBattle(attackerId, defenderId, gameData) {

  const attacker = gameData.players[attackerId];
  const defender = gameData.players[defenderId];

  const baseMax = 5;
  const attackerMax = baseMax + ((attacker.upgrades?.weapons || 0) * 3);
  const defenderMax = baseMax + ((defender.upgrades?.weapons || 0) * 3);

  const attackerRoll = Math.floor(Math.random() * attackerMax) + 1;
  const defenderRoll = Math.floor(Math.random() * defenderMax) + 1;

 if (attackerRoll > defenderRoll) {
  return { winner: attackerId, loser: defenderId, attackerRoll, defenderRoll };
} else {
  return { winner: defenderId, loser: attackerId, attackerRoll, defenderRoll };
 }
   
} // closes resolveBattle

}); // closes DOMContentLoaded
