const { Schema, model } = require("mongoose");

const guildInfoSchema = new Schema({
  guildID: { type: String, required: true, unique: true },
  guildName: {type: String, required: true},
  iconURL: {type: String, required: false, default: null},
  ownerID: {type: String, required: true},
  Managers: {type: [String], default: [] }
});

module.exports = model("guild-info", guildInfoSchema);