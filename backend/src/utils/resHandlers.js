"use strict";

export function handleSuccess(res, statusCode, message, data={}) {
  return res.status(statusCode)
    .json({
      status: "success",
      message,
      data
    });
}

export function handleErrorClient(res, statusCode, message, details={}) {
  return res.status(statusCode)
    .json({
      status: "Error client",
      message,
      details
    });
}

export function handleErrorServer(res, statusCode, message, data={}) {
  return res.status(statusCode)
    .json({
      status: "Error server",
      message,
      data
    });
}
