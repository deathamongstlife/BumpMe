require("colors");
const { startAutobump } = require('../../commands/main/bump')

module.exports = async (client) => {
  await startAutobump(client);
  console.log("[INTIALIZED]".green + " Successfully started the Auto Bump Function.")
};
