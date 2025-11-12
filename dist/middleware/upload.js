"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
// middleware/upload.ts
const multer_1 = __importDefault(require("multer"));
const storage = multer_1.default.memoryStorage(); // Store files in memory
const upload = (0, multer_1.default)({
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
exports.upload = upload;
//# sourceMappingURL=upload.js.map