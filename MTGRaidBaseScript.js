let monsterHealth = 0;
let playerHealth = {};
let playerNames = {};
let currentRound = 1;
let totalDiceRolls = 0;
let numberOfDiceRolled = 0;
let lifeMultiplier;
let easyActionsJson;
let mediumActionsJson;
let hardActionsJson;
let startedGame = false;
let gameCanStart = false;
let log = [];
let bossMonsterImageUrl = "";
let modifiersToUse;
let listRolledFrom;
let totalRoundLifeChange = 0;

// // Difficulty modifiers for easy mode 
const EASY_MODE_MODIFIERS = {
  modifier1: 10,
  modifier2: 1,
  modifier3: 0.8, //Must be between 0-1
}
// Difficulty modifiers for medium mode 
const MEDIUM_MODE_MODIFIERS = {
  modifier1: 5,
  modifier2: 2,
  modifier3: 0.6, //Must be between 0-1

}
// Difficulty modifiers for hard mode 
const HARD_MODE_MODIFIERS = {
  modifier1: 0,
  modifier2: 10,
  modifier3: 0, //Must be between 0-1
}

function takeMonsterAction() {
  if (!startedGame) {
    showErrorMessage("Please Start the Game First");
    return;
  }
  if (currentRound == 1) {
    showErrorMessage("Monster cannot take actions on Round 1");
    return;
  }
  const drValue = Math.floor(currentRound / 2); // Calculate DR value
  if (numberOfDiceRolled == drValue) {
    showErrorMessage("Monster cannot take further actions, increase round");
    return;
  }
  const randomValue = Math.random(); // Random value between 0 and 1
  const diceElement = document.getElementById("dice");
  let baseProbability;
  let additionalProbability;
  let easyProbability;
  if (modifiersToUse == EASY_MODE_MODIFIERS) {
    console.log("easy mode selected");
    baseProbability = 1 / (1 + Math.exp(-modifiersToUse.modifier1 / (currentRound * 1.5)))
    additionalProbability = (1 * (1 / (1 + (Math.exp(-modifiersToUse.modifier2))))) * modifiersToUse.modifier3
    easyProbability = baseProbability
  } else {
    baseProbability = 1 / (1 + Math.exp(-modifiersToUse.modifier1 / (currentRound * 1.5)))
    additionalProbability = ((1 - baseProbability) * (1 / (1 + (Math.exp(-modifiersToUse.modifier2))))) * modifiersToUse.modifier3
    easyProbability = additionalProbability
  }

  // Randomly selects the Easy, Medium or Hard Action list based on previous formulas and modifiers
  let randomlyRolledList;
  if (randomValue < easyProbability) {
    randomlyRolledList = easyActionsJson;
    listRolledFrom = "E";
  } else if (randomValue < (baseProbability + additionalProbability)) {
    randomlyRolledList = mediumActionsJson;
    listRolledFrom = "M";
  } else {
    randomlyRolledList = hardActionsJson;
    listRolledFrom = "H";
  }
  const result = Math.floor(Math.random() * randomlyRolledList.Actions.length); // Generate a random number on the rolled List

  console.log(randomValue);
  console.log(modifiersToUse);
  console.log("baseProbability: " + baseProbability);
  console.log("additionalProbability: " + additionalProbability);
  console.log('easyProbability: ' + easyProbability);

  ++totalDiceRolls;
  ++numberOfDiceRolled;
  const actionElement = document.getElementById("action");
  const diceRolledThisRound = Math.floor(currentRound / 2); // Calculate Dice rolled this round value;
  actionElement.innerText = randomlyRolledList.Actions[result].replaceAll("${diceRolledThisRound}", diceRolledThisRound)
    .replaceAll("${currentRound}", currentRound)
    .replaceAll("${diceRolledThisRound+1}", diceRolledThisRound + 1)
    .replaceAll("${diceRolledThisRound+2}", diceRolledThisRound + 2)
    .replaceAll("${currentRound+1}", currentRound + 1);

  //TODO: SMH Just do it based on the index used...no need to string compare
  if (randomlyRolledList.Actions[result].includes("Monster creates")) {
    //make minions
    //TODO: SMH Just do it based on the index used...no need to string compare     
    let howManyToMake = randomlyRolledList.Actions[result].includes("Monster creates 1") ? 1 : randomlyRolledList.Actions[result].includes("Monster creates 2") ? 2 : randomlyRolledList.Actions[result].includes("Monster creates 3") ? 3 : 4;
    // Set the image source
    if(howManyToMake == 1 && (randomlyRolledList == easyActionsJson || randomlyRolledList == mediumActionsJson)){
      addMinions(howManyToMake, 1);
    }
    else if(howManyToMake == 2 && randomlyRolledList == hardActionsJson){
      addMinions(howManyToMake, 1);
    }
    else if((howManyToMake == 2 && randomlyRolledList == easyActionsJson) || (howManyToMake == 3 && randomlyRolledList == mediumActionsJson) || (howManyToMake == 4 && randomlyRolledList == hardActionsJson)){
      addMinions(howManyToMake, 2);
    }
  }

  const logEntry = document.createElement("div");
  logEntry.className = "logEntry";
  logEntry.textContent = `${totalDiceRolls}. Action result: [${listRolledFrom}] ${actionElement.innerText}`;

  // Get the dice log container
  const diceLog = document.getElementById("diceLog");

  // Append the new log entry to the top of the log
  diceLog.insertAdjacentElement("beforeend", logEntry);
  diceLog.scrollTop = diceLog.scrollHeight;
  diceLog.style.display = "block";
  if (randomlyRolledList.Actions[result].includes("one more action")) {
    numberOfDiceRolled--;
    return;
  }
  updateRound();

}

