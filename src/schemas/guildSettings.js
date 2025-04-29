const { Schema, model } = require("mongoose");

const bumpSchema = new Schema({
  guildID: { type: String, required: true, unique: true },
  approved: {type: Boolean,  default: false},
  referralCode: {type: String,  default: null},
  enabled: { type: Boolean, default: false },
  hideBumps: { type: Boolean, default: false },
  channelID: { type: String, default: null },
  inviteChannelID: { type: String, default: null },
  message: { type: String, default: null },
  BumpCount: { type: Number, default: 0 },
  reminder: { type: Boolean, default: false },
  autobump: { type: Boolean, default: false },
  inviteLink: { type: String, default: null },
  cooldownEnd: { type: Number, default: 0 }, // Unix timestamp for cooldown end
  lastBumpedChannel: { type: String, default: null },
  lastBumpedUser: { type: String, default: null },
  hexColor: { type: String, default: null }, // Field for hex color (e.g., #ff0000)
  bannerURL: { type: String, default: null }, // Field for banner image URL
});

module.exports = model("guildSettings", bumpSchema);
