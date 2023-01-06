const createTokenUser = (user) => {
  return { email: user.email, userId: user._id };
};

module.exports = createTokenUser;
