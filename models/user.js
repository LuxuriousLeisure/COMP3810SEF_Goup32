// models/user.js  
var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20,
        match: /^[a-zA-Z0-9_]+$/  
    },
    
    githubId: { 
        type: String, 
        unique: true,
        sparse: true   
    },
    password: {
        type: String,
        required: function() {
            return !this.githubId;  
        },
        minlength: 6
    },
    profileImage: {
        type: String,
        default: '/images/default-avatar.jpg'
    },
    followerCount: { type: Number, default: 0, min: 0 },
    followingCount: { type: Number, default: 0, min: 0 },
    postCount: { type: Number, default: 0, min: 0 }
}, {
    timestamps: true
});

userSchema.index({ username: 1 });
userSchema.index({ githubId: 1 });  

userSchema.virtual('formattedDate').get(function() {
    return this.createdAt ? this.createdAt.toLocaleDateString('zh-TW') : '';
});

module.exports = userSchema;
