import multer from 'multer';
import config from '../config';

const storage = multer.memoryStorage();

export const upload = multer({
    storage: storage,
    limits: { 
        fileSize: config.MAX_FILE_SIZE 
    },
    fileFilter: (req, file, cb) => {
        // Add file type validation if needed
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images are allowed.'));
        }
    }
});

export const uploadSingle = upload.single('imageFile');
