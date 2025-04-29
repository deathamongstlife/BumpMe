require("colors");
const { ActivityType, Client } = require("discord.js");

module.exports =
  /**
   *
   * @param {Client} client
   */
  async (client) => {

    setInterval(async () => {
      client.user.setPresence({
        activities: [
          { name: `your advertisements. 👋`},
        ],
        status: ActivityType.Custom,
      });
    }, 5000);
  };
