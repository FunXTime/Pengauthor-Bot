import config from "../config/index.js";
import {
  MessageFlags, container, section, text, thumbnail, actionRow, button, emoji, timestamp
} from "./components.js";

function getThumbnail(options) {
  let thumbnailName = null;
  let thumbnailURL = null;

  if (options.thumbnail) {
    thumbnailURL = options.thumbnail;
    const entry = Object.entries(config.thumbnails).find(([, url]) => url === options.thumbnail);
    thumbnailName = entry?.[0] || null;
  }

  const thumbnailText = thumbnailName && thumbnailURL
    ? `Search "[${thumbnailName}](${thumbnailURL})" in Media Library`
    : thumbnailURL
      ? `Use [this](${thumbnailURL}) thumbnail`
      : "Requested";

  return { thumbnailName, thumbnailURL, thumbnailText };
}

export function createScheduleMessage({
  post, state = "scheduled", userId = null
}) {
  const options = post.options || post;
  const { thumbnailURL, thumbnailText } = getThumbnail(options);
  const coveredBy = state === "claimed"
    ? userId
    : options.covered_by;
  const content = state === "scheduled"
    ? `${!options.covered_by ? `-# ${config.schedulePings}\n` : ""}`
    : "";

  return {
    components: [
      container([
        section({
          components: [
            text(
              `${content}`
            + `### **${options.title}**\n`
            + `Due: ${timestamp(options.due, "D")}, ${timestamp(options.due, "R")}\n`
            + `Thumbnail: ${thumbnailText}\n`
            + `Covered by:${!coveredBy ? "" : ` <@${coveredBy}>`}\n`
            + `${options.message ? `\n${options.message}` : ""}`
            )
          ],
          ...(thumbnailURL ? { accessory: thumbnail(thumbnailURL) } : {})
        }),
        actionRow([
          button({
            emoji: emoji(state === "claimed" ? "Write" : "Write_Light"),
            label: state === "claimed" ? "Claimed" : "Claim",
            custom_id: `claim-post:${post.id}`,
            style: state === "claimed" ? 2 : 3,
            disabled: state === "claimed"
          }),
          button({
            emoji: emoji("Instructions"),
            label: "Instructions",
            url: `https://cpa-pengauthor.vercel.app/note/${options.note}`,
            style: 5,
            disabled: !options.note
          }),
          button({
            emoji: emoji("Add_New_Post"),
            label: "Write",
            url: `https://cparmies.org/wp-admin/post-new.php?post_title=${encodeURIComponent(options.title)}&content=Replace+this+paragraph+with+real+content.+Try+using+Pengauthor%27s+boilerplate+generator%21`,
            style: 5,
            disabled: state !== "claimed"
          })
        ])
      ])
    ],
    flags: MessageFlags.IsComponentsV2
  };
}

export async function sendScheduleMessage(channel, state) {
  const message = await channel.send(createScheduleMessage(state));
  return message;
}

export async function editScheduleMessage(messageId, state) {
  const channel = await state.client.channels.fetch(config.channels.news);
  const message = await channel.messages.fetch(messageId);
  return await message.edit(createScheduleMessage(state));
}
