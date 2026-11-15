import cron from "node-cron";
import config from "../config/index.js";
import { getMeta, modifyMeta, getPosts } from "./supabase.js";
import { logger } from "./utils.js";
import {
  MessageFlags, container, text, emoji, timestamp
} from "./components.js";

const reminders = config.reminders;

async function sendTip(channel, key, emojiName) {
  const tips = config.tips;
  if (!tips.length) return logger.error("No tips available.");
  const { value } = await getMeta(key);
  const index = Number(value) || 0;
  await channel.send({
    components: [
      container(
        text(
          `${emoji(emojiName)} **Tip of the Day**\n`
        + `${tips[index]}`
        )
      )
    ],
    flags: MessageFlags.IsComponentsV2
  });
  await modifyMeta(key, { value: (index + 1) % tips.length });
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
    const thread = await client.channels.fetch(threadMappings[reporterId]);
    if (!thread?.isTextBased()) {
      logger.error(`${reporterId} does not have a thread mapped to them!`);
      continue;
    };
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
  }
}

async function runSpecial(special, channelId, client) {
  if (special === "tips for reporters") {
    const channel = await client.channels.fetch(reminder.channelId);
    return await sendTip(channel, "daily_reporter_tip_index", "Tip");
  } else if (special === "tips for editors") {
    const channel = await client.channels.fetch(reminder.channelId);
    return await sendTip(channel, "daily_editor_tip_index", "Tip");
  } else if (special === "posts") {
    return await sendPostReminders(client);
  }
  logger.error(`Unknown reminder special: ${special}`);
}

async function runReminder(client, reminder) {
  if (reminder.special) return await runSpecial(
    reminder.special, reminder.channelId, client
  );
  else if (reminder.message) return await channel.send(reminder.message);
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
