var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 4,
        maxlength: 16,
        match: /^[a-zA-Z0-9_]+$/
    },
    password: {
        type: String,
        required: true
    },
    profileImage: {
        type: String,
        default: '/images/default-avatar.jpg'
    },
    followerCount: {
        type: Number,
        default: 0,
        min: 0
    },
    followingCount: {
        type: Number,
        default: 0,
        min: 0
    },
    postCount: {
        type: Number,
        default: 0,
        min: 0
    }
});

userSchema.index({ username: 1 });

module.exports = userSchema;
