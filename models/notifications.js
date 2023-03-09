const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    brandName: {
      type: String,
      unique: true,
      required: [true, "Please provide brand name"],
    },
    notifications: { type: Array, default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "notifications",
  notificationSchema,
  "notifications"
);
