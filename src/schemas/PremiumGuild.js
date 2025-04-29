const {Schema, model} = require('mongoose');

const PremiumGuildSchema = Schema({
    guildID: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true }
});

module.exports = model('PremiumGuild', PremiumGuildSchema);