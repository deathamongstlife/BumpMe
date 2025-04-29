const { Schema, model } = require('mongoose');

const blacklistedGuildSchema = new Schema({
  guildID: {
    type: String,
    required: true,
    unique: true // Ensure uniqueness of the guild ID
  },
  reason: {
    type: String,
    required: true
  },
});

module.exports = model('BlacklistedGuild', blacklistedGuildSchema);
