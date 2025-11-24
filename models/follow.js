// models/follow.js
var mongoose = require('mongoose');

var followSchema = mongoose.Schema({
    follower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    followee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Composite unique index
followSchema.index({ follower: 1, followee: 1 }, { unique: true });

module.exports = followSchema;


