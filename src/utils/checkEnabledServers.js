const BumpSchema = require('../schemas/Bump');
const { EmbedBuilder } = require('discord.js');

const checkEnabledServers = async (client) => {
    try {
        // Fetch all documents from BumpSchema
        const bumpSettings = await BumpSchema.find({});

        console.log(`Found ${bumpSettings.length} entries in BumpSchema.`);

        for (const settings of bumpSettings) {
            const { guildID } = settings;

            try {
                // Fetch the guild from the cache
                const guild = client.guilds.cache.get(guildID);

                if (!guild) {
                    console.log(`Guild with ID ${guildID} not found in cache. Skipping...`);
                    continue; // Skip to the next guild if it's not in the cache
                }

                console.log(`Found guild ${guild.id} in cache.`);

                // Check if the settings are incomplete
                if (!settings.channelID || !settings.inviteChannelID || !settings.message) {
                    console.log(`Guild ${guild.id} is not fully set up. Attempting to DM the owner.`);

                    const owner = await guild.fetchOwner();

                    const embed = new EmbedBuilder()
                        .setTitle("Looks like we have some unfinished business!")
                        .setDescription("Please ensure you have fully set up your server by using the following commands for **BumpMe**! \n \n `/setup channels` - Bump Channel \n `/setup channels` - Invite Channel \n `/setup description` - Bump Description")
                        .setColor("#fe4248")
                        .setImage('https://media.discordapp.net/attachments/1265026826473046038/1281679675168395347/Bump2You_1.png?ex=66dc98b7&is=66db4737&hm=6240b6fefd2343a77990b1b14b12686f55da7e40c6f956dec1aa1023eef05154&=&format=webp&quality=lossless&width=1295&height=78')
                    	.setFooter({ text: `Server: ${guild.name} | Guild ID: ${guild.id}` });

                    if (owner) {
                        await owner.send({ embeds: [embed] });
                        console.log(`Successfully DM'd the owner of guild ${guild.id}.`);
                    } else {
                        console.log(`Owner not found for guild ${guild.id}.`);
                    }
                } else {
                    console.log(`Guild ${guild.id} is already fully set up.`);
                }
            } catch (error) {
                console.error(`Error processing guild ${guildID}:`, error);
            }
        }
    } catch (error) {
        console.error('Error checking bump settings:', error);
    }
};

module.exports = checkEnabledServers;
