var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,  // 從 4 改為 3，讓用戶名更靈活
        maxlength: 20, // 從 16 改為 20，允許更長的用戶名
        match: /^[a-zA-Z0-9_]+$/，
        facebookId: { type: String, unique: true }
    },
    password: {
        type: String,
        required: true,
        minlength: 6  // 添加最小密碼長度限制
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
    timestamps: true  // 自動添加 createdAt 和 updatedAt
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

