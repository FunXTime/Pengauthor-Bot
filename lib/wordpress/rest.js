import { wpFetch } from "./fetch.js";
import { stripHtml } from "./text.js";

export const hasCategory = (post, id) => post.categories?.includes(id);

export function normalize(post) {
  return {
    title: stripHtml(post.title?.rendered),
    description: stripHtml(post.excerpt?.rendered ?? post.content?.rendered),
    url: post.link ?? "",
    thumbnail:
      post.jetpack_featured_media_url
      ?? post.yoast_head_json?.schema?.["@graph"]?.find((i) => i.thumbnailUrl)?.thumbnailUrl
      ?? null,
    author: post.yoast_head_json?.author ?? "",
    timestamp: post.date ?? post.date_gmt ?? ""
  };
}

export async function search(site, query, options) {
  const params = new URLSearchParams({ search: query, per_page: 50, ...options });
  const results = await wpFetch(`wp/v2/search?${params}`, { site });
  return Promise.all(
    results
      .filter((r) => r.subtype === "post")
      .map((r) => get(site, r.id))
  );
}

export const get = (site, id) => wpFetch(
  `wp/v2/posts/${id}`, { site }
);

export const recent = (site, { page, perPage }) => wpFetch(
  `wp/v2/posts?page=${page}&per_page=${perPage}`, { site }
);
