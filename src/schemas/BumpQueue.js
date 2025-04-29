const mongoose = require("mongoose");

const BumpQueueSchema = new mongoose.Schema({
    guildId: String,        // Guild ID
    userId: String,         // User ID
    serverName: String,     // Server Name
    memberCount: Number,    // Member Count
    createdAt: Date,        // Server Creation Date
    bumpMessage: String,    // Bump Message Content
    invite: String,         // Invite (assuming it's a valid URL or string)
    hexColor: String,       // Hex Color (bot's display color)
    bannerURL: String,      // Server Banner URL
    processed: { type: Boolean, default: false }, // Tracks if the item has been processed
}, { timestamps: true });

module.exports = mongoose.model("BumpQueue", BumpQueueSchema);
