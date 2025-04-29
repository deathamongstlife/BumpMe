const { Schema, model } = require('mongoose');

const AdLinksSchema = Schema({
    position: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    link: { type: String, required: true },
    adStarted: { type: Number, required: true } // Store epoch timestamp
});

module.exports = model('Ads', AdLinksSchema);
