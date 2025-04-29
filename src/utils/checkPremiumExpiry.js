const PremiumSchema = require('../schemas/PremiumGuild');
const BumpSchema = require('../schemas/Bump');
const moment = require('moment');

const checkPremiumExpiry = async (client) => {
    try {
        const now = moment().toDate();
        const expiredPremiums = await PremiumSchema.find({ expiresAt: { $lte: now } });

        for (const expired of expiredPremiums) {
            if (expired.expiresAt !== null) { // Skip lifetime premiums
                try {
                    const guildId = expired.guildID;
                    
                    const PremiumChannel = client.channels.cache.get("1301591831162912872");
                    
                    PremiumChannel.send({content: `Premium has expired for guild ID: ${guildId}.`})

                    // Remove premium status
                    await PremiumSchema.deleteOne({ guildID: guildId });

                    // Optionally, disable premium-only settings in the BumpSchema
                    await BumpSchema.findOneAndUpdate(
                        { guildID: guildId },
                        { $set: { autobump: false, hideBumps: false } } // Adjust the field names as necessary
                    );

                    console.log(`Removed expired premium status from guild ID: ${guildId}`);
                } catch (error) {
                    console.error(`Error processing expired premium for guild ${expired.guildID}:`, error);
                    // Optionally, add retry logic here
                }
            }
        }
    } catch (error) {
        console.error('Error checking for expired premiums:', error);
    }
};

module.exports = checkPremiumExpiry;