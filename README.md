# BATTLE ARENA | Pro RPS Multiplayer

A modern, real-time multiplayer Rock Paper Scissors web game with a premium neon-glass UI. Built with **Node.js, Express, Socket.IO, and MongoDB**, Battle Arena offers thrilling fast-paced matches, expressive chat features, and cross-platform installation via PWA.

## 🚀 Features

- **🤖 Solo Play:** Practice your skills against a computer AI.
- **🌐 Quick Matchmaking:** Instantly find random opponents online to battle in 10-round matches.
- **🔑 Private Arenas:** Play with friends using custom secure room codes.
- **🏆 Global Leaderboard:** Win online matches to rank up! Tracks top 10 players based on match wins using MongoDB.
- **💬 Live Chat & Emotes:** Chat in real-time with your opponent and send quick emotes (🔥, 👏, 😎, 😡).
- **⏱ Fast-Paced Rounds:** 10-second timers make each action intense!
- **📱 PWA Support:** Fully installable as an app on Desktop and mobile devices, complete with a service worker.
- **🔊 SFX & Haptics:** Polished custom sound effects and vibration feedback on mobile.
- **📊 Match History:** Records and saves recent match outcomes straight to your local storage.

## 🛠 Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript, EJS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (via Mongoose)
- **Real-Time:** Socket.IO
- **Others:** Canvas Confetti, Service Workers

## ⚙️ Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas URI)

## 📦 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add the following:
   ```env
   PORT=3000
   MONGO_URI=your_mongodb_connection_string_here
   ```

4. **Run the Application:**

   To start in production mode:
   ```bash
   npm start
   ```

   To start in development mode (with nodemon):
   ```bash
   npm run dev
   ```

5. **Play:**
   Open your browser and navigate to `http://localhost:3000`

## 🕹 How to Play

1. Enter your **Battle Name** starting the game.
2. Select your game mode: **VS COMPUTER**, **QUICK PLAY**, or **JOIN PRIVATE**.
3. Choose your move (Rock, Paper, or Scissors) before the 10-second glow-timer runs out!
4. The first player to win the majority of the 10 rounds is declared the Grand Champion!

## 📄 License
This project is licensed under the ISC License.
