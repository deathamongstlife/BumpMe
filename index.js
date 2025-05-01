require("dotenv/config");

const { Client, GatewayIntentBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, Options  } = require("discord.js");

const { AutoPoster } = require('topgg-autoposter')
const eventHandler = require("./src/handlers/eventHandler.js");
const cron = require('node-cron');
const BlacklistGuildSchema = require('./src/schemas/blacklistedGuilds');
const BlacklistUserSchema = require('./src/schemas/blacklistedUsers');
const ReportSchema = require('./src/schemas/reportSchema');
const BumpSchema = require('./src/schemas/Bump');
const ProfileSchema = require('./src/schemas/profile');
const REPORT_CHANNEL_ID = '1300125251132330124'; // Replace with your actual report channel ID



const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.GuildMembers,
  ],
  makeCache: Options.cacheWithLimits({
    MessageManager: 50, // Limit the number of messages cached
    PresenceManager: 0, // Disable presence caching
  }),
});

const ap = AutoPoster('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyNjUzNDMzNzUwNTQzNDAxNjAiLCJib3QiOnRydWUsImlhdCI6MTczMDEzNTM3MH0.iR08ubOVuIg7EurP3bPMesXO6cSZiQOwclbqSXO1tjg', client)

ap.on('posted', () => {
  console.log('Posted stats to Top.gg!')
})

const checkPremiumExpiry = require('./src/utils/checkPremiumExpiry.js');
const BumpExpiryCheck = require('./src/utils/BumpExpiry.js');
const checkEnabledServers = require('./src/utils/checkEnabledServers.js');
const VoteChecker = require('./src/utils/voteChecking.js');
const VoteExpiryChecker = require('./src/utils/VoteExpiryNotification.js');
const ApprovalsChecker = require('./src/utils/ApprovalsChecker.js');

// Run tasks immediately when the bot starts up
checkPremiumExpiry(client).catch(error => console.error('Error checking premium expiry on startup:', error));
//checkEnabledServers(client).catch(error => console.error('Error checking enabled servers on startup:', error));
VoteChecker(client).catch(error => console.error('Error checking votes on startup:', error));
VoteExpiryChecker(client).catch(error => console.error('Error checking vote expiry on startup:', error));
BumpExpiryCheck(client).catch(error => console.error('Error checking bump expiry on startup:', error));


cron.schedule('* * * * *', () => {
  checkPremiumExpiry(client).catch(error => console.error('Error checking premium expiry:', error));
});

cron.schedule('*/3 * * * * *', () => {
  VoteChecker(client).catch(error => console.error('Error checking votes:', error));
});

cron.schedule('*/3 * * * * *', () => {
  VoteExpiryChecker(client).catch(error => console.error('Error checking vote expiry:', error));
});

cron.schedule('* * * * *', () => {
  BumpExpiryCheck(client).catch(error => console.error('Error checking bump expiry:', error));
});

const CHANNEL_ID = '1300125182093955083';
let apiRequestCount = 0;

client.rest.on('response', () => {
    apiRequestCount++;
    console.log("Request has been made.")
})

// Function to send the API request count to a specific channel every 10 minutes
setInterval(() => {
   console.log("Gathering API data")
  const channel = client.channels.cache.get(CHANNEL_ID);
  if (channel) {
    if (apiRequestCount > 5000) {
        channel.send(`<@1302806745294307452>, you are getting close to the rate limit (10k) \n Current Count ${apiRequestCount}`)
    } else {
        channel.send(`API requests in the last 10 minutes: ${apiRequestCount}`);
    }
  } else {
    console.log(`Channel with ID ${CHANNEL_ID} not found.`);
  }
  // Reset the counter after sending the message
  apiRequestCount = 0;
}, 10 * 60 * 1000); // 10 minutes in milliseconds


