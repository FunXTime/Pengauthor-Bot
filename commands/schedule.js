import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { sendAutocomplete, logger, toEST } from "../lib/utils.js";
import {
  container, emoji, section, text, timestamp, thumbnail, actionRow, button
} from "../lib/components.js";
import { schedulePost, modifyPost } from "../lib/supabase.js";
import { sendScheduleMessage } from "../lib/scheduling.js";
import config from "../config/index.js";

export default {
  data: new SlashCommandBuilder()
    .setName("schedule")
    .setDescription("For Reporting Heads: Schedule a post")
    .addStringOption((option) => option
      .setName("title")
      .setDescription("Required: The title of the post")
      .setMaxLength(100)
      .setRequired(true)
    )
    .addStringOption((option) => option
      .setName("due")
      .setDescription("Required: The deadline of the post in DD-MM format; EST or EDT will be used")
      .setRequired(true)
    )
    .addStringOption((option) => option
      .setName("boilerplate")
      .setDescription("Required: The post type that tells what Pengauthor boilerplate to recommend")
      .setAutocomplete(true)
      .setRequired(true)
    )
    .addStringOption((option) => option
      .setName("thumbnail")
      .setDescription("Required: Select the thumbnail name, enter a thumbnail URL, or use \"TBD\"")
      .setAutocomplete(true)
      .setRequired(true)
    )
    .addStringOption((option) => option
      .setName("note")
      .setDescription("Optional: Enter a Pengauthor note code or its link")
      .setMinLength(4)
      .setRequired(false)
    )
    .addUserOption((option) => option
      .setName("covered_by")
      .setDescription("Optional: Set the reporter covering this post, if pre-determined")
      .setRequired(false)
    )
    .addStringOption((option) => option
      .setName("message")
      .setDescription("Optional: Append a message to the end of the schedule")
      .setRequired(false)
    )
    .addBooleanOption((option) => option
      .setName("ephemeral")
      .setDescription("Optional: Show everybody in this chat that you're scheduling a post")
      .setRequired(false)
    ),
  messageCommands: [],

  async autocomplete({ interaction }) {
    const focused = interaction.options.getFocused(true);
    const options = {
      boilerplate: config.boilerplates,
      thumbnail: config.thumbnails
    };
    if (options[focused.name]) await sendAutocomplete(interaction, options[focused.name]);
  },

  async execute({ interaction }) {
    const options = {
      title: interaction.options.getString("title")?.trim(),
      due: interaction.options.getString("due")?.trim(),
      boilerplate: interaction.options.getString("boilerplate")?.trim(),
      thumbnail: interaction.options.getString("thumbnail")?.trim() || null,
      covered_by: interaction.options.getUser("covered_by")?.id || null,
      note: interaction.options.getString("note")?.trim(),
      message: interaction.options.getString("message")?.trim(),
      scheduler: interaction.user.id
    };
    const ephemeral = interaction?.options.getBoolean("ephemeral") ?? false;
    const errors = [];
    const isURL = /^https?:\/\/\S+$/i;

    if (!(/^\d{2}-\d{2}$/).test(options.due)) errors.push("The due date must be in DD-MM format; for example, **12-07** for **July 12**.");
    const [day, month] = options.due.split("-").map(Number);
    const year = new Date().getFullYear();
    const daysInMonth = new Date(year, month, 0).getDate();
    if (month < 1 || month > 12 || day < 1 || day > daysInMonth) {
      errors.push("The due date must be a valid calendar date in DD-MM format.");
    }
    if (!errors.length) options.due = toEST(options.due);
    if (
      options.thumbnail
      && options.thumbnail.toLowerCase() !== "tbd"
      && !isURL.test(options.thumbnail)
      && !config.thumbnails[options.thumbnail]
    ) errors.push("The thumbnail input must be a valid URL, a thumbnail name, or `TBD`.");
    if (options.note?.startsWith("http")) {
      try {
        options.note = new URL(options.note).pathname.split("/").filter(Boolean).pop();
      } catch {
        errors.push("The note URL provided is invalid; use a valid URL or just insert the 4-digit code of the note.");
      }
    }

    if (errors.length) return await interaction.reply({
      components: [
        container([
          text(
            `### ${emoji("Error")} Error\n`
          + `${errors.map((error) => `${error}`).join(" ")}\n`
          + `-# **Protip:** On desktop, use the **\`↑\`** key to reuse the command you just tried sending!`
          )
        ])
      ],
      flags: MessageFlags.IsComponentsV2 | (ephemeral * MessageFlags.Ephemeral)
    });
    else await interaction.deferReply({
      flags: MessageFlags.IsComponentsV2 | (ephemeral * MessageFlags.Ephemeral)
    });

    const channel = await interaction.client.channels.fetch(config.channels.news);

    let thumbnailName = null;
    let thumbnailURL = null;
    if (options.thumbnail?.toLowerCase() === "tbd") {
      thumbnailName = "Requested; coming soon";
    } else if (options.thumbnail) {
      if (isURL.test(options.thumbnail)) {
        thumbnailURL = options.thumbnail;
      } else {
        thumbnailName = options.thumbnail;
        thumbnailURL = config.thumbnails[options.thumbnail] || null;
      }
    }
    options.thumbnail = thumbnailURL;

    const post = await schedulePost({ options });
    logger.info(`Post scheduled: "${post.title}" (${post.id})`);
    const message = await sendScheduleMessage(channel, {
      post,
      state: "scheduled"
    });
    await modifyPost(post.id, { message_id: message.id });

    await interaction.editReply({
      components: [
        container([
          text(
            `### ${emoji("Success")} Post scheduled!\n`
          + `**[${post.title}](https://discord.com/channels/${config.guildId}/${config.channels.news}/${post.message_id})** has been scheduled.\n`
          + `Due: ${timestamp(options.due, "D")}`
          ),
          actionRow(
            button({
              label: "View",
              style: 5,
              url: `${message.url}`
            })
          ),
          text(
            `-# Internal post ID: ${post.id} • Scheduler: @${interaction.user.username}\n`
          + `${ephemeral ? "-# You may safely dismiss this ephemeral message." : ""}`
          )
        ])
      ],
      flags: MessageFlags.IsComponentsV2 | (ephemeral * MessageFlags.Ephemeral)
    });
  }
};
