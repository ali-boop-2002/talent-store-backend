// middleware/upload.ts
import multer from "multer";

const storage = multer.memoryStorage(); // Store files in memory

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10, // Max 10 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const isValid = allowedTypes.test(file.mimetype);
    cb(null, isValid);
  },
});

export { upload };
