import { Events } from "discord.js";
import config from "../config/index.js";
import { logger } from "../lib/utils.js";

export default {
  name: Events.MessageCreate,

  async execute(message) {
    if (message.author.bot) return;

    const prefix = config.prefix;
    const mention = `<@${message.client.user.id}>`;
    let content;
    if (message.content.startsWith(prefix)) content = message.content.slice(prefix.length);
    else if (message.content.startsWith(mention)) content = message.content.slice(mention.length);
    else return;

    const args = content.trim().split(/\s+/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;
    const command = [...message.client.commands.values()]
      .find((command) => command.messageCommands?.includes(commandName));
    if (!command) return;

    logger.event(`Message command issued: ${commandName} (${message.id})`);

    try {
      await command.execute({ message, args });
    } catch (error) {
      logger.error(error.stack || error.message);
      await message.reply(
        `${emoji("Error")} **Oh no, an unexpected error!** You might want to report this to Fun X Time.`,
      ).catch(() => {});
    }

  }
};
