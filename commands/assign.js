import { SlashCommandBuilder } from "discord.js";
import {
  MessageFlags, container, text, emoji
} from "../lib/components.js";
import { sendAutocomplete } from "../lib/utils.js";
import { getPost, getPosts, modifyPost } from "../lib/supabase.js";
import { editScheduleMessage } from "../lib/scheduling.js";
import config from "../config/index.js";

export default {
  data: new SlashCommandBuilder()
    .setName("assign")
    .setDescription("Assign a scheduled post to a reporter")
    .addStringOption((option) => option
      .setName("post")
      .setDescription("The scheduled post to assign")
      .setAutocomplete(true)
      .setRequired(true)
    )
    .addUserOption((option) => option
      .setName("user")
      .setDescription("The reporter to assign the post to; leave blank to clear the assignment")
      .setRequired(false)
    )
    .addBooleanOption((option) => option
      .setName("ephemeral")
      .setDescription("Optional: Hide the response from others in the chat")
      .setRequired(false)
    ),
  messageCommands: [ "assign" ],

  async autocomplete({ interaction }) {
    await sendAutocomplete(interaction, Object.fromEntries(
      (await getPosts()).map((post) => [post.title, post.title])
    ));
  },

  async execute({ interaction, message, args }) {
    const ephemeral = interaction?.options.getBoolean("ephemeral") ?? false;
    let postQuery;
    let user;

    if (interaction) {
      postQuery = interaction.options.getString("post").trim();
      user = interaction.options.getUser("user");
    }
    else if (message) {
      const posts = await getPosts();
      const input = args.join(" ").trim();
      const post = posts
        .sort((a, b) => b.title.length - a.title.length)
        .find((post) => input.toLowerCase().startsWith(post.title.toLowerCase()));

      if (!post) return message.reply({
        components: [
          container(
            text(
              `${emoji("Error")} **Post not found!**\n`
              + `The specified post title or ID could not be found. Please try again.`
            )
          )
        ],
        flags: MessageFlags.IsComponentsV2
      });

      postQuery = post.title;
      const userQuery = input.slice(post.title.length).trim();

      if (userQuery) {
        const userId = userQuery.match(/^<@!?(\d+)>$/)?.[1] || userQuery;
        user = await message.client.users.fetch(userId).catch(() => null);

        if (!user) return message.reply({
          components: [
            container(
              text(
                `${emoji("Error")} **User not found!**\n`
                + `Please provide a valid Discord user mention or ID.`
              )
            )
          ],
          flags: MessageFlags.IsComponentsV2
        });
      }
    }

    const member = await interaction?.guild.members.fetch(interaction.user.id)
      || await message.guild.members.fetch(message.author.id);

    if (!member.roles.cache.some(
      (role) => config.reportingHeadsRole.includes(role.id)
    )) {
      const reply = {
        components: [
          container(
            text(
              `${emoji("Error")} **You can't do that!**\n`
              + `Only Reporting Heads can assign scheduled posts.`
            )
          )
        ],
        flags: MessageFlags.IsComponentsV2 | (ephemeral ? MessageFlags.Ephemeral : 0)
      };

      return interaction
        ? interaction.reply(reply)
        : message.reply(reply);
    }

    let post;

    try {
      if (/^\d+$/.test(postQuery)) {
        post = await getPost(Number(postQuery));
      }
      else {
        post = (await getPosts()).find(
          (post) => post.title.toLowerCase() === postQuery.toLowerCase()
        );
      }
    } catch {
      post = null;
    }

    if (!post) {
      const reply = {
        components: [
          container(
            text(
              `${emoji("Error")} **Post not found!**\n`
              + `The specified post title or ID could not be found. Please try again.`
            )
          )
        ],
        flags: MessageFlags.IsComponentsV2 | (ephemeral ? MessageFlags.Ephemeral : 0)
      };

      return interaction
        ? interaction.reply(reply)
        : message.reply(reply);
    }

    const updatedPost = await modifyPost(post.id, {
      covered_by: user?.id || null
    });

    await editScheduleMessage(post.messageId, {
      post: updatedPost,
      client: interaction?.client || message.client
    });

    const reply = {
      components: [
        container(
          text(
            `${emoji("Success")} **Post ${user ? "assigned" : "unassigned"}!**\n`
            + `**${post.title}** ${user ? `is now covered by <@${user.id}>.` : "is no longer assigned to a reporter."}`
          )
        )
      ],
      flags: MessageFlags.IsComponentsV2 | (ephemeral ? MessageFlags.Ephemeral : 0)
    };

    return interaction
      ? interaction.reply(reply)
      : message.reply(reply);
  }
};
