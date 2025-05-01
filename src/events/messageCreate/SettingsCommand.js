const { Client, Message, EmbedBuilder } = require("discord.js");
const GuildInfo = require("../../schemas/guild-info");

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
        const guildInfo = await GuildInfo.findOne({ guildID: guildId });
        if (!guildInfo) {
            return message.reply(`❗ No guild info found for ID: \`${guildId}\``);
        }

        const ownerUser = await client.users.fetch(guildInfo.ownerID).catch(() => null);
        const ownerTag = ownerUser ? `${ownerUser.tag} (${ownerUser.id})` : guildInfo.ownerID;

        const embed = new EmbedBuilder()
            .setTitle("📋 Guild Settings")
            .setColor("Blue")
            .setThumbnail(guildInfo.iconURL || client.user.displayAvatarURL())
            .addFields(
                { name: "Guild Name", value: guildInfo.guildName, inline: true },
                { name: "Guild ID", value: guildInfo.guildID, inline: true },
                { name: "Owner", value: ownerTag, inline: true },
                { name: "Managers", value: guildInfo.Managers.length > 0 ? guildInfo.Managers.map(id => `<@${id}>`).join(", ") : "None" }
            )
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        await message.reply({ embeds: [embed] });

    } catch (err) {
        console.error(`Error fetching guild settings for ID ${guildId}:`, err);
        message.reply("❗ There was an error retrieving the guild settings.");
    }
};
