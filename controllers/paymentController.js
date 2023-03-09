const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const logger = require("../utils/logger");

const createPaymentIntent = async (req, res) => {
  const paymentIntent = await stripe.paymentIntents.create({
    currency: "USD",
    amount: 2000000,
    automatic_payment_methods: { enabled: true },
  });

  logger.info(`Payment intent has been successfully created`);
  res.status(StatusCodes.OK).json({
    msg: `Payment intent has been created successfully`,
    // Send publishable key and PaymentIntent details to client
    clientSecret: paymentIntent.client_secret,
  });
};

const paymentConfig = async (req, res) => {
  logger.info(`Payment config has been retrieved`);
  res.status(StatusCodes.OK).json({
    msg: `Payment config has been fetched`,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
};

module.exports = {
  createPaymentIntent,
  paymentConfig,
};