function strikeOutMonsterAction() {
  if (!gameCanStart) {
    showErrorMessage("Please Start the Game First");
    return;
  }
  const diceLog = document.getElementById("diceLog");
  const logEntries = diceLog.getElementsByClassName("logEntry");

  // Check if there are log entries
  if (logEntries.length > 0) {
    // Strike out the most recent log entry
    const mostRecentLog = logEntries[logEntries.length - 1];
    if (!mostRecentLog.innerText.includes("ROUND") && !mostRecentLog.innerText.includes("HP")) {
      mostRecentLog.style.textDecoration = "line-through";
    }
  }
}

function readActionJsonFiles() {
  const filePath = 'Actions/EasyActions.json';
  const filePathM = 'Actions/MediumActions.json';
  const filePathH = 'Actions/HardActions.json';
  const options = {
    method: 'GET',
    mode: 'no-cors'
  };

  // Fetch the JSON file
  fetch(filePath, options)
    .then(
      response => response.json())
    .then(jsonData => {
      console.log('JSON data:', jsonData);
      easyActionsJson = jsonData;
    })
    .catch(error => console.error('Error fetching JSON:', error));

  fetch(filePathM, options)
    .then(response => response.json())
    .then(jsonData => {
      console.log('JSON data:', jsonData);
      mediumActionsJson = jsonData;
    })
    .catch(error => console.error('Error fetching JSON:', error));

  fetch(filePathH, options)
    .then(response => response.json())
    .then(jsonData => {
      console.log('JSON data:', jsonData);
      hardActionsJson = jsonData;
    })
    .catch(error => console.error('Error fetching JSON:', error));
}

function updateMonsterHealth() {
  const monsterHealthElement = document.getElementById("number");
  monsterHealthElement.innerText = `Monster Health: ${monsterHealth}`;
  if (startedGame) {
    const logEntry = document.createElement("div");
    logEntry.className = "logEntry";
    logEntry.textContent = `TOTAL MONSTER HP CHANGED THIS ROUND: ${totalRoundLifeChange > 0 ? '+' : ''}${totalRoundLifeChange} TO ${monsterHealth}`;

    // Get the dice log container
    const diceLog = document.getElementById("diceLog");

    // Append the new log entry to the top of the log
    diceLog.insertAdjacentElement("beforeend", logEntry);
    diceLog.scrollTop = diceLog.scrollHeight;
    diceLog.style.display = "block";
  }
}

