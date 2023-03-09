const { createJWT, isTokenValid, attachCookiesToResponse } = require("./jwt");
const createTokenUser = require("./createTokenUser");
const sendVerificationEmail = require("./sendVerficationEmail");
const sendResetPasswordEmail = require("./sendResetPasswordEmail");
const sendNotificationEmail = require("./sendNotificationEmail");
const createHash = require("./createHash");
const uploadToS3 = require("./s3");

module.exports = {
  createJWT,
  isTokenValid,
  attachCookiesToResponse,
  createTokenUser,
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendNotificationEmail,
  createHash,
  uploadToS3,
};
