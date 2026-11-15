import { SlashCommandBuilder, MessageFlags } from "discord.js";
import {
  container, emoji, section, text, thumbnail
} from "../lib/components.js";
import { sendAutocomplete } from "../lib/utils.js";
import config from "../config/index.js";

const entities = {
  ...config.armyColors,
  ...config.organizationColors
};

const findEntity = (query) => {
  const name = Object.keys(entities).find(
    (entity) => entity.toLowerCase() === query.toLowerCase()
  );
  return name ? { name, color: entities[name] } : null;
};

const getForeground = (hex) => {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? "000000" : "ffffff";
};

export default {
  data: new SlashCommandBuilder()
    .setName("color")
    .setDescription("Get the color of an army or organization")
    .addStringOption((option) => option
      .setName("entity")
      .setDescription("The army or organization to get the color of")
      .setAutocomplete(true)
      .setRequired(true)
    )
    .addBooleanOption((option) => option
      .setName("ephemeral")
      .setDescription("Optional: Hide the response from others in the chat")
      .setRequired(false)
    ),
  messageCommands: [ "color", "col" ],

  async autocomplete({ interaction }) {
    return await sendAutocomplete(interaction, entities);
  },

  async execute({ interaction, message, args }) {
    const ephemeral = interaction?.options.getBoolean("ephemeral") ?? false;
    const entity = interaction
      ? interaction.options.getString("entity")?.trim()
      : args.join(" ").trim();
    const result = findEntity(entity || "");

    if (!result) {
      const reply = {
        components: [
          container(
            text(
              `${emoji("Error")} **Unknown entity!**\n`
              + `No army or organization named \`${entity || "unknown"}\` could be found.`
            )
          )
        ],
        flags: MessageFlags.IsComponentsV2 | (ephemeral * MessageFlags.Ephemeral)
      };
      if (interaction) return await interaction.reply(reply);
      return await message.reply(reply);
    }

    const colorName = Object.entries(config.colorMappings).find(
      ([name, color]) => color.toLowerCase() === result.color.toLowerCase()
    )?.[0] || result.color.toUpperCase();
    const foreground = getForeground(result.color);
    const displayName = colorName.replace(/ /g, "\\n");
    const thumbnailUrl = (
      `https://placehold.co/256x256@2x/${result.color.replace("#", "")}/${foreground}.png?text=${encodeURIComponent(displayName.replace(/ /g, "\\n"))}&font=open-sans`
    );

    const reply = {
      components: [
        container([
          section({
            components: [
              text(
                `### ${emoji("Color")} ${result.name}\n`
              + `**Color name:** \`${colorName}\`\n`
              + `**Hex code:** \`${result.color}\`\n`
              + `-# [**\`Colorize a whole post ↗\`**](https://cpa-pengauthor.vercel.app/colorize)`
              )
            ],
            accessory: thumbnail(thumbnailUrl)
          })
        ])
      ],
      flags: MessageFlags.IsComponentsV2 | (ephemeral * MessageFlags.Ephemeral)
    };
    if (interaction) return await interaction.reply(reply);
    return await message.reply(reply);
  }
};