function increaseNumber() {
  monsterHealth++;
  totalRoundLifeChange++;
  updateMonsterHealth();
}

function decreaseNumber() {
  monsterHealth = Math.max(0, monsterHealth - 1);
  totalRoundLifeChange = totalRoundLifeChange - 1;
  updateMonsterHealth();
}

function refreshPage() {
  // Refresh the webpage
  location.reload();
}

function increaseNumberBy10() {
  monsterHealth = monsterHealth + 10;
  totalRoundLifeChange = totalRoundLifeChange + 10;
  updateMonsterHealth();
}

function decreaseNumberBy10() {
  monsterHealth = Math.max(0, monsterHealth - 10);
  totalRoundLifeChange = totalRoundLifeChange - 10;
  updateMonsterHealth();
}

function increaseNumberBy5() {
  monsterHealth = monsterHealth + 5;
  totalRoundLifeChange = totalRoundLifeChange + 5;
  updateMonsterHealth();
}

function decreaseNumberBy5() {
  monsterHealth = Math.max(0, monsterHealth - 5);
  totalRoundLifeChange = totalRoundLifeChange - 5;
  updateMonsterHealth();
}

function updateRound() {
  const roundElement = document.getElementById("round");
  const round2Element = document.getElementById("rounds");
  roundElement.innerText = `Round: ${currentRound}`;
  const drValue = Math.floor(currentRound / 2); // Calculate DR value
  round2Element.innerText = `Rolls this turn:  ${numberOfDiceRolled} / ${drValue}`;
  totalRoundLifeChange = 0;
}

function increaseRound() {
  if (!startedGame) {
    showErrorMessage("Please Start the Game First");
    return;
  }
  currentRound++;
  numberOfDiceRolled = 0;
  // Create a new log entry
  const logEntry = document.createElement("div");
  logEntry.className = "logEntry";
  logEntry.textContent = `ROUND ${currentRound}`;

  // Get the dice log container
  const diceLog = document.getElementById("diceLog");

  // Append the new log entry to the top of the log
  diceLog.insertAdjacentElement("beforeend", logEntry);
  diceLog.scrollTop = diceLog.scrollHeight;
  diceLog.style.display = "block";
  updateRound();
}

function decreaseRound() {
  if (!startedGame) {
    showErrorMessage("Please Start the Game First");
    return;
  }
  currentRound = Math.max(1, currentRound - 1);
  const logEntry = document.createElement("div");
  logEntry.className = "logEntry";
  logEntry.textContent = `ROUND ${currentRound}`;

  // Get the dice log container
  const diceLog = document.getElementById("diceLog");

  // Append the new log entry to the top of the log
  diceLog.insertAdjacentElement("beforeend", logEntry);
  diceLog.scrollTop = diceLog.scrollHeight;
  diceLog.style.display = "block";
  updateRound();
}

function checkInput() {
  var numberInput = document.getElementById("myTextbox").value;

  // Check if the input is a number
  if (!isNaN(numberInput) && numberInput !== "") {
    gameCanStart = true;
  } else {
    gameCanStart = false;
  }
}

