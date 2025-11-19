// models/Post.js
const mongoose = require('mongoose');
module.exports = mongoose.model('Post', new mongoose.Schema({
  image: { type: String, required: true },
  caption: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true }));