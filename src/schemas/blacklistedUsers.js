const { Schema, model } = require('mongoose');

const blacklistedUserSchema = new Schema({
  userID: {
    type: String,
    required: true,
    unique: true // Ensure uniqueness of the user ID
  },
  reason: {
    type: String,
    required: true
  },
});

module.exports = model('BlacklistedUser', blacklistedUserSchema);
