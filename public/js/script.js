const socket = io();

let myRoomID = null;
let myPlayerIndex = null;
let myName = "";

// UI Elements
const i1 = document.getElementById("i1");
const i2 = document.getElementById("i2");
const card1 = document.getElementById("card1");
const card2 = document.getElementById("card2");
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
  document.getElementById("waitingOverlay").style.display = "flex";

  socket.emit('join-room', myName);
}

socket.on('joined-room', ({ roomID, playerIndex }) => {
  myRoomID = roomID;
  myPlayerIndex = playerIndex;
  document.getElementById("roomDisplay").innerText = `ROOM: ${roomID.toUpperCase()}`;
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

  // Visual feedback for move selection
  controls.classList.add("fadeOut");
  setTimeout(() => controls.style.visibility = "hidden", 300);

  i1.src = attacks[choice];
  i1.classList.add("shake");
  setTimeout(() => i1.classList.remove("shake"), 500);

  opponentStatus.innerText = "WAITING FOR OPPONENT...";
  opponentStatus.classList.add("pulse-text");
}

socket.on('round-result', ({ choices, winner, scores, round }) => {
  // Show opponent's choice
  const opponentChoice = (myPlayerIndex === 0) ? choices[1] : choices[0];
  const myChoice = (myPlayerIndex === 0) ? choices[0] : choices[1];

  i1.src = attacks[myChoice];
  i2.src = attacks[opponentChoice];

  // Highlight winner with premium animations
  i1.classList.remove("flash", "shake");
  i2.classList.remove("flash", "shake");
  card1.classList.remove("active");
  card2.classList.remove("active");

  if (winner === myPlayerIndex) {
    i1.classList.add("flash");
    card1.classList.add("active");
    opponentStatus.innerText = "ROUND WON! 🎉";
  } else if (winner !== -1) {
    i2.classList.add("flash");
    card2.classList.add("active");
    opponentStatus.innerText = "ROUND LOST! 💀";
  } else {
    opponentStatus.innerText = "IT'S A DRAW! 🤝";
  }

  // Update scores with animation
  animateValue(score1Display, parseInt(score1Display.innerText), (myPlayerIndex === 0) ? scores[0] : scores[1], 500);
  animateValue(score2Display, parseInt(score2Display.innerText), (myPlayerIndex === 0) ? scores[1] : scores[0], 500);

  roundDisplay.innerText = `ROUND: ${round}/20`;

  // Re-enable controls after 2.5 seconds
  setTimeout(() => {
    if (round < 20) {
      resetUI();
    }
  }, 2500);
});

function animateValue(obj, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

function resetUI() {
  controls.style.visibility = "visible";
  controls.classList.remove("fadeOut");
  opponentStatus.innerText = "PICK YOUR MOVE!";
  opponentStatus.classList.remove("pulse-text");
  i1.classList.remove("flash");
  i2.classList.remove("flash");
  card1.classList.remove("active");
  card2.classList.remove("active");
  i1.src = "/image/rock.png";
  i2.src = "/image/rock.png";
}

socket.on('game-over', ({ finalWinner }) => {
  setTimeout(() => {
    document.getElementById("gameOverOverlay").style.display = "flex";
    const winnerText = document.getElementById("winner");

    if (finalWinner === 'Draw') {
      winnerText.innerText = "IT'S A DRAW!";
    } else if (finalWinner === myName) {
      winnerText.innerText = "GRAND CHAMPION! 🎉";
      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.6 },
        colors: ['#f0ad4e', '#ffffff', '#5bc0de']
      });
    } else {
      winnerText.innerHTML = `<span style="font-size: 0.5em; display: block;">THE WINNER IS</span> ${finalWinner.toUpperCase()}`;
    }
  }, 1000);
});

socket.on('opponent-disconnected', () => {
  opponentStatus.innerText = "OPPONENT LEFT THE BATTLE.";
  setTimeout(() => {
    alert("Opponent disconnected. Returning to lobby.");
    location.reload();
  }, 3000);
});
