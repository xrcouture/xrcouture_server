const User = require("../models/user");
const Token = require("../models/token");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const crypto = require("crypto");
const constants = require("../utils/constants");
const logger = require("../utils/logger");

const {
  attachCookiesToResponse,
  createTokenUser,
  sendVerificationEmail,
  sendResetPasswordEmail,
  createHash,
} = require("../utils");

// **********************************signUp Controller**********************************
const signUp = async (req, res) => {
  const { email, password } = req.body;

  const emailAlreadyExists = await User.findOne({ email });
  if (emailAlreadyExists) {
    logger.error(
      `Email Id: ${email} already exists in the DB during signup process`
    );
    throw new CustomError.BadRequestError("Email already exists");
  }

  const role = "brand";
  const isSignUpCompleted = false;

  const verificationToken = crypto.randomBytes(40).toString("hex");

  const user = await User.create({
    email,
    password,
    role,
    verificationToken,
    isSignUpCompleted,
  });

  const origin = process.env.CURRENT_ORIGIN;

  await sendVerificationEmail({
    email: user.email,
    verificationToken: user.verificationToken,
    origin,
  });

  res.status(StatusCodes.CREATED).json({
    msg: "Success! Please check your email to verify account",
  });
  logger.info(`Verification mail successfully sent for: ${email}.`);
};

// **********************************signIn Controller**********************************
const signIn = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    logger.error(`Empty email or password sent during signin process`);
    throw new CustomError.BadRequestError("Please provide email and password");
  }
  const user = await User.findOne({ email });

  if (!user) {
    logger.error(`The user with mail id : ${email} is not yet registered.`);
    throw new CustomError.UnauthenticatedError("Invalid User");
  }
  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    logger.error(`Invalid password during signin.`);
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }

  if (!user.isVerified) {
    logger.error(`The user: ${email} is not verified.`);
    throw new CustomError.UnauthenticatedError("Please verify your email");
  }

  const tokenUser = createTokenUser(user);

  // create refresh token
  let refreshToken = "";
  // check for existing token
  const existingToken = await Token.findOne({ user: user._id });

  if (existingToken) {
    refreshToken = existingToken.refreshToken;
    attachCookiesToResponse({ res, user: tokenUser, refreshToken });
    logger.info(
      `Existing Token is used for user : ${email} and attached in cookies`
    );

    res
      .status(StatusCodes.OK)
      .json({ signUpCompleted: user.isSignUpCompleted });
    logger.info(
      `The user: ${user.email} is signed in successfully. The signUpCompleted status is ${user.isSignUpCompleted}`
    );
    return;
  }

  refreshToken = crypto.randomBytes(40).toString("hex");
  const userToken = { refreshToken, user: user._id };

  await Token.create(userToken);

  attachCookiesToResponse({ res, user: tokenUser, refreshToken });
  logger.info(`Token is created for user : ${email} and attached in cookies`);

  res.status(StatusCodes.OK).json({ signUpCompleted: user.isSignUpCompleted });
  logger.info(
    `The user: ${user.email} is signed in successfully. The signUpCompleted status is ${user.isSignUpCompleted}`
  );
};

// **********************************verifyEmail Controller**********************************
const verifyEmail = async (req, res) => {
  const { verificationToken, email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    logger.error(
      `The email verification is failed for the user: ${email}. No such mailId exists`
    );
    throw new CustomError.UnauthenticatedError("Verification Failed");
  }

  if (user.isVerified) {
    logger.error(
      `The email verification is failed for the user: ${email}. The mail Id is already verified`
    );
    throw new CustomError.UnauthorizedError("Email Id is already verified");
  }

  if (user.verificationToken !== verificationToken) {
    logger.error(
      `The email verification is failed for the user: ${email}. The verification token: ${verificationToken} is not valid`
    );
    throw new CustomError.UnauthenticatedError("Verification Failed");
  }

  const updatedUser = await User.findOneAndUpdate(
    { email },
    {
      isVerified: true,
      verified: Date.now(),
      verificationToken: "",
    },
    { new: true }
  );

  logger.info(`The email is verified for the user: ${user.email}`);
  res.status(StatusCodes.OK).json({ msg: "Email Verified" });
};

