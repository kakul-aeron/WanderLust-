const cloudinary = require("cloudinary").v2;
const CloudinaryStorage = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "wanderlust_DEV",
    allowed_formats: ["png", "jpeg", "jpg"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});

const testCloudinaryConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log("✅ Cloudinary connection successful:", result);
  } catch (error) {
    console.error("❌ Cloudinary connection failed:", error.message);
  }
};

testCloudinaryConnection();

module.exports = {
  cloudinary,
  storage,
};
