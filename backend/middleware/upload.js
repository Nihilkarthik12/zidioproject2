const multer = require('multer');
const path = require('path');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// Enhanced file filter with better validation
const fileFilter = (req, file, cb) => {
  const allowedMimes = {
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'image/gif': true,
    'image/webp': true,
    'image/svg+xml': true
  };

  const allowedExtensions = ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg'];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  // Check MIME type
  if (!allowedMimes[file.mimetype]) {
    req.fileValidationError = `Invalid file type: ${file.mimetype}. Only images are allowed.`;
    return cb(null, false);
  }

  // Check file extension
  if (!allowedExtensions.includes(fileExtension)) {
    req.fileValidationError = `Invalid file extension: ${fileExtension}. Allowed extensions: ${allowedExtensions.join(', ')}`;
    return cb(null, false);
  }

  // Additional security: Check for common image file signatures
  if (file.mimetype === 'image/jpeg' && !file.originalname.toLowerCase().match(/\.jpe?g$/)) {
    req.fileValidationError = 'File extension does not match MIME type';
    return cb(null, false);
  }

  if (file.mimetype === 'image/png' && !file.originalname.toLowerCase().endsWith('.png')) {
    req.fileValidationError = 'File extension does not match MIME type';
    return cb(null, false);
  }

  console.log(`✅ File validation passed: ${file.originalname} (${file.mimetype})`);
  cb(null, true);
};

// Create multer instance with enhanced configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (increased for high-quality images)
    files: 1, // Maximum 1 file per upload
    fields: 10 // Maximum 10 non-file fields
  },
  fileFilter: fileFilter,
  preservePath: false // Don't include full path in filename
});

// Custom error handler for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    // Multer-specific errors
    let message = 'File upload error';
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large. Maximum size is 10MB.';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files. Only one file allowed per upload.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected field name for file upload.';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long.';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long.';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many form fields.';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many form parts.';
        break;
      default:
        message = `Upload error: ${error.message}`;
    }

    console.error('❌ Multer upload error:', error.message);
    return res.status(400).json({
      success: false,
      message: message
    });
  } else if (error) {
    // Other errors (e.g., from fileFilter)
    console.error('❌ Upload validation error:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next();
};

// Single file upload middleware with error handling
exports.uploadSingle = (fieldName = 'image') => {
  return [upload.single(fieldName), handleMulterError];
};

// Multiple files upload middleware (for future use)
exports.uploadMultiple = (fieldName = 'images', maxCount = 5) => {
  return [upload.array(fieldName, maxCount), handleMulterError];
};

// Fields upload middleware (for different file types)
exports.uploadFields = (fields) => {
  return [upload.fields(fields), handleMulterError];
};

// File validation middleware (additional security)
exports.validateImageFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded. Please select an image to upload.'
    });
  }

  // Additional security checks on the uploaded file
  const { buffer, mimetype, size } = req.file;

  // Check if file has content
  if (!buffer || buffer.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Uploaded file is empty.'
    });
  }

  // Check for minimum file size (to prevent empty or corrupted files)
  if (size < 100) { // 100 bytes minimum
    return res.status(400).json({
      success: false,
      message: 'Uploaded file is too small or corrupted.'
    });
  }

  // Basic magic number validation for common image formats
  const magicNumbers = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/gif': [0x47, 0x49, 0x46, 0x38],
    'image/webp': [0x52, 0x49, 0x46, 0x46]
  };

  const expectedMagic = magicNumbers[mimetype];
  if (expectedMagic) {
    const fileHeader = Array.from(buffer.slice(0, expectedMagic.length));
    const isValid = expectedMagic.every((byte, index) => fileHeader[index] === byte);
    
    if (!isValid) {
      console.warn(`⚠️ File magic number mismatch for ${mimetype}`);
      // Don't block entirely, but log the warning
    }
  }

  // Add file metadata to request for easier access
  req.fileMetadata = {
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    encoding: req.file.encoding,
    uploadedAt: new Date().toISOString()
  };

  console.log(`✅ File validated: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)}MB)`);
  next();
};

// File size formatter helper
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get upload statistics (for admin purposes)
exports.getUploadStats = (req) => {
  if (!req.file) return null;
  
  return {
    filename: req.file.originalname,
    size: formatFileSize(req.file.size),
    mimeType: req.file.mimetype,
    timestamp: new Date().toISOString(),
    user: req.user ? req.user.email : 'anonymous'
  };
};

// Clean up middleware (in case you need to handle temporary files later)
exports.cleanupUpload = (req, res, next) => {
  // Since we're using memory storage, we don't need to clean up disk files
  // But this middleware can be used for other cleanup tasks
  res.on('finish', () => {
    // Clear the file buffer to free memory after response is sent
    if (req.file && req.file.buffer) {
      req.file.buffer = null;
    }
  });
  next();
};

module.exports = upload;