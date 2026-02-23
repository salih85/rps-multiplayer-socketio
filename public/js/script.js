const socket = io();

let myRoomID = null;
let myPlayerIndex = null;
let myName = "";

const i1 = document.getElementById("i1");
const i2 = document.getElementById("i2");
const p1NameDisplay = document.getElementById("p1Name");
const p2NameDisplay = document.getElementById("p2Name");
const score1Display = document.getElementById("score1");
const score2Display = document.getElementById("score2");
const roundDisplay = document.getElementById("currentRound");
const opponentStatus = document.getElementById("opponentStatus");
const controls = document.getElementById("controls");

const attacks = {
  rock: "/image/rock.png",
  paper: "/image/paper.png",
  scissor: "/image/scissors.png"
};

function startGame() {
  myName = document.getElementById("n1").value.trim();
  if (myName === "") {
    alert("Please enter your name!");
    return;
  }

  document.getElementById("overlay").style.display = "none";
  document.getElementById("waitingOverlay").style.display = "block";

  socket.emit('join-room', myName);
}

socket.on('joined-room', ({ roomID, playerIndex }) => {
  myRoomID = roomID;
  myPlayerIndex = playerIndex;
  document.getElementById("roomDisplay").innerText = `Room ID: ${roomID}`;
});

socket.on('game-start', ({ players }) => {
  document.getElementById("waitingOverlay").style.display = "none";
  document.getElementById("gameSection").style.display = "block";

  // Set names based on which player I am
  if (myPlayerIndex === 0) {
    p1NameDisplay.innerText = players[0].name + " (You)";
    p2NameDisplay.innerText = players[1].name;
  } else {
    p1NameDisplay.innerText = players[1].name + " (You)";
    p2NameDisplay.innerText = players[0].name;
  }

  resetUI();
});

function playerChoose(choice) {
  socket.emit('make-move', { roomID: myRoomID, choice });

  // Disable controls and show my choice locally
  controls.style.visibility = "hidden";
  i1.src = attacks[choice];
  opponentStatus.innerText = "Waiting for opponent...";
}

socket.on('round-result', ({ choices, winner, scores, round }) => {
  // Show opponent's choice
  const opponentChoice = (myPlayerIndex === 0) ? choices[1] : choices[0];
  const myChoice = (myPlayerIndex === 0) ? choices[0] : choices[1];

  i1.src = attacks[myChoice];
  i2.src = attacks[opponentChoice];

  // Highlight winner
  i1.classList.remove("flash");
  i2.classList.remove("flash");

  if (winner === myPlayerIndex) {
    i1.classList.add("flash");
  } else if (winner !== -1) {
    i2.classList.add("flash");
  }

  // Update scores
  if (myPlayerIndex === 0) {
    score1Display.innerText = scores[0];
    score2Display.innerText = scores[1];
  } else {
    score1Display.innerText = scores[1];
    score2Display.innerText = scores[0];
  }

  roundDisplay.innerText = `Round: ${round}/20`;
  opponentStatus.innerText = "Get ready for next round!";

  // Re-enable controls after 2 seconds
  setTimeout(() => {
    if (round < 20) {
      resetUI();
    }
  }, 2000);
});

function resetUI() {
  controls.style.visibility = "visible";
  opponentStatus.innerText = "Pick your move!";
  i1.classList.remove("flash");
  i2.classList.remove("flash");
  i1.src = "/image/rock.png";
  i2.src = "/image/rock.png";
}

socket.on('game-over', ({ finalWinner }) => {
  document.getElementById("gameOverOverlay").style.display = "block";
  const winnerText = document.getElementById("winner");

  if (finalWinner === 'Draw') {
    winnerText.innerText = "IT'S A DRAW!";
  } else if (finalWinner === myName) {
    winnerText.innerText = "YOU WON! 🎉";
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
    });
  } else {
    winnerText.innerText = `${finalWinner} WON!`;
  }
});

socket.on('opponent-disconnected', () => {
  alert("Opponent disconnected. Game ended.");
  location.reload();
});