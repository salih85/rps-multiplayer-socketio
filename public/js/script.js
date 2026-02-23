const socket = io();

let myRoomID = null;
let myPlayerIndex = null;
let myName = "";

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

const sfxClick = document.getElementById("sfx-click");
const sfxWin = document.getElementById("sfx-win");
const sfxLose = document.getElementById("sfx-lose");
const sfxRound = document.getElementById("sfx-round");

const attacks = {
  rock: "/image/rock.png",
  paper: "/image/paper.png",
  scissor: "/image/scissors.png"
};

function playSFX(sfx) {
  if (sfx) {
    sfx.currentTime = 0;
    sfx.play().catch(e => console.log("Audio play blocked"));
  }
}

function startGame(mode) {
  playSFX(sfxClick);
  myName = document.getElementById("n1").value.trim();
  if (myName === "") {
    alert("Please enter your name!");
    return;
  }

  if (mode === 'private') {
    const roomCode = document.getElementById("roomCode").value.trim();
    if (roomCode === "") {
      alert("Please enter a room code!");
      return;
    }
    socket.emit('join-room', { name: myName, roomID: roomCode });
  } else {
    socket.emit('join-room', { name: myName });
  }

  document.getElementById("overlay").style.display = "none";
  document.getElementById("waitingOverlay").style.display = "flex";
}

socket.on('joined-room', ({ roomID, playerIndex }) => {
  myRoomID = roomID;
  myPlayerIndex = playerIndex;
  document.getElementById("roomDisplay").innerText = `ARENA: ${roomID.toUpperCase()}`;
});


socket.on('lobby-data', ({ recentGames, leaderboard }) => {
  const leaderboardEl = document.getElementById("leaderboard");
  const historyEl = document.getElementById("history");

  if (leaderboard.length > 0) {
    leaderboardEl.innerHTML = leaderboard.map((entry, index) => `
      <div class="stat-card">
        <div style="display: flex; align-items: center;">
            <span class="stat-rank">#${index + 1}</span>
            <span class="stat-name">${entry._id}</span>
        </div>
        <span class="stat-value">${entry.wins} WINS</span>
      </div>
    `).join('');
  } else {
    leaderboardEl.innerHTML = '<p class="text-muted">No legends yet...</p>';
  }


  if (recentGames.length > 0) {
    historyEl.innerHTML = recentGames.map(game => `
      <div class="stat-card">
        <span class="stat-name">${game.players[0].name} vs ${game.players[1].name}</span>
        <span class="stat-value" style="color: ${game.winner === 'Draw' ? 'var(--text-muted)' : 'var(--accent-paper)'}">
          ${game.winner === 'Draw' ? 'DRAW' : game.winner.toUpperCase() + ' WON'}
        </span>
      </div>
    `).join('');
  } else {
    historyEl.innerHTML = '<p class="text-muted">The arena is quiet...</p>';
  }
});

