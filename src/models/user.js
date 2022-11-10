const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator')

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, maxLength: 100, unique: true },
  refresh_token: { type: String, required: true, maxLength: 500 },
  access_token: { type: String, required: true, maxLength: 500 },
  music_service: { type: String, required: true, maxLength: 100 },
  // last_online_time: { type: String, required: true, maxLength: 100 },
})

userSchema.plugin(uniqueValidator)

module.exports = mongoose.model('User', userSchema);