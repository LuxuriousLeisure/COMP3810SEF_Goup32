var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    username:{type: String, required: true}, // Username of the user
    password: {type: String, required: true}, // Hashed? password
    profileImage: {type: String, required: false}, // URL of the profile image
});

module.exports = mongoose.model('User', userSchema);