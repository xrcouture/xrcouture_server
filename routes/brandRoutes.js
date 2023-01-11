const express = require("express");
const { uploadToS3 } = require("../utils");
const upload2dAssets = require("../controllers/brandController")

const router = express.Router();


router.post("/upload", uploadToS3.any('file'), upload2dAssets);

module.exports = router;
