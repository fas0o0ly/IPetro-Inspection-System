// src/utils/response.js
const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data: data
  });
};

const errorResponse = (res, message = 'Error', statusCode = 400, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    error: message,
    ...(errors && { errors })
  });
};

module.exports = {
  successResponse,
  errorResponse
};