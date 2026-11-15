import { MessageFlags } from "discord.js";
import crypto from "node:crypto";
import config from "../config/index.js";
import { searchPosts } from "./wordpress/index.js";
import {
  container, section, text, thumbnail, actionRow, button, emoji, timestamp
} from "./components.js";

const RESULTS_PER_PAGE = config.research.results_per_page;
const searches = new Map();
const createToken = () => crypto.randomBytes(8).toString("hex");

function createResults(posts, page) {
  const totalPages = Math.max(1, Math.ceil(posts.length / RESULTS_PER_PAGE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * RESULTS_PER_PAGE;
  return {
    posts: posts.slice(start, start + RESULTS_PER_PAGE),
    page: currentPage,
    totalPages
  };
}

export function createResearchState({
  userId, site, query, posts, range, sort
}) {
  const token = createToken();
  searches.set(token, {
    userId, site, query, posts, range, sort,
    page: 1
  });
  return token;
}

export function getResearchState(token) {
  return searches.get(token);
}

export function getResearchPage(token, page) {
  const state = searches.get(token);
  if (!state) return null;
  const results = createResults(state.posts, page);
  state.page = results.page;
  return {
    state,
    ...results
  };
}

export function createResearchReply({
  token, posts, page, totalPages, totalResults, site, query
}) {
  const source = config.research.sites[site];
  const results = posts.length
    ? posts.map((post) => {
      const content = [
        text(
          `### [${post.title}](${post.url})\n`
        + `-# ${post.author || "Unknown author"} • ${timestamp(post.timestamp, "F")}\n`
        + `${post.description?.slice(0, 50) || "No description available."}${post.description?.length > 50 ? "…" : ""}`
        )
      ];
      return post.thumbnail
        ? section({
          components: content,
          accessory: thumbnail(post.thumbnail)
        })
        : content[0];
    }) : [
      text(
        `${emoji("Error")} **No results were found!**`
      + `Try using a different search query. Use filters carefully.`
      )
    ];
  return {
    components: [
      container([
        text(
          `## ${emoji("Research")} Research: ${query}`
        ),
        ...results,
        text(
          `-# ${source.label} • ${totalResults} result${totalResults === 1 ? "" : "s"}\n`
        ),
        actionRow([
          button({
            emoji: emoji("Previous"),
            label: "Previous",
            custom_id: `research:previous:${token}`,
            style: 2,
            disabled: page <= 1
          }),
          button({
            label: `${page} of ${totalPages}`,
            custom_id: `nothing`,
            style: 2,
            disabled: true
          }),
          button({
            emoji: emoji("Next"),
            label: "Next",
            custom_id: `research:next:${token}`,
            style: 2,
            disabled: page >= totalPages
          })
        ])
      ])
    ],
    flags: MessageFlags.IsComponentsV2
  };
}

export async function runResearch({
  userId, site, query, range, sort
}) {
  let posts = await searchPosts(site, query);

  if (range) {
    const match = range.match(/^(\d{4})(?:-(\d{4}))?$/);
    if (!match) throw new Error("Invalid year range. Use YYYY or YYYY-YYYY.");
    const startYear = Number(match[1]);
    const endYear = Number(match[2] || match[1]);
    if (startYear > endYear) throw new Error(
      "The starting year cannot be later than the ending year."
    );
    posts = posts.filter((post) => {
      const year = new Date(post.timestamp).getFullYear();
      return year >= startYear && year <= endYear;
    });
  }

  if (sort === "oldest") posts.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  else if (sort === "title") posts.sort((a, b) => a.title.localeCompare(b.title));
  else posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const token = createResearchState({
    userId, site, query, posts, range, sort
  });
  const page = createResults(posts, 1);

  return {
    token,
    ...page,
    totalResults: posts.length
  };
}
