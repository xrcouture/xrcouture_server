const logger = require("../utils/logger");
const Asset = require("../models/asset");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const sendNotificationEmail  = require("../utils/sendNotificationEmail");

// **********************************uploadBrandAssets Controller**********************************

const uploadBrandAssets = async (req, res) => {
  let assetUrl = [];
  let thumbnailUrl = [];
  let platforms = [];

  for (let key of Object.keys(req.files)) {
    if (key == "assets") {
      const fileNames = req.files.assets.map((file) => {
        assetUrl.push(file.location);
        return file.originalname;
      });

      if (fileNames) {
        logger.info(
          `Successfully uploaded ${fileNames} assets to amazon s3 bucket`
        );
      }
    } else if (key == "thumbnail") {
      const fileNames = req.files.thumbnail.map((file) => {
        thumbnailUrl.push(file.location);
        return file.originalname;
      });

      if (fileNames) {
        logger.info(
          `Successfully uploaded ${fileNames} thumbnails to amazon s3 bucket`
        );
      }
    }
  }

  const { name, brand, platform } = req.body;

  platform.map((data) => {
    platforms.push(data);
  });

  await Asset.create({
    assetName: name,
    brandName: brand,
    brandAssetFiles: assetUrl,
    platform: platforms,
    thumbnail: thumbnailUrl,
  });

  logger.info(
    `Asset has been successfully created and updated to db. AssetName: ${name}, BrandName: ${brand}`
  );
  res.status(StatusCodes.OK).json({
    msg:
      "Successfully uploaded " +
      (assetUrl.length + thumbnailUrl.length) +
      " files",
  });
};

// **********************************retrieveAssets Controller**********************************

const retrieveAssets = async (req, res, next) => {
  const brandName = req.body.brand;
  const Assets = await Asset.find({
    brandName,
  });

  if (!Assets) {
    logger.error(`No Assets available for brand: ${brandName}`);
    throw new CustomError.BadRequestError("No Assets available");
  }

  logger.info(
    `All the assets has been successfully retrieved for brand: ${brandName}`
  );

  res.status(StatusCodes.OK).json({
    msg: "Assets have been retrieved",
    assets: Assets,
  });
};

// **********************************assetName Controller**********************************

const assetName = async (req, res, next) => {
  const brandName = req.body.brand;
  const assetNames = await Asset.find({ brandName }, { _id: 0, assetName: 1 });

  if (!assetNames) {
    logger.error(`No Assets available for brand: ${brandName}`);
    throw new CustomError.BadRequestError("No Assets available");
  }

  logger.info(
    `All the asset names has been successfully retrieved for brand: ${brandName}`
  );

  res.status(StatusCodes.OK).json({
    assets: assetNames.map((asset) => {
      return asset.assetName;
    }),
  });
};

// **********************************updateAsset Controller**********************************

const updateAsset = async (req, res) => {
  let assetUrl = [];
  let platforms = [];
  let thumbnailUrl = [];
  const { name, brand, platform } = req.body;

  for (let key of Object.keys(req.files)) {
    if (key == "assets") {
      const fileNames = req.files.assets.map((file) => {
        assetUrl.push(file.location);
        return file.originalname;
      });

      if (fileNames) {
        logger.info(
          `Successfully uploaded ${fileNames} assets to amazon s3 bucket while updating asset ${name}`
        );
      }
    } else if (key == "thumbnail") {
      const fileNames = req.files.thumbnail.map((file) => {
        thumbnailUrl.push(file.location);
        return file.originalname;
      });

      if (fileNames) {
        logger.info(
          `Successfully uploaded ${fileNames} thumbnails to amazon s3 bucket while updating asset ${name}`
        );
      }
    }
  }

  platform.map((data) => {
    platforms.push(data);
  });

  const updatedAsset = await Asset.findOneAndUpdate(
    { assetName: name, brandName: brand },
    {
      assetName: name,
      brandName: brand,
      brandAssetFiles: assetUrl,
      platform: platforms,
      thumbnail: thumbnailUrl,
    },
    { new: true }
  );

  if (updatedAsset) {
    const to = "rakesh@xrcouture.com";
    const mailContent = `<p>The status of the asset <q>${name}</q> has been updated by brand <q>${brand}</q>. Please login to admin dashboard to view it</p>`;
    const mailSubject = "Asset Status updated";
    await sendNotificationEmail(to, mailContent, mailSubject);

    logger.info(
      `All the assets has been successfully updated for brand: ${brand}`
    );
    res.status(StatusCodes.OK).json({
      msg: "Assets have been successfully updated",
    });
  } else {
    logger.error(
      `No Asset with name: ${name} exists for updating brand: ${brand}`
    );
    throw new CustomError.BadRequestError("No Asset exists");
  }
};

// **********************************retrieveAsset Controller**********************************

const retrieveAsset = async (req, res, next) => {
  const brandName = req.body.brand;
  const assetName = req.body.name;
  const Assets = await Asset.find({
    brandName,
    assetName,
  });

  if (!Assets) {
    logger.error(`No Assets available for brand: ${brandName}`);
    throw new CustomError.BadRequestError("No Assets available");
  }

  logger.info(
    `The Asset ${assetName} has been successfully retrieved for brand: ${brandName}`
  );

  res.status(StatusCodes.OK).json({
    msg: "Asset have been retrieved",
    asset: Assets,
  });
};

const deleteAssets = async (req, res, next) => {
  const brandName = req.body.brand;
  const asset = req.body.name;

  const Assets = await Asset.deleteMany({
    brandName: req.body.brand,
    assetName: { $in: asset },
  });

  if (!Assets.deletedCount) {
    logger.error(
      `No Assets available for deletion brand: ${brandName} with the name: ${asset}`
    );
    throw new CustomError.BadRequestError("No Assets available");
  }

  logger.info(`Assets ${asset} have been succesfully deleted by brand from DB`);
  res.status(StatusCodes.OK).json({
    msg: "Assets have been deleted by brand",
  });
};

module.exports = {
  uploadBrandAssets,
  retrieveAssets,
  assetName,
  updateAsset,
  retrieveAsset,
  deleteAssets,
};
