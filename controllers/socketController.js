const Game = require('../models/Game');

let rooms = {}; // { roomID: { players: [{id, name, choice, score}], round: 0, maxRounds: 10, isPrivate: boolean } }

module.exports = (io) => {
    io.on('connection', async (socket) => {
        console.log('A user connected:', socket.id);

        const sendLobbyData = async () => {
            try {
                const leaderboard = await Game.aggregate([
                    { $group: { _id: "$winner", wins: { $sum: 1 } } },
                    { $match: { _id: { $ne: "Draw" } } },
                    { $sort: { wins: -1 } },
                    { $limit: 10 }
                ]);
                socket.emit('lobby-data', { leaderboard });
            } catch (err) {
                console.error('Error fetching lobby data:', err);
            }
        };

        sendLobbyData();

        socket.on('join-room', ({ name, roomID }) => {
            let targetRoomID = roomID;

            if (targetRoomID) {
                if (!rooms[targetRoomID]) {
                    rooms[targetRoomID] = { players: [], round: 0, maxRounds: 10, isPrivate: true };
                }

                if (rooms[targetRoomID].players.length >= 2) {
                    socket.emit('error-msg', 'Room is full!');
                    return;
                }
            } else {
                for (let id in rooms) {
                    if (!rooms[id].isPrivate && rooms[id].players.length === 1) {
                        targetRoomID = id;
                        break;
                    }
                }

                if (!targetRoomID) {
                    targetRoomID = Math.random().toString(36).substring(7).toUpperCase();
                    rooms[targetRoomID] = { players: [], round: 0, maxRounds: 10, isPrivate: false };
                }
            }

            const player = { id: socket.id, name, choice: null, score: 0 };
            rooms[targetRoomID].players.push(player);
            socket.join(targetRoomID);

            socket.emit('joined-room', { roomID: targetRoomID, playerIndex: rooms[targetRoomID].players.length - 1 });

            if (rooms[targetRoomID].players.length === 2) {
                io.to(targetRoomID).emit('game-start', {
                    players: rooms[targetRoomID].players.map(p => ({ name: p.name })),
                    roomID: targetRoomID
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

            if (room.players.every(p => p.choice !== null)) {
                const p1 = room.players[0];
                const p2 = room.players[1];

                let winner = null;
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

                room.players.forEach(p => p.choice = null);

                if (room.round >= room.maxRounds) {
                    let finalWinner = '';
                    if (p1.score > p2.score) finalWinner = p1.name;
                    else if (p2.score > p1.score) finalWinner = p2.name;
                    else finalWinner = 'Draw';

                    io.to(roomID).emit('game-over', { finalWinner });

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

        socket.on('send-chat', ({ roomID, message, sender }) => {
            io.to(roomID).emit('receive-chat', { message, sender, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
        });

        socket.on('send-emote', ({ roomID, emote, senderIndex }) => {
            io.to(roomID).emit('receive-emote', { emote, senderIndex });
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
};
