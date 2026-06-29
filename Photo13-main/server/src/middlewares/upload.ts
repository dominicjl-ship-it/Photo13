import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config, ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS } from '../config';
import { ensureDir } from '../utils/fileUtils';
import { InvalidFileTypeError, FileTooLargeError } from '../utils/errors';

ensureDir(config.uploadDir).catch(console.error);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype) && !ALLOWED_EXTENSIONS.includes(ext)) {
    cb(new InvalidFileTypeError(file.mimetype));
    return;
  }
  
  cb(null, true);
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize,
    files: 20,
  },
}).array('images', 20);

export const singleUploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize,
    files: 1,
  },
}).single('image');
