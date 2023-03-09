const express = require("express");
const { uploadToS3 } = require("../utils");
const {
  updateAsset,
  uploadDigitalWearables,
  sendFeedBack,
  readNotifications,
  getAllAssets,
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
router.post("/sendfeedback", sendFeedBack);
router.post("/readnotifications", readNotifications);
router.get("/getAssets", getAllAssets);

module.exports = router;
