// server.js
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
  transports: ["websocket"], // ✅ Force WebSocket transport
});


io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  socket.on("join-patient", (email) => {
    socket.join(email);
    console.log(`🔔 Patient joined: ${email} (Socket: ${socket.id})`);
  });

  socket.on("call-patient", ({ roomId, patientEmail }) => {
    console.log(`📞 Calling patient: ${patientEmail}`);
    io.to(patientEmail).emit("incoming-call", { roomId });
  });

  socket.on("call-accepted", ({ roomId }) => {
    console.log(`✅ Call accepted for room: ${roomId}`);
    io.to(roomId).emit("call-accepted");
  });

  socket.on("call-rejected", ({ roomId }) => {
    console.log(`❌ Call rejected for room: ${roomId}`);
    io.to(roomId).emit("call-rejected");
  });

  socket.on("join-room", (roomId) => {
    if (!socket.rooms.has(roomId)) {
      socket.join(roomId);
      console.log(`🔔 ${socket.id} joined room: ${roomId}`);
    }
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

  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });

  // Forward transcription to the doctor
  socket.on("transcription-result", ({ roomId, transcript }) => {
    console.log(`📝 Transcription received: ${transcript}`);
    io.to(roomId).emit("transcription-result", { transcript });
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🚀 Socket.io server running on port ${PORT}`));