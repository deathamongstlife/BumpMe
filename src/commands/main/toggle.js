const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const BumpSchema = require('../../schemas/Bump');
const PremiumSchema = require('../../schemas/PremiumGuild');
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('toggle')
        .setDescription(' 📌| Toggle some bump settings.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('reminder')
                .setDescription('🔔 | Manage Bump Reminders!')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('autobump')
                .setDescription('🚀 | Manage Auto Bumping!')
        )
    	.addSubcommand(subcommand => 
            subcommand
              .setName("hide_bumps")
              .setDescription("📍 | Hide other servers in your bump channel.")
        ).toJSON(),
    run: async (client, interaction) => {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const subcommand = interaction.options.getSubcommand();

        // Cooldown Check
        if (cooldowns.has(userId)) {
            const remaining = cooldowns.get(userId) - Date.now();
            if (remaining > 0) {
                const embed = new EmbedBuilder()
                    .setDescription(`Please wait ${Math.ceil(remaining / 1000)} more second(s) before reusing the \`/setup\` command.`)
                    .setColor("4355FF");
                return interaction.reply({ embeds: [embed] });
            }
        }

        // Set a cooldown of 5 seconds
        cooldowns.set(userId, Date.now() + 5000);

        let responseMessage = '';
        let updatedValue = false;

        try {
            let bumpData = await BumpSchema.findOne({ guildID: interaction.guild.id });
            const premiumGuild = await PremiumSchema.findOne({ guildID: interaction.guild.id });
            const isPremium = !!premiumGuild;

            switch (subcommand) {
                case 'reminder':
                    bumpData.reminder = !bumpData.reminder;
                    await bumpData.save();
                    updatedValue = bumpData.reminder;
                    responseMessage = `**Reminders ${updatedValue ? 'enabled' : 'disabled'}!** You will ${updatedValue ? 'now' : 'no longer'} receive bump reminders.`;
                    break;
                case 'autobump':
                    if (!isPremium) {
                        const embed = new EmbedBuilder()
                            .setDescription("💎 Looks like you found a **Premium Feature!** \n > You can purchase premium here: https://bumping.ltd/premium")
                            .setColor("FF0000");
                        return interaction.reply({ embeds: [embed], ephemeral: false });
                    }
                    bumpData.autobump = !bumpData.autobump;
                    await bumpData.save();
                    updatedValue = bumpData.autobump;
                    responseMessage = `**Autobumping ${updatedValue ? 'enabled' : 'disabled'}!** Your server will ${updatedValue ? 'now' : 'not'} be bumped automatically.`;
                    break;
                case 'hide_bumps':
                    if (!isPremium) {
                        const embed = new EmbedBuilder()
                            .setDescription("💎 Looks like you found a **Premium Feature!** \n > You can purchase premium here: https://bumping.ltd/upgrade")
                            .setColor("FF0000");
                        return interaction.reply({ embeds: [embed], ephemeral: false });
                    }
                    bumpData.hideBumps = !bumpData.hideBumps;
                    await bumpData.save();
                    updatedValue = bumpData.hideBumps;
                    responseMessage = `**Hiding bumps is now ${updatedValue ? 'enabled' : 'disabled'}!** Your server will ${updatedValue ? 'not' : 'now'} be shown other server bumps.`;
                    break;
            }

            const embed = new EmbedBuilder()
                .setDescription(responseMessage)
                .setColor("4355FF");

            interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            interaction.reply('There was an error processing your request.');
        }
    },
};