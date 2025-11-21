var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20,
        match: /^[a-zA-Z0-9_]+$/, // 保留原正则，后续在代码中处理昵称空格
        // 【关键修正1】删除嵌套在这里的 facebookId 字段
    },
    // 【关键修正1】将 facebookId 移到顶级字段，作为独立属性
    facebookId: { 
        type: String, 
        unique: true,
        sparse: true // 关键：添加 sparse 索引，允许 facebookId 为 null（本地登录用户无该字段）
    },
    password: {
        type: String,
        // 【关键修正2】条件必填：只有当 facebookId 不存在时，password 才必填
        required: function() {
            return !this.facebookId; 
        },
        minlength: 6
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
}, {
    timestamps: true
});

// 索引優化
userSchema.index({ username: 1 });

// 虛擬字段：格式化的創建時間（可選）
userSchema.virtual('formattedDate').get(function() {
    if (this.createdAt) {
        return this.createdAt.toLocaleDateString('zh-TW');
    }
    return '';
});

module.exports = userSchema;