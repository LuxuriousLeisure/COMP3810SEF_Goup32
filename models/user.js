// models/user.js  —— 完美支持 GitHub + 本地登录（旧数据完全保留！）
var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20,
        match: /^[a-zA-Z0-9_]+$/  // 保留你原来的严格正则
    },
    // 把 facebookId 换成 githubId（字段名改了，旧数据不受影响）
    githubId: { 
        type: String, 
        unique: true,
        sparse: true   // 关键！允许为 null，本地用户不报错
    },
    password: {
        type: String,
        required: function() {
            return !this.githubId;  // 只有本地用户才需要密码
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
userSchema.index({ githubId: 1 });  // 为 GitHub 登录加速

userSchema.virtual('formattedDate').get(function() {
    return this.createdAt ? this.createdAt.toLocaleDateString('zh-TW') : '';
});

module.exports = userSchema;
