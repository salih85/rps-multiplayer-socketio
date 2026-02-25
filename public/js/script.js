let socket;
try {
  socket = io();
} catch (e) {
  console.error("Socket.io library (io) not found. Real-time features disabled.");
  socket = { on: () => { }, emit: () => { } }; // Dummy socket to prevent errors
}

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

let soloScores = [0, 0];
let soloRound = 0;

function startComputerGame() {
  isComputerMatch = true;
  soloScores = [0, 0];
  soloRound = 0;
  score1Display.innerText = "0";
  score2Display.innerText = "0";
  roundDisplay.innerText = "ROUND 0 / 10";
  myName = document.getElementById("n1").value.trim() || "PLAYER";
  localStorage.setItem("battleName", myName); // Save name
  document.getElementById("overlay").style.display = "none";
  document.getElementById("gameSection").style.display = "flex";
  document.getElementById("roomDisplay").querySelector("span").innerText = "MODE: VS COMPUTER";

  // Hide chat for computer matches
  const chatSidebar = document.getElementById("chatSidebar");
  const mainLayout = document.querySelector(".main-layout");
  if (chatSidebar) chatSidebar.style.display = "none";
  if (mainLayout) mainLayout.style.gridTemplateColumns = "1fr";

  p1NameDisplay.innerText = myName + " (You)";
  p2NameDisplay.innerText = "COMPUTER";
  updateAvatar("avatar1", myName);
  updateAvatar("avatar2", "COMPUTER");

  myStreak = 0;
  opponentStreak = 0;
  updateStreakUI();
  resetUI();
  startTimer();
}

function startGame(mode) {
  isComputerMatch = false;
  playSFX(sfxClick);
  myName = document.getElementById("n1").value.trim();
  if (myName === "") {
    alert("Please enter your name!");
    return;
  }
  localStorage.setItem("battleName", myName); // Save name

  // Restore chat for online matches
  const chatSidebar = document.getElementById("chatSidebar");
  const mainLayout = document.querySelector(".main-layout");
  if (chatSidebar) chatSidebar.style.display = "flex";
  if (mainLayout) mainLayout.style.gridTemplateColumns = "1fr 300px";

  // Mobile specific: reset layout might be needed if desktop grid was changed
  if (window.innerWidth <= 768) {
    if (mainLayout) mainLayout.style.display = "flex";
    if (mainLayout) mainLayout.style.flexDirection = "column";
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
  document.querySelector("#roomDisplay span").innerText = `ROOM: ${roomID.toUpperCase()}`;
});


socket.on('lobby-data', ({ leaderboard }) => {
  const leaderboardEl = document.getElementById("leaderboard");
  if (!leaderboardEl) return;

  if (leaderboard && leaderboard.length > 0) {
    leaderboardEl.innerHTML = leaderboard.map((entry, index) => `
      <div class="stat-badge-mini">
        <span class="mini-rank">#${index + 1}</span>
        <span class="mini-name">${entry._id}</span>
        <span class="mini-val">${entry.wins}W</span>
      </div>
    `).join('');
  } else {
    leaderboardEl.innerHTML = '<p class="text-muted" style="font-size:0.7rem;">Waiting for legends...</p>';
  }
});

let myStreak = 0;
let opponentStreak = 0;
let matchTimer = null;
const TIMER_DURATION = 10; // seconds

function vibrate(ms) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

function updateAvatar(elId, name) {
  const el = document.getElementById(elId);
  if (!el) return;
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  el.innerText = initial;
  // Generate a consistent color based on name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
  el.style.background = c;
}

