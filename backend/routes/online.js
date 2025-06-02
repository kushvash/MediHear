const express = require('express')
const router = express.Router()

module.exports = (onlineUsers) => {
  router.get('/patients', (req, res) => {
    const patients = Array.from(onlineUsers.entries())
      .filter(([_, user]) => user.role === 'patient')
      .map(([socketId, user]) => ({
        socketId,
        uid: user.uid,
        email: user.email
      }))

    res.json({ patients })
  })

  router.get('/doctors', (req, res) => {
    const doctors = Array.from(onlineUsers.entries())
      .filter(([_, user]) => user.role === 'doctor')
      .map(([socketId, user]) => ({
        socketId,
        uid: user.uid,
        email: user.email
      }))

    res.json({ doctors })
  })

  return router
}