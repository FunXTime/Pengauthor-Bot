import { REST, Routes } from "discord.js";
import config from "./config/index.js";
import commands from "./commands/index.js";
import { logger } from "./lib/utils.js";

const rest = new REST({ version: "10" }).setToken(config.token);
const DEV_PREFIX = "try-";

const commandData = commands.map((command) => {
  const json = command.data.toJSON();
  if (config.usingDevOverrides) {
    json.name = `${DEV_PREFIX}${json.name}`;
  }
  return json;
});

try {
  logger.info(
    `Registering slash commands (${commandData.length})…`
  );
  if (config.usingDevOverrides) {
    logger.info(`In development mode; prefixing slash command names with "${DEV_PREFIX}"…`)
  }
  const existingCommands = await rest.get(
    Routes.applicationCommands(config.clientId)
  );
  const entryPointCommand = existingCommands.find(
    (command) => command.type === 4
  );
  const commandsToRegister = entryPointCommand
    ? [...commandData, entryPointCommand]
    : commandData;
  const registered = await rest.put(
    Routes.applicationCommands(config.clientId),
    { body: commandsToRegister }
  );
  logger.info("Finished registering slash commands!");
  logger.info(
    `Commands registered: ${registered
      .map((c) => `\x1b[34m/${c.name}\x1b[0m`)
      .join(", ")}`
  );
} catch (error) {
  logger.error(error.stack || error.message);
  process.exit(1);
}
