import { SlashCommandBuilder, MessageFlags, Message } from "discord.js";
import { container, text, emoji } from "../lib/components.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Test if the bot is responding; returns command execution time")
    .addBooleanOption((option) => option
      .setName("ephemeral")
      .setDescription("Optional: Hide the response from others in the chat")
      .setRequired(false)
    ),
  messageCommands: [ "ping", "pong" ],

  async execute({ interaction, message }) {
    const ephemeral = interaction?.options.getBoolean("ephemeral") ?? false;

    const initialText = `${emoji("Ping")} **Pong!**`;
    const finalText = (milliseconds) => `${emoji("Ping")} **Pong!** That took \`${milliseconds}\` milliseconds.`;
    const start = Date.now();

    if (interaction) {
      await interaction.reply({
        components: [
          container(
            text(initialText)
          )
        ],
        flags: MessageFlags.IsComponentsV2 | (ephemeral * MessageFlags.Ephemeral)
      });
      const milliseconds = Date.now() - start;
      await interaction.editReply({
        components: [
          container(
            text(finalText(milliseconds))
          )
        ]
      });
      return;
    }
    else if (message) {
      const sentMessage = await message.reply({
        components: [
          container(
            text(initialText)
          )
        ],
        flags: MessageFlags.IsComponentsV2 | (ephemeral * MessageFlags.Ephemeral)
      });
      const milliseconds = Date.now() - start;
      await sentMessage.edit({
        components: [
          container(
            text(finalText(milliseconds))
          )
        ]
      });
    }
  }
};
