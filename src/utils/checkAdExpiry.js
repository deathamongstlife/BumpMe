const Ads = require('../schemas/Advertisements'); // Import Ads schema
const moment = require('moment');

const SEVEN_DAYS_IN_SECONDS = 604800; // 7 days in seconds

const checkAdExpiry = async (client) => {
    try {
        const nowEpoch = Math.floor(Date.now() / 1000); // Current epoch time in seconds

        // Check for expired advertisements
        const advertisements = await Ads.find(); // Find all advertisements

        for (const ad of advertisements) {
            const expiryTime = ad.adStarted + SEVEN_DAYS_IN_SECONDS; // Add 7 days (604800 seconds) to adStarted

            if (nowEpoch >= expiryTime) { // If current epoch time is greater than the expiry time
                try {
                    // Remove expired advertisement
                    await Ads.deleteOne({ _id: ad._id });
                    console.log(`Removed expired advertisement for guild ID: ${ad.name} at position ${ad.position}`);
                } catch (error) {
                    console.error(`Error removing expired advertisement for guild ${ad.name}:`, error);
                }
            }
        }

    } catch (error) {
        console.error('Error checking for expired advertisements:', error);
    }
};

module.exports = checkAdExpiry;
