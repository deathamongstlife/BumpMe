const {model, Schema}= require('mongoose');

const RateSchema = Schema({
    guildID: {
        type: String,
        required: true,
        unique: true
    },
    ratings: {
        type: [String],
        default: []
    },
    users: {
        type: [String],
        default: []
    }
});

module.exports = model('Rate', RateSchema);