function startTimer() {
  stopTimer();
  let timeLeft = TIMER_DURATION;
  const bar1 = document.getElementById("timer1");
  const bar2 = document.getElementById("timer2");

  matchTimer = setInterval(() => {
    timeLeft -= 0.1;
    const percent = (timeLeft / TIMER_DURATION) * 100;

    if (bar1) {
      bar1.style.display = "block";
      bar1.style.opacity = "1";
      bar1.style.transform = `scaleX(${percent / 100})`;
      bar1.style.webkitTransform = `scaleX(${percent / 100})`;
    }
    if (bar2) {
      bar2.style.display = "block";
      bar2.style.opacity = "1";
      bar2.style.transform = `scaleX(${percent / 100})`;
      bar2.style.webkitTransform = `scaleX(${percent / 100})`;
    }

    if (timeLeft <= 0) {
      stopTimer();
      const randomMoves = ["rock", "paper", "scissor"];
      const randomChoice = randomMoves[Math.floor(Math.random() * 3)];
      const currentStatus = document.getElementById("opponentStatus");
      if (currentStatus && (currentStatus.innerText === "PICK YOUR MOVE!" || currentStatus.innerText === "WAITING...")) {
        playerChoose(randomChoice);
      }
    }
  }, 100);
}

function stopTimer() {
  if (matchTimer) clearInterval(matchTimer);
  const bar1 = document.getElementById("timer1");
  const bar2 = document.getElementById("timer2");
  if (bar1) {
    bar1.style.transform = "scaleX(0)"; // Collapse on stop
    bar1.style.webkitTransform = "scaleX(0)";
  }
  if (bar2) {
    bar2.style.transform = "scaleX(0)";
    bar2.style.webkitTransform = "scaleX(0)";
  }
}

socket.on('game-start', ({ players }) => {
  document.getElementById("waitingOverlay").style.display = "none";
  document.getElementById("gameSection").style.display = "flex";

  if (myPlayerIndex === 0) {
    p1NameDisplay.innerText = players[0].name + " (You)";
    p2NameDisplay.innerText = players[1].name;
    updateAvatar("avatar1", players[0].name);
    updateAvatar("avatar2", players[1].name);
  } else {
    p1NameDisplay.innerText = players[1].name + " (You)";
    p2NameDisplay.innerText = players[0].name;
    updateAvatar("avatar1", players[1].name);
    updateAvatar("avatar2", players[0].name);
  }

  myStreak = 0;
  opponentStreak = 0;
  updateStreakUI();
  resetUI();
  startTimer();
});

function updateStreakUI() {
  const s1 = document.getElementById("streak1");
  const s2 = document.getElementById("streak2");
  if (s1) {
    s1.innerText = `STREAK: ${myStreak}`;
    if (myStreak >= 3) card1.classList.add("flaming-card");
    else card1.classList.remove("flaming-card");
  }
  if (s2) {
    s2.innerText = `STREAK: ${opponentStreak}`;
    if (opponentStreak >= 3) card2.classList.add("flaming-card");
    else card2.classList.remove("flaming-card");
  }
}

function playerChoose(choice) {
  playSFX(sfxClick);
  vibrate(50);
  stopTimer();

  if (isComputerMatch) {
    handleChoiceLocal(choice);
  } else {
    socket.emit('make-move', { roomID: myRoomID, choice });
  }

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

  opponentStatus.innerText = "CHALLENGING...";
  opponentStatus.classList.add("pulse-text");
}

function handleChoiceLocal(myChoice) {
  const moves = ["rock", "paper", "scissor"];
  const aiChoice = moves[Math.floor(Math.random() * 3)];

  setTimeout(() => {
    let winner = -1; // Draw
    if (myChoice !== aiChoice) {
      if (
        (myChoice === 'rock' && aiChoice === 'scissor') ||
        (myChoice === 'scissor' && aiChoice === 'paper') ||
        (myChoice === 'paper' && aiChoice === 'rock')
      ) {
        winner = 0; // Player Wins
      } else {
        winner = 1; // AI Wins
      }
    }

    if (winner === 0) soloScores[0]++;
    if (winner === 1) soloScores[1]++;
    soloRound++;

    handleResult({
      choices: [myChoice, aiChoice],
      winner,
      scores: [...soloScores],
      round: soloRound
    });
  }, 1000);
}

socket.on('round-result', (data) => handleResult(data));

