import cron from "node-cron";
import config from "../config/index.js";
import { getMeta, modifyMeta, getPosts } from "./supabase.js";
import { logger } from "./utils.js";
import {
  MessageFlags, container, text, emoji, timestamp
} from "./components.js";

const reminders = config.reminders;

async function fetchTextChannel(client, channelId) {
  if (!channelId) return null;
  try {
    const channel = await client.channels.fetch(channelId);
    return channel?.isTextBased() ? channel : null;
  } catch (error) {
    logger.error(`Failed to fetch channel ${channelId}: ${error.message}`);
    return null;
  }
}

async function sendTip(channel, key, title, tips) {
  if (!tips?.length) return logger.error("No tips available.");
  const meta = await getMeta(key);
  const index = (Number(meta?.value) || 0) % tips.length;
  const message = await channel.send({
    components: [
      container(
        text(
          `${emoji("Tip")} **${title}**\n`
        + `${tips[index]}`
        )
      )
    ],
    flags: MessageFlags.IsComponentsV2
  })
  const next = (index + 1) % tips.length;
  await modifyMeta(key, { value: next });
  logger.info(`${title} posted in ${channel} (#${index + 1} of ${tips.length})`);
  await message.react("💡");
}

async function sendPostReminders(client) {
  const threadMappings = config.threadMappings;
  const posts = await getPosts();
  const groupedPosts = new Map();
  for (const post of posts) {
    if (!post.covered_by || !threadMappings[post.covered_by]) continue;
    if (!groupedPosts.has(post.covered_by)) groupedPosts.set(post.covered_by, []);
    groupedPosts.get(post.covered_by).push(post);
  }
  for (const [reporterId, reporterPosts] of groupedPosts) {
    const thread = await fetchTextChannel(client, threadMappings[reporterId]);
    if (!thread) {
      logger.error(`${reporterId} does not have a valid thread mapped to them!`);
      continue;
    }
    const mentions = [...new Set([
      `<@${reporterId}>`,
      ...reporterPosts.flatMap((post) => [
        ...(post.scheduler ? [`<@${post.scheduler}>`] : []),
        ...(post.editors || []).map((editor) => `<@${editor}>`)
      ])
    ])].join(" ");
    const postList = reporterPosts.map((post) =>
      `> **${post.title}**\n`
    + `> Due: ${timestamp(post.due, "D")} (${timestamp(post.due, "R")})`
    ).join("\n\n");
    try {
      await thread.send({
        components: [
          container(
            text(
              `-# ${mentions}\n`
            + `### Hey, <@${reporterId}>!\n`
            + `The following posts are still assigned:\n\n`
            + `${postList}\n\n`
            + `What's the progress on these?`
            )
          )
        ],
        flags: MessageFlags.IsComponentsV2
      });
    } catch (error) {
      logger.error(`Failed to send reminder for ${reporterId}: ${error.message}`);
    }
  }
}

async function runSpecial(special, channelId, client) {
  if (special === "posts") return await sendPostReminders(client);

  const tipTypes = {
    "tips for reporters": {
      key: "daily_reporter_tip_index",
      title: "Tip of the Day",
      tips: config.tips
    },
    "tips for editors": {
      key: "daily_editor_tip_index",
      title: "Editors' Tip of the Day",
      tips: config.editorTips
    }
  };

  const tipType = tipTypes[special];
  if (!tipType) return logger.error(`Unknown reminder special: ${special}`);

  const channel = await fetchTextChannel(client, channelId);
  if (!channel) return logger.error(`Invalid channel for "${special}": ${channelId}`);
  return await sendTip(channel, tipType.key, tipType.title, tipType.tips);
}

async function runReminder(client, reminder) {
  if (reminder.special) {
    return await runSpecial(reminder.special, reminder.channelId, client);
  }
  if (reminder.message) {
    const channel = await fetchTextChannel(client, reminder.channelId);
    if (!channel) return logger.error(`Invalid channel for reminder: ${reminder.channelId}`);
    return await channel.send(reminder.message);
  }
  logger.error("Reminder has neither a special nor a message.");
}

export function startReminders(client) {
  let scheduled = 0;
  for (const reminder of reminders) {
    if (!cron.validate(reminder.schedule)) {
      logger.error(`Invalid cron schedule: ${reminder.schedule}`);
      continue;
    }
    cron.schedule(
      reminder.schedule,
      () => runReminder(client, reminder).catch((error) => {
        logger.error(error.stack || error.message);
      }),
      { timezone: "UTC" }
    );
    scheduled++;
  }

  logger.info(`Scheduled cron reminders (${scheduled} reminders)`);
}
