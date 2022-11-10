var path = require('path');
require('dotenv').config({path: path.join(__dirname, 'process.env')});

const PORT = 8080
const MONGODB_URI = process.env.MONGODB_URI
const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET

module.exports = {
  MONGODB_URI,
  PORT,
  CLIENT_ID,
  CLIENT_SECRET
}