function handleResult({ choices, winner, scores, round }) {
  playSFX(sfxRound);
  vibrate(100);
  stopTimer();

  let s1, s2;
  if (isComputerMatch) {
    p1Choice = choices[0];
    p2Choice = choices[1];
    s1 = scores[0];
    s2 = scores[1];
  } else {
    p1Choice = (myPlayerIndex === 0) ? choices[0] : choices[1];
    p2Choice = (myPlayerIndex === 0) ? choices[1] : choices[0];
    s1 = (myPlayerIndex === 0) ? scores[0] : scores[1];
    s2 = (myPlayerIndex === 0) ? scores[1] : scores[0];
  }

  i1.src = attacks[p1Choice];
  i2.src = attacks[p2Choice];
  i2.classList.add('reveal-img');
  setTimeout(() => i2.classList.remove('reveal-img'), 500);

  card1.classList.remove("active-turn");
  card2.classList.remove("active-turn");

  const myLocalIndex = isComputerMatch ? 0 : myPlayerIndex;

  if (winner === myLocalIndex) {
    card1.classList.add("active-turn");
    opponentStatus.innerText = "ROUND WON! 🎉";
    opponentStatus.style.color = "#4ade80";
    myStreak++;
    opponentStreak = 0;
  } else if (winner !== -1) {
    card2.classList.add("active-turn");
    opponentStatus.innerText = "ROUND LOST! 💀";
    opponentStatus.style.color = "#f87171";
    opponentStreak++;
    myStreak = 0;
  } else {
    opponentStatus.innerText = "IT'S A DRAW! 🤝";
    opponentStatus.style.color = "#94a3b8";
    myStreak = 0;
    opponentStreak = 0;
  }

  updateStreakUI();

  // New: Winner Score VFX
  if (winner === myLocalIndex) {
    score1Display.classList.add("winner-flash");
    setTimeout(() => score1Display.classList.remove("winner-flash"), 600);
  } else if (winner !== -1) {
    score2Display.classList.add("winner-flash");
    setTimeout(() => score2Display.classList.remove("winner-flash"), 600);
  }

  animateValue(score1Display, parseInt(score1Display.innerText) || 0, s1, 500);
  animateValue(score2Display, parseInt(score2Display.innerText) || 0, s2, 500);

  roundDisplay.innerText = `ROUND ${round} / 10`;

  setTimeout(() => {
    if (round < 10) {
      resetUI();
      startTimer();
    } else {
      let finalWinner = '';
      if (scores[0] > scores[1]) {
        finalWinner = isComputerMatch ? myName : (myPlayerIndex === 0 ? players[0].name : players[1].name);
      } else if (scores[1] > scores[0]) {
        finalWinner = isComputerMatch ? "COMPUTER" : (myPlayerIndex === 0 ? players[1].name : players[0].name);
      } else {
        finalWinner = 'Draw';
      }
      handleGameOver(finalWinner);
    }
  }, 2500);
}

function saveMatchResult(winner, s1, s2, mode) {
  let history = JSON.parse(localStorage.getItem("matchHistory") || "[]");
  const newMatch = {
    mode: mode,
    result: winner === myName ? "WIN" : (winner === "Draw" ? "DRAW" : "LOSS"),
    score: `${s1}-${s2}`,
    date: new Date().toLocaleDateString()
  };
  history.unshift(newMatch);
  history = history.slice(0, 5); // Keep last 5
  localStorage.setItem("matchHistory", JSON.stringify(history));
  renderMatchHistory();
}

function renderMatchHistory() {
  const historyEl = document.getElementById("matchHistory");
  if (!historyEl) return;
  const history = JSON.parse(localStorage.getItem("matchHistory") || "[]");

  if (history.length === 0) {
    historyEl.innerHTML = '<p class="text-muted" style="font-size:0.7rem;">No battles yet...</p>';
    return;
  }

  historyEl.innerHTML = history.map(m => `
    <div class="stat-badge-mini" style="border-left: 3px solid ${m.result === 'WIN' ? '#22c55e' : (m.result === 'LOSS' ? '#ef4444' : '#94a3b8')}">
      <span class="mini-name">${m.mode}</span>
      <span class="mini-val">${m.score}</span>
      <span class="mini-rank" style="font-size: 0.6rem;">${m.result}</span>
    </div>
  `).join('');
}

