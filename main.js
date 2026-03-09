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
async function addGameLog(message) {
  if (!currentGameCode) return;
  await gamesRef.child(currentGameCode).child("gameLog").push({
    text: message,
    timestamp: Date.now()
  });
}

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
/* =============================
   BOT SYSTEM
   ============================= */

const BOT_PERSONALITIES = {
  putin: {
    name: "Putin",
    emoji: "VP",
    traits: "Cunning, deceptive, ruthless strategist who uses manipulation to WIN",
    aggression: 0.9, deception: 0.85, riskTolerance: 0.7, loyalty: 0.1,
    expansionPriority: 0.9, economyPriority: 0.5,
    dealResponses: {
      accept: ["Da. We have agreement... for now.", "I accept. Do not test my patience.", "This serves my interests. Agreed."],
      reject: ["Nyet. You insult me with this offer.", "I have no use for your proposal.", "You are not in position to negotiate."],
      betray: ["Agreements are... flexible.", "Circumstances have changed.", "I never promised anything."]
    }
  },
  gandhi: {
    name: "Gandhi",
    emoji: "MG",
    traits: "Non-violent, tactical, principled pacifist who wins through economic dominance and trade supremacy",
    aggression: 0.1, deception: 0.1, riskTolerance: 0.3, loyalty: 0.95,
    expansionPriority: 0.3, economyPriority: 0.9,
    dealResponses: {
      accept: ["In the spirit of cooperation, I agree.", "Peace and trade benefit us all.", "I accept, and I shall honor my word."],
      reject: ["I must respectfully decline.", "This does not align with my principles.", "I cannot accept these terms in good conscience."],
      betray: ["I deeply regret I cannot fulfill this.", "Forgive me, circumstances forced my hand."]
    }
  },
  napoleon: {
    name: "Napoleon",
    emoji: "🇫🇷",
    traits: "Ambitious, brilliant tactician who fights to WIN through military conquest and economic control",
    aggression: 0.85, deception: 0.6, riskTolerance: 0.8, loyalty: 0.3,
    expansionPriority: 0.95, economyPriority: 0.6,
    dealResponses: {
      accept: ["Magnifique! This arrangement suits the Empire.", "I shall permit this alliance... temporarily.", "Victory favors the bold. Agreed."],
      reject: ["You dare offer crumbs to an Emperor?", "France does not beg. Proposal denied.", "I have conquered nations larger than your fleet."],
      betray: ["An emperor answers to no one.", "Strategy demands sacrifice — yours.", "History will judge me kindly regardless."]
    }
  },
  elizabeth: {
    name: "Elizabeth I",
    emoji: "👑",
    traits: "Shrewd diplomat, calculating queen focused on WINNING through trade wealth and strategic alliances",
    aggression: 0.4, deception: 0.7, riskTolerance: 0.4, loyalty: 0.5,
    expansionPriority: 0.6, economyPriority: 0.85,
    dealResponses: {
      accept: ["The Crown finds these terms acceptable.", "England prospers through wise alliances.", "You have my royal assent."],
      reject: ["We are not amused by this proposal.", "England shall not be made a fool.", "Your terms are beneath the dignity of this throne."],
      betray: ["A queen must protect her realm above all.", "Promises to rivals are written in sand.", "The crown's interests supersede sentiment."]
    }
  },
  genghis: {
    name: "Genghis Khan",
    emoji: "🏹",
    traits: "Brutal, fearless, conquest-driven warlord who fights to WIN the game through domination and wealth",
    aggression: 0.85, deception: 0.3, riskTolerance: 0.9, loyalty: 0.4,
    expansionPriority: 0.85, economyPriority: 0.65,

    dealResponses: {
      accept: ["The Khan accepts. Do not disappoint me.", "Your tribute is noted. We ride together.", "Strength recognizes strength. Agreed."],
      reject: ["Submit or be trampled.", "The horde does not negotiate with the weak.", "I take what I want. I need no deal."],
      betray: ["The strong devour the weak. It is natural.", "Your trust was your undoing.", "I warned you — submit or perish."]
    }
  },
  cleopatra: {
    name: "Cleopatra",
    emoji: "🐍",
    traits: "Diplomat, cunning, politically brilliant — always scheming to WIN through wealth and manipulation",
    aggression: 0.3, deception: 0.8, riskTolerance: 0.5, loyalty: 0.35,
    expansionPriority: 0.5, economyPriority: 0.9,
    dealResponses: {
      accept: ["Egypt smiles upon this arrangement.", "You are wise to seek my favor. Agreed.", "A most... profitable partnership."],
      reject: ["Do you think the Queen of the Nile so easily swayed?", "Your offer insults the throne of Egypt.", "I have refused emperors. You are no different."],
      betray: ["The Nile's currents shift without warning, darling.", "Power demands difficult choices.", "I do what I must to preserve my dynasty."]
    }
  },
  bismarck: {
    name: "Bismarck",
    emoji: "🇩🇪",
    traits: "Iron-willed realpolitik master focused on WINNING through balanced military and economic strategy",
    aggression: 0.6, deception: 0.5, riskTolerance: 0.5, loyalty: 0.6,
    expansionPriority: 0.7, economyPriority: 0.8,
    dealResponses: {
      accept: ["Blood and iron approve this accord.", "A pragmatic arrangement. Germany accepts.", "This aligns with our strategic interests."],
      reject: ["Realpolitik demands I refuse.", "This deal weakens our position. Declined.", "I did not unite Germany by accepting poor terms."],
      betray: ["Politics is the art of the possible.", "Sentiment has no place in statecraft.", "The balance of power required adjustment."]
    }
  },
  sunTzu: {
    name: "Sun Tzu",
    emoji: "☯️",
    traits: "Wise strategist who wins by outmaneuvering opponents — every move calculated toward VICTORY",
    aggression: 0.3, deception: 0.9, riskTolerance: 0.4, loyalty: 0.5,
    expansionPriority: 0.5, economyPriority: 0.7,
    dealResponses: {
      accept: ["The supreme art of war is to subdue the enemy without fighting. Agreed.", "When the wind is favorable, one must sail. I accept.", "Know your enemy, know yourself. This deal serves both."],
      reject: ["He who knows when he can fight and when he cannot, will be victorious. Not today.", "Appear weak when you are strong. I decline.", "This offer reveals more about you than you intended."],
      betray: ["All warfare is based on deception.", "Let your plans be dark as night.", "Opportunities multiply as they are seized."]
    }
  },
  victoria: {
    name: "Queen Victoria",
    emoji: "🏰",
    traits: "Imperial empire-builder laser-focused on WINNING through expansion and economic supremacy",
    aggression: 0.5, deception: 0.3, riskTolerance: 0.3, loyalty: 0.7,
    expansionPriority: 0.8, economyPriority: 0.85,
    dealResponses: {
      accept: ["The Empire accepts. See that you honor it.", "For the good of civilization, we agree.", "Proper conduct demands we accept fair terms."],
      reject: ["We are not amused.", "The British Empire does not grovel.", "Quite unacceptable. Good day."],
      betray: ["The Empire's interests must come first.", "We acted for the greater good.", "Regrettable, but necessary for the realm."]
    }
  },
  hardBot1: {
    name: "Admiral Steele",
    emoji: "⚓",
    traits: "Ruthlessly efficient military strategist driven to WIN through tactical superiority",
    aggression: 0.75, deception: 0.4, riskTolerance: 0.6, loyalty: 0.5,
    expansionPriority: 0.7, economyPriority: 0.75,
    dealResponses: {
      accept: ["Tactical advantage confirmed. Deal accepted.", "Efficient. Agreed.", "This serves the fleet. Proceed."],
      reject: ["Negative. Unfavorable terms.", "Denied. Try harder.", "That's a losing play. No deal."],
      betray: ["War is war.", "Nothing personal. Just strategy.", "Adapt or sink."]
    }
  },
  hardBot2: {
    name: "The Merchant",
    emoji: "💰",
    traits: "Greedy, calculating trader obsessed with WINNING through maximum profit and resource control",
    aggression: 0.2, deception: 0.6, riskTolerance: 0.3, loyalty: 0.2,
    expansionPriority: 0.3, economyPriority: 1.0,
    dealResponses: {
      accept: ["Profit margins check out. You have a deal.", "Gold talks. I'm listening. Agreed.", "Smart money says yes."],
      reject: ["The numbers don't add up. Pass.", "I didn't get rich making bad deals.", "Come back when you have a real offer."],
      betray: ["Business is business.", "Nothing personal — just profit margins.", "Every coin counts. Even yours."]
    }
  },
  hardBot3: {
    name: "Iron Maiden",
    emoji: "⚔️",
    traits: "Aggressive raider who lives to WIN through combat dominance and intimidation",
    aggression: 0.95, deception: 0.2, riskTolerance: 0.9, loyalty: 0.4,
    expansionPriority: 0.85, economyPriority: 0.4,
    dealResponses: {
      accept: ["Fine. But cross me and I'll sink every ship you own.", "Alliance forged in iron. Don't make it rust.", "Agreed. Now let's find someone to fight."],
      reject: ["I'd rather take it by force.", "Peace is boring. No deal.", "Why negotiate when I can just attack?"],
      betray: ["Should've seen this coming.", "The strong take. The weak complain.", "Consider it a lesson learned."]
    }
  }
};

const DIFFICULTY_LEVELS = {
  easy:     { decisionQuality: 0.4, mistakeRate: 0.3, planningDepth: 1 },
  medium:   { decisionQuality: 0.6, mistakeRate: 0.15, planningDepth: 2 },
  hard:     { decisionQuality: 0.85, mistakeRate: 0.05, planningDepth: 3 },
  veryHard: { decisionQuality: 1.0, mistakeRate: 0.0, planningDepth: 4 }
};

let botTrustScores = {};
let pendingDeals = [];
let dealHistory = [];
  let recentBattles = {};
let botConversationHistories = {}; // Persist conversation history per bot

function initBotTrust(gameData) {
  const players = gameData.players || {};
  for (let id in players) {
    if (players[id].isBot) {
      if (!botTrustScores[id]) {
        botTrustScores[id] = {};
        for (let pid in players) {
          if (pid !== id) {
            botTrustScores[id][pid] = 50; // trust ALL players including other bots
          }
        }
      }
    }
  }
}



