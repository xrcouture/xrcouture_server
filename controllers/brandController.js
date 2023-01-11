const logger = require("../utils/logger");

// **********************************upload2dAssets Controller**********************************
const upload2dAssets = (req, res, next) => {
  const fileNames = req.files.map((file) => {
    return file.originalname;
  });
  logger.info(`Successfully uploaded  ${fileNames} to amazon s3 bucket`);
  res.send("Successfully uploaded " + req.files.length + " files");
};

module.exports = upload2dAssets;
