/* eslint-disable no-undef */
module.exports = {
  LOG_LEVEL: process.env.LOG_LEVEL || "debug",
  CONNECTION_STRING:
    process.env.CONNECTION_STRING ||
    "mongodb://localhost:27017/project_base_backend",
  PORT: process.env.PORT || "3000",
  JWT: {
    SECRET: process.env.JWT_SECRET || "",
    EXPIRE_TIME: !isNaN(parseInt(process.env.TOKEN_EXPIRE_TIME))
      ? parseInt(process.env.TOKEN_EXPIRE_TIME)
      : 24 * 60 * 60, // 86400
  },
  FILE_UPLOAD_PATH: process.env.FILE_UPLOAD_PATH,
  DEFAULT_LANG: process.env.DEFAULT_LANG || "EN",
};
