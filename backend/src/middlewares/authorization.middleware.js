"use strict";
// Autorizacion - Comprobar el rol del usuario
import User from "../models/user.model.js";
import Role from "../models/role.model.js";
import { respondError } from "../utils/resHandler.js";
import { handleError } from "../utils/errorHandler.js";

/**
 * Comprueba si el usuario es administrador
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función para continuar con la siguiente función
 */
async function isAdmin(req, res, next) {
  try {
    const user = await User.findOne({ email: req.email });
    const roles = await Role.find({ _id: { $in: user.roles } });
    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === "admin") {
        next();
        return;
      }
    }
    return respondError(
      req,
      res,
      401,
      "Se requiere un rol de administrador para realizar esta acción",
    );
  } catch (error) {
    handleError(error, "authorization.middleware -> isAdmin");
  }
}


async function isEmpleado(req, res, next) {
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
    return respondError(
      req,
      res,
      401,
      "Se requiere un rol de usuario para realizar esta acción",
    );
  }
  catch (error) {
    handleError(error, "authorization.middleware -> isEmpleado");
  }
}

async function isJefe(req, res, next) {
  try {
    const user = await User.findOne({ email: req.email });
    const roles = await Role.find({ _id: { $in: user.roles } });
    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === "jefe") {
        next();
        return;
      }
    }
    return respondError(
      req,
      res,
      401,
      "Se requiere un rol de jefe para realizar esta acción",
    );
  } catch (error) {
    handleError(error, "authorization.middleware -> isJefe");
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

    return res.status(401).json({
      message: "No tienes los permisos necesarios para realizar esta acción"
    });
  } catch (error) {
    return res.status(500).json({
      message: "authorization.middleware -> checkRole()"
    });
  }
}

function authorizeRoles(roles) {
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

export { isAdmin, isEmpleado, isJefe,authorizeRoles};
