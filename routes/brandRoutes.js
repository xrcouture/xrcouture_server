const express = require("express");
const { uploadToS3 } = require("../utils");
const {
  createBrandAssets,
  retrieveAssets,
  assetName,
  updateAsset,
  retrieveAsset,
  deleteAssets,
  saveASDraft,
  sendFeedBack,
  readNotifications
} = require("../controllers/brandController");

const router = express.Router();

router.post(
  "/create",
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
  createBrandAssets
);
router.post(
  "/saveasdraft",
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
  saveASDraft
);
router.post(
  "/update",
  uploadToS3("XRCIE/brandAssets").fields([
    {
      name: "assets",
      maxCount: 5,
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
router.post("/sendfeedback", sendFeedBack);
router.post("/readnotifications", readNotifications);

module.exports = router;
