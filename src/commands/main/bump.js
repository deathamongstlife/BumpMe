const { 
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, Client 
} = require('discord.js');
const BumpSchema = require('../../schemas/Bump');
const PremiumSchema = require('../../schemas/PremiumGuild');
const ProfileSchema = require('../../schemas/profile');
const RateSchema = require('../../schemas/Rate');
const BlacklistSchema = require('../../schemas/blacklistedGuilds');
const Ads = require('../../schemas/Advertisements');
const BlacklistedUsersSchema = require('../../schemas/blacklistedUsers');
const cooldowns = new Map();
const BumpQueue = require('../../schemas/BumpQueue.js');
let isProcessingQueue = false;
const ERROR_CHANNEL_ID = '1300124658758320128';

const API_REQUEST_DELAY = 100; // 2 seconds between API requests
const BUMP_RATIO = { PREMIUM: 1.0, NON_PREMIUM: 0.6 }; // Sharding ratio
const MAX_CONCURRENT_BUMPS = 100; // Reduced to minimize memory usage

async function isValidInvite(client, invite) {
    try {
        await client.fetchInvite(invite);
        return true;
    } catch {
        return false;
    }
}

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

async function processBumpQueue(client) {
    if (isProcessingQueue) return;

    isProcessingQueue = true;

    try {
        const BATCH_SIZE = 5; // Process 5 servers at a time
        const WAIT_TIME = 5 * 60 * 1000; // Wait 5 minutes between batches

        while (true) {
            // Fetch the next unprocessed bumps from the database
            const bumpsToProcess = await BumpQueue.find({ processed: false })
                .sort({ createdAt: 1 }) // Process oldest first
                .limit(BATCH_SIZE);

            if (bumpsToProcess.length === 0) {
                // No more bumps to process, exit the loop
                break;
            }

            for (const bumpData of bumpsToProcess) {
                // Mark bump as processed
                await BumpQueue.findByIdAndUpdate(bumpData._id, { $set: { processed: true } });

                const { guildId, userId, serverName } = bumpData;

                // Fetch the guild from the client using the guildId
                const guild = await client.guilds.cache.get(guildId);
                if (!guild) {
                    // If the guild is not found, delete the bump data and continue
                    await BumpQueue.findByIdAndDelete(bumpData._id);
                    continue;
                }

                const isPremium = !!await PremiumSchema.findOne({ guildID: guildId });
                const shardRatio = isPremium ? BUMP_RATIO.PREMIUM : BUMP_RATIO.NON_PREMIUM;

                if (!bumpData.invite || !(await isValidInvite(client, bumpData.invite))) {
                    await handleInvalidInvite(client, guildId, serverName);
                    continue;
                }

                const allGuilds = await BumpSchema.find({ enabled: true });
                const totalTargetGuilds = Math.ceil(allGuilds.length * shardRatio);
                const targetGuilds = allGuilds.slice(0, totalTargetGuilds);

                let successfulBumps = 0;

                // Process target guilds sequentially
                for (const targetGuild of targetGuilds) {
                    const wasSuccessful = await processTargetGuild(client, targetGuild, bumpData);
                    if (wasSuccessful) successfulBumps++;
                }

                // Log details to a Discord channel
                const logChannelId = '1300125021972201482'; // Replace with the ID of your log channel
                const logChannel = client.channels.cache.get(logChannelId);

                if (logChannel) {
                    const successRate = isPremium ? '100%' : '60%';

                    const logMessage = `
                    🔔 **Bump Report**
                    **Server Name:** ${serverName}
                    **User ID:** ${userId}
                    **Expected Successful Servers:** ${totalTargetGuilds}
                    **Successful Servers:** ${successfulBumps}
                    **Bump Ratio:** ${successRate}
                    `;

                    await logChannel.send(logMessage);
                }

                console.log(`Server "${serverName}" was successfully bumped to ${successfulBumps} servers out of ${totalTargetGuilds} expected.`);

                await updateBumpCounts(guildId, userId);

                console.log(`User with ID ${userId} has bumped the server "${serverName}"`);

                // Remove the processed bump from the database
                await BumpQueue.findByIdAndDelete(bumpData._id);
            }

        }
    } catch (error) {
        await logError(client, error, 'Error processing bump queue');
    } finally {
        isProcessingQueue = false;
    }
}

