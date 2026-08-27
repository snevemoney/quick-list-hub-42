import { z } from "zod";
import { LISTING_CATEGORIES } from "@/lib/listing";
import { parseDollarInputToCents } from "@/lib/money";

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string | undefined): value is string {
  return !!value && UUID_RE.test(value);
}

export const authSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(6).max(72),
});

export const listingFormSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(4000),
  price: z
    .string()
    .trim()
    .refine((v) => parseDollarInputToCents(v) !== null, "Enter a valid price"),
  category: z.enum(LISTING_CATEGORIES),
  city: z.string().trim().max(80),
});

export const messageSchema = z.string().trim().min(1).max(2000);

export const PAGE_SIZE = 24;

const ILIKE_UNSAFE = /[%_,()"'\\]/g;

export function sanitizeSearch(raw: string): string {
  return raw.replace(ILIKE_UNSAFE, "").trim().slice(0, 80);
}

export const MAX_LISTING_IMAGES = 6;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

export function validateListingImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return "Images must be JPEG, PNG, WebP, or GIF";
  if (file.size > MAX_IMAGE_BYTES) return "Each image must be 5MB or smaller";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_IMAGE_EXT.has(ext)) return "Invalid image file extension";
  return null;
}

export function imageExtension(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return ALLOWED_IMAGE_EXT.has(ext) ? (ext === "jpeg" ? "jpg" : ext) : "jpg";
}
