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
    const action = args[1]; // blacklist / unblacklist
    const type = args[2];   // user / guild
    const id = args[3];     // userID or guildID
    const reason = args.slice(4).join(' ');

    if (!['-blacklist', '-unblacklist'].includes(command) || !['user', 'guild'].includes(type) || !id) {
        return message.reply("❗ Usage: `-blacklist/-unblacklist user|guild <id> [reason]`");
    }

    const isBlacklist = command === '-blacklist';
    const logChannelId = '1367533524235587614';

    const sendLog = async (title, moderator, targetType, targetId, reasonText) => {
        const logChannel = client.channels.cache.get(logChannelId);
        if (!logChannel) return;

        let embed = new EmbedBuilder()
            .setTitle(title)
            .setColor(isBlacklist ? "Red" : "Green")
            .setTimestamp();

        if (targetType === 'guild') {
            let serverName = 'Unknown';
            let serverID = targetId;

            try {
                const guild = await client.guilds.fetch(targetId);
                if (guild) {
                    serverName = guild.name;
                    serverID = guild.id;
                }
            } catch (_) {}

            embed.setDescription(
                `**Moderator**: ${moderator}\n` +
                `**Server**: ${serverName} (${serverID})\n` +
                `**Reason**: ${reasonText || 'N/A'}`
            );
        } else {
            const userMention = `<@${targetId}>`;
            embed.setDescription(
                `**Moderator**: ${moderator}\n` +
                `**User**: ${userMention} (${targetId})\n` +
                `**Reason**: ${reasonText || 'N/A'}`
            );
        }

        logChannel.send({ embeds: [embed] }).catch(() => {});
    };

    const handleBlacklist = async (Schema, idKey, targetType) => {
        if (isBlacklist) {
            if (!reason) return message.reply("❗ Please provide a reason for blacklisting.");
            const existing = await Schema.findOne({ [idKey]: id });
            if (existing) return message.reply(`❗ This ${targetType} is already blacklisted.`);

            await Schema.create({ [idKey]: id, reason });
            await sendLog(`Blacklist ${targetType}`, message.author, targetType, id, reason);
            return message.reply(`✅ Successfully blacklisted the ${targetType} \`${id}\` for reason: **${reason}**.`);
        } else {
            const existing = await Schema.findOne({ [idKey]: id });
            if (!existing) return message.reply(`❗ This ${targetType} is not blacklisted.`);

            await Schema.deleteOne({ [idKey]: id });
            await sendLog(`Unblacklist ${targetType}`, message.author, targetType, id, reason || 'No reason provided.');
            return message.reply(`✅ Successfully removed blacklist for ${targetType} \`${id}\`.`);
        }
    };

    if (type === 'user') {
        await handleBlacklist(BlacklistUserSchema, 'userID', 'user');
    } else if (type === 'guild') {
        await handleBlacklist(BlacklistGuildSchema, 'guildID', 'guild');
    }
};
