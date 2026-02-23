const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    roomID: String,
    players: [{ name: String, score: Number }],
    winner: String,
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Game', gameSchema);