socket.on('game-start', ({ players }) => {
  document.getElementById("waitingOverlay").style.display = "none";
  document.getElementById("gameSection").style.display = "block";


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
  playSFX(sfxClick);
  socket.emit('make-move', { roomID: myRoomID, choice });

  controls.style.pointerEvents = "none";
  controls.style.opacity = "0.5";

  const btns = controls.querySelectorAll('.choice-btn');
  btns.forEach(btn => {
    if (btn.innerText.toLowerCase() === choice) {
      btn.classList.add('selected');
    }
  });

  i1.src = attacks[choice];
  i1.classList.add("shake-img");
  setTimeout(() => i1.classList.remove("shake-img"), 400);

  opponentStatus.innerText = "WAITING FOR OPPONENT...";
  opponentStatus.classList.add("pulse-text");
}

socket.on('round-result', ({ choices, winner, scores, round }) => {
  playSFX(sfxRound);

 
  const opponentChoice = (myPlayerIndex === 0) ? choices[1] : choices[0];
  const myChoice = (myPlayerIndex === 0) ? choices[0] : choices[1];

  i1.src = attacks[myChoice];
  i2.src = attacks[opponentChoice];
  i2.classList.add('reveal-img');
  setTimeout(() => i2.classList.remove('reveal-img'), 500);

  card1.classList.remove("active-turn");
  card2.classList.remove("active-turn");

  if (winner === myPlayerIndex) {
    card1.classList.add("active-turn");
    opponentStatus.innerText = "ROUND WON! 🎉";
    opponentStatus.style.color = "var(--accent-paper)";
  } else if (winner !== -1) {
    card2.classList.add("active-turn");
    opponentStatus.innerText = "ROUND LOST! 💀";
    opponentStatus.style.color = "var(--accent-rock)";
  } else {
    opponentStatus.innerText = "IT'S A DRAW! 🤝";
    opponentStatus.style.color = "var(--text-muted)";
  }

  animateValue(score1Display, parseInt(score1Display.innerText), (myPlayerIndex === 0) ? scores[0] : scores[1], 500);
  animateValue(score2Display, parseInt(score2Display.innerText), (myPlayerIndex === 0) ? scores[1] : scores[0], 500);

  roundDisplay.innerText = `ROUND ${round} / 20`;


  setTimeout(() => {
    if (round < 20) {
      resetUI();
    }
  }, 2500);
});

function animateValue(obj, start, end, duration) {
  if (start === end) return;
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
  controls.style.pointerEvents = "all";
  controls.style.opacity = "1";
  const btns = controls.querySelectorAll('.choice-btn');
  btns.forEach(btn => btn.classList.remove('selected'));

  opponentStatus.innerText = "PICK YOUR MOVE!";
  opponentStatus.style.color = "var(--text-main)";
  opponentStatus.classList.remove("pulse-text");

  card1.classList.remove("active-turn");
  card2.classList.remove("active-turn");

  i1.src = "/image/rock.png";
  i2.src = "/image/rock.png";
}

socket.on('game-over', ({ finalWinner }) => {
  setTimeout(() => {
    document.getElementById("gameOverOverlay").style.display = "flex";
    const winnerText = document.getElementById("winner");

    if (finalWinner === 'Draw') {
      winnerText.innerText = "IT'S A DRAW!";
      playSFX(sfxRound);
    } else if (finalWinner === myName) {
      winnerText.innerText = "GRAND CHAMPION! 🎉";
      playSFX(sfxWin);
      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.6 },
        colors: ['#f0ad4e', '#ffffff', '#5bc0de']
      });
    } else {
      winnerText.innerText = "YOU WERE DEFEATED";
      playSFX(sfxLose);
    }
  }, 1500);
});

socket.on('opponent-disconnected', () => {
  opponentStatus.innerText = "OPPONENT FLED THE BATTLE.";
  setTimeout(() => {
    alert("Opponent disconnected. Returning to lobby.");
    location.reload();
  }, 3000);
});



const chatInput = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChatBtn");
const chatMessages = document.getElementById("chatMessages");

function sendChat() {
  const message = chatInput.value.trim();
  if (!message) return;

  socket.emit('send-chat', { roomID: myRoomID, message, sender: myName });
  chatInput.value = "";
  playSFX(sfxClick);
}

sendChatBtn.addEventListener('click', sendChat);
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendChat();
});

socket.on('receive-chat', ({ message, sender, time }) => {
  const isMe = sender === myName;
  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${isMe ? 'me' : ''}`;
  messageDiv.innerHTML = `
    <span class="message-sender">${sender} <span class="message-time">${time}</span></span>
    <div class="message-text">${message}</div>
  `;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

function sendEmote(emote) {
  socket.emit('send-emote', { roomID: myRoomID, emote, senderIndex: myPlayerIndex });
  playSFX(sfxClick);
}

socket.on('receive-emote', ({ emote, senderIndex }) => {
  const targetId = (senderIndex === myPlayerIndex) ? "emote1" : "emote2";
  const display = document.getElementById(targetId);

  display.innerText = emote;
  display.classList.remove("float-up");
  void display.offsetWidth;
  display.classList.add("float-up");
});
