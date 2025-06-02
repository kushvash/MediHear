const express = require('express')
const router = express.Router()
const connectDB = require('../db')

router.post('/register', async (req, res) => {
  const { uid, email, role } = req.body
  if (!uid || !email || !role) return res.status(400).send('Missing fields')

  const db = await connectDB()
  await db.collection('users').updateOne(
    { uid },
    { $set: { uid, email, role } },
    { upsert: true }
  )

  res.send({ status: 'ok' })
})

router.get('/:uid', async (req, res) => {
  const db = await connectDB()
  const user = await db.collection('users').findOne({ uid: req.params.uid })

  if (!user) return res.status(404).send('User not found')
  res.send(user)
})

module.exports = router