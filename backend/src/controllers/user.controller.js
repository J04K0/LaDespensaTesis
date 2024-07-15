"use strict";

import { handleSuccess, handleErrorClient, handleErrorServer } from "../utils/resHandlers.js";
import UserService from "../services/user.service.js";
import { userBodySchema, userIdSchema } from "../schema/user.schema.js";

export async function getUsers(req, res) {
  try {
    const [usuarios, errorUsuarios] = await UserService.getUsers();
    if (errorUsuarios) return handleErrorClient(res, 404, errorUsuarios);

    usuarios.length === 0
      ? handleSuccess(res, 204, "No hay usuarios registrados")
      : handleSuccess(res, 200, "Usuarios encontrados", usuarios);
  } catch (error) {
    handleErrorServer(res, 500, "Error al traer los usuarios", error.message);
  }
}

export async function createUser(req, res) {
  try {
    const { body } = req;

    const { error: bodyError } = userBodySchema.validate(body);

    if (bodyError) return handleErrorClient(res, 400, bodyError.message);

    const [newUser, userError] = await UserService.createUser(body);

    if (userError) return handleErrorClient(res, 400, userError);

    if (!newUser) {
      return handleErrorClient(res, 400, "No se pudo crear el usuario");
    }

    handleSuccess(res, 201, "Usuario creado");
  } catch (error) {
    handleErrorServer(res, 500, "Error al crear un usuario", error.message);
  }
}

export async function getUserById(req, res) {
  try {
    const { params } = req;
    const { error: paramsError } = userIdSchema.validate(params);
    if (paramsError) return handleErrorClient(res, 400, paramsError.message);

    const [user, errorUser] = await UserService.getUserById(params.id);

    if (errorUser) return handleErrorClient(res, 404, errorUser);

    handleSuccess(res, 200, "Usuario encontrado", user);
  } catch (error) {
    handleSuccess(res, 500, "Error al traer un usuario", error.message);
  }
}

export async function updateUser(req, res) {
  try {
    const { params, body } = req;

    const { error: paramsError } = userIdSchema.validate(params);

    if (paramsError) return handleErrorClient(res, 400, paramsError.message);

    const { error: bodyError } = userBodySchema.validate(body);

    if (bodyError) return handleErrorClient(res, 400, bodyError.message);

    const [user, userError] = await UserService.updateUser(params.id, body);

    if (userError) return handleErrorClient(res, 404, userError);

    handleSuccess(res, 200, "Usuario actualizado", user);
  } catch (error) {
    handleErrorServer(res, 500, "Error al actualizar un usuario", error.message);
  }
}

export async function deleteUser(req, res) {
  try {
    const { params } = req;

    const { error: paramsError } = userIdSchema.validate(params);

    if (paramsError) return handleErrorClient(res, 400, paramsError.message);

    const user = await UserService.deleteUser(params.id);
    !user
      ? handleErrorClient(res, 404, "No se encontro el usuario solicitado")
      : handleSuccess(res, 200, "Usuario eliminado");
  } catch (error) {
    handleErrorServer(res, 500, "Error al eliminar un usuario", error.message);
  }
}
