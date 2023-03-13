const CustomError = require("../errors");
const { isTokenValid } = require("../utils");
const Token = require("../models/token");
const { attachCookiesToResponse } = require("../utils");
const logger = require("../utils/logger");

// **********************************authenticateUser Middleware**********************************
const authenticateUser = async (req, res, next) => {
  const { refreshToken, accessToken } = req.signedCookies;

  try {
    if (accessToken) {
      const payload = isTokenValid(accessToken);
      req.user = payload.user;
      return next();
    }
    const payload = isTokenValid(refreshToken);
    const existingToken = await Token.findOne({
      user: payload.user.userId,
      refreshToken: payload.refreshToken,
    });

    if (!existingToken) {
      logger.error(`No Token exists during authenticate User middleware`);
      throw new CustomError.UnauthenticatedError("Authentication Invalid");
    }

    attachCookiesToResponse({
      res,
      user: payload.user,
      refreshToken: existingToken.refreshToken,
    });
    logger.info(`Access Tokens and Rehresh tokens are attached to cookies during authenticate User middleware`);

    req.user = payload.user;
    next();
  } catch (error) {
    logger.error(
      `Authentication Invalid during authenticate user middleware`
    );
    throw new CustomError.UnauthenticatedError("Authentication Invalid");
  }
};

// **********************************authorizePermissions Middleware**********************************
const authorizePermissions = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logger.error(`The user: ${req.user.email} with role ${req.user.role} is not authorized`);
      throw new CustomError.UnauthorizedError(
        "Unauthorized to access this route"
      );
    }
    next();
  };
};

module.exports = {
  authenticateUser,
  authorizePermissions,
};
