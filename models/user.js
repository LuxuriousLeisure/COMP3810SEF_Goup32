// models/user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    githubId: {                     // ← 新增：GitHub 登录专用
        type: String,
        unique: true,
        sparse: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    password: {                     // 本地登录才需要密码
        type: String
        // 不加 required，GitHub 用户不需要密码
    },
    profileImage: {
        type: String,
        default: '/images/default-avatar.jpg'
    },
    followerCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    postCount: { type: Number, default: 0 }
}, { timestamps: true });

userSchema.index({ githubId: 1 });

module.exports = userSchema;
