import { SlashCommandBuilder } from "discord.js";
import { sendAutocomplete } from "../lib/utils.js";
import { getPosts, modifyPost } from "../lib/supabase.js";
import {
  MessageFlags, container, text, emoji
} from "../lib/components.js";
import config from "../config/index.js";
import { editScheduleMessage } from "../lib/scheduling.js";

export default {
  data: new SlashCommandBuilder()
    .setName("unclaim")
    .setDescription("Unclaim one or all of your claimed posts")
    .addStringOption((option) => option
      .setName("post")
      .setDescription("Required: Enter the post title or the post ID to drop; use \"All posts\" to drop all claimed posts")
      .setRequired(true)
      .setAutocomplete(true)
    ),
  messageCommands: [ "unclaim", "withdraw", "with", "drop" ],

  async autocomplete({ interaction }) {
    await sendAutocomplete(interaction, {
      "All posts": "*",
      ...Object.fromEntries(
        (await getPosts()).filter(
          (post) => post.covered_by === interaction.user.id
        ).map((post) => [`${post.title}`, String(post.id)])
      )
    });
  },

  async execute({ interaction, message, args }) {
    const userId = interaction?.user.id || message?.author.id;
    const query = interaction
      ? interaction.options.getString("post")?.trim().toLowerCase()
      : args.join(" ").trim().toLowerCase();
    const posts = (await getPosts()).filter(
      (post) => post.covered_by === userId
    );

    if (!posts.length) {
      const reply = {
        components: [
          container(
            text(
              `${emoji("Error")} **You don't have any claimed posts.**`
            )
          )
        ],
        flags: MessageFlags.IsComponentsV2
      };
      if (interaction) return await interaction.reply(reply);
      if (message) return await message.reply(reply);
    }

    let targetedPosts;
    const normalize = (value) => value.toLowerCase().trim()
      .normalize("NFKD")
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
    if (
      !query
      || query === "*"
      || query === "all"
      || query === "all posts"
    ) targetedPosts = posts;
    else targetedPosts = posts.filter(
      (post) => String(post.id) === query || normalize(post.title).includes(normalize(query))
    );

    if (!targetedPosts.length) {
      const reply = {
        components: [
          container(
            text(
              `${emoji("Error")} **Post not found!**\n`
            + `No claimed post matching \`${query}\` was found.`
            )
          )
        ],
        flags: MessageFlags.IsComponentsV2
      };
      if (interaction) return await interaction.reply(reply);
      if (message) return await message.reply(reply);
    } else {
      for (const post of targetedPosts) {
        await modifyPost(post.id, { covered_by: null });
        post.covered_by = null;
        if (post.message_id) await editScheduleMessage(post.message_id, {
          client: interaction.client ?? message.client,
          post,
          state: "scheduled"
        });
      }
      const mentions = [...new Set(
        targetedPosts.flatMap((post) => [
          ...(post.scheduler ? [`<@${post.scheduler}>`] : []),
          ...(post.editors || []).map((editor) => `<@${editor}>`)
        ])
      )].join(" ");
      const reply = {
        components: [
          container(
            text(
              `${mentions}\n\n`
            + `${emoji("Success")} **Post${targetedPosts.length === 1 ? "" : "s"} unclaimed!**\n`
            + `You have unclaimed the following posts:\n`
            + `${targetedPosts.map((post, index) => `${index}. [${post.title}](https://discord.com/channels/${config.guildId}/${config.channels.news}/${post.message_id} "Go to the post's schedule message")`).join("\n")}`
            )
          )
        ],
        flags: MessageFlags.IsComponentsV2
      };
      if (interaction) return await interaction.reply(reply);
      if (message) return await message.reply(reply);
    }
  }
};
