const { EmbedBuilder, InteractionResponse } = require('discord.js');
const guildSettings = require('../schemas/Bump');
const ERROR_CHANNEL_ID = '1300124658758320128';

module.exports = {
    customId: 'serverMessageMdl',
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        
        await interaction.deferReply();
        const { fields, guild } = interaction;
        const guildId = guild.id;
        const desc = fields.getTextInputValue('ServerDesc');

        try {

            let guildConfig = await guildSettings.findOne({ guildID: guildId });

            if (!guildConfig) {
                guildConfig = await new guildSettings({
                    guildID: guildId,
                    message: desc,
                })

                await guildConfig.save();
            } else {
                await guildSettings.findOneAndUpdate(
                    { guildID: guildId },
                    { message: desc },
                    { new: true }
                );
            }
            interaction.editReply({
                content: `📝 Advertisment has been set.`,
                ephemeral: true,
            })
        } catch (error) {
            async function logError(client, error, context = '') {
                const errorChannel = client.channels.cache.get(ERROR_CHANNEL_ID);
                if (errorChannel) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#fe4248')
                        .setTitle('Error in the Bump Command')
                        .setDescription(`**Context:** ${context}\n**Error Message:** ${error.message}\n**Stack Trace:**\n\`\`\`${error.stack}\`\`\``)
                        .setTimestamp();
                    await errorChannel.send({ embeds: [errorEmbed] });

                }
            }
            interaction.reply({
                content: `📝 There was an error setting up the advertisement message.`
            })
            logError(client, error, "Failed to set advertisement message.")
        }
    },
};
