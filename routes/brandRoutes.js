const express = require("express");
const { uploadToS3 } = require("../utils");
const {
  uploadBrandAssets,
  retrieveAssets,
  assetName,
  updateAsset,
  retrieveAsset,
  deleteAssets,
} = require("../controllers/brandController");

const router = express.Router();

router.post(
  "/upload",
  uploadToS3("XRCIE/brandAssets").fields([
    {
      name: "assets",
      maxCount: 10,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  uploadBrandAssets
);
router.post(
  "/update",
  uploadToS3("XRCIE/brandAssets").fields([
    {
      name: "assets",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  updateAsset
);

router.post("/assets", retrieveAssets);
router.post("/asset", retrieveAsset);
router.post("/assetNames", assetName);
router.delete("/delete", deleteAssets);

module.exports = router;
