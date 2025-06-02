const { MongoClient } = require('mongodb')
require('dotenv').config()

const client = new MongoClient(process.env.MONGO_URI)
let db

async function connectDB() {
  if (!db) {
    await client.connect()
    console.log("✅ MongoDB connected")
    db = client.db('medihear-v1')
  }
  return db
}

module.exports = connectDB