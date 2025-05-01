const { Client, Message, EmbedBuilder } = require('discord.js');
const GuildSettings = require('../../schemas/guildSettings');

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
  const guildId = args[1];

  if (command !== '-settings' || !guildId) {
    return message.reply("❗ Usage: `-settings <guild_id>`");
  }

  try {
    const settings = await GuildSettings.findOne({ guildID: guildId });
    const guild = client.guilds.cache.get(guildId);

    if (!settings) {
      return message.reply("❗ No settings found for that guild.");
    }

    const embed = new EmbedBuilder()
      .setTitle("Guild Settings")
      .setColor("#3498db")
      .addFields(
        { name: "Guild", value: `${guild?.name || "Unknown"} (${guildId})`, inline: false },
        { name: "Approved", value: `${settings.approved}`, inline: true },
        { name: "Referral Code", value: `${settings.referralCode || "None"}`, inline: true },
        { name: "Enabled", value: `${settings.enabled}`, inline: true },
        { name: "Hide Bumps", value: `${settings.hideBumps}`, inline: true },
        { name: "Channel ID", value: `${settings.channelID || "None"}`, inline: true },
        { name: "Invite Channel ID", value: `${settings.inviteChannelID || "None"}`, inline: true },
        { name: "Message", value: `${settings.message || "None"}`, inline: false },
        { name: "Bump Count", value: `${settings.BumpCount}`, inline: true },
        { name: "Reminder", value: `${settings.reminder}`, inline: true },
        { name: "Autobump", value: `${settings.autobump}`, inline: true },
        { name: "Invite Link", value: `${settings.inviteLink || "None"}`, inline: false },
        { name: "Cooldown End", value: settings.cooldownEnd ? `<t:${Math.floor(settings.cooldownEnd)}:F>` : "0", inline: true },
        { name: "Last Bumped Channel", value: `${settings.lastBumpedChannel || "None"}`, inline: true },
        { name: "Last Bumped User", value: `${settings.lastBumpedUser || "None"}`, inline: true },
        { name: "Hex Color", value: `${settings.hexColor || "None"}`, inline: true },
        { name: "Banner URL", value: `${settings.bannerURL || "None"}`, inline: false },
      )
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  } catch (error) {
    console.error(`Error fetching settings for guild ${guildId}:`, error);
    message.reply("❗ An error occurred while fetching the settings.");
  }
};
