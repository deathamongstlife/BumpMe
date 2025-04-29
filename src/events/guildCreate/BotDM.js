const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = async (client, guild) => {
    try {
        // Fetch the guild owner
        const guildOwner = await guild.fetchOwner();
        
        // Define the embed message
        const dotEmoji2 = '<:Arrow:1281677131004252191>';
        const embed = new EmbedBuilder()
        	.setTitle("Thanks for adding BumpMe!")
            .addFields(
                {
                    name: "**Invite BumpMe** (`Required`)",
                    value: `${dotEmoji2} [**Click here**](https://discord.com/oauth2/authorize?client_id=1265343375054340160) to invite BumpMe!`
                },
                {
                    name: "**Login to Dashboard** (`Required`)",
                    value: `${dotEmoji2} head over to https://www.bumping.ltd to login to the dashboard.`
                },
                {
                    name: "**Edit your server** (`Required`)",
                    value: `${dotEmoji2} Setup your server with our brand new server edit pages.`
                },
                {
                    name: "**Save your settings** (`Required`)",
                    value: `${dotEmoji2} Save your server settings, bump channel/invite channel and server description - save them and get to bumping!`
                }
            )
        	.setImage("https://media.discordapp.net/attachments/1265026826473046038/1281679675168395347/Bump2You_1.png?ex=66dc98b7&is=66db4737&hm=6240b6fefd2343a77990b1b14b12686f55da7e40c6f956dec1aa1023eef05154&=&format=webp&quality=lossless&width=1295&height=78")
            .setColor("#fe4248");

        // Send the embed message to the guild owner's DM channel
        await guildOwner.send({
            content: "<:link:1241836480779784202> https://discord.gg/f75Qytv9cT",
            embeds: [embed], 
        });
        
        return guildOwner.send("**TRY OUT DISCORD PROMOTIONS FOR MORE GROWTH!** https://discord.gg/RJh763aF")
    } catch (error) {
        console.log('Error sending message:', error);
    }
};