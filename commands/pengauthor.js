import { SlashCommandBuilder, MessageFlags, Message } from "discord.js";
import {
  container, text, actionRow, button, emoji
} from "../lib/components.js";

export default {
  data: new SlashCommandBuilder()
    .setName("pengauthor")
    .setDescription("Get a direct link to Pengauthor")
    .addStringOption((option) => option
      .setName("page")
      .setDescription("Optional: Select a page of the dashboard to provide the link for")
      .addChoices(
        { name: "Overview", value: "https://cpa-pengauthor.vercel.app/" },
        { name: "Guide", value: "https://cpa-pengauthor.vercel.app/guide" },
        { name: "Generate", value: "https://cpa-pengauthor.vercel.app/generate" },
        { name: "Research", value: "https://cpa-pengauthor.vercel.app/research" },
        { name: "Refine", value: "https://cpa-pengauthor.vercel.app/refine" },
        { name: "Colorize", value: "https://cpa-pengauthor.vercel.app/colorize" },
        { name: "Post Checkup", value: "https://cpa-pengauthor.vercel.app/checkup" },
        { name: "Spot The Error", value: "https://cpa-pengauthor.vercel.app/spot-the-error" },
        { name: "Score Calculator", value: "https://cpa-pengauthor.vercel.app/calculate-score" },
        { name: "Share a note", value: "https://cpa-pengauthor.vercel.app/note" },
      )
      .setRequired(false)
    )
    .addBooleanOption((option) => option
      .setName("ephemeral")
      .setDescription("Optional: Hide the response from others in the chat")
      .setRequired(false)
    ),
  messageCommands: [ "pengauthor", "pa" ],

  async execute({ interaction, message }) {
    const page = interaction.options.getString("page");
    const ephemeral = interaction?.options.getBoolean("ephemeral") ?? false;

    let reply = {
      components: [
        container([
          text("-# https://cpa-pengauthor.vercel.app/"),
          actionRow(
            button({
              label: "Open Pengauthor",
              style: 5,
              url: "https://cpa-pengauthor.vercel.app/",
              emoji: emoji("Pengauthor")
            })
          )
        ])
      ],
      flags: MessageFlags.IsComponentsV2 | (ephemeral * MessageFlags.Ephemeral)
    }

    if (interaction && page) {
      reply = {
        components: [
          container([
            text(`-# ${page}`),
            actionRow(
              button({
                label: "Open on Pengauthor",
                style: 5,
                url: page,
                emoji: emoji("Pengauthor")
              })
            )
          ])
        ],
        flags: MessageFlags.IsComponentsV2 | (ephemeral * MessageFlags.Ephemeral)
      }
    }

    if (interaction) await interaction.reply(reply)
    else if (message) await message.reply(reply);
  }
};
