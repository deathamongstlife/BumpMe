const { model, Schema } = require('mongoose');

const voteSchema = new Schema({
    UserID: String,
    enabled: Boolean,
    VoteExpiry: Number, // Stores the Unix timestamp of the vote expiry
});

module.exports = model('votes', voteSchema);
