const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const BumpSchema = require('../../schemas/Bump');
const PremiumGuild = require('../../schemas/PremiumGuild'); // Ensure this path is correct

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('📌| Information commands.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('bot')
                .setDescription('📌 | Get bot information.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('server')
                .setDescription('📌| Get server information.')
                .addStringOption(option =>
                    option.setName('server_id')
                        .setDescription('The server ID to get information for')
                        .setRequired(false))
        ).toJSON(),
    run: async (client, interaction) => {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'bot') {
            // Reset bot info variables for each execution
            let totalSeconds = 0, days = 0, hours = 0, minutes = 0, seconds = 0;
            let bumpData = [], totalBumps = 0, totalMembers = 0;

            // Bot uptime
            totalSeconds = process.uptime();
            days = Math.floor(totalSeconds / 86400);
            hours = Math.floor(totalSeconds / 3600) % 24;
            minutes = Math.floor(totalSeconds / 60) % 60;
            seconds = Math.floor(totalSeconds % 60);
            const uptime = `${days}d, ${hours}h, ${minutes}m, ${seconds}s`;

            // Fetch bump data (ensuring fresh state)
            bumpData = await BumpSchema.find();
            totalBumps = bumpData.reduce((acc, bump) => acc + (bump.BumpCount || 0), 0).toLocaleString();

            // Fetch total members count across all guilds
            totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0).toLocaleString();

            // Prepare bot information embed
            const embed = new EmbedBuilder()
                .setTitle('BumpMe Information')
                .addFields(
                    { name: '<:members:1367367425674448976> • Developer Information', value: `\`\`\`Developer   ➜ @axylis_dev\nID          ➜ 1002142393442762792\nCo-Developer   ➜ @xgg69420x\nID          ➜ 1302806745294307452\`\`\`` },
                    { name: '<:members:1367367425674448976> • Owner Information', value: `\`\`\`Owner       ➜ @the_mf_princess\nID          ➜ 1130886272550981662\nCo-Owner       ➜ @xgg69420x\nID          ➜ 1302806745294307452\`\`\`` },
                    { name: '<:pin:1367367193389568032> • Bot Information', value: `\`\`\`Name        ➜ ${client.user.tag}\nID          ➜ ${client.user.id}\nPing        ➜ ${client.ws.ping}ms\nPrefix      ➜ /\`\`\`` },
                    { name: '<:rocket:> • Bot Stats', value: `\`\`\`Total Servers ➜ ${client.guilds.cache.size}\nTotal Users   ➜ ${totalMembers}\nUptime        ➜ ${uptime}\`\`\`` }
                )
                .setColor('#3064FF')
                .setFooter({ text: `Requested by ${interaction.user.username}.`, iconURL: interaction.user.avatarURL() });

            await interaction.reply({ embeds: [embed] });
        } else if (subcommand === 'server') {
            // Reset server-related variables for each execution
            let premiumGuild = null;
            let premiumStatus = 'False';
            let expiryDate = 'Not Activated'; // Default to "Not Activated"

            const serverId = interaction.options.getString('server_id') || interaction.guild.id;
            const server = client.guilds.cache.get(serverId);

            if (!server) {
                return interaction.reply({ content: 'Server not found.', ephemeral: true });
            }

            // Fetch premium data for the server
            premiumGuild = await PremiumGuild.findOne({ guildID: serverId });

            // If premiumGuild is found, check expiry
            if (premiumGuild) {
                premiumStatus = 'True';
                expiryDate = premiumGuild.expiresAt
                    ? premiumGuild.expiresAt.toLocaleString()
                    : 'Lifetime'; // If no expiry date, mark it as "Lifetime"
            }

            const embed = new EmbedBuilder()
                .setTitle(`Server Information`)
                .addFields(
                    { name: '🏠 • Server Information', value: `\`\`\`Server Name  ➜ ${server.name}\nServer ID    ➜ ${server.id}\nMember Count ➜ ${server.memberCount.toLocaleString()}\`\`\`` },
                    { name: '<:pin:1367367193389568032> • Premium Information', value: `\`\`\`Premium        ➜ ${premiumStatus}\nExpiry         ➜ ${expiryDate}\`\`\`` }
                )
                .setColor('#3064FF')
                .setFooter({ text: `Requested by ${interaction.user.username}.`, iconURL: interaction.user.avatarURL() });

            await interaction.reply({ embeds: [embed] });
        }
    },
};
