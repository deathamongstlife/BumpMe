const { SlashCommandBuilder, EmbedBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vote')
        .setDescription('🎈 Find all our voting links!'),
   run: async (client, interaction) => {
       
       const embed = new EmbedBuilder()
       .setTitle("Vote for BumpMe")
       .addFields(
           {
               name: "💎 Websites",
               value: "• [Top.gg](https://top.gg/bot/1265343375054340160/vote) \n • [Guilds.me](https://gld.link/bumps)"
           }
       )
       
       interaction.reply({embeds: [embed]})
    },
};