function getBotResponse(botPlayer, dealType, gameData, dealDetails) {
  const personality = BOT_PERSONALITIES[botPlayer.personality];
  const difficulty = DIFFICULTY_LEVELS[botPlayer.difficulty];

  if (Math.random() < difficulty.mistakeRate) {
    const flip = Math.random() > 0.5;
    const responses = flip ? personality.dealResponses.accept : personality.dealResponses.reject;
    return {
      accepted: flip,
      message: responses[Math.floor(Math.random() * responses.length)]
    };
  }

  let acceptChance = 0.5;
  const trust = botTrustScores[dealDetails.botId]?.[dealDetails.playerId] || 50;
  acceptChance += (trust - 50) / 200;

  switch (dealType) {
    case 'safe_passage':
    case 'request_suez':
      acceptChance += personality.economyPriority * 0.2;
      if (dealDetails.amount >= 200) acceptChance += 0.2;
      break;
    case 'ceasefire':
    case 'mutual_defense':
      acceptChance += (1 - personality.aggression) * 0.3;
      acceptChance += personality.loyalty * 0.2;
      break;
    case 'target_player':
      acceptChance += personality.aggression * 0.3;
      acceptChance -= personality.loyalty * 0.2;
      break;
    case 'resource_trade':
    case 'money_for_resource':
    case 'request_resource':
      acceptChance += personality.economyPriority * 0.2;
      break;
    case 'request_money':
      acceptChance -= 0.1;
      acceptChance += personality.loyalty * 0.2;
      break;
    case 'warning':
    case 'bounty_warning':
    case 'fleet_warning':
      acceptChance -= personality.aggression * 0.3;
      acceptChance += (1 - personality.riskTolerance) * 0.2;
      break;
  }

  acceptChance *= difficulty.decisionQuality + (1 - difficulty.decisionQuality) * 0.5;
  acceptChance = Math.max(0.05, Math.min(0.95, acceptChance));

  const accepted = Math.random() < acceptChance;
  const responses = accepted
    ? personality.dealResponses.accept
    : personality.dealResponses.reject;

  let willBetray = false;
  if (accepted && Math.random() > personality.loyalty) {
    willBetray = true;
  }

  return {
    accepted,
    willBetray,
    message: responses[Math.floor(Math.random() * responses.length)]
  };
}

function updateTrust(botId, playerId, delta) {
  if (!botTrustScores[botId]) botTrustScores[botId] = {};
  const current = botTrustScores[botId][playerId] || 50;
  botTrustScores[botId][playerId] = Math.max(-100, Math.min(100, current + delta));
}

function trackDeal(deal) {
  pendingDeals.push({
    ...deal,
    createdRound: deal.round || 1,
    expiresRound: (deal.round || 1) + (deal.rounds || 5),
    fulfilled: false
  });
}


function checkDealFulfillment(gameData, playerId) {
  const currentRound = gameData.round || 1;
  pendingDeals = pendingDeals.filter(deal => {
    if (currentRound > deal.expiresRound) {
      if (!deal.fulfilled && deal.promiserId === playerId) {
        for (let id in gameData.players) {
          updateTrust(id, playerId, -20);
        }
      }
      addGameLog(`📜 Deal expired: ${deal.dealType || deal.type} between ${gameData.players[deal.promiserId]?.name || 'Unknown'} and ${gameData.players[deal.recipientId]?.name || 'Unknown'}`);
      return false;
    }
    return true;
  });
}
// === BOT-TO-BOT BEHIND-THE-SCENES NEGOTIATION ===
let botNegotiationCooldown = {};

async function botToBotNegotiate(botId, bot, gameData, personality) {
  const currentRound = gameData.round || 1;
  const cooldownKey = `${botId}_${currentRound}`;
  if (botNegotiationCooldown[cooldownKey]) return;
  botNegotiationCooldown[cooldownKey] = true;

  // Only negotiate sometimes (based on personality)
  if (Math.random() > (personality.economyPriority * 0.4 + 0.1)) return;

  // Find another bot to negotiate with
  const otherBots = Object.keys(gameData.players).filter(id =>
    id !== botId && gameData.players[id].isBot
  );
  if (otherBots.length === 0) return;

  const targetBotId = otherBots[Math.floor(Math.random() * otherBots.length)];
  const targetBot = gameData.players[targetBotId];
  const targetPersonality = BOT_PERSONALITIES[targetBot.personality];

  const trust = botTrustScores[botId]?.[targetBotId] || 50;

  // Decide what to propose based on personality and situation
  let proposal = null;

  if (personality.aggression > 0.6 && trust > 30) {
    // Aggressive bots want to target human players together
    const humanPlayers = Object.keys(gameData.players).filter(id => !gameData.players[id].isBot);
    if (humanPlayers.length > 0) {
      const targetHuman = humanPlayers[Math.floor(Math.random() * humanPlayers.length)];
      const humanPlayer = gameData.players[targetHuman];
      proposal = { dealType: "target_player", targetPlayer: humanPlayer.country || humanPlayer.name };
    }
  } else if (personality.economyPriority > 0.6) {
    // Trade-oriented bots propose resource swaps
    const botInv = Object.keys(bot.inventory || {});
    const targetInv = Object.keys(targetBot.inventory || {});
    if (botInv.length > 0 && targetInv.length > 0) {
      proposal = {
        dealType: "resource_trade",
        offerResource: botInv[0],
        wantResource: targetInv[0]
      };
    }
  } else if (personality.aggression < 0.4) {
    // Peaceful bots propose ceasefires
    proposal = { dealType: "ceasefire", rounds: 3 + Math.floor(Math.random() * 5) };
  }

  if (!proposal) return;

  // Evaluate acceptance based on target bot personality
  let acceptChance = 0.5;
  acceptChance += (trust - 50) / 100;

  if (proposal.dealType === "ceasefire") {
    acceptChance += (1 - targetPersonality.aggression) * 0.3;
  } else if (proposal.dealType === "target_player") {
    acceptChance += targetPersonality.aggression * 0.3;
    acceptChance -= targetPersonality.loyalty * 0.2;
  } else if (proposal.dealType === "resource_trade") {
    acceptChance += targetPersonality.economyPriority * 0.3;
  }

  acceptChance = Math.max(0.1, Math.min(0.9, acceptChance));
  const accepted = Math.random() < acceptChance;

  if (accepted) {
    let willBetray = Math.random() > targetPersonality.loyalty;

    trackDeal({
      type: proposal.dealType,
      dealType: proposal.dealType,
      promiserId: targetBotId,
      recipientId: botId,
      round: currentRound,
      rounds: proposal.rounds || 5,
      willBetray: willBetray,
      dealTerms: {
        resource: proposal.offerResource || null,
        amount: 1,
        money: 0,
        rounds: proposal.rounds || 5,
        targetPlayer: proposal.targetPlayer || null
      }
    });

    updateTrust(botId, targetBotId, 10);
    updateTrust(targetBotId, botId, 10);
    addGameLog(`🤝 ${bot.name} and ${targetBot.name} struck a secret ${proposal.dealType} deal!`);
  } else {
    updateTrust(botId, targetBotId, -5);
    addGameLog(`💬 ${bot.name} tried to negotiate with ${targetBot.name} but was refused.`);
  }
}
// === BOT PROACTIVE MESSAGING TO PLAYER ===
let botProposalCooldown = {};

async function botProposeToPlayer(botId, bot, gameData, personality) {
  const currentRound = gameData.round || 1;
  const cooldownKey = `${botId}_${currentRound}`;
  if (botProposalCooldown[cooldownKey]) return;
  
  if (Math.random() > (personality.economyPriority * 0.3 + personality.deception * 0.1)) return;
  
  const humanPlayers = Object.keys(gameData.players).filter(id => !gameData.players[id].isBot);
  if (humanPlayers.length === 0) return;
  
  const targetPlayerId = humanPlayers[Math.floor(Math.random() * humanPlayers.length)];
  const targetPlayer = gameData.players[targetPlayerId];
  const trust = botTrustScores[botId]?.[targetPlayerId] || 50;
  
  let proposal = null;
  
  if (personality.economyPriority > 0.6 && Object.keys(bot.inventory || {}).length > 0) {
    const resource = Object.keys(bot.inventory)[0];
    proposal = `I have ${resource} to trade. Would you be interested in a resource swap?`;
  } else if (personality.aggression < 0.4 && trust > 30) {
    proposal = `I propose a ceasefire between us for ${3 + Math.floor(Math.random() * 4)} rounds. What say you?`;
  } else if (personality.aggression > 0.7 && trust < 30) {
    proposal = `Stay out of my waters or face the consequences. Consider this a warning.`;
  } else if (trust > 60) {
    proposal = `Perhaps we should form a mutual defense pact? Together we would be formidable.`;
  }
  
  if (!proposal) return;
  
  botProposalCooldown[cooldownKey] = true;
  
  addGameLog(`💬 ${bot.name} sends a message to ${targetPlayer.name}: "${proposal}"`);
  
  if (!botConversationHistories[botId]) botConversationHistories[botId] = [];
  botConversationHistories[botId].push({ role: "assistant", content: proposal });
}


/* =============================
   BOT TURN EXECUTION
   ============================= */

