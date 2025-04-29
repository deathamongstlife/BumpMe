// reportSchema.js

const {Schema, model} = require('mongoose');

const reportSchema = Schema({
    guildID: { type: String, required: true },
    userID: { type: String, required: true },
    Reason: { type: String, required: true },
    messageID: { type: String, required: true }
});

module.exports = model('Report', reportSchema);