require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const path = require('path');
const connectDB = require('./config/db');
const gameRoutes = require('./routes/gameRoutes');
const socketController = require('./controllers/socketController');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});


connectDB();
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', gameRoutes);


socketController(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
