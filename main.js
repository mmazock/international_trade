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

  const rollDiceBtn = document.getElementById("rollDiceBtn");
  const diceResult = document.getElementById("diceResult");

  let currentGameCode = null;
  let currentPlayerId = null;

  /* =============================
     WATER MAP (CONFIRMED)
     ============================= */

  const waterSquares = new Set([
    // A
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
     GRID CALIBRATION
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

    const rect = mapImage.getBoundingClientRect();

    return {
      x: rect.width * (colObj.x / originalWidth),
      y: rect.height * (rowObj.y / originalHeight)
    };
  }

  /* =============================
     MOVEMENT
     ============================= */

  rollDiceBtn.addEventListener("click", async () => {

    if (!currentGameCode || !currentPlayerId) return;

    const gameSnap = await gamesRef.child(currentGameCode).once("value");
    const gameData = gameSnap.val();

    const currentTurnIndex = gameData.currentTurnIndex;
    const turnOrder = gameData.turnOrder;

    if (turnOrder[currentTurnIndex] !== currentPlayerId) {
      diceResult.textContent = "Not your turn.";
      return;
    }

    const roll = Math.floor(Math.random() * 6) + 1;

    await gamesRef.child(currentGameCode)
      .child("players")
      .child(currentPlayerId)
      .update({ movesRemaining: roll });

    diceResult.textContent = "You rolled: " + roll;
  });

  mapImage.addEventListener("click", async (event) => {

    if (!currentGameCode || !currentPlayerId) return;

    const rect = mapImage.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = columnPixels.reduce((a,b)=>Math.abs(b.x-x)<Math.abs(a.x-x)?b:a).letter;
    const row = rowPixels.reduce((a,b)=>Math.abs(b.y-y)<Math.abs(a.y-y)?b:a).row;

    const target = col + row;

    if (!waterSquares.has(target)) return;

    const playerRef = gamesRef.child(currentGameCode)
      .child("players")
      .child(currentPlayerId);

    const playerSnap = await playerRef.once("value");
    const player = playerSnap.val();

    if (!player.movesRemaining || player.movesRemaining <= 0) return;

    const currentPos = player.shipPosition;

    const colDiff = target.charCodeAt(0) - currentPos.charCodeAt(0);
    const rowDiff = parseInt(target.slice(1)) - parseInt(currentPos.slice(1));

    if (!(
      (Math.abs(colDiff) === 1 && rowDiff === 0) ||
      (Math.abs(rowDiff) === 1 && colDiff === 0)
    )) return;

    await playerRef.update({
      shipPosition: target,
      movesRemaining: player.movesRemaining - 1
    });

  });

});
