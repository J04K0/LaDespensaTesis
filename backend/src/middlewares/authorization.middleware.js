"use strict";
// Autorizacion - Comprobar el rol del usuario
import User from "../models/user.model.js";
import Role from "../models/role.model.js";
import { handleErrorClient, handleErrorServer } from "../utils/resHandlers.js";

export async function isAdmin(req, res, next) {
  try {
    const user = await User.findOne({ email: req.email });
    const roles = await Role.find({ _id: { $in: user.roles } });
    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === "admin") {
        next();
        return;
      }
    }
    return handleErrorClient(
      res,
      401,
      "Se requiere un rol de administrador para realizar esta acción",
    );
  } catch (error) {
    handleErrorServer(res, 500, "Error al comprobar el rol de usuario");
  }
}


export async function isEmpleado(req, res, next) {
  try {
    const user = await User.findOne({ email:
    req.email });
    const roles = await Role.find({ _id: { $in: user.roles } });
    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === "empleado") {
        next();
        return;
      }
    }
    return handleErrorClient(
      res,
      401,
      "Se requiere un rol de usuario para realizar esta acción",
    );
  }
  catch (error) {
    handleErrorServer(res, 500, "Error al comprobar el rol de usuario");
  }
}

export async function isJefe(req, res, next) {
  try {
    const user = await User.findOne({ email: req.email });
    const roles = await Role.find({ _id: { $in: user.roles } });
    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === "jefe") {
        next();
        return;
      }
    }
    return handleErrorClient(
      res,
      401,
      "Se requiere un rol de jefe para realizar esta acción",
    );
  } catch (error) {
    handleErrorServer(res, 500, "Error al comprobar el rol de usuario");
  }
}

async function checkRole(req, res, rolesToCheck, next) {
  try {
    const user = await User.findOne({ email: req.email });
    const roles = await Role.find({ _id: { $in: user.roles } });

    const hasRole = roles.some(role => rolesToCheck.includes(role.name));

    if (hasRole) {
      return next();
    }

    return handleErrorClient(res, 401, "No tienes los permisos necesarios para realizar esta acción");
  } catch (error) {
    return handleErrorServer(res, 500, "Error al comprobar el rol de usuario");
  }
}

export function authorizeRoles(roles) {
  return (req, res, next) => {
    const rolesToCheck = roles.map(roleFn => {
      if (roleFn === isAdmin) return "admin";
      if (roleFn === isEmpleado) return "empleado";
      if (roleFn === isJefe) return "jefe";
      return null;
    }).filter(Boolean);

    checkRole(req, res, rolesToCheck, next);
  };
}
