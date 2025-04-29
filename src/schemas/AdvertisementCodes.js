const {Schema, model} = require('mongoose');

const AdCodeSchema = Schema({
    code: { type: String, required: true, unique: true },
});

module.exports = model('ADCode', AdCodeSchema);