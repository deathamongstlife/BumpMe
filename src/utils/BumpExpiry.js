const BumpSchema = require('../schemas/Bump');
const { EmbedBuilder } = require('discord.js');

const BumpExpiry = async (client) => {
    const currentTime = Date.now() / 1000; // Convert milliseconds to seconds for Unix timestamp comparison

    try {
        const bumps = await BumpSchema.find({ cooldownEnd: { $lte: currentTime } });
        
        for (const bump of bumps) {
            const channel = client.channels.cache.get(bump.lastBumpedChannel);
            if (channel) {
                const DotEmoji2 = "<:Arrow:1281677131004252191>"
                const embed = new EmbedBuilder()
                    .setColor('#fe4248')
                    .setTitle('Bump Reminder')
                    .addFields(
                        {
                            name: "> **Share Again:**",
                            value: `${DotEmoji2}  Using </bump:1265371450492190786>`
                        },
                        {
                            name: "> **Did You Know?**",
                            value: `${DotEmoji2} You can now **AUTO SHARE** with [**PREMIUM**](https://bumping.ltd/premium)`
                        }
                    )
                	.setImage('https://media.discordapp.net/attachments/1265026826473046038/1281679675168395347/Bump2You_1.png?ex=66dc98b7&is=66db4737&hm=6240b6fefd2343a77990b1b14b12686f55da7e40c6f956dec1aa1023eef05154&=&format=webp&quality=lossless&width=1295&height=78')
                
                try {
                    await channel.send({ content: `<@${bump.lastBumpedUser}>, it's time to bump again!`, embeds: [embed] });

                    await BumpSchema.findByIdAndUpdate(bump._id, {
                        $unset: { lastBumpedChannel: "", cooldownEnd: "" }
                    });
                } catch (error) {
                    await BumpSchema.findByIdAndUpdate(bump._id, {
                        $unset: { lastBumpedChannel: "", cooldownEnd: "" }
                    });
                    console.error(`Failed to send cooldown ended message to guild ${bump.guildId}:`, error);
                }
            }
        }
    } catch (error) {
        console.error('Error checking cooldowns:', error);
    }
};

module.exports = BumpExpiry;