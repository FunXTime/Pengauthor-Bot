import { startServer } from './server.js';
startServer();

import { Client, Collection, GatewayIntentBits } from "discord.js";
import commands from "./commands/index.js";
import registerEvents from "./events/index.js";
import config from "./config/index.js";
import { logger } from "./lib/utils.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

client.commands = new Collection();
for (const command of commands) {
  client.commands.set(command.data.name, command);
}
registerEvents(client);

process.on("unhandledRejection", (error) => {
  logger.error(error.stack || error.message);
});

process.on("uncaughtException", (error) => {
  logger.error(error.stack || error.message);
});

client.login(config.token).catch((error) => {
  logger.error(`Failed to log in: ${error.stack || error.message}`);
});