function handleGameOver(finalWinner) {
  stopTimer();
  // Save result
  saveMatchResult(finalWinner, score1Display.innerText, score2Display.innerText, isComputerMatch ? "SOLO" : "ONLINE");
  setTimeout(() => {
    document.getElementById("gameOverOverlay").style.display = "flex";
    const winnerText = document.getElementById("winner");

    if (finalWinner === 'Draw') {
      winnerText.innerText = "IT'S A DRAW!";
      playSFX(sfxRound);
    } else if (finalWinner === myName || finalWinner === "You") {
      winnerText.innerText = "GRAND CHAMPION! 🎉";
      playSFX(sfxWin);
      vibrate([200, 100, 200]);
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
}

socket.on('game-over', ({ finalWinner }) => {
  handleGameOver(finalWinner);
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
  opponentStatus.style.color = "#ffffff";
  opponentStatus.classList.remove("pulse-text");

  card1.classList.remove("active-turn");
  card2.classList.remove("active-turn");

  i1.src = "/image/rock.png";
  i2.src = "/image/rock.png";
}

socket.on('opponent-disconnected', () => {
  stopTimer();
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

if (sendChatBtn) sendChatBtn.addEventListener('click', sendChat);
if (chatInput) chatInput.addEventListener('keypress', (e) => {
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
  if (isComputerMatch) {
    // Local display for Solo mode
    const display = document.getElementById("emote1");
    display.innerText = emote;
    display.classList.remove("float-up");
    void display.offsetWidth;
    display.classList.add("float-up");
  } else {
    socket.emit('send-emote', { roomID: myRoomID, emote, senderIndex: myPlayerIndex });
  }
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

function toggleChat() {
  const chat = document.getElementById('chatSidebar');
  if (chat) chat.classList.toggle('active');
}

// Tutorial Logic
function showTutorial() {
  document.getElementById("tutorialOverlay").style.display = "flex";
}

function closeTutorial() {
  document.getElementById("tutorialOverlay").style.display = "none";
}

// Initial Name Loading & First-time Tutorial
window.addEventListener('DOMContentLoaded', () => {
  renderMatchHistory(); // Load history
  const savedName = localStorage.getItem("battleName");
  if (savedName) {
    document.getElementById("n1").value = savedName;
  }
});

// PWA Install Logic
let deferredPrompt;
const installBtn = document.getElementById('pwaInstallBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;
  // Update UI to notify the user they can add to home screen
  if (installBtn) installBtn.style.display = 'flex';
});

if (installBtn) {
  installBtn.addEventListener('click', (e) => {
    // hide our install button
    installBtn.style.display = 'none';
    // Show the prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      deferredPrompt = null;
    });
  });
}

window.addEventListener('appinstalled', (evt) => {
  console.log('App was installed');
  if (installBtn) installBtn.style.display = 'none';
});

function copyRoomCode() {
  if (!myRoomID) return;
  navigator.clipboard.writeText(myRoomID).then(() => {
    const icon = document.getElementById("copyIcon");
    const original = icon.innerText;
    icon.innerText = "✅";
    setTimeout(() => icon.innerText = original, 2000);
    vibrate(50);
  });
}

function shareResults() {
  const winner = document.getElementById("winner").innerText;
  const s1 = score1Display.innerText;
  const s2 = score2Display.innerText;
  const text = `🎮 I just played Rock-Paper-Scissors! Result: ${winner} (${s1} - ${s2}). Challenge me!`;

  if (navigator.share) {
    navigator.share({
      title: 'BATTLE ARENA',
      text: text,
      url: window.location.href
    }).catch(e => console.log('Share failed', e));
  } else {
    // Fallback: Copy to clipboard
    navigator.clipboard.writeText(`${text} ${window.location.href}`).then(() => {
      alert("Results copied to clipboard! Share it with friends.");
    });
  }
}
