/**
 * Entry point for the node.js application
 */

const app = require('./app')
const http = require('http')
const config = require('../config')
// const logger = require('./utils/logger')

const server = http.createServer(app)

server.listen(config.PORT, () => {
  console.log(`Server running on port 8080`)
})
