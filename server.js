const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Create HTTP server and integrate with Socket.IO
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "https://ragnarok-server.onrender.com",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Manage game rooms
const rooms = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle joining a room
    socket.on('join-room', ({ roomId, username }) => {
        if (!rooms.has(roomId)) {
            rooms.set(roomId, {
                players: [],
                gameState: 'waiting'
            });
        }

        const room = rooms.get(roomId);

        if (room.players.length >= 2) {
            socket.emit('room-full');
            return;
        }

        socket.join(roomId);
        room.players.push({
            id: socket.id,
            username: username
        });

        io.to(roomId).emit('player-info', {
            players: room.players
        });

        if (room.players.length === 2) {
            room.gameState = 'playing';
            io.to(roomId).emit('game-start');
        }
    });

    // Handle firing events
    socket.on('fire', (data) => {
        socket.to(data.roomId).emit('opponent-fire', data);
    });

    socket.on('fire-rocket', (data) => {
        socket.to(data.roomId).emit('opponent-fire-rocket', data);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        for (const [roomId, room] of rooms) {
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                io.to(roomId).emit('player-disconnected', socket.id);

                if (room.players.length === 0) {
                    rooms.delete(roomId);
                }
                break;
            }
        }
    });
});

// Start the server
const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