function pickMonster() {
  // Generate a random number between 1 and 100 (inclusive)
  const randomNumber = Math.floor(Math.random() * 100) + 1;

  // Define probability ranges
  const colorRange = [
    { range: [1, 5], probability: 20 },   // 1-5: 20% probability
    { range: [6, 15], probability: 30 },  // 6-15: 30% probability
    { range: [16, 25], probability: 40 }, // 16-25: 40% probability
    { range: [26, 30], probability: 7 },  // 26-27: 7% probability
    { range: [31, 32], probability: 3 }  // 26-27: 3% probability
  ];

  // Calculate the selected range based on probabilities
  let selectedRange;
  let cumulativeProbability = 0;

  for (const { range, probability } of colorRange) {
    cumulativeProbability += probability;
    if (randomNumber <= cumulativeProbability) {
      selectedRange = range;
      break;
    }
  }

  // Pick a random number within the selected range
  const pickedNumber = Math.floor(Math.random() * (selectedRange[1] - selectedRange[0] + 1)) + selectedRange[0];

  const startElement = document.getElementById("startEasy");
  // startElement.innerText = `${pickedNumber}`;
  // startElement.style.display = "none";
  var imgElement = document.createElement("img");

  // Set the image source
  imgElement.src = `BossMonsters/${pickedNumber}.jpeg`;
  bossMonsterImageUrl = imgElement.src;
  // Set styling for the image
  imgElement.style.width = "1100px";
  imgElement.style.height = "550px";
  imgElement.style.margin = "20px";

  // Replace the div with the image
  startElement.replaceWith(imgElement);
  return pickedNumber;
}

function addMinions(numberOfImages, imageNumber) {
  if (!startedGame) {
    showErrorMessage("Please Start the Game First");
    return;
  }
  const container = document.getElementById('imageContainer');

  for (let i = 0; i < numberOfImages; i++) {
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';

    const img = document.createElement('img');
    img.src = `Minions/${imageNumber}.jpeg`;
    img.alt = 'Image ' + (i + 1); // Alt text for accessibility

    img.style.width = '300px';
    img.style.height = '170px';

    const imageText = document.createElement('div');
    imageText.className = 'image-text';
    imageText.textContent = numberOfImages == 1 ? `${currentRound + 1}/${currentRound + 1}` : `${Math.floor(currentRound / 2)}/${Math.floor(currentRound / 2)}`;
    imageText.contentEditable = true;

    img.addEventListener('click', function () {
      removeImage(imageContainer);
    });

    imageContainer.appendChild(img);
    imageContainer.appendChild(imageText);
    container.appendChild(imageContainer);
  }
}

function removeImage(img) {
  const container = img.parentNode;
  container.removeChild(img);
}

function setDifficultyAtStart(difficulty) {
  switch (difficulty) {
    case 'easy':
      modifiersToUse = EASY_MODE_MODIFIERS;
      lifeMultiplier = 20;
      break;
    case 'medium':
      modifiersToUse = MEDIUM_MODE_MODIFIERS;
      lifeMultiplier = 25;
      break;
    case 'hard':
      modifiersToUse = HARD_MODE_MODIFIERS;
      lifeMultiplier = 30;
      break;
  }
}

function showErrorMessage(message) {
  // Create a new error message element
  const errorMessageElement = document.createElement("div");
  errorMessageElement.className = "errorMessage";
  errorMessageElement.textContent = message;

  // Append the error message element to the body
  document.body.appendChild(errorMessageElement);

  // Display the error message
  errorMessageElement.style.display = "block";

  // Hide the error message after 5 seconds
  setTimeout(function () {
    errorMessageElement.style.display = "none";
    // Remove the error message element from the DOM after fading out
    errorMessageElement.remove();
  }, 5000);
}

