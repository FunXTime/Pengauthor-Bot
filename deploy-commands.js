import { REST, Routes } from "discord.js";
import config from "./config/index.js";
import commands from "./commands/index.js";

const rest = new REST({ version: "10" }).setToken(config.token);
const commandData = commands.map((command) => command.data.toJSON());

try {
  console.log(`Registering slash commands (${commandData.length})…`);
  const existingCommands = await rest.get(
    Routes.applicationCommands(config.clientId)
  );
  const entryPointCommand = existingCommands.find(
    (command) => command.type === 4
  );
  const commandsToRegister = entryPointCommand
    ? [...commandData, entryPointCommand]
    : commandData;
  await rest.put(
    Routes.applicationCommands(config.clientId),
    { body: commandsToRegister }
  );
  console.log(`Finished registering slash commands!`);
} catch (error) {
  console.error(error);
  process.exit(1);
}
