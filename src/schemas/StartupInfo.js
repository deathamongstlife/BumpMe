const {Schema, model } = require('mongoose');

const InfoSchema = new Schema({
    AutoBumpTimer: {
        type: Number,
        required: true,
        unique: true // Ensure uniqueness of the guild ID
    },
});

module.exports = model('StartupInfo', InfoSchema);