function displayColorRectangleAndStartGame(difficulty) {
  if (!gameCanStart) {
    showErrorMessage("Enter Number of Players to Start");
    return;
  }

  setDifficultyAtStart(difficulty);

  startedGame = true;
  var startEasy = document.getElementById("startEasy");
  var startMedium = document.getElementById("startMedium");
  var startHard = document.getElementById("startHard");
  var textBox = document.getElementById("myTextbox");
  var playerLabel = document.getElementById("playerLabel");
  textBox.style.display = "none";
  playerLabel.style.display = "none";
  startEasy.style.display = "none";
  startMedium.style.display = "none";
  startHard.style.display = "none";

  // Get the number of players
  var value = textBox.value;

  monsterHealth = value * lifeMultiplier;
  updateMonsterHealth();
  createPlayerHealthBoxes(value);

  const colorRectangle = document.getElementById('colorRectangle');
  const pickedNumber = pickMonster();

  // Color mapping based on the chosen number
  const colorMap = {
    1: 'White',
    2: 'Blue',
    3: 'Black',
    4: 'Red',
    5: 'Green',
    6: 'White-Blue',
    7: 'Blue-Black',
    8: 'Black-Red',
    9: 'Red-Green',
    10: 'White-Green',
    11: 'White-Black',
    12: 'Blue-Red',
    13: 'Black-Green',
    14: 'Red-White',
    15: 'Blue-Green',
    16: 'White-Blue-Black',
    17: 'Blue-Black-Red',
    18: 'Black-Red-Green',
    19: 'Red-Green-White',
    20: 'White-Green-Blue',
    21: 'White-Black-Green',
    22: 'Blue-Red-White',
    23: 'Black-Green-Blue',
    24: 'Red-White-Black',
    25: 'Green-Blue-Red',
    26: 'Blue-Black-Red-Green',
    27: 'White-Black-Red-Green',
    28: 'White-Blue-Red-Green',
    29: 'White-Blue-Black-Green',
    30: 'White-Blue-Black-Red',
    31: 'White-Blue-Black-Green-Red',
    32: 'Grey'
  };

  // Set the background color of the rectangle based on the chosen number
  const colorName = colorMap[pickedNumber];

  if (colorName.includes('-')) {
    const colors = colorName.split('-');
    const widthPercentage = 100 / colors.length;
    const gradientColors = colors.map((color, index) => `${color.toLowerCase()} ${widthPercentage * index}% ${widthPercentage * (index + 1)}%`);
    colorRectangle.style.background = `linear-gradient(to right, ${gradientColors.join(', ')})`;
  } else {
    // Handle single-color scenarios
    colorRectangle.style.background = colorName.toLowerCase();
  }
  colorRectangle.style.display = "block";

  readActionJsonFiles();
  const logEntry = document.createElement("div");
  logEntry.className = "logEntry";
  logEntry.textContent = `ROUND ${currentRound}`;

  // Get the dice log container
  const diceLog = document.getElementById("diceLog");

  // Append the new log entry to the top of the log
  diceLog.insertAdjacentElement("beforeend", logEntry);
  diceLog.scrollTop = diceLog.scrollHeight;
  diceLog.style.display = "block";
  console.log(easyActionsJson);

}

function increasePlayerHealth(player) {
  playerHealth[player]++;
  updatePlayerHealth(player);
}

function decreasePlayerHealth(player) {
  playerHealth[player] = Math.max(0, playerHealth[player] - 1);
  updatePlayerHealth(player);
}

function updatePlayerHealth(player) {
  const playerHealthElement = document.getElementById(`player${player}Health`);
  playerHealthElement.innerHTML = `<div class="controls2">
                                  <div class="button-wrapper">
                                    <button onclick="increasePlayerHealth(${player})">+</button>
                                    <button onclick="decreasePlayerHealth(${player})">-</button>
                                  </div>
                                  <div class="display-box">Player ${player} Health: ${playerHealth[player]}</div>
                                </div>`;
}

function createPlayerHealthBoxes(numberOfPlayers) {
  const playerHealthContainer = document.getElementById("playerHealthContainer");

  // Clear existing player health boxes
  playerHealthContainer.innerHTML = "";

  // Dynamically create player health boxes
  for (let i = 1; i <= numberOfPlayers; i++) {
    const playerHealthBox = document.createElement("div");
    playerHealthBox.className = "player-health-box";
    playerHealthBox.id = `player${i}Health`;

    playerHealthBox.innerHTML = `<div class="controls2">
                                  <div class="button-wrapper">
                                    <button onclick="increasePlayerHealth(${i})">+</button>
                                    <button onclick="decreasePlayerHealth(${i})">-</button>
                                  </div>
                                  <div class="display-box">Player ${i} Health: 40</div>
                                </div>
                                `;

    playerHealthContainer.appendChild(playerHealthBox);

    // Initialize player health object
    playerHealth[i] = 40;
  }
}