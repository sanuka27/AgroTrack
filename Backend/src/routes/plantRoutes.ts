import { Router } from "express";
import { cacheResponse } from "../middleware/cacheResponse";
import multer from 'multer';
import path from 'path';
import { firebaseService } from '../config/firebase';
import { authMiddleware } from '../middleware/authMiddleware';
import { PlantController } from '../controllers/plantController';

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

// GET /api/plants - Get all user's plants
router.get("/", authMiddleware, PlantController.getPlants);

// GET /api/plants/:id - Get single plant
router.get("/:id", authMiddleware, PlantController.getPlantById);

// POST /api/plants - Create new plant
router.post("/", authMiddleware, plantImageUpload.single('image'), (req, res, next) => {
  console.log('[PlantRoutes] POST /plants - After multer. Has file:', !!req.file);
  if (req.file) {
    console.log('[PlantRoutes] File details:', {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  }
  next();
}, PlantController.createPlant);

// PUT /api/plants/:id - Update plant
router.put("/:id", authMiddleware, plantImageUpload.single('image'), PlantController.updatePlant);

// DELETE /api/plants/:id - Delete plant
router.delete("/:id", authMiddleware, PlantController.deletePlant);

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
