/**
 * Returns the public URL for a listing image.
 * - Paths starting with "/" are treated as local app assets.
 * - Otherwise uses Supabase storage (listing-images bucket).
 * - Fallback: "Vintage Leather Backpack" uses the bundled demo image when no images are set.
 */
export function getListingImageUrl(
  listing: { images?: unknown; title?: string },
  index = 0
): string {
  const images = (listing.images as string[] | undefined) ?? [];
  const first = images[index];
  if (first?.startsWith("/")) return first;
  if (first) {
    const base = import.meta.env.VITE_SUPABASE_URL;
    return `${base}/storage/v1/object/public/listing-images/${first}`;
  }
  if (listing.title === "Vintage Leather Backpack") return "/vintage-leather-backpack.png";
  return "/placeholder.svg";
}
