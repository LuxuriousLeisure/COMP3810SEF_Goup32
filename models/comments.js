var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    postId: {type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true}, // Reference to the Post model
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}, // Reference to the User model
    content: {type: String, required: true}, // Content of the comment
});

module.exports = mongoose.model('Comment', userSchema);