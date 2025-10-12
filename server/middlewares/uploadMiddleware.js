const multer = require("multer");

// Store files in memory for direct buffer access
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "application/pdf",
      "application/zip",
      "application/x-zip-compressed",
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Only PDF or ZIP files are allowed"));
    }
    cb(null, true);
  },
});

module.exports = { upload };
