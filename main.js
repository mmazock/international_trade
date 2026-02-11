document.addEventListener("DOMContentLoaded", () => {

  console.log("Multiplayer skeleton loaded");

  // Firebase reference
  const database = firebase.database();
  const gameRef = database.ref("gameSession");

  // Initialize session if it doesn't exist
  gameRef.once("value", snapshot => {
    if (!snapshot.exists()) {
      gameRef.set({
        players: {},
        turnOrder: [],
        currentTurnIndex: 0
      });
      console.log("Game session initialized.");
    }
  });

  // DOM references
  const joinBtn = document.getElementById("joinGameBtn");
  const nameInput = document.getElementById("playerNameInput");
  const joinStatus = document.getElementById("joinStatus");

  let currentPlayerId = null;
  let currentPlayerName = null;

  // Join Game logic
  joinBtn.addEventListener("click", () => {

    const name = nameInput.value.trim();

    if (!name) {
      joinStatus.textContent = "Please enter a name.";
      return;
    }

    const newPlayerRef = gameRef.child("players").push();

    newPlayerRef.set({
      name: name,
      money: 0,
      infrastructure: 0,
      inventory: {}
    });

    currentPlayerId = newPlayerRef.key;
    currentPlayerName = name;

    joinStatus.textContent = "Joined as " + name;

  });

});
