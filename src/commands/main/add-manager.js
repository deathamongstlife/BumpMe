const { SlashCommandBuilder } = require('discord.js');
const GuildInfo = require('../../schemas/guild-info');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-manager')
        .setDescription('Add a user to manage the dashboard.')
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("Manager to add.")
                .setRequired(true)
        ),
    deleted: true,
        
    run: async (client, interaction) => {
        // Defer reply to give time for processing
        await interaction.deferReply();

        // Get the guild ID and the user ID to be added as a manager
        const guildID = interaction.guild.id;
        const managerUser = interaction.options.getUser("user");

        try {
            // Find the guild document in the database
            let guildData = await GuildInfo.findOne({ guildID });
            
            if (!interaction.user.id === guildData.ownerID) {
                return interaction.reply({
                    content: `Only the owner can add managers.`,
                    ephemeral: true,
                })
            }

            // If the guild document doesn’t exist, create it
            if (!guildData) {
                guildData = new GuildInfo({
                    guildID,
                    guildName: interaction.guild.name,
                    iconURL: interaction.guild.iconURL(),
                    ownerID: interaction.guild.ownerId,
                    Managers: [] // Initialize an empty Managers array
                });
            }

            // Check if the user is already a manager
            if (guildData.Managers.includes(managerUser.id)) {
                return interaction.editReply({
                    content: `${managerUser.tag} is already a manager.`,
                    ephemeral: true
                });
            }

            // Add the user ID to the Managers array
            guildData.Managers.push(managerUser.id);
            await guildData.save();

            // Send a confirmation message
            return interaction.editReply({
                content: `${managerUser.tag} has been added as a manager.`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error adding manager:', error);
            return interaction.editReply({
                content: `There was an error while adding the manager.`,
                ephemeral: true
            });
        }
    },
};
