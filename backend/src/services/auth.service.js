"use strict";

import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { ACCESS_JWT_SECRET, REFRESH_JWT_SECRET } from "../config/configEnv.js";
import { handleErrorClient, handleErrorServer } from "../utils/resHandlers.js";

// Funcion para iniciar sesión de un usuario
export async function login(user) {
  try {
    const { email, password } = user;

    const userFound = await User.findOne({ email: email })
      .populate("roles")
      .exec();
    if (!userFound) {
      return [null, null, "El usuario y/o contraseña son incorrectos"];
    }

    const matchPassword = await User.comparePassword(
      password,
      userFound.password,
    );

    if (!matchPassword) {
      return [null, null, "El usuario y/o contraseña son incorrectos"];
    }

    const accessToken = jwt.sign(
      { 
        email: userFound.email, 
        roles: userFound.roles,
        id: userFound._id
      },
      ACCESS_JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    const refreshToken = jwt.sign(
      { 
        email: userFound.email,
        id: userFound._id
      },
      REFRESH_JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    return [accessToken, refreshToken, null];
  } catch (error) {
    handleErrorServer(error);
  }
}

// Funcion para refrescar el token de acceso
export async function refresh(cookies) {
  try {
    if (!cookies.jwt) return [null, "No hay autorización"];
    const refreshToken = cookies.jwt;

    const accessToken = await jwt.verify(
      refreshToken,
      REFRESH_JWT_SECRET,
      async (err, user) => {
        if (err) return [null, "La sesion a caducado, vuelva a iniciar sesion"];

        const userFound = await User.findOne({
          email: user.email,
        })
          .populate("roles")
          .exec();

        if (!userFound) return [null, "No usuario no autorizado"];

        const accessToken = jwt.sign(
          { 
            email: userFound.email, 
            roles: userFound.roles,
            id: userFound._id
          },
          ACCESS_JWT_SECRET,
          {
            expiresIn: "1d",
          },
        );

        return [accessToken, null];
      },
    );

    return accessToken;
  } catch (error) {
    handleErrorClient(error);
  }
}
