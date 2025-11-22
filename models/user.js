// models/user.js  （已适配 Google + 本地双登录）
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // ===== 第三方登录字段 =====
    googleId: {                     // ← 新增：Google 登录用
        type: String,
        unique: true,
        sparse: true                // 允许为空（本地注册用户没有这个字段）
    },
    facebookId: {                   // 你原来可能还有 Facebook，保留也行
        type: String,
        unique: true,
        sparse: true
    },

    // ===== 基本信息 =====
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    password: {                     // 本地登录用户才有密码，第三方登录可以为 null
        type: String,
        // required: true,        // 改成非必填
    },
    profileImage: {
        type: String,
        default: '/images/default-avatar.jpg'
    },

    // ===== 统计字段 =====
    followerCount: {
        type: Number,
        default: 0
    },
    followingCount: {
        type: Number,
        default: 0
    },
    postCount: {
        type: Number,
        default: 0
    }

}, {
    timestamps: true
});

// 建立索引（提升查询速度）
userSchema.index({ googleId: 1 });
userSchema.index({ facebookId: 1 });
userSchema.index({ username: 1 });

module.exports = userSchema;
