const { EmbedBuilder } = require("discord.js");
const BumpSchema = require('../../schemas/Bump');

module.exports = async (client, message) => {
    const { author } = message;

    // Only allow the author with the specific ID to run the command
    if (message.content === "-setup") {
    
    	const SetupServers = await BumpSchema.find({ enabled: true });
        
        message.reply(`There is ${SetupServers.length} setup servers.`)
    }
};
