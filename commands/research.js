import { SlashCommandBuilder, MessageFlags } from "discord.js";
import config from "../config/index.js";
import { container, emoji, text } from "../lib/components.js";
import { runResearch, createResearchReply } from "../lib/research.js";

const sourceChoices = Object.entries(config.research.sites).map(
  ([value, site]) => ({ name: site.label, value })
);

export default {
  data: new SlashCommandBuilder()
    .setName("research")
    .setDescription("Search on army media websites exactly like how you would use site search")
    .addStringOption((option) => option
      .setName("search")
      .setDescription("Required: The terms to search for")
      .setRequired(true)
    )
    .addStringOption((option) => option
      .setName("source")
      .setDescription("Required: The media organization website to search from")
      .addChoices(...sourceChoices)
      .setRequired(true)
    )
    .addStringOption((option) => option
      .setName("range")
      .setDescription("Optional: Limit results to a specific year or year range (20XX or 20XX-20YY)")
      .setRequired(false)
    )
    .addStringOption((option) => option
      .setName("sort")
      .setDescription("Optional: Choose how to sort the search results")
      .addChoices(
        { name: "Latest posts first", value: "newest" },
        { name: "Oldest post first", value: "oldest" },
        { name: "Alphabetically based on post title", value: "title" }
      )
      .setRequired(false)
    )
    .addBooleanOption((option) => option
      .setName("ephemeral")
      .setDescription("Optional: Hide the response from others in the chat")
      .setRequired(false)
    ),
  messageCommands: [ "research", "search", "wordpress", "wp", "res" ],

  async execute({ interaction, message, args }) {
    const ephemeral = interaction?.options.getBoolean("ephemeral") ?? false;
    let search;
    let site;
    let range;
    let sort;

    if (interaction) {
      search = interaction.options.getString("search").trim();
      site = interaction.options.getString("source");
      range = interaction.options.getString("range")?.trim();
      sort = interaction.options.getString("sort") || "newest";
    }
    else if (message) {
      site = args.shift()?.trim().toLowerCase();
      search = args.join(" ").trim();
      sort = "newest";
    }

    if (!site || !config.research.sites[site]) {
      const reply = {
        components: [
          container(
            text(
              `${emoji("Error")} **Invalid source!**\n`
            + `Please specify a valid research source.`
            )
          )
        ],
        flags: MessageFlags.IsComponentsV2 | (ephemeral * MessageFlags.Ephemeral)
      };
      if (interaction) return await interaction.reply(reply);
      else if (message) return await message.reply(reply);
    }

    if (!search) {
      const reply = {
        components: [
          container(
            text(
              `${emoji("Error")} **Search terms required!**\n`
            + `Please provide something to search for.`
            )
          )
        ],
        flags: MessageFlags.IsComponentsV2 | (ephemeral * MessageFlags.Ephemeral)
      };
      if (interaction) return await interaction.reply(reply);
      else if (message) return await message.reply(reply);
    }

    if (interaction) await interaction.deferReply({
      flags: MessageFlags.IsComponentsV2 | (ephemeral * MessageFlags.Ephemeral)
    });

    const results = await runResearch({
      userId: interaction?.user.id || message.author.id,
      site,
      query: search,
      range,
      sort
    });
    const reply = createResearchReply({
      token: results.token,
      posts: results.posts,
      page: results.page,
      totalPages: results.totalPages,
      totalResults: results.totalResults,
      site,
      query: search
    });

    if (interaction) return await interaction.editReply({
      ...reply,
      flags: MessageFlags.IsComponentsV2 | (ephemeral * MessageFlags.Ephemeral)
    });
    else if (message) return await message.reply({
      ...reply,
      flags: MessageFlags.IsComponentsV2
    });
  }
};
