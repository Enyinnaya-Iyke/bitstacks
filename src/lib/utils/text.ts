export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const ipfsToHttp = (url?: string | null): string | null => {
  if (!url) return null;
  return url.startsWith("ipfs://")
    ? `https://ipfs.io/ipfs/${url.replace("ipfs://", "")}`
    : url;
};
