import { MessageFlags } from "discord.js";
import config from "../config/index.js";
import { getPost, modifyPost } from "../lib/supabase.js";
import {
  container, section, text, timestamp, thumbnail, actionRow, button, emoji
} from "../lib/components.js";
import { editScheduleMessage } from "../lib/scheduling.js";

export default async function claimPost(interaction, args) {
  const postId = args[0];
  const post = await getPost(postId);

  if (!post) return await interaction.reply({
    content: "This post could not be found.",
    flags: MessageFlags.Ephemeral
  });
  else if (!post.message_id) return await interaction.reply({
    content: "This post does not have a schedule message associated with it.",
    flags: MessageFlags.Ephemeral
  });
  else if (post.covered_by) return await interaction.reply({
    content: "This post has already been claimed.",
    flags: MessageFlags.Ephemeral
  });

  await modifyPost(post.id, { covered_by: interaction.user.id });

  const channel = await interaction.client.channels.fetch(config.channels.news);
  const message = await channel.messages.fetch(post.message_id);

  await editScheduleMessage(message, {
    post,
    state: "claimed",
    userId: interaction.user.id
  });

  await interaction.reply({
    components: [
      container([
        text(
          `${emoji("Success")} **[This post](${message.url}) is yours!** ${!post.note ? "K" : "Refer to the instructions provided and k"}eep in touch with the Reporting Heads for as long as you have this post claimed.\n`
        + `-# To unclaim this post, use the \`/unclaim\` command.`
        ),
        actionRow(
          button({
            label: "Starting writing on WordPress",
            style: 5,
            emoji: emoji("Add_New_Post"),
            url: `https://cparmies.org/wp-admin/post-new.php?post_title=${encodeURIComponent(post.title)}&content=Replace+this+paragraph+with+real+content.+Try+using+Pengauthor%27s+boilerplate+generator%21`
          })
        )
      ])
    ],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
  });
}
