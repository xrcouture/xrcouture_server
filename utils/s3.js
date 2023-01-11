const { S3Client } = require("@aws-sdk/client-s3");
const multerS3 = require("multer-s3");
const multer = require("multer");
const path = require("path");
const constants = require("../utils/constants");

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

// AWS S3 client config
const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  sslEnabled: true,
  s3ForcePathStyle: true,
  signatureVersion: "v4",
});

// FILTER OPTIONS LIKE VALIDATING FILE EXTENSION
const filter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|glb/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Allow images only of extensions jpeg|jpg|png|glb !");
  }
};

// CREATE MULTER-S3 FUNCTION FOR STORAGE
const multerS3Config = multerS3({
  s3: s3,
  // bucket - WE CAN PASS SUB FOLDER NAME ALSO LIKE 'bucket-name/sub-folder1'
  bucket: bucketName,
  // META DATA FOR PUTTING FIELD NAME
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  // SET / MODIFY ORIGINAL FILE NAME
  key: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

// CREATE MULTER FUNCTION FOR UPLOAD
const uploadToS3 = multer({
  storage: multerS3Config,
  fileFilter: filter,
  limits: {
    fileSize: constants.MAX_UPLOAD_FILE_SIZE, // we are allowing only 200 MB files
  },
});

module.exports = uploadToS3;
