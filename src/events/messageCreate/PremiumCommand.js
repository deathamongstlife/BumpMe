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

    if (!Staff.includes(message.author.id)) return;

    const args = message.content.trim().split(' ');
    const command = args[0];
    const subCommand = args[1];
    const serverId = args[2];
    const unit = parseInt(args[3], 10);
    const time = args[4];

    if (command !== '-premium') return;
    if (!serverId) return message.reply("❗ You must provide a server ID.");

    const logChannel = client.channels.cache.get("1301591831162912872");

    const targetGuild = client.guilds.cache.get(serverId);
    let guildName = "Unknown Guild";
    let guildOwnerTag = "Unknown Owner";

    if (targetGuild) {
        try {
            const owner = await targetGuild.fetchOwner();
            guildName = `${targetGuild.name} (${targetGuild.id})`;
            guildOwnerTag = owner.user.tag;
        } catch {
            // Continue with fallback names
        }
    } else {
        guildName = `Unknown Guild (${serverId})`;
    }

    const replyAndLog = async (color, description, title = "Premium Action") => {
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setColor(color)
            .setDescription(description)
            .setTimestamp();

        await message.reply({ embeds: [embed] });

        if (logChannel && logChannel.isTextBased()) {
            const logEmbed = new EmbedBuilder()
                .setTitle("Command Ran")
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
        if (isNaN(unit) || !['month', 'year', 'week'].includes(time)) {
            return replyAndLog("Red", "❗ Invalid duration or time unit. Use: `-premium give <serverId> <number> <week|month|year>`", "Invalid Input");
        }

        try {
            const existing = await PremiumSubscriptions.findOne({ guildID: serverId });
            if (existing) {
                return replyAndLog("Orange", `❗ This server already has a premium subscription.`, "Already Premium");
            }

            const expirationDate = moment().add(unit, time + 's');

            await PremiumSubscriptions.create({
                guildID: serverId,
                expiresAt: expirationDate.toDate(),
            });

            return replyAndLog(
                "Green",
                `✅ The server **${guildName}** has been given premium for **${unit} ${time}(s)**, active until **${expirationDate.format('MMMM Do YYYY')}**.`
            );
        } catch (err) {
            console.error(`Error giving premium to server ${serverId}:`, err);
            return replyAndLog("Red", "❗ Failed to give premium. There was an internal error.");
        }

    } else if (subCommand === 'remove') {
        try {
            const existing = await PremiumSubscriptions.findOne({ guildID: serverId });
            if (!existing) {
                return replyAndLog("Orange", `❗ This server does not have a premium subscription.`, "Not Premium");
            }

            await PremiumSubscriptions.deleteOne({ guildID: serverId });

            return replyAndLog("Green", `✅ Premium removed from server **${guildName}**.`);
        } catch (err) {
            console.error(`Error removing premium from server ${serverId}:`, err);
            return replyAndLog("Red", "❗ Failed to remove premium. There was an internal error.");
        }

    } else {
        return replyAndLog("Red", "❗ Invalid sub-command. Use `give` or `remove`.");
    }
};
