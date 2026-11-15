import { MessageFlags } from "discord.js";
import claimPost from "./claim-post.js";
import research from "./research.js";
import { emoji } from "../lib/components.js";

export async function handleInteraction(interaction) {
  if (!interaction.isButton()) return false;

  const customId = interaction.customId;
  const messageAge = Date.now() - interaction.message.createdTimestamp;
  const maxMessageAge = 90 * 24 * 60 * 60 * 1000;
  const args = customId.slice(customId.indexOf(":") + 1).split(";");

  if (messageAge > maxMessageAge) return await interaction.reply({
    content: `${emoji("Error")} **Woah, an ancient message!** You can't interact with messages that were sent 90 days ago or earlier. Better move on!`,
    flags: MessageFlags.Ephemeral
  });

  if (customId.startsWith("claim-post:")) return await claimPost(interaction, args);
  if (customId.startsWith("research:")) return await research(interaction);

  return false;
}
