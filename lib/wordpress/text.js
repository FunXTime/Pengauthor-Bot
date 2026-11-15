const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function stripHtml(html = "") {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/&(#\d+|\w+);/g, (match, entity) =>
      entity[0] === "#"
        ? String.fromCharCode(Number(entity.slice(1)))
        : ENTITIES[entity] ?? match
    );
}
