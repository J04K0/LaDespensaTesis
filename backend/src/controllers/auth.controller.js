"use strict";

import { login as authLogin, refresh as authRefresh } from "../services/auth.service.js";
import { authLoginBodySchema } from "../schema/auth.schema.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../utils/resHandlers.js";	

// Funcion para manejar el login de un usuario
export async function login(req, res) {
  try {
    const { body } = req;
    const { error: bodyError } = authLoginBodySchema.validate(body);
    if (bodyError) return handleErrorClient(res, 400, bodyError.message);

    const [accessToken, refreshToken, errorToken] = await authLogin(body);

    if (errorToken) return handleErrorClient(res, 400, errorToken);

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    handleSuccess(res, 200, "Usuario logueado correctamente", { accessToken });
  } catch (error) {
    handleErrorServer(res, 500, "Error al loguear al usuario", error.message);
  }
}

// Funcion para manejar el logout de un usuario
export async function logout(req, res) {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt) return handleErrorClient(res, 400, "No hay token");

    res.clearCookie("jwt", { httpOnly: true });
    handleSuccess(res, 200, "Sesión cerrada correctamente");
  } catch (error) {
    handleErrorServer(res, 500, "Error al cerrar la sesión", error.message);
  }
}

// Funcion para refrescar el token de acceso
export async function refresh(req, res) {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt) return handleErrorClient(res, 400, "No hay token");

    const [accessToken, errorToken] = await authRefresh(cookies);

    if (errorToken) return handleErrorClient(res, 400, errorToken);

    handleSuccess(res, 200, "Token refrescado correctamente", { accessToken });
  } catch (error) {
    handleErrorServer(res, 500, "Error al refrescar el token", error.message);
  }
}
