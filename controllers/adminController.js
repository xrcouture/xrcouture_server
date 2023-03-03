const logger = require("../utils/logger");
const Asset = require("../models/asset");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const User = require("../models/user");
const { sendNotificationEmail } = require("../utils/sendNotificationEmail");

const updateAsset = async (req, res) => {
  const { name, brand, budget, time, progress, status } = req.body;

  const updatedAsset = await Asset.findOneAndUpdate(
    { assetName: name, brandName: brand },
    {
      assetName: name,
      brandName: brand,
      budget,
      estimatedTime: time,
      progress,
      status,
    },
    { runValidators: true, new: true }
  );

  if (updatedAsset) {
    const user = await User.findOne({ brandName: brand });

    if (!user) {
      logger.error(
        `The user with name : ${brand} is not yet registered for updating brand asset.`
      );
      throw new CustomError.UnauthenticatedError("Invalid User");
    }

    const to = user.email;
    const mailContent = `<p>The status of the asset <q>${name}</q> has been updated. Please login to your dashboard to view it</p>`;
    const mailSubject = "Asset Status updated";
    await sendNotificationEmail(to, mailContent, mailSubject);

    logger.info(
      `All the assets has been successfully updated by admin for brand: ${brand}`
    );

    res.status(StatusCodes.OK).json({
      msg: "Assets have been successfully updated",
    });
  } else {
    logger.error(
      `No Asset with name: ${name} exists for updating brand: ${brand} for admin`
    );
    throw new CustomError.BadRequestError("No Asset exists");
  }
};

const uploadDigitalWearables = async (req, res) => {
  let assetUrl = [];
  for (let key of Object.keys(req.files)) {
    if (key == "assets") {
      const fileNames = req.files.assets.map((file) => {
        assetUrl.push(file.location);
        return file.originalname;
      });

      if (fileNames) {
        logger.info(
          `Successfully uploaded ${fileNames} digital wearables to amazon s3 bucket by admin`
        );
      }
    }
  }

  const { name, brand, platform } = req.body;
  const wearables = {};

  for (let i = 0; i < platform.length; i++) {
    wearables[platform[i]] = assetUrl[i];
  }
  const updatedWearables = await Asset.findOneAndUpdate(
    { assetName: name, brandName: brand },
    {
      assetName: name,
      brandName: brand,
      digitalWearables: wearables,
    },
    { new: true }
  );

  if (updatedWearables) {
    const user = await User.findOne({ brandName: brand });

    if (!user) {
      logger.error(
        `The user with name: ${brand} is not yet registered for uploading digital wearables.`
      );
      throw new CustomError.UnauthenticatedError("Invalid User");
    }

    const to = user.email;
    const mailContent = `<p>Digital Wearables for the asset <q>${name}</q> has been uploaded. Please login to your dashboard to view it</p>`;
    const mailSubject = "Digital wearables uploaded";
    await sendNotificationEmail(to, mailContent, mailSubject);

    logger.info(
      `Digital wearables has been successfully created and updated to db by admin. AssetName: ${name}, BrandName: ${brand}`
    );
    res.status(StatusCodes.OK).json({
      msg: "Successfully uploaded " + req.files.length + " files",
    });
  } else {
    logger.error(
      `No digital wearables have been uploaded for asset with name: ${name} and brand: ${brand}`
    );
    throw new CustomError.BadRequestError("No digital wearables uploaded");
  }
};

module.exports = {
  updateAsset,
  uploadDigitalWearables,
};
