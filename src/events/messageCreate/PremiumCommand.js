const { Client, Message, EmbedBuilder } = require('discord.js');
const moment = require('moment');
const PremiumSubscriptions = require('../../schemas/PremiumGuild');

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
    const subCommand = args[1];
    const serverId = args[2];

    if (!serverId) return;

    const logChannelId = '1301591831162912872';

    const replyAndLog = async (color, description, defaultTitle = "Command Ran", duration = "N/A") => {
        const guild = client.guilds.cache.get(serverId);
        const owner = guild ? await guild.fetchOwner().catch(() => null) : null;

        const embed = new EmbedBuilder()
            .setTitle(defaultTitle)
            .setColor(color)
            .setDescription(
                `**Who**: ${message.author}\n` +
                `**Duration**: ${duration}\n` +
                `**Server**: ${guild ? `${guild.name} (${guild.id})` : `Unknown (${serverId})`}\n` +
                `**Server Owner**: ${owner ? owner.user.tag : 'Unknown'}`
            )
            .setTimestamp();

        const response = new EmbedBuilder()
            .setColor(color)
            .setDescription(description);

        message.reply({ embeds: [response] }).catch(() => {});
        const logChannel = client.channels.cache.get(logChannelId);
        if (logChannel) {
            logChannel.send({ embeds: [embed] }).catch(() => {});
        }
    };

    if (command === '-premium') {
        if (subCommand === 'give') {
            const unit = parseInt(args[3], 10);
            const time = args[4];

            if (isNaN(unit) || !['month', 'year', 'week'].includes(time)) {
                return message.reply("❗ Please provide a valid duration and time unit (e.g., 6 months, 1 year).");
            }

            try {
                const existing = await PremiumSubscriptions.findOne({ guildID: serverId });
                if (existing) {
                    return message.reply(`❗ This server already has a premium subscription.`);
                }

                let expirationDate;
                if (time === 'week') {
                    expirationDate = moment().add(unit, 'weeks');
                } else if (time === 'month') {
                    expirationDate = moment().add(unit, 'months');
                } else if (time === 'year') {
                    expirationDate = moment().add(unit, 'years');
                }

                await PremiumSubscriptions.create({
                    guildID: serverId,
                    expiresAt: expirationDate.toDate(),
                });

                return replyAndLog(
                    "Green",
                    `✅ The server with ID ${serverId} has been given premium for ${unit} ${time}(s), active until **${expirationDate.format('MMMM Do YYYY')}**.`,
                    "Premium Given",
                    `${unit} ${time}(s)`
                );
            } catch (error) {
                console.error(`Error giving premium to server ${serverId}:`, error);
                return message.reply("❗ There was an error while trying to give the premium subscription.");
            }
        } else if (subCommand === 'remove') {
            try {
                const existing = await PremiumSubscriptions.findOne({ guildID: serverId });
                if (!existing) {
                    return message.reply(`❗ This server does not have a premium subscription.`);
                }

                await PremiumSubscriptions.deleteOne({ guildID: serverId });

                return replyAndLog(
                    "Red",
                    `✅ Premium has been removed from server with ID ${serverId}.`,
                    "Premium Removed",
                    "N/A"
                );
            } catch (error) {
                console.error(`Error removing premium from server ${serverId}:`, error);
                return message.reply("❗ There was an error while trying to remove the premium subscription.");
            }
        } else {
            return message.reply("❗ Invalid sub-command. Use 'give' or 'remove'.");
        }
    }
};
