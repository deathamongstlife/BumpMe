const { SlashCommandBuilder, EmbedBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dashboard')
        .setDescription('📌 Find your servers edit page.'),
   run: async (client, interaction) => {
       interaction.reply({ content: `You can edit your server settings here at https://www.bumping.ltd/server/${interaction.guild.id}/edit .`})
    },
};