// **********************************signOut Controller**********************************
const signOut = async (req, res) => {
  try {
    const deletedToken = await Token.findOneAndDelete({
      user: req.user.userId,
    });
    if (!deletedToken) {
      logger.error(
        `The token doesn't exists for the user with mail id : ${req.user.email} during signOut`
      );
      throw new CustomError.UnauthenticatedError("Token does not exists");
    }
  } catch (error) {
    logger.error(
      `The user with mail id : ${email} does not exists during signOut`
    );
    throw new CustomError.UnauthorizedError("Invalid User");
  }

  res.cookie("accessToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.cookie("refreshToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  logger.info(`The user: ${req.user.email} is logged out successfully`);
  res.status(StatusCodes.OK).json({ msg: "user logged out!" });
};

// **********************************forgotPassword Controller**********************************
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    logger.error(`Empty mail id sent during forgotPassword`);
    throw new CustomError.BadRequestError("Please provide valid email");
  }

  const user = await User.findOne({ email });

  if (user) {
    const passwordToken = crypto.randomBytes(70).toString("hex");
    // send email
    const origin = process.env.ORIGIN;
    await sendResetPasswordEmail({
      email: user.email,
      token: passwordToken,
      origin,
    });
    logger.info(
      `Reset password mail has been sent successfully to the user: ${user.email} during forgotPassword`
    );
    const passwordTokenExpirationDate = new Date(
      Date.now() + constants.TEN_MINUTES
    );

    user.passwordToken = createHash(passwordToken);
    user.passwordTokenExpirationDate = passwordTokenExpirationDate;
    await user.save();
  } else {
    logger.error(
      `The user with mail id: ${email} doesn't exists during forgotPassword`
    );
    throw new CustomError.UnauthenticatedError("Invalid User");
  }

  res
    .status(StatusCodes.OK)
    .json({ msg: "Please check your email for reset password link" });
  logger.info(
    `Reset password token has been stored successfully in the database for the user: ${user.email} during forgotPassword`
  );
};

// **********************************resetPassword Controller**********************************
const resetPassword = async (req, res) => {
  const { token, email, password } = req.body;
  if (!token || !email || !password) {
    logger.error(`Missing data during resetPassword`);
    throw new CustomError.BadRequestError("Please provide all values");
  }
  const user = await User.findOne({ email });

  if (user) {
    const currentDate = new Date();

    if (
      user.passwordToken === createHash(token) &&
      user.passwordTokenExpirationDate > currentDate
    ) {
      user.password = password;
      user.passwordToken = null;
      user.passwordTokenExpirationDate = null;
      await user.save();
    } else {
      logger.error(
        `The passwordtoken: ${user.passwordToken} for user with mail id: ${email} is expired`
      );
      throw new CustomError.UnauthenticatedError("Token expired");
    }
  } else {
    logger.error(
      `The user with mail id: ${email} doesn't exists during resetPassword`
    );
    throw new CustomError.UnauthenticatedError("Invalid User");
  }

  res.status(StatusCodes.OK).json({ msg: "password reset successfully!" });
  logger.info(`Password is reset successfully for the user: ${user.email}`);
};

// **********************************setBrandProfile Controller**********************************
const setBrandProfile = async (req, res) => {
  const { brandName, website } = req.body;
  const email = req.user.email;

  if (!brandName) {
    logger.error(`brandName is empty during setBrandProfile`);
    throw new CustomError.BadRequestError("Please provide valid brandName");
  }

  // check if the brandName already exists
  const name = await User.findOne({ brandName });
  if (name) {
    logger.error(
      `The BrandName: ${brandName} already exists during setBrandProfile`
    );
    throw new CustomError.BadRequestError("BrandName already exists");
  }

  const user = await User.findOneAndUpdate(
    { email },
    {
      brandName,
      website,
      isSignUpCompleted: true,
    }
  );

  if (!user) {
    logger.error(
      `The user with mail id: ${email} doesn't exists during setBrandProfile`
    );
    throw new CustomError.UnauthenticatedError("Invalid User");
  }

  logger.info(
    `Brand profile information successfully stored for: ${user.email}`
  );
  res.status(StatusCodes.OK).json({ signUpCompleted: user.isSignUpCompleted });
};

// module exports
module.exports = {
  signUp,
  signIn,
  signOut,
  verifyEmail,
  forgotPassword,
  resetPassword,
  setBrandProfile,
};
