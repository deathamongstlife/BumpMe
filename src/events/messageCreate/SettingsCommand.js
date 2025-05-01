const { Client, Message } = require('discord.js');
const { MongoClient } = require('mongodb');
const { mongoURI } = require('../../../../.env'); // Make sure your .env file contains the connection string

module.exports = async (client, message) => {
    const Staff = [
        "1130886272550981662", // Example staff IDs
        "1302806745294307452",
        "1358608667686994120",
    ];

    if (!Staff.includes(message.author.id)) return;

    const args = message.content.trim().split(" ");
    const command = args[0];
    const guildId = args[1];

    if (command !== "-settings") return;
    if (!guildId) {
        return message.reply("❗ Please provide a valid guild ID.");
    }

    try {
        // Connect to MongoDB using the MongoClient
        const clientMongo = new MongoClient(mongoURI);
        await clientMongo.connect();

        // Access the database
        const db = clientMongo.db('your-database-name'); // Replace with your database name
        const guildInfoCollection = db.collection('guild-info'); // The collection containing guild info
        const guildSettingsCollection = db.collection('guildSettings'); // The collection containing guild settings

        // Query for the guild ID in the guild-info collection
        const guildInfo = await guildInfoCollection.findOne({ guildID: guildId });
        if (!guildInfo) {
            return message.reply(`❗ No guild info found for ID: \`${guildId}\``);
        }

        // Query for the guild ID in the guildSettings collection
        const guildSettings = await guildSettingsCollection.findOne({ guildID: guildId });
        if (!guildSettings) {
            return message.reply(`❗ No settings found for guild ID: \`${guildId}\``);
        }

        // Inform the user that the guild was found
        message.reply(`✅ Guild with ID: \`${guildId}\` has been found in the database.`);

        // Close the MongoDB connection
        await clientMongo.close();

    } catch (err) {
        console.error(`Error checking for guild ${guildId}:`, err);
        message.reply("❗ There was an error while trying to find the guild.");
    }
};
