import { Events } from "discord.js";
import { logger } from "../lib/utils.js";
import { loadCommands, loadEmojis } from "../lib/components.js";
import { startReminders } from "../lib/reminders.js";

export default {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    logger.event(`Connected to Discord (${client.user.tag})`);
    await loadCommands(client);
    await loadEmojis(client);
    startReminders(client);
  }
};
