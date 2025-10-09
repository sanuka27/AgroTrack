import { Router } from "express";
import { cacheResponse } from "../middleware/cacheResponse";
import multer from 'multer';
import path from 'path';
import { firebaseService } from '../config/firebase';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Configure multer for plant image uploads (store in memory for Firebase upload)
const plantImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for plant images
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

router.get("/", cacheResponse(30), (_req, res) => {
  res.json({ ok: true, service: "plants", items: [] });
});

router.get("/:id", cacheResponse(60, req => `plant:${req.params.id}`), (req, res) => {
  res.json({ ok: true, id: req.params.id, name: "Demo Plant" });
});

// Plant image upload endpoint
router.post('/:plantId/images',
  authMiddleware,
  plantImageUpload.array('images', 10), // Allow up to 10 images
  async (req, res) => {
    try {
      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No image files provided'
        });
      }

      const plantId = req.params.plantId;
      const userId = (req.user as any)._id || (req.user as any).uid;
      const bucket = firebaseService.getStorage().bucket();
      const uploadedImages: string[] = [];

      // Upload each file to Firebase Storage
      for (const file of req.files as Express.Multer.File[]) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `plant-${plantId}-${userId}-${uniqueSuffix}${path.extname(file.originalname)}`;
        const fileRef = bucket.file(`plant-images/${filename}`);

        // Upload file buffer to Firebase Storage
        await fileRef.save(file.buffer, {
          metadata: {
            contentType: file.mimetype,
            metadata: {
              originalName: file.originalname,
              plantId: plantId,
              userId: userId,
              uploadDate: new Date().toISOString()
            }
          },
          validation: 'md5'
        });

        // ✅ Ensure it's publicly readable
        await fileRef.makePublic();

        // Get the public URL
        const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileRef.name}`;
        uploadedImages.push(imageUrl);
      }

      res.json({
        success: true,
        message: 'Plant images uploaded successfully',
        data: {
          plantId,
          uploadedImages,
          count: uploadedImages.length
        }
      });
    } catch (error: any) {
      console.error('Plant image upload error:', error?.message || error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload plant images',
        error: process.env.NODE_ENV === 'development' ? (error?.message || String(error)) : undefined,
      });
    }
  }
);

export default router;
