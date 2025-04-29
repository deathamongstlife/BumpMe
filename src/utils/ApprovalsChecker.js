const ApprovalsSchema = require('../schemas/Approvals'); // Adjust the path as needed
const { EmbedBuilder } = require('discord.js');

const ApprovalExpiry = async (client) => {
    try {
        // Fetch all approval records
        const approvals = await ApprovalsSchema.find({});

        for (const approval of approvals) {
            const guild = client.guilds.cache.get(approval.guildID);
            if (!guild) {
                console.warn(`Guild with ID ${approval.guildID} not found.`);
                continue;
            }

            try {
                const owner = await guild.fetchOwner();
                const user = owner.user;

                let dmMessage;

                if (approval.status === 'approved') {
                    dmMessage = new EmbedBuilder()
                        .setColor('#43B581')
                        .setTitle('Congratulations!')
                        .setDescription(`Your server (${approval.guildID}) has been approved by our advertisement reviewers. You may now use the /bump command freely without any issues.`);
                    
                    // Send the DM to the server owner
                   return await user.send({ embeds: [dmMessage] });

                } else if (approval.status === 'denied') {
                    dmMessage = new EmbedBuilder()
                        .setColor('#F04747')
                        .setTitle("We're Sorry")
                        .setDescription(`Your server (${approval.guildID}) has been declined by our reviewers. Don't let this discourage you: You may be able to appeal your bot decline in the support server [here](https://discord.gg/X5tJZJPzGB).`);

                    // Send the DM to the server owner first
                    try {
                        return await user.send({ embeds: [dmMessage] });
                        
                        // Wait a short period to ensure the DM is sent before kicking
                        await new Promise(resolve => setTimeout(resolve, 5000));

                        // Kick the bot from the server
                        await guild.leave();
                        console.log(`Bot kicked from guild ${approval.guildID} after denial.`);
                    } catch (dmError) {
                        console.error(`Failed to send DM to user ${user.id}:`, dmError);
                        continue; // Skip kicking the bot if DM fails
                    }
                } else {
                    console.warn(`Unexpected status ${approval.status} for guild ${approval.guildID}.`);
                    continue;
                }

                // Delete the approval record after processing
                await ApprovalsSchema.findByIdAndDelete(approval._id);
                console.log(`Approval record ${approval._id} deleted after processing.`);
                
            } catch (error) {
                console.error(`Failed to process approval for guild ${approval.guildID}:`, error);
            }
        }
    } catch (error) {
        console.error('Error processing approvals:', error);
    }
};

module.exports = ApprovalExpiry;
