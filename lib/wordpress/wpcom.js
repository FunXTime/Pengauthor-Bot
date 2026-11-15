import { wpFetch } from "./fetch.js";
import { stripHtml } from "./text.js";

export const hasCategory = (post, slug) => Object.values(post.categories ?? {}).some(
  (category) => category.slug === slug
);

export function normalize(post) {
  return {
    title: stripHtml(post.title),
    description: stripHtml(post.excerpt ?? post.content),
    url: post.URL ?? "",
    thumbnail: post.featured_image ?? null,
    author: post.author?.name ?? "",
    timestamp: post.date ?? ""
  };
}

export async function search(site, query, options = {}) {
  const number = 50;
  const posts = [];
  let offset = 0;
  while (true) {
    const params = new URLSearchParams({
      search: query,
      number,
      offset,
      ...options
    });
    const { posts: results = [] } = await wpFetch(`posts?${params}`, { site });
    posts.push(...results);
    if (results.length < number) break;
    offset += number;
  }
  return posts;
}

export const get = (site, id) => wpFetch(
  `posts/${id}`, { site }
);

export async function recent(site, { page, perPage }) {
  const { posts = [] } = await wpFetch(`posts?page=${page}&number=${perPage}`, { site });
  return posts;
}
