const express = require("express");
const { uploadToS3 } = require("../utils");
const {
  updateAsset,
  uploadDigitalWearables,
} = require("../controllers/adminController");

const router = express.Router();

router.post("/update", updateAsset);
router.post(
  "/upload",
  uploadToS3("XRCIE/digitalWearables").fields([
    {
      name: "assets",
      maxCount: 5,
    },
  ]),
  uploadDigitalWearables
);

module.exports = router;
