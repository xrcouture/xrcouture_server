const logger = require("../utils/logger");
const Asset = require("../models/asset");
const Notification = require("../models/notifications");
const User = require("../models/user");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const sendNotificationEmail = require("../utils/sendNotificationEmail");

// **********************************uploadBrandAssets Controller**********************************

const createBrandAssets = async (req, res) => {
  let assetUrl = [];
  let thumbnailUrl = [];

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

  const {
    name,
    brand,
    description,
    platform,
    approximatePrice,
    approximateTime,
  } = req.body;

  const updatedAsset = await Asset.findOneAndUpdate(
    { assetName: name, brandName: brand },
    {
      assetName: name,
      brandName: brand,
      description,
      brandAssetFiles: assetUrl,
      platform,
      thumbnail: thumbnailUrl,
      approximatePrice,
      approximateTime,
      draftPage: undefined,
      status: "Under Review",
    },
    { upsert: true, new: true }
  );

  const notificationMessage = `A new asset ${name} has been created by brand ${brand} and it is now under review`;
  const updatedNotifications = await updateNotifications(
    brand,
    notificationMessage
  );

  logger.info(
    `Asset has been successfully created and updated to db. AssetName: ${name}, BrandName: ${brand}`
  );
  res.status(StatusCodes.OK).json({
    msg: `Assets have been created successfully`,
    notifications: updatedNotifications,
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
  const { name, brand } = req.body;

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
    }
  }

  const updatedAsset = await Asset.findOneAndUpdate(
    { assetName: name, brandName: brand },
    {
      assetName: name,
      brandName: brand,
      brandAssetFiles: assetUrl,
      status: "Under Review",
    },
    { new: true }
  );

  if (updatedAsset) {
    const to = process.env.ADMIN_MAIL;
    const mailContent = `<p>The files of the asset <q>${name}</q> has been updated by brand <q>${brand}</q>. Please login to admin dashboard to view it</p>`;
    const mailSubject = "Asset files updated";
    await sendNotificationEmail(to, mailContent, mailSubject);

    const notificationMessage = `The asset ${name} has been updated by brand ${brand}`;
    const updatedNotifications = await updateNotifications(
      brand,
      notificationMessage
    );

    logger.info(
      `The asset: ${name} has been successfully updated for brand: ${brand}`
    );
    res.status(StatusCodes.OK).json({
      msg: "Assets have been successfully updated",
      notifications: updatedNotifications,
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

// **********************************saveASDraft Controller**********************************

const saveASDraft = async (req, res) => {
  let assetUrl = [];
  let thumbnailUrl = [];

  for (let key of Object.keys(req.files)) {
    if (key == "assets") {
      const fileNames = req.files.assets.map((file) => {
        assetUrl.push(file.location);
        return file.originalname;
      });

      if (fileNames) {
        logger.info(
          `Successfully uploaded ${fileNames} assets to amazon s3 bucket and saved as draft`
        );
      }
    } else if (key == "thumbnail") {
      const fileNames = req.files.thumbnail.map((file) => {
        thumbnailUrl.push(file.location);
        return file.originalname;
      });

      if (fileNames) {
        logger.info(
          `Successfully uploaded ${fileNames} thumbnails to amazon s3 bucket and saved as draft`
        );
      }
    }
  }

  const {
    name,
    brand,
    description,
    platform,
    approximatePrice,
    approximateTime,
    draftPage,
  } = req.body;

  const updatedAsset = await Asset.findOneAndUpdate(
    { assetName: name, brandName: brand },
    {
      assetName: name,
      brandName: brand,
      description,
      brandAssetFiles: assetUrl,
      platform,
      thumbnail: thumbnailUrl,
      approximatePrice,
      approximateTime,
      draftPage,
      status: "Draft",
    },
    { upsert: true, new: true }
  );

  logger.info(
    `Asset has been successfully created and saved as draft. AssetName: ${name}, BrandName: ${brand}`
  );

  res.status(StatusCodes.OK).json({
    msg: `Assets have been saved as draft`,
  });
};

// **********************************sendFeedBack Controller**********************************

const sendFeedBack = async (req, res) => {
  const { name, brand, message } = req.body;
  const user = await User.findOne({ brandName: brand });

  if (!user) {
    logger.error(
      `The user with name: ${brand} is not yet registered for uploading digital wearables.`
    );
    throw new CustomError.UnauthenticatedError("Invalid User");
  }

  const Assets = await Asset.findOne({
    brandName: brand,
    assetName: name,
  });

  if (!Assets) {
    logger.error(`No Assets available for brand: ${brandName}`);
    throw new CustomError.BadRequestError("No Assets available");
  }

  const remarks = {
    sender: brand,
    receiver: "Admin",
    timestamp: Date(),
    message: message,
  };

  let feedbackArray = Assets.feedback ? Assets.feedback : [];
  feedbackArray.push(remarks);

  // **********************************updatedAssets Controller**********************************

  const updatedAssets = await Asset.findOneAndUpdate(
    { assetName: name, brandName: brand },
    {
      assetName: name,
      brandName: brand,
      feedback: feedbackArray,
      status: "Under Review",
    },
    { new: true }
  );

  if (updatedAssets) {
    const to = process.env.ADMIN_MAIL;
    const mailContent = `<p>Feedback for the asset <q>${name}</q> has been sent by brand <q>${brand}</q>. Please login to your admin dashboard to view it</p>`;
    const mailSubject = "Feedback for uploaded assets";
    await sendNotificationEmail(to, mailContent, mailSubject);

    logger.info(
      `Feedback has been successfully updated to db by brand. AssetName: ${name}, BrandName: ${brand}`
    );
    res.status(StatusCodes.OK).json({
      msg: "Feedback has been successfully sent",
    });
  } else {
    logger.error(
      `No feedback has been updated for asset with name: ${name} and brand: ${brand}`
    );
    throw new CustomError.BadRequestError("No feedback has been updated");
  }
};

// **********************************readNotifications Controller**********************************

const readNotifications = async (req, res) => {
  const { index, all, brand } = req.body;

  const brandNotifications = await Notification.findOne({ brandName: brand });
  if (all) {
    const readNotifications = brandNotifications.notifications.map((data) => {
      data.read = true;
      return data;
    });

    const updatedNotifications = await Notification.findOneAndUpdate(
      { brandName: brand },
      {
        notifications: readNotifications,
      },
      { new: true }
    );

    logger.info(
      `All Notifications have been marked as read for brand: ${brand}`
    );
    res.status(StatusCodes.OK).json({
      notifications: updatedNotifications,
      msg: "All Notifications have been marked as read",
    });
  } else {
    if (!index) {
      logger.error(`Empty index for readNotifications for brand: ${brand}`);
      throw new CustomError.BadRequestError("Empty index");
    } else {
      brandNotifications.notifications[index - 1].read = true;
      const updatedNotifications = await Notification.findOneAndUpdate(
        { brandName: brand },
        {
          notifications: brandNotifications.notifications,
        },
        { new: true }
      );

      logger.info(
        `The Notification with Id: ${index} have been marked as read for brand: ${brand}`
      );
      res.status(StatusCodes.OK).json({
        notifications: updatedNotifications,
        msg: "The Notification have been marked as read",
      });
    }
  }
};

// **********************************updateNotifications Controller**********************************

const updateNotifications = async (brand, notificationMessage) => {
  const brandNotification = await Notification.findOne({
    brandName: brand,
  });

  let index = 0;
  let notificationArray = [];

  if (brandNotification) {
    const length = brandNotification.notifications.length;
    index = brandNotification.notifications[length - 1].id
      ? brandNotification.notifications[length - 1].id
      : 0;
    notificationArray = brandNotification.notifications
      ? brandNotification.notifications
      : [];
  }
  index++;

  const notification = {
    notifications: notificationMessage,
    timestamp: Date(),
    read: false,
    id: index,
    sender: brand,
    receiver: "Admin",
  };

  notificationArray.push(notification);
  const updatedNotifications = await Notification.findOneAndUpdate(
    { brandName: brand },
    {
      brandName: brand,
      notifications: notificationArray,
    },
    { upsert: true, new: true }
  );

  if (updatedNotifications) {
    logger.info(`Notification array updated by admin for BrandName: ${brand}`);
  }

  return updatedNotifications;
};

module.exports = {
  createBrandAssets,
  retrieveAssets,
  assetName,
  updateAsset,
  retrieveAsset,
  deleteAssets,
  saveASDraft,
  sendFeedBack,
  readNotifications,
};
