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
    description: {
      type: String,
    },
    brandAssetFiles: {
      type: [String],
    },
    thumbnail: {
      type: [String],
    },
    platform: {
      type: [String],
    },
    actualPrice: {
      type: Number,
    },
    actualTime: {
      type: Number,
    },
    approximatePrice: {
      type: Number,
    },
    approximateTime: {
      type: Number,
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
      enum: [
        "Draft",
        "Under Review",
        "Action Required",
        "Pending payment",
        "In Progress",
        "Completed",
      ],
      default: "Under Review",
    },
    draftPage: {
      type: Number,
      max: 3,
    },
    feedback: { type: Array, default: [] },
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
