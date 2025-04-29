const VoteSchema = require('../schemas/votes');
const ProfileSchema = require('../schemas/profile');
const { EmbedBuilder } = require('discord.js');

const SupportServerID = '1181087183923318874'; // Replace with your Support Server ID
const VoteRoleID = '1252446960980463730'; // Replace with your Vote Role ID
const ChannelID = '1301532676670492813'; // Replace with your Vote Log Channel ID

const VoteExpiryNotification = async (client) => {
    // Get the current time in epoch format
    const now = Math.floor(Date.now() / 1000);

    // Fetch votes that have expired
    const expiredVotes = await VoteSchema.find({ VoteExpiry: { $lt: now } });

    // Iterate through each expired vote
    for (const vote of expiredVotes) {
        try {
            // Find or create the user's profile
            let profile = await ProfileSchema.findOne({ UserID: vote.UserID });
            if (!profile) {
                profile = await ProfileSchema.create({ UserID: vote.UserID });
            }

            // Check if the user is in the support server
            const supportServer = await client.guilds.fetch(SupportServerID);
            const member = supportServer.members.cache.get(vote.UserID);

            // Create the expiry embed
            const embed = new EmbedBuilder()
                .setColor('#fe4248') // Set the color of the embed
                .setDescription(`**<@${vote.UserID}> your vote has expired!**\n> You can vote again [here](https://top.gg/bot/1265343375054340160/vote).`)
                .setFooter({ text: "Thank you for voting!" })
                .setTimestamp(); // Adds the current timestamp to the embed

            if (member) {
                const role = supportServer.roles.cache.get(VoteRoleID);
                if (role) await member.roles.remove(role);
            }

            // Log the embed message to the designated channel
            const channel = await client.channels.fetch(ChannelID);
            await channel.send({ content: `<@${vote.UserID}>`, embeds: [embed] });

            // Delete the vote entry from the database
            await VoteSchema.deleteOne({ _id: vote._id });
        } catch (error) {
            console.error(`Error handling expiry for user ${vote.UserID}:`, error);
            // Delete the vote entry from the database if an error occurs
            await VoteSchema.deleteOne({ _id: vote._id });
            // Continue to the next expired vote
            continue;
        }
    }
};

module.exports = VoteExpiryNotification;
