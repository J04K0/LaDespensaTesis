"use strict";

import jwt from "jsonwebtoken";
import { ACCESS_JWT_SECRET } from "../config/configEnv.js";
import { handleErrorClient, handleErrorServer } from "../utils/resHandlers.js";

// Middleware para verificar el JWT
const verifyJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return handleErrorClient(res, 401, "No autorizado", "No hay token valido");
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, ACCESS_JWT_SECRET, (err, decoded) => {
      if (err) return handleErrorClient(res, 403, "No autorizado", err.message);
      req.email = decoded.email;
      req.roles = decoded.roles;
      req.userId = decoded.id; // Guardar el ID del usuario
      next();
    });
  } catch (error) {
    handleErrorServer(res, 500, "Error al verificar el token", error.message);
  }
};

export default verifyJWT;