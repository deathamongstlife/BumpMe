const BumpSchema = require('../../schemas/Bump');
const GuildInfo = require('../../schemas/guild-info');
const { EmbedBuilder } = require('discord.js')

module.exports = async (client, guild) => {
    try {
        // Check if there is any BumpSchema data for the guild
        const bumpData = await BumpSchema.findOne({ guildID: guild.id });
        const GuildData = await GuildInfo.findOne({ guildID: guild.id});

        if (bumpData) {
            // Remove the BumpSchema data for the guild
            await BumpSchema.deleteOne({ guildID: guild.id });
            await GuildInfo.deleteOne({ guildID: guild.id});
            client.guilds.cache.delete(guild.id); // Remove the guild from cache
            console.log(`Bump data for guild ${guild.id} has been removed.`);
        } else {
            client.guilds.cache.delete(guild.id); // Remove the guild from cache
            return console.log(`No bump data found for guild ${guild.id}.`);
            
        }
    } catch (error) {
        console.error('Error removing bump data:', error);
    }
    
    const logChannelId = '1300124808553431052';
    const logChannel = client.channels.cache.get(logChannelId);
    if (!logChannel) return console.error('Log channel not found');

    const Emoji = "<:ServerJoined:1266120586405613648>";

    // Create the embed
    const embed = new EmbedBuilder()
        .setTitle("Server Left")
        .setDescription(`**${guild.name}** has removed BumpMe. \n you are now at ${client.guilds.cache.size} servers.`)
        .setThumbnail(guild.iconURL())
        .setColor('#00FF00'); // Optional: Set a color for the embed

    // Send the embed to the log channel
    logChannel.send({ embeds: [embed] });
};