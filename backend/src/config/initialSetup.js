"use strict";
// Importa el modelo de datos 'Role'
import Role from "../models/role.model.js";
import User from "../models/user.model.js";

/**
 * Crea los roles por defecto en la base de datos.
 * @async
 * @function createRoles
 * @returns {Promise<void>}
 */
async function createRoles() {
  try {
    // Busca todos los roles en la base de datos
    const count = await Role.estimatedDocumentCount();
    // Si no hay roles en la base de datos los crea
    if (count > 0) return;

    await Promise.all([
      new Role({ name: "empleado" }).save(),
      new Role({ name: "admin" }).save(),
      new Role({ name: "jefe" }).save(),
    ]);
    console.log("* => Roles creados exitosamente");
  } catch (error) {
    console.error(error);
  }
}

/**
 * Crea los usuarios por defecto en la base de datos.
 * @async
 * @function createUsers
 * @returns {Promise<void>}
 */
async function createUsers() {
  try {
    const count = await User.estimatedDocumentCount();
    if (count > 0) return;

    const admin = await Role.findOne({ name: "admin" });
    const empleado = await Role.findOne({ name: "empleado" });
    const jefe = await Role.findOne({ name: "jefe" });

    await Promise.all([
      new User({
        username: "empleado",
        email: "empleado@email.com",
        rut: "12345678-9",
        password: await User.encryptPassword("empleado123"),
        roles: empleado._id,
      }).save(),
      new User({
        username: "admin",
        email: "admin@email.com",
        rut: "12345678-0",
        password: await User.encryptPassword("admin123"),
        roles: admin._id,
      }).save(),
      new User({
        username: "jefe",
        email: "jefe@email.com",
        rut: "12345678-1",
        password: await User.encryptPassword("jefe123"),
        roles: jefe._id,
      }).save(),
    ]);
    console.log("* => Users creados exitosamente");
  } catch (error) {
    console.error(error);
  }
}

export { createRoles, createUsers };
