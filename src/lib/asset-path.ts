/**
 * Resolve a public asset against Vite's deployment base. This keeps the same
 * source working at the GitHub Pages project path (/web/) and at a custom
 * domain served from (/).
 */
export function assetPath(asset: string) {
  const origin = import.meta.env.VITE_ASSET_ORIGIN;
  if (origin) return `${origin.replace(/\/$/, "")}/${asset.replace(/^\/+/, "")}`;
  const base = import.meta.env.BASE_URL || "/";
  return `${base.replace(/\/$/, "")}/${asset.replace(/^\/+/, "")}`;
}