async function handleInvalidInvite(client, guildId, serverName) {
    try {
        await BumpSchema.findOneAndUpdate(
            { guildID: guildId },
            { $set: { enabled: true, inviteLink: null }, $unset: { lastBumpedChannel: "", lastBumpedUser: "", cooldownEnd: "" } }
        );
    } catch (error) {
      console.log(error)
    }
}

async function updateBumpCounts(guildId, userId) {
    try {
        // Update the guild's bump count
        await BumpSchema.findOneAndUpdate({ guildID: guildId }, { $inc: { BumpCount: 1 } });

        // Update the user's bump count
        await ProfileSchema.findOneAndUpdate({ userID: userId }, { $inc: { Bumps: 1 } });
    } catch (error) {
        throw new Error(`Error updating bump counts for guild ${guildId} and user ${userId}: ${error.message}`);
    }
}


async function processTargetGuild(client, targetGuildConfig, bumpData) {
    const { guildId, userId, serverName, memberCount, createdAt, bumpMessage, invite, hexColor, bannerURL } = bumpData;
    const { guildID, channelID, hideBumps } = targetGuildConfig;

    // If the target guild is the same as the source guild or bumps are hidden, skip processing
    if (guildID === guildId || hideBumps) return false; // Return false for skipped processing

    const targetChannel = client.channels.cache.get(channelID);
    if (!targetChannel) return false; // Return false if the channel is not found

    // Create buttons for the embed
    const joinButton = new ButtonBuilder().setLabel('Join Server').setURL(`${invite}`).setStyle(ButtonStyle.Link);
    const reportButton = new ButtonBuilder().setLabel('Report').setCustomId(`report_${guildId}`).setStyle(ButtonStyle.Danger);
    const bumpInfoButton = new ButtonBuilder().setCustomId('BumpInfoBtn').setLabel('BumpMe - Info').setStyle(ButtonStyle.Secondary);
    const row = new ActionRowBuilder().addComponents(joinButton, reportButton);

    // Format the createdAt timestamp
    const createdAtString = Math.floor(createdAt?.getTime() / 1000);
    const embedColor = hexColor || "#fe4248";

    const user = client.users.cache.get(userId);

    // Create the embed for the bump message
    const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle(serverName)
        .addFields(
            { name: "General Information", value: `**Members:** ${memberCount}\n**Created:** <t:${createdAtString}:R>` },
            { name: "Server Description", value: bumpMessage || 'No description provided.' }
        )
        .setImage(bannerURL || 'https://example.com/default-banner.png')
        .setFooter({ text: `Bumped by ${user?.username || 'Unknown User'}` });

    try {
        // Send the embed to the target guild's channel
        await targetChannel.send({ content: `📌 ${invite}`, embeds: [embed], components: [row] });

        console.log(`Server ID: ${guildId} has just bumped to ${guildID}`);
        return true; // Return true on successful bump
    } catch (error) {
        // Handle errors while sending the message
        await handleSendError(client, error, guildID, channelID);
        return false; // Return false on failure
    }
}



async function handleSendError(client, error, guildID, channelID) {
    if (error.code === 50013) { // Missing Permissions
        await BumpSchema.findOneAndUpdate({ guildID }, { channelID: null, enabled: false });
    } else if (error.code === 10003) { // Unknown Channel
        await BumpSchema.findOneAndUpdate({ guildID }, { channelID: null, enabled: false });
    } else {
        await logError(client, error, `Sending bump message to guild ${guildID}`);
    }
}

async function autobumpGuild(client, guildId) {
    try {
        const bumpConfig = await BumpSchema.findOne({ guildID: guildId });
        if (!bumpConfig || !bumpConfig.enabled) return;

        const guild = client.guilds.cache.get(guildId);
        if (!guild) return;

        const { name: serverName, memberCount, createdAt } = guild;
        const { message: bumpMessage, inviteChannelID, hexColor, bannerURL } = bumpConfig;

        console.log(`[PREMIUM] Added ${guildId} to the bump queue.`)

        const inviteChannel = client.channels.cache.get(inviteChannelID);
        if (!inviteChannel) return;

        const invite = await inviteChannel.createInvite({ maxAge: 0, maxUses: 0 }).catch(() => null);
        if (!invite) return;

        const bumpData = {
            guildId: guildId,  // Getting the guild (server) ID
            userId: client.user.id,    // Getting the user ID (assuming the interaction initiator is the user)
            serverName,
            memberCount,
            createdAt,
            bumpMessage,
            invite: invite.url,
            hexColor,
            bannerURL,
        };

        console.log(`[PREMIUM DATA]: \n `, bumpData)

        await BumpQueue.create(bumpData); // Save the bump data to the queue
    } catch (error) {
        await logError(client, error, `Auto-bump for guild ${guildId}`);
    }
}



