const mongoose = require("mongoose");

const AssetSchema = new mongoose.Schema(
  {
    assetName: {
      type: String,
      required: [true, "Please provide asset name"],
    },
    brandName: {
      type: String,
      required: [true, "Please provide brand name"],
    },
    brandAssetFiles: {
      type: [String],
      required: [true, "Please provide brand asset files"],
    },
    thumbnail: {
      type: [String],
    },
    platform: {
      type: [String],
      required: [true, "Please provide platform"],
    },
    budget: {
      type: Number,
    },
    estimatedTime: {
      type: String,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      required: [true],
    },
    status: {
      type: String,
      enum: ["Under Review", "Pending payment", "Paid"],
      default: "Under Review",
    },
    feedback: [
      {
        sender: {
          type: String,
        },
        receiver: {
          type: String,
        },
        timestamp: {
          type: Date,
        },
        message: {
          type: String,
        },
      },
    ],
    digitalWearables: {
      decentraland: {
        type: String,
      },
      sandbox: {
        type: String,
      },
      zepeto: {
        type: String,
      },
      clonex: {
        type: String,
      },
      snapchat: {
        type: String,
      },
    },
  },
  { timestamps: true }
);

AssetSchema.index({ assetName: 1, brandName: 1 }, { unique: true });

module.exports = mongoose.model("asset", AssetSchema, "asset");