async function runBotStepWithTimeout(stepName, runner, timeoutMs = 6000) {
  let timeoutId;
  try {
    await Promise.race([
      runner(),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`${stepName}_timeout`)), timeoutMs);
      })
    ]);
    return true;
  } catch (error) {
    console.warn(`Bot ${stepName} failed, using fallback`, error);
    return false;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function getFreshGameDataWithTimeout(stepName = "refresh_game_state", timeoutMs = 6000) {
  let timeoutId;
  try {
    const snap = await Promise.race([
      gamesRef.child(currentGameCode).once("value"),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`${stepName}_timeout`)), timeoutMs);
      })
    ]);
    return snap?.val ? snap.val() : null;
  } catch (error) {
    console.warn(`Bot ${stepName} read failed`, error);
    return null;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function executeBotTurn(botId, gameData) {
  const bot = gameData.players[botId];
  if (!bot || !bot.isBot) return;

  const personalityId = BOT_PERSONALITIES[bot.personality] ? bot.personality : "putin";
  const difficultyId = DIFFICULTY_LEVELS[bot.difficulty] ? bot.difficulty : "medium";

  const personality = BOT_PERSONALITIES[personalityId];
  const difficulty = DIFFICULTY_LEVELS[difficultyId];
  const phase = Number(gameData.currentPhase ?? 0);

  await new Promise(r => setTimeout(r, 1200 + Math.random() * 1000));

  if (phase === 0) {
    // Bot-to-bot behind-the-scenes negotiation
       await runBotStepWithTimeout("bot_negotiate", () => botToBotNegotiate(botId, bot, gameData, personality), 8000);
    await runBotStepWithTimeout("bot_propose_player", () => botProposeToPlayer(botId, bot, gameData, personality), 5000);
    await runBotStepWithTimeout("give_phase", () => botGivePhase(botId, bot, gameData, personality, difficulty), 5000);

    await runBotStepWithTimeout("set_phase_1", () => gamesRef.child(currentGameCode).update({
      currentPhase: 1,
      lastActive: Date.now()
    }), 5000);

  } else if (phase === 1) {
    await runBotStepWithTimeout("upgrade_phase", () => botUpgradePhase(botId, bot, gameData, personality, difficulty), 5000);
    await runBotStepWithTimeout("reset_bot_move_state", () => gamesRef.child(currentGameCode)
      .child("players")
      .child(botId)
      .update({ rollValue: null, movesRemaining: 0 }), 5000);
    await runBotStepWithTimeout("set_phase_2", () => gamesRef.child(currentGameCode).update({
      currentPhase: 2,
      lastActive: Date.now()
    }), 5000);

  } else if (phase === 2) {
    const moved = await runBotStepWithTimeout("movement_phase", () => botMovementPhase(botId, bot, gameData, personality, difficulty), 12000);

    if (!moved) {
      const freshData = await getFreshGameDataWithTimeout("movement_recovery_refresh", 6000);
      if (!freshData) return;

      const turnOrder = freshData.turnOrder || [];
      const currentTurnIndex = freshData.currentTurnIndex || 0;
      const activePlayerId = turnOrder[currentTurnIndex];
      const currentPhase = Number(freshData.currentPhase ?? 0);

      if (!freshData.battle && activePlayerId === botId && currentPhase === 2) {
        await runBotStepWithTimeout("movement_recovery_advance_turn", () => advanceTurn(), 7000);
      }
    }
  }
}


async function botGivePhase(botId, bot, gameData, personality, difficulty) {
  // Honor AI-negotiated deals
  const dealsToHonor = pendingDeals.filter(d =>
    d.promiserId === botId && !d.fulfilled && (d.type === 'give' || d.dealType === 'money_for_resource' || d.dealType === 'resource_trade' || d.dealType === 'request_money' || d.dealType === 'request_resource')
  );

  for (const deal of dealsToHonor) {
    const terms = deal.dealTerms || {};
    
    // Check for betrayal
    if (deal.willBetray && Math.random() < personality.deception) {
      updateTrust(botId, deal.recipientId, -30);
      const responses = BOT_PERSONALITIES[bot.personality].dealResponses.betray;
      addGameLog(`🗡️ ${bot.name} BETRAYED their deal with ${gameData.players[deal.recipientId]?.name || 'Unknown'}!`);
      console.log(`Bot ${bot.name}: ${responses[Math.floor(Math.random() * responses.length)]}`);
      deal.fulfilled = true;
      continue;
    }

    // Transfer money if promised
    if (terms.money > 0 && bot.money >= terms.money) {
      await gamesRef.child(currentGameCode).child("players").child(botId)
        .update({ money: bot.money - terms.money });
      await gamesRef.child(currentGameCode).child("players").child(deal.recipientId)
        .update({ money: (gameData.players[deal.recipientId]?.money || 0) + terms.money });
      updateTrust(botId, deal.recipientId, 15);
      addGameLog(`💰 ${bot.name} paid $${terms.money} to ${gameData.players[deal.recipientId]?.name || 'Unknown'} (honoring deal)`);
    }

    // Transfer resource if promised
    if (terms.resource && bot.inventory?.[terms.resource]) {
      const amount = terms.amount || 1;
      const botInv = { ...bot.inventory };
      const recipientInv = { ...(gameData.players[deal.recipientId]?.inventory || {}) };
      botInv[terms.resource] = (botInv[terms.resource] || 0) - amount;
      if (botInv[terms.resource] <= 0) delete botInv[terms.resource];
      recipientInv[terms.resource] = (recipientInv[terms.resource] || 0) + amount;

      await gamesRef.child(currentGameCode).child("players").child(botId)
        .update({ inventory: botInv });
      await gamesRef.child(currentGameCode).child("players").child(deal.recipientId)
        .update({ inventory: recipientInv });
      updateTrust(botId, deal.recipientId, 15);
      addGameLog(`📦 ${bot.name} sent ${terms.resource} x${amount} to ${gameData.players[deal.recipientId]?.name || 'Unknown'} (honoring deal)`);
    }

    // Fallback for old-style deals
    if (!terms.money && !terms.resource) {
      if (deal.giveType === 'money' && bot.money >= deal.amount) {
        await gamesRef.child(currentGameCode).child("players").child(botId)
          .update({ money: bot.money - deal.amount });
        await gamesRef.child(currentGameCode).child("players").child(deal.recipientId)
          .update({ money: (gameData.players[deal.recipientId].money || 0) + deal.amount });
        updateTrust(botId, deal.recipientId, 15);
      } else if (deal.giveType === 'resource' && bot.inventory?.[deal.resource]) {
        const botInv = { ...bot.inventory };
        const recipientInv = { ...(gameData.players[deal.recipientId].inventory || {}) };
        botInv[deal.resource] = (botInv[deal.resource] || 0) - 1;
        if (botInv[deal.resource] <= 0) delete botInv[deal.resource];
        recipientInv[deal.resource] = (recipientInv[deal.resource] || 0) + 1;
        await gamesRef.child(currentGameCode).child("players").child(botId)
          .update({ inventory: botInv });
        await gamesRef.child(currentGameCode).child("players").child(deal.recipientId)
          .update({ inventory: recipientInv });
        updateTrust(botId, deal.recipientId, 15);
      }
    }

    deal.fulfilled = true;
  }
}


async function botUpgradePhase(botId, bot, gameData, personality, difficulty) {
  if (bot.money < 100) return;

  const options = [];

  const transportLevel = bot.upgrades?.transport || 0;
  const navLevel = bot.upgrades?.navigation || 0;
  const weaponsLevel = bot.upgrades?.weapons || 0;

  const transportCost = 150 * (transportLevel + 1);
  const navCost = 100 * (navLevel + 1);
  const weaponsCost = 100 * (weaponsLevel + 1);

  if (bot.money >= transportCost) {
    options.push({ type: 'transport', score: personality.economyPriority * 0.8, cost: transportCost, level: transportLevel });
  }
  if (bot.money >= navCost && navLevel < 3) {
    options.push({ type: 'navigation', score: personality.economyPriority * 0.6 + personality.expansionPriority * 0.4, cost: navCost, level: navLevel });
  }
  if (bot.money >= weaponsCost) {
    options.push({ type: 'weapons', score: personality.aggression * 0.9, cost: weaponsCost, level: weaponsLevel });
  }

  if (options.length === 0) return;
  if (Math.random() < difficulty.mistakeRate) return;

  options.sort((a, b) => b.score - a.score);
  const chosen = options[0];

  await gamesRef.child(currentGameCode).child("players").child(botId)
    .update({ money: bot.money - chosen.cost });

  if (Math.random() < 0.75) {
    await gamesRef.child(currentGameCode).child("players").child(botId)
      .update({ [`upgrades/${chosen.type}`]: chosen.level + 1 });
  }
}

async function botMovementPhase(botId, bot, gameData, personality, difficulty) {
  const maxRoll = 6 + ((bot.upgrades?.navigation || 0) * 3);
  const roll = Math.floor(Math.random() * maxRoll) + 1;

  await gamesRef.child(currentGameCode).child("players").child(botId)
    .update({ movesRemaining: roll, rollValue: roll });

  await new Promise(r => setTimeout(r, 800));

  let movesLeft = roll;

  while (movesLeft > 0) {
    const freshSnap = await gamesRef.child(currentGameCode).once("value");
    const freshData = freshSnap.val();
    const freshBot = freshData.players[botId];

    if (freshData.battle) break;

    const target = botChooseMove(botId, freshBot, freshData, personality, difficulty);
    if (!target) break;

    let defenderId = null;
    for (let id in freshData.players) {
      if (id !== botId && freshData.players[id].shipPosition === target) {
        defenderId = id;
        break;
      }
    }

    if (defenderId) {
      const defender = freshData.players[defenderId];
      if (target === defender.homePort) {
        break;
      }

      // Check for active ceasefire or safe_passage deals
      const hasCeasefire = pendingDeals.some(d =>
        !d.fulfilled &&
        (d.dealType === "ceasefire" || d.dealType === "safe_passage") &&
        ((d.promiserId === botId && d.recipientId === defenderId) ||
         (d.recipientId === botId && d.promiserId === defenderId)) &&
        (freshData.round || 1) <= (d.expiresRound || 999)
      );

      if (hasCeasefire) {
        // Check if bot will betray the deal
        const ceasefireDeal = pendingDeals.find(d =>
          !d.fulfilled &&
          (d.dealType === "ceasefire" || d.dealType === "safe_passage") &&
          ((d.promiserId === botId && d.recipientId === defenderId) ||
           (d.recipientId === botId && d.promiserId === defenderId))
        );
        if (!ceasefireDeal?.willBetray || Math.random() > personality.deception) {
          // Honor the ceasefire — skip this move and try different direction
          continue;
        } else {
          // Betray!
          addGameLog(`🗡️ ${freshBot.name} BROKE their ceasefire with ${defender.name}!`);
          updateTrust(botId, defenderId, -40);
          ceasefireDeal.fulfilled = true;
        }
      }


      // Check for target_player deals — boost aggression toward targeted players
      const hasTargetDeal = pendingDeals.some(d =>
        !d.fulfilled &&
        d.dealType === "target_player" &&
        d.promiserId === botId &&
        d.dealTerms?.targetPlayer &&
        (defender.country === d.dealTerms.targetPlayer || defender.name === d.dealTerms.targetPlayer)
      );

      const effectiveAggression = hasTargetDeal ? Math.min(personality.aggression + 0.4, 1.0) : personality.aggression;

      if (Math.random() < effectiveAggression) {
        await gamesRef.child(currentGameCode).child("players").child(botId)
          .update({ shipPosition: target });
        await gamesRef.child(currentGameCode).update({
          battle: {
            attackerId: botId,
            defenderId: defenderId,
            attackerRoll: null,
            defenderRoll: null,
            winnerId: null,
            stage: "awaitingAttackerRoll"
          },
          lastActive: Date.now()
        });
        const attackerIsBot = gameData.players[battle.attackerId]?.isBot;
const defenderIsBot = gameData.players[battle.defenderId]?.isBot;
const botVsBot = attackerIsBot && defenderIsBot;

if (!botVsBot) {
  await new Promise(r => setTimeout(r, 1500));
}
        await botRollAttack(botId, freshData);
        return;
      } else {
        break;
      }
    }


    await gamesRef.child(currentGameCode).child("players").child(botId)
      .update({ shipPosition: target, movesRemaining: movesLeft - 1 });

    movesLeft--;
    await new Promise(r => setTimeout(r, 600));

    if (harvestZones[target] && Math.random() < difficulty.decisionQuality) {
      await botHarvest(botId, target, freshData, personality);
      return;
    }

    if (factoryZones[target] && target !== freshBot.homePort) {
      await botManufacture(botId, target, freshData, personality);
      if (movesLeft <= 0) break;
    }

    const updatedSnap = await gamesRef.child(currentGameCode).once("value");
    const updatedBot = updatedSnap.val().players[botId];

    if (updatedBot.shipPosition === updatedBot.homePort &&
        updatedBot.inventory && Object.keys(updatedBot.inventory).length > 0) {

      let totalValue = 0;
      for (let resource in updatedBot.inventory) {
        const qty = updatedBot.inventory[resource];
        const base = baseResourceValues[resource] || 0;
        const mult = updatedBot.multipliers?.[resource] || 1;
        totalValue += qty * base * mult;
      }

      if (updatedBot.inventory["Automobiles"]) {
        await gamesRef.child(currentGameCode).child("players").child(botId)
          .update({
            automobilesCashed: (updatedBot.automobilesCashed || 0) + updatedBot.inventory["Automobiles"]
          });
      }

      await gamesRef.child(currentGameCode).child("players").child(botId)
        .update({
          money: (updatedBot.money || 0) + totalValue,
          inventory: {}
        });

      await advanceTurn();
      return;
    }
  }

  await advanceTurn();
}


// BFS helper: find shortest path length from start to goal on water
function bfsDist(start, goal, gameData) {
  if (start === goal) return 0;
  const visited = new Set();
  const queue = [[start, 0]];
  visited.add(start);
  while (queue.length > 0) {
    const [pos, dist] = queue.shift();
    const col = pos.charCodeAt(0);
    const row = parseInt(pos.slice(1));
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dc, dr] of dirs) {
      const nc = String.fromCharCode(col + dc);
      const nr = row + dr;
      const next = nc + nr;
      if (visited.has(next)) continue;
      if (!waterSquares.has(next)) continue;
      if (restrictedTransitions[pos] && !restrictedTransitions[pos].includes(next)) continue;
      if ((pos === "G3" && next === "G4") || (pos === "G4" && next === "G3")) {
        if (!gameData.suezOwner) continue;
      }
      if (next === goal) return dist + 1;
      visited.add(next);
      queue.push([next, dist + 1]);
    }
  }
  return 999; // unreachable
}

