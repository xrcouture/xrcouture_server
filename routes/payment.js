const express = require("express");
const router = express.Router();
const {
  createPaymentIntent,
  paymentConfig,
} = require("../controllers/paymentController");

router.get("/config", paymentConfig);
router.post("/create-payment-intent", createPaymentIntent);

module.exports = router;
