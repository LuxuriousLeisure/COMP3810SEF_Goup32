// models/User.js
const mongoose = require('mongoose');
module.exports = mongoose.model('User', new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}));