const { Client, Message, EmbedBuilder } = require("discord.js");
const mongoose = require("mongoose");
const Bump = require("../../schemas/Bump"); // Combined schema containing guild info and settings

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
        // Querying Bump schema for combined guild info and settings
        const guildData = await Bump.findOne({ guildID: guildId });
        if (!guildData) {
            return message.reply(`❗ No data found for guild ID: \`${guildId}\``);
        }

        // Fetching owner info
        const ownerUser = await client.users.fetch(guildData.ownerID).catch(() => null);
        const ownerTag = ownerUser ? `${ownerUser.tag} (${ownerUser.id})` : guildData.ownerID;

        // Creating embed with data
        const embed = new EmbedBuilder()
            .setTitle("📋 Guild Settings")
            .setColor("Blue")
            .setThumbnail(guildData.iconURL || client.user.displayAvatarURL())
            .addFields(
                { name: "Guild Name", value: guildData.guildName, inline: true },
                { name: "Guild ID", value: guildData.guildID, inline: true },
                { name: "Owner", value: ownerTag, inline: true },
                { name: "Managers", value: guildData.Managers.length > 0 ? guildData.Managers.map(id => `<@${id}>`).join(", ") : "None" },
                { name: "Approved", value: guildData.approved ? "Yes" : "No", inline: true },
                { name: "Bump Enabled", value: guildData.enabled ? "Yes" : "No", inline: true },
                { name: "Bump Channel", value: guildData.channelID || "Not Set", inline: true },
                { name: "Invite Channel", value: guildData.inviteChannelID || "Not Set", inline: true },
                { name: "Bump Count", value: guildData.BumpCount.toString(), inline: true },
                { name: "Cooldown End", value: guildData.cooldownEnd ? new Date(guildData.cooldownEnd).toLocaleString() : "Not Set", inline: true }
            )
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        await message.reply({ embeds: [embed] });

    } catch (err) {
        console.error(`Error fetching settings for guild ${guildId}:`, err);
        message.reply("❗ There was an error retrieving the guild settings.");
    }
};
