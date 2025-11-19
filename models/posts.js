var mongoose = require('mongoose');

var postSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 2000
    },
    images: {
        type: [String],
        required: true,
        validate: {
            validator: function(v) {
                return v && v.length > 0 && v.length <= 10;
            },
            message: 'Posts must contain 1-10 images'
        }
    },
    tags: {
        type: [String],
        default: []
    },
    likeCount: {
        type: Number,
        default: 0,
        min: 0
    }
});

postSchema.index({ userId: 1 });
postSchema.index({ tags: 1 });

module.exports = mongoose.model('Post', postSchema);
