const { Schema, model } = require('mongoose');

const ProfileSchema = new Schema({
    UserID: { type: String, required: true, unique: true },
    bumps: { type: Number, default: 0 },
    votes: { type: Number, default: 0 },
    referralCode: { type: String, default: null }
});

ProfileSchema.statics.findOrCreate = async function (userID) {
    let profile = await this.findOne({ UserID: userID });
    if (!profile) {
        profile = await this.create({ UserID: userID });
    }
    return profile;
};

module.exports = model('Profile', ProfileSchema);
