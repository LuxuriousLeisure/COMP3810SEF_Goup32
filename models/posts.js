var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}, // Reference to the User model
    caption: {type: String, required: false}, // Caption for the post
    images: [{type: String, required: false}], // Array of image URLs
    tags: [{type: String, required: false}], // Array of tags
    lakeCount: {type: Number, default: 0}, // Number of likes
});

module.exports = mongoose.model('Post', userSchema);