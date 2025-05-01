const { Client, Message, EmbedBuilder } = require("discord.js");
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
        "1358608667686994120"
//        "1002142393442762792"
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
        const guildData = await Bump.findOne({ guildID: guildId });
        if (!guildData) {
            return message.reply(`❗ No data found for guild ID: \`${guildId}\``);
        }

        const embed = new EmbedBuilder()
            .setTitle("📋 Guild Configuration")
            .setColor(guildData.hexColor || "Blue")
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: "📌 Guild ID", value: guildData.guildID, inline: true },
                { name: "✅ Approved", value: String(guildData.approved), inline: true },
                { name: "🎟️ Referral Code", value: guildData.referralCode || "Not Set", inline: true },

                { name: "\u200B", value: "**__Bump Settings__**" },
                { name: "📢 Enabled", value: String(guildData.enabled), inline: true },
                { name: "🙈 Hide Bumps", value: String(guildData.hideBumps), inline: true },
                { name: "🔁 Reminder", value: String(guildData.reminder), inline: true },
                { name: "🤖 Auto Bump", value: String(guildData.autobump), inline: true },
                { name: "🔄 Bump Count", value: String(guildData.BumpCount), inline: true },
                { name: "📃 Message", value: guildData.message || "Not Set", inline: false },

                { name: "\u200B", value: "**__Channel & Invite Info__**" },
                { name: "💬 Bump Channel", value: guildData.channelID || "Not Set", inline: true },
                { name: "📨 Invite Channel", value: guildData.inviteChannelID || "Not Set", inline: true },
                { name: "🔗 Invite Link", value: guildData.inviteLink || "Not Set", inline: true },

                { name: "\u200B", value: "**__Metadata__**" },
                { name: "👤 Last Bumped User", value: guildData.lastBumpedUser || "Not Set", inline: true },
                { name: "🎨 Hex Color", value: guildData.hexColor || "Not Set", inline: true },
                { name: "🖼️ Banner URL", value: guildData.bannerURL || "Not Set", inline: false },
            )
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        await message.reply({ embeds: [embed] });

    } catch (err) {
        console.error(`Error fetching settings for guild ${guildId}:`, err);
        message.reply("❗ There was an error retrieving the guild settings.");
    }
};
