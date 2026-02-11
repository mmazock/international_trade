document.addEventListener("DOMContentLoaded", () => {

  const database = firebase.database();
  const gamesRef = database.ref("games");

  const createGameBtn = document.getElementById("createGameBtn");
  const joinGameBtn = document.getElementById("joinGameBtn");
  const joinCodeInput = document.getElementById("joinCodeInput");
  const playerNameInput = document.getElementById("playerNameInput");
  const joinStatus = document.getElementById("joinStatus");

  let currentGameCode = null;
  let currentPlayerId = null;
  let currentPlayerName = null;

  /* =============================
     RANDOM JOIN CODE GENERATOR
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
     CREATE GAME (HOST)
     ============================= */

  createGameBtn.addEventListener("click", async () => {

    let code = generateCode();

    const snapshot = await gamesRef.child(code).once("value");

    if (snapshot.exists()) {
      // Extremely rare collision — regenerate
      code = generateCode();
    }

    await gamesRef.child(code).set({
      host: true,
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
    currentPlayerName = name;

    joinStatus.textContent = "Joined game: " + code;

  });

});
