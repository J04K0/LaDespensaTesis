"use strict";

// Funcion para manejar respuestas exitosas y errores en las rutas de Express
export function handleSuccess(res, statusCode, message, data={}) {
  return res.status(statusCode)
    .json({
      status: "success",
      message,
      data
    });
}

// Funcion para manejar errores del cliente
export function handleErrorClient(res, statusCode, message, details={}) {
  return res.status(statusCode)
    .json({
      status: "Error client",
      message,
      details
    });
}

// Funcion para manejar errores del servidor
export function handleErrorServer(res, statusCode, message, data={}) {
  return res.status(statusCode)
    .json({
      status: "Error server",
      message,
      data
    });
}
