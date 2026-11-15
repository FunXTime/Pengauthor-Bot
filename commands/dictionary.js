import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { container, text, emoji } from "../lib/components.js";

export default {
  data: new SlashCommandBuilder()
    .setName("dictionary")
    .setDescription("Look up a word in the dictionary and get its synonyms")
    .addStringOption((option) => option
      .setName("word")
      .setDescription("Required: Enter the word to look up")
      .setRequired(true)
    )
    .addBooleanOption((option) => option
      .setName("ephemeral")
      .setDescription("Optional: Hide the response from others in the chat")
      .setRequired(false)
    ),
  messageCommands: [ "dictionary", "dict", "lookup", "word" ],

  async execute({ interaction, message, args }) {
    const ephemeral = interaction?.options.getBoolean("ephemeral") ?? false;
    let word;

    if (interaction) word = interaction.options.getString("word").trim();
    if (message) word = args.join(" ").trim();

    const response = await fetch(`https://freedictionaryapi.com/api/v1/entries/en/${encodeURIComponent(word)}`);

    if (!response.ok) {
      logger.error(`Dictionary API returned ${response.status} ${response.statusText}`);
      const reply = {
        components: [
          container(
            text(
              `${emoji("Error")} **Oh no!**\n`
            + `An unexpected error occurred while accessing the dictionary. Tell Fun X Time that.`
            )
          )
        ],
        flags: MessageFlags.IsComponentsV2 | (ephemeral * MessageFlags.Ephemeral)
      };
      if (interaction) return await interaction.reply(reply);
      if (message) return await message.reply(reply);
    }

    const data = await response.json();

    if (!data.entries?.length) {
      const reply = {
        components: [
          container(
            text(
              `${emoji("Error")} **Word not found!**\n`
            + `No dictionary entry was found for **${word}**.`
            )
          )
        ],
        flags: MessageFlags.IsComponentsV2 | (ephemeral * MessageFlags.Ephemeral)
      };
      if (interaction) return await interaction.reply(reply);
      if (message) return await message.reply(reply);
    }
    else if (interaction) await interaction.deferReply({
      flags: MessageFlags.IsComponentsV2 | (ephemeral * MessageFlags.Ephemeral)
    });

    const definitions = [];
    const synonyms = new Set();

    for (const entry of data.entries || []) {
      for (const sense of entry.senses || []) {
        if (sense.definition) {
          let definition = `**${sense.definition}**`;
          if (sense.examples?.[0]) definition += `\nExample: _${sense.examples[0]}_`;
          if (sense.quotes?.[0]?.text) definition += `\nExample: _${sense.quotes[0].text}_`;
          definitions.push(definition);
        }
        for (const synonym of sense.synonyms || []) synonyms.add(synonym);
      }
      for (const synonym of entry.synonyms || []) synonyms.add(synonym);
    }

    const reply = {
      components: [
        container(
          text([
            `## ${data.word}`,
            definitions.join("\n\n"),
            `**Synonyms:** ${[...synonyms].map((synonym) => `\`${synonym}\``).join(" ") || "None"}`
          ].join("\n\n"))
        )
      ],
      flags: MessageFlags.IsComponentsV2 | (ephemeral * MessageFlags.Ephemeral)
    };

    if (interaction) return await interaction.editReply(reply);
    if (message) return await message.reply(reply);
  }
};
