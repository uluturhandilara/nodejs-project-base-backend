const Enum = require("../config/Enum");
const CustomError = require("./Error");

class Response {
  constructor() {}

  static successResponse(code = 200, data) {
    return {
      code,
      data,
    };
  }

  static errorResponse(error) {
    console.log(error);
    if (error instanceof CustomError) {
      return {
        code: error.code,
        error: {
          message: error.message,
          description: error.description,
        },
      };
    }

    return {
      code: Enum.HTTP_CODES.INT_SERVER_ERROR,
      error: {
        message: "Unknown error!",
        description: error.message,
      },
    };
  }
}

module.exports = Response;
