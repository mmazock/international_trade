document.addEventListener("DOMContentLoaded", () => {

  const database = firebase.database();
  const gamesRef = database.ref("games");

  const createGameBtn = document.getElementById("createGameBtn");
  const joinGameBtn = document.getElementById("joinGameBtn");
  const joinCodeInput = document.getElementById("joinCodeInput");
  const playerNameInput = document.getElementById("playerNameInput");
  const joinStatus = document.getElementById("joinStatus");

  const inventoryList = document.getElementById("inventoryList");
  const infraDisplay = document.getElementById("infraLevel");

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

    joinStatus.textContent = "Joined game: " + code;

    listenToPlayerData();
  });

  /* =============================
     REAL-TIME PLAYER SYNC
     ============================= */

  function listenToPlayerData() {

    const playerRef = gamesRef.child(currentGameCode).child("players").child(currentPlayerId);

    playerRef.on("value", snapshot => {

      const data = snapshot.val();
      if (!data) return;

      infraDisplay.textContent = data.infrastructure;

      if (!data.inventory || Object.keys(data.inventory).length === 0) {
        inventoryList.innerHTML = "No resources collected yet.";
      } else {
        let html = "";
        for (let resource in data.inventory) {
          html += `${resource}: ${data.inventory[resource]}<br>`;
        }
        inventoryList.innerHTML = html;
      }

    });
  }

});