// Interaction handling
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

  if (interaction.customId.startsWith("report")) {
    const [action, guildId] = interaction.customId.split("_");

    if (action === "report") {
      try {
        console.log(`You have reported the guild ID: ${guildId}`);
        
        // Show the modal for report reason input
        const modal = new ModalBuilder()
          .setCustomId('reportModal')
          .setTitle('Report a Server');

        const reasonInput = new TextInputBuilder()
          .setCustomId('reasonInput')
          .setLabel('Reason for report')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        const actionRow = new ActionRowBuilder().addComponents(reasonInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);

        const filter = i => i.customId === 'reportModal' && i.user.id === interaction.user.id;
        const modalInteraction = await interaction.awaitModalSubmit({ filter, time: 60000 }).catch(() => null);

        if (!modalInteraction) {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.followUp({ content: 'You did not provide a reason in time!', ephemeral: true });
          }
          return;
        }

        const reason = modalInteraction.fields.getTextInputValue('reasonInput');

        const bumpConfig = await BumpSchema.findOne({ guildID: guildId });
        const guild = await client.guilds.fetch(guildId);
        const serverName = guild.name;
        const bumpMessage = bumpConfig ? bumpConfig.message : "No bump message available";
        const inviteLink = bumpConfig ? bumpConfig.inviteLink : "No invite link provided.";

        const reportEmbed = new EmbedBuilder()
          .setTitle('Server Report')
          .setColor("Red")
          .setDescription('A server has been reported.')
          .addFields(
            { name: 'Server Name', value: `\`${serverName}\``, inline: true },
            { name: 'Server ID', value: `\`${guildId}\``, inline: true },
            { name: 'Reason', value: `\`${reason}\``, inline: false },
            { name: 'Reporter', value: `\`${interaction.user.tag}\``, inline: false },
            { name: 'Reporter ID', value: `\`${interaction.user.id}\``, inline: true },
            { name: 'Server Description', value: `${bumpMessage}`, inline: false },
            { name: 'Server Invite', value: `${inviteLink}`, inline: false },
          )
          .setTimestamp();

        // Check if the guild or user is blacklisted
        const isGuildBlacklisted = await BlacklistGuildSchema.findOne({ guildID: guildId });
        const isUserBlacklisted = await BlacklistUserSchema.findOne({ userID: interaction.user.id });
          
        

        const reportID = Math.floor(Math.random() * 1000000).toString(); // Generate a random report ID

        const buttons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(isUserBlacklisted ? `unblockUser_${reportID}` : `blockUser_${reportID}`)
            .setLabel(isUserBlacklisted ? 'Unblock User' : 'Block User')
            .setStyle(isUserBlacklisted ? ButtonStyle.Primary : ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(isGuildBlacklisted ? `unblockServer_${reportID}` : `blockServer_${reportID}`)
            .setLabel(isGuildBlacklisted ? 'Unblock Server' : 'Block Server')
            .setStyle(isGuildBlacklisted ? ButtonStyle.Primary : ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`denyReport_${reportID}`)
            .setLabel('Deny Report')
            .setStyle(ButtonStyle.Secondary),
        );
          
        const lockThread = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`lockThread_${reportID}`)
            .setLabel('Lock Thread')
            .setStyle(ButtonStyle.Secondary)  // New Lock Thread button
        );

        const reportChannel = await client.channels.fetch(REPORT_CHANNEL_ID);
        if (!reportChannel) {
          if (!interaction.replied && !interaction.deferred) {
            return interaction.followUp({ content: 'Report channel not found.', ephemeral: true });
          }
        }
          
        if (isUserBlacklisted) {
            console.log("Didn't continue with reporting process.")
            return modalInteraction.reply({content: `<@${interaction.user.id}>, you are blacklisted from sending reports for **BumpMe**! This report has not been sent to our reports team.'`});
        }

        // Send the initial report message in the report channel
        const message = await reportChannel.send({ content: "<@&1300175095083302952> - This report requires your attention.", });

        // Create a thread for the report
        const thread = await message.startThread({
          name: `Reported Server: ${serverName}`,
          reason: `Reported by ${interaction.user.tag}`,
        });

        // Send the embed and buttons inside the thread
        const threadMessage = await thread.send({
          embeds: [reportEmbed],
          components: [buttons]
        });
          
        await thread.send({
            content: "Please lock the thread once finished!",
            components: [lockThread],
        });

        // Save the report data to the database
        await ReportSchema.create({
          guildID: guildId,
          userID: interaction.user.id,
          Reason: reason,
          messageID: reportID,
        });

        reportEmbed.setFooter({ text: `Report ID: ${reportID}` });
        await threadMessage.edit({ embeds: [reportEmbed] });

        await modalInteraction.reply({ content: `<@${interaction.user.id}>, your report has been submitted to our reports team! Thank you for helping  BumpMe keep safe.`, ephemeral: true });

      } catch (error) {
        console.error('Error handling report modal submission:', error);
      }
    }
} else if (interaction.customId.startsWith("blockServer") || interaction.customId.startsWith("unblockServer") || interaction.customId.startsWith("blockUser") || interaction.customId.startsWith("unblockUser") || interaction.customId.startsWith("denyReport") || interaction.customId.startsWith("lockThread")) {
  const [action, reportID] = interaction.customId.split("_");

  const report = await ReportSchema.findOne({ messageID: reportID });

  if (!report) {
    if (!interaction.replied && !interaction.deferred) {
      return interaction.reply({ content: 'Report not found.' });
    }
  }

  const { guildID, userID } = report;

  if (!guildID || !userID) {
    if (!interaction.replied && !interaction.deferred) {
      return interaction.reply({ content: 'Invalid report data.' });
    }
  }

  try {
    if (action === 'lockThread') {
      const thread = interaction.channel; // Assuming interaction is within the thread
      if (thread.isThread()) {
        await thread.setLocked(true);
        await interaction.reply({ content: 'The thread has been locked.' });
      } else {
        await interaction.reply({ content: 'This is not a thread.' });
      }
    } else {
      const modal = new ModalBuilder()
        .setCustomId('reasonModal')
        .setTitle('Provide a Reason');

      const reasonInput = new TextInputBuilder()
        .setCustomId('reasonInput')
        .setLabel('Reason')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const actionRow = new ActionRowBuilder().addComponents(reasonInput);
      modal.addComponents(actionRow);

      await interaction.showModal(modal);

      const filter = i => i.customId === 'reasonModal' && i.user.id === interaction.user.id;
      const modalInteraction = await interaction.awaitModalSubmit({ filter, time: 60000 }).catch(() => null);

      if (!modalInteraction) {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.followUp({ content: 'You did not provide a reason in time!' });
        }
        return;
      }

      const reason = modalInteraction.fields.getTextInputValue('reasonInput');
      const timestamp = new Date().toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });

      let embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTimestamp();

      let buttonRow; // Will hold the button row to be attached to the embed

      if (action === 'blockServer') {
        // Validation: Check if server is already blacklisted
        const existingGuild = await BlacklistGuildSchema.findOne({ guildID });
        if (existingGuild) {
          // Server is already blacklisted, so show "Unblock Server" button
          embed
            .setTitle('Server Already Blacklisted')
            .addFields(
              { name: 'Staff Tag', value: interaction.user.tag, inline: true },
              { name: 'Server ID', value: guildID, inline: true },
              { name: 'Reason', value: existingGuild.reason },
              { name: 'Timestamp', value: timestamp }
            );

          const unblockServerButton = new ButtonBuilder()
            .setCustomId(`unblockServer_${reportID}`)
            .setLabel('Unblock Server')
            .setStyle(ButtonStyle.Danger);

          buttonRow = new ActionRowBuilder().addComponents(unblockServerButton);

          return modalInteraction.reply({ embeds: [embed], components: [buttonRow] });
        }

        // Block the server
        await BlacklistGuildSchema.create({ guildID, reason });

        // Create an embed
        embed
          .setTitle('Server Blacklisted')
          .addFields(
            { name: 'Staff Tag', value: interaction.user.tag, inline: true },
            { name: 'Server ID', value: guildID, inline: true },
            { name: 'Reason', value: reason },
            { name: 'Timestamp', value: timestamp }
          );

        // Create the "Unblock Server" button
        const unblockServerButton = new ButtonBuilder()
          .setCustomId(`unblockServer_${reportID}`)
          .setLabel('Unblock Server')
          .setStyle(ButtonStyle.Danger);

        buttonRow = new ActionRowBuilder().addComponents(unblockServerButton);

        await modalInteraction.reply({ embeds: [embed], components: [buttonRow] });

      } else if (action === 'unblockServer') {
        // Validation: Check if server is actually blacklisted
        const existingGuild = await BlacklistGuildSchema.findOne({ guildID });
        if (!existingGuild) {
          return modalInteraction.reply({ content: `Server ${guildID} is not blacklisted!` });
        }

        // Unblock the server
        await BlacklistGuildSchema.deleteOne({ guildID });

        // Create an embed
        embed
          .setTitle('Server Unblocked')
          .addFields(
            { name: 'Staff Tag', value: interaction.user.tag, inline: true },
            { name: 'Server ID', value: guildID, inline: true },
            { name: 'Timestamp', value: timestamp }
          );

        // Create the "Block Server" button
        const blockServerButton = new ButtonBuilder()
          .setCustomId(`blockServer_${reportID}`)
          .setLabel('Block Server')
          .setStyle(ButtonStyle.Danger);

        buttonRow = new ActionRowBuilder().addComponents(blockServerButton);

        await modalInteraction.reply({ embeds: [embed], components: [buttonRow] });

      } else if (action === 'blockUser') {
        // Validation: Check if user is already blacklisted
        const existingUser = await BlacklistUserSchema.findOne({ userID });
        if (existingUser) {
          // User is already blacklisted, so show "Unblock User" button
          embed
            .setTitle('User Already Blacklisted')
            .addFields(
              { name: 'Staff Tag', value: interaction.user.tag, inline: true },
              { name: 'User ID', value: userID, inline: true },
              { name: 'Reason', value: existingUser.reason },
              { name: 'Timestamp', value: timestamp }
            );

          const unblockUserButton = new ButtonBuilder()
            .setCustomId(`unblockUser_${reportID}`)
            .setLabel('Unblock User')
            .setStyle(ButtonStyle.Danger);

          buttonRow = new ActionRowBuilder().addComponents(unblockUserButton);

          return modalInteraction.reply({ embeds: [embed], components: [buttonRow] });
        }

        // Block the user
        await BlacklistUserSchema.create({ userID, reason });

        // Create an embed
        embed
          .setTitle('User Blacklisted')
          .addFields(
            { name: 'Staff Tag', value: interaction.user.tag, inline: true },
            { name: 'User ID', value: userID, inline: true },
            { name: 'Reason', value: reason },
            { name: 'Timestamp', value: timestamp }
          );

        // Create the "Unblock User" button
        const unblockUserButton = new ButtonBuilder()
          .setCustomId(`unblockUser_${reportID}`)
          .setLabel('Unblock User')
          .setStyle(ButtonStyle.Danger);

        buttonRow = new ActionRowBuilder().addComponents(unblockUserButton);

        await modalInteraction.reply({ embeds: [embed], components: [buttonRow] });

      } else if (action === 'unblockUser') {
        // Validation: Check if user is actually blacklisted
        const existingUser = await BlacklistUserSchema.findOne({ userID });
        if (!existingUser) {
          return modalInteraction.reply({ content: `User ${userID} is not blacklisted!` });
        }

        // Unblock the user
        await BlacklistUserSchema.deleteOne({ userID });

        // Create an embed
        embed
          .setTitle('User Unblocked')
          .addFields(
            { name: 'Staff Tag', value: interaction.user.tag, inline: true },
            { name: 'User ID', value: userID, inline: true },
            { name: 'Timestamp', value: timestamp }
          );

        // Create the "Block User" button
        const blockUserButton = new ButtonBuilder()
          .setCustomId(`blockUser_${reportID}`)
          .setLabel('Block User')
          .setStyle(ButtonStyle.Danger);

        buttonRow = new ActionRowBuilder().addComponents(blockUserButton);

        await modalInteraction.reply({ embeds: [embed], components: [buttonRow] });

      } else if (action === 'denyReport') {
        await modalInteraction.reply({ content: `Report ${reportID} has been denied for the following reason: ${reason}` });
      }
    }
  } catch (error) {
    console.error('Error handling action:', error);
  }
}

});

eventHandler(client);
client.login(process.env.TOKEN);
