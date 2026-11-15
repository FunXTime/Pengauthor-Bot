import {
  getResearchState, getResearchPage, createResearchReply
} from "../lib/research.js";
import {
  MessageFlags, container, emoji, commandMention, text
} from "../lib/components.js";

export default async function research(interaction) {
  const [, action, token] = interaction.customId.split(":");
  const state = getResearchState(token);
  const mention = commandMention(interaction.client, "research");

  if (!state) return interaction.reply({
    components: [
      container(
        text(
          `${emoji("Error")} **Research again!**\n`
        + `This research session has expired. Run the ${mention} command again.`
        )
      )
    ],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
  });

  if (state.userId !== interaction.user.id) return interaction.reply({
    components: [
      container(
        text(
          `${emoji("Error")} **This isn't for you!**\n`
        + `This research session is for <@${state.userId}>. If you want to start your own research session, use the ${mention} command.`
        )
      )
    ],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
  });

  if (action === "previous") state.page--;
  if (action === "next") state.page++;
  const results = getResearchPage(token, state.page);

  await interaction.update(
    createResearchReply({
      token,
      posts: results.posts,
      page: results.page,
      totalPages: results.totalPages,
      totalResults: state.posts.length,
      site: state.site,
      query: state.query
    })
  );
}
