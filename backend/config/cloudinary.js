require("dotenv").config();
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("Cloudinary config:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? "loaded" : "missing",
  api_secret: process.env.CLOUDINARY_API_SECRET ? "loaded" : "missing",
});

const upload = multer({ storage: multer.memoryStorage() });

module.exports = { cloudinary, upload };