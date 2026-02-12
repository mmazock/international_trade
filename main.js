document.addEventListener("DOMContentLoaded", () => {

  const database = firebase.database();
  const gamesRef = database.ref("games");

  const createGameBtn = document.getElementById("createGameBtn");
  const joinGameBtn = document.getElementById("joinGameBtn");
  const joinCodeInput = document.getElementById("joinCodeInput");
  const playerNameInput = document.getElementById("playerNameInput");
  const joinStatus = document.getElementById("joinStatus");

  const inventoryList = document.getElementById("inventoryList");

  let currentGameCode = null;
  let currentPlayerId = null;

  /* =============================
     RANDOM JOIN CODE
     ============================= */

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

    const newPlayerRef = gamesRef.child(code).child("players").push();

    await newPlayerRef.set({
      name: name,
      money: 0,
      infrastructure: 0,
      inventory: {}
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
     LISTEN TO FULL GAME DATA
     ============================= */

  function listenToGameData() {

    const gameRef = gamesRef.child(currentGameCode);

    gameRef.on("value", snapshot => {

      const gameData = snapshot.val();
      if (!gameData) return;

      renderLedger(gameData);

    });
  }

  /* =============================
     RENDER PUBLIC LEDGER
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

      if (isCurrentTurn && playerId === currentPlayerId) {
        html += `<br><button id="endTurnBtn">End Turn</button>`;
      }

      html += `</div>`;
    });

    inventoryList.innerHTML = html;

    const endTurnBtn = document.getElementById("endTurnBtn");
    if (endTurnBtn) {
      endTurnBtn.addEventListener("click", () => {
        advanceTurn(gameData);
      });
    }
  }

  /* =============================
     ADVANCE TURN
     ============================= */

  function advanceTurn(gameData) {

    const turnOrder = gameData.turnOrder || [];
    let currentTurnIndex = gameData.currentTurnIndex || 0;

    currentTurnIndex++;

    if (currentTurnIndex >= turnOrder.length) {
      currentTurnIndex = 0;
    }

    gamesRef.child(currentGameCode).update({
      currentTurnIndex: currentTurnIndex
    });
  }

});
