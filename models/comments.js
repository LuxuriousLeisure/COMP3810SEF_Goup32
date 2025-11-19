var mongoose = require('mongoose');

var commentSchema = mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 500
    }
});

commentSchema.index({ postId: 1 });

module.exports = mongoose.model('Comment', commentSchema);
