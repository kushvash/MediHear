// const express = require('express')
// const http = require('http')
// const cors = require('cors')
// const socketIO = require('socket.io')
// require('dotenv').config()

// const app = express()
// app.use(cors())
// app.use(express.json())

// const server = http.createServer(app)
// const io = socketIO(server, {
//   cors: {
//     origin: "http://localhost:3000",
//     methods: ["GET", "POST"]
//   }
// })

// const usersRoute = require('./routes/users')
// app.use('/api/users', usersRoute)

// const connectDB = require('./db')
// connectDB().catch(err => {
//   console.error('❌ MongoDB connection failed:', err)
// })

// const onlineUsers = new Map()

// // Serve online users via REST if needed
// const onlineRoute = require('./routes/online')(onlineUsers)
// app.use('/api/online', onlineRoute)

// io.on('connection', socket => {
//   console.log('User connected:', socket.id)

//   socket.on('register', ({ uid, role }) => {
//     onlineUsers.set(socket.id, { uid, role })
//     io.emit('online-users', Array.from(onlineUsers.entries()).map(([id, data]) => ({
//       socketId: id,
//       ...data
//     })))
//   })

//   socket.on('call-patient', ({ patientSocketId, offer }) => {
//     io.to(patientSocketId).emit('incoming-call', { from: socket.id, offer })
//   })

//   socket.on('answer-call', ({ doctorSocketId, answer }) => {
//     io.to(doctorSocketId).emit('call-answered', { answer })
//   })

//   socket.on('ice-candidate', ({ targetSocketId, candidate }) => {
//     io.to(targetSocketId).emit('ice-candidate', { candidate })
//   })

//   socket.on('transcription', (text) => {
//     const otherUser = onlineUsers.get(socket.id)?.otherUser
//     if (otherUser) {
//       io.to(otherUser).emit('transcription', text)
//     }
//   })

//   socket.on('disconnect', () => {
//     onlineUsers.delete(socket.id)
//     io.emit('online-users', Array.from(onlineUsers.entries()).map(([id, data]) => ({
//       socketId: id,
//       ...data
//     })))
//   })
// })

// server.listen(5050, () => {
//   console.log('Signaling server running on port 5050')
// })



const express = require('express')
const http = require('http')
const cors = require('cors')
const socketIO = require('socket.io')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

const usersRoute = require('./routes/users')
app.use('/api/users', usersRoute)

const connectDB = require('./db')
connectDB().catch(err => {
  console.error('❌ MongoDB connection failed:', err)
})

const onlineUsers = new Map()

const onlineRoute = require('./routes/online')(onlineUsers)
app.use('/api/online', onlineRoute)

io.on('connection', socket => {
  console.log('User connected:', socket.id)

  socket.on('register', ({ uid, role, email }) => {
    onlineUsers.set(socket.id, { uid, role, email })
    io.emit('online-users', Array.from(onlineUsers.entries()).map(([id, data]) => ({
      socketId: id,
      ...data
    })))
  })

  socket.on('call-patient', ({ patientSocketId, offer }) => {
    io.to(patientSocketId).emit('incoming-call', { from: socket.id, offer })
  })

  socket.on('answer-call', ({ doctorSocketId, answer }) => {
    io.to(doctorSocketId).emit('call-answered', { answer })
  })

  socket.on('ice-candidate', ({ targetSocketId, candidate }) => {
    io.to(targetSocketId).emit('ice-candidate', { candidate })
  })

  socket.on('transcription', (text) => {
    const otherUser = [...onlineUsers.entries()].find(([_, data]) => data.otherUser === socket.id)?.[0]
    if (otherUser) {
      io.to(otherUser).emit('transcription', text)
    }
  })

  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id)
    io.emit('online-users', Array.from(onlineUsers.entries()).map(([id, data]) => ({
      socketId: id,
      ...data
    })))
  })
})

server.listen(5050, () => {
  console.log('Signaling server running on port 5050')
})