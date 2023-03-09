const logger = require("../utils/logger");
const Asset = require("../models/asset");
const Notification = require("../models/notifications");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const User = require("../models/user");
const sendNotificationEmail = require("../utils/sendNotificationEmail");

const updateAsset = async (req, res) => {
  const { name, brand, budget, time, progress, status } = req.body;

  const updatedAsset = await Asset.findOneAndUpdate(
    { assetName: name, brandName: brand },
    {
      assetName: name,
      brandName: brand,
      actualPrice: budget,
      actualTime: time,
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

    const notificationMessage = `The status of the asset ${name} has been updated`;
    const updatedNotifications = await updateNotifications(
      brand,
      notificationMessage
    );

    logger.info(
      `All the assets has been successfully updated by admin for brand: ${brand}`
    );

    res.status(StatusCodes.OK).json({
      msg: "Assets have been successfully updated",
      notification: updatedNotifications,
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
  const { name, brand, platform } = req.body;
  const wearables = {};

  const user = await User.findOne({ brandName: brand });

  if (!user) {
    logger.error(
      `The user with name: ${brand} is not yet registered for uploading digital wearables.`
    );
    throw new CustomError.UnauthenticatedError("Invalid User");
  }

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
    const to = user.email;
    const mailContent = `<p>Digital Wearables for the asset <q>${name}</q> has been uploaded. Please login to your dashboard to view it</p>`;
    const mailSubject = "Digital wearables uploaded";
    await sendNotificationEmail(to, mailContent, mailSubject);

    const notificationMessage = `Digital Wearables for the asset ${name} has been uploaded`;
    const updatedNotifications = await updateNotifications(
      brand,
      notificationMessage
    );

    logger.info(
      `Digital wearables has been successfully created and updated to db by admin. AssetName: ${name}, BrandName: ${brand}`
    );
    res.status(StatusCodes.OK).json({
      msg: "Successfully uploaded Digital wearables",
      notification: updatedNotifications,
    });
  } else {
    logger.error(
      `No digital wearables have been uploaded for asset with name: ${name} and brand: ${brand}`
    );
    throw new CustomError.BadRequestError("No digital wearables uploaded");
  }
};

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
    sender: "Admin",
    receiver: brand,
    timestamp: Date(),
    message: message,
  };

  let feedbackArray = Assets.feedback ? Assets.feedback : [];
  feedbackArray.push(remarks);

  const updatedWearables = await Asset.findOneAndUpdate(
    { assetName: name, brandName: brand },
    {
      assetName: name,
      brandName: brand,
      feedback: feedbackArray,
      status: "Action Required",
    },
    { new: true }
  );

  if (updatedWearables) {
    const to = user.email;
    const mailContent = `<p>Feedback for the asset <q>${name}</q> has been sent. Please login to your dashboard to view it</p>`;
    const mailSubject = "Feedback for uploaded assets";
    await sendNotificationEmail(to, mailContent, mailSubject);

    logger.info(
      `Feedback has been successfully updated to db by admin. AssetName: ${name}, BrandName: ${brand}`
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

const readNotifications = async (req, res) => {
  const { index, all, brand } = req.body;

  const allNotifications = await Notification.find();
  if (all) {
    const readAllNotifications = await Promise.all(
      allNotifications.map(async (data) => {
        const brandNotifications = data.notifications.map((subdata) => {
          subdata.read = true;
          return subdata;
        });
        const updatedNotifications = await Notification.findOneAndUpdate(
          { brandName: data.brandName },
          {
            notifications: brandNotifications,
          },
          { new: true, upsert: true }
        );
        data.notifications = brandNotifications;
        return data;
      })
    );

    if (readAllNotifications) {
      logger.info(`All Notifications have been marked as read by Admin`);
      res.status(StatusCodes.OK).json({
        notifications: readAllNotifications,
        msg: "All Notifications have been marked as read by Admin",
      });
    } else {
      logger.error(`No notifications fetched from DB for reading it by admin`);
      throw new CustomError.BadRequestError("No notifications fetched from DB");
    }
  } else {
    if (!index) {
      logger.error(`Empty index for readNotifications for brand: ${brand}`);
      throw new CustomError.BadRequestError("Empty index");
    } else {
      allNotifications.notifications[index - 1].read = true;
      const updatedNotifications = await Notification.findOneAndUpdate(
        { brandName: brand },
        {
          notifications: allNotifications.notifications,
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
    sender: "Admin",
    receiver: brand,
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

const getAllAssets = async (req, res) => {
  const assets = await Asset.aggregate([
    {
      $group: {
        _id: "$brandName",
        count: { $sum: 1 },
        status: { $push: "$status" },
      },
    },
    { $unwind: "$status" },
    {
      $group: {
        _id: { brandName: "$_id", status: "$status" },
        scount: { $sum: 1 },
        count: { $first: "$count" },
      },
    },
    {
      $group: {
        _id: "$_id.brandName",
        total: { $first: "$count" },
        status: { $push: { type: "$_id.status", count: "$scount" } },
      },
    },
    {
      $sort: {
        total: -1,
      },
    },
    {
      $project: {
        _id: 0,
        brand: "$_id",
        totalCount: "$total",
        status: "$status.type",
        counter: "$status.count",
      },
    },
  ]);

  const newAsset = assets.map((data) => {
    data.status.map((r, j) => {
      data[r] = data.counter[j];
    });
    delete data.status;
    delete data.counter;
    return data;
  });

  if (assets) {
    logger.info(`All the assets have been retrieved by admin`);
    res.status(StatusCodes.OK).json({
      assets: newAsset,
      msg: "All the assets have been retrieved by admin",
    });
  } else {
    logger.error(`No assets have been fetched from DB by admin`);
    throw new CustomError.BadRequestError("No Assets retrieved");
  }
};

module.exports = {
  updateAsset,
  uploadDigitalWearables,
  sendFeedBack,
  readNotifications,
  getAllAssets,
};
