import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  isCloudinaryConfigured,
  uploadBufferToCloudinary,
  deleteFromCloudinary
} from "../utils/cloudinary.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

// Ensure fallback upload dir exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Memory storage for direct streaming to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  }
});

const router = express.Router();

/**
 * Helper to handle fallback local storage when Cloudinary keys are missing
 */
function saveLocalFallback(file) {
  const ext = path.extname(file.originalname) || ".png";
  const uniqueName = `img_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
  const filePath = path.join(UPLOAD_DIR, uniqueName);
  fs.writeFileSync(filePath, file.buffer);
  return {
    url: `/uploads/${uniqueName}`,
    filename: uniqueName,
    public_id: uniqueName,
    provider: "local"
  };
}

/**
 * GET /api/upload/config - Check Cloudinary setup status
 */
router.get("/config", (req, res) => {
  const configured = isCloudinaryConfigured();
  res.json({
    success: true,
    data: {
      provider: configured ? "cloudinary" : "local_fallback",
      isCloudinaryReady: configured,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME ? `${process.env.CLOUDINARY_CLOUD_NAME.slice(0, 3)}***` : null
    }
  });
});

/**
 * POST /api/upload - Upload single image
 */
router.post("/", (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    if (isCloudinaryConfigured()) {
      // Direct stream to Cloudinary
      const folder = req.body.folder || "lipoma_store";
      const result = await uploadBufferToCloudinary(req.file.buffer, { folder });

      return res.status(201).json({
        success: true,
        message: "Image uploaded to Cloudinary successfully",
        data: {
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          size: result.bytes,
          provider: "cloudinary"
        }
      });
    }

    // Local fallback if Cloudinary credentials are not set
    const fallbackData = saveLocalFallback(req.file);
    return res.status(201).json({
      success: true,
      message: "Image saved locally (Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env for Cloudinary)",
      data: fallbackData
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload image"
    });
  }
});

/**
 * POST /api/upload/multiple - Upload multiple images (up to 10)
 */
router.post("/multiple", (req, res, next) => {
  upload.array("images", 10)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No image files provided" });
    }

    const folder = req.body.folder || "lipoma_store";
    const uploadedImages = [];

    for (const file of req.files) {
      if (isCloudinaryConfigured()) {
        const result = await uploadBufferToCloudinary(file.buffer, { folder });
        uploadedImages.push({
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          size: result.bytes,
          provider: "cloudinary"
        });
      } else {
        const fallback = saveLocalFallback(file);
        uploadedImages.push(fallback);
      }
    }

    res.status(201).json({
      success: true,
      data: uploadedImages,
      provider: isCloudinaryConfigured() ? "cloudinary" : "local_fallback"
    });
  } catch (error) {
    console.error("Multiple upload error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload images"
    });
  }
});

/**
 * DELETE /api/upload/:publicId - Delete image from Cloudinary or local disk
 */
router.delete("/:publicId(*)", async (req, res) => {
  try {
    const { publicId } = req.params;
    if (!publicId) {
      return res.status(400).json({ success: false, message: "Public ID is required" });
    }

    if (isCloudinaryConfigured() && !publicId.startsWith("img_")) {
      const result = await deleteFromCloudinary(publicId);
      return res.json({ success: true, data: result, message: "Deleted from Cloudinary" });
    }

    // Try deleting from local uploads if exists
    const localPath = path.join(UPLOAD_DIR, path.basename(publicId));
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
      return res.json({ success: true, message: "Deleted local file" });
    }

    res.json({ success: true, message: "File removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
