require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// MongoDB connection
mongoose.connect(process.env.DB_URL)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Game Schema
const gameSchema = new mongoose.Schema({
    roomID: String,
    players: [{ name: String, score: Number }],
    winner: String,
    date: { type: Date, default: Date.now }
});
const Game = mongoose.model('Game', gameSchema);

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index');
});

// Game Rooms and State
let rooms = {}; // { roomID: { players: [{id, name, choice, score}], round: 0 } }

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join-room', (name) => {
        let roomID = null;
        
        // Find a room with 1 player
        for (let id in rooms) {
            if (rooms[id].players.length === 1) {
                roomID = id;
                break;
            }
        }

        // If no room found, create a new one
        if (!roomID) {
            roomID = Math.random().toString(36).substring(7);
            rooms[roomID] = { players: [], round: 0, maxRounds: 20 };
        }

        const player = { id: socket.id, name, choice: null, score: 0 };
        rooms[roomID].players.push(player);
        socket.join(roomID);

        socket.emit('joined-room', { roomID, playerIndex: rooms[roomID].players.length - 1 });

        if (rooms[roomID].players.length === 2) {
            io.to(roomID).emit('game-start', {
                players: rooms[roomID].players.map(p => ({ name: p.name })),
                roomID
            });
        }
    });

    socket.on('make-move', ({ roomID, choice }) => {
        const room = rooms[roomID];
        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        if (player) {
            player.choice = choice;
        }

        // If both players made a move
        if (room.players.every(p => p.choice !== null)) {
            const p1 = room.players[0];
            const p2 = room.players[1];
            
            let winner = null; // 0 for p1, 1 for p2, -1 for draw
            if (p1.choice === p2.choice) {
                winner = -1;
            } else if (
                (p1.choice === 'rock' && p2.choice === 'scissor') ||
                (p1.choice === 'scissor' && p2.choice === 'paper') ||
                (p1.choice === 'paper' && p2.choice === 'rock')
            ) {
                winner = 0;
                p1.score++;
            } else {
                winner = 1;
                p2.score++;
            }

            room.round++;
            
            io.to(roomID).emit('round-result', {
                choices: [p1.choice, p2.choice],
                winner,
                scores: [p1.score, p2.score],
                round: room.round
            });

            // Reset choices for next round
            room.players.forEach(p => p.choice = null);

            // Check if game over
            if (room.round >= room.maxRounds) {
                let finalWinner = '';
                if (p1.score > p2.score) finalWinner = p1.name;
                else if (p2.score > p1.score) finalWinner = p2.name;
                else finalWinner = 'Draw';

                io.to(roomID).emit('game-over', { finalWinner });

                // Save to MongoDB
                const gameResult = new Game({
                    roomID,
                    players: room.players.map(p => ({ name: p.name, score: p.score })),
                    winner: finalWinner
                });
                gameResult.save();

                delete rooms[roomID];
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (let roomID in rooms) {
            const room = rooms[roomID];
            const index = room.players.findIndex(p => p.id === socket.id);
            if (index !== -1) {
                io.to(roomID).emit('opponent-disconnected');
                delete rooms[roomID];
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
