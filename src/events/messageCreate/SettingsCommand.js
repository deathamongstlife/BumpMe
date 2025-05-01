const { Client, Message, EmbedBuilder } = require("discord.js");
const mongoose = require("mongoose");
const GuildInfo = require("../../schemas/Bump");
const GuildSettings = require("../../schemas/Bump"); // Your existing schema for settings

module.exports =
/**
 * 
 * @param {Client} client 
 * @param {Message} message 
 */
async (client, message) => {
    const Staff = [
        "1130886272550981662",
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

        // Fetching owner info
        const ownerUser = await client.users.fetch(guildInfo.ownerID).catch(() => null);
        const ownerTag = ownerUser ? `${ownerUser.tag} (${ownerUser.id})` : guildInfo.ownerID;

        // Creating embed with combined data
        const embed = new EmbedBuilder()
            .setTitle("📋 Guild Settings")
            .setColor("Blue")
            .setThumbnail(guildInfo.iconURL || client.user.displayAvatarURL())
            .addFields(
                { name: "Guild Name", value: guildInfo.guildName, inline: true },
                { name: "Guild ID", value: guildInfo.guildID, inline: true },
                { name: "Owner", value: ownerTag, inline: true },
                { name: "Managers", value: guildInfo.Managers.length > 0 ? guildInfo.Managers.map(id => `<@${id}>`).join(", ") : "None" },
                { name: "Approved", value: guildSettings.approved ? "Yes" : "No", inline: true },
                { name: "Bump Enabled", value: guildSettings.enabled ? "Yes" : "No", inline: true },
                { name: "Bump Channel", value: guildSettings.channelID || "Not Set", inline: true },
                { name: "Invite Channel", value: guildSettings.inviteChannelID || "Not Set", inline: true },
                { name: "Bump Count", value: guildSettings.BumpCount.toString(), inline: true },
                { name: "Cooldown End", value: guildSettings.cooldownEnd ? new Date(guildSettings.cooldownEnd).toLocaleString() : "Not Set", inline: true }
            )
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        await message.reply({ embeds: [embed] });

    } catch (err) {
        console.error(`Error fetching settings for guild ${guildId}:`, err);
        message.reply("❗ There was an error retrieving the guild settings.");
    }
};
