const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`🔔 User ${socket.id} joined room: ${roomId}`);
  });

  socket.on("send-offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("receive-offer", offer);
  });

  socket.on("send-answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("receive-answer", answer);
  });

  socket.on("send-ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("receive-ice-candidate", candidate);
  });

  // ✅ Added: Handle transcription and broadcast to room
  socket.on("transcription-result", ({ roomId, transcript }) => {
    console.log(`📝 Transcription received: ${transcript}`);
    socket.to(roomId).emit("transcription-result", { transcript });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🚀 Socket.io server running on port ${PORT}`));