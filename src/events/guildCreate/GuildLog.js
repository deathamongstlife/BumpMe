const { EmbedBuilder } = require("discord.js");
const BumpConfig = require('../../schemas/Bump');
const GuildInfoSchema = require('../../schemas/guild-info');

module.exports = async (client, guild) => {

    const guildId = guild.id;
    const guildName = guild.name;
    const iconURL = guild.iconURL() || ""; // Fetch the guild's icon URL
    const ownerID = guild.ownerId; // Get the guild owner's ID
    
    // Create a new document in the BumpConfig schema with guildID and approved fields
    const newData = new BumpConfig({
        guildID: guild.id,
        approved: false, // Set the default value for 'approved' field here
    });
    
    const newGuildInfo = new GuildInfoSchema({
        guildID: guildId,
        guildName: guildName,
        iconURL: iconURL,
        ownerID: ownerID, // Save the ownerID
    });

    await newData.save().then(() => {
        console.log("New Data Created with guildID:", guild.id);
    }).catch(err => {
        console.error("Error creating new data:", err);
    });
    
        await newGuildInfo.save().then(() => {
        console.log("New Data Created with guildID:", guild.id);
    }).catch(err => {
        console.error("Error creating new data:", err);
    });
    
    const logChannelId = "1300124746763206666"
    const logChannel = client.channels.cache.get(logChannelId);
    if (!logChannel) return console.error('Log channel not found');

    const Emoji = "<:ServerJoined:1266120586405613648>";

    // Create the embed
    const embed = new EmbedBuilder()
        .setAuthor({ name: `Joined Server!`, iconURL: "https://cdn.discordapp.com/emojis/599612545002635274.png" })
        .setDescription(`**${guild.name}** has added BumpMe. \n you are now at ${client.guilds.cache.size} servers.`)
        .addFields({ name: "Member Count", value: `${guild.memberCount} members.`, inline: true })
        .setThumbnail(guild.iconURL())
        .setColor('#00FF00'); // Optional: Set a color for the embed

    // Send the embed to the log channel
    logChannel.send({ embeds: [embed] });
};
