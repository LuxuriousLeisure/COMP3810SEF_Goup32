var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}, // Reference to the User model
    followerId: [{type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}], // Array of follower User IDs
    followingId: [{type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}], // Array of following User IDs
});

module.exports = mongoose.model('Follow', userSchema);