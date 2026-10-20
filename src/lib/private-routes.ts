/** Private views are static shells; their APIs independently enforce session, ownership and MFA. */
export function privateShellPath(pathname: string) {
  return pathname
    .replace(/^(\/(?:en|hi|bn|ml)\/account\/works)\/[a-f0-9-]{36}\/?$/, "$1/edit/")
    .replace(/^(\/(?:en|hi|bn|ml)\/admin\/review)\/[a-f0-9-]{36}\/?$/, "$1/item/");
}
