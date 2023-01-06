const jwt = require("jsonwebtoken");
const constants = require("../utils/constants");

const createJWT = ({ payload }) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET);
  return token;
};

const isTokenValid = (token) => jwt.verify(token, process.env.JWT_SECRET);

const attachCookiesToResponse = ({ res, user, refreshToken }) => {
  const accessTokenJWT = createJWT({ payload: { user } });
  const refreshTokenJWT = createJWT({ payload: { user, refreshToken } });

  res.cookie("accessToken", accessTokenJWT, {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    signed: true,
    expires: new Date(Date.now() + constants.ONE_HOUR),
  });

  res.cookie("refreshToken", refreshTokenJWT, {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    signed: true,
    expires: new Date(Date.now() + constants.THIRTY_DAYS),
  });
};

module.exports = {
  createJWT,
  isTokenValid,
  attachCookiesToResponse,
};