async function startAutobump(client) {
    setInterval(async () => {
        const premiumGuilds = await PremiumSchema.find({});
        for (const premiumGuild of premiumGuilds) {
            const bumpConfig = await BumpSchema.findOne({ guildID: premiumGuild.guildID });
            if (bumpConfig && bumpConfig.autobump) {
                await autobumpGuild(client, premiumGuild.guildID);
            }
        }
    }, 60 * 60 * 1000); // Every 30 minutes

  setInterval(async () => {
    processBumpQueue(client);
  }, 5 * 60 * 1000); // Every 30 minutes
} // Ensure this closing brace exists





module.exports = {
    data: new SlashCommandBuilder()
        .setName('bump')
        .setDescription('🚀 • Bump your server!'),
    testOnly: true,
    run: async (client, interaction) => {
        await interaction.deferReply();

        const guildId = interaction.guild.id;
        const userId = interaction.user.id;
        const standardCooldownAmount = 2 * 60 * 60 * 1000;
        const premiumCooldownAmount = 60 * 60 * 1000;
        const isPremium = await PremiumSchema.exists({ guildID: guildId });
        const UserProfile = await ProfileSchema.findOne({UserID: userId});
        const cooldownAmount = isPremium ? premiumCooldownAmount : standardCooldownAmount;
        
                if (cooldowns.has(userId)) {
            const remaining = cooldowns.get(userId) - Date.now();
            if (remaining > 0) {
                const embed = new EmbedBuilder()
                	.setTitle("Slow Down!")
                    .setDescription(`Please wait ${Math.ceil(remaining / 1000)} more second(s) before reusing the \`/bump\` command.`)
                    .setColor("#fe4248");
                return interaction.editReply({ embeds: [embed] });
            }
        }
       

        // Set a cooldown of 5 seconds
        cooldowns.set(userId, Date.now() + 15000);
        
        const bumpConfig = await BumpSchema.findOne({ guildID: guildId });
        
        if (bumpConfig && bumpConfig.autobump) {
            const AutoShareEmbed = new EmbedBuilder()
            .setTitle("Autosharing Enabled")
            .setDescription("Manual bumping is `disabled` whilst autosharing is `enabled`. \n > If you would prefer to manually bump your server, you can toggle autobump using `toggle autobump`!")
            .setColor("#fe4248")
            
            return await interaction.editReply({embeds: [AutoShareEmbed]})
        }
        
        if (!bumpConfig || !bumpConfig.enabled) {
            let errorMessage = '';
            const dotEmoji = '<:arrow:1307458715473154048>';
            if (!bumpConfig) {
                errorMessage += `${dotEmoji} \`Required\` **Server Description** \n`;
                errorMessage += `${dotEmoji} \`Required\` **Bump Channel** \n`;
                errorMessage += `${dotEmoji} \`Required\` **Server Invite** \n`;
            } else {
                if (!bumpConfig.message) {
                    errorMessage += `${dotEmoji} \`Required\` **Server Description** \n`;
                }
                if (!bumpConfig.channelID) {
                    errorMessage += `${dotEmoji} \`Required\` **Bump Channel** \n`;
                }
                if (!bumpConfig.inviteChannelID || bumpConfig.inviteLink) {
                    errorMessage += `${dotEmoji} \`Required\` **Server Invite** \n`;
                }
            }
            
            if (errorMessage === null) {
                return interaction.reply("⚠️ You have fully setup your server, but we cannot recognise it has been enabled. Please visit the support server [here.](https://discord.gg/m5bxvGfqmz) and tell us your Server ID.")
            }
            
            const errorEmbed = new EmbedBuilder()
                .setColor("#fe4248")
                .setTitle('Missing Setup Requirements')
                .setDescription(errorMessage)
            	.setFooter({
                    text: `Setup your server with our new dashboard, run /dashboard to continue.`
                })
            return await interaction.editReply({ embeds: [errorEmbed], ephemeral: false });
        }

        const isUserBlacklisted = await BlacklistedUsersSchema.exists({ userID: interaction.user.id });
        if (isUserBlacklisted) {
            const Embed = new EmbedBuilder()
            .setTitle("<:report:1367365882220777522> User Suspended")
            .setDescription("You have been suspended from the use of **BumpMe**. \n > *For more information, please join the support server [here](https://discord.gg/f75Qytv9cT)*.")
            .setColor('#fe4248')
            
            return await interaction.editReply({embeds: [Embed]})
        }
        
        const isBlacklisted = await BlacklistSchema.exists({ guildID: guildId });
        if (isBlacklisted) {
            const Embed = new EmbedBuilder()
            .setTitle("<:report:1367365882220777522> Guild Suspended")
            .setDescription("Your guild has been suspended from the use of **BumpMe**. \n > *For more information, please join the support server [here](https://discord.gg/f75Qytv9cT)*.")
            .setColor('#fe4248')
            
            return await interaction.editReply({embeds: [Embed]})
        }
        
        if (bumpConfig.cooldownEnd) {
            const CooldownEmbed = new EmbedBuilder()
            .setColor('#fe4248')
            .setTitle("Server On Cooldown!")
            .setDescription(`**This server is on cooldown.** You can bump again <t:${bumpConfig.cooldownEnd}:R>!`)
            .setImage('https://media.discordapp.net/attachments/1253798954928443503/1295769391102693517/New_Project_3.png?ex=670fdac9&is=670e8949&hm=aae1c7bc8668312c8e251753edb206eb1b2b637f7593c3fcd4266f23baab8fad&=&format=webp&quality=lossless&width=1207&height=73');
            return await interaction.editReply({ embeds: [CooldownEmbed], ephemeral: true });
        }

        const serverName = interaction.guild.name;
        const memberCount = interaction.guild.memberCount;
        const createdAt = interaction.guild.createdAt;
        const bumpMessage = bumpConfig.message;
        const inviteChannel = client.channels.cache.get(bumpConfig.inviteChannelID);
        const inviteLink = bumpConfig.inviteLink
        const hexColor = bumpConfig.hexColor
        const bannerURL = bumpConfig.bannerURL

      
        
       const bumpChannel = client.channels.cache.get(bumpConfig.channelID);

        if (!bumpChannel) {
            const dotEmoji = '<:arrow:1307458715473154048>';
            const errEmbed = new EmbedBuilder()
                .setColor('#fe4248')
                .setTitle('Error Updating Bump Channel')
                .setDescription(
                    `**Missing Channel:**\n` +
                    `${dotEmoji} The configured bump channel was not found.\n\n` +
                    `**Support:**\n` +
                    `${dotEmoji} Please configure a valid bump channel and try again\n` +
                    `${dotEmoji} For further help, join our [support server](https://discord.gg/f75Qytv9cT)`
                );

            return await interaction.editReply({ embeds: [errEmbed], ephemeral: true });
        }

        const everyoneRole = interaction.guild.roles.everyone;
        const missingPermissions = [];
        const dotEmoji = '<:arrow:1307458715473154048>';

        if (!bumpChannel.permissionsFor(everyoneRole).has('ViewChannel')) {
            missingPermissions.push(`${dotEmoji} View Channel (@everyone)`);
        }
        if (!bumpChannel.permissionsFor(everyoneRole).has('ReadMessageHistory')) {
            missingPermissions.push(`${dotEmoji} Read Message History (@everyone)`);
        }

        if (missingPermissions.length > 0) {
            const errEmbed = new EmbedBuilder()
                .setColor('#fe4248')
                .setTitle('Error Updating Bump Channel')
                .setDescription(
                    `**Missing Permissions:**\n` +
                    `${missingPermissions.join('\n')}\n\n` +
                    `**Support:**\n` +
                    `${dotEmoji} Please correct permissions and try again\n` +
                    `${dotEmoji} For further help, join our [support server](https://discord.gg/f75Qytv9cT)`
                );

            return await interaction.editReply({ embeds: [errEmbed], ephemeral: true });
        }

        let invite;
        if (!inviteChannel) {
            return await interaction.editReply('❌ Your invite channel is invalid/deleted. Please reset it using `/setup invite`.');
        }
        
        if (inviteLink === null) {
            try {
               invite = await inviteChannel.createInvite({ maxAge: 0, maxUses: 0 });
               bumpConfig.inviteLink = invite;
               bumpConfig.save();
            } catch (error) {
                console.log('Error creating invite:', error);
                return await interaction.editReply('❌ Failed to create an invite link.')
            }
        } else {
            invite = bumpConfig.inviteLink;
        }

        const bumpData = {
            guildId: interaction.guild.id,  // Getting the guild (server) ID
            userId: interaction.user.id,    // Getting the user ID (assuming the interaction initiator is the user)
            serverName,
            memberCount,
            createdAt,
            bumpMessage,
            invite: bumpConfig.inviteLink,
            hexColor,
            bannerURL,
        };

        console.log(bumpData)
        await BumpQueue.create(bumpData);


        const supportServerId = '1241692906583097475';
        const supportChannelId = '1299841923321696266';
        const supportChannel = client.channels.cache.get(supportChannelId);

        if (supportChannel) {
            
        const embed = new EmbedBuilder()
        .setTitle("New Bump")
        .addFields(
            {
                name: "> Server:",
                value: `${dotEmoji} \`${interaction.guild.name}\``
            },
            {
                name: "> Auto?:",
                value: `${dotEmoji} \`False\``,
            },
            {
                name: "> Bumped By:",
                value: `${dotEmoji} \`${interaction.user.tag}\``,
            }
        )
        .setThumbnail(interaction.guild.iconURL())
        .setColor("#fe4248")
        .setImage("https://media.discordapp.net/attachments/1253798954928443503/1295769391102693517/New_Project_3.png?ex=670fdac9&is=670e8949&hm=aae1c7bc8668312c8e251753edb206eb1b2b637f7593c3fcd4266f23baab8fad&=&format=webp&quality=lossless&width=1207&height=73")
        await supportChannel.send({ embeds: [embed ]});
        }
        
        const cooldown = isPremium ? 30 * 60 * 1000 : 60 * 60 * 1000;
        const cooldownEnd = Math.floor((Date.now() + cooldown)  / 1000 );
        
        const Data = await BumpSchema.findOneAndUpdate(
                {
                    guildID: interaction.guild.id,
                },
                {
                    $set: {
                        cooldownEnd: cooldownEnd,
                        lastBumpedUser: interaction.user.id,
                        lastBumpedChannel: interaction.channel.id,
                    }
                })
        console.log("Set Cooldown.")
        const totalServers = client.guilds.cache.size - 1;
        const enabledServers = await BumpSchema.countDocuments({ enabled: true });
        const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0).toLocaleString();
        const Dot = '<:arrow:1307458715473154048>';
        const EstimatedBumpTime = Math.floor(Date.now() /1000 +60)

        const successEmbed = new EmbedBuilder()
            .setColor('#fe4248')
            .setTitle('Successful Bump!')
            .addFields(
                {
                    name: "> Shared To",
                    value: `${Dot} \`${totalServers}\` servers.\n` + 
                           `${Dot} \`${totalMembers}\` users reached.`
                },
                {
                    name: "> Cooldown Expires:", // Example of another field
                    value: `${Dot} <t:${cooldownEnd}:R>`
                },
                {
                    name: "> Did you know?",
                    value: `${Dot} You can hide your bump channel and customize your advertisement with many features by purchasing [**premium**](https://www.bumping.ltd/premium). \n` +
                    `${Dot} You can get **FREE** Premium by voting for us on [**Top.gg**](https://top.gg/bot/1265343375054340160)`
                }
            )
            .setImage('https://media.discordapp.net/attachments/1253798954928443503/1295769391102693517/New_Project_3.png?ex=670fdac9&is=670e8949&hm=aae1c7bc8668312c8e251753edb206eb1b2b637f7593c3fcd4266f23baab8fad&=&format=webp&quality=lossless&width=1207&height=73');
        
        const embed = new EmbedBuilder()
        .setColor("#75ff4f")
        .setDescription("🚀 [**Join Discord Promotions and get growing your server like never before.**](https://discord.gg/RJh763aF)")
        
        await interaction.editReply({embeds: [successEmbed, embed]})
    },
    startAutobump, // Export the startAutobump function
}
