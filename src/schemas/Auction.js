const { Schema, model } = require('mongoose');

const auctionSchema = new Schema({
    bump: [{ userID: String, auctioned: Number }],
    vote: [{ userID: String, auctioned: Number }],
    profile: [{ userID: String, auctioned: Number }],
    infos: [{ userID: String, auctioned: Number }]
});

module.exports = model('Auction', auctionSchema);