const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = async (client, guild) => {
    try {
        // Fetch the guild owner
        const guildOwner = await guild.fetchOwner();
        
        // Define the embed message
        const dotEmoji2 = '<:arrow:1307458715473154048>';
        const embed = new EmbedBuilder()
        	.setTitle("Thanks for adding BumpMe!")
            .addFields(
                {
                    name: "**Invite BumpMe** (`Required`)",
                    value: `${dotEmoji2} [**Click here**](https://discord.com/oauth2/authorize?client_id=1265343375054340160) to invite BumpMe!`
                },
                {
                    name: "**Setup server** (`Required`)",
                    value: `${dotEmoji2} run /setup channel, /setup invite, and /setup description`
                },
                {
                    name: "**Bump your server** (`Required`)",
                    value: `${dotEmoji2} run /bump to grow!`
                }
            )
        	.setImage("https://media.discordapp.net/attachments/1265026826473046038/1281679675168395347/Bump2You_1.png?ex=66dc98b7&is=66db4737&hm=6240b6fefd2343a77990b1b14b12686f55da7e40c6f956dec1aa1023eef05154&=&format=webp&quality=lossless&width=1295&height=78")
            .setColor("#fe4248");

        // Send the embed message to the guild owner's DM channel
        await guildOwner.send({
            content: "<:link:1367364911302447236> https://discord.gg/A2ANr4tnTH",
            embeds: [embed], 
        });
        
        return guildOwner.send("**TRY OUT DISCORD PROMOTIONS FOR MORE GROWTH!** https://discord.gg/vudnye3jSC\n\n**Also join Supernatural Promotions!** https://discord.gg/w2PsZqaVMz")
    } catch (error) {
        console.log('Error sending message:', error);
    }
};
