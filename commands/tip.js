import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { container, text, emoji } from "../lib/components.js";
import config from "../config/index.js";

export default {
  data: new SlashCommandBuilder()
    .setName("tip")
    .setDescription("Get a random tip")
    .addSubcommand((subcommand) => subcommand
      .setName("reporters")
      .setDescription("Get a random tip; for Reporters")
    )
    .addSubcommand((subcommand) => subcommand
      .setName("editors")
      .setDescription("Get a random tip; for Reporting Heads")
    ),
  messageCommands: [ "tip", "tips", "advice" ],

  async execute({ interaction, message, args }) {
    let subcommand;
    if (interaction) subcommand = interaction.options.getSubcommand();
    else if (message) subcommand = args[0];
    subcommand = subcommand?.toLowerCase();

    let tips = config.tips;
    let forEditors = subcommand === "editors" || subcommand === "editor";
    if (forEditors) tips = config.editorTips;

    const reply = {
      components: [
        container(
          text(`${emoji("Tip")}${forEditors ? " **Editor tip:** " : " "}${tips[Math.floor(Math.random() * tips.length)]}`)
        )
      ],
      flags: MessageFlags.IsComponentsV2
    }

    if (interaction) await interaction.reply(reply);
    else if (message) await message.reply(reply);
  }
};
