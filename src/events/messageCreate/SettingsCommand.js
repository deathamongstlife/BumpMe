const { Client, Message, EmbedBuilder } = require("discord.js");
const GuildSettings = require("../../schemas/guildSettings");

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

  if (command !== "-settings" || !guildId) {
    return message.reply("❗ Usage: `-settings <guild_id>`");
  }

  try {
    const guildData = await GuildSettings.findOne({ guildID: guildId });

    if (!guildData) {
      return message.reply("❗ No settings found for that guild ID.");
    }

    const guild = client.guilds.cache.get(guildId);
    const owner = guild ? await guild.fetchOwner().catch(() => null) : null;

    const embed = new EmbedBuilder()
      .setTitle("📋 Guild Settings")
      .setColor("#3498db")
      .addFields(
        { name: "Guild ID", value: guildId, inline: true },
        { name: "Guild Name", value: guild?.name || "Unknown", inline: true },
        { name: "Owner", value: owner ? `<@${owner.id}>` : "Unknown", inline: true },
        { name: "\u200B", value: "\u200B" }, // Spacer
        { name: "Approved", value: guildData.approved ? "✅" : "❌", inline: true },
        { name: "Referral Code", value: guildData.referralCode || "None", inline: true },
        { name: "Enabled", value: guildData.enabled ? "✅" : "❌", inline: true },
        { name: "Hide Bumps", value: guildData.hideBumps ? "✅" : "❌", inline: true },
        { name: "Channel ID", value: guildData.channelID || "None", inline: true },
        { name: "Invite Channel ID", value: guildData.inviteChannelID || "None", inline: true },
        { name: "Message", value: guildData.message || "None" },
        { name: "Bump Count", value: guildData.BumpCount.toString(), inline: true },
        { name: "Reminder", value: guildData.reminder ? "✅" : "❌", inline: true },
        { name: "Autobump", value: guildData.autobump ? "✅" : "❌", inline: true },
        { name: "Invite Link", value: guildData.inviteLink || "None" },
        { name: "Cooldown End", value: guildData.cooldownEnd ? `<t:${Math.floor(guildData.cooldownEnd)}:R>` : "None" },
        { name: "Last Bumped Channel", value: guildData.lastBumpedChannel || "None", inline: true },
        { name: "Last Bumped User", value: guildData.lastBumpedUser || "None", inline: true },
        { name: "Hex Color", value: guildData.hexColor || "None", inline: true },
        { name: "Banner URL", value: guildData.bannerURL || "None" }
      )
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    return message.reply({ embeds: [embed] });

  } catch (err) {
    console.error("Error retrieving settings:", err);
    return message.reply("❗ An error occurred while retrieving the settings.");
  }
};
