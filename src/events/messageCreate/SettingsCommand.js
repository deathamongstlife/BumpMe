const { Client, Message, EmbedBuilder } = require("discord.js");
const GuildSettings = require("../../schemas/Bump"); // Replaces guild-info and guildSettings

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

    const args = message.content.trim().split(" ");
    const command = args[0];
    const guildId = args[1];

    if (command !== "-settings") return;
    if (!guildId) return message.reply("❗ Please provide a valid guild ID.");

    try {
        const settings = await GuildSettings.findOne({ guildID: guildId });

        if (!settings) {
            return message.reply(`❗ No settings found for guild ID: \`${guildId}\``);
        }

        const embed = new EmbedBuilder()
            .setTitle("📋 Guild Settings")
            .setColor("Blue")
            .addFields(
                { name: "Guild ID", value: guildId, inline: true },
                { name: "Approved", value: String(settings.approved ?? "Not Set"), inline: true },
                { name: "Referral Code", value: settings.referralCode || "Not Set", inline: true },
                { name: "Bump Enabled", value: String(settings.enabled ?? false), inline: true },
                { name: "Hide Bumps", value: String(settings.hideBumps ?? false), inline: true },
                { name: "Bump Channel", value: settings.channelID || "Not Set", inline: true },
                { name: "Invite Channel", value: settings.inviteChannelID || "Not Set", inline: true },
                { name: "Message", value: settings.message || "Not Set", inline: false },
                { name: "Bump Count", value: String(settings.BumpCount ?? 0), inline: true },
                { name: "Reminder", value: String(settings.reminder ?? false), inline: true },
                { name: "Auto Bump", value: String(settings.autobump ?? false), inline: true },
                { name: "Invite Link", value: settings.inviteLink || "Not Set", inline: false },
                { name: "Cooldown End", value: settings.cooldownEnd ? new Date(settings.cooldownEnd).toLocaleString() : "Not Set", inline: false },
                { name: "Last Bumped Channel", value: settings.lastBumpedChannel || "Not Set", inline: true },
                { name: "Last Bumped User", value: settings.lastBumpedUser || "Not Set", inline: true },
                { name: "Hex Color", value: settings.hexColor || "Not Set", inline: true },
                { name: "Banner URL", value: settings.bannerURL || "Not Set", inline: false }
            )
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        await message.reply({ embeds: [embed] });

    } catch (err) {
        console.error(`Error fetching settings for guild ${guildId}:`, err);
        message.reply("❗ There was an error retrieving the guild settings.");
    }
};
