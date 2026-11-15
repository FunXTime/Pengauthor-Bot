import { Events } from "discord.js";
import { handleInteraction } from "../interactions/index.js";
import {
  MessageFlags, container, text, emoji
} from "../lib/components.js";
import { logger } from "../lib/utils.js";

export default {
  name: Events.InteractionCreate,

  async execute(interaction) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (interaction.isButton()) return await handleInteraction(interaction);
    else if (interaction.isAutocomplete()) {
      if (command?.autocomplete) await command.autocomplete({ interaction });
      return;
    }
    else if (!interaction.isChatInputCommand()) return;
    else if (!command) return logger.warn(`Unknown slash command: ${interaction.commandName}`);

    logger.event(`Slash command issued: /${interaction.commandName}`);

    try {
      await command.execute({ interaction });
    } catch (error) {
      logger.error(error.stack || error.message);
      const reply = {
        components: [
          container(
            text(`${emoji("Error")} **Oh no, an unexpected error!** You might want to report this to Fun X Time.`)
          )
        ],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
      };
      if (
        interaction.replied || interaction.deferred
      ) await interaction.followUp(reply).catch(() => {});
      else await interaction.reply(reply).catch(() => {});
    }
  }
};
