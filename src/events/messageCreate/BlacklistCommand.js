const { Client, Message, EmbedBuilder } = require('discord.js');
const BlacklistGuildSchema = require('../../schemas/blacklistedGuilds');
const BlacklistUserSchema = require('../../schemas/blacklistedUsers');

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

    if (!Staff.includes(message.author.id)) {
        return;
    }

    const args = message.content.trim().split(' ');
    const command = args[0];
    const subCommand = args[1]; // user / guild
    const targetId = args[2];
    const reason = args.slice(3).join(' ');
    const logChannelId = '1367533524235587614';

    if (command !== '-blacklist') return;
    if (!['user', 'guild'].includes(subCommand)) {
        return message.reply("❗ Invalid sub-command. Use 'user' or 'guild'.");
    }
    if (!targetId) return message.reply("❗ You must specify a user or guild ID.");
    if (!reason) return message.reply("❗ Please provide a reason for blacklisting.");

    const replyAndLog = async (color, description, title) => {
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setColor(color)
            .setTimestamp()
            .setDescription(
                `**Moderator**: ${message.author}\n` +
                (subCommand === 'user'
                    ? `**User**: <@${targetId}> (${targetId})\n`
                    : `**Server**: ${await getGuildName(targetId, client)} (${targetId})\n`) +
                `**Reason**: ${reason}`
            );

        const response = new EmbedBuilder().setColor(color).setDescription(description);
        message.reply({ embeds: [response] }).catch(() => {});
        const logChannel = client.channels.cache.get(logChannelId);
        if (logChannel) {
            logChannel.send({ embeds: [embed] }).catch(() => {});
        }
    };

    const getGuildName = async (id, client) => {
        try {
            const guild = await client.guilds.fetch(id);
            return guild.name || 'Unknown';
        } catch {
            return 'Unknown';
        }
    };

    try {
        if (subCommand === 'user') {
            const existing = await BlacklistUserSchema.findOne({ userID: targetId });
            if (existing) {
                return message.reply(`❗ This user is already blacklisted.`);
            }

            await BlacklistUserSchema.create({ userID: targetId, reason });
            return replyAndLog("Red", `✅ User <@${targetId}> has been blacklisted for reason: **${reason}**.`, "Blacklist User");
        }

        if (subCommand === 'guild') {
            const existing = await BlacklistGuildSchema.findOne({ guildID: targetId });
            if (existing) {
                return message.reply(`❗ This guild is already blacklisted.`);
            }

            await BlacklistGuildSchema.create({ guildID: targetId, reason });
            return replyAndLog("Red", `✅ Guild \`${targetId}\` has been blacklisted for reason: **${reason}**.`, "Blacklist Guild");
        }
    } catch (error) {
        console.error(`Error processing blacklist command:`, error);
        return message.reply("❗ There was an error while processing the blacklist.");
    }
};
