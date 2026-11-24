import { randomUUID } from "node:crypto";
import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { PRODUCT_IMAGES_DIR } from "../services/storage.service";

/** Allowed image types → the file extension we save them with. */
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB

/** Thrown by fileFilter for a file that isn't an allowed image. */
class WrongFileTypeError extends Error {}

const upload = multer({
  storage: multer.diskStorage({
    // multer creates the folder if it doesn't exist.
    destination: PRODUCT_IMAGES_DIR,
    // Random name: two uploads called "photo.jpg" never overwrite each other,
    // and the client's file name (which could be anything) is never used.
    filename: (_req, file, cb) => {
      cb(null, `${randomUUID()}${IMAGE_TYPES[file.mimetype]}`);
    },
  }),
  limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
  // Runs before the file is saved. Note: the mimetype comes from the client,
  // so this is a basic check (checking the real content is "later").
  fileFilter: (_req, file, cb) => {
    if (file.mimetype in IMAGE_TYPES) {
      cb(null, true);
    } else {
      cb(new WrongFileTypeError("Image must be jpeg, png or webp"));
    }
  },
});

/**
 * Reads one file from the form-data field `image` into `req.file` (saved on disk).
 * multer's errors become clear 4xx responses here instead of a 500.
 */
export function uploadProductImage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  upload.single("image")(req, res, (err: unknown) => {
    if (!err) {
      return next();
    }
    if (err instanceof WrongFileTypeError) {
      return res.status(400).json({ message: err.message });
    }
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ message: "Image must be 2 MB or smaller" });
      }
      // e.g. the file was sent under another field name, or more than one file.
      return res.status(400).json({
        message: `Send one image in the form-data field "image" (${err.message})`,
      });
    }
    next(err); // anything else is our bug → 500
  });
}
