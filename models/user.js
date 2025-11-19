var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    username:{type: String, required: true}, // Username of the user
    password: {type: String, required: true}, // Hashed? password
});

module.exports = mongoose.model('User', userSchema);