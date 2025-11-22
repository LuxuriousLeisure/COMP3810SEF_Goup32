// models/user.js  —— 完美兼容旧数据 + 支持 Google 登录
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // ===== 第三方登录字段（全部用 sparse + unique，旧数据不会报错）=====
    googleId: {
        type: String,
        unique: true,
        sparse: true                // 关键！允许为空，且多个 null 不冲突
    },
    facebookId: {                   // 你原来用的，保留
        type: String,
        unique: true,
        sparse: true
    },

    // ===== 基本信息（和你原来完全一样）=====
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    password: {                     // 保留！本地用户继续用
        type: String
        // 不要加 required，Google 用户不需要密码
    },
    profileImage: {
        type: String,
        default: '/images/default-avatar.jpg'
    },

    // ===== 统计字段（和你原来完全一样）=====
    followerCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    postCount: { type: Number, default: 0 }

}, {
    timestamps: true
});

// 索引（不会影响旧数据）
userSchema.index({ googleId: 1 });
userSchema.index({ facebookId: 1 });

module.exports = userSchema;
