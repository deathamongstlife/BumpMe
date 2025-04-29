const {Schema, model} = require('mongoose');

const PremiumCodeSchema = Schema({
    code: { type: String, required: true, unique: true },
    duration: { type: String, required: true }, // '1 month', '1 year', 'lifetime'
    expiresAt: { type: Date, required: false }
});

module.exports = model('PremiumCode', PremiumCodeSchema);