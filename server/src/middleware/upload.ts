import multer, { Multer } from 'multer';
import { config } from '../config';

// Configure multer for file uploads
const storage = multer.memoryStorage();

export const upload: Multer = multer({
  storage: storage,
  limits: { 
    fileSize: config.MAX_FILE_SIZE 
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

// Middleware for single file upload
export const uploadSingle = (fieldName: string = 'imageFile') => upload.single(fieldName);