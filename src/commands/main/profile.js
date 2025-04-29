const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ProfileSchema = require('../../schemas/profile');

// Function to generate a referral code
const generateReferralCode = () => {
    return Math.random().toString(36).substr(2, 8); // Generates an 8-character alphanumeric code
};

// Staff IDs
const Staff = [
    "1130886272550981662",
    "1302806745294307452"
];

// IDs for the support server and premium role
const SupportServerID = "1265026824728084582"; // Replace with your actual support server ID
const PremiumRoleID = "1265026824728084589"; // Replace with your actual premium role ID

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('🎈 View your profile.'),
    run: async (client, interaction) => {
        try {
            // Find the user profile based on their user ID
            let userProfile = await ProfileSchema.findOne({ UserID: interaction.user.id });
            let referralCode;
            let isNewProfile = false;

            // Check if the user is staff
            const isStaff = Staff.includes(interaction.user.id);

            // If no profile exists, create a new one
            if (!userProfile) {
                referralCode = generateReferralCode();
                userProfile = new ProfileSchema({
                    UserID: interaction.user.id,
                    referralCode: referralCode
                });

                // Save the new profile
                await userProfile.save();
                isNewProfile = true;
            } else {
                // If the user profile exists, check for referral code
                if (!userProfile.referralCode) {
                    // Generate and save a referral code if it doesn't exist in the profile
                    referralCode = generateReferralCode();
                    userProfile.referralCode = referralCode;

                    // Save the updated profile
                    await userProfile.save();
                } else {
                    referralCode = userProfile.referralCode;
                }
            }

            // Check if the user has the premium role in the support server
            let hasPremium = false;
            try {
                const supportServer = await client.guilds.fetch(SupportServerID);
                const member = await supportServer.members.fetch(interaction.user.id);

                if (member.roles.cache.has(PremiumRoleID)) {
                    hasPremium = true;
                }
            } catch (err) {
                console.log(`Error fetching the user from the support server: ${err}`);
            }

            // Create the embed with the user's profile information
            const profileEmbed = new EmbedBuilder()
                .setColor('#00FF00') // You can change the color as needed
                .setAuthor({
                    name: `${interaction.user.username}'s Profile`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                })
            	.setDescription(`Welcome to my profile! This a default message from the **BumpMe** team, why not use my referral code on your server?`)
                .addFields(
                    { name: 'Referral Code', value: `\`${referralCode}\``, inline: true },
                    { name: 'Staff', value: isStaff ? '`\True\`' : '`\False\`', inline: true },
                    { name: 'Premium', value: hasPremium ? '`\True\`' : '`\False\`', inline: true }
                )
                .setFooter({ text: `Viewing ${interaction.user.tag}'s profile.`, iconURL: client.user.displayAvatarURL() })

            // Send the embed as the reply
            await interaction.reply({ embeds: [profileEmbed], ephemeral: false });

        } catch (error) {
            console.error(error);
            interaction.reply({
                content: `An error occurred while fetching or creating your profile. Please try again later.`,
                ephemeral: true
            });
        }
    }
};
