import fs from "node:fs/promises";
import path from "node:path";

/**
 * Everything about where product images live on disk.
 * Later, moving to cloud storage (e.g. Cloudflare R2) should only change this file.
 */

/** Folder on disk for product images (git-ignored). */
export const PRODUCT_IMAGES_DIR = path.resolve("uploads", "products");

/** Public URL path for an uploaded file. Served by `express.static` (step 4). */
export function productImageUrl(fileName: string): string {
  return `/images/${fileName}`;
}

/**
 * Deletes a product's image file, but only if it's one of ours (`/images/...`).
 * `null` (no image) and external links (`https://...`) are skipped.
 * Never fails the request: the database change already happened, so a file
 * that can't be deleted is only logged (a leftover file is harmless).
 */
export async function deleteProductImage(imageUrl: string | null): Promise<void> {
  if (!imageUrl?.startsWith("/images/")) {
    return;
  }
  // basename keeps only the file name, so a strange value like
  // "/images/../../.env" can never point outside the images folder.
  const fileName = path.basename(imageUrl);
  try {
    await deleteFile(path.join(PRODUCT_IMAGES_DIR, fileName));
  } catch (err) {
    console.error(`Could not delete image file ${fileName}`, err);
  }
}

/** Deletes a file from disk. A file that is already gone is not an error. */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
  }
}
