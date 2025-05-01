const { Client, Message, EmbedBuilder } = require('discord.js');
const moment = require('moment');
const PremiumSubscriptions = require('../../schemas/PremiumGuild');

module.exports =
/**
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

    const args = message.content.trim().split(' ');
    const command = args[0];
    const subCommand = args[1]; // give / remove
    const serverId = args[2];

    if (command !== '-premium' || !serverId) return;

    const logChannelId = '1301591831162912872';
    const logChannel = await client.channels.fetch(logChannelId).catch(() => null);

    // Attempt to fetch guild and owner
    const guild = client.guilds.cache.get(serverId);
    const guildName = guild ? `${guild.name} (${guild.id})` : `Unknown Guild (${serverId})`;
    const guildOwnerTag = guild ? (await guild.fetchOwner().then(owner => `${owner.user.tag}`).catch(() => "Unknown Owner")) : "Unknown Owner";

    const replyAndLog = async (color, description, defaultTitle = "Command Ran") => {
        const responseEmbed = new EmbedBuilder()
            .setTitle(defaultTitle)
            .setColor(color)
            .setDescription(description)
            .setTimestamp();

        await message.reply({ embeds: [responseEmbed] });

        if (logChannel && logChannel.isTextBased()) {
            let logTitle = defaultTitle;
            if (subCommand === 'give') logTitle = "Premium Given";
            else if (subCommand === 'remove') logTitle = "Premium Removed";

            const logEmbed = new EmbedBuilder()
                .setTitle(logTitle)
                .setColor(color)
                .setDescription(
                    `**Who**: ${message.author}\n` +
                    `**Duration**: ${unit && time ? `${unit} ${time}(s)` : "N/A"}\n` +
                    `**Server**: ${guildName}\n` +
                    `**Server Owner**: ${guildOwnerTag}`
                )
                .setTimestamp();

            await logChannel.send({ embeds: [logEmbed] });
        }
    };

    if (subCommand === 'give') {
        const unit = parseInt(args[3], 10);
        const time = args[4]; // 'month', 'year', 'week'

        if (isNaN(unit) || !['month', 'year', 'week'].includes(time)) {
            return replyAndLog("Red", "❗ Please provide a valid duration and time unit (e.g., 6 months, 1 year).", "Invalid Input");
        }

        try {
            const existing = await PremiumSubscriptions.findOne({ guildID: serverId });
            if (existing) {
                return replyAndLog("Yellow", `❗ This server already has a premium subscription.`, "Already Premium");
            }

            const expirationDate = moment().add(unit, `${time}s`);

            await PremiumSubscriptions.create({
                guildID: serverId,
                expiresAt: expirationDate.toDate(),
            });

            return replyAndLog(
                "Green",
                `✅ The server with ID ${serverId} has been given premium for ${unit} ${time}(s), active until **${expirationDate.format('MMMM Do YYYY')}**.`,
                "Premium Given"
            );
        } catch (error) {
            console.error(`Error giving premium to server ${serverId}:`, error);
            return replyAndLog("Red", "❗ There was an error while trying to give premium. It may or may not have succeeded.", "Error");
        }

    } else if (subCommand === 'remove') {
        try {
            const existing = await PremiumSubscriptions.findOne({ guildID: serverId });
            if (!existing) {
                return replyAndLog("Yellow", `❗ This server does not have a premium subscription.`, "Not Premium");
            }

            await PremiumSubscriptions.deleteOne({ guildID: serverId });

            return replyAndLog(
                "Green",
                `✅ Premium has been removed from server with ID ${serverId}.`,
                "Premium Removed"
            );
        } catch (error) {
            console.error(`Error removing premium from server ${serverId}:`, error);
            return replyAndLog("Red", "❗ There was an error while trying to remove premium.", "Error");
        }
    } else {
        return replyAndLog("Red", "❗ Invalid sub-command. Use 'give' or 'remove'.", "Invalid Command");
    }
};