function botChooseStrategicGoal(botId, bot, gameData, personality) {
  const inv = bot.inventory || {};
  const invCount = Object.keys(inv).length;

  // Check for target_player deals — hunt that player
  const targetDeal = pendingDeals.find(d =>
    !d.fulfilled &&
    d.dealType === "target_player" &&
    d.promiserId === botId &&
    d.dealTerms?.targetPlayer
  );
  if (targetDeal && personality.aggression > 0.4) {
    for (let id in gameData.players) {
      const p = gameData.players[id];
      if ((p.country === targetDeal.dealTerms.targetPlayer || p.name === targetDeal.dealTerms.targetPlayer) && p.shipPosition) {
        return p.shipPosition;
      }
    }
  }

  // Check for mutual_defense — move toward ally if they're near an enemy
  const defenseDeal = pendingDeals.find(d =>
    !d.fulfilled &&
    d.dealType === "mutual_defense" &&
    (d.promiserId === botId || d.recipientId === botId)
  );
  if (defenseDeal && personality.loyalty > 0.5) {
    const allyId = defenseDeal.promiserId === botId ? defenseDeal.recipientId : defenseDeal.promiserId;
    const ally = gameData.players[allyId];
    if (ally?.shipPosition) {
      // Check if any enemy is near the ally
      for (let id in gameData.players) {
        if (id !== botId && id !== allyId && gameData.players[id].shipPosition) {
          const dist = bfsDist(gameData.players[id].shipPosition, ally.shipPosition, gameData);
          if (dist <= 3) return ally.shipPosition; // Rush to defend
        }
      }
    }
  }

  // GOAL 1: If carrying goods, head home to cash in
  if (invCount > 0) {
    for (const sq in factoryZones) {
      const goods = factoryZones[sq];
      for (const good of goods) {
        const recipe = manufacturingRecipes[good];
        if (recipe && recipe.inputs.every(r => (inv[r] || 0) >= 1)) {
          const distFactory = bfsDist(bot.shipPosition, sq, gameData);
          const distHome = bfsDist(bot.shipPosition, bot.homePort, gameData);
          if (distFactory < distHome) return sq;
        }
      }
    }
    return bot.homePort;
  }

  // GOAL 2: If empty, find best harvest zone
  let bestTarget = null;
  let bestScore = -1;

  for (const sq in harvestZones) {
    const region = harvestZones[sq].region;
    const resources = regionResources[region] || [];
    const dist = bfsDist(bot.shipPosition, sq, gameData);
    if (dist >= 999) continue;

    let value = 0;
    for (const r of resources) {
      const base = baseResourceValues[r] || 0;
      const mult = bot.multipliers?.[r] || 1;
      value = Math.max(value, base * mult);
    }

    // Trust-influenced: avoid areas near hostile players
    let dangerPenalty = 0;
    for (let id in gameData.players) {
      if (id !== botId && gameData.players[id].shipPosition) {
        const trust = botTrustScores[botId]?.[id] || 50;
        const playerDist = bfsDist(sq, gameData.players[id].shipPosition, gameData);
        if (trust < 20 && playerDist < 4) dangerPenalty += (4 - playerDist) * 3;
      }
    }

    const score = (value * personality.economyPriority) / (dist + 1) - dangerPenalty;
    if (score > bestScore) {
      bestScore = score;
      bestTarget = sq;
    }
  }

  return bestTarget || bot.homePort;
}


