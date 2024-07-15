"use strict";
import User from "../models/user.model.js";
import Role from "../models/role.model.js";
import { handleErrorServer } from "../utils/resHandlers.js";

async function getUsers() {
  try {
    const users = await User.find()
      .select("-password")
      .populate("roles")
      .exec();
    if (!users) return [null, "No hay usuarios"];

    return [users, null];
  } catch (error) {
    handleErrorServer(error);
  }
}

async function createUser(user) {
  try {
    const { username, rut, email, password, roles } = user;

    const userFound = await User.findOne({ email: user.email });
    if (userFound) return [null, "El usuario ya existe"];

    const rolesFound = await Role.find({ name: { $in: roles } });
    if (rolesFound.length === 0) return [null, "El rol no existe"];
    const myRole = rolesFound.map((role) => role._id);

    const newUser = new User({
      username,
      rut,
      email,
      password: await User.encryptPassword(password),
      roles: myRole,
    });
    await newUser.save();

    return [newUser, null];
  } catch (error) {
    handleErrorServer(error);
  }
}

async function getUserById(id) {
  try {
    const user = await User.findById({ _id: id })
      .select("-password")
      .populate("roles")
      .exec();

    if (!user) return [null, "El usuario no existe"];

    return [user, null];
  } catch (error) {
    handleErrorServer(error);
  }
}

async function updateUser(id, user) {
  try {
    const userFound = await User.findById(id);
    if (!userFound) return [null, "El usuario no existe"];

    const { username, email, rut, password, newPassword, roles } = user;

    const matchPassword = await User.comparePassword(
      password,
      userFound.password,
    );

    if (!matchPassword) {
      return [null, "La contraseña no coincide"];
    }

    const rolesFound = await Role.find({ name: { $in: roles } });
    if (rolesFound.length === 0) return [null, "El rol no existe"];

    const myRole = rolesFound.map((role) => role._id);

    const userUpdated = await User.findByIdAndUpdate(
      id,
      {
        username,
        email,
        rut,
        password: await User.encryptPassword(newPassword || password),
        roles: myRole,
      },
      { new: true },
    );

    return [userUpdated, null];
  } catch (error) {
    handleErrorServer(error);
  }
}

async function deleteUser(id) {
  try {
    return await User.findByIdAndDelete(id);
  } catch (error) {
    handleErrorServer(error);
  }
}

export default {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
};