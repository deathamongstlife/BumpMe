const VoteSchema = require('../schemas/votes');
const ProfileSchema = require('../schemas/profile');
const { EmbedBuilder } = require('discord.js');
const PremiumCode = require('../schemas/PremiumCode');

const SupportServerID = '1181087183923318874'; // Replace with your Support Server ID
const VoteRoleID = '1252446960980463730'; // Replace with your Vote Role ID
const ChannelID = '1301532676670492813'; // Replace with your Vote Log Channel ID

function generatePremiumCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 15; i++) { // 15-character code
        if (i > 0 && i % 5 === 0) {
            code += '-';
        }
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

const VoteReminder = async (client) => {
    // Fetch votes that are not enabled
    let duration;
    const votes = await VoteSchema.find({ enabled: false });

    // Iterate through each vote
    for (const vote of votes) {
        try {
            // Find or create the user's profile
            const profile = await ProfileSchema.findOrCreate(vote.UserID);

            // Generate a random number between 1-10 for the coins
            const CoinsAmount = Math.floor(Math.random() * 10) + 1;

            // Fetch the guild and member
            const supportServer = await client.guilds.fetch(SupportServerID);
            const member = await supportServer.members.fetch(vote.UserID).catch(() => null);

            // Create the vote embed
            const embed = new EmbedBuilder()
                .setColor('#fe4248') // Set the color
                .setTitle("Thanks for Voting!")
                .setDescription(`🌟 <@${vote.UserID}> has just voted for [BumpMe](https://top.gg/bot/1265343375054340160)! \n You now have \`${profile.votes + 1}\` vote credits.`)
                .setImage('https://media.discordapp.net/attachments/1265026826473046038/1281679675168395347/Bump2You_1.png?ex=66dc98b7&is=66db4737&hm=6240b6fefd2343a77990b1b14b12686f55da7e40c6f956dec1aa1023eef05154&=&format=webp&quality=lossless&width=1295&height=78');

            let message;
            if (member) {
                // Add the vote role to the user
                const role = supportServer.roles.cache.get(VoteRoleID);
                if (role) {
                    await member.roles.add(role);
                } 
            } else {
                const user = await client.users.fetch(vote.UserID);
            }

            // Log the embed to the designated channel
            const channel = await client.channels.fetch(ChannelID);
            await channel.send({ content: `<@${vote.UserID}>`, embeds: [embed] });

            // Add the coins to the user's profile balance
            profile.credits = (profile.credits || 0) + CoinsAmount;
            profile.votes += 1;

            if (profile.votes >= 30) {
                // Generate a premium code
                duration = '2 weeks';
                const code = generatePremiumCode();
                
                // Create and save the premium code
                const premiumCode = new PremiumCode({
                    code: code,
                    duration: duration,
                    expiresAt: null // Expiry will be calculated upon activation
                });
                await premiumCode.save();

                // Send the congratulations message with the code
                try {
                    const user = await client.users.fetch(vote.UserID);
                    await user.send(`🎉 Congratulations! You've reached 30 votes and earned a premium code for a ${duration} premium membership!\n\n**Your Premium Code:** \`${code}\``);
                } catch (error) {
                    console.error(`Error sending DM to user ${vote.UserID}:`, error);
                }

                // Reset votes to 0
                profile.votes = 0;
            }

            await profile.save();
            
            // Set the VoteExpiry value (example: 5 seconds for testing)
            const now = Math.floor(Date.now() / 1000);
            vote.VoteExpiry = now + 43200; // 5 seconds for testing, replace with your desired expiry time 43200
            // Mark the vote as enabled
            vote.enabled = true;
            await vote.save();
        } catch (error) {
            console.error(`Error processing vote for user ${vote.UserID}:`, error);
            // Continue to the next vote
            continue;
        }
    }
};

module.exports = VoteReminder;
