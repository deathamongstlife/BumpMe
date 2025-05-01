const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    ChannelType,
    ModalBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require('discord.js');
const BumpSchema = require('../../schemas/Bump');
const PremiumSchema = require('../../schemas/PremiumGuild');
const cooldowns = new Map();

// Function to create or update BumpSchema document
async function CreateBumpSchema(guildID, channelID = null, inviteChannelID = null, message = null, hexColor = null, bannerURL = null, BumpCount = 0) {
    let bumpData = await BumpSchema.findOne({ guildID: guildID });

    // If bumpData doesn't exist, create a new document
    if (!bumpData) {
        bumpData = new BumpSchema({
            guildID: guildID,
            channelID: channelID,
            inviteChannelID: inviteChannelID,
            message: message,
            hexColor: hexColor,
            bannerURL: bannerURL,
            BumpCount: BumpCount
        });
        await bumpData.save();
    } else {
        // Update existing document with provided values
        bumpData.channelID = channelID !== null ? channelID : bumpData.channelID;
        bumpData.inviteChannelID = inviteChannelID !== null ? inviteChannelID : bumpData.inviteChannelID;
        bumpData.message = message !== null ? message : bumpData.message;
        bumpData.hexColor = hexColor !== null ? hexColor : bumpData.hexColor;
        bumpData.bannerURL = bannerURL !== null ? bannerURL : bumpData.bannerURL;
        bumpData.BumpCount = BumpCount !== null ? BumpCount : bumpData.BumpCount;

        await bumpData.save();
    }
    return bumpData;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('🔧| Setup your discord server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('description')
                .setDescription('📜 | Set your server advertisement description.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('channel')
                .setDescription('🌐 | Set the bump channel.')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('🌐 | Provide the bump channel.')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('invite')
                .setDescription('🌐 | Set the invite channel.')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('🌐 | Provide the invite channel.')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('color')
                .setDescription('🎨 | Set the hex color for your server bump message (Premium Only).')
                .addStringOption(option =>
                    option
                        .setName('hex')
                        .setDescription('🎨 | Provide a valid hex color code (e.g., #ff0000).')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('banner')
                .setDescription('🖼 | Set the banner image for your bump message (Premium Only).')
                .addAttachmentOption(option =>
                    option
                        .setName('image')
                        .setDescription('🖼 | Upload an image for the banner.')
                )
        )
        .toJSON(),

    run: async (client, interaction) => {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const subcommand = interaction.options.getSubcommand();

        // Cooldown Check
        if (cooldowns.has(userId)) {
            const remaining = cooldowns.get(userId) - Date.now();
            if (remaining > 0) {
                const embed = new EmbedBuilder()
                    .setDescription(`Please wait ${Math.ceil(remaining / 1000)} more second(s) before reusing the /setup command.`)
                    .setColor("fe4248");
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }

        // Set a cooldown of 5 seconds
        cooldowns.set(userId, Date.now() + 5000);

        const embed = new EmbedBuilder().setColor("fe4248");

        // Check if the server is premium
        const premiumData = await PremiumSchema.findOne({ guildID: guildId });
        const isPremium = !!premiumData;

        switch (subcommand) {
            case 'description': {
                const maxChars = isPremium ? 1000 : 500;

                const descriptionModal = new ModalBuilder()
                    .setTitle('Bump Message')
                    .setCustomId('serverMessageMdl')
                    .setComponents(
                        new ActionRowBuilder().setComponents(
                            new TextInputBuilder()
                                .setLabel('Server Description')
                                .setCustomId('ServerDesc')
                                .setPlaceholder('Please provide the server description.')
                                .setMaxLength(maxChars)
                                .setMinLength(50)
                                .setStyle(TextInputStyle.Paragraph)
                        ),
                    );

                return interaction.showModal(descriptionModal);
            }

            case 'channel': {
                await interaction.deferReply({ ephemeral: false });
                
                const bumpChannel = interaction.options.getChannel('channel');

                if (!bumpChannel) {
                    embed.setDescription('✖️ You must provide a valid bump channel.');
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                // Save the bump channel in the database
                await CreateBumpSchema(guildId, bumpChannel.id);

                embed.setDescription(`<:tick:1292425348008382504> Done, Bump channel has been set to: <#${bumpChannel.id}>`);
                await interaction.followUp({ embeds: [embed], ephemeral: true });
                break;
            }

            case 'invite': {
                await interaction.deferReply({ ephemeral: false });

                const inviteChannel = interaction.options.getChannel('channel');

                if (!inviteChannel) {
                    embed.setDescription('✖️ You must provide a valid invite channel.');
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                // Save the invite channel in the database
                await CreateBumpSchema(guildId, null, inviteChannel.id);

                embed.setDescription(`<:tick:1367369982802919434> Done, invite channel has been set to: <#${inviteChannel.id}>`);
                await interaction.followUp({ embeds: [embed], ephemeral: true });
                break;
            }

            case 'color': {
                if (!isPremium) {
                    embed.setDescription('This feature is only available for premium servers.');
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                const hexColor = interaction.options.getString('hex');
                const isValidHex = /^#[0-9A-F]{6}$/i.test(hexColor);

                if (!isValidHex) {
                    embed.setDescription('Invalid hex color code. Please provide a valid hex code (e.g., #ff0000).');
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                const bumpData = await BumpSchema.findOne({ guildID: guildId });

                if (!bumpData) {
                    embed.setDescription('You must set up your bump channels before configuring the color.');
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                await CreateBumpSchema(guildId, bumpData.channelID, bumpData.inviteChannelID, bumpData.message, hexColor, bumpData.imageURL);

                embed.setDescription(`Color has been set to: ${hexColor}`);
                await interaction.reply({ embeds: [embed], ephemeral: true });
                break;
            }

            case 'banner': {
                if (!isPremium) {
                    embed.setDescription('This feature is only available for premium servers.');
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                const attachment = interaction.options.getAttachment('image');
                const bannerUrl = attachment ? attachment.url : null;

                if (!bannerUrl) {
                    embed.setDescription('Please provide a banner URL or attach an image file.');
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                const bumpData = await BumpSchema.findOne({ guildID: guildId });

                if (!bumpData) {
                    embed.setDescription('You must set up your bump channels before configuring the banner.');
                    return interaction.reply({ embeds: [embed], ephemeral: true });
                }

                await CreateBumpSchema(guildId, bumpData.channelID, bumpData.inviteChannelID, bumpData.message, bumpData.hexColor, bannerUrl);

                embed.setDescription(`Banner has been set to: [Click Here](${bannerUrl})`);
                await interaction.reply({ embeds: [embed], ephemeral: true });
                break;
            }

            default:
                embed.setDescription('Unknown subcommand.');
                await interaction.editReply({ embeds: [embed] });
        }

        // Check if all necessary values are set and update enabled status accordingly
        const bumpData = await BumpSchema.findOne({ guildID: guildId });
        if (bumpData) {
            const { channelID, inviteChannelID, message } = bumpData;
            if (channelID && inviteChannelID && message) {
                bumpData.enabled = true;
                await bumpData.save();
            }
        }
    },
};
