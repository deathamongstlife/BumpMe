const { Client, Message } = require('discord.js');
const moment = require('moment'); // Import moment.js
const PremiumSubscriptions = require('../../schemas/PremiumGuild'); // Your premium schema

module.exports = 
/**
 * 
 * @param {Client} client 
 * @param {Message} message 
 *
 */
async (client, message) => {
    const Staff = [
        "1130886272550981662",
        "1302806745294307452",
        "1358608667686994120",
    ];

    if (!Staff.includes(message.author.id)) {
        return;
    }

    const args = message.content.trim().split(' '); // Trim to remove any unwanted spaces
    const command = args[0];
    const subCommand = args[1]; // 'give' or 'remove'
    const serverId = args[2];

    if (!serverId) {
        return;
    }

    // Handle -premium command
    if (command === '-premium') {
        if (subCommand === 'give') {
            const unit = parseInt(args[3], 10); // The duration number
            const time = args[4]; // Either 'month' or 'year'

            // Validate the unit and time arguments
            if (isNaN(unit) || !['month', 'year', 'week'].includes(time)) {
                return message.reply("❗ Please provide a valid duration and time unit (e.g., 6 months, 1 year).");
            }

            try {
                const existing = await PremiumSubscriptions.findOne({ guildID: serverId });
                if (existing) {
                    return message.reply(`❗ This server already has a premium subscription.`);
                }

                // Calculate expiration date using moment.js
                let expirationDate;
                if (time === 'week') {
                    expirationDate = moment().add(unit, 'weeks'); // Add the specified number of months
                } else if (time === 'month') {
                    expirationDate = moment().add(unit, 'months'); // Add the specified number of years
                } else if (time === 'year') {
                    expirationDate = moment().add(unit, 'years'); // Add the specified number of years
                }

                // Add the premium subscription
                await PremiumSubscriptions.create({
                    guildID: serverId,
                    expiresAt: expirationDate.toDate(), // Store the date as a JavaScript Date object
                });

                return message.reply(`❗ The server with ID ${serverId} has been given a premium subscription for ${unit} ${time}(s), active until ${expirationDate.format('MMMM Do YYYY')}.`);
            } catch (error) {
                console.error(`Error giving premium to server ${serverId}:`, error);
                return message.reply("❗ There was an error while trying to give the premium subscription, but the subscription may have been given.");
            }
        } else if (subCommand === 'remove') {
            try {
                // Check if the server has a premium subscription
                const existing = await PremiumSubscriptions.findOne({ guildID: serverId });
                if (!existing) {
                    return message.reply(`❗ This server does not have a premium subscription.`);
                }

                // Remove the premium subscription
                await PremiumSubscriptions.deleteOne({ guildID: serverId });

                return message.reply(`❗ The premium subscription for the server with ID ${serverId} has been removed.`);
            } catch (error) {
                console.error(`Error removing premium from server ${serverId}:`, error);
                return message.reply("❗ There was an error while trying to remove the premium subscription, but the subscription may have been removed.");
            }
        } else {
            return message.reply("❗ Invalid sub-command. Use 'give' or 'remove'.");
        }
    }
};
