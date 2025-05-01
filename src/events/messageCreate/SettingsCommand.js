const { Client, Message } = require("discord.js");
const GuildInfo = require("../../schemas/guild-info");
const GuildSettings = require("../../schemas/guildSettings");

module.exports =
/**
 * 
 * @param {Client} client 
 * @param {Message} message 
 */
async (client, message) => {
    const Staff = [
        "1130886272550981662", // Example staff IDs
        "1302806745294307452",
        "1358608667686994120",
    ];

    if (!Staff.includes(message.author.id)) return;

    const args = message.content.trim().split(" ");
    const command = args[0];
    const guildId = args[1];

    if (command !== "-settings") return;
    if (!guildId) {
        return message.reply("❗ Please provide a valid guild ID.");
    }

    try {
        // Querying guild-info for basic details
        const guildInfo = await GuildInfo.findOne({ guildID: guildId });
        if (!guildInfo) {
            return message.reply(`❗ No guild info found for ID: \`${guildId}\``);
        }

        // Querying guildSettings for additional settings
        const guildSettings = await GuildSettings.findOne({ guildID: guildId });
        if (!guildSettings) {
            return message.reply(`❗ No settings found for guild ID: \`${guildId}\``);
        }

        // Inform the user that the guild was found
        message.reply(`✅ Guild with ID: \`${guildId}\` has been found in the database.`);

    } catch (err) {
        console.error(`Error checking for guild ${guildId}:`, err);
        message.reply("❗ There was an error while trying to find the guild.");
    }
};
