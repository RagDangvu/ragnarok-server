const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "https://astronomy.vn",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Lưu trữ thông tin phòng
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Xử lý tham gia phòng
  socket.on('join-room', ({ roomId, username }) => {
    // Kiểm tra phòng tồn tại
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        players: [],
        gameState: 'waiting'
      });
    }
    
    const room = rooms.get(roomId);
    
    // Kiểm tra số lượng người chơi
    if (room.players.length >= 2) {
      socket.emit('room-full');
      return;
    }
    
    // Thêm người chơi vào phòng
    socket.join(roomId);
    room.players.push({
      id: socket.id,
      username: username
    });
    
    // Gửi thông tin người chơi
    io.to(roomId).emit('player-info', {
      players: room.players
    });
    
    // Nếu đủ 2 người, bắt đầu game
    if (room.players.length === 2) {
      room.gameState = 'playing';
      io.to(roomId).emit('game-start');
    }
  });

  // Xử lý bắn
  socket.on('fire', (data) => {
    socket.to(data.roomId).emit('opponent-fire', data);
  });

  // Xử lý bắn tên lửa
  socket.on('fire-rocket', (data) => {
    socket.to(data.roomId).emit('opponent-fire-rocket', data);
  });

  // Xử lý ngắt kết nối
  socket.on('disconnect', () => {
    // Tìm và xóa người chơi khỏi phòng
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

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});