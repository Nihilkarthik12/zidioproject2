const cloudinary = require('cloudinary').v2;

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Check if Cloudinary credentials are available
const hasCloudinaryCredentials = process.env.CLOUDINARY_CLOUD_NAME && 
                                 process.env.CLOUDINARY_API_KEY && 
                                 process.env.CLOUDINARY_API_SECRET &&
                                 process.env.CLOUDINARY_CLOUD_NAME !== 'development';

if (hasCloudinaryCredentials) {
  // Configure Cloudinary with real credentials
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  console.log('✅ Cloudinary configured successfully');
} else {
  // In development or when credentials are missing, use a mock configuration
  console.log('⚠️  Cloudinary not configured - Running in development mode');
  
  // Create a mock cloudinary object to prevent errors
  cloudinary.uploader = {
    upload_stream: () => {
      throw new Error('Cloudinary not configured. Please set up your Cloudinary credentials.');
    },
    destroy: () => {
      throw new Error('Cloudinary not configured. Please set up your Cloudinary credentials.');
    }
  };
}

module.exports = cloudinary;