function botChooseMove(botId, bot, gameData, personality, difficulty, avoidSquares = new Set()) {

  const currentPos = bot.shipPosition;
  const currentCol = currentPos.charCodeAt(0);
  const currentRow = parseInt(currentPos.slice(1));

  // Get valid adjacent squares
  const adjacent = [];
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  for (const [dc, dr] of directions) {
    const newCol = String.fromCharCode(currentCol + dc);
    const newRow = currentRow + dr;
    const target = newCol + newRow;

    if (!waterSquares.has(target)) continue;
    if (avoidSquares.has(target)) continue;

    if (restrictedTransitions[currentPos]) {
      if (!restrictedTransitions[currentPos].includes(target)) continue;
    }

    if ((currentPos === "G3" && target === "G4") || (currentPos === "G4" && target === "G3")) {
      if (!gameData.suezOwner) continue;
    }

    adjacent.push(target);
  }

  if (adjacent.length === 0) return null;

  // Determine strategic goal
  const goal = botChooseStrategicGoal(botId, bot, gameData, personality);
  const goalDist = bfsDist(currentPos, goal, gameData);

  const scored = adjacent.map(target => {
    let score = Math.random() * 0.5; // small random tiebreaker

    // Primary: move toward strategic goal
    const targetDist = bfsDist(target, goal, gameData);
    if (targetDist < goalDist) score += 20;
    else if (targetDist === goalDist) score += 5;

    // Bonus: harvest zone along the way
    if (harvestZones[target] && Object.keys(bot.inventory || {}).length === 0) {
      score += personality.economyPriority * 8;
    }

    // Bonus: factory where we can manufacture
    if (factoryZones[target]) {
      const recipes = factoryZones[target];
      for (const good of recipes) {
        const recipe = manufacturingRecipes[good];
        if (recipe && recipe.inputs.every(r => (bot.inventory?.[r] || 0) >= 1)) {
          score += 15;
        }
      }
    }

    // Bonus: home port with cargo
    if (target === bot.homePort && bot.inventory && Object.keys(bot.inventory).length > 0) {
      score += 25;
    }

// Aggression: approach or avoid other players
for (let id in gameData.players) {

  if (id === botId) continue;

  const otherPos = gameData.players[id].shipPosition;
  if (!otherPos) continue;

  const pairKey = [botId, id].sort().join("_");

  // Avoid recently fought opponent for 10 seconds
  if (recentBattles[pairKey] && Date.now() - recentBattles[pairKey] < 10000) {
    score -= 40;
    continue;
  }

  // If moving directly into them
  if (target === otherPos) {
    if (personality.aggression < 0.7) {
      score -= 50;
      continue;
    }
  }

  const dist =
    Math.abs(target.charCodeAt(0) - otherPos.charCodeAt(0)) +
    Math.abs(parseInt(target.slice(1)) - parseInt(otherPos.slice(1)));

  if (personality.aggression > 0.5)
    score += (10 - dist) * personality.aggression * 0.2;
  else
    score += dist * 0.1;
}

    // Apply difficulty quality
    score *= difficulty.decisionQuality;
    score += Math.random() * (1 - difficulty.decisionQuality) * 3;

    return { target, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.target || null;
}

async function botHarvest(botId, square, gameData, personality) {
  if (!harvestZones[square]) return;
  const region = harvestZones[square].region;
  const resources = regionResources[region];
  const bot = gameData.players[botId];
  const harvestCapacity = 1 + (bot.upgrades?.transport || 0);

  const botInv = { ...(bot.inventory || {}) };

  const neededResources = new Set();
  for (const good in manufacturingRecipes) {
    const recipe = manufacturingRecipes[good];
    for (const input of recipe.inputs) {
      if (!(botInv[input] >= 1) && resources.includes(input)) {
        neededResources.add(input);
      }
    }
  }

  const picked = new Set();
  for (let i = 0; i < harvestCapacity && i < resources.length; i++) {
    let bestResource = null;
    let bestValue = -1;

    for (const r of resources) {
      let val = (baseResourceValues[r] || 0) * (bot.multipliers?.[r] || 1);
      if (neededResources.has(r) && !picked.has(r)) val += 500;
      if (picked.has(r) && neededResources.size > 0) val -= 200;
      if (val > bestValue) {
        bestValue = val;
        bestResource = r;
      }
    }

    if (bestResource) {
      botInv[bestResource] = (botInv[bestResource] || 0) + 1;
      picked.add(bestResource);
      neededResources.delete(bestResource);
    }
  }

  await gamesRef.child(currentGameCode).child("players").child(botId)
    .update({ inventory: botInv });

  await advanceTurn();
}


async function botManufacture(botId, square, gameData, personality) {
  const goods = factoryZones[square];
  if (!goods) return;

  const bot = gameData.players[botId];
  const inventory = { ...(bot.inventory || {}) };

  for (const good of goods) {
    const recipe = manufacturingRecipes[good];
    if (!recipe) continue;

    const hasAll = recipe.inputs.every(r => (inventory[r] || 0) >= 1);
    if (!hasAll) continue;

    recipe.inputs.forEach(r => {
      inventory[r] -= 1;
      if (inventory[r] <= 0) delete inventory[r];
    });

    inventory[good] = (inventory[good] || 0) + 1;

    await gamesRef.child(currentGameCode).child("players").child(botId)
      .update({ inventory, movesRemaining: 0 });

    await advanceTurn();
    return;
  }
}

async function botRollAttack(botId, gameData) {
  const bot = gameData.players[botId];
  const baseMax = 5;
  const maxRoll = baseMax + ((bot.upgrades?.weapons || 0) * 3);
  const roll = Math.floor(Math.random() * maxRoll) + 1;

  await gamesRef.child(currentGameCode).child("battle").update({
    attackerRoll: roll,
    stage: "awaitingDefenderRoll"
  });
}

async function botRollDefense(botId, gameData) {
  const bot = gameData.players[botId];
  const battle = gameData.battle;
  const baseMax = 5;
  const maxRoll = baseMax + ((bot.upgrades?.weapons || 0) * 3);
  const roll = Math.floor(Math.random() * maxRoll) + 1;

  const attackerRoll = battle.attackerRoll;
  let winnerId;
  if (roll > attackerRoll) winnerId = battle.defenderId;
  else if (roll < attackerRoll) winnerId = battle.attackerId;
  else winnerId = battle.defenderId;

  await gamesRef.child(currentGameCode).child("battle").update({
    defenderRoll: roll,
    winnerId: winnerId,
    stage: "result"
  });
  // ===== AUTO-RESOLVE BOT VS BOT BATTLES =====
const attackerIsBot = gameData.players[battle.attackerId]?.isBot;
const defenderIsBot = gameData.players[battle.defenderId]?.isBot;

if (attackerIsBot && defenderIsBot) {
  await botHandleBattleDecision(winnerId, gameData);
}
}

async function botHandleBattleDecision(botId, gameData) {
  const personality = BOT_PERSONALITIES[gameData.players[botId].personality];
  const battle = gameData.battle;
  // Record recent battle
const pairKey = [battle.attackerId, battle.defenderId].sort().join("_");
recentBattles[pairKey] = Date.now();
  const loserId = battle.winnerId === battle.attackerId ? battle.defenderId : battle.attackerId;
  const loser = gameData.players[loserId];

  await new Promise(r => setTimeout(r, 1500));
await gamesRef.child(currentGameCode)
  .child("players")
  .child(botId)
  .update({ movesRemaining: 0 });
  // 🔥 FORCE END OF WINNER MOVEMENT
  await gamesRef.child(currentGameCode)
    .child("players")
    .child(botId)
    .update({ movesRemaining: 0 });

  if (personality.aggression > 0.7 && Math.random() < personality.aggression) {

    await gamesRef.child(currentGameCode).child("players").child(loserId)
      .update({ shipPosition: loser.homePort, inventory: {}, movesRemaining: 0 });

    await gamesRef.child(currentGameCode).update({ battle: null });

    await advanceTurn();

  } else {

    const winner = gameData.players[botId];
    const winnerInv = { ...(winner.inventory || {}) };
    const loserInv = loser.inventory || {};

    for (let r in loserInv) {
      winnerInv[r] = (winnerInv[r] || 0) + loserInv[r];
    }

    await gamesRef.child(currentGameCode).child("players").child(botId)
      .update({ inventory: winnerInv });

    await gamesRef.child(currentGameCode).child("players").child(loserId)
      .update({ inventory: {} });

    await gamesRef.child(currentGameCode).update({
      battle: {
        ...battle,
        stage: "displacement",
        displacedPlayerId: loserId,
        originSquare: winner.shipPosition
      }
    });

    if (!botVsBot) {
  await new Promise(r => setTimeout(r, 800));
}
    await botDisplaceLoser(botId, loserId, gameData);
  }
}


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

createGameBtn.addEventListener("click", () => {

  createGameBtn.style.display = "none";
  document.getElementById("hostSetup").style.display = "block";

});
document.getElementById("confirmHostBtn").addEventListener("click", async () => {

  const name = document.getElementById("hostNameInput").value.trim();
  const country = document.getElementById("hostCountrySelect").value;

  if (!name || !country) {
    alert("Enter name and select country.");
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
    hostId: null,
    victoryCondition: "money10k",
    readyPlayers: {},
    lastActive: Date.now()
  });

  currentGameCode = code;

  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase();

  const newPlayerRef = gamesRef.child(code).child("players").push();

  await newPlayerRef.set({
    name,
    country,
    homePort: countryData[country].home,
    multipliers: countryData[country].multipliers,
    money: 0,
    bounty: 0,
    upgrades: { transport:0, navigation:0, weapons:0 },
    inventory: {},
    shipPosition: countryData[country].home,
    color: availableColors[0],
    initials,
    movesRemaining: 0,
    rollValue: null
  });

  currentPlayerId = newPlayerRef.key;

  await gamesRef.child(code).update({
    turnOrder: [currentPlayerId],
    hostId: currentPlayerId
  });

  localStorage.setItem("gameCode", code);
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

  gamesRef.child(currentGameCode).on("value", async (snapshot) => {

    const gameData = snapshot.val();
    if (!gameData) return;

    latestGameData = gameData;

    if (gameData.gameState === "lobby") {
      renderLobby(gameData);

      const botCountEl = document.getElementById("botCount");
      const configList = document.getElementById("botConfigList");

      const renderBotConfigList = () => {
        if (!botCountEl || !configList) return;

        const currentSelections = [];
        document.querySelectorAll(".botPersonality").forEach(el => {
          const idx = Number(el.dataset.bot);
          currentSelections[idx] = {
            personality: el.value,
            difficulty: document.querySelector(`.botDifficulty[data-bot="${idx}"]`)?.value || "medium"
          };
        });

        const count = Math.max(0, parseInt(botCountEl.value || "0") || 0);
        configList.innerHTML = "";

        for (let i = 0; i < count; i++) {
          const selectedPersonality = currentSelections[i]?.personality || "putin";
          const selectedDifficulty = currentSelections[i]?.difficulty || "medium";

          configList.innerHTML += `
            <div style="border:1px solid #666; padding:8px; margin:5px 0;">
              <strong>Bot ${i + 1}</strong><br>
              <label>Personality:
             <select class="botPersonality" data-bot="${i}">
  <option value="putin" ${selectedPersonality === "putin" ? "selected" : ""}>Putin 🇷🇺</option>
  <option value="gandhi" ${selectedPersonality === "gandhi" ? "selected" : ""}>Gandhi 🇮🇳</option>
  <option value="napoleon" ${selectedPersonality === "napoleon" ? "selected" : ""}>Napoleon 🇫🇷</option>
  <option value="elizabeth" ${selectedPersonality === "elizabeth" ? "selected" : ""}>Elizabeth I 👑</option>
  <option value="genghis" ${selectedPersonality === "genghis" ? "selected" : ""}>Genghis Khan 🏹</option>
  <option value="cleopatra" ${selectedPersonality === "cleopatra" ? "selected" : ""}>Cleopatra 🐍</option>
  <option value="bismarck" ${selectedPersonality === "bismarck" ? "selected" : ""}>Bismarck 🇩🇪</option>
  <option value="sunTzu" ${selectedPersonality === "sunTzu" ? "selected" : ""}>Sun Tzu ☯️</option>
  <option value="victoria" ${selectedPersonality === "victoria" ? "selected" : ""}>Queen Victoria 🏰</option>
  <option value="hardBot1" ${selectedPersonality === "hardBot1" ? "selected" : ""}>Admiral Steele ⚓</option>
  <option value="hardBot2" ${selectedPersonality === "hardBot2" ? "selected" : ""}>The Merchant 💰</option>
  <option value="hardBot3" ${selectedPersonality === "hardBot3" ? "selected" : ""}>Iron Maiden ⚔️</option>
</select>

              </label><br>
              <label>Difficulty:
                <select class="botDifficulty" data-bot="${i}">
                  <option value="easy" ${selectedDifficulty === "easy" ? "selected" : ""}>Easy</option>
                  <option value="medium" ${selectedDifficulty === "medium" ? "selected" : ""}>Medium</option>
                  <option value="hard" ${selectedDifficulty === "hard" ? "selected" : ""}>Hard</option>
                  <option value="veryHard" ${selectedDifficulty === "veryHard" ? "selected" : ""}>Very Hard</option>
                </select>
              </label>
            </div>
          `;
        }
      };

      if (botCountEl && !botCountEl._listenerAttached) {
        botCountEl._listenerAttached = true;
        botCountEl.addEventListener("change", renderBotConfigList);
      }

      renderBotConfigList();
      return;
    }

    initBotTrust(gameData);
    renderShips(gameData);
    renderLedger(gameData);

    // === BOT AUTO-PLAY (only host runs bot logic) ===
    if (gameData.hostId !== currentPlayerId) return;
    if (gameData.gameState !== "active") return;

    const forceAdvanceFromPhase = async (phaseValue, playerId) => {
      if (phaseValue === 0) {
        await runBotStepWithTimeout("recovery_set_phase_1", () => gamesRef.child(currentGameCode).update({
          currentPhase: 1, lastActive: Date.now()
        }), 5000);
        return;
      }
      if (phaseValue === 1) {
        await runBotStepWithTimeout("recovery_reset_bot_move_state", () => gamesRef.child(currentGameCode)
          .child("players").child(playerId)
          .update({ rollValue: null, movesRemaining: 0 }), 5000);
        await runBotStepWithTimeout("recovery_set_phase_2", () => gamesRef.child(currentGameCode).update({
          currentPhase: 2, lastActive: Date.now()
        }), 5000);
        return;
      }
      await runBotStepWithTimeout("recovery_advance_turn", () => advanceTurn(), 7000);
    };

    const processBotAutomation = async (initialData) => {
      let data = initialData;
      let safety = 0;

      while (safety < 50) {
        safety += 1;

        const turnOrder = data.turnOrder || [];
        const currentTurnIndex = data.currentTurnIndex || 0;
        const activePlayerId = turnOrder[currentTurnIndex];
        if (!activePlayerId) return;

        const activePlayer = data.players?.[activePlayerId];

        if (!activePlayer || !activePlayer.isBot) {
          if (!data.battle) return;
          const battle = data.battle;

          const attackerIsBot = data.players?.[battle.attackerId]?.isBot;
          const defenderIsBot = data.players?.[battle.defenderId]?.isBot;
          const isBotVsBot = attackerIsBot && defenderIsBot;

          if (battle.stage === "awaitingDefenderRoll" && data.players?.[battle.defenderId]?.isBot) {
            if (!isBotVsBot) await new Promise(r => setTimeout(r, 1500));
            await runBotStepWithTimeout("battle_defender_roll", () => botRollDefense(battle.defenderId, data), 6000);
          } else if (battle.stage === "awaitingAttackerRoll" && data.players?.[battle.attackerId]?.isBot) {
            if (!isBotVsBot) await new Promise(r => setTimeout(r, 1500));
            await runBotStepWithTimeout("battle_attacker_roll", () => botRollAttack(battle.attackerId, data), 6000);

          } else if ((battle.stage === "result" || battle.stage === "decision") 
         && data.players?.[battle.winnerId]?.isBot) {

  if (isBotVsBot) {
    // Instant resolution for bot vs bot
    await botHandleBattleDecision(battle.winnerId, data);
  } else {
    // Dramatic timing for human-involved battles
    await runBotStepWithTimeout(
      "battle_winner_decision",
      () => botHandleBattleDecision(battle.winnerId, data),
      6000
    );
  }
} else {
            return;
          }

          const battleData = await getFreshGameDataWithTimeout("post_battle_refresh", 6000);
          if (!battleData || battleData.hostId !== currentPlayerId || battleData.gameState !== "active") return;
          data = battleData;
          continue;
        }

        const beforeTurnIndex = currentTurnIndex;
        const beforePhase = Number(data.currentPhase ?? 0);

        const executed = await runBotStepWithTimeout("execute_bot_turn", () => executeBotTurn(activePlayerId, data), 18000);
        if (!executed) {
          await forceAdvanceFromPhase(beforePhase, activePlayerId);
        }

        const refreshed = await getFreshGameDataWithTimeout("post_bot_turn_refresh", 6000);
        if (!refreshed || refreshed.hostId !== currentPlayerId || refreshed.gameState !== "active") return;
        data = refreshed;

        const afterTurnOrder = data.turnOrder || [];
        const afterTurnIndex = data.currentTurnIndex || 0;
        const afterActiveId = afterTurnOrder[afterTurnIndex];
        const afterPhase = Number(data.currentPhase ?? 0);

        if (!data.battle && afterActiveId === activePlayerId && afterTurnIndex === beforeTurnIndex && afterPhase === beforePhase) {
          await forceAdvanceFromPhase(afterPhase, activePlayerId);
          const recovered = await getFreshGameDataWithTimeout("post_deadlock_recovery_refresh", 6000);
          if (!recovered || recovered.hostId !== currentPlayerId || recovered.gameState !== "active") return;
          data = recovered;
        }
      }
    };

    if (window._botExecuting) return;
    window._botExecuting = true;
    try {
      await processBotAutomation(gameData);
    } finally {
      window._botExecuting = false;
    }
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
const snap = await gamesRef.child(currentGameCode).once("value");
const gd = snap.val();
const p = gd.players[currentPlayerId];
await gamesRef.child(currentGameCode).child("gameLog").push({
  round: gd.round, message: `${p.name} (${p.country}) did not give.`
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
if (event.target.id === "readyBtn") {

  await gamesRef.child(currentGameCode)
    .child("readyPlayers")
    .update({
      [currentPlayerId]: true
    });

  return;
}
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
    await gamesRef.child(currentGameCode).child("gameLog").push({
  round: gameData.round,
  message: `${sender.name} gave ${amount} ${resource} to ${recipient.name}.`
});

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

if (event.target.id === "startGameBtn") {

  const victoryConditions = {};

  if (document.getElementById("vcMoney")?.checked) {
    victoryConditions.money = parseInt(document.getElementById("vcMoneyAmount")?.value || 10000);
  }
  if (document.getElementById("vcRounds")?.checked) {
    victoryConditions.rounds = parseInt(document.getElementById("vcRoundsAmount")?.value || 200);
  }
  if (document.getElementById("vcAutos")?.checked) {
    victoryConditions.autos = parseInt(document.getElementById("vcAutosAmount")?.value || 10);
  }

  if (Object.keys(victoryConditions).length === 0) {
    alert("Select at least one victory condition.");
    return;
  }

  const botCount = parseInt(document.getElementById("botCount")?.value || "0");
  const snapshot = await gamesRef.child(currentGameCode).once("value");
  const currentData = snapshot.val();
  let turnOrder = currentData.turnOrder || [];

  const usedCountries = Object.values(currentData.players || {}).map(p => p.country);
  const usedColors = Object.values(currentData.players || {}).map(p => p.color);
  const allCountries = ["Spain", "Portugal", "England", "France", "Italy", "Germany"];

  const personalityCounts = {};
  const personalityInputs = Array.from(document.querySelectorAll(".botPersonality"));
  const difficultyInputs = Array.from(document.querySelectorAll(".botDifficulty"));

  for (let i = 0; i < botCount; i++) {
    const pickedPersonality = personalityInputs[i]?.value;
    const pickedDifficulty = difficultyInputs[i]?.value;

    const personalityId = BOT_PERSONALITIES[pickedPersonality] ? pickedPersonality : "putin";
    const difficultyId = DIFFICULTY_LEVELS[pickedDifficulty] ? pickedDifficulty : "medium";
    const persona = BOT_PERSONALITIES[personalityId];

    personalityCounts[personalityId] = (personalityCounts[personalityId] || 0) + 1;
    const nameCount = personalityCounts[personalityId];

    const availableCountries = allCountries.filter(c => !usedCountries.includes(c));
    if (availableCountries.length === 0) break;

    let bestCountry = availableCountries[0];
    let bestScore = -1;

    for (const country of availableCountries) {
      const data = countryData[country];
      let score = Math.random() * 2;
      for (let r in data.multipliers) {
        const val = (baseResourceValues[r] || 0) * data.multipliers[r];
        score += val * persona.economyPriority * 0.01;
      }
      if (persona.aggression > 0.5) {
        if (country === "England" || country === "Spain") score += 3;
      }
      if (score > bestScore) {
        bestScore = score;
        bestCountry = country;
      }
    }

    usedCountries.push(bestCountry);
    const color = availableColors.find(c => !usedColors.includes(c)) || "gray";
    usedColors.push(color);

    const botDisplayName = nameCount > 1
      ? `${persona.name} ${nameCount} ${persona.emoji}`
      : `${persona.name} ${persona.emoji}`;

    const botRef = gamesRef.child(currentGameCode).child("players").push();

    await botRef.set({
      name: botDisplayName,
      country: bestCountry,
      homePort: countryData[bestCountry].home,
      multipliers: countryData[bestCountry].multipliers,
      money: 0,
      bounty: 0,
      upgrades: { transport: 0, navigation: 0, weapons: 0 },
      inventory: {},
      shipPosition: countryData[bestCountry].home,
      color,
      initials: persona.name.substring(0, 2).toUpperCase(),
      movesRemaining: 0,
      rollValue: null,
      isBot: true,
      personality: personalityId,
      difficulty: difficultyId
    });

    turnOrder.push(botRef.key);
  }

  await gamesRef.child(currentGameCode).update({
    gameState: "active",
    currentPhase: 0,
    round: 1,
    victoryConditions: victoryConditions,
    turnOrder: turnOrder
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
// Increase bounty ONLY if attacker committed piracy
if (winnerId === battle.attackerId) {

  await gamesRef.child(currentGameCode)
    .child("players")
    .child(winnerId)
    .update({
      bounty: (gameData.players[winnerId].bounty || 0) + 200
    });
}
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

await gamesRef.child(currentGameCode)
  .child("players")
  .child(currentPlayerId)
  .update({
    rollValue: null,
    movesRemaining: 0
  });

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
  // === NEGOTIATE WITH BOT (AI Chat) ===
if (event.target && event.target.classList.contains("negotiateBotBtn")) {
  const botId = event.target.dataset.bot;
  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();
  const bot = gameData.players[botId];
  const persona = BOT_PERSONALITIES[bot.personality];

  const overlay = document.getElementById("botNegotiateOverlay");
  overlay.style.display = "flex";

  const trust = botTrustScores[botId]?.[currentPlayerId] || 50;
  let trustLabel = "Neutral";
  if (trust > 70) trustLabel = "Trusting";
  else if (trust > 50) trustLabel = "Cautious";
  else if (trust > 20) trustLabel = "Suspicious";
  else trustLabel = "Hostile";

    overlay._botId = botId;
    if (!botConversationHistories[botId]) botConversationHistories[botId] = [];
  overlay._conversationHistory = botConversationHistories[botId];



  const me = gameData.players[currentPlayerId];
  const gameContext = `You are ${bot.name} playing as ${bot.country}. You have $${bot.money} and inventory: ${JSON.stringify(bot.inventory || {})}. Your weapons level: ${bot.upgrades?.weapons || 0}. The player negotiating is ${me.name} (${me.country}) with $${me.money}.`;
  overlay._gameContext = gameContext;
  overlay._botName = bot.name;
  overlay._botPersonality = bot.personality;
  overlay._botTraits = persona.traits;
  overlay._trustLabel = trustLabel;

  overlay.innerHTML = `
    <h2>Negotiate with ${bot.name}</h2>
    <p><em>${persona.traits}</em></p>
    <p>Their trust in you: <strong>${trustLabel}</strong></p>
    <hr style="width:80%; border-color:#555;">
    <div id="negotiateChatLog" style="max-height:300px; overflow-y:auto; width:90%; text-align:left; margin:10px auto; padding:10px; background:#1a1a1a; border-radius:8px; font-size:0.95em;">
      <p style="color:#888; font-style:italic;">Say anything — propose trades, make threats, form alliances...</p>
    </div>
    <div style="display:flex; gap:8px; width:90%; margin:0 auto;">
      <input type="text" id="negotiateChatInput" placeholder="Type your message to ${bot.name}..."
        style="flex:1; padding:8px; border-radius:4px; border:1px solid #555; background:#222; color:white; font-size:1em;">
      <button id="negotiateSendBtn" style="padding:8px 16px; background:#4a9; color:white; border:none; border-radius:4px; cursor:pointer;">Send</button>
    </div>
    <br>
    <div style="width:90%; margin:0 auto;">
      <strong>Quick proposals:</strong><br>
      <button class="quickDealBtn" data-msg="I'll pay you $500 for safe passage through your waters." style="margin:3px; padding:4px 8px; font-size:0.85em;">💰 Safe Passage</button>
      <button class="quickDealBtn" data-msg="I propose a ceasefire for 5 rounds. No attacks." style="margin:3px; padding:4px 8px; font-size:0.85em;">🤝 Ceasefire</button>
      <button class="quickDealBtn" data-msg="Stay away from my trade routes or face consequences." style="margin:3px; padding:4px 8px; font-size:0.85em;">⚔️ Warning</button>
      <button class="quickDealBtn" data-msg="Let's trade resources. What do you need?" style="margin:3px; padding:4px 8px; font-size:0.85em;">📦 Trade</button>
    </div>
    <br>
    <button id="closeNegotiateBtn">Close</button>
  `;

  setTimeout(() => document.getElementById("negotiateChatInput")?.focus(), 100);
  return;
}

// === QUICK DEAL BUTTON ===
if (event.target && event.target.classList.contains("quickDealBtn")) {
  const msg = event.target.dataset.msg;
  const input = document.getElementById("negotiateChatInput");
  if (input) {
    input.value = msg;
    document.getElementById("negotiateSendBtn")?.click();
  }
  return;
}

// === SEND NEGOTIATE MESSAGE ===
if (event.target && event.target.id === "negotiateSendBtn") {
  const input = document.getElementById("negotiateChatInput");
  const chatLog = document.getElementById("negotiateChatLog");
  const overlay = document.getElementById("botNegotiateOverlay");
  const sendBtn = event.target;

  if (!input || !chatLog || !overlay) return;

  const message = input.value.trim();
  if (!message) return;

  chatLog.innerHTML += `<p style="color:#4a9;"><strong>You:</strong> ${message}</p>`;
  input.value = "";
  sendBtn.disabled = true;
  sendBtn.textContent = "...";

  // Track conversation history (persisted per bot)
  if (!overlay._conversationHistory) overlay._conversationHistory = [];
  overlay._conversationHistory.push({ role: "user", content: message });
  botConversationHistories[overlay._botId] = overlay._conversationHistory;


  chatLog.innerHTML += `<p id="typingIndicator" style="color:#888; font-style:italic;">${overlay._botName} is thinking...</p>`;
  chatLog.scrollTop = chatLog.scrollHeight;

  // Build enriched game context with active deals
  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const freshGameData = gameSnap.val();
  const bot = freshGameData.players[overlay._botId];
  const me = freshGameData.players[currentPlayerId];
  
  const activeDeals = pendingDeals.filter(d =>
    !d.fulfilled &&
    (d.promiserId === overlay._botId || d.recipientId === overlay._botId) &&
    (freshGameData.round || 1) <= (d.expiresRound || 999)
  );
  const dealSummary = activeDeals.length > 0 
    ? `Active deals: ${activeDeals.map(d => `${d.dealType} with ${freshGameData.players[d.promiserId === overlay._botId ? d.recipientId : d.promiserId]?.name || 'Unknown'} (expires round ${d.expiresRound})`).join(', ')}`
    : 'No active deals.';

  const enrichedContext = `You are ${bot.name} playing as ${bot.country}. You have $${bot.money} and inventory: ${JSON.stringify(bot.inventory || {})}. Your weapons level: ${bot.upgrades?.weapons || 0}. The player negotiating is ${me.name} (${me.country}) with $${me.money} and inventory: ${JSON.stringify(me.inventory || {})}. Current round: ${freshGameData.round || 1}. ${dealSummary}`;

  try {
    const resp = await fetch(`https://moxwjdjqfwjnlhlimcac.supabase.co/functions/v1/bot-negotiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1veHdqZGpxZndqbmxobGltY2FjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5OTk5ODQsImV4cCI6MjA4ODU3NTk4NH0.cTxRTqsKWkSQzyO3bZ1UkZglhB4mlt2tkPuzdxYzP4w"
      },
      body: JSON.stringify({
        message,
        botName: overlay._botName,
        botPersonality: overlay._botPersonality,
        botTraits: overlay._botTraits,
        trustLevel: overlay._trustLabel,
        gameContext: enrichedContext,
        conversationHistory: overlay._conversationHistory.slice(-10) // last 10 messages
      })
    });

    document.getElementById("typingIndicator")?.remove();

    if (!resp.ok) {
      chatLog.innerHTML += `<p style="color:red;">Error communicating. Try again.</p>`;
    } else {
      const data = await resp.json();
      let decisionBadge = "";
      if (data.decision === "ACCEPT") decisionBadge = " ✅";
      else if (data.decision === "REJECT") decisionBadge = " ❌";
      else if (data.decision === "COUNTER") decisionBadge = " 🔄";

      chatLog.innerHTML += `<p style="color:#e8a;"><strong>${overlay._botName}:</strong> ${data.reply}${decisionBadge}</p>`;

      // Track bot response in history
      overlay._conversationHistory.push({ role: "assistant", content: data.reply });

      // Apply trust change from AI
      if (data.trustChange) {
        updateTrust(overlay._botId, currentPlayerId, data.trustChange);
      }

      // If deal was ACCEPTED, create a real game deal
      if (data.decision === "ACCEPT" && data.dealType) {
        const terms = data.dealTerms || {};
        trackDeal({
          type: data.dealType,
          dealType: data.dealType,
          promiserId: overlay._botId,
          recipientId: currentPlayerId,
          round: freshGameData.round || 1,
          rounds: terms.rounds || 5,
          willBetray: data.willBetray || false,
          dealTerms: terms,
          botCommitment: data.botCommitment,
          playerCommitment: data.playerCommitment
        });
        addGameLog(`🤝 ${overlay._botName} ACCEPTED a ${data.dealType} deal with ${me.name}!`);
        chatLog.innerHTML += `<p style="color:#4f4; font-weight:bold;">📜 Deal recorded: ${data.dealType} (expires in ${terms.rounds || 5} rounds)</p>`;
      } else if (data.decision === "REJECT") {
        addGameLog(`❌ ${overlay._botName} rejected ${me.name}'s proposal.`);
      } else if (data.decision === "COUNTER") {
        chatLog.innerHTML += `<p style="color:#ff4; font-style:italic;">💡 ${overlay._botName} made a counter-proposal. Continue negotiating...</p>`;
      }
    }
  } catch (err) {
    document.getElementById("typingIndicator")?.remove();
    chatLog.innerHTML += `<p style="color:red;">Network error. Try again.</p>`;
  }

  sendBtn.disabled = false;
  sendBtn.textContent = "Send";
  chatLog.scrollTop = chatLog.scrollHeight;
  input.focus();
  return;
}


// === CLOSE NEGOTIATE ===
if (event.target && event.target.id === "closeNegotiateBtn") {
  document.getElementById("botNegotiateOverlay").style.display = "none";
  return;
}

if (event.target && event.target.id === "permissionAcknowledgeBtn") {
  await gamesRef.child(currentGameCode).update({
    permissionResult: null
  });
  
  // Check if player has no moves left — if so, advance turn
  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();
  const player = gameData.players[currentPlayerId];
  if (player && player.movesRemaining <= 0) {
    await advanceTurn();
  }
}
 
// === DEAL BUTTON CLICKED ===
if (event.target && event.target.classList.contains("dealBtn")) {
  const botId = event.target.dataset.bot;
  const dealType = event.target.dataset.deal;

  const gameSnap = await gamesRef.child(currentGameCode).once("value");
  const gameData = gameSnap.val();
  const bot = gameData.players[botId];

  const response = getBotResponse(bot, dealType, gameData, {
    botId, playerId: currentPlayerId, amount: 500
  });

  const overlay = document.getElementById("botNegotiateOverlay");
  overlay.innerHTML = `
    <h2>${bot.name} responds:</h2>
    <p style="font-size:1.3em; font-style:italic;">"${response.message}"</p>
    <p><strong>${response.accepted ? "✅ DEAL ACCEPTED" : "❌ DEAL REJECTED"}</strong></p>
    ${response.accepted ? '<p style="color:#aaa;">(Whether they honor this deal is another matter...)</p>' : ''}
    <br>
    <button id="closeNegotiateBtn">OK</button>
  `;

  if (response.accepted) {
    trackDeal({
      type: 'give',
      dealType: dealType,
      promiserId: botId,
      recipientId: currentPlayerId,
      round: gameData.round,
      willBetray: response.willBetray || false,
      giveType: dealType.includes('money') ? 'money' : 'resource',
      amount: 200,
      resource: null
    });

    updateTrust(botId, currentPlayerId, 5);
  }

  return;
}

// === CLOSE NEGOTIATE ===
if (event.target && event.target.id === "closeNegotiateBtn") {
  document.getElementById("botNegotiateOverlay").style.display = "none";
  return;
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
      rollValue: null,
      givingMode: null
    });


  // Switch turn + phase + round
  await gamesRef.child(currentGameCode).update({
    currentTurnIndex: nextTurn,
    currentPhase: 0,
    round: newRound,
    lastActive: Date.now()
  });
// 🔍 Check victory conditions after turn advances
const updatedSnap = await gamesRef.child(currentGameCode).once("value");
checkVictoryConditions(updatedSnap.val());
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
// 🚫 Prevent movement if not in Movement Phase
if (gameData.currentPhase !== 2) return;

// 🚫 Prevent movement if player hasn't rolled
if (!player.rollValue) {
  alert("You must roll before moving.");
  return;
}

// 🚫 Prevent movement if no moves remain
if ((player.movesRemaining || 0) <= 0) {
  alert("No moves remaining.");
  return;
}
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
// Adjacency check
    if (!isAdjacent) return;
    if (!waterSquares.has(target)) return;
    // Check if another player already occupies this square
    const players2 = gameData.players || {};
    for (let pid in players2) {
      if (pid !== battle.displacedPlayerId && players2[pid].shipPosition === target) {
        alert("That square is already occupied. Choose a different one.");
        return;
      }
    }

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

// 🔴 NEW ADJACENCY CHECK
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
//Adjacency check
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
// 🚗 Track automobile cash-ins BEFORE inventory is cleared
if (updatedPlayer.inventory["Automobiles"]) {
  const autos = updatedPlayer.inventory["Automobiles"];

  await gamesRef.child(currentGameCode)
    .child("players")
    .child(currentPlayerId)
    .update({
      automobilesCashed: (updatedPlayer.automobilesCashed || 0) + autos
    });
}
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
    const rect = mapImage.getBoundingClientRect();
const scaleFactor = rect.width / originalWidth;

// Clamp scale so ships don't get gigantic
const clampedScale = Math.min(scaleFactor, 1.8);

const shipSize = 18 * clampedScale;
const iconSize = 14 * clampedScale;
const fontSize = 7 * clampedScale;

      const wrapper = document.createElement("div");
      wrapper.className = "ship";
      wrapper.style.position = "absolute";
      wrapper.style.left = pos.x + "px";
      wrapper.style.top = pos.y + "px";
wrapper.style.width = shipSize + "px";
wrapper.style.height = shipSize + "px";
      wrapper.style.transform = "translate(-50%, -50%)";

      const circle = document.createElement("div");
circle.style.width = shipSize + "px";
circle.style.height = shipSize + "px";
      circle.style.backgroundColor = player.color;
      circle.style.borderRadius = "50%";
      circle.style.display = "flex";
      circle.style.flexDirection = "column";
      circle.style.alignItems = "center";
      circle.style.justifyContent = "center";

      const shipImg = document.createElement("img");
      shipImg.src = "ship.png";
shipImg.style.width = iconSize + "px";

      const label = document.createElement("div");
      label.textContent = player.initials;
      label.style.fontSize = fontSize + "px";
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

 // READY BUTTON FOR NON-HOSTS
if (currentPlayerId !== gameData.hostId) {
  html += `<button id="readyBtn">Ready</button><br><br>`;
}

// SHOW WHO IS READY
html += "<strong>Ready Players:</strong><br>";
Object.keys(gameData.readyPlayers || {}).forEach(id => {
  html += `${gameData.players[id].name} ✓<br>`;
});
html += `<hr><strong>Victory Conditions:</strong><br><br>`;

if (currentPlayerId === gameData.hostId) {
  html += `
    <label><input type="checkbox" id="vcMoney" checked> First to $
      <input type="number" id="vcMoneyAmount" value="10000" min="1000" step="1000" style="width:80px">
    </label><br><br>
    <label><input type="checkbox" id="vcRounds"> Most money after
      <input type="number" id="vcRoundsAmount" value="200" min="10" step="10" style="width:60px"> rounds
    </label><br><br>
    <label><input type="checkbox" id="vcAutos"> Most money after
      <input type="number" id="vcAutosAmount" value="10" min="1" step="1" style="width:50px"> automobiles cashed in
    </label><br><br>
  `;

  html += `
    <hr><strong>AI Bots:</strong><br><br>
    <label>Number of Bots:
      <select id="botCount">
        <option value="0">0</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
      </select>
    </label><br><br>
    <div id="botConfigList"></div>
  `;
} else {
  html += `<em>Host is configuring victory conditions and bots...</em><br><br>`;
}

// HOST CAN START
if (currentPlayerId === gameData.hostId) {
  html += `<br><button id="startGameBtn">Start Game</button>`;
}

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
  await advanceTurn();
} else {
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
// 🏁 GAME OVER SCREEN
if (gameData.gameState === "gameOver") {

  const winner = gameData.players[gameData.winnerId];

  inventoryList.innerHTML = `
    <h1 style="color:red;">GAME OVER</h1>
    <h2>${winner.name} wins!</h2>
  `;

  return;
}
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
    // === NEGOTIATE WITH BOT BUTTON ===
if (
  isCurrentTurn &&
  playerId === currentPlayerId &&
  !players[playerId].isBot
) {
  for (let bid in players) {
    if (players[bid].isBot) {
      html += `<button class="negotiateBotBtn" data-bot="${bid}">
        Negotiate with ${players[bid].name}
      </button><br>`;
    }
  }
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
  // === GAME LOG ===
const gameLog = gameData.gameLog || {};
const logEntries = Object.values(gameLog);
if (logEntries.length > 0) {
  html += `<div style="border-top:2px solid #555; margin-top:15px; padding-top:10px;">`;
  html += `<strong>📜 Game Log:</strong><br>`;
  const recentLogs = logEntries.slice(-10); // show last 10 entries
  recentLogs.forEach(entry => {
    html += `<div style="font-size:0.85em; color:#ccc; margin:2px 0;">
      <span style="color:#888;">R${entry.round || "?"}:</span> ${entry.message || entry.text || ""}

    </div>`;
  });
  html += `</div>`;
}

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
  function checkVictoryConditions(gameData) {
  if (!gameData || gameData.gameState !== "active") return;

  const players = gameData.players || {};
  const vc = gameData.victoryConditions || {};

  // Legacy support for old format
  if (gameData.victoryCondition && !gameData.victoryConditions) {
    const victory = gameData.victoryCondition;
    if (victory === "money10k") {
      for (let id in players) {
        if ((players[id].money || 0) >= 10000) { endGame(gameData, id); return; }
      }
    }
    if (victory === "mostAfter200") {
      if ((gameData.round || 0) >= 200) {
        let winnerId = null, highest = -1;
        for (let id in players) {
          if ((players[id].money || 0) > highest) { highest = players[id].money; winnerId = id; }
        }
        if (winnerId) endGame(gameData, winnerId);
      }
    }
    if (victory === "auto10") {
      for (let id in players) {
        if ((players[id].automobilesCashed || 0) >= 10) { endGame(gameData, id); return; }
      }
    }
    return;
  }

  // New format — any condition can trigger win
  if (vc.money) {
    for (let id in players) {
      if ((players[id].money || 0) >= vc.money) { endGame(gameData, id); return; }
    }
  }

  if (vc.rounds) {
    if ((gameData.round || 0) >= vc.rounds) {
      let winnerId = null, highest = -1;
      for (let id in players) {
        if ((players[id].money || 0) > highest) { highest = players[id].money; winnerId = id; }
      }
      if (winnerId) endGame(gameData, winnerId);
      return;
    }
  }

  if (vc.autos) {
    for (let id in players) {
      if ((players[id].automobilesCashed || 0) >= vc.autos) { endGame(gameData, id); return; }
    }
  }
}


  function endGame(gameData, winnerId) {

  const winner = gameData.players[winnerId];
  if (!winner) return;

  gamesRef.child(currentGameCode).update({
    gameState: "gameOver",
    winnerId: winnerId
  });

  alert(`GAME OVER: ${winner.name} wins!`);
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
// 🔄 Re-render ships when window resizes
window.addEventListener("resize", () => {
  if (latestGameData) {
    renderShips(latestGameData);
  }
});
  function renderReferencePanel() {

  const panel = document.getElementById("referencePanel");
  if (!panel) return;

  let html = `
    <div class="referenceColumn">
      <h3>Country Bonuses</h3>
  `;

  for (let country in countryData) {
    html += `<strong>${country}</strong><br>`;
    const multipliers = countryData[country].multipliers;
    for (let resource in multipliers) {
      html += `${resource}: ×${multipliers[resource]}<br>`;
    }
    html += `<br>`;
  }

  html += `</div>`;

  html += `
    <div class="referenceColumn">
      <h3>Resource Values</h3>
  `;

  for (let resource in baseResourceValues) {
    html += `${resource}: $${baseResourceValues[resource]}<br>`;
  }

  html += `</div>`;

  panel.innerHTML = html;
}
  renderReferencePanel();
}); // closes DOMContentLoaded
// Enter key support for negotiate chat
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.id === "negotiateChatInput") {
    e.preventDefault();
    document.getElementById("negotiateSendBtn")?.click();
  }
});
