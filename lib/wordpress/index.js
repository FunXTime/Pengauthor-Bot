import { getSite } from "./fetch.js";
import * as rest from "./rest.js";
import * as wpcom from "./wpcom.js";
export { DEFAULT_SITE, wpFetch } from "./fetch.js";

const adapterFor = (site) => (
  getSite(site).api === "wpcom" ? wpcom : rest
);
const newestFirst = (posts) => posts.sort(
  (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
);

export async function searchPosts(
  site, query, { filterTopTen = true, ...options } = {}
) {
  const api = adapterFor(site);
  const { topTenCategory } = getSite(site);
  let posts = await api.search(site, query, options);

  if (filterTopTen && topTenCategory != null) {
    posts = posts.filter((post) => !api.hasCategory(post, topTenCategory));
  }

  return newestFirst(posts.map(api.normalize));
}

export async function getPost(site, id) {
  const api = adapterFor(site);
  return api.normalize(await api.get(site, id));
}

export async function getRecentPosts(
  site, { page = 1, perPage = 20 } = {}
) {
  const api = adapterFor(site);
  const posts = await api.recent(site, { page, perPage });

  return newestFirst(posts.map(api.normalize));
}
